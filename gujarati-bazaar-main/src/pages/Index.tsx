import { Link } from "react-router-dom";
import { useRef, useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  TrendingUp,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Star,
  Quote,
  Store,
  LayoutGrid,
  Search,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { VendorCard } from "@/components/VendorCard";
import { categories, vendors } from "@/data/vendors";
import { products as mockProducts, getProductsByCategory } from "@/data/products";
import api from "@/lib/api";
import { mapApiProduct } from "@/lib/mapApiProduct";

import heroBanner from "@/assets/hero-banner.png";
import promoBanner1 from "@/assets/promo-banner-1.png";
import promoBanner2 from "@/assets/promo-banner-2.png";

/* ── Helpers ── */
const SectionHeader = ({
  icon,
  title,
  to,
}: {
  icon: React.ReactNode;
  title: string;
  to?: string;
}) => (
  <div className="flex items-end justify-between mb-6">
    <h2 className="font-display text-2xl sm:text-3xl font-semibold inline-flex items-center gap-2.5">
      <span className="text-accent">{icon}</span> {title}
    </h2>
    {to && (
      <Link
        to={to}
        className="text-sm font-medium text-brown-mid hover:text-primary inline-flex items-center gap-1 underline-grow"
      >
        See all <ArrowRight size={14} />
      </Link>
    )}
  </div>
);

/* ── Offers Marquee Data ── */
const offers = [
  "🎉 Grand Opening Sale — Flat 20% Off on All Snacks!",
  "🚚 Free Delivery on Orders Above ₹499",
  "🎁 Buy 2 Get 1 Free on Pickles & Chutneys",
  "✨ New Arrivals: Premium Kaju Katli & Dry Fruits",
  "🕉️ Pooja Essentials — Flat 15% Off This Week",
  "👘 Handloom Patola Sarees Starting at ₹9,999",
  "🌶️ Stone-Ground Spice Combos — Save ₹150",
  "🥜 Dry Fruits Combo Packs — Up to 30% Off",
];

/* ── Customer Reviews Data ── */
const customerReviews = [
  {
    id: 1,
    name: "Priya Mehta",
    city: "Ahmedabad",
    rating: 5,
    comment:
      "The theplas remind me of my grandmother's kitchen! Authentic taste, delivered fresh. Absolutely love Gujju ni Dukan!",
    avatar: "PM",
  },
  {
    id: 2,
    name: "Rahul Patel",
    city: "Mumbai",
    rating: 5,
    comment:
      "Best Kaju Katli I've ever ordered online. The quality is premium, packaging was beautiful. Perfect for gifting!",
    avatar: "RP",
  },
  {
    id: 3,
    name: "Aanya Shah",
    city: "Bangalore",
    rating: 4,
    comment:
      "Ordered the mirror-work wall hanging — it's absolutely stunning! Real artisanal craftsmanship from Kutch.",
    avatar: "AS",
  },
  {
    id: 4,
    name: "Vikram Joshi",
    city: "Delhi",
    rating: 5,
    comment:
      "The stone-ground spices are incredibly fresh and aromatic. You can tell the difference from store-bought ones!",
    avatar: "VJ",
  },
  {
    id: 5,
    name: "Meera Desai",
    city: "Surat",
    rating: 5,
    comment:
      "I'm a repeat customer. The mango pickle is divine, and the free delivery makes it even better. 10/10 recommend!",
    avatar: "MD",
  },
  {
    id: 6,
    name: "Karan Bhatt",
    city: "Vadodara",
    rating: 4,
    comment:
      "Great selection of Gujarati products! The Patola saree I bought for my wife was a masterpiece. Excellent vendor quality.",
    avatar: "KB",
  },
];

/* ── Horizontal Scroll Hook ── */
const useHScroll = () => {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (!ref.current) return;
    const amount = ref.current.offsetWidth * 0.6;
    ref.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };
  return { ref, scroll };
};

