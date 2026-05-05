import { cn } from "@/lib/utils";

const map = {
  Pending: "bg-accent/15 text-accent-foreground border-accent/30",
  Shipped: "bg-brown-light/20 text-brown border-brown-light/40",
  Delivered: "bg-success/10 text-success border-success/30",
  Cancelled: "bg-destructive/10 text-destructive border-destructive/30",
} as const;

export const OrderStatusBadge = ({ status }: { status: keyof typeof map }) => (
  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", map[status])}>
    {status}
  </span>
);
