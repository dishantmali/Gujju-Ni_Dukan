import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export interface BannerItem {
  id: number;
  image: string;
  title?: string;
  link_url?: string;
}

interface BannerSliderProps {
  banners: BannerItem[];
  interval?: number;
  position?: "left" | "right";
}

export function BannerSlider({
  banners,
  interval = 4000,
  position = "left",
}: BannerSliderProps) {
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);

  const next = useCallback(
    () => setIdx((i) => (banners.length ? (i + 1) % banners.length : 0)),
    [banners.length]
  );

  useEffect(() => {
    if (!banners.length || hovered) return;
    const id = setInterval(next, interval);
    return () => clearInterval(id);
  }, [banners.length, hovered, interval, next]);

  if (!banners.length) return null;

  const banner = banners[idx];

  const SliderBody = (
    <div className="relative w-full h-[180px] sm:h-[220px]">
      <AnimatePresence mode="wait">
        <motion.img
          key={banner.id}
          src={banner.image}
          alt={banner.title || "Promo banner"}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>

      {/* Bottom dot indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {banners.map((b, i) => (
            <button
              key={b.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIdx(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === idx
                  ? "w-5 bg-white shadow-sm"
                  : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: position === "right" ? 0.1 : 0 }}
      className="relative rounded-2xl overflow-hidden cursor-pointer group shadow-card bg-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {banner.link_url ? (
        <Link to={banner.link_url} className="block w-full h-full">
          {SliderBody}
        </Link>
      ) : (
        <div className="block w-full h-full">{SliderBody}</div>
      )}
    </motion.div>
  );
}
