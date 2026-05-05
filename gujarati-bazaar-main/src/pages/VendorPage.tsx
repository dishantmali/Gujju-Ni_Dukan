import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Calendar, MapPin, Package } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ProductGrid } from "@/components/ProductGrid";
import { vendors } from "@/data/vendors";
import { getProductsByVendor } from "@/data/products";
import { StarRating } from "@/components/StarRating";

const VendorPage = () => {
  const { id = "" } = useParams();
  const vendor = vendors.find((v) => v.id === id);
  const items = useMemo(() => getProductsByVendor(id), [id]);
  const [tab, setTab] = useState<"all" | "about">("all");

  if (!vendor) return <PageShell><div className="container py-20 text-center">Vendor not found.</div></PageShell>;

  return (
    <PageShell>
      <div className="container pt-6">
        <nav className="text-xs text-muted-foreground inline-flex items-center gap-1.5 mb-4">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight size={12} />
          <span className="text-foreground">{vendor.name}</span>
        </nav>

        <div className="rounded-3xl bg-gradient-vendor p-6 sm:p-8 text-primary-foreground shadow-lift">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-card text-primary grid place-items-center font-display font-bold text-2xl shadow-card shrink-0">
              {vendor.initials}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold">{vendor.name}</h1>
              <p className="text-primary-foreground/80 text-sm mt-1">{vendor.tagline}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-primary-foreground/85">
                <span className="inline-flex items-center gap-1"><StarRating value={vendor.rating} size={12} /> {vendor.rating}</span>
                <span className="inline-flex items-center gap-1"><MapPin size={12} /> {vendor.city}</span>
                <span className="inline-flex items-center gap-1"><Calendar size={12} /> Joined {vendor.joined}</span>
                <span className="inline-flex items-center gap-1"><Package size={12} /> {items.length} products</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-b border-border">
          <div className="flex gap-1">
            {[
              { id: "all", label: `All Products (${items.length})` },
              { id: "about", label: "About Store" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >{t.label}</button>
            ))}
          </div>
        </div>

        <div className="py-6">
          {tab === "all" ? (
            <ProductGrid products={items} />
          ) : (
            <div className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">{vendor.name}</strong> has been serving authentic Gujarati products from {vendor.city} since {vendor.joined}.
                Our products are made with traditional methods passed down generations, using locally sourced ingredients and time-honoured techniques.
              </p>
              <p className="mt-3">
                Every order is hand-packed and shipped fresh. We take immense pride in bringing the flavours and crafts of Gujarat to homes across India.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default VendorPage;
