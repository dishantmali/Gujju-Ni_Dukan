import { cn } from "@/lib/utils";

export const PriceTag = ({
  price,
  originalPrice,
  discount,
  size = "md",
  className,
}: {
  price: number;
  originalPrice?: number;
  discount?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const sizes = {
    sm: { p: "text-sm", o: "text-xs", d: "text-[10px] px-1.5 py-0.5" },
    md: { p: "text-base", o: "text-sm", d: "text-xs px-2 py-0.5" },
    lg: { p: "text-2xl", o: "text-base", d: "text-xs px-2 py-0.5" },
  }[size];
  return (
    <div className={cn("flex items-baseline gap-2 flex-wrap", className)}>
      <span className={cn("font-display font-bold text-foreground", sizes.p)}>₹{price.toLocaleString("en-IN")}</span>
      {originalPrice && originalPrice > price && (
        <span className={cn("text-muted-foreground line-through", sizes.o)}>₹{originalPrice.toLocaleString("en-IN")}</span>
      )}
      {discount && discount > 0 && (
        <span className={cn("rounded-full bg-success/10 text-success font-semibold uppercase tracking-wide", sizes.d)}>
          {discount}% off
        </span>
      )}
    </div>
  );
};
