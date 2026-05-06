import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const ImageGallery = ({ images, alt }: { images: string[]; alt: string }) => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [images.join("|")]);

  return (
    <div className="grid gap-3">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-warm shadow-card">
        <AnimatePresence mode="wait">
          <motion.img
            key={images[active]}
            src={images[active]}
            alt={alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
      </div>
      <div className="flex gap-2 overflow-x-auto pill-scroll">
        {images.map((src, i) => (
          <button
            key={src}
            onClick={() => setActive(i)}
            className={`shrink-0 h-16 w-16 rounded-xl overflow-hidden border-2 transition-all ${active === i ? "border-accent shadow-card" : "border-transparent opacity-70 hover:opacity-100"}`}
          >
            <img src={src} alt={`${alt} ${i + 1}`} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};
