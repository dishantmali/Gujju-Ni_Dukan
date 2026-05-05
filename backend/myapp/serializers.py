import html
from rest_framework import serializers
from django.db import models
from django.contrib.auth import get_user_model
from .models import (
    CustomUser, UserProfile , VendorProfile, Product, Order, OrderItem,
    Category, Cart, CartItem, CategoryRequest, Offer , Wishlist , Address,
    ProductReview, PlatformReview , Banner , SubscriptionPlan, VendorSubscription
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


# ---------------- PRODUCT ----------------
class ProductSerializer(SanitizedSerializer):
    vendor_shop = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)

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
            'is_active'
        ]
        read_only_fields = ['vendor', 'status']

    def get_vendor_shop(self, obj):
        return obj.vendor.shop_name

    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(models.Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0.0

    def get_review_count(self, obj):
        return obj.reviews.count()
    
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
            'product', 'product_details', 'vendor', 'vendor_shop',
            'quantity', 'price', 'status', 'confirmed_at', 'shipped_at', 'delivered_at'
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
        fields = '__all__'


class CartItemSerializer(SanitizedSerializer):
    product_details = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_details', 'quantity']


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
            'id', 'name', 'image', 'requested_by',
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