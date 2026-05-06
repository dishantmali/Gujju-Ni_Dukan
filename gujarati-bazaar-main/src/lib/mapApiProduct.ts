import type { Product, ProductVariant } from "@/data/types";

const MEDIA_BASE_URL = "http://localhost:8000";

function normalizeMediaUrl(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${MEDIA_BASE_URL}${raw}`;
  if (raw.startsWith("media/")) return `${MEDIA_BASE_URL}/${raw}`;
  return raw;
}

/** Normalize a product payload from the Django API for the storefront `Product` type. */
export function mapApiProduct(p: Record<string, unknown>): Product {
  const rawVariants = Array.isArray(p.variants)
    ? (p.variants as Array<Record<string, unknown>>)
    : undefined;
  const variants: ProductVariant[] | undefined = rawVariants?.map((v) => {
    const rawImages = v.images as Array<Record<string, unknown>> | undefined;
    const variantImages =
      rawImages
        ?.map((img) => normalizeMediaUrl(img.image))
        .filter(Boolean) ?? [];
    const variantPrice = parseFloat(String(v.price ?? 0));
    const variantStock = Number(v.stock_quantity ?? 0);
    return {
      id: String(v.id),
      sku: String(v.sku ?? ""),
      image: normalizeMediaUrl(v.image),
      images: variantImages.length > 0 ? variantImages : undefined,
      price: Number.isFinite(variantPrice) ? variantPrice : 0,
      stock_quantity: Number.isFinite(variantStock) ? variantStock : 0,
      option_values: (() => {
        const raw = v.option_values;
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
          return raw as Record<string, string>;
        }
        if (typeof raw === "string") {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              return parsed as Record<string, string>;
            }
          } catch { /* ignore */ }
        }
        return {};
      })(),
    };
  });
  const rawProductImages = Array.isArray(p.product_images)
    ? (p.product_images as Array<Record<string, unknown>>)
    : undefined;
  const productImages =
    rawProductImages
      ?.map((img) => normalizeMediaUrl(img.image))
      .filter(Boolean) ?? [];

  const basePriceRaw = parseFloat(String(p.price ?? 0));
  const basePrice = Number.isFinite(basePriceRaw) ? basePriceRaw : 0;
  const listingPrice =
    variants && variants.length > 0
      ? Math.min(...variants.map((v) => v.price).filter((n) => Number.isFinite(n) && n >= 0))
      : basePrice;

  return {
    ...(p as unknown as Product),
    id: String(p.id),
    name: String(p.name ?? ""),
    description: String(p.description ?? ""),
    price: listingPrice,
    originalPrice: listingPrice * 1.2,
    discount: 20,
    rating: Number((p as { average_rating?: number }).average_rating ?? (p as { rating?: number }).rating ?? 0),
    reviewCount: Number((p as { review_count?: number }).review_count ?? 0),
    vendorId:
      (p as { vendor?: number | string }).vendor != null
        ? String((p as { vendor?: number | string }).vendor)
        : "",
    vendor_shop: String((p as { vendor_shop?: string }).vendor_shop ?? ""),
    category: (() => {
      const name = String((p as { category_name?: string }).category_name ?? "");
      const raw = String((p as { category?: unknown }).category ?? "");
      if (name.trim()) return name.trim();
      // If raw category looks like a numeric ID and we have no name, return empty to avoid showing "9"
      return /^\d+$/.test(raw) ? "" : raw;
    })(),
    image: normalizeMediaUrl(p.image),
    product_images: productImages,
    stock_quantity: (() => {
      const rawStock = Number((p as { stock_quantity?: number }).stock_quantity ?? 0);
      return Number.isFinite(rawStock) ? rawStock : 0;
    })(),
    inStock:
      variants && variants.length > 0
        ? variants.some((v) => v.stock_quantity > 0)
        : (() => {
            const rawStock = Number((p as { stock_quantity?: number }).stock_quantity ?? 0);
            return Number.isFinite(rawStock) ? rawStock > 0 : false;
          })(),
    isNew: true,
    isTrending: true,
    specs: ((p as { specs?: Record<string, string> }).specs as Record<string, string>) || {},
    reviews: ((p as { reviews?: Product["reviews"] }).reviews as Product["reviews"]) || [],
    variants,
  };
}
