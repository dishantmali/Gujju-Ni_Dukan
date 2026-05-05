export const SkeletonCard = () => (
  <div className="rounded-[var(--radius)] bg-card border border-border/60 overflow-hidden">
    <div className="aspect-square bg-skeleton-shimmer bg-[length:800px_100%] animate-shimmer" />
    <div className="p-3.5 space-y-2">
      <div className="h-4 w-3/4 bg-skeleton-shimmer bg-[length:800px_100%] animate-shimmer rounded" />
      <div className="h-3 w-1/2 bg-skeleton-shimmer bg-[length:800px_100%] animate-shimmer rounded" />
      <div className="h-5 w-1/3 bg-skeleton-shimmer bg-[length:800px_100%] animate-shimmer rounded mt-2" />
    </div>
  </div>
);
