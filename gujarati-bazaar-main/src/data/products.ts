import { Product } from "./types";

export const products: Product[] = [];

export const getProduct = (id: string) => products.find(p => p.id === id);
export const getProductsByCategory = (slug: string) => products.filter(p => p.category === slug);
export const getProductsByVendor = (vId: string) => products.filter(p => p.vendorId === vId);
export const getRelatedProducts = (p: Product, n = 8) => products.filter(x => x.category === p.category && x.id !== p.id).slice(0, n);
export const searchProducts = (q: string) => {
  const ql = q.toLowerCase().trim();
  if (!ql) return [];
  return products.filter(p => p.name.toLowerCase().includes(ql) || p.category.includes(ql));
};

