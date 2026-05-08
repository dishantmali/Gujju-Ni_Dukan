import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import CategoryPage from "./pages/CategoryPage.tsx";
import ProductPage from "./pages/ProductPage.tsx";
import CartPage from "./pages/CartPage.tsx";
import CheckoutPage from "./pages/CheckoutPage.tsx";
import VendorPage from "./pages/VendorPage.tsx";
import SearchPage from "./pages/SearchPage.tsx";
import AccountPage from "./pages/AccountPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import SignupPage from "./pages/SignupPage.tsx";
import VendorDashboard from "./pages/VendorDashboard.tsx";
import AdminDashboardNew from "./pages/AdminDashboardNew.tsx";
import WishlistPage from "./pages/WishlistPage.tsx";

const queryClient = new QueryClient();

const RequireRole = ({ role, children }: { role: string; children: ReactNode }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== role)) {
      navigate("/login", { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate, role]);
  if (isLoading || !isAuthenticated || user?.role !== role) return null;
  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/vendor/:id" element={<VendorPage />} />
        <Route path="/vendor/dashboard" element={<RequireRole role="vendor"><VendorDashboard /></RequireRole>} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin" element={<RequireRole role="admin"><AdminDashboardNew /></RequireRole>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
