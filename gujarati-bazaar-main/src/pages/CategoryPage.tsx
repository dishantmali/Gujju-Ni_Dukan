import { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, X, SlidersHorizontal } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ProductGrid } from "@/components/ProductGrid";
import { FilterSidebar, Filters, defaultFilters } from "@/components/FilterSidebar";
import { categories, vendors } from "@/data/vendors";
import { getProductsByCategory, products } from "@/data/products";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CategoryPills } from "@/components/CategoryPills";
import api from "@/lib/api";
import { mapApiProduct } from "@/lib/mapApiProduct";
import { CategoryIcon } from "@/components/CategoryIcon";


type Sort = "relevance" | "price-asc" | "price-desc" | "newest" | "top-rated";

const CategoryPage = () => {
  const { slug = "" } = useParams();
  const [cat, setCat] = useState<any>(null);

  const [all, setAll] = useState<any[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sort, setSort] = useState<Sort>("relevance");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 16;

  const fetchCategoryProducts = async () => {
    try {
      setLoading(true);
      const url = slug === "all" ? '/products/' : `/products/?category=${slug}`;
      const res: any = await api.get(url);

      const mapProduct = (p: any) => mapApiProduct(p as Record<string, unknown>);

      const prods = (Array.isArray(res) ? res : res.results || []).map(mapProduct);
      const fallback = products.filter(p => slug === "all" || p.category === slug);

      console.log("[CategoryPage] slug:", slug);
      console.log("[CategoryPage] API response type:", Array.isArray(res) ? "array" : "object", "| results count:", Array.isArray(res) ? res.length : (res.results || []).length);
      console.log("[CategoryPage] mapped prods:", prods.length, "| fallback mock:", fallback.length);
      console.log("[CategoryPage] using:", prods.length > 0 ? "API products" : "mock fallback");

      setAll(prods.length > 0 ? prods : fallback);
    } catch (err) {
      console.error("[CategoryPage] API error:", err);
      const fallback = products.filter(p => slug === "all" || p.category === slug);
      console.log("[CategoryPage] catch fallback mock:", fallback.length);
      setAll(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setFilters(defaultFilters);
    setPage(1);
    fetchCategoryProducts();
    
    if (slug !== "all") {
      api.get(`/categories/`)
        .then((res: any) => {
          const found = res.find((c: any) => (c.slug || c.id.toString()) === slug);
          setCat(found);
        })
        .catch(err => console.error("Failed to fetch category details:", err));
    } else {
      setCat({ name: "All Products", icon: "FaSparkles" });
    }
  }, [slug]);


  useEffect(() => {
    setPage(1);
  }, [filters, sort]);

  useEffect(() => {
    // Only smooth scroll if not on page 1 to prevent double scroll on initial load
    if (page > 1) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page]);

  const filtered = useMemo(() => {
    let r = all.filter((p) =>
      p.price >= filters.price[0] && p.price <= filters.price[1] &&
      p.rating >= filters.minRating &&
      (filters.vendorIds.length === 0 || filters.vendorIds.includes(p.vendorId)) &&
      (!filters.inStock || p.inStock)
    );
    switch (sort) {
      case "price-asc": r = [...r].sort((a, b) => a.price - b.price); break;
      case "price-desc": r = [...r].sort((a, b) => b.price - a.price); break;
      case "newest": r = [...r].sort((a, b) => Number(b.isNew) - Number(a.isNew)); break;
      case "top-rated": r = [...r].sort((a, b) => b.rating - a.rating); break;
    }
    return r;
  }, [all, filters, sort]);

  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  const vendorIdsInUse = useMemo(() => Array.from(new Set(all.map((p) => p.vendorId))), [all]);

  const activeChips = [
    ...(filters.minRating > 0 ? [{ key: "rating", label: `${filters.minRating}★ & up`, clear: () => setFilters({ ...filters, minRating: 0 }) }] : []),
    ...(filters.inStock ? [{ key: "stock", label: "In stock", clear: () => setFilters({ ...filters, inStock: false }) }] : []),
    ...filters.vendorIds.map((id) => ({
      key: `v-${id}`,
      label: vendors.find((v) => v.id === id)?.name || "",
      clear: () => setFilters({ ...filters, vendorIds: filters.vendorIds.filter((x) => x !== id) }),
    })),
  ];

  return (
    <PageShell>
      <div className="container pt-6 pb-2">
        <nav className="text-xs text-muted-foreground inline-flex items-center gap-1.5 mb-3">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight size={12} />
          <span className="text-foreground">{cat?.name || (slug === "all" ? "All Products" : slug)}</span>
        </nav>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold inline-flex items-center gap-3">
          <span className="text-brown-mid"><CategoryIcon name={cat?.icon || 'FaSparkles'} size={32} /></span> {cat?.name || (slug === "all" ? "All Products" : "Category")}
        </h1>

        <p className="text-sm text-muted-foreground mt-1">{all.length} products</p>
        <div className="mt-5"><CategoryPills activeSlug={slug} /></div>
      </div>

      <div className="container grid lg:grid-cols-[260px_1fr] gap-8 py-6">
        <div className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl bg-card border border-border/60 p-5 shadow-sm">
            <FilterSidebar value={filters} onChange={setFilters} vendorIdsInUse={vendorIdsInUse} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <Sheet>
              <SheetTrigger className="lg:hidden inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-secondary text-sm font-medium">
                <SlidersHorizontal size={14} /> Filters
              </SheetTrigger>
    <SheetContent side="left" className="w-80 overflow-y-auto">
      <SheetHeader className="text-left">
        <SheetTitle className="font-display text-lg font-semibold">Filters</SheetTitle>
      </SheetHeader>
      <div className="mt-4">
        <FilterSidebar value={filters} onChange={setFilters} vendorIdsInUse={vendorIdsInUse} />
      </div>
    </SheetContent>
            </Sheet>
            <p className="text-sm text-muted-foreground hidden sm:block">Showing {filtered.length} of {all.length}</p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="ml-auto h-9 px-3 pr-8 rounded-full bg-card border border-border text-sm focus:border-brown-light outline-none"
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
              <option value="top-rated">Top Rated</option>
            </select>
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeChips.map((c) => (
                <button
                  key={c.key}
                  onClick={c.clear}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-xs font-medium hover:bg-muted"
                >
                  {c.label} <X size={12} />
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 && !loading ? (
            <div className="text-center py-16 text-muted-foreground">No products match your filters.</div>
          ) : (
            <>
              <ProductGrid products={paginated} loading={loading} />
              {filtered.length > itemsPerPage && (
                <div className="flex justify-center items-center gap-4 mt-10">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-full border border-border disabled:opacity-50 text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted-foreground font-medium">
                    Page {page} of {Math.ceil(filtered.length / itemsPerPage)}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(Math.ceil(filtered.length / itemsPerPage), p + 1))}
                    disabled={page >= Math.ceil(filtered.length / itemsPerPage)}
                    className="px-4 py-2 rounded-full border border-border disabled:opacity-50 text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default CategoryPage;
