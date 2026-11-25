import { Link } from "react-router-dom";
import { PolicyLayout } from "@/components/PolicyLayout";
import {
  FileText,
  Scale,
  Building2,
  Store,
  BadgeAlert,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Gavel
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function TermsAndConditions() {
  return (
    <PolicyLayout
      title="Terms & Conditions of Service"
      subtitle="The user agreement governing your access, transactions, and interactions across the Gujju Ni Dukan multi-vendor marketplace platform."
      lastUpdated="October 2024"
      activePolicy="terms"
      icon={<FileText className="h-8 w-8 text-primary" />}
    >
      {/* ─── 1. Highlights Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm hover:border-amber-300 transition-all">
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
            <Store size={22} />
          </div>
          <h4 className="font-semibold text-foreground text-base">Marketplace Model</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Gujju Ni Dukan connects independent, verified Gujarati vendors directly with discerning buyers across India.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm hover:border-amber-300 transition-all">
          <div className="h-11 w-11 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center mb-3">
            <Sparkles size={22} />
          </div>
          <h4 className="font-semibold text-foreground text-base">Artisan Authenticity</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Handcrafted bandhani and lippan art reflect unique artisan craft signatures celebrated across Gujarat.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm hover:border-amber-300 transition-all">
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
            <ShieldCheck size={22} />
          </div>
          <h4 className="font-semibold text-foreground text-base">Buyer Protection</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Escrow-backed order processing guarantees that vendor payments are released only upon successful customer fulfillment.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm hover:border-amber-300 transition-all">
          <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
            <Gavel size={22} />
          </div>
          <h4 className="font-semibold text-foreground text-base">Ahmedabad Jurisdiction</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            All marketplace disputes are governed by Indian law under the exclusive jurisdiction of Ahmedabad courts.
          </p>
        </div>
      </div>

      <div className="space-y-12">
        {/* ─── 2. Acceptance of Terms ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Acceptance of User Agreement
            </h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            By visiting, registering, or transacting on <strong className="text-foreground">Gujju Ni Dukan</strong> (accessible at gujjunidukan.com and related web applications), you agree to be legally bound by these Terms and Conditions, our <Link to="/privacy-policy" className="text-primary hover:underline font-medium">Privacy Policy</Link>, and our <Link to="/return-policy" className="text-primary hover:underline font-medium">Return & Refund Policy</Link>. If you do not consent to these terms, you must refrain from using the platform.
          </p>
        </section>

        {/* ─── 3. Platform Architecture & Marketplace Model ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                The Multi-Vendor Marketplace Structure
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Understanding the relationship between buyers, sellers, and Gujju Ni Dukan.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <div className="p-4 rounded-xl border border-border/70 bg-background/50">
              <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1">
                A. Gujju Ni Dukan as an Intermediary Platform
              </h3>
              <p>
                Gujju Ni Dukan acts as a digital multi-vendor platform under Section 79 of the Information Technology Act, 2000. We curate authentic vendors, facilitate discovery, provide catalog indexing, and streamline digital payments.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-background/50">
              <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1">
                B. Independent Vendor Obligations
              </h3>
              <p>
                Each vendor operating a shop on Gujju Ni Dukan is an independent seller responsible for product quality, truthful listings, and regulatory compliance (including valid FSSAI food licenses for farsan and sweets sellers, and GSTIN registration).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-background/50">
              <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1">
                C. Escrow & Buyer Safeguard
              </h3>
              <p>
                To protect buyers from substandard goods or non-delivery, Gujju Ni Dukan holds funds in escrow and releases settlement payouts to vendors only after tracking confirms successful doorstep delivery and expiry of the critical return window.
              </p>
            </div>
          </div>
        </section>

        {/* ─── 4. Product Listings, Pricing & Taxes ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              3
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Pricing, Taxes & Inadvertent Errors
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p>
              • <strong>Currency & Taxes:</strong> All product prices are quoted in Indian Rupees (INR) and include applicable Goods and Services Tax (GST) unless explicitly noted during checkout.
            </p>
            <p>
              • <strong>Shipping Charges:</strong> Shipping fees are calculated dynamically based on package weight, regional pincode distance from the vendor's Gujarati warehouse, and carrier rates.
            </p>
            <p>
              • <strong>Pricing Corrections:</strong> While vendors strive for pinpoint accuracy, occasional typographical errors may occur. In the event an item is listed at an incorrect price due to technical error, the vendor reserves the right to cancel the order with an immediate 100% refund.
            </p>
          </div>
        </section>

        {/* ─── 5. Handmade Crafts & Food Allergens ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Artisan Disclaimers & Food Allergen Notice
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Essential advisory notes for traditional Gujarati items.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-semibold mb-2 text-sm">
                <Sparkles size={18} className="text-amber-600" />
                Handmade Crafts Character
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Traditional handicrafts (such as Bandhani tie-dye, Patola weaving, Lippan mud-mirror art, and brassware) are crafted by hand by Gujarati artisans. Natural variations in color dye, minor imperfections in mirror placement, or weave textures are cherished hallmarks of authentic handcrafted artistry and do not constitute defective merchandise.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-orange-200/80 dark:border-orange-800/60 bg-orange-50/40 dark:bg-orange-950/20">
              <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200 font-semibold mb-2 text-sm">
                <AlertTriangle size={18} className="text-orange-600" />
                Food Allergens Advisory
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Many authentic Gujarati snacks (such as Gathiya, Sev, Chevdo, Mohanthal, Ghari, and Peda) contain or are processed in facilities handling peanuts, sesame seeds (til), mustard, tree nuts (almonds, cashews, pistachios), dairy (ghee, mawa), and gluten. Customers with severe dietary allergies must carefully review product descriptions before purchasing.
              </p>
            </div>
          </div>
        </section>

        {/* ─── 6. User Code of Conduct ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              5
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              User Conduct & Prohibited Activities
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
            When engaging with Gujju Ni Dukan, users explicitly agree not to:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-muted-foreground">
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/60">
              <span className="font-semibold text-foreground block mb-1">✕ Fake or Spurious Orders</span>
              <span>Placing bad-faith orders, repeated unprovoked COD refusals, or exploiting return loopholes.</span>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/60">
              <span className="font-semibold text-foreground block mb-1">✕ Data Scraping & Bots</span>
              <span>Deploying automated scripts, crawlers, or scrapers to extract catalog data, images, or vendor contact info.</span>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/60">
              <span className="font-semibold text-foreground block mb-1">✕ Review Manipulation</span>
              <span>Publishing defamatory, false, or competitor-sponsored reviews intended to harm genuine artisans.</span>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/60">
              <span className="font-semibold text-foreground block mb-1">✕ Vendor Harassment</span>
              <span>Circumventing platform communication channels to harass individual artisans or off-platform solicitation.</span>
            </div>
          </div>
        </section>

        {/* ─── 7. Intellectual Property ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              6
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Intellectual Property Rights
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            All proprietary software, logos, trademarks, website layouts, color palettes, product categorization structures, and editorial narratives on Gujju Ni Dukan are the intellectual property of Gujju Ni Dukan or its respective licensed vendors. Reproduction or unauthorized redistribution without express written consent is strictly prohibited.
          </p>
        </section>

        {/* ─── 8. Governing Law & Dispute Resolution ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              7
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Governing Law & Legal Jurisdiction
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
            These Terms of Service are construed and enforced in accordance with the substantive laws of the Republic of India. In the event of any irreconcilable dispute arising out of platform transactions or vendor contracts:
          </p>
          <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 text-xs sm:text-sm text-foreground space-y-2">
            <p className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Parties shall first attempt amicable dispute mediation through Gujju Ni Dukan Grievance Desk.</span>
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Failing resolution, the courts of competent jurisdiction at <strong>Ahmedabad, Gujarat, India</strong> shall possess exclusive legal venue.</span>
            </p>
          </div>
        </section>

        {/* ─── 9. Terms FAQ ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <HelpCircle size={18} />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Terms of Service FAQs
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Common questions about buyer-seller agreements on our platform.
              </p>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="faq-terms-1">
              <AccordionTrigger className="text-sm sm:text-base font-semibold text-foreground text-left">
                Who am I buying from — Gujju Ni Dukan or individual vendors?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                You are purchasing directly from independent, verified Gujarati vendors and artisans hosted on the Gujju Ni Dukan marketplace. The vendor name and store profile is displayed on each product page and on your tax invoice.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-terms-2">
              <AccordionTrigger className="text-sm sm:text-base font-semibold text-foreground text-left">
                Are all food vendors registered with FSSAI?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Yes. In accordance with Food Safety and Standards Authority of India (FSSAI) e-commerce regulations, all vendors listing sweets, snacks, pickles, and food items must provide a valid FSSAI registration or license number during vendor onboarding.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-terms-3">
              <AccordionTrigger className="text-sm sm:text-base font-semibold text-foreground text-left">
                What if an item goes out of stock after I have paid?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                If a vendor experiences an unexpected inventory shortage, you will be notified immediately via email/SMS, and a 100% full refund will be processed back to your original payment method within 24 to 48 hours.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </PolicyLayout>
  );
}
