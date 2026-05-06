import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, ProductVariant } from "@/data/types";
import api from "@/lib/api";
import { mapApiProduct } from "@/lib/mapApiProduct";

export type CartLine = { product: Product; qty: number; variant?: ProductVariant };

export function cartLineId(line: CartLine): string {
  return `${String(line.product.id)}:${line.variant?.id ?? "_"}`;
}

export function cartLineUnitPrice(line: CartLine): number {
  return line.variant ? line.variant.price : line.product.price;
}

type CartState = {
  items: CartLine[];
  wishlist: string[];
  wishlistItems: Product[];
  add: (p: Product, qty?: number, variant?: ProductVariant) => void;
  remove: (lineId: string) => void;
  setQty: (lineId: string, qty: number) => void;
  clear: () => void;
  toggleWishlist: (p: Product, authenticated?: boolean) => Promise<void>;
  setWishlist: (ids: string[]) => void;
  syncWishlist: () => Promise<void>;
  count: () => number;
  subtotal: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      wishlist: [],
      wishlistItems: [],
      _togglingIds: new Set<string>(),
      add: (p, qty = 1, variant) =>
        set((s) => {
          const v =
            variant ??
            (p.variants && p.variants.length > 0 ? p.variants[0] : undefined);
          const lid = `${String(p.id)}:${v?.id ?? "_"}`;
          const existing = s.items.find((i) => cartLineId(i) === lid);
          if (existing) {
            return {
              items: s.items.map((i) =>
                cartLineId(i) === lid ? { ...i, qty: i.qty + qty } : i
              ),
            };
          }
          const line: CartLine = v ? { product: p, qty, variant: v } : { product: p, qty };
          return { items: [...s.items, line] };
        }),
      remove: (lineId) =>
        set((s) => ({ items: s.items.filter((i) => cartLineId(i) !== lineId) })),
      setQty: (lineId, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => cartLineId(i) !== lineId)
              : s.items.map((i) => (cartLineId(i) === lineId ? { ...i, qty } : i)),
        })),
      clear: () => set({ items: [] }),
      toggleWishlist: async (product, authenticated = false) => {
        const s = get() as any;
        const stringId = product.id.toString();

        if (s._togglingIds?.has(stringId)) return;

        const isWish = s.wishlist.includes(stringId);

        set((state: any) => ({
          wishlist: isWish
            ? state.wishlist.filter((x: string) => x !== stringId)
            : [...state.wishlist, stringId],
          wishlistItems: isWish
            ? state.wishlistItems.filter((p: Product) => p.id.toString() !== stringId)
            : [...state.wishlistItems, product],
          _togglingIds: new Set(state._togglingIds).add(stringId),
        }));

        if (authenticated) {
          try {
            await api.post("/wishlist/toggle/", { product_id: stringId });
          } catch (err) {
            console.error("Wishlist sync failed:", err);
          } finally {
            set((state: any) => {
              const newToggling = new Set(state._togglingIds);
              newToggling.delete(stringId);
              return { _togglingIds: newToggling };
            });
          }
        } else {
          set((state: any) => {
            const newToggling = new Set(state._togglingIds);
            newToggling.delete(stringId);
            return { _togglingIds: newToggling };
          });
        }
      },
      setWishlist: (ids) => set({ wishlist: ids.map((id) => id.toString()) }),
      syncWishlist: async () => {
        try {
          const res: any = await api.get("/wishlist/");
          const serverIds = res.map((item: any) => item.product.id.toString());
          const serverItems = res.map((item: any) =>
            mapApiProduct({ ...item.product, id: item.product.id })
          );

          const current = get() as any;
          const localMocks = current.wishlistItems.filter((p: Product) =>
            p.id.toString().startsWith("p")
          );
          const localMockIds = current.wishlist.filter((id: string) => id.startsWith("p"));

          set({
            wishlist: [...new Set([...serverIds, ...localMockIds])],
            wishlistItems: [
              ...serverItems,
              ...localMocks.filter((lp: Product) => !serverIds.includes(lp.id.toString())),
            ],
          });
        } catch (err) {
          console.error("Failed to sync wishlist:", err);
        }
      },
      count: () => get().items.reduce((a, i) => a + i.qty, 0),
      subtotal: () =>
        get().items.reduce((a, i) => a + i.qty * cartLineUnitPrice(i), 0),
    }),
    {
      name: "gnd-cart",
      partialize: (state: any) => {
        const { _togglingIds, ...rest } = state;
        return rest;
      },
    }
  )
);
