from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.core.validators import RegexValidator
from django_resized import ResizedImageField
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from django.utils import timezone

mobile_num_validator = RegexValidator(
    regex=r'^\d{10}$',
    message="Mobile number must be exactly 10 digits."
)

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('buyer', 'Buyer'),
        ('vendor', 'Vendor'),
    )
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='buyer')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'name', 'role']

    def __str__(self):
        return self.email

class UserProfile(models.Model):
    # Link to your CustomUser using settings
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return f"{self.user.email}'s Profile"
    
class Address(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='addresses')
    street = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    is_default = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        # If this is set to default, make sure all others are NOT default
        if self.is_default:
            Address.objects.filter(user=self.user).update(is_default=False)
        super().save(*args, **kwargs)

class VendorProfile(models.Model):
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='vendor_profile'
    )
    shop_name = models.CharField(max_length=255)
    contact_details = models.TextField()
    logo = models.ImageField(upload_to='vendor_logos/', null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    phone = models.CharField(
        max_length=10, 
        validators=[mobile_num_validator], 
        null=True, 
        blank=True
    )
    is_approved = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if self.pk:
            old_vendor = VendorProfile.objects.get(pk=self.pk)
            # If vendor was active/approved, but is now suspended/rejected
            if old_vendor.is_active and (not self.is_active or not self.is_approved):
                # Find all PENDING order items for this vendor
                pending_items = OrderItem.objects.filter(vendor=self, status='pending')
                for item in pending_items:
                    item.status = 'cancelled'
                    item.save()
                    
        super().save(*args, **kwargs)

    def __str__(self):
        return self.shop_name

class Category(models.Model):
    name = models.CharField(max_length=255)
    image = models.ImageField(upload_to='category_images/', null=True, blank=True)
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='subcategories'
    )

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name

    def delete(self, *args, **kwargs):
        # Prevent deletion of the fallback category itself
        if self.name.lower() == "uncategorized":
            return 
        uncategorized, _ = Category.objects.get_or_create(name="Uncategorized")
        self.product_set.all().update(category=uncategorized)
        super().delete(*args, **kwargs)

class Product(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    vendor = models.ForeignKey(
        VendorProfile,
        on_delete=models.CASCADE,
        related_name='products'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = ResizedImageField(
        size=[800, 1000],        # Max width/height
        crop=['middle', 'center'], # Optional: auto-crop to fit ratio
        quality=75,               # Compression level (1-100)
        upload_to='product_images/',
        force_format='JPEG'       # Converts PNGs/WebP to JPEG for better compression
    )
    description = models.TextField()
    
    # FIX #2: Stock management field
    stock_quantity = models.PositiveIntegerField(default=0)

    # FIX #5: auto_now_add ensures field is never None
    created_at = models.DateTimeField(auto_now_add=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True # Added for performance
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Check if the product is being deactivated
        if self.pk:
            old_product = Product.objects.get(pk=self.pk)
            # If it was active, but is now inactive OR rejected
            if old_product.is_active and (not self.is_active or self.status == 'rejected'):
                # Find all PENDING order items for this product
                pending_items = OrderItem.objects.filter(product=self, status='pending')
                for item in pending_items:
                    item.status = 'cancelled'
                    item.save()
                    # You could optionally trigger an email notification to the buyer here
                    
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Order(models.Model):
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending', db_index=True)
    address = models.TextField()
    phone = models.CharField(max_length=10, validators=[mobile_num_validator])
    
    razorpay_order_id = models.CharField(max_length=255, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=255, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.id} - {self.user.email}"

class OrderItem(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    vendor = models.ForeignKey('VendorProfile', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    product_name_snapshot = models.CharField(max_length=255, blank=True, null=True)
    vendor_shop_snapshot = models.CharField(max_length=255, blank=True, null=True)
    price_snapshot = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    # Tracking Fields Moved Here
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    confirmed_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['order', 'product']

    def __str__(self):
        return f"{self.product.name} (x{self.quantity}) - {self.status}"
    
    def save(self, *args, **kwargs):
        # Automatically take a snapshot when the order is first created
        if not self.pk:
            if self.product:
                self.product_name_snapshot = self.product.name
                self.price_snapshot = self.product.price
            if self.vendor:
                self.vendor_shop_snapshot = self.vendor.shop_name
        super().save(*args, **kwargs)

class Cart(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ['cart', 'product']

class CategoryRequest(models.Model):
    STATUS_CHOICES = (('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected'))
    name = models.CharField(max_length=255)
    image = models.ImageField(upload_to='category_request_images/', null=True, blank=True)
    requested_by = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='category_requests')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

class Offer(models.Model):
    STATUS_CHOICES = (('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected'))
    title = models.CharField(max_length=255)
    image = models.ImageField(upload_to='offer_images/')
    start_date = models.DateField()
    end_date = models.DateField(db_index=True)
    requested_by = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='offer_requests', null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='approved', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Banner(models.Model):
    title = models.CharField(max_length=255)
    image = models.ImageField(upload_to='banners/')
    is_active = models.BooleanField(default=True)

class Wishlist(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist')
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product') # Prevent duplicate likes

@receiver([post_save, post_delete], sender=Category)
def invalidate_category_cache(sender, **kwargs):
    cache.delete('global_categories')
    print("Category updated: Cache Cleared.")

class ProductReview(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='vendor_reviews')
    order_item = models.OneToOneField(OrderItem, on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])
    review_text = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Review by {self.user.email} for {self.product.name}"


class PlatformReview(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])
    feedback_text = models.TextField()
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Platform Feedback by {self.user.email}"
    
class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=100) # e.g., "Free Tier", "Pro Vendor"
    price = models.DecimalField(max_digits=10, decimal_places=2)
    product_limit = models.PositiveIntegerField(help_text="Max products vendor can list")
    duration_days = models.PositiveIntegerField(default=30)
    features = models.TextField(help_text="Comma separated features for frontend display", blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} (₹{self.price})"

class VendorSubscription(models.Model):
    vendor = models.OneToOneField(
        VendorProfile, 
        on_delete=models.CASCADE, 
        related_name='subscription'
    )
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=False)
    
    # Payment tracking
    razorpay_order_id = models.CharField(max_length=255, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=255, blank=True, null=True)

    def is_valid(self):
        if self.is_active and self.end_date and self.end_date > timezone.now():
            return True
        return False

    def __str__(self):
        return f"{self.vendor.shop_name} - {self.plan.name if self.plan else 'No Plan'}"