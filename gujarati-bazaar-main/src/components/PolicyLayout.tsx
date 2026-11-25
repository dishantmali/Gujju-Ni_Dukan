import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PageShell } from "@/components/PageShell";
import {
  RotateCcw,
  ShieldCheck,
  FileText,
  ChevronRight,
  Mail,
  HelpCircle,
  ExternalLink,
  Clock
} from "lucide-react";

interface PolicyLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  activePolicy: "returns" | "privacy" | "terms";
  icon: React.ReactNode;
  children: ReactNode;
}

const POLICY_TABS = [
  {
    id: "returns",
    label: "Return & Refund Policy",
    path: "/return-policy",
    icon: RotateCcw,
  },
  {
    id: "privacy",
    label: "Privacy Policy",
    path: "/privacy-policy",
    icon: ShieldCheck,
  },
  {
    id: "terms",
    label: "Terms & Conditions",
    path: "/terms-and-conditions",
    icon: FileText,
  },
];

export const PolicyLayout = ({
  title,
  subtitle,
  lastUpdated,
  activePolicy,
  icon,
  children,
}: PolicyLayoutProps) => {
  return (
    <PageShell>
      <div className="min-h-screen bg-background/50">
        {/* ─── Refined Header Banner ─── */}
        <section className="relative border-b border-border/60 bg-gradient-to-b from-amber-500/5 via-background to-background py-8 sm:py-12">
          <div className="container max-w-4xl">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-4">
              <Link to="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <ChevronRight size={12} className="text-border" />
              <span>Legal & Policies</span>
              <ChevronRight size={12} className="text-border" />
              <span className="text-foreground font-semibold">{title}</span>
            </nav>

            {/* Title & Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                    {icon}
                  </span>
                  {title}
                </h1>
                <p className="mt-2 text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl">
                  {subtitle}
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80 border border-border/60 text-xs text-muted-foreground self-start sm:self-center shrink-0">
                <Clock size={13} className="text-primary" />
                <span>Effective: <strong className="text-foreground">{lastUpdated}</strong></span>
              </div>
            </div>

            {/* ─── Sleek Segmented Policy Tab Navigation ─── */}
            <div className="pt-2">
              <div className="inline-flex flex-wrap p-1 rounded-xl bg-secondary/60 border border-border/60 gap-1 w-full sm:w-auto">
                {POLICY_TABS.map((tab) => {
                  const isActive = tab.id === activePolicy;
                  const TabIcon = tab.icon;
                  return (
                    <Link
                      key={tab.id}
                      to={tab.path}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                        isActive
                          ? "bg-card text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                      }`}
                    >
                      <TabIcon size={15} className={isActive ? "text-primary" : "text-muted-foreground"} />
                      <span>{tab.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Main Content Container ─── */}
        <main className="container max-w-4xl py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>

        {/* ─── Professional Assistance Banner ─── */}
        <section className="container max-w-4xl pb-16">
          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
                <HelpCircle size={15} />
                <span>Questions or Clarifications?</span>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
                Need assistance regarding our policy terms?
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Our customer grievance and support desk is available Monday to Saturday (9:00 AM – 7:00 PM IST).
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <a
                href="mailto:support@gujjunidukan.com"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-xs sm:text-sm hover:bg-primary/95 transition-colors shadow-xs"
              >
                <Mail size={15} /> Contact Support
              </a>
              <Link
                to="/account"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-medium text-xs sm:text-sm border border-border/60 transition-colors"
              >
                <span>Help Center</span>
                <ExternalLink size={13} className="text-muted-foreground" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
};
