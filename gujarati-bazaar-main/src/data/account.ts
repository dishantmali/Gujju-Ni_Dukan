import { Address, Order } from "./types";

export const addresses: Address[] = [
  { id: "a1", label: "Home", name: "Aarav Patel", line1: "204 Vraj Avenue, Bodakdev", city: "Ahmedabad", state: "Gujarat", pincode: "380054", phone: "+91 98765 43210" },
  { id: "a2", label: "Office", name: "Aarav Patel", line1: "5th Floor, Iscon Cross Roads", city: "Ahmedabad", state: "Gujarat", pincode: "380015", phone: "+91 98765 43210" },
  { id: "a3", label: "Parents", name: "Hiren Patel", line1: "12 Maitri Park, Athwa Lines", city: "Surat", state: "Gujarat", pincode: "395007", phone: "+91 98123 45678" },
];

export const orders: Order[] = [
  { id: "ORD-2041", date: "Apr 25, 2026", status: "Delivered", total: 1240, items: [
    { name: "Methi Thepla (250g)", qty: 2, price: 120, image: "https://picsum.photos/seed/methi-thepla-250g/120/120" },
    { name: "Kachi Keri Mango Pickle (500g)", qty: 1, price: 280, image: "https://picsum.photos/seed/kachi-keri-mango-pickle-500g/120/120" },
  ]},
  { id: "ORD-2039", date: "Apr 21, 2026", status: "Shipped", total: 720, items: [
    { name: "Kaju Katli Premium (500g)", qty: 1, price: 720, image: "https://picsum.photos/seed/kaju-katli-premium-500g/120/120" },
  ]},
  { id: "ORD-2031", date: "Apr 12, 2026", status: "Delivered", total: 540, items: [
    { name: "Garam Masala Stone-Ground (200g)", qty: 3, price: 180, image: "https://picsum.photos/seed/garam-masala-stone-ground-200g/120/120" },
  ]},
  { id: "ORD-2025", date: "Apr 03, 2026", status: "Pending", total: 1850, items: [
    { name: "Kutch Mirror Work Wall Hanging", qty: 1, price: 1850, image: "https://picsum.photos/seed/kutch-mirror-work-wall-hanging/120/120" },
  ]},
  { id: "ORD-2018", date: "Mar 26, 2026", status: "Cancelled", total: 480, items: [
    { name: "Brass Diya Set of 5", qty: 1, price: 480, image: "https://picsum.photos/seed/brass-diya-set-of-5/120/120" },
  ]},
];
