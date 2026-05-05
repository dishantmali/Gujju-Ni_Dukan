import { Check } from "lucide-react";
import { motion } from "framer-motion";

export const CheckoutStepper = ({ step, steps }: { step: number; steps: string[] }) => (
  <div className="flex items-center justify-between gap-2 sm:gap-4">
    {steps.map((label, i) => {
      const idx = i + 1;
      const done = idx < step;
      const active = idx === step;
      return (
        <div key={label} className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative">
            <motion.div
              animate={{ scale: active ? 1.05 : 1 }}
              className={`h-9 w-9 grid place-items-center rounded-full font-semibold text-sm transition-colors ${
                done ? "bg-success text-success-foreground" : active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {done ? <Check size={16} /> : idx}
            </motion.div>
          </div>
          <div className={`text-sm font-medium truncate ${active || done ? "text-foreground" : "text-muted-foreground"}`}>{label}</div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-px bg-border ml-1" />
          )}
        </div>
      );
    })}
  </div>
);
