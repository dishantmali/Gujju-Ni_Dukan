import { useState, useMemo, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { StarRating } from "./StarRating";
import { X } from "lucide-react";
import api from "@/lib/api";

type VendorItem = { id: string; name: string };

export type Filters = {
  price: [number, number];
  minRating: number;
  vendorIds: string[];
  inStock: boolean;
};

export const defaultFilters: Filters = {
  price: [0, 100000],
  minRating: 0,
  vendorIds: [],
  inStock: false,
};

export const FilterSidebar = ({
  value, onChange, vendorIdsInUse,
}: { value: Filters; onChange: (v: Filters) => void; vendorIdsInUse?: string[] }) => {
  const [apiVendors, setApiVendors] = useState<VendorItem[]>([]);

  useEffect(() => {
    api.get('/vendors/')
      .then((res: any) => {
        const list = (Array.isArray(res) ? res : res.results || []).map((v: any) => ({
          id: String(v.id),
          name: v.name || v.shop_name || 'Unknown',
        }));
        setApiVendors(list);
      })
      .catch((err) => {
        console.error('[FilterSidebar] Failed to fetch vendors:', err);
        setApiVendors([]);
      });
  }, []);

  const visibleVendors = useMemo(
    () => vendorIdsInUse ? apiVendors.filter(v => vendorIdsInUse.includes(v.id)) : apiVendors,
    [vendorIdsInUse, apiVendors]
  );

  const toggleVendor = (id: string) => {
    onChange({
      ...value,
      vendorIds: value.vendorIds.includes(id) ? value.vendorIds.filter(x => x !== id) : [...value.vendorIds, id],
    });
  };

  return (
    <aside className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3">Price</h4>
        <Slider
          value={value.price}
          onValueChange={(v) => onChange({ ...value, price: [v[0], v[1]] as [number, number] })}
          min={0} max={100000} step={50}
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>₹{value.price[0].toLocaleString("en-IN")}</span>
          <span>₹{value.price[1].toLocaleString("en-IN")}</span>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3">Minimum Rating</h4>
        <div className="space-y-1.5">
          {[4, 3, 2, 0].map((r) => (
            <button
              key={r}
              onClick={() => onChange({ ...value, minRating: r })}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${value.minRating === r ? "bg-secondary text-primary" : "hover:bg-secondary/60 text-muted-foreground"}`}
            >
              {r > 0 ? (<><StarRating value={r} size={12} /><span>& above</span></>) : <span>Any rating</span>}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3">Vendor</h4>
        {apiVendors.length === 0 ? (
          <p className="text-xs text-muted-foreground">Loading vendors…</p>
        ) : visibleVendors.length === 0 ? (
          <p className="text-xs text-muted-foreground">No vendors for this category.</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {visibleVendors.map((v) => (
              <label key={v.id} className="flex items-center gap-2.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.vendorIds.includes(v.id)}
                  onChange={() => toggleVendor(v.id)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-foreground">{v.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">In stock only</span>
        <Switch checked={value.inStock} onCheckedChange={(c) => onChange({ ...value, inStock: c })} />
      </div>

      {(value.vendorIds.length > 0 || value.minRating > 0 || value.inStock) && (
        <button
          onClick={() => onChange({ ...defaultFilters })}
          className="w-full inline-flex items-center justify-center gap-1 text-sm text-brown-mid hover:text-primary"
        >
          <X size={14} /> Clear all filters
        </button>
      )}
    </aside>
  );
};
