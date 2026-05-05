import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const StarRating = ({ value, size = 14, className }: { value: number; size?: number; className?: string }) => {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="text-muted absolute inset-0" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="text-accent fill-accent" />
            </span>
          </span>
        );
      })}
    </span>
  );
};
