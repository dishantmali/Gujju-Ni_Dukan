import { PolicyLayout } from "@/components/PolicyLayout";
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Database,
  UserCheck,
  FileText,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  KeyRound,
  Server,
  Cookie
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function PrivacyPolicy() {
  return (
    <PolicyLayout
      title="Privacy & Data Protection Policy"
      subtitle="How Gujju Ni Dukan collects, secures, and respects your personal information in compliance with Indian IT Laws and the Digital Personal Data Protection Act (DPDPA)."
      lastUpdated="October 2024"
      activePolicy="privacy"
      icon={<ShieldCheck className="h-8 w-8 text-primary" />}
    >
      {/* ─── 1. Highlights Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm hover:border-amber-300 transition-all">
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
            <Lock size={22} />
          </div>
          <h4 className="font-semibold text-foreground text-base">256-Bit SSL Encryption</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            All data transmitted between your browser and our servers is secured using bank-grade cryptographic protocols.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm hover:border-amber-300 transition-all">
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
            <EyeOff size={22} />
          </div>
          <h4 className="font-semibold text-foreground text-base">No Selling of Data</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            We never rent, trade, or monetize your personal details or contact numbers to advertising brokers.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm hover:border-amber-300 transition-all">
          <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
            <KeyRound size={22} />
          </div>
          <h4 className="font-semibold text-foreground text-base">Zero Card Storage</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Card details & UPI PINs are processed directly by RBI-licensed PCI-DSS gateways and never stored on our servers.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm hover:border-amber-300 transition-all">
          <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3">
            <UserCheck size={22} />
          </div>
          <h4 className="font-semibold text-foreground text-base">User Data Control</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            You hold complete authority to view, update, export, or permanently delete your account data at any moment.
          </p>
        </div>
      </div>

      <div className="space-y-12">
        {/* ─── 2. Scope & Regulatory Framework ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Scope & Legal Compliance
            </h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
            Gujju Ni Dukan ("we", "our", or "us") operates a trusted e-commerce marketplace dedicated to regional Gujarati snacks, sweets, pickles, handicrafts, and apparel. This Privacy Policy details our procedures regarding the collection, storage, handling, and transfer of personal information pursuant to:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-foreground">
            <li className="p-3 rounded-xl bg-secondary/50 border border-border/60 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>The Digital Personal Data Protection Act, 2023 (DPDPA)</span>
            </li>
            <li className="p-3 rounded-xl bg-secondary/50 border border-border/60 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Information Technology (Reasonable Security Practices) Rules, 2011</span>
            </li>
          </ul>
        </section>

        {/* ─── 3. Information We Collect ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Information We Collect
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                We only gather details necessary to facilitate smooth transactions and genuine artisan deliveries.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border/70 bg-background/50">
              <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <Database size={16} className="text-primary" /> A. Buyer Account & Delivery Information
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                When you create an account or place an order, we collect your full name, email address, mobile phone number, delivery address (address lines, city, state, pincode), and recipient contact instructions for couriers.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-background/50">
              <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <Server size={16} className="text-primary" /> B. Vendor Onboarding & Verification Information
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                For sellers registering on Gujju Ni Dukan, we collect trade names, store logo, owner identification, business address, phone number, GSTIN, PAN, FSSAI registration license (for food vendors), and bank payout account details.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-background/50">
              <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <Lock size={16} className="text-primary" /> C. Secure Transaction Data
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                We retain transaction reference numbers, order timestamps, and invoice breakdowns. <strong>Critical Note:</strong> Gujju Ni Dukan does not store your credit card numbers, CVVs, debit card PINs, or UPI security pins. These are handled solely by PCI-DSS certified payment processors.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-background/50">
              <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <Cookie size={16} className="text-primary" /> D. Technical Logs & Cookies
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                We collect IP addresses, device identifiers, browser types, and session cookies to maintain your shopping cart, preserve your login session, and guard against automated bot abuse.
              </p>
            </div>
          </div>
        </section>

        {/* ─── 4. How We Use Your Information ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              3
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              How We Utilize Your Information
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-muted-foreground">
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/60">
              <h4 className="font-semibold text-foreground mb-1">Order Fulfillment</h4>
              <p>Passing the delivery destination to our vendor so authentic farsan, sweets, or bandhani can be securely dispatched.</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/60">
              <h4 className="font-semibold text-foreground mb-1">Order Tracking & Updates</h4>
              <p>Sending OTP confirmations, tracking links, and order dispatch milestones via SMS, WhatsApp, or email.</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/60">
              <h4 className="font-semibold text-foreground mb-1">Customer Support & Returns</h4>
              <p>Facilitating prompt claims, handling damaged food replacements, and processing bank refunds.</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/60">
              <h4 className="font-semibold text-foreground mb-1">Fraud Prevention</h4>
              <p>Detecting illegitimate payment attempts, suspicious mass orders, and safeguarding vendor payouts.</p>
            </div>
          </div>
        </section>

        {/* ─── 5. Data Sharing & Third Parties ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              4
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Third-Party Data Sharing Rules
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
            We operate on a strict principle of least-privilege data disclosure. Your information is only shared with:
          </p>
          <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Fulfilling Vendors:</strong> Only the shipping address, customer name, and contact number necessary to address and dispatch the parcel.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Logistics Couriers:</strong> Integrated logistics partners (Delhivery, Shiprocket, BlueDart) to coordinate doorstep delivery and OTP collection.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Payment Gateways:</strong> Licensed aggregators for payment tokenization and settlement.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Statutory Authorities:</strong> Solely when compelled by law, court order, or official governmental fraud investigations.</span>
            </li>
          </ul>
        </section>

        {/* ─── 6. Your Rights & Data Control ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              5
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Your Rights Under Indian Data Law
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div className="p-4 rounded-xl border border-border/70 bg-background/50">
              <h4 className="font-semibold text-foreground mb-1">Right to Access & Edit</h4>
              <p className="text-muted-foreground">Update your phone number, password, or shipping addresses anytime in Account Settings.</p>
            </div>
            <div className="p-4 rounded-xl border border-border/70 bg-background/50">
              <h4 className="font-semibold text-foreground mb-1">Right to Erasure</h4>
              <p className="text-muted-foreground">Request complete account and personal profile deletion by emailing our privacy team.</p>
            </div>
            <div className="p-4 rounded-xl border border-border/70 bg-background/50">
              <h4 className="font-semibold text-foreground mb-1">Right to Opt-Out</h4>
              <p className="text-muted-foreground">Unsubscribe from promotional festival newsletters or recipe drops with 1 click.</p>
            </div>
          </div>
        </section>

        {/* ─── 7. Grievance Redressal Officer ─── */}
        <section className="bg-card rounded-2xl border border-amber-200/80 dark:border-amber-800/60 p-6 sm:p-8 shadow-sm bg-gradient-to-br from-amber-50/40 via-card to-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
              6
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Grievance Officer Statutory Disclosure
              </h2>
              <p className="text-xs text-muted-foreground">
                In compliance with the Information Technology Act 2000 and Rules thereunder.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm mt-4">
            <div className="space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">Designation:</strong> Grievance Redressal Officer</p>
              <p><strong className="text-foreground">Organization:</strong> Gujju Ni Dukan (GND E-Commerce)</p>
              <p className="flex items-center gap-2">
                <Mail size={15} className="text-primary" />
                <a href="mailto:grievance@gujjunidukan.com" className="text-primary hover:underline font-medium">
                  grievance@gujjunidukan.com
                </a>
              </p>
            </div>
            <div className="space-y-2 text-muted-foreground">
              <p className="flex items-start gap-2">
                <MapPin size={15} className="text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Official Headquarters:</strong><br />
                  Gujju Ni Dukan Support Hub, C.G. Road, Navrangpura, Ahmedabad, Gujarat 380009, India.
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* ─── 8. Privacy FAQ ─── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <HelpCircle size={18} />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Frequently Asked Privacy Questions
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Clear answers regarding your personal safety on our platform.
              </p>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="faq-priv-1">
              <AccordionTrigger className="text-sm sm:text-base font-semibold text-foreground text-left">
                Can individual Gujarati vendors see my payment details?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Never. Vendors only receive the order items to prepare, and the recipient delivery address required to affix the shipping label. They never see your bank details, credit card numbers, or payment tokens.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-priv-2">
              <AccordionTrigger className="text-sm sm:text-base font-semibold text-foreground text-left">
                How do I permanently delete my account and personal data?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                You can submit a request through your Account profile or send an email to <a href="mailto:privacy@gujjunidukan.com" className="text-primary hover:underline">privacy@gujjunidukan.com</a> from your registered email ID. We will permanently purge your data within 14 working days, preserving only transaction records required by statutory tax laws.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-priv-3">
              <AccordionTrigger className="text-sm sm:text-base font-semibold text-foreground text-left">
                Are cookies mandatory to browse products on Gujju Ni Dukan?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                You can browse all categories and explore vendor stores without cookies. However, essential cookies are required if you wish to add items to your shopping cart or remain logged in across visits.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </PolicyLayout>
  );
}
