import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, X, SlidersHorizontal } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ProductGrid } from "@/components/ProductGrid";
import { FilterSidebar, Filters, defaultFilters } from "@/components/FilterSidebar";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryPills } from "@/components/CategoryPills";
import api from "@/lib/api";
import { mapApiProduct } from "@/lib/mapApiProduct";
import { CategoryIcon } from "@/components/CategoryIcon";


type Sort = "relevance" | "price-asc" | "price-desc" | "newest" | "top-rated";

const CategoryPage = () => {
  const { slug: routeSlug = "" } = useParams();
  const [currentSlug, setCurrentSlug] = useState(routeSlug || "all");
  const [cat, setCat] = useState<any>(null);

  const pillsRef = useRef<HTMLDivElement | null>(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    let raf = 0;
    let active = false;
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = pillsRef.current;
        if (!el) return;
        const { top } = el.getBoundingClientRect();
        const navbarHeight = window.innerWidth >= 768 ? 72 : 130;
        if (top <= navbarHeight) {
          if (!active) {
            active = true;
            setIsSticky(true);
          }
        } else {
          if (active) {
            active = false;
            setIsSticky(false);
          }
        }
      });
    };
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  const [all, setAll] = useState<any[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sort, setSort] = useState<Sort>("relevance");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 16;

  // Sync state if route parameter changes externally
  useEffect(() => {
    if (routeSlug) {
      setCurrentSlug(routeSlug);
    }
  }, [routeSlug]);

  // Sync state on browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const parts = window.location.pathname.split("/");
      const pageSlug = parts[parts.length - 1] || "all";
      setCurrentSlug(pageSlug);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleCategoryChange = (newSlug: string) => {
    if (newSlug === currentSlug) return;
    const targetPath = newSlug === "all" ? "/category/all" : `/category/${newSlug}`;
    window.history.pushState(null, "", targetPath);
    setCurrentSlug(newSlug);
  };

  const fetchCategoryProducts = async () => {
    try {
      setLoading(true);
      const url = currentSlug === "all" ? '/products/' : `/products/?category=${currentSlug}`;
      const res: any = await api.get(url);

      const mapProduct = (p: any) => mapApiProduct(p as Record<string, unknown>);

      const prods = (Array.isArray(res) ? res : res.results || []).map(mapProduct);

      console.log("[CategoryPage] slug:", currentSlug);
      console.log("[CategoryPage] API response type:", Array.isArray(res) ? "array" : "object", "| results count:", Array.isArray(res) ? res.length : (res.results || []).length);

      setAll(prods);
    } catch (err) {
      console.error("[CategoryPage] API error:", err);
      setAll([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setFilters(defaultFilters);
    setPage(1);
    fetchCategoryProducts();
    
    if (currentSlug !== "all") {
      api.get(`/categories/`)
        .then((res: any) => {
          const found = res.find((c: any) => (c.slug || c.id.toString()) === currentSlug);
          setCat(found);
        })
        .catch(err => console.error("Failed to fetch category details:", err));
    } else {
      setCat({ name: "All Products", icon: "lucide:sparkles" });
    }
  }, [currentSlug]);


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

  const vendorNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    all.forEach((p) => { if (p.vendorId && p.vendor_shop) map[p.vendorId] = p.vendor_shop; });
    return map;
  }, [all]);

  const activeChips = [
    ...(filters.minRating > 0 ? [{ key: "rating", label: `${filters.minRating}★ & up`, clear: () => setFilters({ ...filters, minRating: 0 }) }] : []),
    ...(filters.inStock ? [{ key: "stock", label: "In stock", clear: () => setFilters({ ...filters, inStock: false }) }] : []),
    ...filters.vendorIds.map((id) => ({
      key: `v-${id}`,
      label: vendorNameMap[id] || `Vendor ${id}`,
      clear: () => setFilters({ ...filters, vendorIds: filters.vendorIds.filter((x) => x !== id) }),
    })),
  ];

  return (
    <PageShell>
      <div className="container pt-6 pb-2">
        {/* Premium Warm Gradient Glassmorphic Header Card */}
        {/* Premium Compact Warm Gradient Glassmorphic Header Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50/70 via-orange-50/50 to-amber-50/30 border border-amber-100/50 p-4 sm:py-4.5 sm:px-6 shadow-sm mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Decorative blur spheres */}
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-amber-200/20 to-orange-200/20 blur-xl pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 w-18 h-18 rounded-full bg-gradient-to-tr from-amber-200/10 to-orange-200/10 blur-lg pointer-events-none" />

          {/* Left section: Breadcrumb & products count */}
          <div className="relative flex flex-col gap-1">
            <nav className="text-xs font-medium text-amber-800/80 inline-flex items-center gap-1.5">
              <Link to="/" className="hover:text-amber-950 transition-colors">Home</Link>
              <ChevronRight size={10} className="text-amber-600/50" />
              <span className="text-amber-900 font-semibold">{cat?.name || (currentSlug === "all" ? "All Products" : currentSlug)}</span>
            </nav>
            <p className="text-xs text-amber-800/80 mt-0.5">
              {all.length} {all.length === 1 ? 'product' : 'products'}
            </p>
          </div>

          {/* Right section: Icon & Title (Right-aligned as requested) */}
          <div className="relative flex items-center justify-end gap-3 self-end md:self-center">
            <div className="h-10 w-10 rounded-xl bg-amber-100/80 border border-amber-200/60 grid place-items-center shadow-inner text-brown-mid shrink-0 hover:scale-105 transition-transform duration-300">
              <CategoryIcon name={cat?.icon || 'lucide:sparkles'} size={20} />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-amber-950 tracking-tight">
              {cat?.name || (currentSlug === "all" ? "All Products" : "Category")}
            </h1>
          </div>
        </div>

        {/* Pills container */}
        <div
          ref={pillsRef}
          className={`mb-4 transition-opacity duration-300 ${isSticky ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <CategoryPills activeSlug={currentSlug} onSelectCategory={handleCategoryChange} layoutId="inflow-active-pill" />
        </div>
      </div>

      {createPortal(
        <div
          className={`fixed top-[130px] md:top-[72px] left-0 right-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-lg py-2 sm:py-2.5 shadow-sm transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isSticky
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1 pointer-events-none"
            }`}
        >
          <div className="container">
            <CategoryPills activeSlug={currentSlug} onSelectCategory={handleCategoryChange} layoutId="portal-active-pill" />
          </div>
        </div>,
        document.body
      )}

      <div className="container grid lg:grid-cols-[260px_1fr] gap-8 py-6">
        <div className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl bg-card border border-border/60 p-6 shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-b from-card to-amber-50/10">
            <FilterSidebar value={filters} onChange={setFilters} vendorIdsInUse={vendorIdsInUse} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <Sheet>
              <SheetTrigger className="lg:hidden inline-flex items-center gap-1.5 px-4 h-9.5 rounded-full bg-secondary/80 hover:bg-secondary border border-border/40 hover:border-brown-light/40 text-sm font-semibold transition-all shadow-sm">
                <SlidersHorizontal size={14} className="text-brown-mid" /> Filters
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
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="ml-auto h-9.5 w-[190px] rounded-full bg-card border border-border text-sm focus:ring-brown-light/40 hover:border-brown-light/60 hover:bg-secondary/40 transition-all shadow-sm">
                <SelectValue placeholder="Sort: Relevance" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="relevance">Sort: Relevance</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="top-rated">Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {activeChips.map((c) => (
                <button
                  key={c.key}
                  onClick={c.clear}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200/50 text-xs font-semibold shadow-sm transition-all hover:scale-102 hover:shadow"
                >
                  {c.label} <X size={12} className="text-amber-700/80" />
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
