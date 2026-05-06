import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ShoppingBag, Truck, Package, Sparkles } from "lucide-react";
import { useAuthWithNavigate } from "@/hooks/useAuthWithNavigate";
import { toast } from "sonner";
import logo from "@/assets/logo.jpeg";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthWithNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      toast.success("Login successful!");
    } catch (error: any) {
      toast.error(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const decorativeItems = [
    { icon: ShoppingBag, label: "Authentic Products", delay: 0 },
    { icon: Truck, label: "Fast Delivery", delay: 0.1 },
    { icon: Package, label: "Trusted Vendors", delay: 0.2 },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding (hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-primary text-primary-foreground flex-col justify-between p-12 overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="login-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#login-dots)" />
          </svg>
        </div>

        {/* Decorative floating shapes */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-brown-mid/20 rounded-full blur-3xl" />

        {/* Top: Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex items-center gap-3"
        >
          <img src={logo} alt="Gujju ni Dukan" className="w-30 h-16 rounded-xl object-cover shadow-lg logo-transparent bg-primary" />
          
        </motion.div>

        {/* Center: Headline + decorative features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative z-10 max-w-md"
        >
          <h2 className="font-display text-4xl xl:text-5xl font-bold leading-tight mb-6">
            Welcome back to
            <span className="text-accent block mt-1">your marketplace</span>
          </h2>
          <p className="text-primary-foreground/70 text-lg mb-10 leading-relaxed">
            Discover authentic Gujarati crafts, spices, snacks, and traditions — delivered to your doorstep.
          </p>

          <div className="space-y-4">
            {decorativeItems.map(({ icon: Icon, label, delay }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + delay, duration: 0.5 }}
                className="flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center border border-accent/20">
                  <Icon size={20} className="text-accent" />
                </div>
                <span className="font-medium text-primary-foreground/90">{label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom: testimonial */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-primary bg-accent/30 flex items-center justify-center text-xs font-bold text-primary-foreground"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <Sparkles size={16} className="text-accent" />
          </div>
          <p className="text-sm text-primary-foreground/60 max-w-xs">
            Join 10,000+ happy customers and 500+ trusted vendors across Gujarat.
          </p>
        </motion.div>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] min-h-screen bg-gradient-warm flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md xl:max-w-lg"
        >
          {/* Mobile-only brand header */}
          <div className="lg:hidden text-center mb-6">
            <img src={logo} alt="Gujju ni Dukan" className="w-14 h-14 rounded-2xl object-cover mx-auto mb-3 shadow-lift logo-transparent bg-background" />
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Gujju ni Dukan
            </h1>
            <p className="text-muted-foreground text-sm">
              Welcome back to your Gujarati marketplace
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border shadow-lift p-8 sm:p-10"
          >
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                Sign In
              </h2>
              <p className="text-muted-foreground text-sm">
                Enter your credentials to access your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-muted-foreground" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-muted-foreground" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff size={18} className="text-muted-foreground hover:text-foreground" />
                    ) : (
                      <Eye size={18} className="text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Social Login Options */}
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200">
                <div className="w-5 h-5 bg-red-500 rounded"></div>
                <span className="font-medium">Continue with Google</span>
              </button>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-accent hover:text-accent/80 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </motion.div>

          {/* Footer Links */}
          <div className="text-center mt-6 text-xs text-muted-foreground">
            <p>
              By signing in, you agree to our{" "}
              <Link to="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
