import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X, Loader2, TrendingUp } from "lucide-react";
import { searchProducts } from "@/data/products";
import { Product } from "@/data/types";
import api from "@/lib/api";
import { mapApiProduct } from "@/lib/mapApiProduct";

const POPULAR_SEARCHES = [
  "Thepla",
  "Kaju Katli",
  "Pickles",
  "Patola Saree",
  "Dry Fruits",
  "Spices",
];

export const SearchBar = ({ compact = false }: { compact?: boolean }) => {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchBackend = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const res: any = await api.get(`/products/?search=${encodeURIComponent(term)}&limit=6`);
      const fetched = (res.results || res || []).map((p: any) => mapApiProduct(p));
      return fetched;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const local = searchProducts(q).slice(0, 6);
    setResults(local);
    const t = setTimeout(async () => {
      const backend = await fetchBackend(q.trim());
      const merged = [...local, ...backend].filter(
        (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
      );
      setResults(merged.slice(0, 8));
    }, 250);
    return () => clearTimeout(t);
  }, [q, fetchBackend]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q.trim())}`);
      setOpen(false);
    }
  };

  const onChip = (term: string) => {
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setOpen(false);
  };

  const showPanel = open && (results.length > 0 || (q.trim() && !loading) || (!q.trim() && open));

  return (
    <div ref={ref} className="relative w-full">
      <form onSubmit={onSubmit} className="relative flex items-center">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
        <input
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={compact ? "Search…" : "Search for theplas, pickles, sarees…"}
          className="w-full h-11 pl-11 pr-20 rounded-full bg-secondary/60 border border-transparent focus:bg-card focus:border-brown-light/50 focus:ring-2 focus:ring-accent/20 outline-none text-sm transition-all"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {q && (
            <button type="button" onClick={() => setQ("")} className="h-7 w-7 grid place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <X size={14} />
            </button>
          )}
          <button
            type="submit"
            className="h-7 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-brown-mid transition-colors"
          >
            {loading && q.trim() ? <Loader2 size={12} className="animate-spin" /> : "Search"}
          </button>
        </div>
      </form>

      {showPanel && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 rounded-2xl bg-card border border-border shadow-lift overflow-hidden animate-scale-in origin-top">
          {/* Results */}
          {results.length > 0 && (
            <ul>
              {results.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/product/${p.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/60 transition-colors"
                  >
                    <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover bg-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{typeof p.category === "string" ? p.category.replace("-", " ") : (p.category as any)?.name || "Product"}</div>
                    </div>
                    <div className="text-sm font-semibold shrink-0">₹{p.price?.toLocaleString("en-IN") ?? p.price}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Empty state with query */}
          {q.trim() && results.length === 0 && !loading && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">No products found for "{q}"</p>
              <button
                type="button"
                onClick={onSubmit as any}
                className="mt-2 text-xs text-accent font-medium hover:underline"
              >
                View all search results →
              </button>
            </div>
          )}

          {/* Popular searches when empty */}
          {!q.trim() && (
            <div className="px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
                <TrendingUp size={12} /> Popular Searches
              </p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => onChip(term)}
                    className="px-3 py-1.5 rounded-full text-xs bg-secondary/60 text-foreground hover:bg-secondary border border-border/50 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer CTA when there are results */}
          {results.length > 0 && (
            <button
              type="button"
              onClick={onSubmit as any}
              className="block w-full text-center text-sm py-2.5 bg-secondary/40 text-brown-mid font-medium hover:bg-secondary border-t border-border/50"
            >
              See all results for "{q}"
            </button>
          )}
        </div>
      )}
    </div>
  );
};
