import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { categories } from "@/data/vendors";

export const CategoryPills = ({ activeSlug }: { activeSlug?: string }) => {
  const location = useLocation();
  const [active, setActive] = useState(activeSlug || "all");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeSlug) setActive(activeSlug);
    else if (location.pathname === "/") setActive("all");
  }, [activeSlug, location.pathname]);

  const items = [{ slug: "all", name: "All", emoji: "✨" }, ...categories];

  return (
    <div ref={ref} className="pill-scroll overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex items-center gap-2 min-w-max py-1">
        {items.map((c) => {
          const isActive = active === c.slug;
          const to = c.slug === "all" ? "/" : `/category/${c.slug}`;
          return (
            <Link key={c.slug} to={to} className="relative">
              <span className={`relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive ? "text-primary-foreground" : "text-foreground hover:bg-secondary"
              }`}>
                {isActive && (
                  <motion.span
                    layoutId="active-pill"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{c.emoji}</span>
                <span className="relative">{c.name}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
