export type Category = {
  slug: string;
  name: string;
  emoji: string;
};

export type Vendor = {
  id: string;
  name: string;
  tagline: string;
  rating: number;
  joined: string;
  city: string;
  initials: string;
};

export type Review = {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
};

/** One SKU (e.g. color × size) with its own price and stock — from `/api/products/`. */
export type ProductVariant = {
  id: string;
  sku: string;
  image?: string;
  images?: string[];
  price: number;
  stock_quantity: number;
  option_values: Record<string, string>;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviewCount: number;
  vendorId: string;
  category: string;
  image: string;
  product_images?: string[];
  vendor_shop?: string;
  stock_quantity?: number;
  inStock: boolean;
  isNew: boolean;
  isTrending: boolean;
  reviews: Review[];
  specs: Record<string, string>;
  /** When present (API products), cart/checkout should use selected variant pricing. */
  variants?: ProductVariant[];
};

export type Order = {
  id: string;
  date: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  total: number;
  items: { name: string; qty: number; price: number; image: string }[];
};

export type Address = {
  id: string;
  label: string;
  name: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
};
