import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, ShoppingBag, Truck, Heart, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { PageShell } from "@/components/PageShell";
import { ImageGallery } from "@/components/ImageGallery";
import { StarRating } from "@/components/StarRating";
import { PriceTag } from "@/components/PriceTag";
import { QuantityStepper } from "@/components/QuantityStepper";
import { ProductCard } from "@/components/ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProduct, getRelatedProducts } from "@/data/products";
import { vendors } from "@/data/vendors";
import { useCart } from "@/store/cart";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

const ProductPage = () => {
  const { id = "" } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      // Try local first for backward compatibility
      const local = getProduct(id);
      if (local) {
        setProduct(local);
        setLoading(false);
        return;
      }

      const res: any = await api.get(`/products/${id}/`);
      // Map backend to frontend
      setProduct({
        ...res,
        id: res.id.toString(),
        rating: res.average_rating || 0,
        reviewCount: res.review_count || 0,
        vendorId: res.vendor?.toString() || "",
        originalPrice: res.price * 1.2,
        discount: 20,
        image: res.image,
        specs: {},
        reviews: []
      });
    } catch (err) {
      console.error("Failed to fetch product:", err);
      toast.error("Product not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const [qty, setQty] = useState(1);
  const [pin, setPin] = useState("");
  const [pinResult, setPinResult] = useState<string | null>(null);
  const add = useCart((s) => s.add);
  const wishlist = useCart((s) => s.wishlist);
  const toggleWish = useCart((s) => s.toggleWishlist);
  const { user, isAuthenticated } = useAuth();
  const isBuyerOnly = !user || user.role === 'buyer';

  if (loading) return <PageShell><div className="container py-20 text-center">Loading product...</div></PageShell>;
  if (!product) return <PageShell><div className="container py-20 text-center">Product not found.</div></PageShell>;
  const vendor = vendors.find((v) => v.id === product.vendorId);
  const isWish = wishlist.includes(product.id.toString());
  const related = getRelatedProducts(product, 8);

  const images = [
    product.image,
    `https://picsum.photos/seed/${product.id}-2/600/600`,
    `https://picsum.photos/seed/${product.id}-3/600/600`,
    `https://picsum.photos/seed/${product.id}-4/600/600`,
  ];

  const checkPin = () => {
    if (/^\d{6}$/.test(pin)) setPinResult(`Delivers to ${pin} in 3–5 days`);
    else setPinResult("Enter a valid 6-digit pincode");
  };

  return (
    <PageShell>
      <div className="container pt-6">
        <nav className="text-xs text-muted-foreground inline-flex items-center gap-1.5 mb-4">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight size={12} />
          <Link to={`/category/${product.category}`} className="hover:text-foreground capitalize">{product.category.replace("-", " ")}</Link>
          <ChevronRight size={12} />
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <ImageGallery images={images} alt={product.name} />

          <div>
            <Link to={`/vendor/${vendor?.id}`} className="text-sm text-brown-mid font-medium hover:text-primary">
              {vendor?.name}
            </Link>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-1 leading-tight">{product.name}</h1>
            <div className="mt-3 flex items-center gap-3">
              <StarRating value={product.rating} size={16} />
              <span className="text-sm text-muted-foreground">{product.rating} · {product.reviewCount} reviews</span>
            </div>

            <div className="mt-5">
              <PriceTag price={product.price} originalPrice={product.originalPrice} discount={product.discount} size="lg" />
              <p className="text-xs text-success mt-1">Inclusive of all taxes</p>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

            <div className="mt-6 flex items-center gap-3 flex-wrap">
              <QuantityStepper value={qty} onChange={setQty} />
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => { if (!isBuyerOnly) { toast.error('Vendors and Admins cannot add items to cart'); return; } add(product, qty); toast.success("Added to cart", { description: `${qty} × ${product.name}` }); }}
                className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-brown-mid transition-colors"
              >
                <ShoppingBag size={16} /> Add to Cart
              </motion.button>
              <button
                onClick={(e) => { 
                  e.stopPropagation();
                  if (!isBuyerOnly) { toast.error('Vendors and Admins cannot use wishlist'); return; } 
                  toggleWish(product, isAuthenticated); 
                }}
                aria-label="Wishlist"
                className="h-12 w-12 grid place-items-center rounded-full border border-border hover:border-brown-light transition-colors"
              >
                <Heart size={18} className={isWish ? "fill-destructive text-destructive" : "text-brown-mid"} />
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-secondary/30 p-4">
              <label className="text-sm font-medium text-foreground inline-flex items-center gap-2">
                <Truck size={14} className="text-brown-mid" /> Check delivery to your pincode
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="380015"
                  className="flex-1 h-10 px-3 rounded-full bg-card border border-border text-sm outline-none focus:border-brown-light"
                />
                <button onClick={checkPin} className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-brown-mid">Check</button>
              </div>
              {pinResult && <p className="text-xs text-muted-foreground mt-2">{pinResult}</p>}
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Shield size={13} className="text-success" /> 100% Authentic</span>
              <span className="inline-flex items-center gap-1.5"><Truck size={13} className="text-success" /> Free over ₹999</span>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList className="bg-secondary">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specs">Specifications</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({product.reviews.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-5">
              <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">{product.description}</p>
            </TabsContent>
            <TabsContent value="specs" className="mt-5">
              <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 max-w-2xl">
                {Object.entries(product.specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-border py-2">
                    <dt className="text-sm text-muted-foreground">{k}</dt>
                    <dd className="text-sm font-medium">{v as string}</dd>
                  </div>
                ))}
              </dl>
            </TabsContent>
            <TabsContent value="reviews" className="mt-5">
              <div className="space-y-4 max-w-2xl">
                {product.reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm">{r.user}</div>
                      <span className="text-xs text-muted-foreground">{r.date}</span>
                    </div>
                    <StarRating value={r.rating} size={12} className="mt-1" />
                    <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-14">
          <h2 className="font-display text-2xl font-semibold mb-5">You may also like</h2>
          <div className="pill-scroll overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-4 sm:gap-5 min-w-max pb-2">
              {related.map((p, i) => (
                <div key={p.id} className="w-[200px] sm:w-[220px] shrink-0">
                  <ProductCard product={p} index={i} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile bar */}
      <div className="lg:hidden sticky bottom-0 z-30 bg-card/95 backdrop-blur-md border-t border-border p-3 flex items-center gap-3">
        <div>
          <div className="font-display font-bold text-lg">₹{product.price.toLocaleString("en-IN")}</div>
          {product.originalPrice > product.price && <div className="text-xs text-muted-foreground line-through">₹{product.originalPrice}</div>}
        </div>
        <button
          onClick={() => { if (!isBuyerOnly) { toast.error('Vendors and Admins cannot add items to cart'); return; } add(product, qty); toast.success("Added to cart"); }}
          className="ml-auto inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary text-primary-foreground font-semibold"
        >
          <ShoppingBag size={16} /> Add to Cart
        </button>
      </div>
    </PageShell>
  );
};

export default ProductPage;
