import { Link } from "react-router-dom";
import { useCart } from "@/store/cart";
import { useState, useEffect } from "react";
import api from "@/lib/api";

export const CartSummary = ({ 
  ctaTo = "/checkout", 
  ctaLabel = "Proceed to Checkout", 
  hideCta = false,
  appliedCoupon = null
}: { 
  ctaTo?: string; 
  ctaLabel?: string; 
  hideCta?: boolean;
  appliedCoupon?: any;
}) => {
  const subtotal = useCart((s) => s.subtotal());
  const items = useCart((s) => s.items);
  const discount = appliedCoupon ? parseFloat(appliedCoupon.discount_amount) : 0;
  const subAfterDiscount = Math.max(0, subtotal - discount);

  const [config, setConfig] = useState({ gst_percentage: 18, platform_fee_percentage: 5 });

  useEffect(() => {
    api.get("/platform-config/")
      .then((res: any) => {
        if (res) {
          setConfig({
            gst_percentage: parseFloat(res.gst_percentage),
            platform_fee_percentage: parseFloat(res.platform_fee_percentage)
          });
        }
      })
      .catch((err) => console.error("Error fetching platform config:", err));
  }, []);

  const platformFee = Math.round(subAfterDiscount * (config.platform_fee_percentage / 100) * 100) / 100;
  const gst = Math.round(platformFee * (config.gst_percentage / 100) * 100) / 100;
  const total = Math.round((subAfterDiscount + platformFee + gst) * 100) / 100;

  return (
    <aside className={`rounded-2xl bg-card border border-border/60 shadow-card p-5 sticky top-24${hideCta ? " max-w-xs" : ""}`}>
      <h3 className="font-display font-semibold text-lg mb-4">Order Summary</h3>
      <dl className="space-y-2.5 text-sm">
        <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal ({items.length} items)</dt><dd className="font-medium">₹{subtotal.toLocaleString("en-IN")}</dd></div>
        {discount > 0 && appliedCoupon && (
          <div className="flex justify-between text-success font-semibold">
            <dt>Coupon Discount ({appliedCoupon.code})</dt>
            <dd>-₹{discount.toLocaleString("en-IN")}</dd>
          </div>
        )}
        <div className="flex justify-between"><dt className="text-muted-foreground">Platform Fee ({config.platform_fee_percentage}%)</dt><dd className="font-medium">₹{platformFee.toLocaleString("en-IN")}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">GST ({config.gst_percentage}%)</dt><dd className="font-medium">₹{gst.toLocaleString("en-IN")}</dd></div>
        <div className="border-t border-border pt-3 mt-3 flex justify-between text-base">
          <dt className="font-semibold">Total</dt>
          <dd className="font-display font-bold text-xl">₹{total.toLocaleString("en-IN")}</dd>
        </div>
      </dl>
      {!hideCta && items.length > 0 && (
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

