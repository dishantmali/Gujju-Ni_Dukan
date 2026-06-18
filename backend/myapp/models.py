from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.core.validators import RegexValidator
from django_resized import ResizedImageField
from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from django.core.cache import cache
from django.utils import timezone
from django.utils.text import slugify

mobile_num_validator = RegexValidator(
    regex=r'^[6-9]\d{9}$',
    message="Mobile number must be exactly 10 digits and start with 6, 7, 8, or 9."
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
    shop_name = models.CharField(max_length=255, unique=True)
    contact_details = models.TextField()
    logo = models.ImageField(upload_to='vendor_logos/', null=True, blank=True)
    tagline = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    pincode = models.CharField(max_length=10, null=True, blank=True)
    address_line_1 = models.CharField(max_length=255, null=True, blank=True)
    address_line_2 = models.CharField(max_length=255, null=True, blank=True)
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
    ICON_TYPE_CHOICES = (
        ('iconify', 'Iconify'),
        ('uploaded_svg', 'Uploaded SVG'),
        ('uploaded_image', 'Uploaded Image'),
        ('legacy', 'Legacy React-Icons'),
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, null=True, blank=True)
    icon = models.CharField(max_length=255, default='mdi:shopping')
    icon_type = models.CharField(
        max_length=20,
        choices=ICON_TYPE_CHOICES,
        default='iconify'
    )

    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='subcategories'
    )

    class Meta:
        verbose_name_plural = 'Categories'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    def delete(self, *args, **kwargs):
        # Prevent deletion of the fallback category itself
        if self.name.lower() == "uncategorized":
            return 
        uncategorized, _ = Category.objects.get_or_create(name="Uncategorized")
        self.product_set.all().update(category=uncategorized)
        super().delete(*args, **kwargs)


class GSTCategory(models.Model):
    """Groups product categories under a single GST rate. Admin-managed only."""
    name = models.CharField(max_length=255, unique=True)
    gst_percentage = models.DecimalField(max_digits=5, decimal_places=2, help_text="GST percentage for assigned categories")
    categories = models.ManyToManyField(
        Category,
        related_name='gst_categories',
        blank=True,
        help_text="Product categories assigned to this GST rate"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'GST Categories'
        ordering = ['gst_percentage']

    def __str__(self):
        return f"{self.name} ({self.gst_percentage}%)"

def _lookup_gst_percentage_for_category(category):
    """Helper: find the GST percentage for a product category via GSTCategory mapping."""
    if not category:
        return 0
    gst_cat = category.gst_categories.first()
    if gst_cat:
        return gst_cat.gst_percentage
    return 0


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
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Base price without GST")
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

    # GST fields — auto-calculated from GSTCategory mapping
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Mirrors 'price' field for clarity")
    gst_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Auto-set from GST Category")
    gst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Calculated: base_price × gst_percentage / 100")
    final_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Calculated: base_price + gst_amount")

    # FIX #5: auto_now_add ensures field is never None
    created_at = models.DateTimeField(auto_now_add=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True # Added for performance
    )
    is_active = models.BooleanField(default=True)
    is_new = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']
    
    def _calculate_gst_fields(self):
        """Auto-calculate GST fields from category → GSTCategory mapping."""
        import decimal
        self.base_price = self.price
        self.gst_percentage = _lookup_gst_percentage_for_category(self.category)
        self.gst_amount = round(self.base_price * self.gst_percentage / decimal.Decimal(100), 2)
        self.final_price = self.base_price + self.gst_amount

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

        # Auto-calculate GST fields
        self._calculate_gst_fields()
                    
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @property
    def current_discount(self):
        from django.utils import timezone
        today = timezone.now().date()
        active_offers = self.offers.filter(status='approved', start_date__lte=today, end_date__gte=today)
        if active_offers.exists():
            return max([offer.discount_percent for offer in active_offers])
        return 0

    @property
    def discounted_price(self):
        """Returns the GST-inclusive discounted final price."""
        discount = self.current_discount
        if discount > 0:
            import decimal
            discounted_base = round(self.price - (self.price * decimal.Decimal(discount) / 100), 2)
            gst_on_discounted = round(discounted_base * self.gst_percentage / decimal.Decimal(100), 2)
            return discounted_base + gst_on_discounted
        return self.final_price


class ProductVariant(models.Model):
    """One sellable SKU per product (e.g. color × size) with its own price and stock."""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='variants'
    )
    sku = models.CharField(max_length=100, blank=True, default='')
    image = ResizedImageField(
        size=[800, 1000],
        crop=['middle', 'center'],
        quality=75,
        upload_to='product_variant_images/',
        force_format='JPEG',
        null=True,
        blank=True
    )
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Base price without GST")
    stock_quantity = models.PositiveIntegerField(default=0)
    option_values = models.JSONField(default=dict)

    # GST fields — auto-calculated from parent product's category → GSTCategory
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gst_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    gst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    final_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        ordering = ['id']

    def _calculate_gst_fields(self):
        """Auto-calculate GST fields from the parent product's category → GSTCategory mapping."""
        import decimal
        self.base_price = self.price
        self.gst_percentage = _lookup_gst_percentage_for_category(self.product.category)
        self.gst_amount = round(self.base_price * self.gst_percentage / decimal.Decimal(100), 2)
        self.final_price = self.base_price + self.gst_amount

    def save(self, *args, **kwargs):
        self._calculate_gst_fields()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} #{self.pk}"

    @property
    def discounted_price(self):
        """Returns the GST-inclusive discounted final price."""
        discount = self.product.current_discount
        if discount > 0:
            import decimal
            discounted_base = round(self.price - (self.price * decimal.Decimal(discount) / 100), 2)
            gst_on_discounted = round(discounted_base * self.gst_percentage / decimal.Decimal(100), 2)
            return discounted_base + gst_on_discounted
        return self.final_price


