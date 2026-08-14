import type { Product, ProductVariant } from "@/data/types";

const MEDIA_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:8000";

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
      originalPrice: Number.isFinite(parseFloat(String((v as any).originalPrice ?? v.price ?? 0))) 
        ? parseFloat(String((v as any).originalPrice ?? v.price ?? 0)) 
        : undefined,
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

  let price = Number.isFinite(parseFloat(String(p.price ?? 0))) ? parseFloat(String(p.price ?? 0)) : 0;
  let originalPrice = Number.isFinite(parseFloat(String((p as any).originalPrice ?? p.price ?? 0))) 
    ? parseFloat(String((p as any).originalPrice ?? p.price ?? 0)) 
    : price;

  if (variants && variants.length > 0) {
    price = Math.min(...variants.map((v) => v.price).filter((n) => Number.isFinite(n) && n >= 0));
    // Provide a fallback to v.price if v.originalPrice isn't somehow available
    originalPrice = Math.min(...(rawVariants || []).map((v: any) => 
      parseFloat(String(v.originalPrice ?? v.price ?? 0))
    ).filter((n) => Number.isFinite(n) && n > 0));
  }

  return {
    id: String(p.id),
    name: String(p.name ?? ""),
    description: String(p.description ?? ""),
    price,
    originalPrice,
    discount: (p as any).discount ? Number((p as any).discount) : 0,
    rating: Number((p as { average_rating?: number }).average_rating ?? (p as { rating?: number }).rating ?? 0),
    reviewCount: Number((p as { review_count?: number }).review_count ?? 0),
    vendorId:
      (p as { vendor?: number | string }).vendor != null
        ? String((p as { vendor?: number | string }).vendor)
        : "",
    vendor_shop: String((p as { vendor_shop?: string }).vendor_shop ?? ""),
    categoryId: String((p as { category?: unknown }).category ?? ""),
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
    isNew: p.is_new !== undefined ? Boolean(p.is_new) : true,
    isTrending: true,
    specs: ((p as { specs?: Record<string, string> }).specs as Record<string, string>) || {},
    reviews: Array.isArray(p.reviews)
      ? p.reviews.map((r: any) => ({
          id: String(r.id),
          user: String(r.reviewer_name || r.user_name || "Anonymous"),
          rating: Number(r.rating ?? 5),
          comment: String(r.review_text ?? ""),
          date: new Date(r.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          images: Array.isArray(r.images)
            ? r.images.map((img: any) => normalizeMediaUrl(img.image))
            : [],
        }))
      : [],
    variants,
    vendor_details: p.vendor_details ? {
      id: String((p.vendor_details as any).id),
      name: String((p.vendor_details as any).name ?? ""),
      tagline: String((p.vendor_details as any).tagline ?? ""),
      rating: Number((p.vendor_details as any).average_rating ?? 0),
      joined: "",
      city: String((p.vendor_details as any).city ?? ""),
      state: String((p.vendor_details as any).state ?? ""),
      pincode: String((p.vendor_details as any).pincode ?? ""),
      address_line_1: String((p.vendor_details as any).address_line_1 ?? ""),
      address_line_2: String((p.vendor_details as any).address_line_2 ?? ""),
      phone: String((p.vendor_details as any).phone ?? ""),
      email: String((p.vendor_details as any).email ?? ""),
      contact_details: String((p.vendor_details as any).contact_details ?? ""),
      initials: String((p.vendor_details as any).initials ?? ""),
      logo: (p.vendor_details as any).logo ? normalizeMediaUrl((p.vendor_details as any).logo) : undefined,
    } : undefined,
  };
}
