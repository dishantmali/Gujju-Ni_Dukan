from django.urls import path,include
from rest_framework_simplejwt.views import (
    TokenObtainPairView, TokenRefreshView
)
from rest_framework.routers import DefaultRouter
from .views import (
    # Auth
    LoginView, RegisterView, MeView,
    # Products
    ProductListView, ProductDetailView,
    # Vendor
    VendorProductListCreateView, VendorProductUpdateView,
    VendorCategoryRequestView, VendorOfferRequestView,
    # Orders
    OrderListView, VendorOrderStatusUpdateView,
    # Payment
    CreateRazorpayOrderView, VerifyPaymentView,
    # Admin
    AdminProductApprovalView, AdminVendorApprovalView,
    AdminPendingProductsView, AdminPendingVendorsView,
    AdminUserListView, AdminCategoryListCreateView,
    AdminCategoryDetailView, AdminOrderListView,
    AdminCategoryRequestListView, AdminCategoryRequestActionView,
    AdminOfferListCreateView, AdminOfferActionView,
    AdminBannerView,AdminSubscriptionPlanListCreateView, AdminSubscriptionPlanDetailView,
    AdminVendorSubscriptionsView,

    # Category
    CategoryListView,WishlistToggleView,WishlistListView,MergeWishlistView,
    # Cart
    CartView, AddToCartView, CheckoutView, RemoveFromCartView,VerifyCartPaymentView,MergeCartView,
    # Homepage
    HomePageView,
    # Reviews
    ProductReviewListCreateView, PlatformReviewListCreateView, VendorReviewListView ,
    SubscriptionPlanListView, CurrentSubscriptionView,
    CreateSubscriptionOrderView, VerifySubscriptionPaymentView,
    UserProfileView,
    AddressViewSet, 
    ChangePasswordView, 
    RequestContactOTPView, 
    VerifyContactOTPView
)
router = DefaultRouter()
router.register(r'addresses', AddressViewSet, basename='address')
urlpatterns = [

    # ---------------- AUTH ---------------- #
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path(
        'auth/token/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='me'),

    # ---------------- PRODUCTS ---------------- #
    path('products/', ProductListView.as_view(), name='product_list'),
    path(
        'products/<int:pk>/',
        ProductDetailView.as_view(),
        name='product_detail'),
    path('wishlist/toggle/', WishlistToggleView.as_view(), name='wishlist_toggle'),
    path('wishlist/', WishlistListView.as_view(), name='wishlist_list'), 
    path('wishlist/merge/', MergeWishlistView.as_view(), name='merge_wishlist'),

    # ---------------- VENDOR ---------------- #
    path(
        'vendor/products/',
        VendorProductListCreateView.as_view(),
        name='vendor_product_list_create'),
    path('vendor/products/<int:pk>/',
         VendorProductUpdateView.as_view(),
         name='vendor_product_update'),
    path('vendor/category-requests/',
         VendorCategoryRequestView.as_view(),
         name='vendor_category_requests'),
    path('vendor/offer-requests/',
         VendorOfferRequestView.as_view(),
         name='vendor_offer_requests'),
    path('vendor/subscription/plans/',
        SubscriptionPlanListView.as_view(),
        name='subscription_plans'),
    path('vendor/subscription/current/',
        CurrentSubscriptionView.as_view(),
        name='current_subscription'),
    path('vendor/subscription/create-order/',
        CreateSubscriptionOrderView.as_view(),
        name='create_subscription_order'),
    path('vendor/subscription/verify/',
        VerifySubscriptionPaymentView.as_view(),
        name='verify_subscription_payment'),

    # ---------------- ADMIN ---------------- #
    path('admin/products/pending/',
         AdminPendingProductsView.as_view(),
         name='admin_pending_products'),
    path(
        'admin/products/<int:product_id>/action/',
        AdminProductApprovalView.as_view(),
        name='admin_product_action'),
    path('admin/vendors/pending/',
         AdminPendingVendorsView.as_view(),
         name='admin_pending_vendors'),
    path(
        'admin/vendors/<int:vendor_id>/action/',
        AdminVendorApprovalView.as_view(),
        name='admin_vendor_action'),
    path('admin/users/', AdminUserListView.as_view(), name='admin_users'),
    path(
        'admin/categories/',
        AdminCategoryListCreateView.as_view(),
        name='admin_categories_manage'),
    path('admin/categories/<int:pk>/',
         AdminCategoryDetailView.as_view(),
         name='admin_category_detail'),
    path(
        'admin/orders/',
        AdminOrderListView.as_view(),
        name='admin_global_orders'),
    path('admin/category-requests/',
         AdminCategoryRequestListView.as_view(),
         name='admin_category_requests'),
    path('admin/category-requests/<int:pk>/action/',
         AdminCategoryRequestActionView.as_view(),
         name='admin_category_request_action'),
    path('admin/offers/',
         AdminOfferListCreateView.as_view(),
         name='admin_offers'),
    path('admin/offers/<int:pk>/action/',
         AdminOfferActionView.as_view(),
         name='admin_offer_action'),
    path('admin/subscription-plans/',
         AdminSubscriptionPlanListCreateView.as_view(),
         name='admin_subscription_plans'),
    path('admin/subscription-plans/<int:pk>/',
         AdminSubscriptionPlanDetailView.as_view(),
         name='admin_subscription_plan_detail'),
    path('admin/vendor-subscriptions/',
         AdminVendorSubscriptionsView.as_view(),
         name='admin_vendor_subscriptions'),

    # ---------------- CATEGORY ---------------- #
    path('categories/', CategoryListView.as_view(), name='category_list'),

    # ---------------- CART ---------------- #
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/add/', AddToCartView.as_view(), name='add_to_cart'),
    path('cart/merge/', MergeCartView.as_view(), name='merge_cart'),
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path(
        'cart/remove/<int:item_id>/',
        RemoveFromCartView.as_view(),
        name='remove_from_cart'),
    path(
        'payment/verify-cart/',
        VerifyCartPaymentView.as_view(),
        name='verify_cart_payment'),

    # ---------------- PAYMENT ---------------- #
    path(
        'payment/create-order/',
        CreateRazorpayOrderView.as_view(),
        name='create_razorpay_order'),
    path(
        'payment/verify/',
        VerifyPaymentView.as_view(),
        name='verify_payment'),
    path(
        'payment/verify-cart/', 
        VerifyCartPaymentView.as_view(), 
        name='verify_cart_payment'),

    # ---------------- ORDERS ---------------- #
    path('orders/', OrderListView.as_view(), name='order_list'),
    path('vendor/order-items/<int:pk>/status/',
         VendorOrderStatusUpdateView.as_view(),
         name='vendor_order_status_update'),

    # ---------------- HOMEPAGE ---------------- #
    path('homepage/', HomePageView.as_view(), name='homepage'),

    # ---------------- REVIEWS ---------------- #
    path('products/<int:product_id>/reviews/', ProductReviewListCreateView.as_view(), name='product_reviews'),
    path('platform-reviews/', PlatformReviewListCreateView.as_view(), name='platform_reviews'),
    path('vendor/reviews/', VendorReviewListView.as_view(), name='vendor_reviews'),

    path('admin/banners/', AdminBannerView.as_view()),
    path('admin/banners/<int:pk>/', AdminBannerView.as_view()),
    
    # Address URLs
    path('', include(router.urls)),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    
    # Security URLs
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('request-contact-otp/', RequestContactOTPView.as_view(), name='request-otp'),
    path('verify-contact-otp/', VerifyContactOTPView.as_view(), name='verify-otp'),
]
