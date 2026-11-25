import { useState } from "react";
import { Link } from "react-router-dom";
import { PolicyLayout } from "@/components/PolicyLayout";
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Truck,
  Clock,
  ShieldAlert,
  ShieldCheck,
  PackageCheck,
  UtensilsCrossed,
  Sparkles,
  Shirt,
  Palette,
  CreditCard,
  FileCheck2,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function ReturnPolicy() {
  return (
    <PolicyLayout
      title="Return, Refund & Cancellation Policy"
      subtitle="Simple, transparent, and fair policies designed to give you complete peace of mind while savoring authentic Gujarati delicacies and handicrafts."
      lastUpdated="October 2024"
      activePolicy="returns"
      icon={<RotateCcw className="h-8 w-8 text-primary" />}
    >
      {/* ─── 1. Key Highlights Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm hover:border-amber-300 transition-all">
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
            <Clock size={22} />
          </div>
          <h4 className="font-semibold text-foreground text-base">7-Day Window</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Eligible non-perishable goods (Handicrafts, Textiles & Utensils) can be returned or exchanged within 7 days.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm hover:border-amber-300 transition-all">
          <div className="h-11 w-11 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center mb-3">
            <UtensilsCrossed size={22} />
          </div>
          <h4 className="font-semibold text-foreground text-base">Fresh Food Guarantee</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Perishable sweets and farsan damaged or spoiled in transit are 100% replaced or refunded upon photo review.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm hover:border-amber-300 transition-all">
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
            <Truck size={22} />
          </div>
          <h4 className="font-semibold text-foreground text-base">Free Reverse Pickup</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            We arrange complimentary reverse pickup from your doorstep for all approved return and exchange requests.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm hover:border-amber-300 transition-all">
          <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
            <CreditCard size={22} />
          </div>
          <h4 className="font-semibold text-foreground text-base">3-5 Day Refunds</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Money is credited directly to your original bank, UPI, or card account within 3 to 5 working business days.
          </p>
        </div>
      </div>

      <div className="space-y-12">
        {/* ─── 2. Overview & Philosophy ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Our Marketplace Commitment
            </h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
            At <strong className="text-foreground">Gujju Ni Dukan</strong>, we bridge the gap between traditional family vendors, home cooks, and artisan cooperatives in Gujarat and patrons across the nation. Because our bazaar features both edible delicacies and handcrafted heritage artifacts, our return guidelines are customized to balance customer satisfaction with food hygiene regulations.
          </p>
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <ShieldCheck size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Buyer Protection Guarantee:</strong> If a vendor fails to resolve an eligible return or defective shipment issue within 48 hours, Gujju Ni Dukan customer resolution desk steps in to guarantee your refund.
            </p>
          </div>
        </section>

        {/* ─── 3. Category Eligibility Breakdown ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Category-Specific Return Eligibility
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Rules vary depending on whether the item is a perishable food product or durable craftsmanship.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Food Card */}
            <div className="p-5 rounded-xl border border-border/80 bg-background/50 hover:bg-background transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                  <UtensilsCrossed size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">
                    Snacks, Sweets & Farsan
                  </h3>
                  <span className="text-[11px] font-medium text-orange-600 dark:text-orange-400">
                    Khakhra, Fafda, Gathiya, Mohanthal, Peda
                  </span>
                </div>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span><strong>Opened/Intact packages:</strong> Non-returnable due to health, hygiene, and FSSAI safety norms once delivered safely.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Transit Damage or Expired:</strong> 100% eligible for immediate replacement or refund. Report within <strong>48 hours</strong> with photos of the unboxing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>No reverse pickup needed:</strong> You do not need to ship spoiled or crushed food items back!</span>
                </li>
              </ul>
            </div>

            {/* Pickles & Spices Card */}
            <div className="p-5 rounded-xl border border-border/80 bg-background/50 hover:bg-background transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">
                    Pickles, Chutneys & Spices
                  </h3>
                  <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    Chhundo, Mango Achar, Masalas & Seasonings
                  </span>
                </div>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span><strong>Intact seals:</strong> May be returned within 48 hours if delivered incorrect product.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Broken Jar / Oil Leakage:</strong> Free replacement bottle dispatched or refund issued instantly upon verification.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldAlert size={15} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>Unsealed or partially consumed jars cannot be returned.</span>
                </li>
              </ul>
            </div>

            {/* Handicrafts Card */}
            <div className="p-5 rounded-xl border border-border/80 bg-background/50 hover:bg-background transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Palette size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">
                    Handicrafts & Home Decor
                  </h3>
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    Lippan Art, Brassware, Torans, Wall Hangings
                  </span>
                </div>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>7-Day Window:</strong> Return or replace within 7 days from delivery date if received broken, scratched, or mismatched.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span><strong>Artisan Character:</strong> Minor variations in handmade brush strokes or natural clay texture are authentic artisan signatures and not considered manufacturing flaws.</span>
                </li>
              </ul>
            </div>

            {/* Clothing Card */}
            <div className="p-5 rounded-xl border border-border/80 bg-background/50 hover:bg-background transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  <Shirt size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">
                    Traditional Clothing & Apparel
                  </h3>
                  <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                    Chaniya Choli, Bandhani Sarees, Kurtas, Dupattas
                  </span>
                </div>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>7-Day Size Exchange:</strong> Free replacement for different size subject to vendor inventory.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Condition:</strong> Must be unworn, unwashed, unaltered, and with all original brand tags intact in the original packaging.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ─── 4. Step-by-Step Return Process ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                How to Submit a Return Request
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Follow these 4 simple steps directly inside your customer dashboard.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 relative">
              <span className="text-3xl font-display font-bold text-primary/20 absolute top-3 right-4">
                01
              </span>
              <h4 className="font-semibold text-foreground text-sm mb-1.5">Open Your Orders</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Log in to your account, visit <Link to="/account" className="text-primary hover:underline">My Orders</Link>, and locate the specific item.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 relative">
              <span className="text-3xl font-display font-bold text-primary/20 absolute top-3 right-4">
                02
              </span>
              <h4 className="font-semibold text-foreground text-sm mb-1.5">Upload Clear Photos</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Click "Request Return" and upload clear photos showing the package label, item damage, or seal status.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 relative">
              <span className="text-3xl font-display font-bold text-primary/20 absolute top-3 right-4">
                03
              </span>
              <h4 className="font-semibold text-foreground text-sm mb-1.5">Quick Review</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our team and the vendor review the claim within 24 to 48 hours and approve reverse pickup or instant refund.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 relative">
              <span className="text-3xl font-display font-bold text-primary/20 absolute top-3 right-4">
                04
              </span>
              <h4 className="font-semibold text-foreground text-sm mb-1.5">Refund or Exchange</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your replacement parcel is dispatched or refund is credited back to your payment mode within 3-5 working days.
              </p>
            </div>
          </div>
        </section>

        {/* ─── 5. Cancellation Policy ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              4
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Order Cancellation Guidelines
            </h2>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">Before Dispatch:</strong> You can cancel your order anytime before the vendor has dispatched it from their warehouse. Simply go to <Link to="/account" className="text-primary hover:underline">My Orders</Link> and select <em>Cancel Order</em>. 100% of the transaction amount will be refunded immediately.
            </p>
            <p>
              <strong className="text-foreground">After Dispatch:</strong> Once the parcel is handed over to logistics carriers (Delhivery, BlueDart, Shiprocket, etc.), the shipment cannot be intercepted midway. In such cases, you may decline the delivery at your door or initiate a standard return upon receipt.
            </p>
          </div>
        </section>

        {/* ─── 6. Refund Timelines & Methods ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              5
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Refund Disbursement Timelines
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border/80 text-foreground font-semibold">
                  <th className="py-3 px-4">Payment Method Used</th>
                  <th className="py-3 px-4">Refund Destination</th>
                  <th className="py-3 px-4">Estimated Processing Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-muted-foreground">
                <tr>
                  <td className="py-3 px-4 font-medium text-foreground">UPI (GPay, PhonePe, Paytm)</td>
                  <td className="py-3 px-4">Original Linked Bank Account</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">24 to 48 Hours</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-foreground">Credit / Debit Cards</td>
                  <td className="py-3 px-4">Original Card Issuer Account</td>
                  <td className="py-3 px-4">3 to 5 Banking Business Days</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-foreground">Net Banking</td>
                  <td className="py-3 px-4">Source Bank Account</td>
                  <td className="py-3 px-4">2 to 4 Banking Business Days</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-foreground">Gujju Wallet / Store Credit</td>
                  <td className="py-3 px-4">Customer Account Balance</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">Instant (within 5 minutes)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── 7. Interactive FAQs ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <HelpCircle size={18} />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Got questions? Here are quick answers to the most common queries.
              </p>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="faq-1">
              <AccordionTrigger className="text-sm sm:text-base font-semibold text-foreground text-left">
                What should I do if my snacks or sweets arrived damaged or crushed?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Take 2 to 3 photos of the outer shipping box and the damaged product packaging within 48 hours of delivery. Go to your <Link to="/account" className="text-primary hover:underline">Account Orders</Link> section and click "Request Return/Refund". We will process an immediate free replacement or refund without requiring you to ship the food back.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-2">
              <AccordionTrigger className="text-sm sm:text-base font-semibold text-foreground text-left">
                Who pays for the reverse courier pickup on handicrafts or clothing?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Gujju Ni Dukan and the respective vendor bear 100% of the reverse pickup courier costs for all verified returns and size exchanges. You will never be asked to pay the courier agent.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-3">
              <AccordionTrigger className="text-sm sm:text-base font-semibold text-foreground text-left">
                Can I exchange a Chaniya Choli or Kurta for a different size?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Yes! Within 7 days of receiving your outfit, request an exchange specifying the preferred size. As long as the garment has not been worn or washed and tags are intact, we arrange reverse pickup and deliver your new size.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4">
              <AccordionTrigger className="text-sm sm:text-base font-semibold text-foreground text-left">
                What happens if a vendor rejects my claim or does not respond?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Our <strong>Buyer Protection Policy</strong> guarantees that Gujju Ni Dukan independently audits every rejected claim. If the vendor does not respond within 48 hours or inappropriately declines a valid damaged product claim, Gujju Ni Dukan steps in and disburses the refund directly to your account.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </PolicyLayout>
  );
}
