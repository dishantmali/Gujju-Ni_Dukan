import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ProductGrid } from "@/components/ProductGrid";
import { FilterSidebar, Filters, defaultFilters } from "@/components/FilterSidebar";
import { searchProducts } from "@/data/products";
import { EmptyState } from "@/components/EmptyState";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";

const SearchPage = () => {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(t);
  }, [q]);

  const all = useMemo(() => searchProducts(q), [q]);
  const filtered = useMemo(() => all.filter((p) =>
    p.price >= filters.price[0] && p.price <= filters.price[1] &&
    p.rating >= filters.minRating &&
    (filters.vendorIds.length === 0 || filters.vendorIds.includes(p.vendorId)) &&
    (!filters.inStock || p.inStock)
  ), [all, filters]);

  const vendorIdsInUse = useMemo(() => Array.from(new Set(all.map((p) => p.vendorId))), [all]);

  return (
    <PageShell>
      <div className="container py-8">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Search results</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Showing {filtered.length} {filtered.length === 1 ? "result" : "results"} for "<span className="text-foreground font-medium">{q}</span>"
        </p>

        {all.length === 0 ? (
          <EmptyState
            icon={<Search size={32} />}
            title="No results found"
            description={`We couldn't find anything matching "${q}". Try a different keyword.`}
          />
        ) : (
          <div className="mt-6 grid lg:grid-cols-[260px_1fr] gap-8">
            <div className="hidden lg:block">
              <div className="sticky top-24 rounded-2xl bg-card border border-border/60 p-5 shadow-sm">
                <FilterSidebar value={filters} onChange={setFilters} vendorIdsInUse={vendorIdsInUse} />
              </div>
            </div>
            <div>
              <Sheet>
                <SheetTrigger className="lg:hidden inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-secondary text-sm font-medium mb-4">
                  <SlidersHorizontal size={14} /> Filters
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <h3 className="font-display text-lg font-semibold mb-4">Filters</h3>
                  <FilterSidebar value={filters} onChange={setFilters} vendorIdsInUse={vendorIdsInUse} />
                </SheetContent>
              </Sheet>
              <ProductGrid products={filtered} loading={loading} />
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default SearchPage;
