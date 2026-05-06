from re import search
from django.core.cache import cache
import razorpay
from twilio.rest import Client
from django.core.mail import send_mail
from datetime import date, timedelta
from django.conf import settings
from django.utils import timezone
from rest_framework import generics, permissions, status , viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db import transaction , models
from django.contrib.auth import update_session_auth_hash
import requests 
from .models import (
    CustomUser, Product, ProductVariant, ProductVariantImage, Order, VendorProfile, OrderItem, Address, UserProfile ,
    Category, Cart, CartItem, CategoryRequest, Offer , Wishlist,
    ProductReview, PlatformReview , Banner , SubscriptionPlan, VendorSubscription
)
from .serializers import (
    RegisterSerializer, CustomUserSerializer, ProductSerializer,
    OrderSerializer,OrderItemSerializer, VendorOrderUpdateSerializer, CategorySerializer,
    CartSerializer, CategoryRequestSerializer, OfferSerializer, WishlistSerializer ,
    ProductReviewSerializer, PlatformReviewSerializer , BannerSerializer , UserSerializer ,
    SubscriptionPlanSerializer, VendorSubscriptionSerializer , AddressSerializer
)
import random
# Initialize Razorpay client
razorpay_client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
)


# ---------------- Auth APIs ---------------- #
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'detail': 'Email and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find user by email
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response(
                {'detail': 'No active account found with the given credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check password
        if not user.check_password(password):
            return Response(
                {'detail': 'No active account found with the given credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate tokens using Simple JWT
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class HomePageView(APIView):
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get(self, request):
        categories = Category.objects.all()
        products = Product.objects.filter(status='approved').prefetch_related(
            'variants'
        ).annotate(
            review_count=models.Count('reviews')
        ).order_by('-review_count', '-created_at')[:10]
        new_products = Product.objects.filter(
            status='approved'
        ).prefetch_related('variants').order_by('-created_at')[:10]

        today = date.today()
        active_offers = Offer.objects.filter(
            status='approved',
            end_date__gte=today
        )
        
        top_vendors = VendorProfile.objects.filter(is_approved=True)[:10]
        active_banners = Banner.objects.filter(is_active=True)
        return Response({
            "categories": CategorySerializer(
                categories, many=True,
                context={'request': request}
            ).data,
            "featured_products": ProductSerializer(
                products, many=True,
                context={'request': request}
            ).data,
            "new_products": ProductSerializer(
                new_products, many=True,
                context={'request': request}
            ).data,
            "offers": OfferSerializer(
                active_offers, many=True,
                context={'request': request}
            ).data,
            "vendors": [
                {
                    "shop_name": v.shop_name,
                    # build_absolute_uri ensures the full URL is sent (e.g., http://127.0.0.1:8000/media/...)
                    "logo": request.build_absolute_uri(v.logo.url) if v.logo else None
                } 
                for v in top_vendors
            ],
            "banners": [{"id": b.id, "image": request.build_absolute_uri(b.image.url)} for b in active_banners],
        })


# ---------------- Product APIs ---------------- #
class ProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer

    def get_queryset(self):
        # FIX: Ensure we ONLY fetch products that are approved AND active
        queryset = Product.objects.filter(
            status='approved', is_active=True
        ).prefetch_related('variants')

        # Category Filter
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        # Search Filter
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) | 
                models.Q(description__icontains=search) |
                models.Q(vendor__shop_name__icontains=search) |
                models.Q(category__name__icontains=search)
            )
            
        # Price Filters (applied to variant SKU prices)
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(variants__price__gte=min_price)
        if max_price:
            queryset = queryset.filter(variants__price__lte=max_price)

        return queryset.distinct()


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(status='approved').prefetch_related(
        'variants', 'variants__images', 'product_images', 'reviews'
    )
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]


class CategoryListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # 1. Try to fetch from 'memory'
        cached_categories = cache.get('global_categories')

        if cached_categories:
            print("Cache Hit: Serving from RAM")
            return Response(cached_categories)

        # 2. If not in memory, fetch from DB
        print("Cache Miss: Fetching from Database")
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        data = serializer.data

        # 3. Save to memory for 24 hours (86400 seconds)
        cache.set('global_categories', data, 86400)

        return Response(data)

# ---------------- Vendor APIs ---------------- #
class VendorProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        if self.request.user.role != 'vendor':
            return Product.objects.none()
        # FIX 3: Only return active (un-archived) products to the vendor dashboard
        return Product.objects.filter(vendor__user=self.request.user)

    def perform_create(self, serializer):
        if self.request.user.role != 'vendor':
            raise PermissionDenied("Only vendors can create products.")

        vendor_profile = getattr(self.request.user, 'vendor_profile', None)

        if not vendor_profile:
            raise ValidationError("Vendor profile not found.")

        if not vendor_profile.is_approved:
            raise PermissionDenied("Vendor not approved by admin.")

        # --- NEW: Subscription Limit Check ---
        try:
            sub = VendorSubscription.objects.get(vendor=vendor_profile)
            if not sub.is_valid():
                raise PermissionDenied("Your subscription has expired or is inactive. Please upgrade.")
            
            # FIX 1: Count ONLY active products against their subscription limit
            current_count = Product.objects.filter(vendor=vendor_profile, is_active=True).count()
            
            if current_count >= sub.plan.product_limit:
                raise PermissionDenied(f"Plan limit reached! You can only have up to {sub.plan.product_limit} active products. Archive old products or upgrade your plan.")
        except VendorSubscription.DoesNotExist:
            raise PermissionDenied("You need an active subscription plan to add products.")
        # -------------------------------------

        print(f"[VIEW] request.data keys: {list(self.request.data.keys())}")
        print(f"[VIEW] variants_input in request.data: {self.request.data.get('variants_input', 'NOT FOUND')!r}")
        print(f"[VIEW] request.FILES keys: {list(self.request.FILES.keys())}")

        serializer.save(vendor=vendor_profile, status='pending')
        product = serializer.instance
        print(f"[VIEW] after save: product.id={product.id}, variant count={product.variants.count()}")

        variants = list(product.variants.all().order_by('id'))
        print(f"[VIEW] processing {len(variants)} variants for images")
        for idx, variant in enumerate(variants):
            # Handle multiple images per variant
            image_idx = 0
            while True:
                img = self.request.FILES.get(f'variant_image_{idx}_{image_idx}')
                if not img:
                    break
                ProductVariantImage.objects.create(variant=variant, image=img)
                image_idx += 1
            # Fallback single image for backward compat + primary variant.image
            single_img = self.request.FILES.get(f'variant_image_{idx}')
            if single_img:
                variant.image = single_img
                variant.save(update_fields=['image'])
                ProductVariantImage.objects.create(variant=variant, image=single_img)

        if not product.variants.exists():
            print("[VIEW] FALLBACK: no variants exist, creating fallback variant")
            fallback_variant = ProductVariant.objects.create(
                product=product,
                price=product.price,
                stock_quantity=product.stock_quantity,
                option_values={},
            )
            image_idx = 0
            while True:
                img = self.request.FILES.get(f'variant_image_0_{image_idx}')
                if not img:
                    break
                ProductVariantImage.objects.create(variant=fallback_variant, image=img)
                image_idx += 1
            fallback_image = self.request.FILES.get('variant_image_0')
            if fallback_image:
                fallback_variant.image = fallback_image
                fallback_variant.save(update_fields=['image'])
                ProductVariantImage.objects.create(variant=fallback_variant, image=fallback_image)


class VendorProductUpdateView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'vendor':
            return Product.objects.none()
        # Ensure vendors can only edit active products
        return Product.objects.filter(vendor__user=self.request.user)

    # --- FIX 2: SOFT DELETE (ARCHIVE) ---
    def perform_destroy(self, instance):
        # Instead of a hard delete, we archive it.
        instance.is_active = False
        
        # Calling .save() here automatically triggers the logic we wrote in models.py 
        # to find and cancel any 'pending' orders associated with this product!
        instance.save()

# ---------------- Admin APIs ---------------- #
class AdminProductApprovalView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, product_id):
        if request.user.role != 'admin':
            raise PermissionDenied("Only admin can approve products.")

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)

        action = request.data.get('action')

        if action not in ['approve', 'reject']:
            return Response({"error": "Invalid action"}, status=400)

        if product.status == 'approved' and action == 'approve':
            return Response({"message": "Product already approved"}, status=400)

        if action == 'approve':
            product.status = 'approved'
            product.is_active = True
        else:
            product.status = 'rejected'
            product.is_active = False # SOFT DELETE / ARCHIVE

        product.save()

        return Response({"message": f"Product {action}d successfully"})

