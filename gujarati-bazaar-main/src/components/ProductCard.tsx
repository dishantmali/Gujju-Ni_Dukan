import { useRef, useState, MouseEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Sparkles } from "lucide-react";
import { Product } from "@/data/types";
import { useCart } from "@/store/cart";
import { useAuth } from "@/context/AuthContext";
import { StarRating } from "./StarRating";
import { PriceTag } from "./PriceTag";
import { vendors } from "@/data/vendors";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const ProductCard = ({ product, index = 0 }: { product: Product; index?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const add = useCart((s) => s.add);
  const wishlist = useCart((s) => s.wishlist);
  const toggleWish = useCart((s) => s.toggleWishlist);
  const { user, isAuthenticated } = useAuth();
  const isBuyerOnly = !user || user.role === 'buyer';
  const isWish = wishlist.includes(product.id.toString());
  const vendor = vendors.find((v) => v.id === product.vendorId);

  const onMove = (e: MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const cx = e.clientX - r.left - r.width / 2;
    const cy = e.clientY - r.top - r.height / 2;
    setTilt({ x: (cy / r.height) * -6, y: (cx / r.width) * 6 });
  };
  const onLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="group/card relative"
    >
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="card-tilt relative rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl hover:shadow-accent/40 overflow-hidden hover:border-primary/30 transition-all duration-300"
        style={{ transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        <Link to={`/product/${product.id}`} className="block p-1">
          <div className="relative overflow-hidden bg-background rounded-[calc(1rem-4px)] border border-border/40">
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="w-full object-contain transition-transform duration-700 group-hover/card:scale-105"
            />
            <div className="absolute top-2 left-2 flex flex-col gap-1.5">
              {product.isNew && (
                <span className="inline-flex items-center gap-1 rounded-full bg-card/90 backdrop-blur-sm text-foreground text-[10px] font-semibold px-2 py-1 shadow-sm">
                  <Sparkles size={10} className="text-accent" /> NEW
                </span>
              )}
              {product.discount > 0 && (
                <span className="rounded-full bg-accent text-accent-foreground text-[10px] font-bold px-2 py-1 shadow-sm">
                  -{product.discount}%
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isBuyerOnly) { toast.error('Vendors and Admins cannot use wishlist'); return; }
                toggleWish(product, isAuthenticated);
              }}
              aria-label="Toggle wishlist"
              className="absolute top-2 right-2 h-8 w-8 grid place-items-center rounded-full bg-card/90 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform"
            >
              <Heart size={14} className={cn("transition-colors", isWish ? "fill-destructive text-destructive" : "text-brown-mid")} />
            </button>
          </div>
        </Link>
        <div className="p-3.5 card-tilt-inner">
          <Link to={`/product/${product.id}`}>
            <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug min-h-[2.5rem] group-hover/card:text-brown-mid transition-colors">
              {product.name}
            </h3>
          </Link>
          <div className="mt-1 text-xs text-muted-foreground truncate">{vendor?.name}</div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <StarRating value={product.rating} size={12} />
            <span className="text-xs text-muted-foreground">{product.rating} ({product.reviewCount})</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <PriceTag price={product.price} originalPrice={product.originalPrice} size="sm" />
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); if (!isBuyerOnly) { toast.error('Vendors and Admins cannot add items to cart'); return; } add(product, 1, product.variants?.[0]); toast.success("Added to cart", { description: product.name }); }}
              aria-label="Add to cart"
              className="h-9 w-9 shrink-0 grid place-items-center rounded-full bg-primary text-primary-foreground hover:bg-brown-mid transition-colors active:scale-95"
            >
              <ShoppingCart size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
