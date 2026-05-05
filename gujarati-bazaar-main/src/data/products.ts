import { Product, Review } from "./types";

const sampleReviews = (seed: string): Review[] => [
  { id: `${seed}-r1`, user: "Priya M.", rating: 5, comment: "Authentic taste, just like my dadi used to make!", date: "2 weeks ago" },
  { id: `${seed}-r2`, user: "Rahul P.", rating: 4, comment: "Good quality and quick delivery. Packaging could be better.", date: "1 month ago" },
  { id: `${seed}-r3`, user: "Aanya S.", rating: 5, comment: "Worth every rupee. Will order again.", date: "1 month ago" },
  { id: `${seed}-r4`, user: "Vikram J.", rating: 4, comment: "Fresh and tasty. Loved it.", date: "2 months ago" },
  { id: `${seed}-r5`, user: "Meera D.", rating: 5, comment: "My family loved it. Reminded me of home.", date: "3 months ago" },
];

type Seed = {
  name: string; cat: string; vendor: string; price: number; mrp: number;
  rating: number; reviewCount: number; isNew?: boolean; isTrending?: boolean; inStock?: boolean;
  desc: string; specs: Record<string, string>;
};

const seeds: Seed[] = [
  // Snacks
  { name: "Methi Thepla (250g)", cat: "snacks", vendor: "v1", price: 120, mrp: 150, rating: 4.7, reviewCount: 312, isTrending: true, desc: "Soft, flaky theplas made with fresh fenugreek leaves and stone-ground wheat. Travel-friendly and delicious with chai.", specs: { Weight: "250g", Shelf: "10 days", Veg: "Yes" } },
  { name: "Khakhra Masala (200g)", cat: "snacks", vendor: "v1", price: 90, mrp: 110, rating: 4.6, reviewCount: 245, isTrending: true, desc: "Wafer-thin roasted khakhras with bold spice mix.", specs: { Weight: "200g", Shelf: "30 days", Veg: "Yes" } },
  { name: "Ganthiya Chickpea (300g)", cat: "snacks", vendor: "v1", price: 140, mrp: 170, rating: 4.8, reviewCount: 410, isTrending: true, desc: "Authentic Surti ganthiya, crispy and golden.", specs: { Weight: "300g", Shelf: "20 days", Veg: "Yes" } },
  { name: "Chakli Crisp (250g)", cat: "snacks", vendor: "v1", price: 110, mrp: 130, rating: 4.5, reviewCount: 178, desc: "Spiral fried snack with sesame and ajwain.", specs: { Weight: "250g", Shelf: "30 days", Veg: "Yes" } },
  { name: "Fafda & Jalebi Combo", cat: "snacks", vendor: "v1", price: 220, mrp: 260, rating: 4.9, reviewCount: 520, isTrending: true, desc: "Classic Sunday breakfast combo from Ahmedabad.", specs: { Weight: "500g", Shelf: "3 days", Veg: "Yes" } },
  { name: "Bhakharwadi Spicy (250g)", cat: "snacks", vendor: "v1", price: 135, mrp: 160, rating: 4.6, reviewCount: 198, desc: "Layered, sweet-spicy rolls of pure delight.", specs: { Weight: "250g", Shelf: "30 days", Veg: "Yes" } },
  { name: "Sev Mamra (400g)", cat: "snacks", vendor: "v1", price: 95, mrp: 120, rating: 4.4, reviewCount: 156, desc: "Puffed rice with crisp sev and peanuts.", specs: { Weight: "400g", Shelf: "30 days", Veg: "Yes" } },
  { name: "Dhokla Mix (500g)", cat: "snacks", vendor: "v1", price: 160, mrp: 190, rating: 4.7, reviewCount: 230, isNew: true, desc: "Instant mix for soft, fluffy khaman dhokla.", specs: { Weight: "500g", Shelf: "6 months", Veg: "Yes" } },

  // Pickles
  { name: "Kachi Keri Mango Pickle (500g)", cat: "pickles", vendor: "v2", price: 280, mrp: 340, rating: 4.9, reviewCount: 612, isTrending: true, desc: "Sun-dried raw mango pickle with mustard oil & whole spices. Aged 21 days.", specs: { Weight: "500g", Shelf: "12 months", Veg: "Yes" } },
  { name: "Lemon Chilli Pickle (400g)", cat: "pickles", vendor: "v2", price: 220, mrp: 260, rating: 4.7, reviewCount: 285, desc: "Tangy lemon and green chilli pickle, no preservatives.", specs: { Weight: "400g", Shelf: "10 months", Veg: "Yes" } },
  { name: "Garlic Pickle (300g)", cat: "pickles", vendor: "v2", price: 180, mrp: 220, rating: 4.6, reviewCount: 142, desc: "Bold, fiery garlic pickle in mustard oil.", specs: { Weight: "300g", Shelf: "12 months", Veg: "Yes" } },
  { name: "Mixed Vegetable Pickle (500g)", cat: "pickles", vendor: "v2", price: 240, mrp: 290, rating: 4.5, reviewCount: 198, isNew: true, desc: "Carrot, cauliflower, turnip in tangy spice blend.", specs: { Weight: "500g", Shelf: "10 months", Veg: "Yes" } },
  { name: "Methia Keri Pickle (500g)", cat: "pickles", vendor: "v2", price: 295, mrp: 350, rating: 4.8, reviewCount: 320, desc: "Traditional fenugreek-mango pickle.", specs: { Weight: "500g", Shelf: "12 months", Veg: "Yes" } },
  { name: "Chundo Sweet Mango (400g)", cat: "pickles", vendor: "v2", price: 260, mrp: 310, rating: 4.7, reviewCount: 256, desc: "Sweet, sun-cooked mango chundo.", specs: { Weight: "400g", Shelf: "12 months", Veg: "Yes" } },

  // Spices
  { name: "Garam Masala Stone-Ground (200g)", cat: "spices", vendor: "v6", price: 180, mrp: 220, rating: 4.8, reviewCount: 445, isTrending: true, desc: "16 whole spices, stone-ground for maximum aroma.", specs: { Weight: "200g", Shelf: "12 months", Veg: "Yes" } },
  { name: "Red Chilli Powder Kashmiri (250g)", cat: "spices", vendor: "v6", price: 160, mrp: 200, rating: 4.7, reviewCount: 380, desc: "Vibrant color, mild heat. Sun-dried.", specs: { Weight: "250g", Shelf: "12 months", Veg: "Yes" } },
  { name: "Turmeric Powder Pure (200g)", cat: "spices", vendor: "v6", price: 140, mrp: 170, rating: 4.6, reviewCount: 290, desc: "Single-origin Erode turmeric. High curcumin.", specs: { Weight: "200g", Shelf: "18 months", Veg: "Yes" } },
  { name: "Cumin Seeds Whole (200g)", cat: "spices", vendor: "v6", price: 220, mrp: 270, rating: 4.7, reviewCount: 175, desc: "Hand-picked, sun-dried cumin seeds.", specs: { Weight: "200g", Shelf: "18 months", Veg: "Yes" } },
  { name: "Coriander Powder (250g)", cat: "spices", vendor: "v6", price: 130, mrp: 160, rating: 4.5, reviewCount: 142, desc: "Freshly ground coriander, citrusy aroma.", specs: { Weight: "250g", Shelf: "12 months", Veg: "Yes" } },
  { name: "Pav Bhaji Masala (100g)", cat: "spices", vendor: "v6", price: 95, mrp: 120, rating: 4.8, reviewCount: 320, isNew: true, desc: "Authentic blend for street-style pav bhaji.", specs: { Weight: "100g", Shelf: "12 months", Veg: "Yes" } },
  { name: "Chaat Masala (100g)", cat: "spices", vendor: "v6", price: 85, mrp: 110, rating: 4.7, reviewCount: 215, desc: "Tangy, salty, spicy. Sprinkle on anything.", specs: { Weight: "100g", Shelf: "12 months", Veg: "Yes" } },

  // Sweets
  { name: "Kaju Katli Premium (500g)", cat: "sweets", vendor: "v5", price: 720, mrp: 850, rating: 4.9, reviewCount: 612, isTrending: true, desc: "Diamond-cut cashew fudge with silver leaf.", specs: { Weight: "500g", Shelf: "15 days", Veg: "Yes" } },
  { name: "Mohanthal (400g)", cat: "sweets", vendor: "v5", price: 480, mrp: 580, rating: 4.8, reviewCount: 340, desc: "Classic gram flour fudge with cardamom.", specs: { Weight: "400g", Shelf: "10 days", Veg: "Yes" } },
  { name: "Ghari Sweet Surti (500g)", cat: "sweets", vendor: "v5", price: 560, mrp: 660, rating: 4.7, reviewCount: 280, desc: "Famous Surti ghari with mawa filling.", specs: { Weight: "500g", Shelf: "7 days", Veg: "Yes" } },
  { name: "Sutarfeni (300g)", cat: "sweets", vendor: "v5", price: 320, mrp: 390, rating: 4.6, reviewCount: 195, desc: "Silken thread sweet with rose water.", specs: { Weight: "300g", Shelf: "10 days", Veg: "Yes" } },
  { name: "Penda Mathura (400g)", cat: "sweets", vendor: "v5", price: 420, mrp: 500, rating: 4.7, reviewCount: 240, isNew: true, desc: "Soft saffron mawa pendas.", specs: { Weight: "400g", Shelf: "7 days", Veg: "Yes" } },
  { name: "Magas Besan Ladoo (500g)", cat: "sweets", vendor: "v5", price: 460, mrp: 540, rating: 4.8, reviewCount: 312, desc: "Roasted besan ladoo with dry fruits.", specs: { Weight: "500g", Shelf: "20 days", Veg: "Yes" } },
  { name: "Halwasan Khambhat (300g)", cat: "sweets", vendor: "v5", price: 380, mrp: 450, rating: 4.6, reviewCount: 168, desc: "Heritage halwasan from Khambhat.", specs: { Weight: "300g", Shelf: "10 days", Veg: "Yes" } },

  // Dry Fruits
  { name: "Premium Kaju Whole (500g)", cat: "dry-fruits", vendor: "v7", price: 780, mrp: 950, rating: 4.8, reviewCount: 422, isTrending: true, desc: "W320 grade whole cashews, hand-sorted.", specs: { Weight: "500g", Origin: "Mangalore", Veg: "Yes" } },
  { name: "California Almonds (500g)", cat: "dry-fruits", vendor: "v7", price: 650, mrp: 780, rating: 4.7, reviewCount: 356, desc: "Crunchy, raw California almonds.", specs: { Weight: "500g", Origin: "California", Veg: "Yes" } },
  { name: "Anjeer Premium (250g)", cat: "dry-fruits", vendor: "v7", price: 540, mrp: 650, rating: 4.6, reviewCount: 198, desc: "Soft Afghani anjeer, naturally sweet.", specs: { Weight: "250g", Origin: "Afghanistan", Veg: "Yes" } },
  { name: "Pista Salted (250g)", cat: "dry-fruits", vendor: "v7", price: 620, mrp: 740, rating: 4.7, reviewCount: 245, desc: "Lightly salted, Iranian pistachios.", specs: { Weight: "250g", Origin: "Iran", Veg: "Yes" } },
  { name: "Dates Medjool Khajur (500g)", cat: "dry-fruits", vendor: "v7", price: 480, mrp: 580, rating: 4.8, reviewCount: 312, isNew: true, desc: "King-sized soft Medjool dates.", specs: { Weight: "500g", Origin: "Jordan", Veg: "Yes" } },
  { name: "Walnut Halves (250g)", cat: "dry-fruits", vendor: "v7", price: 560, mrp: 680, rating: 4.6, reviewCount: 168, desc: "Light-colored Kashmiri walnut halves.", specs: { Weight: "250g", Origin: "Kashmir", Veg: "Yes" } },

  // Handicrafts
  { name: "Kutch Mirror Work Wall Hanging", cat: "handicrafts", vendor: "v4", price: 1850, mrp: 2400, rating: 4.9, reviewCount: 178, isTrending: true, desc: "Hand-embroidered mirror work piece by Kutch artisans.", specs: { Size: "60x40 cm", Material: "Cotton, Mirror", Handmade: "Yes" } },
  { name: "Bandhani Dupatta Red", cat: "clothing", vendor: "v3", price: 1240, mrp: 1600, rating: 4.7, reviewCount: 245, desc: "Tie-dye bandhani dupatta from Jamnagar.", specs: { Length: "2.5m", Material: "Pure georgette", Care: "Dry clean" } },
  { name: "Patola Saree Heritage", cat: "clothing", vendor: "v8", price: 18500, mrp: 24000, rating: 4.9, reviewCount: 89, isTrending: true, desc: "Authentic Patan double-ikat patola saree.", specs: { Length: "5.5m", Material: "Pure silk", Handmade: "Yes" } },
  { name: "Surat Silk Kurta Cream", cat: "clothing", vendor: "v3", price: 2240, mrp: 2800, rating: 4.6, reviewCount: 156, desc: "Pure silk kurta with subtle zari work.", specs: { Size: "M-XXL", Material: "Pure silk", Care: "Dry clean" } },
  { name: "Lehariya Stole Yellow", cat: "clothing", vendor: "v3", price: 680, mrp: 850, rating: 4.5, reviewCount: 112, isNew: true, desc: "Wave-pattern lehariya stole.", specs: { Length: "2m", Material: "Cotton", Care: "Hand wash" } },
  { name: "Toran Door Hanging Beaded", cat: "handicrafts", vendor: "v4", price: 540, mrp: 700, rating: 4.7, reviewCount: 198, desc: "Colorful beaded toran for festive doors.", specs: { Length: "90 cm", Material: "Beads, Cotton", Handmade: "Yes" } },
  { name: "Wooden Camel Pair Jaisalmer", cat: "handicrafts", vendor: "v4", price: 1280, mrp: 1600, rating: 4.6, reviewCount: 92, desc: "Hand-carved wooden camel décor.", specs: { Size: "20cm tall", Material: "Sheesham wood", Handmade: "Yes" } },
  { name: "Embroidered Wallet Mirror", cat: "handicrafts", vendor: "v4", price: 320, mrp: 420, rating: 4.5, reviewCount: 145, desc: "Compact wallet with mirror embroidery.", specs: { Size: "20x12 cm", Material: "Cotton, Mirror", Handmade: "Yes" } },

  // Pooja Items
  { name: "Brass Diya Set of 5", cat: "pooja-items", vendor: "v4", price: 480, mrp: 620, rating: 4.7, reviewCount: 220, isTrending: true, desc: "Pure brass diyas for daily aarti.", specs: { Material: "Brass", Pieces: "5", Care: "Wipe clean" } },
  { name: "Pooja Thali Silver-plated", cat: "pooja-items", vendor: "v4", price: 1240, mrp: 1500, rating: 4.8, reviewCount: 178, desc: "Beautifully etched silver-plated thali.", specs: { Diameter: "22 cm", Material: "Silver-plated brass", Care: "Polish monthly" } },
  { name: "Agarbatti Sandalwood (Pack of 12)", cat: "pooja-items", vendor: "v4", price: 280, mrp: 360, rating: 4.6, reviewCount: 312, desc: "Pure sandalwood incense sticks.", specs: { Pieces: "12 packs", Burn: "45 min", Veg: "Yes" } },
  { name: "Kalash Copper Traditional", cat: "pooja-items", vendor: "v4", price: 680, mrp: 820, rating: 4.7, reviewCount: 145, isNew: true, desc: "Hand-hammered copper kalash.", specs: { Capacity: "1L", Material: "Pure copper", Care: "Wipe dry" } },
  { name: "Camphor Pure (200g)", cat: "pooja-items", vendor: "v4", price: 220, mrp: 280, rating: 4.5, reviewCount: 198, desc: "Pure camphor tablets for aarti.", specs: { Weight: "200g", Pure: "Yes", Veg: "Yes" } },

  // Home Decor
  { name: "Madhubani Painting Framed", cat: "home-decor", vendor: "v4", price: 2480, mrp: 3200, rating: 4.8, reviewCount: 89, isTrending: true, desc: "Hand-painted Madhubani artwork.", specs: { Size: "40x60 cm", Material: "Acrylic on canvas", Handmade: "Yes" } },
  { name: "Terracotta Vase Pair", cat: "home-decor", vendor: "v4", price: 880, mrp: 1100, rating: 4.6, reviewCount: 145, desc: "Earthy terracotta vases, hand-shaped.", specs: { Height: "30 cm", Material: "Terracotta", Handmade: "Yes" } },
  { name: "Embroidered Cushion Cover Set", cat: "home-decor", vendor: "v4", price: 1240, mrp: 1500, rating: 4.7, reviewCount: 198, desc: "Set of 5 mirror-work cushion covers.", specs: { Size: "40x40 cm", Material: "Cotton", Pieces: "5" } },
  { name: "Wooden Jharokha Window", cat: "home-decor", vendor: "v4", price: 1850, mrp: 2300, rating: 4.7, reviewCount: 92, isNew: true, desc: "Traditional carved wooden jharokha frame.", specs: { Size: "60x45 cm", Material: "Mango wood", Handmade: "Yes" } },
  { name: "Brass Wall Hook Peacock", cat: "home-decor", vendor: "v4", price: 420, mrp: 540, rating: 4.5, reviewCount: 112, desc: "Decorative brass peacock wall hooks.", specs: { Pieces: "Set of 3", Material: "Brass", Handmade: "Yes" } },

  // Groceries
  { name: "Sona Masoori Rice (5kg)", cat: "groceries", vendor: "v6", price: 480, mrp: 580, rating: 4.6, reviewCount: 412, desc: "Premium aromatic Sona Masoori rice.", specs: { Weight: "5kg", Polish: "Single", Veg: "Yes" } },
  { name: "Toor Dal Premium (1kg)", cat: "groceries", vendor: "v6", price: 180, mrp: 220, rating: 4.7, reviewCount: 298, desc: "Unpolished, hand-cleaned toor dal.", specs: { Weight: "1kg", Polish: "None", Veg: "Yes" } },
  { name: "Cold-pressed Mustard Oil (1L)", cat: "groceries", vendor: "v6", price: 320, mrp: 380, rating: 4.8, reviewCount: 245, isTrending: true, desc: "Wood-pressed pure mustard oil.", specs: { Volume: "1L", Process: "Wood-pressed", Veg: "Yes" } },
  { name: "Whole Wheat Flour (5kg)", cat: "groceries", vendor: "v6", price: 280, mrp: 340, rating: 4.6, reviewCount: 198, desc: "Stone-ground whole wheat atta.", specs: { Weight: "5kg", Process: "Stone-ground", Veg: "Yes" } },
  { name: "Jaggery Organic (1kg)", cat: "groceries", vendor: "v6", price: 160, mrp: 200, rating: 4.7, reviewCount: 312, isNew: true, desc: "Chemical-free organic gud.", specs: { Weight: "1kg", Organic: "Yes", Veg: "Yes" } },
  { name: "Black Chickpeas (1kg)", cat: "groceries", vendor: "v6", price: 140, mrp: 170, rating: 4.5, reviewCount: 156, desc: "Premium kala chana, sun-dried.", specs: { Weight: "1kg", Veg: "Yes" } },
  
  // New Trending & Arrivals
  { name: "Dry Fruit Kachori (500g)", cat: "snacks", vendor: "v1", price: 320, mrp: 380, rating: 4.8, reviewCount: 215, isTrending: true, desc: "Crispy, deep-fried pastry filled with a rich spicy dry fruit mix.", specs: { Weight: "500g", Shelf: "15 days", Veg: "Yes" } },
  { name: "Hand-Painted Ceramic Plate", cat: "home-decor", vendor: "v4", price: 750, mrp: 950, rating: 4.7, reviewCount: 88, isTrending: true, desc: "Artisanal ceramic plate with traditional Gujarati motifs.", specs: { Size: "10 inch", Material: "Ceramic", Handmade: "Yes" } },
  { name: "Pure Gir Cow Ghee (500ml)", cat: "groceries", vendor: "v6", price: 850, mrp: 990, rating: 4.9, reviewCount: 342, isTrending: true, desc: "A2 Vedic ghee made from Gir cow milk using the Bilona method.", specs: { Volume: "500ml", Type: "A2 Vedic", Veg: "Yes" } },
  { name: "Kesar Pista Shrikhand (250g)", cat: "sweets", vendor: "v5", price: 180, mrp: 220, rating: 4.8, reviewCount: 156, isNew: true, desc: "Creamy hung curd dessert infused with saffron and pistachios.", specs: { Weight: "250g", Shelf: "5 days", Veg: "Yes" } },
  { name: "Block Print Cotton Bedsheet", cat: "home-decor", vendor: "v4", price: 1450, mrp: 1850, rating: 4.6, reviewCount: 74, isNew: true, desc: "King-sized bedsheet with hand-block Ajrakh prints.", specs: { Size: "108x108 inch", Material: "100% Cotton", Thread: "300 TC" } },
  { name: "Traditional Mojari Shoes", cat: "clothing", vendor: "v3", price: 890, mrp: 1200, rating: 4.7, reviewCount: 112, isNew: true, desc: "Handcrafted leather mojaris with intricate embroidery.", specs: { Material: "Leather", Type: "Handmade", Care: "Dry clean" } },
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const products: Product[] = seeds.map((s, i) => {
  const id = `p${i + 1}`;
  const slug = slugify(s.name);
  return {
    id,
    name: s.name,
    description: s.desc,
    price: s.price,
    originalPrice: s.mrp,
    discount: Math.round(((s.mrp - s.price) / s.mrp) * 100),
    rating: s.rating,
    reviewCount: s.reviewCount,
    vendorId: s.vendor,
    category: s.cat,
    image: `https://picsum.photos/seed/${slug}/600/600`,
    inStock: s.inStock !== false,
    isNew: !!s.isNew,
    isTrending: !!s.isTrending,
    reviews: sampleReviews(id),
    specs: s.specs,
  };
});

export const getProduct = (id: string) => products.find(p => p.id === id);
export const getProductsByCategory = (slug: string) => products.filter(p => p.category === slug);
export const getProductsByVendor = (vId: string) => products.filter(p => p.vendorId === vId);
export const getRelatedProducts = (p: Product, n = 8) => products.filter(x => x.category === p.category && x.id !== p.id).slice(0, n);
export const searchProducts = (q: string) => {
  const ql = q.toLowerCase().trim();
  if (!ql) return [];
  return products.filter(p => p.name.toLowerCase().includes(ql) || p.category.includes(ql));
};
