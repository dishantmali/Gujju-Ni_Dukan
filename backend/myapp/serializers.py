import html
import json
from rest_framework import serializers
from django.db import models, transaction
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from .models import (
    CustomUser, UserProfile , VendorProfile, Product, ProductVariant, ProductVariantImage, ProductImage, Order, OrderItem,
    Category, GSTCategory, Cart, CartItem, CategoryRequest, Offer , Wishlist , Address,
    ProductReview, PlatformReview , Banner , HeroBanner, SubscriptionPlan, VendorSubscription,
    IconAsset, ManualReview, Coupon, CouponUsage, News, PlatformConfiguration,
    _lookup_gst_percentage_for_category
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
    address_line_1 = serializers.CharField(required=False)
    address_line_2 = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False)
    state = serializers.CharField(required=False)
    pincode = serializers.CharField(required=False)
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
            'address_line_1',
            'address_line_2',
            'city',
            'state',
            'pincode',
            'phone',
        ]

    def validate(self, data):
        if data.get('role') == 'vendor':
            if not data.get('shop_name') or not data.get('contact_details'):
                raise serializers.ValidationError(
                    "Vendor must provide shop_name and contact_details."
                )
            
            # Check for existing shop name (case-insensitive)
            shop_name = data.get('shop_name').strip()
            if VendorProfile.objects.filter(shop_name__iexact=shop_name).exists():
                raise serializers.ValidationError(
                    {"shop_name": "This shop name is already taken. Please choose another one."}
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
                address_line_1=validated_data.get('address_line_1'),
                address_line_2=validated_data.get('address_line_2'),
                city=validated_data.get('city'),
                state=validated_data.get('state'),
                pincode=validated_data.get('pincode'),
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
        fields = ['id', 'name', 'tagline', 'city', 'logo', 'initials', 'average_rating', 'is_approved']

    def get_initials(self, obj):
        if not obj.shop_name: return "VN"
        parts = obj.shop_name.split()
        if len(parts) >= 2:
            return (parts[0][0] + parts[1][0]).upper()
        return obj.shop_name[:2].upper()

    def get_average_rating(self, obj):
        avg = obj.vendor_reviews.aggregate(models.Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0.0

class VendorProfileUpdateSerializer(SanitizedSerializer):
    class Meta:
        model = VendorProfile
        fields = ['shop_name', 'logo', 'city', 'state', 'pincode', 'address_line_1', 'address_line_2', 'phone', 'is_approved', 'is_active']
        read_only_fields = ['is_approved', 'is_active']
        
    def validate_shop_name(self, value):
        # Check if another vendor already uses this shop_name
        shop_name = value.strip()
        vendor_id = self.instance.id if self.instance else None
        
        if VendorProfile.objects.filter(shop_name__iexact=shop_name).exclude(id=vendor_id).exists():
            raise serializers.ValidationError("This shop name is already taken. Please choose another one.")
        return value


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
        fields = ['id', 'sku', 'image', 'images', 'price', 'stock_quantity', 'option_values', 'base_price', 'gst_percentage', 'gst_amount', 'final_price']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['originalPrice'] = ret['price']
        ret['price'] = str(instance.discounted_price)
        ret['discount'] = instance.product.current_discount
        return ret


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
            'is_new',
            'variants',
            'product_images',
            'variants_input',
            'extra_images',
            'base_price',
            'gst_percentage',
            'gst_amount',
            'final_price',
        ]
        # Keep workflow-managed flags server-controlled; multipart/form-data can coerce missing booleans to False.
        read_only_fields = ['vendor', 'status', 'is_active', 'is_new', 'base_price', 'gst_percentage', 'gst_amount', 'final_price']

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

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['originalPrice'] = ret['price']
        ret['price'] = str(instance.discounted_price)
        ret['discount'] = instance.current_discount
        return ret

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

    @transaction.atomic
    def update(self, instance, validated_data):
        variants_data = validated_data.pop('variants_input', None)
        extra_images_data = validated_data.pop('extra_images', [])
        request = self.context.get('request')

        # Update basic product fields
        instance = super().update(instance, validated_data)

        # Handle variants if provided
        if variants_data is not None:
            # Get existing variant IDs
            existing_variants = {v.id: v for v in instance.variants.all()}
            provided_variant_ids = set()

            for idx, variant_data in enumerate(variants_data):
                variant_id = variant_data.get('id')
                if variant_id and variant_id in existing_variants:
                    # Update existing variant
                    variant = existing_variants[variant_id]
                    for attr, value in variant_data.items():
                        if attr not in ('id', 'images'):
                            setattr(variant, attr, value)
                    variant.save()
                    provided_variant_ids.add(variant_id)
                else:
                    # Create new variant
                    # Pop 'id' if it's None or empty string to let DB generate it
                    variant_data.pop('id', None)
                    variant_data.pop('images', None) # Don't try to save nested images here
                    variant = ProductVariant.objects.create(product=instance, **variant_data)

                # Handle NEW images for this specific variant (via idx)
                if request and request.FILES:
                    image_idx = 0
                    while True:
                        img = request.FILES.get(f'variant_image_{idx}_{image_idx}')
                        if not img:
                            break
                        ProductVariantImage.objects.create(variant=variant, image=img)
                        image_idx += 1

            # Handle variant image DELETIONS
            delete_image_ids_raw = request.data.get('delete_variant_image_ids') if request else None
            if delete_image_ids_raw:
                try:
                    import json
                    delete_ids = json.loads(delete_image_ids_raw)
                    ProductVariantImage.objects.filter(id__in=delete_ids).delete()
                except (json.JSONDecodeError, TypeError):
                    pass

            # Handle product gallery image DELETIONS
            delete_product_image_ids_raw = request.data.get('delete_product_image_ids') if request else None
            if delete_product_image_ids_raw:
                try:
                    import json
                    delete_pids = json.loads(delete_product_image_ids_raw)
                    ProductImage.objects.filter(id__in=delete_pids).delete()
                except (json.JSONDecodeError, TypeError):
                    pass

            # Sync variants (remove those not in provided_variant_ids)
            for vid, vobj in existing_variants.items():
                if vid not in provided_variant_ids:
                    vobj.delete()

        # Handle extra images
        for image in extra_images_data:
            ProductImage.objects.create(product=instance, image=image)

        return instance
    
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

class AdminPlatformReviewSerializer(SanitizedSerializer):
    reviewer_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = PlatformReview
        fields = ['id', 'user', 'reviewer_name', 'rating', 'feedback_text', 'is_featured', 'created_at']
        read_only_fields = ['user', 'created_at']


# ---------------- ORDER ----------------
class OrderItemSerializer(SanitizedSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    variant_details = ProductVariantSerializer(source='product_variant', read_only=True)
    vendor_shop = serializers.CharField(source='vendor.shop_name', read_only=True)
    vendor_state = serializers.CharField(source='vendor.state', read_only=True)
    
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
            'vendor', 'vendor_shop', 'vendor_state',
            'quantity', 'price', 'variant_options_snapshot', 'status',
            'confirmed_at', 'shipped_at', 'delivered_at',
            'gst_rate', 'gst_amount', 'cgst_amount', 'sgst_amount', 'igst_amount',
        ]


class OrderSerializer(SanitizedSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    buyer_name = serializers.CharField(source='user.name', read_only=True)
    buyer_email = serializers.CharField(source='user.email', read_only=True)
    coupon_code = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'buyer_name', 'buyer_email', 'items',
            'total_price', 'coupon', 'coupon_code', 'discount_amount',
            'address', 'phone', 'payment_status',
            'razorpay_order_id', 'razorpay_payment_id', 'created_at',
            'platform_fee', 'platform_fee_gst', 'product_gst',
            'shipping_charge', 'shipping_charge_gst', 'cgst', 'sgst', 'igst',
        ]


    def get_coupon_code(self, obj):
        return obj.coupon.code if obj.coupon else None


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
    gst_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'icon_type', 'parent', 'gst_percentage']

    def get_gst_percentage(self, obj):
        return _lookup_gst_percentage_for_category(obj)



class GSTCategorySerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        write_only=True,
        many=True,
        source='categories',
        required=False
    )

    class Meta:
        model = GSTCategory
        fields = ['id', 'name', 'gst_percentage', 'categories', 'category_ids', 'created_at', 'updated_at']



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
            'requested_by', 'vendor_shop', 'status', 'created_at',
            'discount_percent', 'products'
        ]
        read_only_fields = ['requested_by', 'status', 'created_at']

    def get_vendor_shop(self, obj):
        if obj.requested_by:
            return obj.requested_by.shop_name
        return 'Admin'

    def validate_products(self, value):
        request = self.context.get('request')
        if request and hasattr(request.user, 'vendor_profile'):
            vendor = request.user.vendor_profile
            for product in value:
                if getattr(product, 'vendor', None) != vendor:
                    raise serializers.ValidationError(f"Product {product.id} does not belong to you.")
        return value

class WishlistSerializer(SanitizedSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = Wishlist
        fields = ['id', 'product', 'created_at']


# ---------------- BANNER ----------------
class BannerSerializer(SanitizedSerializer):
    class Meta:
        model = Banner
        fields = '__all__'

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


# ---------------- MANUAL REVIEW ----------------
class ManualReviewSerializer(SanitizedSerializer):
    class Meta:
        model = ManualReview
        fields = ['id', 'name', 'city', 'stars', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


# ---------------- COUPON SECTION ----------------
class CouponSerializer(SanitizedSerializer):
    vendor_shop = serializers.SerializerMethodField(read_only=True)
    usages_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'discount_type', 'discount_value', 'start_datetime', 'end_datetime',
            'limit_per_user', 'max_usages', 'min_purchase_amount', 'max_discount_cap',
            'products', 'vendor', 'vendor_shop', 'usages_count', 'is_active', 'created_at'
        ]
        read_only_fields = ['vendor', 'created_at']

    def get_vendor_shop(self, obj):
        return obj.vendor.shop_name if obj.vendor else 'Admin'

    def get_usages_count(self, obj):
        return obj.usages.count()

    def validate_products(self, value):
        request = self.context.get('request')
        if request and hasattr(request.user, 'vendor_profile') and request.user.role == 'vendor':
            vendor = request.user.vendor_profile
            for product in value:
                if getattr(product, 'vendor', None) != vendor:
                    raise serializers.ValidationError(f"Product {product.name} does not belong to your store.")
        return value

    def validate(self, data):
        if data.get('end_datetime') <= data.get('start_datetime'):
            raise serializers.ValidationError("End date & time must be strictly after the start date & time.")
        if data.get('discount_type') == 'percentage' and (data.get('discount_value') <= 0 or data.get('discount_value') > 100):
            raise serializers.ValidationError("Percentage discount value must be between 1 and 100.")
        if data.get('discount_value') <= 0:
            raise serializers.ValidationError("Discount value must be greater than zero.")
        return data


class CouponUsageSerializer(serializers.ModelSerializer):
    buyer_email = serializers.CharField(source='user.email', read_only=True)
    buyer_name = serializers.CharField(source='user.name', read_only=True)
    coupon_code = serializers.CharField(source='coupon.code', read_only=True)

    class Meta:
        model = CouponUsage
        fields = ['id', 'coupon', 'coupon_code', 'user', 'buyer_name', 'buyer_email', 'order', 'used_at']


# ---------------- NEWS SECTION ----------------
class NewsSerializer(SanitizedSerializer):
    class Meta:
        model = News
        fields = ['id', 'title', 'start_date', 'end_date', 'is_active', 'created_at']
        read_only_fields = ['created_at']


# ---------------- PLATFORM CONFIG ----------------
class PlatformConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformConfiguration
        fields = ['platform_fee', 'platform_fee_gst', 'shipping_charge', 'shipping_charge_gst']


