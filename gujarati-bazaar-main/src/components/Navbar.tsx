import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, User, Menu, X, Heart, ChevronDown, LogIn, UserPlus, LayoutGrid, ArrowRight } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/store/cart";
import { useAuth } from "@/context/AuthContext";
import { SearchBar } from "./SearchBar";
import api from '@/lib/api';
import { CategoryIcon } from "./CategoryIcon";
import logo from '@/assets/logo.jpeg';

export const Navbar = () => {
  const count = useCart((s) => s.count());
  const wishlist = useCart((s) => s.wishlist);
  const [bumped, setBumped] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    api.get('/categories/')
      .then((res: any) => setCategories(res || []))
      .catch(err => console.error("Failed to fetch nav categories:", err));
  }, []);


  useEffect(() => {
    if (count === 0) return;
    setBumped(true);
    const t = setTimeout(() => setBumped(false), 400);
    return () => clearTimeout(t);
  }, [count]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close category dropdown on outside click and Escape
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCatOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const isIndexPage = location.pathname === "/";

  return (
    <header
      className={`${isIndexPage ? "relative" : "sticky top-0"} z-40 bg-background/85 backdrop-blur-lg border-b border-border/60`}
    >
      {/* Main navbar row */}
      <div className="container flex items-center gap-3 sm:gap-5 h-16 sm:h-[72px]">
        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0">
          <img src={logo} alt="Gujju ni Dukan" className="h-14 sm:h-16 w-auto object-contain logo-transparent bg-background" />
        </Link>

        {/* Search Bar - desktop */}
        <div className="hidden md:block flex-1 max-w-xl">
          <SearchBar />
        </div>

        {/* Category Dropdown - desktop */}
        <div ref={catRef} className="hidden lg:block relative">
          <button
            onClick={() => setCatOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-secondary/60 border border-transparent hover:border-brown-light/40 text-sm font-medium transition-all"
          >
            Categories
            <ChevronDown size={14} className={`transition-transform duration-200 ${catOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {catOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-full mt-2 right-0 w-72 sm:w-80 rounded-2xl bg-card border border-border shadow-lift overflow-hidden z-50"
              >
                {/* Header */}
                <div className="px-4 pt-4 pb-2 border-b border-border/50">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                    <LayoutGrid size={12} /> Browse Categories
                  </p>
                </div>

                <div className="p-2 grid grid-cols-1 gap-0.5">
                  {categories.map((c) => (
                    <Link
                      key={c.id || c.slug}
                      to={`/category/${c.slug || c.id}`}
                      onClick={() => setCatOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60 text-sm transition-colors group"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform duration-200 text-brown-mid">
                        <CategoryIcon name={c.icon} size={20} />
                      </span>
                      <span className="font-medium">{c.name}</span>
                      <ArrowRight size={14} className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                    </Link>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-2 pb-2 pt-1 border-t border-border/50">
                  <Link
                    to="/search"
                    onClick={() => setCatOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-brown-mid hover:bg-secondary/60 transition-colors"
                  >
                    View all categories <ArrowRight size={12} />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right side icons - desktop */}
        <nav className="hidden md:flex items-center gap-1 ml-auto">
          {/* Cart & Wishlist (Only for buyers or unauthenticated users) */}
          {(!isAuthenticated || user?.role === 'buyer') && (
            <>
              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="relative h-10 w-10 grid place-items-center rounded-full hover:bg-secondary text-brown-mid transition-colors"
                aria-label="Wishlist"
              >
                <Heart size={18} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link to="/cart" className="relative h-10 w-10 grid place-items-center rounded-full hover:bg-secondary text-brown-mid transition-colors" aria-label="Cart">
                <ShoppingBag size={18} className={bumped ? "animate-bounce-soft" : ""} />
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold"
                  >
                    {count}
                  </motion.span>
                )}
              </Link>
            </>
          )}

          {/* Auth: Login/Signup or Profile */}
          {isAuthenticated ? (
            <NavLink
              to={user?.role === 'admin' ? '/admin' : user?.role === 'vendor' ? '/vendor/dashboard' : '/account'}
              className="h-10 w-10 grid place-items-center rounded-full bg-gradient-vendor text-primary-foreground hover:opacity-90 transition-opacity"
              aria-label="My Account"
              title={user?.name || "Account"}
            >
              <span className="text-xs font-bold">{user?.name?.charAt(0).toUpperCase() || "U"}</span>
            </NavLink>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full border border-primary text-primary text-sm font-medium hover:bg-secondary transition-colors"
                aria-label="Login"
              >
                <LogIn size={14} />
                <span>Login</span>
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-brown-mid transition-colors"
                aria-label="Sign Up"
              >
                <UserPlus size={14} />
                <span>Sign Up</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile: Cart + Menu */}
        <div className="md:hidden flex items-center gap-1 ml-auto">
          {(!isAuthenticated || user?.role === 'buyer') && (
            <Link to="/cart" className="relative h-10 w-10 grid place-items-center rounded-full hover:bg-secondary text-brown-mid" aria-label="Cart">
              <ShoppingBag size={18} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold">{count}</span>
              )}
            </Link>
          )}
          <button
            className="h-10 w-10 grid place-items-center rounded-full hover:bg-secondary text-brown-mid"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile search row */}
      <div className="md:hidden container pb-3">
        <SearchBar compact />
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border bg-card overflow-hidden"
          >
            <div className="container py-3 space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-2">Categories</p>
              <div className="grid grid-cols-2 gap-1.5">
                {categories.slice(0, 8).map((c) => (
                  <Link
                    key={c.id || c.slug}
                    to={`/category/${c.slug || c.id}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-secondary text-sm"
                  >
                    <span className="text-brown-mid"><CategoryIcon name={c.icon} size={18} /></span>
                    <span>{c.name}</span>
                  </Link>
                ))}

              </div>
              <div className="border-t border-border mt-2 pt-2 space-y-1">
                {(!isAuthenticated || user?.role === 'buyer') && (
                  <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-secondary text-sm">
                    <Heart size={16} /> Wishlist {wishlist.length > 0 && <span className="text-xs text-muted-foreground">({wishlist.length})</span>}
                  </Link>
                )}
                {isAuthenticated ? (
                  <Link to={user?.role === 'admin' ? '/admin' : user?.role === 'vendor' ? '/vendor/dashboard' : '/account'} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-secondary text-sm">
                    <User size={16} /> {user?.role === 'admin' ? 'Admin Dashboard' : user?.role === 'vendor' ? 'Vendor Dashboard' : 'My Account'}
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-secondary text-sm">
                      <LogIn size={16} /> Login
                    </Link>
                    <Link to="/signup" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                      <UserPlus size={16} /> Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
