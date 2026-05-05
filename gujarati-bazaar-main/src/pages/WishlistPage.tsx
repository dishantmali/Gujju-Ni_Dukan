import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { ProductCard } from '@/components/ProductCard';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useCart } from '@/store/cart';
import { Product } from '@/data/types';

const WishlistPage = () => {
  const [loading, setLoading] = useState(true);
  const wishlistIds = useCart((s) => s.wishlist);
  const wishlistItems = useCart((s) => s.wishlistItems);
  const syncWishlist = useCart((s) => s.syncWishlist);

  useEffect(() => {
    const fetch = async () => {
      await syncWishlist();
      setLoading(false);
    };
    fetch();
  }, [syncWishlist]);

  // Combined logic: show items from store that match the IDs
  const displayItems = useMemo(() => {
    return wishlistItems.filter(item => wishlistIds.includes(item.id.toString()));
  }, [wishlistItems, wishlistIds]);

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 font-sans">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="p-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">My Wishlist</h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-10 bg-muted rounded mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-secondary border border-dashed border-border rounded-3xl p-16 text-center max-w-2xl mx-auto"
          >
            <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Heart className="w-10 h-10 text-accent opacity-20" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-8">Items you save will appear here. Start exploring our collections!</p>
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-white rounded-full font-bold hover:bg-accent/90 transition-all active:scale-95 shadow-lg shadow-accent/20"
            >
              <ShoppingBag size={18} />
              Continue Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {displayItems.map((item, idx) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                >
                  <ProductCard 
                    product={item} 
                    index={idx} 
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default WishlistPage;
