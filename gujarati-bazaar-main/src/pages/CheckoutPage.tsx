import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Smartphone, Banknote, Check, Loader2, Ticket } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { CheckoutStepper } from "@/components/CheckoutStepper";
import { CartSummary } from "@/components/CartSummary";
import { useCart, cartLineUnitPrice, cartLineId } from "@/store/cart";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { State, City } from 'country-state-city';

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

const FloatSelect = ({ label, error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string }) => (
  <div className="float-label">
    <select
      {...props}
      className={`w-full h-12 px-3 pt-1 rounded-xl border ${error ? "border-red-400" : "border-border"} bg-card outline-none focus:border-brown-light text-sm appearance-none`}
    >
      {children}
    </select>
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
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(false);

  useEffect(() => {
    const fetchAvailableCoupons = async () => {
      setLoadingCoupons(true);
      try {
        const res: any = await api.get('/coupons/active/');
        setAvailableCoupons(res || []);
      } catch (err) {
        console.error("Failed to fetch active coupons:", err);
      } finally {
        setLoadingCoupons(false);
      }
    };
    fetchAvailableCoupons();
  }, []);

  const [platformConfig, setPlatformConfig] = useState({ platform_fee: 0, platform_fee_gst: 18, shipping_charge: 0, shipping_charge_gst: 18 });

  useEffect(() => {
    api.get("/platform-config/")
      .then((res: any) => {
        if (res) {
          setPlatformConfig({
            platform_fee: parseFloat(res.platform_fee || 0),
            platform_fee_gst: parseFloat(res.platform_fee_gst || 18),
            shipping_charge: parseFloat(res.shipping_charge || 0),
            shipping_charge_gst: parseFloat(res.shipping_charge_gst || 18)
          });
        }
      })
      .catch((err) => console.error("Error fetching platform config:", err));
  }, []);
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = useAuth();

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
          const matchedState = State.getStatesOfCountry('IN').find(s => s.name.toLowerCase() === (defaultAddr.state || "").toLowerCase())?.name || defaultAddr.state || "";
          const matchedCity = City.getCitiesOfState('IN', State.getStatesOfCountry('IN').find(s => s.name === matchedState)?.isoCode || '').find(c => c.name.toLowerCase() === (defaultAddr.city || "").toLowerCase())?.name || defaultAddr.city || "";
          return {
            ...prev,
            fullName: user.name || prev.fullName,
            email: user.email || prev.email,
            phone: user.profile?.phone || prev.phone,
            addressLine: defaultAddr.street || "",
            city: matchedCity,
            state: matchedState,
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
    if (!isLoading && !isAuthenticated) {
      toast.error("Please log in to checkout");
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const go = (s: number) => { setDirection(s > step ? 1 : -1); setStep(s); };

  const validateAddress = () => {
    const newErrors: Record<string, string> = {};
    if (!address.fullName.trim()) newErrors.fullName = "Required";
    if (!address.phone.trim() || !/^[6-9]\d{9}$/.test(address.phone.trim())) newErrors.phone = "Enter a valid 10-digit number starting with 6-9";
    if (!address.addressLine.trim()) newErrors.addressLine = "Required";
    if (!address.city.trim()) newErrors.city = "Required";
    if (!address.state.trim()) newErrors.state = "Required";
    if (!address.pincode.trim() || !/^\d{6}$/.test(address.pincode.trim())) newErrors.pincode = "Enter a valid 6-digit pincode";
    if (!address.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) newErrors.email = "Enter a valid email";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddressSubmitStep = async () => {
    if (validateAddress()) {
      if (saveAddressToProfile) {
        try {
          await api.post("/addresses/", {
            street: address.addressLine,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            is_default: false,
          });
          toast.success("Address saved to profile!");
        } catch (err) {
          console.error("Failed to save address to profile:", err);
          toast.error("Failed to save address to profile");
        }
      }
      go(2);
    }
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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    setValidatingCoupon(true);
    try {
      const res: any = await api.post("/cart/validate-coupon/", {
        code: couponCode.trim().toUpperCase()
      });
      setAppliedCoupon(res);
      toast.success(`Coupon "${res.code}" applied!`, {
        description: `You saved ₹${parseFloat(res.discount_amount).toLocaleString("en-IN")} on this order.`
      });
      setCouponCode("");
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || err?.response?.data?.detail || "Invalid coupon code";
      toast.error(errMsg);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    if (appliedCoupon) {
      toast.info(`Coupon "${appliedCoupon.code}" removed.`);
      setAppliedCoupon(null);
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
      const checkoutRes: any = await api.post("/checkout/", {
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined
      });
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
              coupon_code: appliedCoupon ? appliedCoupon.code : undefined
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
  }, [payment, address, items, clear, navigate, appliedCoupon]);

  if (isLoading || !isAuthenticated) return null;

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
                            onClick={() => {
                              const matchedState = State.getStatesOfCountry('IN').find(s => s.name.toLowerCase() === (addr.state || "").toLowerCase())?.name || addr.state || "";
                              const matchedCity = City.getCitiesOfState('IN', State.getStatesOfCountry('IN').find(s => s.name === matchedState)?.isoCode || '').find(c => c.name.toLowerCase() === (addr.city || "").toLowerCase())?.name || addr.city || "";
                              setAddress(prev => ({
                                ...prev,
                                addressLine: addr.street,
                                city: matchedCity,
                                state: matchedState,
                                pincode: addr.pincode
                              }))
                            }}
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
                      <FloatSelect 
                        label="State" 
                        required 
                        value={address.state} 
                        onChange={(e) => setAddress({ ...address, state: e.target.value, city: '' })} 
                        error={errors.state} 
                      >
                        <option value="" disabled></option>
                        {State.getStatesOfCountry('IN').map(state => (
                          <option key={state.isoCode} value={state.name}>{state.name}</option>
                        ))}
                      </FloatSelect>
                      <FloatSelect 
                        label="City" 
                        required 
                        value={address.city} 
                        onChange={(e) => setAddress({ ...address, city: e.target.value })} 
                        error={errors.city} 
                        disabled={!address.state}
                      >
                        <option value="" disabled></option>
                        {(address.state ? City.getCitiesOfState('IN', State.getStatesOfCountry('IN').find(s => s.name === address.state)?.isoCode || '') : []).map((city: any) => (
                          <option key={city.name} value={city.name}>{city.name}</option>
                        ))}
                      </FloatSelect>
                    <FloatInput label="Pincode" inputMode="numeric" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} error={errors.pincode} />
                    <FloatInput label="Email" type="email" value={address.email} onChange={(e) => setAddress({ ...address, email: e.target.value })} error={errors.email} />
                  </div>
                  <div className="mt-4 flex items-center gap-2 px-1">
                    <input
                      id="save-address-profile"
                      type="checkbox"
                      checked={saveAddressToProfile}
                      onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                    />
                    <label htmlFor="save-address-profile" className="text-xs font-medium text-muted-foreground select-none cursor-pointer hover:text-foreground transition-colors">
                      Save this address to my profile for future orders
                    </label>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button onClick={handleAddressSubmitStep} className="h-11 px-6 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-brown-mid">Continue to Payment</button>
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
                      { id: "cod", icon: Banknote, title: "Cash on Delivery", desc: "Pay when it arrives", disabled: true },
                    ].map((p) => {
                      const active = payment === p.id;
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.id}
                          disabled={p.disabled}
                          onClick={() => !p.disabled && setPayment(p.id as any)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${p.disabled ? "opacity-50 cursor-not-allowed border-border" : active ? "border-accent bg-accent/5" : "border-border hover:border-brown-light"}`}
                        >
                          <div className={`h-11 w-11 grid place-items-center rounded-xl ${active ? "bg-accent text-accent-foreground" : "bg-secondary text-brown-mid"}`}>
                            <Icon size={18} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{p.title}</span>
                              {p.disabled && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-muted text-muted-foreground uppercase tracking-wide">Offline</span>
                              )}
                            </div>
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
                    const discount = appliedCoupon ? parseFloat(appliedCoupon.discount_amount) : 0;
                    const pf = platformConfig.platform_fee || 0;
                    const gst = Math.round(pf * (platformConfig.platform_fee_gst / 100) * 100) / 100;
                    const shipping = platformConfig.shipping_charge || 0;
                    const shippingGst = Math.round(shipping * (platformConfig.shipping_charge_gst / 100) * 100) / 100;
                    const tot = Math.round(Math.max(0, sub + pf + gst + shipping + shippingGst - discount) * 100) / 100;
                    return (
                      <dl className="mt-4 space-y-1.5 text-sm">
                        <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-medium">₹{sub.toLocaleString("en-IN")}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Platform Fee</dt><dd className="font-medium">₹{(pf + gst).toLocaleString("en-IN")}</dd></div>
                        {shipping > 0 && (
                          <div className="flex justify-between"><dt className="text-muted-foreground">Shipping Charge</dt><dd className="font-medium">₹{(shipping + shippingGst).toLocaleString("en-IN")}</dd></div>
                        )}
                        {discount > 0 && appliedCoupon && (
                          <div className="flex justify-between text-success font-semibold">
                            <dt>Coupon Discount ({appliedCoupon.code})</dt>
                            <dd>-₹{discount.toLocaleString("en-IN")}</dd>
                          </div>
                        )}
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
        <div className="space-y-6">
          <CartSummary hideCta appliedCoupon={appliedCoupon} />
          
          {/* Glassmorphic Promo Code Input Block */}
          <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2">
              <Ticket size={16} className="text-primary animate-pulse" />
              <h4 className="font-display font-semibold text-sm text-foreground">Have a Promo Code?</h4>
            </div>
            
            {!appliedCoupon ? (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Code (e.g. WELCOME10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    className="flex-1 px-3 py-2.5 text-xs rounded-xl border border-border bg-muted/30 outline-none focus:border-primary font-mono tracking-wider uppercase transition-colors"
                  />
                  <button
                    id="apply-coupon-btn"
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    className="px-4 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-brown-mid transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[75px]"
                  >
                    {validatingCoupon ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>

                {/* Available Coupons List */}
                {availableCoupons.length > 0 && (
                  <div className="pt-3 border-t border-border/60 space-y-2">
                    <p className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Available Coupons</p>
                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                      {availableCoupons.map((coupon) => (
                        <div 
                          key={coupon.id} 
                          className="relative p-2.5 bg-muted/30 hover:bg-muted/50 border border-border/80 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                          onClick={() => {
                            setCouponCode(coupon.code);
                            // Auto trigger Apply button
                            setTimeout(() => {
                              const btn = document.getElementById("apply-coupon-btn");
                              if (btn) btn.click();
                            }, 50);
                          }}
                        >
                          {/* Side notch cutouts */}
                          <div className="absolute -left-1 w-2 h-3.5 bg-card border border-border rounded-full"></div>
                          <div className="absolute -right-1 w-2 h-3.5 bg-card border border-border rounded-full"></div>
                          
                          <div className="flex items-center gap-2 pl-1.5">
                            <Ticket size={12} className="text-primary group-hover:scale-110 transition-transform" />
                            <div className="text-left">
                              <span className="font-mono text-xs font-black text-foreground tracking-wide uppercase">{coupon.code}</span>
                              <p className="text-[9px] text-muted-foreground mt-0.5">
                                {coupon.discount_type === 'rupee' 
                                  ? `₹${parseFloat(coupon.discount_value).toLocaleString()} off` 
                                  : `${parseFloat(coupon.discount_value)}% off`}
                                {parseFloat(coupon.min_purchase_amount) > 0 && ` on min buy ₹${parseFloat(coupon.min_purchase_amount)}`}
                              </p>
                            </div>
                          </div>
                          
                          <button 
                            type="button"
                            className="text-[9px] font-extrabold uppercase text-primary group-hover:text-brown-mid bg-secondary px-2.5 py-1.5 rounded-lg border border-border/40 whitespace-nowrap"
                          >
                            Apply
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Gorgeous Shimmering Ticket Stub cutouts layout */
              <div className="relative p-4 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 rounded-xl flex flex-col gap-2 overflow-hidden shadow-sm animate-fade-in">
                {/* Micro circle notches on the sides */}
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-5 bg-background border border-border rounded-full"></div>
                <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-5 bg-background border border-border rounded-full"></div>
                
                <div className="flex items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <Ticket size={14} />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-black text-emerald-800 tracking-wider uppercase">{appliedCoupon.code}</span>
                      <span className="ml-2 text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">Active</span>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-[10px] font-bold text-destructive hover:underline py-1 px-2 hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="border-t border-dashed border-border/80 my-1 mx-1"></div>
                
                <p className="text-[11px] text-muted-foreground px-1 font-medium">
                  🎉 Superb! You saved <span className="font-bold text-emerald-700">₹{parseFloat(appliedCoupon.discount_amount).toLocaleString("en-IN")}</span> on this order.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default CheckoutPage;
