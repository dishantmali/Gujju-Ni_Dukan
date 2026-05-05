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
  inStock: boolean;
  isNew: boolean;
  isTrending: boolean;
  reviews: Review[];
  specs: Record<string, string>;
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
