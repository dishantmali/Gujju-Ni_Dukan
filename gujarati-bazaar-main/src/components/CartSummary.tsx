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

  const [config, setConfig] = useState({ platform_fee: 0, platform_fee_gst: 18, shipping_charge: 0, shipping_charge_gst: 18 });

  useEffect(() => {
    api.get("/platform-config/")
      .then((res: any) => {
        if (res) {
          setConfig({
            platform_fee: parseFloat(res.platform_fee || 0),
            platform_fee_gst: parseFloat(res.platform_fee_gst || 18),
            shipping_charge: parseFloat(res.shipping_charge || 0),
            shipping_charge_gst: parseFloat(res.shipping_charge_gst || 18)
          });
        }
      })
      .catch((err) => console.error("Error fetching platform config:", err));
  }, []);

  const platformFee = config.platform_fee || 0;
  const gst = Math.round(platformFee * (config.platform_fee_gst / 100) * 100) / 100;
  const shippingCharge = config.shipping_charge || 0;
  const shippingGst = Math.round(shippingCharge * (config.shipping_charge_gst / 100) * 100) / 100;
  const total = Math.round(Math.max(0, subtotal + platformFee + gst + shippingCharge + shippingGst - discount) * 100) / 100;

  return (
    <aside className={`rounded-2xl bg-card border border-border/60 shadow-card p-5 sticky top-24${hideCta ? " max-w-xs" : ""}`}>
      <h3 className="font-display font-semibold text-lg mb-4">Order Summary</h3>
      <dl className="space-y-2.5 text-sm">
        <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal ({items.length} items)</dt><dd className="font-medium">₹{subtotal.toLocaleString("en-IN")}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Platform Fee</dt><dd className="font-medium">₹{(platformFee + gst).toLocaleString("en-IN")}</dd></div>
        {shippingCharge > 0 && (
          <div className="flex justify-between"><dt className="text-muted-foreground">Shipping Charge</dt><dd className="font-medium">₹{(shippingCharge + shippingGst).toLocaleString("en-IN")}</dd></div>
        )}
        {discount > 0 && appliedCoupon && (
          <div className="flex justify-between text-success font-semibold">
            <dt>Coupon Discount ({appliedCoupon.code})</dt>
            <dd>-₹{discount.toLocaleString("en-IN")}</dd>
          </div>
        )}
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

