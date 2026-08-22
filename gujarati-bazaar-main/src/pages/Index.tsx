import { Link } from "react-router-dom";
import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { VendorCard } from "@/components/VendorCard";
import { CategoryIcon } from "@/components/CategoryIcon";

import banner1 from "@/assets/promo-banner-1.png";
import banner2 from "@/assets/promo-banner-2.png";
import api from "@/lib/api";
import { mapApiProduct } from "@/lib/mapApiProduct";

import heroBanner from "@/assets/hero-banner.png";
import { BannerSlider, BannerItem } from "@/components/BannerSlider";
import { IndexExploreChromeProvider, useIndexExploreChrome } from "@/context/IndexExploreChromeContext";

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
  <div className="mb-8 sm:mb-10 w-full flex flex-col items-center">
    <div className="flex items-center justify-center w-full max-w-2xl gap-4 sm:gap-6">
      <div className="h-px bg-border flex-1"></div>
      <div className="flex items-center gap-2.5">
        <span className="text-accent">{icon}</span>
        <h2 className="font-display text-2xl sm:text-3xl font-medium text-foreground tracking-tight">
          {title}
        </h2>
      </div>
      <div className="h-px bg-border flex-1"></div>
    </div>
    {to && (
      <Link
        to={to}
        className="mt-5 text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors group"
      >
        Explore more <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
    )}
  </div>
);

