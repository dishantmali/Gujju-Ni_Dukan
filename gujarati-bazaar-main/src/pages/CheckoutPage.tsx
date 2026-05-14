import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Smartphone, Banknote, Check, Loader2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { CheckoutStepper } from "@/components/CheckoutStepper";
import { CartSummary } from "@/components/CartSummary";
import { useCart, cartLineUnitPrice, cartLineId } from "@/store/cart";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const FloatInput = ({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) => (
  <div className="float-label">
    <input
      {...props}
      placeholder=" "
      className={`w-full h-12 px-3 pt-1 rounded-xl border ${error ? "border-red-400" : "border-border"} bg-card outline-none focus:border-brown-light text-sm`}
    />
    <label>{label}</label>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-checkout-js")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CheckoutPage = () => {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [payment, setPayment] = useState<"upi" | "card" | "cod">("upi");
  const [processing, setProcessing] = useState(false);
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setAddress((prev) => {
        if (prev.addressLine) {
          return {
            ...prev,
            fullName: user.name || prev.fullName,
            email: user.email || prev.email,
            phone: user.profile?.phone || prev.phone,
          };
        }
        const defaultAddr = user.addresses?.find(a => a.is_default) || user.addresses?.[0];
        if (defaultAddr) {
          return {
            ...prev,
            fullName: user.name || prev.fullName,
            email: user.email || prev.email,
            phone: user.profile?.phone || prev.phone,
            addressLine: defaultAddr.street || "",
            city: defaultAddr.city || "",
            state: defaultAddr.state || "",
            pincode: defaultAddr.pincode || ""
          };
        }
        return {
          ...prev,
          fullName: user.name || prev.fullName,
          email: user.email || prev.email,
          phone: user.profile?.phone || prev.phone,
        };
      });
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please log in to checkout");
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const go = (s: number) => { setDirection(s > step ? 1 : -1); setStep(s); };

  const validateAddress = () => {
    const newErrors: Record<string, string> = {};
    if (!address.fullName.trim()) newErrors.fullName = "Required";
    if (!address.phone.trim() || !/^\d{10}$/.test(address.phone.trim())) newErrors.phone = "Enter a valid 10-digit number";
    if (!address.addressLine.trim()) newErrors.addressLine = "Required";
    if (!address.city.trim()) newErrors.city = "Required";
    if (!address.state.trim()) newErrors.state = "Required";
    if (!address.pincode.trim() || !/^\d{6}$/.test(address.pincode.trim())) newErrors.pincode = "Enter a valid 6-digit pincode";
    if (!address.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) newErrors.email = "Enter a valid email";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mergeCart = async () => {
    const mergeItems = items
      .filter((l) => !isNaN(Number(l.product.id)) && l.product.id.toString() !== "")
      .map((l) => ({
        product_id: Number(l.product.id),
        variant_id: l.variant ? Number(l.variant.id) : undefined,
        quantity: l.qty,
      }));
    if (mergeItems.length > 0) {
      await api.post("/cart/merge/", { items: mergeItems });
    }
  };

  const placeOrder = useCallback(async () => {
    if (payment === "cod") {
      toast.error("Cash on Delivery is not available at the moment.");
      return;
    }

    if (!validateAddress()) {
      go(1);
      toast.error("Please fix the address errors");
      return;
    }

    setProcessing(true);
    try {
      const checkoutRes: any = await api.post("/checkout/");
      const { razorpay_order_id, razorpay_key_id, amount } = checkoutRes;

      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay");

      const options = {
        key: razorpay_key_id,
        amount,
        currency: "INR",
        name: "Gujju Ni Dukan",
        description: "Order Payment",
        order_id: razorpay_order_id,
        handler: async (response: any) => {
          try {
            await api.post("/payment/verify-cart/", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              address: `${address.fullName}\n${address.addressLine}\n${address.city}, ${address.state} - ${address.pincode}`,
              phone: address.phone,
            });
            toast.success("Order placed!", { description: "You'll get a confirmation shortly." });
            clear();
            navigate("/account");
          } catch (err: any) {
            toast.error(err?.response?.data?.error || "Payment verification failed");
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
        prefill: {
          name: address.fullName,
          email: address.email,
          contact: address.phone,
        },
        theme: { color: "#8B5E3C" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Checkout failed. Please try again.");
      setProcessing(false);
    }
  }, [payment, address, items, clear, navigate]);

  if (!isAuthenticated) return null;

  return (
    <PageShell>
      <div className="container py-8 grid lg:grid-cols-[1fr_360px] gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold mb-6">Checkout</h1>
          <CheckoutStepper step={step} steps={["Address", "Payment", "Confirm"]} />

          <div className="relative mt-8 overflow-hidden">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              {step === 1 && (
                <motion.div
                  key="addr"
                  custom={direction}
                  initial={{ x: direction * 60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -direction * 60, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl bg-card border border-border/60 p-6 shadow-sm"
                >
                  <h3 className="font-display text-lg font-semibold mb-5">Delivery Address</h3>
                  {user?.addresses && user.addresses.length > 0 && (
                    <div className="mb-6 space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Select a saved address</h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {user.addresses.map((addr) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => setAddress(prev => ({
                              ...prev,
                              addressLine: addr.street,
                              city: addr.city,
                              state: addr.state,
                              pincode: addr.pincode
                            }))}
                            className="text-left p-4 rounded-xl border border-border hover:border-primary transition-colors bg-card shadow-sm"
                          >
                            <p className="text-sm font-semibold mb-1 line-clamp-1">{addr.street}</p>
                            <p className="text-xs text-muted-foreground">{addr.city}, {addr.state}</p>
                            <p className="text-xs text-muted-foreground font-medium mt-1">PIN: {addr.pincode}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FloatInput label="Full name" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} error={errors.fullName} />
                    <FloatInput label="Phone number" inputMode="tel" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} error={errors.phone} />
                    <div className="sm:col-span-2"><FloatInput label="Address line" value={address.addressLine} onChange={(e) => setAddress({ ...address, addressLine: e.target.value })} error={errors.addressLine} /></div>
                    <FloatInput label="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} error={errors.city} />
                    <FloatInput label="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} error={errors.state} />
                    <FloatInput label="Pincode" inputMode="numeric" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} error={errors.pincode} />
                    <FloatInput label="Email" type="email" value={address.email} onChange={(e) => setAddress({ ...address, email: e.target.value })} error={errors.email} />
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button onClick={() => { if (validateAddress()) go(2); }} className="h-11 px-6 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-brown-mid">Continue to Payment</button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="pay"
                  custom={direction}
                  initial={{ x: direction * 60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -direction * 60, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl bg-card border border-border/60 p-6 shadow-sm"
                >
                  <h3 className="font-display text-lg font-semibold mb-5">Payment Method</h3>
                  <div className="space-y-3">
                    {[
                      { id: "upi", icon: Smartphone, title: "UPI", desc: "Pay with any UPI app" },
                      { id: "card", icon: CreditCard, title: "Credit / Debit Card", desc: "Visa, Mastercard, Rupay" },
                      { id: "cod", icon: Banknote, title: "Cash on Delivery", desc: "Pay when it arrives" },
                    ].map((p) => {
                      const active = payment === p.id;
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setPayment(p.id as any)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${active ? "border-accent bg-accent/5" : "border-border hover:border-brown-light"}`}
                        >
                          <div className={`h-11 w-11 grid place-items-center rounded-xl ${active ? "bg-accent text-accent-foreground" : "bg-secondary text-brown-mid"}`}>
                            <Icon size={18} />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{p.title}</div>
                            <div className="text-xs text-muted-foreground">{p.desc}</div>
                          </div>
                          {active && <div className="h-6 w-6 rounded-full bg-accent grid place-items-center text-accent-foreground"><Check size={14} /></div>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-6 flex justify-between">
                    <button onClick={() => go(1)} className="h-11 px-5 rounded-full bg-secondary text-foreground font-medium hover:bg-muted">Back</button>
                    <button onClick={() => go(3)} className="h-11 px-6 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-brown-mid">Review Order</button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="confirm"
                  custom={direction}
                  initial={{ x: direction * 60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -direction * 60, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl bg-card border border-border/60 p-6 shadow-sm"
                >
                  <h3 className="font-display text-lg font-semibold mb-5">Confirm Order</h3>
                  <div className="space-y-2 text-sm">
                    {items.map((l) => (
                      <div key={cartLineId(l)} className="flex justify-between border-b border-border py-2">
                        <span className="text-muted-foreground">{l.product.name} × {l.qty}</span>
                        <span className="font-medium">₹{(cartLineUnitPrice(l) * l.qty).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const sub = items.reduce((a, l) => a + cartLineUnitPrice(l) * l.qty, 0);
                    const pf = Math.round(sub * 0.05 * 100) / 100;
                    const gst = Math.round(pf * 0.18 * 100) / 100;
                    const tot = Math.round((sub + pf + gst) * 100) / 100;
                    return (
                      <dl className="mt-4 space-y-1.5 text-sm">
                        <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-medium">₹{sub.toLocaleString("en-IN")}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Platform Fee (5%)</dt><dd className="font-medium">₹{pf.toLocaleString("en-IN")}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">GST (18%)</dt><dd className="font-medium">₹{gst.toLocaleString("en-IN")}</dd></div>
                        <div className="border-t border-border pt-2 mt-2 flex justify-between text-base">
                          <dt className="font-semibold">You Pay</dt>
                          <dd className="font-display font-bold text-lg">₹{tot.toLocaleString("en-IN")}</dd>
                        </div>
                      </dl>
                    );
                  })()}
                  <p className="mt-4 text-xs text-muted-foreground">Payment: {payment === "cod" ? "Cash on Delivery" : payment.toUpperCase()}</p>
                  <div className="mt-6 flex justify-between">
                    <button onClick={() => go(2)} className="h-11 px-5 rounded-full bg-secondary text-foreground font-medium hover:bg-muted">Back</button>
                    <button
                      onClick={placeOrder}
                      disabled={processing || payment === "cod"}
                      className="h-11 px-6 rounded-full bg-accent text-accent-foreground font-semibold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                      {processing && <Loader2 size={16} className="animate-spin" />}
                      Place Order
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <CartSummary ctaTo="#" ctaLabel="Continue below ↓" />
      </div>
    </PageShell>
  );
};

export default CheckoutPage;
