import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/data/types";
import api from "@/lib/api";

export type CartLine = { product: Product; qty: number };

type CartState = {
  items: CartLine[];
  wishlist: string[];
  wishlistItems: Product[];
  add: (p: Product, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
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
      add: (p, qty = 1) => set((s) => {
        const existing = s.items.find(i => i.product.id === p.id);
        if (existing) {
          return { items: s.items.map(i => i.product.id === p.id ? { ...i, qty: i.qty + qty } : i) };
        }
        return { items: [...s.items, { product: p, qty }] };
      }),
      remove: (id) => set((s) => ({ items: s.items.filter(i => i.product.id !== id) })),
      setQty: (id, qty) => set((s) => ({
        items: qty <= 0
          ? s.items.filter(i => i.product.id !== id)
          : s.items.map(i => i.product.id === id ? { ...i, qty } : i),
      })),
      clear: () => set({ items: [] }),
      toggleWishlist: async (product, authenticated = false) => {
        const s = get() as any;
        const stringId = product.id.toString();
        
        if (s._togglingIds?.has(stringId)) return;
        
        const isWish = s.wishlist.includes(stringId);
        
        set((state: any) => ({
          wishlist: isWish ? state.wishlist.filter((x: string) => x !== stringId) : [...state.wishlist, stringId],
          wishlistItems: isWish 
            ? state.wishlistItems.filter((p: Product) => p.id.toString() !== stringId) 
            : [...state.wishlistItems, product],
          _togglingIds: new Set(state._togglingIds).add(stringId)
        }));

        if (authenticated) {
          try {
            await api.post('/wishlist/toggle/', { product_id: stringId });
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
      setWishlist: (ids) => set({ wishlist: ids.map(id => id.toString()) }),
      syncWishlist: async () => {
        try {
          const res: any = await api.get('/wishlist/');
          const serverIds = res.map((item: any) => item.product.id.toString());
          const serverItems = res.map((item: any) => ({
            ...item.product,
            id: item.product.id.toString(),
            price: parseFloat(item.product.price),
            originalPrice: parseFloat(item.product.price) * 1.2,
            discount: 20,
            rating: item.product.average_rating || 0,
            reviewCount: item.product.review_count || 0,
            vendorId: item.product.vendor?.toString() || "",
            image: item.product.image,
            isNew: true,
            isTrending: false,
            specs: {},
            reviews: []
          }));

          // Keep local mock items (starting with 'p') that are already in the store
          const current = get() as any;
          const localMocks = current.wishlistItems.filter((p: Product) => p.id.toString().startsWith('p'));
          const localMockIds = current.wishlist.filter((id: string) => id.startsWith('p'));

          set({ 
            wishlist: [...new Set([...serverIds, ...localMockIds])], 
            wishlistItems: [...serverItems, ...localMocks.filter((lp: Product) => !serverIds.includes(lp.id.toString()))]
          });
        } catch (err) {
          console.error("Failed to sync wishlist:", err);
        }
      },
      count: () => get().items.reduce((a, i) => a + i.qty, 0),
      subtotal: () => get().items.reduce((a, i) => a + i.qty * i.product.price, 0),
    }),
    { 
      name: "gnd-cart",
      partialize: (state: any) => {
        const { _togglingIds, ...rest } = state;
        return rest;
      }
    }
  )
);
