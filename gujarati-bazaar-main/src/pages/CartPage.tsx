import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { CartItem } from "@/components/CartItem";
import { CartSummary } from "@/components/CartSummary";
import { EmptyState } from "@/components/EmptyState";
import { useCart } from "@/store/cart";

const CartPage = () => {
  const items = useCart((s) => s.items);

  return (
    <PageShell>
      <div className="container py-8">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-6">Your Cart</h1>
        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={32} />}
            title="Your cart is empty"
            description="Looks like you haven't added anything yet. Discover authentic Gujarati treasures."
            action={
              <Link to="/" className="inline-flex h-11 px-6 items-center rounded-full bg-primary text-primary-foreground font-semibold hover:bg-brown-mid transition-colors">
                Continue Shopping
              </Link>
            }
          />
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-3">
              <AnimatePresence>
                {items.map((line) => <CartItem key={line.product.id} line={line} />)}
              </AnimatePresence>
            </div>
            <CartSummary />
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default CartPage;
