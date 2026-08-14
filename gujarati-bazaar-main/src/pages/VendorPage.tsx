import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, MapPin, Package, Phone, Mail, Store, ShieldCheck, Award, Building2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ProductGrid } from "@/components/ProductGrid";
import { StarRating } from "@/components/StarRating";
import { vendors as staticVendors } from "@/data/vendors";
import { getProductsByVendor as getStaticProductsByVendor } from "@/data/products";
import type { Product, Vendor } from "@/data/types";
import api from "@/lib/api";
import { mapApiProduct } from "@/lib/mapApiProduct";

const MEDIA_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:8000";

function normalizeMediaUrl(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${MEDIA_BASE_URL}${raw}`;
  if (raw.startsWith("media/")) return `${MEDIA_BASE_URL}/${raw}`;
  return raw;
}

const VendorPage = () => {
  const { id = "" } = useParams();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tab, setTab] = useState<"all" | "about">("all");

  useEffect(() => {
    let isMounted = true;
    const fetchVendorData = async () => {
      setLoading(true);
      try {
        // 1. Fetch vendor profile detail from API
        const vendorRes: any = await api.get(`/vendors/${id}/`);
        
        if (vendorRes && vendorRes.id) {
          const apiVendor: Vendor = {
            id: String(vendorRes.id),
            name: String(vendorRes.name || vendorRes.shop_name || "Vendor"),
            tagline: String(vendorRes.tagline || ""),
            rating: Number(vendorRes.average_rating || 0),
            joined: "2024",
            city: [vendorRes.city, vendorRes.state].filter(Boolean).join(", ") || String(vendorRes.city || ""),
            state: String(vendorRes.state || ""),
            pincode: String(vendorRes.pincode || ""),
            address_line_1: String(vendorRes.address_line_1 || ""),
            address_line_2: String(vendorRes.address_line_2 || ""),
            phone: String(vendorRes.phone || ""),
            email: String(vendorRes.email || ""),
            contact_details: String(vendorRes.contact_details || ""),
            initials: String(vendorRes.initials || (vendorRes.name ? vendorRes.name.slice(0, 2).toUpperCase() : "VN")),
            logo: vendorRes.logo ? normalizeMediaUrl(vendorRes.logo) : undefined,
          };

          // 2. Fetch products by this vendor from API
          let vendorProducts: Product[] = [];
          try {
            const prodsRes: any = await api.get(`/products/?vendor=${id}&page_size=100`);
            const rawItems = Array.isArray(prodsRes) ? prodsRes : (prodsRes?.results || []);
            vendorProducts = rawItems.map((p: any) => mapApiProduct(p));
          } catch (pErr) {
            console.warn("Failed to fetch products for vendor from API:", pErr);
          }

          if (isMounted) {
            setVendor(apiVendor);
            setItems(vendorProducts);
            setLoading(false);
          }
          return;
        }
      } catch (err) {
        console.warn("Vendor API lookup failed or fallback needed for ID:", id, err);
      }

      // 3. Fallback to static datasets if API doesn't find vendor ID
      const staticVendor = staticVendors.find((v) => v.id === id);
      if (staticVendor && isMounted) {
        setVendor(staticVendor);
        setItems(getStaticProductsByVendor(id));
      } else if (isMounted) {
        setVendor(null);
        setItems([]);
      }
      if (isMounted) setLoading(false);
    };

    fetchVendorData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <PageShell>
        <div className="container pt-6 pb-12 animate-pulse space-y-6">
          <div className="h-4 w-32 bg-muted rounded"></div>
          <div className="h-48 rounded-3xl bg-muted/60"></div>
          <div className="h-10 w-64 bg-muted rounded"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-muted/40"></div>
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  if (!vendor) {
    return (
      <PageShell>
        <div className="container py-20 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-secondary grid place-items-center mx-auto text-muted-foreground">
            <Store size={32} />
          </div>
          <h2 className="font-display text-2xl font-bold">Vendor Not Found</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            We couldn't find the vendor shop you are looking for. It may have been relocated or is temporarily offline.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-brown-mid transition-colors mt-2"
          >
            Back to Home
          </Link>
        </div>
      </PageShell>
    );
  }

  const fullAddress = [
    vendor.address_line_1,
    vendor.address_line_2,
    vendor.city,
    vendor.state,
    vendor.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <PageShell>
      <div className="container pt-6 pb-12">
        {/* Breadcrumbs */}
        <nav className="text-xs text-muted-foreground inline-flex items-center gap-1.5 mb-4">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight size={12} />
          <span className="text-foreground">{vendor.name}</span>
        </nav>

        {/* Vendor Profile Header Card */}
        <div className="rounded-3xl bg-gradient-vendor p-6 sm:p-8 text-primary-foreground shadow-lift relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
            {/* Logo / Initials */}
            {vendor.logo ? (
              <img
                src={vendor.logo}
                alt={vendor.name}
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover bg-card shadow-card shrink-0 border-2 border-white/40"
              />
            ) : (
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-card text-primary grid place-items-center font-display font-bold text-2xl sm:text-3xl shadow-card shrink-0">
                {vendor.initials}
              </div>
            )}

            {/* Main Info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">{vendor.name}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                  <ShieldCheck size={12} /> Verified Vendor
                </span>
              </div>

              {vendor.tagline && (
                <p className="text-primary-foreground/85 text-sm mt-1 font-medium">{vendor.tagline}</p>
              )}

              {/* Quick Info Badges */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-primary-foreground/90 font-medium">
                {vendor.rating > 0 && (
                  <span className="inline-flex items-center gap-1 bg-black/15 px-2.5 py-1 rounded-full">
                    <StarRating value={vendor.rating} size={12} /> {vendor.rating} Rating
                  </span>
                )}
                {vendor.city && (
                  <span className="inline-flex items-center gap-1 bg-black/15 px-2.5 py-1 rounded-full">
                    <MapPin size={12} /> {vendor.city}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 bg-black/15 px-2.5 py-1 rounded-full">
                  <Package size={12} /> {items.length} Products
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Switcher */}
        <div className="mt-6 border-b border-border">
          <div className="flex gap-1">
            {[
              { id: "all", label: `All Products (${items.length})` },
              { id: "about", label: "Store & Contact Info" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="py-6">
          {tab === "all" ? (
            items.length > 0 ? (
              <ProductGrid products={items} />
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border border-border">
                <Package size={36} className="mx-auto mb-2 opacity-50" />
                <p className="font-medium text-sm">No products currently listed by this vendor.</p>
              </div>
            )
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Card 1: Contact Information */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <Building2 size={20} className="text-primary" />
                  <h3 className="font-display font-semibold text-lg">Contact Information</h3>
                </div>

                <div className="space-y-3.5 text-sm">
                  {/* Email */}
                  {vendor.email && (
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 mt-0.5">
                        <Mail size={18} />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground font-medium block">Email Address</span>
                        <a
                          href={`mailto:${vendor.email}`}
                          className="font-medium text-sm text-foreground hover:text-primary transition-colors inline-block mt-0.5"
                        >
                          {vendor.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Location Address */}
                  {(fullAddress || vendor.city) && (
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 mt-0.5">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground font-medium block">Store Location / Address</span>
                        <p className="text-sm text-foreground leading-relaxed mt-0.5 font-medium">
                          {fullAddress || vendor.city}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Additional Contact Notes (showing only non-phone text) */}
                  {vendor.contact_details &&
                    vendor.contact_details.trim() !== vendor.phone?.trim() &&
                    !/^\+?\d{10,12}$/.test(vendor.contact_details.trim()) && (
                      <div className="pt-2 border-t border-border mt-2">
                        <span className="text-xs text-muted-foreground font-medium block">Additional Details</span>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-1 whitespace-pre-line">
                          {vendor.contact_details}
                        </p>
                      </div>
                    )}
                </div>
              </div>

              {/* Card 2: About & Authenticity Guarantee */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <Award size={20} className="text-primary" />
                  <h3 className="font-display font-semibold text-lg">About Store & Quality Guarantee</h3>
                </div>

                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    <strong className="text-foreground">{vendor.name}</strong> is an authorized and verified seller on Gujju Ni Dukan.
                  </p>
                  <p>
                    {vendor.tagline
                      ? vendor.tagline
                      : "We bring authentic, high-quality products directly from craftsman hands and trusted kitchens in Gujarat."}
                  </p>
                  <div className="pt-3 border-t border-border space-y-2.5">
                    <div className="flex items-center gap-2.5 text-xs text-foreground font-medium">
                      <ShieldCheck size={16} className="text-success shrink-0" />
                      <span>100% Authentic & Quality Inspected Products</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-foreground font-medium">
                      <Package size={16} className="text-primary shrink-0" />
                      <span>Carefully hand-packed & shipped directly from {vendor.city || "Gujarat"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default VendorPage;
