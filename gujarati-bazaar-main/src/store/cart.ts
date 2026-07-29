import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, ProductVariant } from "@/data/types";
import api from "@/lib/api";
import { mapApiProduct } from "@/lib/mapApiProduct";

export type CartLine = { product: Product; qty: number; variant?: ProductVariant; backendItemId?: number };

export function cartLineId(line: CartLine): string {
  return `${String(line.product.id)}:${line.variant?.id ?? "_"}`;
}

export function cartLineUnitPrice(line: CartLine): number {
  return line.variant ? line.variant.price : line.product.price;
}

function isAuthenticated(): boolean {
  return !!localStorage.getItem("access_token");
}

const qtySyncTimeouts: Record<string, any> = {};
const qtySyncPromises: Record<string, Promise<any>> = {};

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
  syncCart: () => Promise<void>;
  mergeCart: () => Promise<void>;
  mergeWishlist: () => Promise<void>;
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
      add: (p, qty = 1, variant) => {
        let actualQty = qty;
        set((s) => {
          const v =
            variant ??
            (p.variants && p.variants.length > 0 
              ? p.variants.find(v => v.stock_quantity > 0) || p.variants[0] 
              : undefined);
          const lid = `${String(p.id)}:${v?.id ?? "_"}`;
          const existing = s.items.find((i) => cartLineId(i) === lid);
          
          const currentQty = existing ? existing.qty : 0;
          const maxStock = v ? v.stock_quantity : p.stock_quantity;
          
          if (currentQty + actualQty > maxStock) {
            const allowedQty = Math.max(0, maxStock - currentQty);
            if (allowedQty === 0) { actualQty = 0; return s; }
            actualQty = allowedQty;
          }

          if (existing) {
            return {
              items: s.items.map((i) =>
                cartLineId(i) === lid ? { ...i, qty: i.qty + actualQty } : i
              ),
            };
          }
          const line: CartLine = v ? { product: p, qty: actualQty, variant: v } : { product: p, qty: actualQty };
          
          return { items: [...s.items, line] };
        });

        // Sync to backend (fire-and-forget)
        if (actualQty > 0 && isAuthenticated()) {
          const v =
            variant ??
            (p.variants && p.variants.length > 0
              ? p.variants.find(v => v.stock_quantity > 0) || p.variants[0]
              : undefined);
          api.post("/cart/add/", {
            product_id: p.id,
            variant_id: v?.id ?? null,
            quantity: actualQty,
          }).then(() => {
            // Re-sync to get backend item IDs
            get().syncCart();
          }).catch((err) => {
            console.error("Failed to sync add-to-cart to backend:", err);
          });
        }
      },
      remove: (lineId) => {
        // Find the item before removing to get its backendItemId
        const itemToRemove = get().items.find((i) => cartLineId(i) === lineId);
        set((s) => ({ items: s.items.filter((i) => cartLineId(i) !== lineId) }));

        // Sync removal to backend (fire-and-forget)
        if (isAuthenticated() && itemToRemove?.backendItemId) {
          api.delete(`/cart/remove/${itemToRemove.backendItemId}/`).catch((err) => {
            console.error("Failed to sync cart removal to backend:", err);
          });
        }
      },
      setQty: (lineId, qty) => {
        // 1. Immediately update the client-side state for perfect responsive UI feedback
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => cartLineId(i) !== lineId)
              : s.items.map((i) => (cartLineId(i) === lineId ? { ...i, qty } : i)),
        }));

        // 2. Debounce quantity change sync to backend to prevent race conditions from rapid clicking
        if (isAuthenticated()) {
          if (qtySyncTimeouts[lineId]) {
            clearTimeout(qtySyncTimeouts[lineId]);
          }

          qtySyncTimeouts[lineId] = setTimeout(() => {
            // Retrieve the active promise (if any) and chain onto it to ensure sequential execution
            const currentPromise = qtySyncPromises[lineId] || Promise.resolve();

            qtySyncPromises[lineId] = currentPromise.then(() => {
              // Fetch the LATEST item state from the store to ensure we get the updated backendItemId
              const currentItem = get().items.find((i) => cartLineId(i) === lineId);
              
              if (qty <= 0) {
                // If item is removed, retrieve the backendItemId and delete it
                const backendItemId = currentItem?.backendItemId || get().items.find((i) => cartLineId(i) === lineId)?.backendItemId;
                if (backendItemId) {
                  return api.delete(`/cart/remove/${backendItemId}/`).catch((err) => {
                    console.error("Failed to sync cart removal to backend:", err);
                  });
                }
                return;
              }

              if (!currentItem) return;

              const backendItemId = currentItem.backendItemId;
              const productId = currentItem.product.id;
              const variantId = currentItem.variant?.id ?? null;

              if (backendItemId) {
                // Remove old and re-add with new quantity to sync
                return api.delete(`/cart/remove/${backendItemId}/`).then(() => {
                  return api.post("/cart/add/", {
                    product_id: productId,
                    variant_id: variantId,
                    quantity: currentItem.qty, // Sync with the latest captured quantity!
                  });
                }).then(() => {
                  return get().syncCart();
                }).catch((err) => {
                  console.error("Failed to sync cart qty change to backend:", err);
                });
              }
            });

            delete qtySyncTimeouts[lineId];
          }, 400);
        }
      },
      clear: () => {
        const items = get().items;
        set({ items: [] });

        // Clear backend cart items (fire-and-forget)
        if (isAuthenticated()) {
          Promise.all(
            items
              .filter((i) => i.backendItemId)
              .map((i) => api.delete(`/cart/remove/${i.backendItemId}/`))
          ).catch((err) => {
            console.error("Failed to clear backend cart:", err);
          });
        }
      },
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
        if (!isAuthenticated()) return;
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
      syncCart: async () => {
        if (!isAuthenticated()) return;
        try {
          const res: any = await api.get("/cart/");
          if (res && res.items) {
            const mapItem = (item: any): CartLine => {
              const vd = item.variant_details;
              const mappedVariant: ProductVariant | undefined = vd ? {
                id: String(vd.id),
                sku: String(vd.sku ?? ""),
                image: vd.image ?? undefined,
                images: vd.images?.map((img: any) => img.image).filter(Boolean) ?? undefined,
                price: parseFloat(String(vd.price ?? 0)),
                originalPrice: Number.isFinite(parseFloat(String(vd.originalPrice ?? vd.price ?? 0))) ? parseFloat(String(vd.originalPrice ?? vd.price ?? 0)) : undefined,
                stock_quantity: Number(vd.stock_quantity ?? 0),
                option_values: vd.option_values ?? {},
              } : undefined;
              return {
                product: mapApiProduct(item.product_details),
                qty: item.quantity,
                variant: mappedVariant,
                backendItemId: item.id,
              };
            };

            const serverItems: CartLine[] = res.items.map(mapItem);

            // Merge local cart to server if the server cart is empty but we have local items
            if (serverItems.length === 0 && get().items.length > 0) {
              await get().mergeCart();
              const mergeRes: any = await api.get("/cart/");
              if (mergeRes && mergeRes.items) {
                const mergedServerItems: CartLine[] = mergeRes.items.map(mapItem);
                set({ items: mergedServerItems });
              }
            } else {
              set({ items: serverItems });
            }
          }
        } catch (err) {
          console.error("Failed to sync cart:", err);
        }
      },
  mergeCart: async () => {
    const items = get().items;
    if (items.length === 0) return;

    try {
      await api.post("/cart/merge/", {
        items: items.map((i) => ({
          product_id: i.product.id,
          variant_id: i.variant?.id ?? null,
          quantity: i.qty,
        })),
      });
    } catch (err) {
      console.error("Failed to merge cart:", err);
    }
  },
  mergeWishlist: async () => {
    const wishlist = get().wishlist;
    if (wishlist.length === 0) return;

    try {
      await api.post("/wishlist/merge/", {
        items: wishlist.map((id) => ({ product: id })),
      });
    } catch (err) {
      console.error("Failed to merge wishlist:", err);
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
