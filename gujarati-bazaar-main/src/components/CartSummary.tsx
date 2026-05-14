import { Link } from "react-router-dom";
import { useCart } from "@/store/cart";

export const CartSummary = ({ ctaTo = "/checkout", ctaLabel = "Proceed to Checkout" }: { ctaTo?: string; ctaLabel?: string }) => {
  const subtotal = useCart((s) => s.subtotal());
  const items = useCart((s) => s.items);
  const platformFee = Math.round(subtotal * 0.05 * 100) / 100;
  const gst = Math.round(platformFee * 0.18 * 100) / 100;
  const total = Math.round((subtotal + platformFee + gst) * 100) / 100;

  return (
    <aside className="rounded-2xl bg-card border border-border/60 shadow-card p-5 sticky top-24">
      <h3 className="font-display font-semibold text-lg mb-4">Order Summary</h3>
      <dl className="space-y-2.5 text-sm">
        <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal ({items.length} items)</dt><dd className="font-medium">₹{subtotal.toLocaleString("en-IN")}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Platform Fee (5%)</dt><dd className="font-medium">₹{platformFee.toLocaleString("en-IN")}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">GST (18%)</dt><dd className="font-medium">₹{gst.toLocaleString("en-IN")}</dd></div>
        <div className="border-t border-border pt-3 mt-3 flex justify-between text-base">
          <dt className="font-semibold">Total</dt>
          <dd className="font-display font-bold text-xl">₹{total.toLocaleString("en-IN")}</dd>
        </div>
      </dl>
      {items.length > 0 && (
        <Link
          to={ctaTo}
          className="mt-5 w-full inline-flex items-center justify-center h-12 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-brown-mid transition-colors active:scale-[0.98]"
        >
          {ctaLabel}
        </Link>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground text-center">All prices include platform fees · Secure checkout</p>
    </aside>
  );
};