class AdminVendorApprovalView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, vendor_id):
        if request.user.role != 'admin':
            raise PermissionDenied("Only admin can manage vendors.")

        try:
            vendor = VendorProfile.objects.get(id=vendor_id)
        except VendorProfile.DoesNotExist:
            return Response({"error": "Vendor not found"}, status=404)

        action = request.data.get('action')  # approve / reject

        if action == 'approve':
            if vendor.is_approved:
                return Response({"message": "Vendor already approved"}, status=400)
            vendor.is_approved = True
            vendor.is_active = True  # Ensure active
            vendor.save()
            Product.objects.filter(vendor=vendor).update(is_active=True)
            return Response({"message": "Vendor approved successfully"})

        elif action == 'reject':
            # --- ENTERPRISE SOFT DELETE ---
            vendor.is_approved = False
            vendor.is_active = False
            vendor.save()
            
            # Automatically suspend all their products so buyers can't see them
            Product.objects.filter(vendor=vendor).update(is_active=False)           
            return Response({"message": "Vendor account suspended. Products hidden."})

        return Response({"error": "Invalid action"}, status=400)

class AdminPendingProductsView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only admin can view products.")
        # Put pending first so admin page-1 always shows new review requests.
        return Product.objects.annotate(
            pending_priority=models.Case(
                models.When(status='pending', then=models.Value(0)),
                default=models.Value(1),
                output_field=models.IntegerField(),
            )
        ).order_by('pending_priority', '-created_at')


class AdminPendingVendorsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only admin can view vendors.")
        # Return ALL vendors, putting unapproved ones at the top
        return VendorProfile.objects.all().order_by('is_approved', '-id')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        data = [
            {
                "id": v.id,
                "shop_name": v.shop_name,
                "email": v.user.email,
                "phone": v.phone,
                "address": v.address,
                "is_approved": v.is_approved,
                "is_active": v.is_active
            }
            for v in queryset
        ]
        return Response(data)

class AdminUserListView(generics.ListAPIView):
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only admin can view users.")
        return CustomUser.objects.filter(role='buyer').order_by('-date_joined')


class AdminCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    queryset = Category.objects.all()

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only admin can create categories.")
        serializer.save()


class AdminCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Category.objects.all()

    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only admin can delete categories.")
        instance.delete()


class AdminOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only admin can view global orders.")
        return Order.objects.all().order_by('-created_at')
    
class AdminBannerView(APIView):
    permission_classes = [permissions.IsAdminUser] 

    def get(self, request):
        # FIX 1: Order by 'id' since 'created_at' does not exist on the Banner model
        banners = Banner.objects.all().order_by('id')
        serializer = BannerSerializer(banners, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        # STRICT LIMIT: Max 2 banners
        if Banner.objects.count() >= 2:
            return Response({"error": "Maximum of 2 banners allowed."}, status=status.HTTP_400_BAD_REQUEST)

        # FIX 2: Create a mutable copy of the data and inject a default title
        data = request.data.copy()
        if 'title' not in data:
            data['title'] = f"Promo Banner {Banner.objects.count() + 1}"

        serializer = BannerSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        # If it fails, print the errors to the terminal so we can see exactly what went wrong
        print("Banner Upload Errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            banner = Banner.objects.get(pk=pk)
            banner.delete()
            return Response({"success": True}, status=status.HTTP_204_NO_CONTENT)
        except Banner.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
# ---------------- ADMIN SUBSCRIPTION APIs ---------------- #

class AdminSubscriptionPlanListCreateView(generics.ListCreateAPIView):
    """Admin can view all plans and create new ones"""
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = SubscriptionPlan.objects.all().order_by('price')

class AdminSubscriptionPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin can edit (update limits/price) or delete a plan"""
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = SubscriptionPlan.objects.all()

class AdminVendorSubscriptionsView(generics.ListAPIView):
    """Admin can see which vendor is on which plan"""
    serializer_class = VendorSubscriptionSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = VendorSubscription.objects.all().order_by('-start_date')

# ---------- Vendor Category & Offer Requests ---------- #

class VendorCategoryRequestView(generics.ListCreateAPIView):
    serializer_class = CategoryRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        if self.request.user.role != 'vendor':
            return CategoryRequest.objects.none()
        return CategoryRequest.objects.filter(
            requested_by__user=self.request.user
        ).order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.role != 'vendor':
            raise PermissionDenied("Only vendors can request categories.")
        vendor = getattr(self.request.user, 'vendor_profile', None)
        if not vendor:
            raise ValidationError("Vendor profile not found.")
        serializer.save(requested_by=vendor, status='pending')


class VendorOfferRequestView(generics.ListCreateAPIView):
    serializer_class = OfferSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        if self.request.user.role != 'vendor':
            return Offer.objects.none()
        return Offer.objects.filter(
            requested_by__user=self.request.user
        ).order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.role != 'vendor':
            raise PermissionDenied("Only vendors can request offers.")
        vendor = getattr(self.request.user, 'vendor_profile', None)
        if not vendor:
            raise ValidationError("Vendor profile not found.")
        serializer.save(requested_by=vendor, status='pending')


# ---------- Admin Category Request Management ---------- #

class AdminCategoryRequestListView(generics.ListAPIView):
    serializer_class = CategoryRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Admin only.")
        return CategoryRequest.objects.all().order_by('-created_at')


class AdminCategoryRequestActionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'admin':
            raise PermissionDenied("Admin only.")

        try:
            cat_req = CategoryRequest.objects.get(id=pk)
        except CategoryRequest.DoesNotExist:
            return Response(
                {"error": "Request not found"}, status=404
            )

        action = request.data.get('action')

        if action == 'approve':
            Category.objects.create(
                name=cat_req.name,
                image=cat_req.image
            )
            cat_req.status = 'approved'
            cat_req.save()
            return Response(
                {"message": "Category request approved and created"}
            )
        elif action == 'reject':
            cat_req.status = 'rejected'
            cat_req.save()
            return Response(
                {"message": "Category request rejected"}
            )

        return Response({"error": "Invalid action"}, status=400)


# ---------- Admin Offer Management ---------- #

class AdminOfferListCreateView(generics.ListCreateAPIView):
    serializer_class = OfferSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Admin only.")
        return Offer.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Admin only.")
        serializer.save(requested_by=None, status='approved')


class AdminOfferActionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'admin':
            raise PermissionDenied("Admin only.")

        try:
            offer = Offer.objects.get(id=pk)
        except Offer.DoesNotExist:
            return Response(
                {"error": "Offer not found"}, status=404
            )

        action = request.data.get('action')

        if action == 'approve':
            offer.status = 'approved'
            offer.save()
            return Response({"message": "Offer approved"})
        elif action == 'reject':
            offer.status = 'rejected'
            offer.save()
            return Response({"message": "Offer rejected"})

        return Response({"error": "Invalid action"}, status=400)

    def delete(self, request, pk):
        if request.user.role != 'admin':
            raise PermissionDenied("Admin only.")

        try:
            offer = Offer.objects.get(id=pk)
            offer.delete()
            return Response({"message": "Offer deleted"})
        except Offer.DoesNotExist:
            return Response(
                {"error": "Offer not found"}, status=404
            )


# ---------------- Razorpay Payment APIs ---------------- #

class CreateRazorpayOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.role != 'buyer':
            return Response(
                {"error": "Only buyers can initiate payment."},
                status=status.HTTP_403_FORBIDDEN
            )

        product_id = request.data.get('product_id')
        variant_id = request.data.get('variant_id')
        address = request.data.get('address')
        phone = request.data.get('phone')
        quantity = int(request.data.get('quantity', 1))

        if not product_id or not address or not phone:
            return Response(
                {"error": "product_id, address, and phone are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(id=product_id, status='approved')
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if variant_id:
            pv = ProductVariant.objects.filter(id=variant_id, product_id=product_id).first()
        else:
            pv = ProductVariant.objects.filter(product=product).order_by('id').first()
        if not pv:
            return Response({"error": "Product has no variants."}, status=status.HTTP_400_BAD_REQUEST)

        base_amount = float(pv.price) * quantity
        platform_fee = base_amount * 0.05
        gst = platform_fee * 0.18
        total_amount = base_amount + platform_fee + gst
        amount_in_paise = int(total_amount * 100)

        razorpay_order = razorpay_client.order.create({
            "amount": amount_in_paise,
            "currency": "INR",
            "payment_capture": 1,
        })

        return Response({
            "razorpay_order_id": razorpay_order["id"],
            "razorpay_key_id": settings.RAZORPAY_KEY_ID,
            "amount": amount_in_paise,
            "currency": "INR",
            "product_name": product.name,
            "delivery_info": {
                "product_id": product.id,
                "variant_id": pv.id,
                "address": address,
                "phone": phone,
                "quantity": quantity,
            }
        })


class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.role != 'buyer':
            return Response(
                {"error": "Only buyers can verify payment."},
                status=status.HTTP_403_FORBIDDEN
            )

        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')
        product_id = request.data.get('product_id')
        variant_id = request.data.get('variant_id')
        address = request.data.get('address')
        phone = request.data.get('phone')
        quantity = int(request.data.get('quantity', 1))

        # 1. Verify Razorpay Signature
        try:
            razorpay_client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature,
            })
        except Exception:
            return Response({"error": "Payment verification failed. Invalid signature."},
                            status=status.HTTP_400_BAD_REQUEST)

        # 2. Atomic Transaction for Stock Check, Decrement, and Order Creation
        product = Product.objects.filter(id=product_id, status='approved').first()
        if not product:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            if variant_id:
                locked = list(
                    ProductVariant.objects.select_for_update().filter(id=variant_id, product_id=product_id)[:1]
                )
            else:
                locked = list(
                    ProductVariant.objects.select_for_update()
                    .filter(product_id=product_id)
                    .order_by('id')[:1]
                )
            pv = locked[0] if locked else None
            if not pv:
                return Response({"error": "Variant not found."}, status=status.HTTP_404_NOT_FOUND)

            # Check if enough stock is available
            if pv.stock_quantity < quantity:
                return Response(
                    {"error": f"Insufficient stock. Only {pv.stock_quantity} available."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Decrement variant stock and save
            pv.stock_quantity -= quantity
            pv.save()

            total_amount = float(pv.price) * quantity

            # Create Order
            order = Order.objects.create(
                user=user,
                address=address,
                phone=phone,
                payment_status='paid',
                razorpay_order_id=razorpay_order_id,
                razorpay_payment_id=razorpay_payment_id,
                razorpay_signature=razorpay_signature,
                total_price=total_amount
            )

            # Create OrderItem
            OrderItem.objects.create(
                order=order,
                product=product,
                product_variant=pv,
                vendor=product.vendor,
                quantity=quantity,
                price=pv.price
            )

        serializer = OrderSerializer(order)

        return Response({
            "message": "Order placed successfully",
            "order": serializer.data
        }, status=status.HTTP_201_CREATED)

# ---------------- Order APIs ---------------- #

class OrderListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]

    # Buyers get full Orders, Vendors get a list of their specific OrderItems
    def get_serializer_class(self):
        if self.request.user.role == 'vendor':
            return OrderItemSerializer
        return OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'buyer':
            return Order.objects.filter(user=user).order_by('-created_at')
        elif user.role == 'vendor':
            if hasattr(user, 'vendor_profile'):
                return OrderItem.objects.filter(vendor=user.vendor_profile).order_by('-order__created_at')
        return Order.objects.none()


class VendorOrderStatusUpdateView(generics.UpdateAPIView):
    serializer_class = VendorOrderUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role != 'vendor' or not hasattr(user, 'vendor_profile'):
            return OrderItem.objects.none()
        # Ensure vendors can only update their own items
        return OrderItem.objects.filter(vendor=user.vendor_profile)

    def perform_update(self, serializer):
        new_status = serializer.validated_data.get('status')
        timestamp_fields = {
            'confirmed': 'confirmed_at',
            'shipped': 'shipped_at',
            'delivered': 'delivered_at',
        }
        extra_kwargs = {}
        if new_status in timestamp_fields:
            extra_kwargs[timestamp_fields[new_status]] = timezone.now()
        serializer.save(**extra_kwargs)


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)


class AddToCartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        variant_id = request.data.get('variant_id')
        quantity = int(request.data.get('quantity', 1))

        try:
            product = Product.objects.get(id=product_id, status='approved')
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        if variant_id:
            pv = ProductVariant.objects.filter(id=variant_id, product_id=product_id).first()
        else:
            pv = ProductVariant.objects.filter(product=product).order_by('id').first()
        if not pv:
            return Response({"error": "Product has no variants."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Immediate Stock Check
        if pv.stock_quantity <= 0:
            return Response({"error": "This product is currently out of stock."}, status=status.HTTP_400_BAD_REQUEST)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        
        # 2. Check existing cart quantity
        item = CartItem.objects.filter(cart=cart, product_variant=pv).first()
        current_qty = item.quantity if item else 0
        new_qty = current_qty + quantity

        # 3. Limit Check
        if new_qty > pv.stock_quantity:
             return Response(
                 {"error": f"Cannot add. Only {pv.stock_quantity} available (You have {current_qty} in cart)."}, 
                 status=status.HTTP_400_BAD_REQUEST
             )

        # 4. Save
        if item:
            item.quantity = new_qty
            item.save()
        else:
            CartItem.objects.create(cart=cart, product=product, product_variant=pv, quantity=new_qty)

        return Response({"message": "Added to cart"})


class RemoveFromCartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, item_id):
        try:
            cart = Cart.objects.get(user=request.user)
            item = CartItem.objects.get(id=item_id, cart=cart)
            item.delete()
            return Response({"message": "Item removed from cart"},
                            status=status.HTTP_200_OK)
        except (Cart.DoesNotExist, CartItem.DoesNotExist):
            return Response({"error": "Item not found in cart"},
                            status=status.HTTP_404_NOT_FOUND)


class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        
        try:
            cart = Cart.objects.get(user=user)
            items = cart.items.all()
        except Cart.DoesNotExist:
            return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        if not items:
            return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate total amount (per variant SKU price)
        base_amount = sum(float(item.product_variant.price) * item.quantity for item in items)
        platform_fee = base_amount * 0.05
        gst = platform_fee * 0.18
        total_amount = base_amount + platform_fee + gst
        amount_in_paise = int(total_amount * 100)

        # Create Razorpay order (DO NOT delete cart items yet!)
        razorpay_order = razorpay_client.order.create({
            "amount": amount_in_paise,
            "currency": "INR",
            "payment_capture": 1,
        })

        return Response({
            "razorpay_order_id": razorpay_order["id"],
            "razorpay_key_id": settings.RAZORPAY_KEY_ID,
            "amount": amount_in_paise,
            "currency": "INR",
        })

class VerifyCartPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')
        address = request.data.get('address')
        phone = request.data.get('phone')

        # 1. Verify Signature
        try:
            razorpay_client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature,
            })
        except Exception:
            return Response({"error": "Payment verification failed."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Process Cart Atomically
        try:
            cart = Cart.objects.get(user=user)
            items = cart.items.all()
            
            with transaction.atomic():
                variant_ids = [item.product_variant_id for item in items]
                variants = ProductVariant.objects.select_for_update().filter(id__in=variant_ids)
                variant_map = {v.id: v for v in variants}
                
                total_amount = 0
                
                # Check stock for all items
                for item in items:
                    v = variant_map.get(item.product_variant_id)
                    if not v:
                        return Response(
                            {"error": "A cart item references a missing product variant."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    if v.stock_quantity < item.quantity:
                        return Response(
                            {"error": f"Insufficient stock for {v.product.name}. Only {v.stock_quantity} left."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    total_amount += float(v.price) * item.quantity
                    
                # Add fees
                platform_fee = total_amount * 0.05
                gst = platform_fee * 0.18
                final_total = total_amount + platform_fee + gst

                # Create Order
                order = Order.objects.create(
                    user=user, address=address, phone=phone,
                    # status='pending', 
                    payment_status='paid',
                    razorpay_order_id=razorpay_order_id,
                    razorpay_payment_id=razorpay_payment_id,
                    razorpay_signature=razorpay_signature,
                    total_price=final_total
                )

                # Create OrderItems & Decrement Stock
                for item in items:
                    v = variant_map[item.product_variant_id]
                    v.stock_quantity -= item.quantity
                    v.save()
                    
                    OrderItem.objects.create(
                        order=order, product=v.product, product_variant=v, vendor=v.product.vendor,
                        quantity=item.quantity, price=v.price
                    )

                # Clear Cart NOW (after successful payment and order creation)
                items.delete()

            return Response({"message": "Order placed successfully"}, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"Checkout Error: {e}")
            return Response({"error": "An error occurred while processing your order."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class WishlistToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated] #

    def post(self, request):
        if request.user.role != 'buyer':
            return Response(
                {"error": "Only buyers can maintain a wishlist."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({"error": "Product ID required"}, status=400)
        
        try:
            product = Product.objects.get(id=product_id) #
            # get_or_create returns a tuple (object, created_boolean)
            wishlist_item, created = Wishlist.objects.get_or_create(
                user=request.user, 
                product=product
            )

            if not created:
                # If it already existed, we "toggle" it off by deleting it
                wishlist_item.delete()
                return Response({"message": "Removed from wishlist", "added": False})
            
            return Response({"message": "Added to wishlist", "added": True}, status=201)
            
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)

class WishlistListView(generics.ListAPIView):
    serializer_class = WishlistSerializer # You'll need to create this in serializers.py
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return the wishlist items for the logged-in user
        return Wishlist.objects.filter(user=self.request.user).select_related('product')

class MergeCartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        local_items = request.data.get('items', [])
        cart, _ = Cart.objects.get_or_create(user=request.user)

        for item in local_items:
            product_id = item.get('product_id')
            variant_id = item.get('variant_id')
            quantity = item.get('quantity', 1)
            
            try:
                product = Product.objects.get(id=product_id, status='approved')
                if variant_id:
                    pv = ProductVariant.objects.filter(id=variant_id, product_id=product_id).first()
                else:
                    pv = ProductVariant.objects.filter(product=product).order_by('id').first()
                if pv and pv.stock_quantity > 0:
                    cart_item, created = CartItem.objects.get_or_create(
                        cart=cart, product_variant=pv,
                        defaults={'product': product, 'quantity': quantity},
                    )
                    if not created:
                        cart_item.quantity += quantity
                    else:
                        cart_item.quantity = quantity
                    cart_item.save()
            except Product.DoesNotExist:
                continue

        return Response({"message": "Cart merged successfully"})
    
class MergeWishlistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        local_items = request.data.get('items', [])
        
        for item in local_items:
            product_id = item.get('product')
            if isinstance(product_id, dict):
                product_id = product_id.get('id')
                
            try:
                product = Product.objects.get(id=product_id, status='approved')
                Wishlist.objects.get_or_create(user=request.user, product=product)
            except Product.DoesNotExist:
                continue

        return Response({"message": "Wishlist merged successfully"})
    
# ---------------- Review APIs ---------------- #

class ProductReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductReviewSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return ProductReview.objects.filter(product_id=product_id).order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'buyer':
            raise PermissionDenied("Only buyers can leave reviews.")

        order_item_id = self.request.data.get('order_item')
        if not order_item_id:
            raise ValidationError({"order_item": "This field is required."})

        try:
            # Ensure the order item belongs to the user
            order_item = OrderItem.objects.get(id=order_item_id, order__user=user)
        except OrderItem.DoesNotExist:
            raise ValidationError("Order item not found or does not belong to you.")

        # Business Logic: Must be delivered to review
        if order_item.status != 'delivered':
            raise ValidationError("You can only review products that have been delivered.")

        # Business Logic: Prevent duplicate reviews for the same item
        if ProductReview.objects.filter(order_item=order_item).exists():
            raise ValidationError("You have already reviewed this specific order item.")

        serializer.save(
            user=user,
            product=order_item.product,
            vendor=order_item.vendor,
            order_item=order_item
        )

class PlatformReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = PlatformReviewSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()] # Public can see featured reviews
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if self.request.method == 'GET':
            # Only return admin-approved featured reviews for the homepage
            return PlatformReview.objects.filter(is_featured=True).order_by('-created_at')
        
        # Logged-in user seeing their own feedback history
        return PlatformReview.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.role != 'buyer':
            raise PermissionDenied("Only buyers can leave platform feedback.")
        
        # New reviews default to not featured
        serializer.save(user=self.request.user, is_featured=False)


class VendorReviewListView(generics.ListAPIView):
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role != 'vendor' or not hasattr(user, 'vendor_profile'):
            return ProductReview.objects.none()
        
        # Let the vendor see all reviews left on their products
        return ProductReview.objects.filter(vendor=user.vendor_profile).order_by('-created_at')
    
# ---------------- SUBSCRIPTION APIs ---------------- #

class SubscriptionPlanListView(generics.ListAPIView):
    """Fetch all active pricing plans"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SubscriptionPlanSerializer
    queryset = SubscriptionPlan.objects.filter(is_active=True).order_by('price')


class CurrentSubscriptionView(APIView):
    """Fetch the logged-in vendor's current subscription"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'vendor':
            raise PermissionDenied("Only vendors have subscriptions.")
        
        vendor = request.user.vendor_profile
        try:
            sub = VendorSubscription.objects.get(vendor=vendor)
            return Response(VendorSubscriptionSerializer(sub).data)
        except VendorSubscription.DoesNotExist:
            return Response({"error": "No active subscription"}, status=404)


class CreateSubscriptionOrderView(APIView):
    """Create a Razorpay order for purchasing a plan"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'vendor':
            raise PermissionDenied("Only vendors can subscribe.")
        
        plan_id = request.data.get('plan_id')
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response({"error": "Plan not found."}, status=404)
        
        amount_in_paise = int(plan.price * 100)

        # Handle "Free" plans immediately without Razorpay
        if amount_in_paise == 0:
            vendor = request.user.vendor_profile
            VendorSubscription.objects.update_or_create(
                vendor=vendor,
                defaults={
                    'plan': plan,
                    'is_active': True,
                    'start_date': timezone.now(),
                    'end_date': timezone.now() + timedelta(days=plan.duration_days)
                }
            )
            return Response({"message": "Free plan activated successfully!"})

        # Paid Plans: Create Razorpay Order
        razorpay_order = razorpay_client.order.create({
            "amount": amount_in_paise,
            "currency": "INR",
            "payment_capture": 1,
        })

        return Response({
            "razorpay_order_id": razorpay_order["id"],
            "razorpay_key_id": settings.RAZORPAY_KEY_ID,
            "amount": amount_in_paise,
            "currency": "INR",
            "plan_name": plan.name,
            "plan_id": plan.id
        })


class VerifySubscriptionPaymentView(APIView):
    """Verify Razorpay payment and activate the plan"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'vendor':
            raise PermissionDenied("Only vendors can subscribe.")
        
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')
        plan_id = request.data.get('plan_id')

        try:
            razorpay_client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature,
            })
        except Exception:
            return Response({"error": "Payment verification failed."}, status=400)

        plan = SubscriptionPlan.objects.get(id=plan_id)
        vendor = request.user.vendor_profile
        
        # Activate the subscription
        sub, created = VendorSubscription.objects.update_or_create(
            vendor=vendor,
            defaults={
                'plan': plan,
                'is_active': True,
                'start_date': timezone.now(),
                'end_date': timezone.now() + timedelta(days=plan.duration_days),
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id
            }
        )

        return Response({"message": "Subscription activated successfully!"})
    
# 1. Address ViewSet
class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only return addresses belonging to the logged-in user
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Attach the logged-in user to the address when creating
        serializer.save(user=self.request.user)

# 2. Change Password View
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not user.check_password(current_password):
            return Response({"error": "Wrong current password"}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        # Keep the user logged in after password change
        update_session_auth_hash(request, user) 
        return Response({"message": "Password updated successfully"})

# 3. Request OTP View
class RequestContactOTPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        contact_type = request.data.get('type') # Will be 'email' or 'phone'
        new_value = request.data.get('new_value')
        
        if not new_value:
            return Response({"error": f"{contact_type} is required."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Generate a universal 6-digit OTP
        otp = str(random.randint(100000, 999999))
        
        # 2. Save it in the cache for 5 minutes
        cache_key = f"otp_{request.user.id}_{contact_type}"
        cache.set(cache_key, {'otp': otp, 'new_value': new_value}, timeout=300)

        # --------------------------------------------------
        # PATH A: The user requested a Phone OTP
        # --------------------------------------------------
        if contact_type == 'phone':
            formatted_number = new_value.strip()
            if not formatted_number.startswith('+'):
                formatted_number = '+91' + formatted_number # Format for India

            try:
                # Use Twilio to send the SMS
                client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                client.messages.create(
                    body=f"Your Gujju Ni Dukan verification code is: {otp}",
                    from_=settings.TWILIO_PHONE_NUMBER,
                    to=formatted_number
                )
                print(f"SMS sent successfully to {formatted_number}")
                
            except Exception as e:
                print("TWILIO ERROR:", str(e))
                return Response({"error": f"Failed to send SMS: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # --------------------------------------------------
        # PATH B: The user requested an Email OTP
        # --------------------------------------------------
        elif contact_type == 'email':
            try:
                # Use Django's built-in SMTP to send the Email
                send_mail(
                    subject="Your Gujju Ni Dukan Verification Code",
                    message=f"Hello!\n\nYour email verification code is: {otp}\n\nThis code will expire in 5 minutes.",
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[new_value], 
                    fail_silently=False,
                )
                print(f"Email sent successfully to {new_value}")
                
            except Exception as e:
                print("SMTP EMAIL ERROR:", str(e))
                return Response({"error": "Failed to send email. Check your SMTP settings."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 3. If everything succeeded, tell the frontend!
        return Response({"message": f"OTP sent successfully to {new_value}"})
            
# 4. Verify OTP View
class VerifyContactOTPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        contact_type = request.data.get('type')
        provided_otp = request.data.get('otp')
        
        cache_key = f"otp_{request.user.id}_{contact_type}"
        cached_data = cache.get(cache_key)

        if not cached_data or cached_data['otp'] != provided_otp:
            return Response({"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)

        # OTP is valid, update the user
        user = request.user
        if contact_type == 'email':
            user.email = cached_data['new_value']
            user.save()
        elif contact_type == 'phone':
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.phone = cached_data['new_value']
            profile.save()

        # Clear the cache
        cache.delete(cache_key)

        return Response({"message": f"{contact_type} updated successfully"})
    
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user
        try:
            # Attempt to safely get or create the profile
            UserProfile.objects.get_or_create(user=user)
            
        except UserProfile.MultipleObjectsReturned:
            # FIX: If duplicates exist, keep the first one and delete the rest
            profiles = UserProfile.objects.filter(user=user)
            for duplicate in profiles[1:]:
                duplicate.delete()
                
        except Exception as e:
            # If it's a migration error, print it clearly in the Django terminal
            print(f"CRITICAL DATABASE ERROR: {str(e)}")
            print("Did you forget to run 'python manage.py makemigrations' and 'migrate'?")
            
        return user