class ProductVariantImage(models.Model):
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = ResizedImageField(
        size=[800, 1000],
        crop=['middle', 'center'],
        quality=75,
        upload_to='product_variant_images/',
        force_format='JPEG'
    )

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.variant.product.name} variant image #{self.pk}"


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='product_images'
    )
    image = ResizedImageField(
        size=[800, 1000],
        crop=['middle', 'center'],
        quality=75,
        upload_to='product_images/',
        force_format='JPEG'
    )

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.product.name} image #{self.pk}"


class Coupon(models.Model):
    DISCOUNT_TYPE_CHOICES = (
        ('rupee', 'Flat Rupee (₹)'),
        ('percentage', 'Percentage (%)'),
    )

    code = models.CharField(max_length=50, unique=True, db_index=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES, default='rupee')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    limit_per_user = models.PositiveIntegerField(default=1)
    max_usages = models.PositiveIntegerField(null=True, blank=True)
    min_purchase_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_discount_cap = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    products = models.ManyToManyField('Product', related_name='coupons', blank=True)
    vendor = models.ForeignKey('VendorProfile', on_delete=models.CASCADE, related_name='coupons', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        self.code = self.code.upper().strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} ({self.discount_type})"


class Order(models.Model):
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, blank=True, null=True, related_name='orders')
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending', db_index=True)
    address = models.TextField()
    phone = models.CharField(max_length=10, validators=[mobile_num_validator])
    
    razorpay_order_id = models.CharField(max_length=255, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=255, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    platform_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    platform_fee_gst = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    product_gst = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    shipping_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    shipping_charge_gst = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    cgst = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    sgst = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    igst = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)


    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.id} - {self.user.email}"


class CouponUsage(models.Model):
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='usages')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='coupon_usages')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='coupon_usages', null=True, blank=True)
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-used_at']

    def __str__(self):
        return f"{self.user.email} used {self.coupon.code}"


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
    product_variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name='order_items'
    )
    vendor = models.ForeignKey('VendorProfile', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    product_name_snapshot = models.CharField(max_length=255, blank=True, null=True)
    vendor_shop_snapshot = models.CharField(max_length=255, blank=True, null=True)
    price_snapshot = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    variant_options_snapshot = models.CharField(max_length=512, blank=True, null=True)

    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    gst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    cgst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    sgst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    igst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)


    # Tracking Fields Moved Here
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    confirmed_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [['order', 'product_variant']]

    def __str__(self):
        return f"{self.product.name} (x{self.quantity}) - {self.status}"
    
    def save(self, *args, **kwargs):
        # Automatically take a snapshot when the order is first created
        if not self.pk:
            if self.product_variant_id:
                pv = self.product_variant
                self.product = pv.product
                self.product_name_snapshot = self.product.name
                self.price_snapshot = pv.price
                opts = pv.option_values or {}
                self.variant_options_snapshot = ', '.join(
                    f'{k}: {opts[k]}' for k in sorted(opts.keys())
                ) if opts else ''
            elif self.product:
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
    product_variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name='cart_items'
    )
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = [['cart', 'product_variant']]
    
    def save(self, *args, **kwargs):
        if self.product_variant_id:
            self.product_id = self.product_variant.product_id
        super().save(*args, **kwargs)

class CategoryRequest(models.Model):
    STATUS_CHOICES = (('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected'))
    ICON_TYPE_CHOICES = (
        ('iconify', 'Iconify'),
        ('uploaded_svg', 'Uploaded SVG'),
        ('uploaded_image', 'Uploaded Image'),
        ('legacy', 'Legacy React-Icons'),
    )
    name = models.CharField(max_length=255)
    icon = models.CharField(max_length=255, default='mdi:shopping')
    icon_type = models.CharField(
        max_length=20,
        choices=ICON_TYPE_CHOICES,
        default='iconify'
    )
    requested_by = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='category_requests')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

