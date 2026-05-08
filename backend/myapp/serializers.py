import html
import json
from rest_framework import serializers
from django.db import models, transaction
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from .models import (
    CustomUser, UserProfile , VendorProfile, Product, ProductVariant, ProductVariantImage, ProductImage, Order, OrderItem,
    Category, Cart, CartItem, CategoryRequest, Offer , Wishlist , Address,
    ProductReview, PlatformReview , Banner , HeroBanner, SubscriptionPlan, VendorSubscription,
    IconAsset
)
User = get_user_model()
# ---------------- BASE SANITIZER (The Armor) ----------------
class SanitizedSerializer(serializers.ModelSerializer):
    """
    Base class to automatically trim whitespace and escape HTML 
    from all string fields to prevent XSS attacks.
    """
    def to_internal_value(self, data):
        internal_value = super().to_internal_value(data)
        for key, value in internal_value.items():
            if isinstance(value, str):
                # Strip leading/trailing spaces and escape HTML tags
                internal_value[key] = html.escape(value.strip())
        return internal_value

# ---------------- USER ----------------
class CustomUserSerializer(SanitizedSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'name', 'email', 'role']

# 1. Address Serializer
class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'street', 'city', 'state', 'pincode', 'is_default']

# 2. Profile Serializer (Now ONLY contains 'phone')
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['phone']

# 3. Main User Serializer
class UserSerializer(serializers.ModelSerializer):
    # required=False prevents errors if the user doesn't have a profile yet
    profile = UserProfileSerializer(required=False) 
    addresses = AddressSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'role', 'profile', 'addresses'] 
        read_only_fields = ['email', 'role'] # Protect core login credentials

    def update(self, instance, validated_data):
        # 1. Extract profile data safely
        profile_data = validated_data.pop('profile', {})

        # 2. Update CustomUser fields
        instance.name = validated_data.get('name', instance.name)
        instance.save()

        # 3. Safely get or create the profile to prevent RelatedObjectDoesNotExist crashes
        profile, created = UserProfile.objects.get_or_create(user=instance)

        # 4. Update Profile fields
        if 'phone' in profile_data:
            profile.phone = profile_data['phone']
        
        profile.save()

        return instance

# ---------------- REGISTER ----------------
class RegisterSerializer(SanitizedSerializer):
    password = serializers.CharField(write_only=True)
    shop_name = serializers.CharField(write_only=True, required=False)
    contact_details = serializers.CharField(write_only=True, required=False)
    logo = serializers.ImageField(required=False)
    address = serializers.CharField(required=False)
    phone = serializers.CharField(required=False)

    class Meta:
        model = CustomUser
        fields = [
            'name',
            'email',
            'password',
            'role',
            'shop_name',
            'contact_details',
            'logo',
            'address',
            'phone',
        ]

    def validate(self, data):
        if data.get('role') == 'vendor':
            if not data.get('shop_name') or not data.get('contact_details'):
                raise serializers.ValidationError(
                    "Vendor must provide shop_name and contact_details."
                )
        return data
    
    def validate_phone(self, value):
        if value and (not value.isdigit() or len(value) != 10):
            raise serializers.ValidationError("Mobile number must be 10 digits.")
        return value

    def validate_email(self, value):
        # Email is already stripped by the base class, but we'll lowercase it here
        return value.lower()

    def create(self, validated_data):
        role = validated_data.get('role', 'buyer')

        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password'],
            role=role,
            username=validated_data['email']
        )

        # --- FIX APPLIED: Save phone number to UserProfile upon registration ---
        phone_number = validated_data.get('phone', '')
        UserProfile.objects.create(user=user, phone=phone_number)

        if role == 'vendor':
            VendorProfile.objects.create(
                user=user,
                shop_name=validated_data.get('shop_name'),
                contact_details=validated_data.get('contact_details'),
                logo=validated_data.get('logo'),
                address=validated_data.get('address'),
                phone=validated_data.get('phone'),
                is_approved=False
            )

        return user


