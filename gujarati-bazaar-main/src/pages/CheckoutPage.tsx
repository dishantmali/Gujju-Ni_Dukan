import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Smartphone, Banknote, Check } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { CheckoutStepper } from "@/components/CheckoutStepper";
import { CartSummary } from "@/components/CartSummary";
import { useCart } from "@/store/cart";
import { toast } from "sonner";

const FloatInput = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <div className="float-label">
    <input
      {...props}
      placeholder=" "
      className="w-full h-12 px-3 pt-1 rounded-xl border border-border bg-card outline-none focus:border-brown-light text-sm"
    />
    <label>{label}</label>
  </div>
);

const CheckoutPage = () => {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [payment, setPayment] = useState<"upi" | "card" | "cod">("upi");
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const navigate = useNavigate();

  const go = (s: number) => { setDirection(s > step ? 1 : -1); setStep(s); };

  const placeOrder = () => {
    toast.success("Order placed!", { description: "You'll get a confirmation shortly." });
    clear();
    setTimeout(() => navigate("/account"), 1200);
  };

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
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FloatInput label="Full name" />
                    <FloatInput label="Phone number" inputMode="tel" />
                    <div className="sm:col-span-2"><FloatInput label="Address line" /></div>
                    <FloatInput label="City" />
                    <FloatInput label="State" />
                    <FloatInput label="Pincode" inputMode="numeric" />
                    <FloatInput label="Email" type="email" />
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button onClick={() => go(2)} className="h-11 px-6 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-brown-mid">Continue to Payment</button>
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
                      <div key={l.product.id} className="flex justify-between border-b border-border py-2">
                        <span className="text-muted-foreground">{l.product.name} × {l.qty}</span>
                        <span className="font-medium">₹{(l.product.price * l.qty).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">Payment: {payment.toUpperCase()}</p>
                  <div className="mt-6 flex justify-between">
                    <button onClick={() => go(2)} className="h-11 px-5 rounded-full bg-secondary text-foreground font-medium hover:bg-muted">Back</button>
                    <button onClick={placeOrder} className="h-11 px-6 rounded-full bg-accent text-accent-foreground font-semibold hover:opacity-95">Place Order</button>
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