class Offer(models.Model):
    STATUS_CHOICES = (('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected'))
    title = models.CharField(max_length=255)
    image = models.ImageField(upload_to='offer_images/', null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(db_index=True)
    requested_by = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='offer_requests', null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='approved', db_index=True)
    discount_percent = models.PositiveIntegerField(default=0)
    products = models.ManyToManyField('Product', related_name='offers', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Banner(models.Model):
    title = models.CharField(max_length=255)
    image = models.ImageField(upload_to='banners/', null=True, blank=True)
    youtube_url = models.CharField(max_length=500, blank=True, null=True, help_text="YouTube Video URL (For Right Banner)")
    is_active = models.BooleanField(default=True)
    position = models.CharField(
        max_length=10,
        choices=[('left', 'Left'), ('right', 'Right')],
        default='left',
        help_text="Which promo slot this banner appears in"
    )
    display_order = models.PositiveIntegerField(default=0, help_text="Sort order within its position")
    link_url = models.CharField(max_length=500, blank=True, null=True, help_text="Optional click-through URL")

    class Meta:
        ordering = ['position', 'display_order', 'id']

class HeroBanner(models.Model):
    title = models.CharField(max_length=255, blank=True)
    image = models.ImageField(upload_to='hero_banners/')
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.title or f"Hero Banner {self.id}"

class Wishlist(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist')
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product') # Prevent duplicate likes

class IconAsset(models.Model):
    """Reusable uploaded icon assets, decoupled from categories."""
    ICON_TYPE_CHOICES = (
        ('uploaded_svg', 'SVG'),
        ('uploaded_image', 'Image'),
    )
    name = models.CharField(max_length=255)
    icon_type = models.CharField(max_length=20, choices=ICON_TYPE_CHOICES)
    file = models.FileField(upload_to='category-icons/')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


@receiver([post_save, post_delete], sender=Category)
def invalidate_category_cache(sender, **kwargs):
    cache.delete('global_categories')
    print("Category updated: Cache Cleared.")


def _recalculate_products_for_categories(category_ids):
    """Recalculate GST fields for all products/variants in the given categories."""
    products = Product.objects.filter(category_id__in=category_ids)
    for product in products:
        product._calculate_gst_fields()
        Product.objects.filter(pk=product.pk).update(
            base_price=product.base_price,
            gst_percentage=product.gst_percentage,
            gst_amount=product.gst_amount,
            final_price=product.final_price
        )
        for variant in product.variants.all():
            variant._calculate_gst_fields()
            ProductVariant.objects.filter(pk=variant.pk).update(
                base_price=variant.base_price,
                gst_percentage=variant.gst_percentage,
                gst_amount=variant.gst_amount,
                final_price=variant.final_price
            )


@receiver(post_save, sender=GSTCategory)
def recalculate_on_gst_category_save(sender, instance, **kwargs):
    """When a GSTCategory's percentage changes, recalculate all assigned products."""
    category_ids = list(instance.categories.values_list('id', flat=True))
    if category_ids:
        _recalculate_products_for_categories(category_ids)


@receiver(m2m_changed, sender=GSTCategory.categories.through)
def recalculate_on_gst_category_m2m_change(sender, instance, action, pk_set, **kwargs):
    """When categories are added/removed from a GSTCategory, recalculate affected products."""
    if action in ('post_add', 'post_remove', 'post_clear'):
        if pk_set:
            _recalculate_products_for_categories(pk_set)
        # Also recalculate all currently assigned categories
        category_ids = list(instance.categories.values_list('id', flat=True))
        if category_ids:
            _recalculate_products_for_categories(category_ids)

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


class ManualReview(models.Model):
    """Admin-created manual reviews for the homepage"""
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    stars = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.stars} stars"

class News(models.Model):
    title = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField(db_index=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class PlatformConfiguration(models.Model):
    platform_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Flat platform fee in rupees")
    platform_fee_gst = models.DecimalField(max_digits=5, decimal_places=2, default=18.00, help_text="GST percentage on platform fee")
    shipping_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Flat shipping charge in rupees")
    shipping_charge_gst = models.DecimalField(max_digits=5, decimal_places=2, default=18.00, help_text="GST percentage on shipping charge")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Fee: ₹{self.platform_fee} (GST: {self.platform_fee_gst}%), Shipping: ₹{self.shipping_charge} (GST: {self.shipping_charge_gst}%)"

    @classmethod
    def get_config(cls):
        config, created = cls.objects.get_or_create(id=1)
        return config

