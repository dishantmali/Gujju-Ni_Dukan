import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronRight,
  ShoppingBag,
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
import { motion } from "framer-motion";
import { PageShell } from "@/components/PageShell";
import { StarRating } from "@/components/StarRating";
import { PriceTag } from "@/components/PriceTag";
import { ProductCard } from "@/components/ProductCard";
import { getRelatedProducts } from "@/data/products";
import { vendors } from "@/data/vendors";
import { useCart } from "@/store/cart";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { mapApiProduct } from "@/lib/mapApiProduct";
import { Product, ProductVariant } from "@/data/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [qty, setQty] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState("");
  const [activeInfoTab, setActiveInfoTab] = useState<"details" | "specs" | "reviews" | "policy">("details");

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
        // Fallback to local mock data
        setRelatedProducts(getRelatedProducts(product, 8));
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
        <div className="container py-20 text-center">Loading product...</div>
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
  const isWish = wishlist.includes(product.id.toString());
  const related = relatedProducts.length > 0 ? relatedProducts : getRelatedProducts(product, 8);
  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayOriginal = displayPrice * 1.2;
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
      <div className="container pt-6 pb-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted-foreground inline-flex items-center gap-1.5 mb-5">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight size={12} />
          {product.category ? (
            <Link
              to={`/category/${product.category.toLowerCase().replace(/\s+/g, "-")}`}
              className="hover:text-foreground capitalize"
            >
              {product.category}
            </Link>
          ) : (
            <span className="capitalize">Uncategorized</span>
          )}
          <ChevronRight size={12} />
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Left: Images */}
          <div className="flex flex-col gap-3 lg:gap-4">
            {/* Mobile: main image first, then horizontal thumbnails */}
            <div className="lg:hidden relative aspect-[4/5] rounded-2xl overflow-hidden border border-border bg-card">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="h-full w-full object-cover"
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
            {/* Thumbnails — horizontal scroll on mobile, vertical column on desktop */}
            <div className="flex lg:hidden gap-2 overflow-x-auto pb-1 snap-x">
              {allImages.slice(0, 6).map((img, index) => (
                <button
                  key={`${img}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={cn(
                    "h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-xl overflow-hidden border transition-all snap-start",
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
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-border bg-card">
                {selectedImage && (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="h-full w-full object-cover"
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
            <div className="mt-2 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-4 border-b border-border pb-3 mb-3 overflow-x-auto">
                {(
                  [
                    ["details", "Product Details"],
                    ["specs", "Specifications"],
                    ["reviews", `Reviews (${product.reviewCount ?? 0})`],
                    ["policy", "Return Policy"],
                  ] as const
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
              {activeInfoTab === "specs" && (
                <dl className="grid sm:grid-cols-2 gap-3">
                  {Object.entries(product.specs ?? {}).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between border-b border-border py-2"
                    >
                      <dt className="text-sm text-muted-foreground">{k}</dt>
                      <dd className="text-sm font-medium">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
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
            <div className="mt-3 flex items-center gap-3">
              <StarRating value={product.rating} size={16} />
              <span className="text-sm text-muted-foreground">
                {product.rating} · {product.reviewCount} reviews
              </span>
            </div>

            {/* Price */}
            <div className="mt-5">
              <PriceTag
                price={displayPrice}
                originalPrice={displayOriginal}
                discount={product.discount}
                size="lg"
              />
              <p className="text-xs text-success mt-1.5">
                Inclusive of all taxes
              </p>
            </div>

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

                    {/* All variants grid */}
                    <div className="space-y-2 pt-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        All variants
                        <span className="ml-1.5 text-xs text-foreground">
                          ({variants.length})
                        </span>
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {variants.map((v) => {
                          const isActive =
                            String(v.id) === selectedVariantId;
                          const variantLabel = Object.entries(
                            v.option_values || {}
                          )
                            .map(([_, val]) => val)
                            .join(" / ");
                          const inStock = v.stock_quantity > 0;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => {
                                setSelectedVariantId(String(v.id));
                                setSelectedOptions(v.option_values || {});
                              }}
                              className={cn(
                                "rounded-xl border p-3 text-left transition-all",
                                isActive
                                  ? "border-brown-light bg-brown-light/5 ring-1 ring-brown-light"
                                  : "border-border hover:border-brown-light/50 bg-card",
                                !inStock && "opacity-60"
                              )}
                            >
                              <p className="text-xs font-medium text-foreground truncate">
                                {variantLabel || `Variant ${v.id}`}
                              </p>
                              <p className="text-sm font-bold text-foreground mt-1">
                                ₹{v.price.toLocaleString("en-IN")}
                              </p>
                              <p
                                className={cn(
                                  "text-[10px] font-medium mt-0.5",
                                  inStock ? "text-success" : "text-destructive"
                                )}
                              >
                                {inStock
                                  ? `${v.stock_quantity} left`
                                  : "Out of stock"}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
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

            {/* Stock Status */}
            <div className="mt-5 rounded-2xl border border-border bg-secondary/30 p-4">
              <div className="flex items-center gap-2 text-sm">
                {canAddBuyers ? (
                  <CheckCircle2 size={16} className={stockTone} />
                ) : (
                  <AlertCircle size={16} className="text-destructive" />
                )}
                <span className={cn("font-medium", stockTone)}>
                  {selectedStock <= 0
                    ? "Currently unavailable"
                    : selectedStock <= 10
                      ? `Only ${selectedStock} left in stock`
                      : `${selectedStock} available in stock`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {canAddBuyers
                  ? "Usually delivered within 3-5 days."
                  : "Please choose another variant or check back soon."}
              </p>
            </div>

            {/* Quantity + Add to Cart */}
            <div className="mt-5 flex items-center gap-3 flex-wrap">
              {/* Quantity stepper */}
              <div className="inline-flex items-center h-12 rounded-full border border-border bg-card overflow-hidden">
                <button
                  type="button"
                  disabled={qty <= 1}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="h-12 w-12 grid place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-sm font-semibold">
                  {qty}
                </span>
                <button
                  type="button"
                  disabled={selectedStock > 0 ? qty >= selectedStock : true}
                  onClick={() => setQty((q) => (selectedStock > 0 ? Math.min(q + 1, selectedStock) : q))}
                  className="h-12 w-12 grid place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
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
                className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-brown-mid transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-sm"
              >
                <ShoppingBag size={18} /> Add to Cart
              </motion.button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isBuyerOnly) {
                    toast.error("Vendors and Admins cannot use wishlist");
                    return;
                  }
                  toggleWish(product, isAuthenticated);
                }}
                aria-label="Wishlist"
                className="h-12 w-12 grid place-items-center rounded-full border border-border hover:border-brown-light transition-colors"
              >
                <Heart
                  size={20}
                  className={
                    isWish
                      ? "fill-destructive text-destructive"
                      : "text-brown-mid"
                  }
                />
              </button>
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
          <div className="pill-scroll overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
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

      {/* Mobile Sticky Footer */}
      <div className="lg:hidden sticky bottom-0 z-30 bg-card/95 backdrop-blur-md border-t border-border p-3 flex items-center gap-3">
        <div>
          <div className="font-display font-bold text-lg">
            ₹{displayPrice.toLocaleString("en-IN")}
          </div>
          {displayOriginal > displayPrice && (
            <div className="text-xs text-muted-foreground line-through">
              ₹{displayOriginal.toLocaleString("en-IN")}
            </div>
          )}
        </div>
        <button
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
            toast.success("Added to cart");
          }}
          className="ml-auto inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-50 disabled:pointer-events-none"
        >
          <ShoppingBag size={16} /> Add to Cart
        </button>
      </div>
    </PageShell>
  );
};

export default ProductPage;
