import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { searchProducts } from "@/data/products";
import { Product } from "@/data/types";

export const SearchBar = ({ compact = false }: { compact?: boolean }) => {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setResults(q ? searchProducts(q).slice(0, 6) : []);
  }, [q]);

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

  return (
    <div ref={ref} className="relative w-full">
      <form onSubmit={onSubmit} className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={compact ? "Search…" : "Search for theplas, pickles, sarees…"}
          className="w-full h-11 pl-11 pr-10 rounded-full bg-secondary/60 border border-transparent focus:bg-card focus:border-brown-light/50 focus:ring-2 focus:ring-accent/20 outline-none text-sm transition-all"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        )}
      </form>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 rounded-2xl bg-card border border-border shadow-lift overflow-hidden animate-scale-in origin-top">
          <ul>
            {results.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/product/${p.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/60 transition-colors"
                >
                  <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{p.category.replace("-", " ")}</div>
                  </div>
                  <div className="text-sm font-semibold">₹{p.price}</div>
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onSubmit as any}
            className="block w-full text-center text-sm py-2.5 bg-secondary/40 text-brown-mid font-medium hover:bg-secondary"
          >
            See all results for "{q}"
          </button>
        </div>
      )}
    </div>
  );
};
