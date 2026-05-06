import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { CartLine, cartLineId, cartLineUnitPrice, useCart } from "@/store/cart";
import { QuantityStepper } from "./QuantityStepper";
import { vendors } from "@/data/vendors";

export const CartItem = ({ line }: { line: CartLine }) => {
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const lid = cartLineId(line);
  const unit = cartLineUnitPrice(line);
  const vendor = vendors.find((v) => v.id === line.product.vendorId);
  const variantLabel =
    line.variant && Object.keys(line.variant.option_values).length > 0
      ? Object.entries(line.variant.option_values)
          .map(([k, v]) => `${k}: ${v}`)
          .join(" · ")
      : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-2xl border border-border/60 shadow-sm"
    >
      <Link to={`/product/${line.product.id}`} className="shrink-0">
        <img src={line.product.image} alt={line.product.name} className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-cover" />
      </Link>
      <div className="flex-1 min-w-0 flex flex-col">
        <Link to={`/product/${line.product.id}`} className="text-sm sm:text-base font-semibold leading-snug line-clamp-2 hover:text-brown-mid">
          {line.product.name}
        </Link>
        <div className="text-xs text-muted-foreground mt-0.5">by {vendor?.name}</div>
        {variantLabel && <div className="text-[11px] text-brown-mid mt-1">{variantLabel}</div>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <QuantityStepper value={line.qty} onChange={(n) => setQty(lid, n)} />
          <div className="text-right">
            <div className="font-display font-bold text-base sm:text-lg">₹{(unit * line.qty).toLocaleString("en-IN")}</div>
            <button
              onClick={() => remove(lid)}
              className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1 mt-0.5"
            >
              <Trash2 size={12} /> Remove
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