/* ── Category Auto-Scroll Marquee ── */
const CategoryMarquee = () => {
  /* Duplicate items 3× so the loop is seamless */
  const tripled = [...categories, ...categories, ...categories];
  return (
    <div className="category-marquee-wrap overflow-hidden">
      <div className="category-marquee-track flex gap-4 py-2">
        {tripled.map((c, i) => (
          <Link
            key={`${c.slug}-${i}`}
            to={`/category/${c.slug}`}
            className="group/cat flex flex-col items-center justify-center w-[100px] sm:w-[120px] shrink-0 p-4 sm:p-5 rounded-2xl bg-card border border-border/60 hover:border-accent/50 hover:-translate-y-1.5 hover:shadow-lift transition-all duration-300"
          >
            <span className="text-3xl sm:text-4xl group-hover/cat:scale-110 transition-transform duration-300">
              {c.emoji}
            </span>
            <span className="mt-2 text-xs sm:text-sm font-medium text-center leading-tight">
              {c.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

/* ── Review Card ── */
const ReviewCard = ({
  review,
  index,
}: {
  review: (typeof customerReviews)[0];
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4, delay: index * 0.06 }}
    className="w-[280px] sm:w-[320px] lg:w-[calc(33.333vw-3rem)] xl:w-[380px] shrink-0 rounded-2xl bg-card border border-border/60 p-5 sm:p-6 hover:shadow-lift hover:border-brown-light/40 transition-all duration-300"
  >
    <Quote
      size={24}
      className="text-accent/40 mb-3 -scale-x-100"
    />
    <p className="text-sm text-foreground/85 leading-relaxed mb-4 line-clamp-4">
      {review.comment}
    </p>
    <div className="flex items-center gap-3 mt-auto">
      <div className="h-10 w-10 rounded-full bg-gradient-vendor grid place-items-center text-primary-foreground font-bold text-sm shrink-0">
        {review.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{review.name}</p>
        <p className="text-xs text-muted-foreground">{review.city}</p>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={12}
            className={
              i < review.rating
                ? "fill-accent text-accent"
                : "text-border"
            }
          />
        ))}
      </div>
    </div>
  </motion.div>
);

/* ── Category + Products Section (no CategoryProductRow needed) ── */

/* ════════════════════════════════════════════════════════ */
/*                     INDEX PAGE                          */
/* ════════════════════════════════════════════════════════ */
const Index = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const mapProduct = (p: any) => mapApiProduct(p as Record<string, unknown>);

  const fetchHomeData = async () => {
    try {
      const [homeRes, prodsRes]: any = await Promise.all([
        api.get('/homepage/'),
        api.get('/products/')
      ]);

      const featured = (homeRes.featured_products || []).map(mapProduct);
      const newProds = (homeRes.new_products || []).map(mapProduct);
      const fetchedAll = (prodsRes || []).map(mapProduct);

      const mockTrending = mockProducts.filter(p => p.isTrending);
      const mockNew = mockProducts.filter(p => p.isNew);

      setProducts([...featured, ...newProds, ...mockTrending, ...mockNew]);
      setAllProducts(fetchedAll.length > 0 ? fetchedAll : mockProducts);
    } catch (err) {
      console.error("Failed to fetch home data:", err);
      setProducts(mockProducts.filter(p => p.isTrending || p.isNew));
      setAllProducts(mockProducts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const trending = useMemo(() => products.filter((p) => p.isTrending).slice(0, 10), [products]);
  const newArrivals = useMemo(() => products.filter((p) => p.isNew).slice(0, 8), [products]);
  const trendingScroll = useHScroll();
  const newArrivalsScroll = useHScroll();
  const reviewScroll = useHScroll();

  /* Category filter state */
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
  }, [selectedCategory]);

  const list = useMemo(() => {
    if (selectedCategory === "all") return allProducts;
    
    // Filter from allProducts (which includes backend products)
    const filtered = allProducts.filter(p => 
      p.category === selectedCategory || 
      (p.category && typeof p.category === 'object' && p.category.slug === selectedCategory)
    );

    // If we have products in this category from backend/allProducts, use them
    if (filtered.length > 0) return filtered;

    // Otherwise fallback to mock data for this category
    return getProductsByCategory(selectedCategory);
  }, [selectedCategory, allProducts]);

  const filteredProducts = useMemo(() => {
    return isExpanded ? list.slice(0, 24) : list.slice(0, 12);
  }, [list, isExpanded]);

  /* Marquee animation state */
  const [marqueeOffset, setMarqueeOffset] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMarqueeOffset((v) => v - 1), 30);
    return () => clearInterval(id);
  }, []);

  return (
    <PageShell>
      {/* ─── 1. Marquee Offers ─── */}
      <div className="bg-primary text-primary-foreground overflow-hidden">
        <div className="relative h-9 flex items-center">
          <div
            className="flex gap-16 whitespace-nowrap animate-marquee"
            style={{
              transform: `translateX(${marqueeOffset}px)`,
            }}
          >
            {[...offers, ...offers, ...offers].map((o, i) => (
              <span key={i} className="text-xs sm:text-sm font-medium inline-flex items-center gap-2">
                {o}
                <span className="text-accent/60">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 2. Hero Banner ─── */}
      <section className="relative w-full overflow-hidden" style={{ maxHeight: "320px" }}>
        <img
          src={heroBanner}
          alt="Gujju ni Dukan — Authentic Gujarati Products"
          className="w-full h-[200px] sm:h-[260px] lg:h-[320px] object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/40 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-lg"
            >
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight drop-shadow-lg">
                Authentic Gujarati
                <br />
                <span className="text-accent">Products Delivered</span>
              </h1>
              <p className="mt-2 text-white/80 text-sm sm:text-base max-w-xs drop-shadow">
                From family vendors to your doorstep — snacks, spices, sweets & more.
              </p>

              <Link
                to="/category/snacks"
                className="mt-3 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-accent text-accent-foreground font-semibold text-sm hover:bg-brown-light transition-colors shadow-card"
              >
                Shop Now <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── 3. Category Slider ─── */}
      <section className="container py-8">

        <CategoryMarquee />
      </section>

      {/* ─── 4. Trending Now — horizontal scroll ─── */}
      <section className="container py-8">
        <SectionHeader
          icon={<TrendingUp size={22} />}
          title="Trending Now"
          to="/category/snacks"
        />
        <div className="relative group">
          <button
            onClick={() => trendingScroll.scroll("left")}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-card grid place-items-center text-brown-mid hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <div
            ref={trendingScroll.ref}
            className="pill-scroll overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            <div className="flex gap-4 sm:gap-5 min-w-max pb-2">
              {trending.map((p, i) => (
                <div key={p.id} className="w-[200px] sm:w-[230px] shrink-0">
                  <ProductCard product={p} index={i} />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => trendingScroll.scroll("right")}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-card grid place-items-center text-brown-mid hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* ─── 5. New Arrivals — horizontal scroll ─── */}
      <section className="container py-8">
        <SectionHeader
          icon={<Sparkles size={22} />}
          title="New Arrivals"
        />
        <div className="relative group">
          <button
            onClick={() => newArrivalsScroll.scroll("left")}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-card grid place-items-center text-brown-mid hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <div
            ref={newArrivalsScroll.ref}
            className="pill-scroll overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            <div className="flex gap-4 sm:gap-5 min-w-max pb-2">
              {newArrivals.map((p, i) => (
                <div key={p.id} className="w-[200px] sm:w-[230px] shrink-0">
                  <ProductCard product={p} index={i} />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => newArrivalsScroll.scroll("right")}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-card grid place-items-center text-brown-mid hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* ─── 6. Promotion Banners (2 side by side) ─── */}
      <section className="container py-6">
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {/* Banner 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl overflow-hidden cursor-pointer group"
          >
            <img
              src={promoBanner1}
              alt="Festival Special & Free Delivery Offers"
              className="w-full h-[180px] sm:h-[220px] object-cover group-hover:scale-[1.02] transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/75 via-primary/35 to-transparent flex items-center">
              <div className="p-5 sm:p-7">
                <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-[10px] sm:text-xs font-bold mb-2">
                  🎉 FESTIVAL SPECIAL
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white leading-tight">
                  Up to 40% Off on Sweets & Dry Fruits
                </h3>
                <p className="mt-1 text-white/70 text-xs sm:text-sm">
                  Celebrate with premium mithai & gift hampers
                </p>
                <Link
                  to="/category/sweets"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-primary font-semibold text-xs sm:text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Shop Sweets <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Banner 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative rounded-2xl overflow-hidden cursor-pointer group"
          >
            <img
              src={promoBanner2}
              alt="Summer Sale on Traditional Products"
              className="w-full h-[180px] sm:h-[220px] object-cover group-hover:scale-[1.02] transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-primary/75 via-primary/35 to-transparent flex items-center justify-end">
              <div className="p-5 sm:p-7 text-right">
                <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-[10px] sm:text-xs font-bold mb-2">
                  ☀️ SUMMER SALE
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white leading-tight">
                  Fresh Pickles & Cold-Pressed Oils
                </h3>
                <p className="mt-1 text-white/70 text-xs sm:text-sm">
                  Stock up on summer essentials at amazing prices
                </p>
                <Link
                  to="/category/pickles"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-primary font-semibold text-xs sm:text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Shop Now <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── 7. All Categories with Filterable Products ─── */}
      <section className="py-10">
        <div className="container">
          <SectionHeader
            icon={<LayoutGrid size={22} />}
            title="Explore Products"
          />
        </div>
        {/* Category Tabs */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 py-3 mb-6 shadow-sm transition-all">
          <div className="container">
            <div className="pill-scroll overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex items-center gap-2 min-w-max py-1">
            {[{ slug: "all", name: "All", emoji: "✨" }, ...categories].map(
              (c) => {
                const isActive = selectedCategory === c.slug;
                return (
                  <button
                    key={c.slug}
                    onClick={() => setSelectedCategory(c.slug)}
                    className={`relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-secondary"
                      }`}
                  >
                    <span>{c.emoji}</span>
                    <span>{c.name}</span>
                  </button>
                );
              }
            )}
              </div>
            </div>
          </div>
        </div>
        <div className="container">
        {/* Filtered Product Grid */}
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
        >
          {filteredProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </motion.div>
        <div className="mt-8 text-center">
          {!isExpanded && list.length > 12 ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Show More <ArrowRight size={14} />
            </button>
          ) : (
            <Link
              to={`/category/${selectedCategory}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              View More <ArrowRight size={14} />
            </Link>
          )}
        </div>
        </div>
      </section>

      {/* ─── 10. Top Vendors ─── */}
      <section className="container py-10">
        <SectionHeader
          icon={<Store size={22} />}
          title="Our Trusted Vendors"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3 bg-gradient-warm rounded-3xl p-4 sm:p-6">
          {vendors.map((v) => (
            <VendorCard key={v.id} vendor={v} />
          ))}
        </div>
      </section>

      {/* ─── 11. Customer Reviews ─── */}
      <section className="container py-10">
        <SectionHeader
          icon={<Star size={22} />}
          title="What Our Customers Say"
        />
        <div className="bg-gradient-warm rounded-3xl p-4 sm:p-6 relative group">
          <button
            onClick={() => reviewScroll.scroll("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-card grid place-items-center text-brown-mid hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <div
            ref={reviewScroll.ref}
            className="pill-scroll overflow-x-auto"
          >
            <div className="flex gap-4 sm:gap-5 min-w-max pb-2">
              {customerReviews.map((r, i) => (
                <ReviewCard key={r.id} review={r} index={i} />
              ))}
            </div>
          </div>
          <button
            onClick={() => reviewScroll.scroll("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-card grid place-items-center text-brown-mid hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>
    </PageShell>
  );
};

export default Index;
