import { ProductCard } from "./ProductCard";
import { SkeletonCard } from "./SkeletonCard";
import { Product } from "@/data/types";

export const ProductGrid = ({ products, loading, cols = "default" }: { products: Product[]; loading?: boolean; cols?: "default" | "tight" }) => {
  const colClass = cols === "tight"
    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4";
  if (loading) {
    return (
      <div className={`grid ${colClass} gap-4 sm:gap-5`}>
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }
  return (
    <div className={`grid ${colClass} gap-4 sm:gap-5`}>
      {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
    </div>
  );
};