# ---------------- VENDOR ----------------
class VendorProfileSerializer(SanitizedSerializer):
    initials = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    name = serializers.CharField(source='shop_name')

    class Meta:
        model = VendorProfile
        fields = ['id', 'name', 'tagline', 'city', 'logo', 'initials', 'average_rating']

    def get_initials(self, obj):
        if not obj.shop_name: return "VN"
        parts = obj.shop_name.split()
        if len(parts) >= 2:
            return (parts[0][0] + parts[1][0]).upper()
        return obj.shop_name[:2].upper()

    def get_average_rating(self, obj):
        avg = obj.vendor_reviews.aggregate(models.Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0.0


# ---------------- PRODUCT ----------------
class ProductVariantImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = ProductVariantImage
        fields = ['id', 'image']


class ProductVariantSerializer(serializers.ModelSerializer):
    images = ProductVariantImageSerializer(many=True, read_only=True)
    option_values = serializers.JSONField()

    class Meta:
        model = ProductVariant
        fields = ['id', 'sku', 'image', 'images', 'price', 'stock_quantity', 'option_values']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image']


class ProductSerializer(SanitizedSerializer):
    vendor_shop = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    product_images = ProductImageSerializer(many=True, read_only=True)
    variants_input = ProductVariantSerializer(many=True, write_only=True, required=False)
    extra_images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Product
        fields = [
            'id',
            'vendor',
            'vendor_shop',
            'name',
            'price',
            'stock_quantity',
            'image',
            'description',
            'status',
            'category',
            'category_name',
            'created_at',
            'average_rating',
            'review_count',
            'is_active',
            'variants',
            'product_images',
            'variants_input',
            'extra_images',
        ]
        # Keep workflow-managed flags server-controlled; multipart/form-data can coerce missing booleans to False.
        read_only_fields = ['vendor', 'status', 'is_active']

    def to_internal_value(self, data):
        mutable_data = dict(data) if not isinstance(data, dict) else data.copy()
        variants_raw = mutable_data.get('variants_input')
        parsed_variants = None
        print(f"[SERIALIZER] variants_input raw type={type(variants_raw)}, value={variants_raw!r}")
        if isinstance(variants_raw, str):
            try:
                parsed_variants = json.loads(variants_raw)
                print(f"[SERIALIZER] parsed variants_input count={len(parsed_variants) if isinstance(parsed_variants, list) else 'NOT_LIST'}")
                mutable_data['variants_input'] = parsed_variants
            except json.JSONDecodeError as exc:
                print(f"[SERIALIZER] JSON parse FAILED: {exc}")
                raise serializers.ValidationError({"variants_input": "Invalid JSON format."}) from exc
        internal = super().to_internal_value(mutable_data)
        # FIX: super().to_internal_value() silently drops write_only nested list fields.
        # Inject the pre-parsed data back if they got stripped.
        if parsed_variants is not None and 'variants_input' not in internal:
            print(f"[SERIALIZER] RE-INJECTING variants_input into internal value (count={len(parsed_variants)})")
            internal['variants_input'] = parsed_variants
        # extra_images is also write_only; preserve from FILES via initial_data if missing
        if 'extra_images' not in internal and hasattr(self, 'initial_data'):
            files_raw = self.initial_data.get('extra_images')
            if not files_raw:
                request = self.context.get('request')
                if request is not None:
                    files_raw = request.FILES.getlist('extra_images')
            if files_raw:
                print(f"[SERIALIZER] RE-INJECTING extra_images into internal value (count={len(files_raw)})")
                internal['extra_images'] = files_raw
        print(f"[SERIALIZER] to_internal_value returned keys={list(internal.keys())}")
        print(f"[SERIALIZER] variants_input in internal={('variants_input' in internal)}, type={type(internal.get('variants_input'))}")
        if 'variants_input' in internal:
            print(f"[SERIALIZER] variants_input count in internal={len(internal['variants_input']) if isinstance(internal['variants_input'], list) else 'NOT_LIST'}")
        return internal

    def get_vendor_shop(self, obj):
        return obj.vendor.shop_name

    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(models.Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0.0

    def get_review_count(self, obj):
        return obj.reviews.count()

    @transaction.atomic
    def create(self, validated_data):
        variants_data = validated_data.pop('variants_input', [])
        extra_images_data = validated_data.pop('extra_images', [])
        print(f"[SERIALIZER CREATE] variants_data count={len(variants_data)}, content={variants_data!r}")
        print(f"[SERIALIZER CREATE] extra_images count={len(extra_images_data)}")

        product = super().create(validated_data)
        print(f"[SERIALIZER CREATE] product id={product.id} created")

        created_variants = []
        for idx, variant_data in enumerate(variants_data):
            print(f"[SERIALIZER CREATE] creating variant #{idx}: {variant_data!r}")
            try:
                variant = ProductVariant.objects.create(product=product, **variant_data)
                print(f"[SERIALIZER CREATE] variant #{idx} created id={variant.id}")
                created_variants.append(variant)
            except Exception as e:
                print(f"[SERIALIZER CREATE] variant #{idx} FAILED: {e}")
                raise

        for image in extra_images_data:
            ProductImage.objects.create(product=product, image=image)

        print(f"[SERIALIZER CREATE] done. total variants={len(created_variants)}")
        return product
    
# ---------------- REVIEWS ----------------
class ProductReviewSerializer(SanitizedSerializer):
    reviewer_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = ProductReview
        fields = ['id', 'user', 'reviewer_name', 'product', 'vendor', 'order_item', 'rating', 'review_text', 'created_at']
        read_only_fields = ['user', 'product', 'vendor', 'created_at']

class PlatformReviewSerializer(SanitizedSerializer):
    reviewer_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = PlatformReview
        fields = ['id', 'user', 'reviewer_name', 'rating', 'feedback_text', 'is_featured', 'created_at']
        read_only_fields = ['user', 'is_featured', 'created_at']

# ---------------- ORDER ----------------
class OrderItemSerializer(SanitizedSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    variant_details = ProductVariantSerializer(source='product_variant', read_only=True)
    vendor_shop = serializers.CharField(source='vendor.shop_name', read_only=True)
    
    # Extra fields for the Vendor view
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    buyer_name = serializers.CharField(source='order.user.name', read_only=True)
    address = serializers.CharField(source='order.address', read_only=True)
    phone = serializers.CharField(source='order.phone', read_only=True)
    order_date = serializers.DateTimeField(source='order.created_at', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'order_id', 'buyer_name', 'address', 'phone', 'order_date',
            'product', 'product_variant', 'product_details', 'variant_details',
            'vendor', 'vendor_shop',
            'quantity', 'price', 'variant_options_snapshot', 'status',
            'confirmed_at', 'shipped_at', 'delivered_at',
        ]

class OrderSerializer(SanitizedSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    buyer_name = serializers.CharField(source='user.name', read_only=True)
    buyer_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'buyer_name', 'buyer_email', 'items',
            'total_price', 'address', 'phone', 'payment_status',
            'razorpay_order_id', 'razorpay_payment_id', 'created_at',
        ]


# ---------------- VENDOR ORDER UPDATE ----------------
class VendorOrderUpdateSerializer(SanitizedSerializer):
    class Meta:
        model = OrderItem
        fields = ['status']

    def validate_status(self, value):
        valid_statuses = ['pending', 'confirmed', 'shipped', 'delivered']
        if value not in valid_statuses:
            raise serializers.ValidationError("Invalid status")
        return value


class CategorySerializer(SanitizedSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'icon_type', 'parent']


class IconAssetSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = IconAsset
        fields = ['id', 'name', 'icon_type', 'file', 'file_url', 'uploaded_by', 'created_at']
        read_only_fields = ['uploaded_by', 'created_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None


class CartItemSerializer(SanitizedSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    variant_details = ProductVariantSerializer(source='product_variant', read_only=True)

    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_variant', 'product_details', 'variant_details', 'quantity',
        ]


class CartSerializer(SanitizedSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'items']


class CategoryRequestSerializer(SanitizedSerializer):
    vendor_shop = serializers.CharField(
        source='requested_by.shop_name', read_only=True
    )

    class Meta:
        model = CategoryRequest
        fields = [
            'id', 'name', 'icon', 'icon_type', 'requested_by',
            'vendor_shop', 'status', 'created_at'
        ]
        read_only_fields = ['requested_by', 'status', 'created_at']


class OfferSerializer(SanitizedSerializer):
    vendor_shop = serializers.SerializerMethodField()

    class Meta:
        model = Offer
        fields = [
            'id', 'title', 'image', 'start_date', 'end_date',
            'requested_by', 'vendor_shop', 'status', 'created_at'
        ]
        read_only_fields = ['requested_by', 'status', 'created_at']

    def get_vendor_shop(self, obj):
        if obj.requested_by:
            return obj.requested_by.shop_name
        return 'Admin'

class WishlistSerializer(SanitizedSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = Wishlist
        fields = ['id', 'product', 'created_at']

# ---------------- BANNER ----------------
class BannerSerializer(SanitizedSerializer):
    class Meta:
        model = Banner
        fields = ['id', 'title', 'image', 'is_active']

class HeroBannerSerializer(SanitizedSerializer):
    class Meta:
        model = HeroBanner
        fields = ['id', 'title', 'image', 'is_active', 'updated_at']

# ---------------- SUBSCRIPTIONS ----------------
class SubscriptionPlanSerializer(SanitizedSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class VendorSubscriptionSerializer(SanitizedSerializer):
    plan_details = SubscriptionPlanSerializer(source='plan', read_only=True)

    class Meta:
        model = VendorSubscription
        fields = ['id', 'plan', 'plan_details', 'start_date', 'end_date', 'is_active']