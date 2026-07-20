import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  X,
  ShoppingCart,
  Heart,
  Shield,
  CheckCircle2,
  Check,
  AlertCircle,
  Ruler,
  Minus,
  Plus,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/PageShell";
import { StarRating } from "@/components/StarRating";
import { PriceTag } from "@/components/PriceTag";
import { ProductCard } from "@/components/ProductCard";
import { vendors } from "@/data/vendors";
import { useCart } from "@/store/cart";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { mapApiProduct } from "@/lib/mapApiProduct";
import { Product, ProductVariant } from "@/data/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

const getSwatchColor = (value: string) => {
  const normalized = value.trim().toLowerCase();
  const colorMap: Record<string, string> = {
    black: "#1f1f1f",
    white: "#f5f5f5",
    blue: "#3b5ba9",
    navy: "#1f2a44",
    red: "#bf4040",
    green: "#4f8f5b",
    grey: "#8f9195",
    gray: "#8f9195",
    brown: "#8a5d42",
    beige: "#d8c4a8",
    pink: "#d17995",
    yellow: "#d9ac3d",
    orange: "#cf7a3f",
    purple: "#6d549f",
  };
  return colorMap[normalized] ?? "#8f9195";
};

const ProductPage = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [qty, setQty] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState("");
  const [activeInfoTab, setActiveInfoTab] = useState<"details" | "reviews" | "policy">("details");
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState<number | null>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 600) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: coupons = [] } = useQuery<any[]>({
    queryKey: ["activeCoupons"],
    queryFn: async () => {
      try {
        const res = await api.get("/coupons/active/");
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    staleTime: 60000,
  });

  const matchingCoupon = product ? coupons.find(
    (c) =>
      c.is_active &&
      (c.vendor === product.vendorId ||
        c.vendor?.id === product.vendorId ||
        (Array.isArray(c.products) && c.products.map(String).includes(String(product.id))) ||
        (!c.vendor && (!c.products || c.products.length === 0)))
  ) : null;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res: any = await api.get(`/products/${id}/`);
        // console.log("[ProductPage] RAW API response:", res);
        const mapped = mapApiProduct(res as Record<string, unknown>);
        // console.log("[ProductPage] MAPPED product:", mapped);
        // console.log("[ProductPage] variants count:", mapped.variants?.length ?? 0);
        // console.log("[ProductPage] variant IDs:", mapped.variants?.map((v: ProductVariant) => v.id));
        setProduct(mapped);
      } catch (err) {
        console.error("Failed to fetch product:", err);
        toast.error("Product not found");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!product?.categoryId) return;
      try {
        const res: any = await api.get(`/products/?category=${product.categoryId}`);
        const all = (res || []).map((p: any) => mapApiProduct(p as Record<string, unknown>));
        const filtered = all.filter((p: Product) => String(p.id) !== String(product.id));
        // Shuffle and take up to 8
        const shuffled = filtered.sort(() => 0.5 - Math.random()).slice(0, 8);
        setRelatedProducts(shuffled);
      } catch {
        setRelatedProducts([]);
      }
    };
    if (product) fetchRelated();
  }, [product?.id]);

  useEffect(() => {
    const list = product?.variants ?? [];
    const firstOk = list.find((x: ProductVariant) => x.stock_quantity > 0);
    const pick = firstOk ?? list[0];
    setSelectedVariantId(pick ? String(pick.id) : "");
    setSelectedOptions(pick?.option_values ?? {});
    setQty(1);
  }, [product?.id]);

  const add = useCart((s) => s.add);
  const wishlist = useCart((s) => s.wishlist);
  const toggleWish = useCart((s) => s.toggleWishlist);
  const { user, isAuthenticated } = useAuth();
  const isBuyerOnly = !user || user.role === "buyer";

  const variants = product?.variants ?? [];
  const selectedVariant: ProductVariant | undefined =
    variants.find((x) => String(x.id) === selectedVariantId) ?? variants[0];

  // Build image list: variant images first, then product images, then fallback product image
  const variantImages = selectedVariant?.images && selectedVariant.images.length > 0
    ? selectedVariant.images
    : selectedVariant?.image
      ? [selectedVariant.image]
      : [];
  const productImages = product?.product_images ?? [];
  const allImages = Array.from(
    new Set([
      ...variantImages,
      product?.image,
      ...productImages,
    ].filter(Boolean).map(String))
  );

  useEffect(() => {
    setQty(1);
  }, [selectedVariantId]);

  useEffect(() => {
    if (allImages.length > 0) {
      setSelectedImage(allImages[0]);
    }
  }, [allImages.join("|"), product?.id]);

  if (loading)
    return (
      <PageShell>
        <div className="container px-4 sm:px-6 pt-4 pb-10">
          {/* Breadcrumb Skeleton */}
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-12" />
            <span className="text-muted-foreground">/</span>
            <Skeleton className="h-4 w-24" />
            <span className="text-muted-foreground">/</span>
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
            {/* Left: Images Skeleton */}
            <div className="flex flex-col gap-3 lg:gap-4">
              <div className="grid grid-cols-1 lg:grid-cols-[72px_1fr] gap-3">
                {/* Thumbnails (hidden on mobile, shown on desktop) */}
                <div className="hidden lg:flex flex-col gap-2.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-16 rounded-xl" />
                  ))}
                </div>
                {/* Main Image Box */}
                <Skeleton className="w-full aspect-square lg:h-[500px] rounded-2xl animate-pulse" />
              </div>

              {/* Info Tabs Skeleton */}
              <div className="mt-2 rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex gap-4 border-b border-border pb-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>

            {/* Right: Info + Actions Skeleton */}
            <div className="space-y-4">
              {/* Vendor */}
              <Skeleton className="h-4 w-32" />
              {/* Title */}
              <Skeleton className="h-8 w-3/4 sm:w-2/3" />
              {/* Rating */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              {/* Price */}
              <div className="space-y-2 mt-4">
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
              {/* Select Options Box */}
              <div className="rounded-2xl border border-border p-4 sm:p-5 space-y-4">
                <Skeleton className="h-5 w-28" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-12 rounded-lg" />
                  <Skeleton className="h-9 w-12 rounded-lg" />
                  <Skeleton className="h-9 w-12 rounded-lg" />
                </div>
                <div className="space-y-2 pt-2 border-t border-border">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
              {/* Stock Status */}
              <Skeleton className="h-14 w-full rounded-2xl" />
              {/* Quantity + Actions */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-28 rounded-full" />
                <Skeleton className="h-10 flex-1 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    );
  if (!product)
    return (
      <PageShell>
        <div className="container py-20 text-center">Product not found.</div>
      </PageShell>
    );

  const variantAttributes = variants.reduce<Record<string, Set<string>>>(
    (acc, v) => {
      Object.entries(v.option_values ?? {}).forEach(([key, value]) => {
        if (!acc[key]) acc[key] = new Set<string>();
        acc[key].add(String(value));
      });
      return acc;
    },
    {}
  );
  const attributeKeys = Object.keys(variantAttributes);
  const hasVariantAttributes = attributeKeys.length > 0;
  const colorKey = attributeKeys.find((x) =>
    x.toLowerCase().includes("color")
  );

  const resolveVariantFromOptions = (options: Record<string, string>) => {
    const candidates = variants.filter((variant) =>
      attributeKeys.every(
        (key) =>
          !options[key] || variant.option_values?.[key] === options[key]
      )
    );
    const inStock = candidates.find((variant) => variant.stock_quantity > 0);
    return inStock ?? candidates[0];
  };

  const isOptionValueAvailable = (key: string, value: string) => {
    const nextOptions = { ...selectedOptions, [key]: value };
    return variants.some((variant) =>
      attributeKeys.every(
        (attr) =>
          !nextOptions[attr] ||
          variant.option_values?.[attr] === nextOptions[attr]
      )
    );
  };

  const vendor = vendors.find((v) => v.id === product.vendorId);
  const activeVendor = product.vendor_details ? {
    id: product.vendor_details.id,
    name: product.vendor_details.name,
    tagline: product.vendor_details.tagline,
    rating: product.vendor_details.rating,
    city: product.vendor_details.city,
    initials: product.vendor_details.initials,
    logo: product.vendor_details.logo,
  } : vendor ? {
    id: vendor.id,
    name: vendor.name,
    tagline: vendor.tagline,
    rating: vendor.rating,
    city: vendor.city,
    initials: vendor.initials,
    logo: undefined,
  } : null;
  const isWish = wishlist.includes(product.id.toString());
  const related = relatedProducts;
  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayOriginal = selectedVariant ? (selectedVariant.originalPrice ?? displayPrice) : (product.originalPrice ?? displayPrice);
  const selectedStock =
    variants.length > 0
      ? (selectedVariant?.stock_quantity ?? 0)
      : (product.stock_quantity ?? (product.inStock ? 1 : 0));
  const stockTone =
    selectedStock <= 0
      ? "text-destructive"
      : selectedStock <= 10
        ? "text-amber-600"
        : "text-success";
  const canAddBuyers = isBuyerOnly && selectedStock > 0;
  const optionSummary = attributeKeys
    .map((key) => selectedOptions[key])
    .filter(Boolean)
    .join(" / ");

  return (
    <PageShell>
      <div className="container px-4 sm:px-6 pt-4 pb-10">
        {/* Breadcrumb */}
        <nav className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 sm:gap-1.5 mb-4 overflow-x-auto whitespace-nowrap pill-scroll">
          <Link to="/" className="hover:text-foreground shrink-0">
            Home
          </Link>
          <ChevronRight size={10} className="shrink-0" />
          {product.category ? (
            <Link
              to={`/category/${product.category.toLowerCase().replace(/\s+/g, "-")}`}
              className="hover:text-foreground capitalize shrink-0"
            >
              {product.category}
            </Link>
          ) : (
            <span className="capitalize shrink-0">Uncategorized</span>
          )}
          <ChevronRight size={10} className="shrink-0" />
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Left: Images */}
          <div className="flex flex-col gap-3 lg:gap-4">
            {/* Mobile Image Carousel */}
            <div className="lg:hidden relative">
              <div className="overflow-hidden bg-card border-y sm:border sm:rounded-2xl border-border">
                <motion.div
                  className="flex"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(_, info) => {
                    const threshold = 50;
                    const currentIndex = allImages.indexOf(selectedImage);
                    if (info.offset.x < -threshold && currentIndex < allImages.length - 1) {
                      setSelectedImage(allImages[currentIndex + 1]);
                    } else if (info.offset.x > threshold && currentIndex > 0) {
                      setSelectedImage(allImages[currentIndex - 1]);
                    }
                  }}
                >
                  <div className="w-full shrink-0 relative flex justify-center bg-card">
                    {selectedImage && (
                      <img
                        src={selectedImage}
                        alt={product.name}
                        className="w-full h-auto max-h-[50vh] object-contain"
                      />
                    )}
                  </div>
                </motion.div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isBuyerOnly) {
                      toast.error("Vendors and Admins cannot use wishlist");
                      return;
                    }
                    toggleWish(product, isAuthenticated);
                  }}
                  aria-label="Wishlist"
                  className="absolute top-4 right-4 h-10 w-10 grid place-items-center rounded-full bg-card/90 border border-border shadow-sm z-10"
                >
                  <Heart
                    size={18}
                    className={
                      isWish
                        ? "fill-destructive text-destructive"
                        : "text-brown-mid"
                    }
                  />
                </button>

                {/* Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {allImages.slice(0, 6).map((img, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        selectedImage === img ? "w-6 bg-brown-light" : "w-1.5 bg-white/60"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Mobile Thumbnails */}
              <div className="flex gap-2 overflow-x-auto py-3 pill-scroll snap-x">
                {allImages.slice(0, 6).map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={cn(
                      "h-16 w-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all snap-start",
                      selectedImage === img
                        ? "border-brown-light scale-95"
                        : "border-border hover:border-brown-light/50"
                    )}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop: side-by-side grid with vertical thumbnails */}
            <div className="hidden lg:grid grid-cols-[72px_1fr] gap-3">
              <div className="flex flex-col gap-2.5">
                {allImages.slice(0, 6).map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={cn(
                      "h-16 w-16 rounded-xl overflow-hidden border transition-all",
                      selectedImage === img
                        ? "border-brown-light ring-1 ring-brown-light"
                        : "border-border hover:border-brown-light/50"
                    )}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-border bg-card flex justify-center items-center">
                {selectedImage && (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isBuyerOnly) {
                      toast.error("Vendors and Admins cannot use wishlist");
                      return;
                    }
                    toggleWish(product, isAuthenticated);
                  }}
                  aria-label="Wishlist"
                  className="absolute top-3 right-3 h-10 w-10 grid place-items-center rounded-full bg-card/90 border border-border shadow-sm"
                >
                  <Heart
                    size={18}
                    className={
                      isWish
                        ? "fill-destructive text-destructive"
                        : "text-brown-mid"
                    }
                  />
                </button>
              </div>
            </div>

            {/* Info Tabs */}
            <div className="mt-4 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-4 border-b border-border pb-3 mb-3 overflow-x-auto">
                {(
                  [
                    ["details", "Product Details"],
                    (product.reviewCount ?? 0) > 0 ? ["reviews", `Reviews (${product.reviewCount ?? 0})`] : null,
                    ["policy", "Return Policy"],
                  ].filter(Boolean) as ["details" | "reviews" | "policy", string][]
                ).map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveInfoTab(tab)}
                    className={cn(
                      "text-sm font-medium whitespace-nowrap pb-1 border-b-2 transition-colors",
                      activeInfoTab === tab
                        ? "text-foreground border-brown-light"
                        : "text-muted-foreground border-transparent"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {activeInfoTab === "details" && (
                <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
                  <p>{product.description}</p>
                </div>
              )}
              {activeInfoTab === "reviews" && (
                <div className="space-y-3">
                  {(product.reviews ?? []).length > 0 ? (
                    product.reviews.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-xl border border-border p-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">{r.user}</p>
                          <span className="text-xs text-muted-foreground">
                            {r.date}
                          </span>
                        </div>
                        <StarRating
                          value={r.rating}
                          size={12}
                          className="mt-1"
                        />
                        <p className="mt-2 text-sm text-muted-foreground">
                          {r.comment}
                        </p>
                        {r.images && r.images.length > 0 && (
                          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 pill-scroll">
                            {r.images.map((imgUrl, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setLightboxImages(r.images || []);
                                  setLightboxImageIndex(idx);
                                }}
                                className="h-16 w-16 rounded-lg overflow-hidden border border-border shrink-0 hover:opacity-90 transition-opacity"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Review attachment ${idx + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No reviews yet.
                    </p>
                  )}
                </div>
              )}
              {activeInfoTab === "policy" && (
                <p className="text-sm text-muted-foreground">
                  Easy returns for damaged or incorrect items within 7 days of
                  delivery.
                </p>
              )}
            </div>
          </div>

          {/* Right: Info + Actions */}
          <div>
            {/* Vendor */}
            {(product.vendor_shop || vendor?.name) && (
              <Link
                to={`/vendor/${vendor?.id}`}
                className="text-sm text-brown-mid font-medium hover:text-primary inline-block"
              >
                {product.vendor_shop || vendor?.name}
              </Link>
            )}

            {/* Title */}
            <h1 className="font-display text-2xl sm:text-3xl lg:text-[2rem] font-semibold mt-1 leading-tight tracking-tight">
              {product.name}
            </h1>

            {/* Rating */}
            {(product.reviewCount ?? 0) > 0 && (
              <div className="mt-3 flex items-center gap-3">
                <StarRating value={product.rating} size={16} />
                <span className="text-sm text-muted-foreground">
                  {product.rating} · {product.reviewCount} reviews
                </span>
              </div>
            )}

            {/* Price */}
            <div className="mt-5">
              <PriceTag
                price={displayPrice}
                originalPrice={displayOriginal}
                discount={product.discount}
                size="lg"
              />
            </div>
            {matchingCoupon && (
              <div className="mt-4 p-3.5 rounded-xl border border-dashed border-emerald-500/35 bg-emerald-50/30 text-emerald-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏷️</span>
                  <div>
                    <span className="font-mono font-black text-sm tracking-wider uppercase text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      {matchingCoupon.code}
                    </span>
                    <p className="text-[11px] text-emerald-700 mt-1 font-medium leading-tight">
                      Use code at checkout to get{" "}
                      <span className="font-bold">
                        {matchingCoupon.discount_type === "rupee"
                          ? `₹${parseFloat(matchingCoupon.discount_value).toLocaleString("en-IN")}`
                          : `${matchingCoupon.discount_value}%`}{" "}
                        off
                      </span>{" "}
                      on this product.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Select Options Box */}
            {variants.length > 0 && (
              <div className="mt-5 sm:mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 sm:space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm font-semibold text-foreground">
                    Select options
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {variants.length} {variants.length === 1 ? "combination" : "combinations"} available
                  </span>
                </div>

                {hasVariantAttributes ? (
                  <div className="space-y-5">
                    {/* Attribute selectors */}
                    {Object.entries(variantAttributes).map(([key, values]) => {
                      const isColorRow = key === colorKey;
                      return (
                        <div key={key} className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                              {key}
                              {selectedOptions[key] && (
                                <span className="ml-1 normal-case text-foreground">
                                  : {selectedOptions[key]}
                                </span>
                              )}
                            </span>
                            {isColorRow && (
                              <span className="text-xs text-muted-foreground">
                                {values.size} {values.size === 1 ? "color" : "colors"}
                              </span>
                            )}
                            {!isColorRow && (
                              <button
                                type="button"
                                className="text-xs text-brown-mid flex items-center gap-1 hover:underline"
                                onClick={() =>
                                  toast.message("Size guide coming soon")
                                }
                              >
                                <Ruler size={12} /> Size guide
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            {Array.from(values).map((value) => {
                              const active = selectedOptions[key] === value;
                              const available =
                                isOptionValueAvailable(key, value);
                              return (
                                <button
                                  key={`${key}-${value}`}
                                  type="button"
                                  disabled={!available}
                                  onClick={() => {
                                    const nextOptions = {
                                      ...selectedOptions,
                                      [key]: value,
                                    };
                                    setSelectedOptions(nextOptions);
                                    const match =
                                      resolveVariantFromOptions(nextOptions);
                                    if (match)
                                      setSelectedVariantId(String(match.id));
                                  }}
                                  className={cn(
                                    "transition-all relative",
                                    isColorRow
                                      ? "h-9 w-9 rounded-full border-2"
                                      : "h-9 min-w-[2.5rem] px-3 rounded-lg border text-sm font-medium"
                                  )}
                                  style={
                                    isColorRow
                                      ? {
                                        borderColor: active
                                          ? "#8a5d42"
                                          : !available
                                            ? "#e5e7eb"
                                            : "#d1d5db",
                                        opacity: !available ? 0.4 : 1,
                                        cursor: !available
                                          ? "not-allowed"
                                          : "pointer",
                                      }
                                      : {}
                                  }
                                  title={value}
                                >
                                  {isColorRow ? (
                                    <span
                                      className="block h-full w-full rounded-full"
                                      style={{
                                        backgroundColor:
                                          getSwatchColor(value),
                                      }}
                                    />
                                  ) : (
                                    <span
                                      className={cn(
                                        active
                                          ? "text-foreground"
                                          : "text-muted-foreground",
                                        !available &&
                                        "opacity-40 cursor-not-allowed"
                                      )}
                                    >
                                      {value}
                                    </span>
                                  )}
                                  {isColorRow && active && (
                                    <span className="absolute inset-0 flex items-center justify-center">
                                      <Check size={14} className="text-white drop-shadow-sm" strokeWidth={3} />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground">
                      Select variant
                    </label>
                    <select
                      className="w-full p-2.5 rounded-lg border border-border bg-muted text-sm outline-none focus:border-accent transition-all"
                      value={selectedVariantId}
                      onChange={(e) => {
                        const vid = e.target.value;
                        setSelectedVariantId(vid);
                        const v = variants.find((x) => String(x.id) === vid);
                        setSelectedOptions(v?.option_values ?? {});
                      }}
                    >
                      {variants.map((v) => (
                        <option key={v.id} value={String(v.id)}>
                          {v.sku || `Variant ${v.id}`} — ₹
                          {v.price.toLocaleString("en-IN")} (
                          {v.stock_quantity} in stock)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Selected summary */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs text-muted-foreground border-t border-border pt-3">
                  <div>
                    Selected:{" "}
                    <span className="text-foreground font-medium">
                      {optionSummary || "Default"}
                    </span>
                  </div>
                  <div className="flex gap-3 sm:gap-0">
                    <span className="sm:ml-4">
                      Price:{" "}
                      <span className="text-foreground font-medium">
                        ₹{displayPrice.toLocaleString("en-IN")}
                      </span>
                    </span>
                    <span className="sm:ml-4">
                      SKU:{" "}
                      <span className="text-foreground font-medium">
                        {selectedVariant?.sku || "N/A"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">Quantity</span>
                  {/* Reduced area Quantity stepper */}
                  <div className="inline-flex items-center h-10 rounded-full border border-border bg-card overflow-hidden">
                    <button
                      type="button"
                      disabled={qty <= 1}
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="h-10 w-10 grid place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">
                      {qty}
                    </span>
                    <button
                      type="button"
                      disabled={selectedStock > 0 ? qty >= selectedStock : true}
                      onClick={() => setQty((q) => (selectedStock > 0 ? Math.min(q + 1, selectedStock) : q))}
                      className="h-10 w-10 grid place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={!canAddBuyers}
                  onClick={() => {
                    if (!isBuyerOnly) {
                      toast.error("Vendors and Admins cannot add items to cart");
                      return;
                    }
                    if (!canAddBuyers) {
                      toast.error("This option is out of stock");
                      return;
                    }
                    add(product, qty, selectedVariant ?? variants[0]);
                    toast.success("Added to cart", {
                      description: `${qty} × ${product.name}`,
                    });
                  }}
                  className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/10 hover:bg-brown-mid transition-all disabled:opacity-50 disabled:pointer-events-none text-sm sm:text-base"
                >
                  <ShoppingCart size={18} className="sm:w-5 sm:h-5" />
                  Add to Cart
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={!canAddBuyers}
                  onClick={() => {
                    if (!isBuyerOnly) {
                      toast.error("Vendors and Admins cannot purchase products");
                      return;
                    }
                    if (!canAddBuyers) {
                      toast.error("This option is out of stock");
                      return;
                    }
                    add(product, qty, selectedVariant ?? variants[0]);
                    navigate("/checkout");
                  }}
                  className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground font-bold shadow-lg shadow-accent/10 hover:opacity-95 transition-all disabled:opacity-50 disabled:pointer-events-none text-sm sm:text-base"
                >
                  Buy Now
                </motion.button>
              </div>
            </div>

            {/* Info Tabs */}
            <div className="mt-5 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Shield size={13} className="text-success" /> 100% Authentic
              </span>
              <span className="inline-flex items-center gap-1.5">
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-success" /> Easy
                returns on damaged items
              </span>
            </div>
          </div>
        </div>

        {/* Related */}
        <div className="mt-10 sm:mt-16">
          <h2 className="font-display text-xl sm:text-2xl font-semibold mb-4 sm:mb-5">
            You may also like
          </h2>
          <div className="pill-scroll overflow-x-auto">
            <div className="flex gap-4 sm:gap-5 min-w-max pb-2">
              {related.map((p, i) => (
                <div key={p.id} className="w-[200px] sm:w-[220px] shrink-0">
                  <ProductCard product={p} index={i} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Buy/Cart Bar (4.A) */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border shadow-lift p-3 flex items-center justify-between gap-3 lg:hidden"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={selectedImage || product.image}
                alt={product.name}
                className="h-10 w-10 object-contain rounded-lg border border-border bg-card shrink-0"
              />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-foreground truncate leading-tight">
                  {product.name}
                </h4>
                {optionSummary && (
                  <p className="text-[10px] text-muted-foreground truncate font-medium">
                    {optionSummary}
                  </p>
                )}
                <p className="text-xs font-semibold text-accent mt-0.5">
                  ₹{Number(displayPrice).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={!canAddBuyers}
                onClick={() => {
                  if (!isBuyerOnly) {
                    toast.error("Vendors and Admins cannot add items to cart");
                    return;
                  }
                  add(product, qty, selectedVariant ?? variants[0]);
                  toast.success("Added to cart", {
                    description: `${qty} × ${product.name}`,
                  });
                }}
                className="h-9 px-3 rounded-full bg-secondary text-foreground text-xs font-bold hover:bg-muted border border-border disabled:opacity-50 inline-flex items-center gap-1"
                aria-label="Add to cart"
              >
                <ShoppingCart size={13} />
                <span>Add</span>
              </button>
              <button
                type="button"
                disabled={!canAddBuyers}
                onClick={() => {
                  if (!isBuyerOnly) {
                    toast.error("Vendors and Admins cannot purchase products");
                    return;
                  }
                  add(product, qty, selectedVariant ?? variants[0]);
                  navigate("/checkout");
                }}
                className="h-9 px-4 rounded-full bg-accent text-accent-foreground text-xs font-bold hover:opacity-95 disabled:opacity-50 whitespace-nowrap"
              >
                Buy Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Lightbox Modal */}
      {lightboxImageIndex !== null && lightboxImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm select-none"
          onClick={() => setLightboxImageIndex(null)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxImageIndex(null)}
            className="absolute top-4 right-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/10"
            aria-label="Close"
          >
            <X size={24} />
          </button>

          {/* Navigation and Image Container */}
          <div className="relative w-full max-w-4xl px-12 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {/* Prev button */}
            {lightboxImageIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxImageIndex(lightboxImageIndex - 1);
                }}
                className="absolute left-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/10"
                aria-label="Previous"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Active Image */}
            <img
              src={lightboxImages[lightboxImageIndex]}
              alt="Review attachment enlarged"
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl animate-scale-in"
            />

            {/* Next button */}
            {lightboxImageIndex < lightboxImages.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxImageIndex(lightboxImageIndex + 1);
                }}
                className="absolute right-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/10"
                aria-label="Next"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Image index counter */}
          <div className="mt-4 text-xs font-semibold text-white/60 tracking-wider">
            {lightboxImageIndex + 1} / {lightboxImages.length}
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default ProductPage;