type ReviewType = {
  id: string | number;
  name: string;
  city: string;
  rating: number;
  comment: string;
  avatar: string;
};


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
const CategoryMarquee = ({ categories }: { categories: any[] }) => {
  /* Duplicate items 3× so the loop is seamless */
  const tripled = [...categories, ...categories, ...categories];
  if (categories.length === 0) return null;
  return (
    <div className="category-marquee-wrap">
      <div className="category-marquee-track flex gap-3 py-2">
        {tripled.map((c, i) => (
          <Link
            key={`${c.slug || c.id}-${i}`}
            to={`/category/${c.slug || c.id}`}
            className="group/cat flex flex-col items-center justify-center w-[100px] sm:w-[120px] shrink-0 p-4 sm:p-5 rounded-2xl bg-card border border-border/60 hover:border-accent/50 hover:-translate-y-1.5 hover:shadow-lift transition-all duration-300"
          >
            <span className="text-3xl sm:text-4xl group-hover/cat:scale-110 transition-transform duration-300 text-brown-mid">
              <CategoryIcon name={c.icon} size={40} />
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
  review: ReviewType;
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

/* ── Hero Banner Carousel ── */
const HeroBannerCarousel = ({ images, interval = 5000 }: { images: string[]; interval?: number }) => {
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);

  const next = useCallback(
    () => setIdx((i) => (images.length ? (i + 1) % images.length : 0)),
    [images.length]
  );
  const prev = useCallback(
    () => setIdx((i) => (images.length ? (i - 1 + images.length) % images.length : 0)),
    [images.length]
  );

  useEffect(() => {
    if (!images.length || hovered) return;
    const id = setInterval(next, interval);
    return () => clearInterval(id);
  }, [images.length, hovered, interval, next]);

  if (!images.length) return null;

  return (
    <section
      className="relative w-full overflow-hidden group"
      style={{ maxHeight: "180px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={idx}
          src={images[idx]}
          alt={`Gujju ni Dukan — Banner ${idx + 1}`}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full h-[140px] sm:h-[160px] lg:h-[180px] object-cover"
        />
      </AnimatePresence>

      {/* Subtle gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

      {/* Left / Right arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-white/30 shadow-md grid place-items-center text-brown-mid hover:bg-white transition-all opacity-0 group-hover:opacity-100"
            aria-label="Previous banner"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-white/30 shadow-md grid place-items-center text-brown-mid hover:bg-white transition-all opacity-0 group-hover:opacity-100"
            aria-label="Next banner"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === idx
                ? "w-5 bg-white shadow-sm"
                : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              aria-label={`Go to banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

/* ════════════════════════════════════════════════════════ */
/*                     INDEX PAGE                          */
/* ════════════════════════════════════════════════════════ */
const IndexPageBody = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [offersMarquee, setOffersMarquee] = useState<string[]>([]);
  const [banners, setBanners] = useState<{ left: BannerItem[]; right: BannerItem[] }>({ left: [], right: [] });
  const [manualReviews, setManualReviews] = useState<any[]>([]);

  const [heroBanners, setHeroBanners] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const mapProduct = (p: any) => mapApiProduct(p as Record<string, unknown>);

  const fetchHomeData = async () => {
    try {
      const [homeRes, prodsRes, catsRes]: any = await Promise.all([
        api.get('/homepage/'),
        api.get('/products/?page_size=50'),
        api.get('/categories/')
      ]);


      const featured = (homeRes.featured_products || []).map(mapProduct);
      const newProds = (homeRes.new_products || []).map(mapProduct);
      const fetchedAll = (prodsRes || []).map(mapProduct);

      const productMap = new Map();
      [...featured, ...newProds].forEach(p => {
        productMap.set(p.id, p);
      });

      setProducts(Array.from(productMap.values()));
      setAllProducts(fetchedAll);
      setCategories(catsRes && catsRes.length > 0 ? catsRes : []);

      if (homeRes.vendors && homeRes.vendors.length > 0) {
        setVendors(homeRes.vendors.map((v: any) => ({
          ...v,
          rating: v.average_rating || 0,
          joined: "2024", // Fallback for joined date
        })));
      } else {
        setVendors([]);
      }

      if (homeRes.offers_marquee && homeRes.offers_marquee.length > 0) {
        setOffersMarquee(homeRes.offers_marquee);
      } else {
        setOffersMarquee([]);
      }

      if (homeRes.banners) {
        setBanners({
          left: homeRes.banners.left.length > 0 ? homeRes.banners.left : [{ id: 1001, title: 'Promo 1', image: banner1, link_url: '/category/snacks' }],
          right: homeRes.banners.right.length > 0 ? homeRes.banners.right : [{ id: 1002, title: 'Promo 2', image: banner2, link_url: '/category/clothing' }],
        });
      } else {
        setBanners({
          left: [{ id: 1001, title: 'Promo 1', image: banner1, link_url: '/category/snacks' }],
          right: [{ id: 1002, title: 'Promo 2', image: banner2, link_url: '/category/clothing' }],
        });
      }

      // Hero banners: prefer API array, then single, then fallback to local assets
      if (homeRes.hero_banners && homeRes.hero_banners.length > 0) {
        setHeroBanners(homeRes.hero_banners);
      } else if (homeRes.hero_banner) {
        setHeroBanners([homeRes.hero_banner, banner1, banner2]);
      } else {
        setHeroBanners([heroBanner, banner1, banner2]);
      }

      let mappedManual: any[] = [];
      if (homeRes.manual_reviews && homeRes.manual_reviews.length > 0) {
        mappedManual = homeRes.manual_reviews.map((r: any) => ({
          id: `manual-${r.id}`,
          name: r.name,
          city: r.city,
          rating: r.stars,
          comment: r.description,
          avatar: r.name ? r.name.charAt(0).toUpperCase() : 'U',
        }));
      }

      let mappedPlatform: any[] = [];
      if (homeRes.platform_reviews && homeRes.platform_reviews.length > 0) {
        mappedPlatform = homeRes.platform_reviews.map((r: any) => ({
          id: `platform-${r.id}`,
          name: r.reviewer_name || "Verified Buyer",
          city: "Verified Buyer",
          rating: r.rating,
          comment: r.feedback_text,
          avatar: r.reviewer_name ? r.reviewer_name.charAt(0).toUpperCase() : 'V',
        }));
      }

      setManualReviews([...mappedManual, ...mappedPlatform]);

    } catch (err) {
      console.error("Failed to fetch home data:", err);
      setProducts([]);
      setAllProducts([]);
      setBanners({ left: [], right: [] });
      setHeroBanners([heroBanner, banner1, banner2]);
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
  const vendorScroll = useHScroll();

  const displayReviews = useMemo(() => {
    return manualReviews;
  }, [manualReviews]);

  const tripledReviews = useMemo(() => {
    return displayReviews.length > 0 ? [...displayReviews, ...displayReviews, ...displayReviews] : [];
  }, [displayReviews]);

  /* Category filter state */
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isExpanded, setIsExpanded] = useState(false);
  const exploreSectionRef = useRef<HTMLElement | null>(null);
  const exploreChrome = useIndexExploreChrome();

  const setExploreChromeActive = exploreChrome?.setExploreChromeActive;

  useEffect(() => {
    if (!setExploreChromeActive) return;
    let raf = 0;
    let active = false;
    const BUFFER = 10;
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = exploreSectionRef.current;
        if (!el) return;
        const { top, bottom } = el.getBoundingClientRect();
        if (!active && top <= -BUFFER && bottom > 0) {
          active = true;
          setExploreChromeActive(true);
        } else if (active && (top > BUFFER || bottom <= 0)) {
          active = false;
          setExploreChromeActive(false);
        }
      });
    };
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      setExploreChromeActive(false);
    };
  }, [setExploreChromeActive]); // setter is referentially stable — runs once

  useEffect(() => {
    setIsExpanded(false);
  }, [selectedCategory]);



  /* Vendor auto-scroll one-by-one */
  useEffect(() => {
    const el = vendorScroll.ref.current;
    if (!el) return;
    const id = setInterval(() => {
      const child = el.querySelector(":scope > div > div:first-child") as HTMLElement | null;
      const gap = parseFloat(getComputedStyle(el.querySelector(":scope > div") as HTMLElement).gap || "0");
      const step = (child?.offsetWidth ?? 170) + (Number.isFinite(gap) ? gap : 16);
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - step - 4) {
        el.scrollTo({ left: 0, behavior: "auto" });
      } else {
        el.scrollBy({ left: step, behavior: "smooth" });
      }
    }, 3000);
    return () => clearInterval(id);
  }, []);

  /* Review auto-scroll one-by-one */
  useEffect(() => {
    const el = reviewScroll.ref.current;
    if (!el) return;
    const id = setInterval(() => {
      const child = el.querySelector(":scope > div > div:first-child") as HTMLElement | null;
      const gap = parseFloat(getComputedStyle(el.querySelector(":scope > div") as HTMLElement).gap || "0");
      const step = (child?.offsetWidth ?? 320) + (Number.isFinite(gap) ? gap : 16);
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - step - 4) {
        el.scrollTo({ left: 0, behavior: "auto" });
      } else {
        el.scrollBy({ left: step, behavior: "smooth" });
      }
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const list = useMemo(() => {
    if (selectedCategory === "all") return allProducts;

    const activeCat = categories.find(
      (c: any) => c.slug === selectedCategory || c.id.toString() === selectedCategory
    );

    const targetCatId = activeCat ? activeCat.id.toString() : selectedCategory.toLowerCase();

    return allProducts.filter(p => {
      const pCatId = String(p.categoryId || "");
      const pCatName = String(p.category || "").toLowerCase();
      const pCatSlug = p.category ? p.category.toLowerCase().replace(/\s+/g, '-') : "";
      const selectedLower = selectedCategory.toLowerCase();

      return pCatId === targetCatId ||
             pCatName === targetCatId ||
             pCatName === selectedLower ||
             pCatSlug === selectedLower;
    });
  }, [selectedCategory, allProducts, categories]);

  const filteredProducts = useMemo(() => {
    return isExpanded ? list.slice(0, 24) : list.slice(0, 12);
  }, [list, isExpanded]);

  const chrome = !!exploreChrome?.exploreChromeActive;

  /* Shared category pills content — rendered in both sticky and fixed-overlay elements */
  const categoryPillsInner = (
    <div className="container">
      <div className="pill-scroll overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 min-w-max py-1">
          {[{ slug: "all", name: "All", icon: "FaSparkles" }, ...categories].map(
            (c: any) => {
              const isActive = selectedCategory === (c.slug || c.id.toString());
              return (
                <button
                  key={c.slug || c.id}
                  onClick={() => setSelectedCategory(c.slug || c.id.toString())}
                  className={`relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-secondary"
                    }`}
                >
                  <span><CategoryIcon name={c.icon || 'FaSparkles'} size={14} /></span>
                  <span>{c.name}</span>
                </button>
              );
            }
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── 1. Marquee Offers — infinite loop regardless of content length ─── */}
      {offersMarquee.length > 0 && (
        <div className="bg-brown-mid text-primary-foreground overflow-hidden">
          <div className="relative h-9 flex items-center overflow-hidden">
            <div className="marquee-fade-left" />
            <div className="marquee-fade-right" />
            {(() => {
              // Ensure each set has at least ~20 items so it's always wider than any screen
              const repeatCount = offersMarquee.length > 0 ? Math.max(Math.ceil(20 / offersMarquee.length), 2) : 0;
              const filledOffers = Array.from({ length: repeatCount }, () => offersMarquee).flat();
              // Calculate a duration so speed is constant regardless of text length (~0.45s per char matches category marquee speed)
              const totalChars = filledOffers.reduce((sum, text) => sum + text.length, 0);
              const duration = totalChars > 0 ? totalChars * 0.45 : 60;
              return (
                <div className="offers-marquee-track" style={{ animationDuration: `${duration}s` }}>
                  {/* Each set repeats items enough times to always overflow the viewport */}
                  {[0, 1].map((copy) => (
                    <div key={copy} className="offers-marquee-set" aria-hidden={copy === 1}>
                      {filledOffers.map((o, i) => (
                        <span key={i} className="mx-4 sm:mx-8 text-xs sm:text-sm font-medium inline-flex items-center gap-2 text-white shrink-0 whitespace-nowrap">
                          {o}
                          <span className="text-primary">•</span>
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ─── 2. Hero Banner Slider ─── */}
      <HeroBannerCarousel images={heroBanners} />

      {/* ─── 3. Category Slider ─── */}
      <section className="container pt-6 pb-4">
        <CategoryMarquee categories={categories} />
      </section>

      {/* ─── 4. Trending Now — horizontal scroll ─── */}
      {(loading || trending.length > 0) && (
        <section className="container pt-4 pb-8">
          <SectionHeader
            icon={<TrendingUp size={22} />}
            title="Trending Now"
          />
          <div className="relative group">
            <button
              type="button"
              onClick={() => trendingScroll.scroll("left")}
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-card grid place-items-center text-brown-mid hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <div
              ref={trendingScroll.ref}
              className="pill-scroll overflow-x-auto overflow-y-hidden -mx-4 px-4 sm:mx-0 sm:px-0"
            >
              <div className="flex gap-4 sm:gap-5 min-w-max pt-2 pb-5 px-1">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={`trend-skeleton-${i}`} className="w-[200px] sm:w-[230px] shrink-0">
                      <SkeletonCard />
                    </div>
                  ))
                ) : (
                  trending.map((p, i) => (
                    <div key={p.id} className="w-[200px] sm:w-[230px] shrink-0">
                      <ProductCard product={p} index={i} />
                    </div>
                  ))
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => trendingScroll.scroll("right")}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-card grid place-items-center text-brown-mid hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </section>
      )}

      {/* ─── 5. New Arrivals — horizontal scroll ─── */}
      {(loading || newArrivals.length > 0) && (
        <section className="container py-8">
          <SectionHeader
            icon={<Sparkles size={22} />}
            title="New Arrivals"
          />
          <div className="relative group">
            <button
              type="button"
              onClick={() => newArrivalsScroll.scroll("left")}
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-card grid place-items-center text-brown-mid hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <div
              ref={newArrivalsScroll.ref}
              className="pill-scroll overflow-x-auto overflow-y-hidden -mx-4 px-4 sm:mx-0 sm:px-0"
            >
              <div className="flex gap-4 sm:gap-5 min-w-max pt-2 pb-5 px-1">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={`new-skeleton-${i}`} className="w-[200px] sm:w-[230px] shrink-0">
                      <SkeletonCard />
                    </div>
                  ))
                ) : (
                  newArrivals.map((p, i) => (
                    <div key={p.id} className="w-[200px] sm:w-[230px] shrink-0">
                      <ProductCard product={p} index={i} />
                    </div>
                  ))
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => newArrivalsScroll.scroll("right")}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-card grid place-items-center text-brown-mid hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </section>
      )}

      {/* ─── 6. Promotion Banners (2 side by side sliders) ─── */}
      <section className="container py-6">
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <BannerSlider banners={banners.left} position="left" />
          <BannerSlider banners={banners.right} position="right" />
        </div>
      </section>

      {/* ─── 7. All Categories with Filterable Products ─── */}
      <section ref={exploreSectionRef} className="py-10">
        <div className="container">
          <SectionHeader
            icon={<LayoutGrid size={22} />}
            title="Explore Products"
          />
        </div>
        {/* ── Sticky in-flow pills (always in DOM for layout; fades out when fixed overlay appears) ── */}
        <div
          className={`sticky top-[130px] md:top-[72px] z-30 mb-6 border-b border-border/50 bg-background/95 backdrop-blur-lg py-4 sm:py-[18px] shadow-md transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${chrome ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
        >
          {categoryPillsInner}
        </div>

        {/* ── Fixed overlay pills (portalled to body to escape motion.main's containing block) ── */}
        {createPortal(
          <div
            className={`fixed top-[130px] md:top-[72px] left-0 right-0 z-40 border-b border-border/50 bg-background backdrop-blur-lg py-2 sm:py-2.5 shadow-sm transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${chrome
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-1 pointer-events-none"
              }`}
          >
            {categoryPillsInner}
          </div>,
          document.body
        )}
        <div className="container">
          {/* Filtered Product Grid */}
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 sm:gap-5"
          >
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <SkeletonCard key={`explore-skeleton-${i}`} />
              ))
            ) : (
              filteredProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))
            )}
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
      {vendors.length > 0 && (
        <section className="container py-10">
          <SectionHeader
            icon={<Store size={22} />}
            title="Our Trusted Vendors"
          />
          <div className="bg-gradient-warm rounded-3xl p-4 sm:p-6 relative group">
            <button
              onClick={() => vendorScroll.scroll("left")}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-card grid place-items-center text-brown-mid hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <div
              ref={vendorScroll.ref}
              className="pill-scroll overflow-x-auto"
            >
              <div className="flex gap-3 sm:gap-4 min-w-max pb-2">
                {[...vendors, ...vendors, ...vendors].map((v, i) => (
                  <div key={`${v.id}-${i}`} className="w-[150px] sm:w-[170px] shrink-0">
                    <VendorCard vendor={v} />
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => vendorScroll.scroll("right")}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-card grid place-items-center text-brown-mid hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </section>
      )}

      {/* ─── 11. Customer Reviews ─── */}
      {displayReviews.length > 0 && (
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
                {tripledReviews.map((r, i) => (
                  <ReviewCard key={`${r.id}-${i}`} review={r} index={i} />
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
      )}
    </>
  );
};

export default function Index() {
  return (
    <IndexExploreChromeProvider>
      <PageShell>
        <IndexPageBody />
      </PageShell>
    </IndexExploreChromeProvider>
  );
}
