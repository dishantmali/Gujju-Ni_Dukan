import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ShoppingBag, Truck, Package, Sparkles, ArrowRight } from "lucide-react";
import { useAuthWithNavigate } from "@/hooks/useAuthWithNavigate";
import { toast } from "sonner";
import logo from "@/assets/logo.jpeg";

const floatVariants = {
  animate: (custom: number) => ({
    y: [0, -18, 0],
    x: [0, 10, 0],
    transition: {
      duration: 5 + custom,
      repeat: Infinity,
      ease: "easeInOut" as const,
      delay: custom * 0.4,
    },
  }),
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const leftPanelVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const leftItemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    { icon: ShoppingBag, label: "Authentic Products" },
    { icon: Truck, label: "Fast Delivery" },
    { icon: Package, label: "Trusted Vendors" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen flex"
    >
      {/* Left Panel — Branding */}
      <motion.div
        variants={leftPanelVariants}
        initial="hidden"
        animate="visible"
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-primary text-primary-foreground flex-col justify-between p-12 overflow-hidden"
      >
        {/* Animated pattern overlay */}
        <motion.div
          animate={{ opacity: [0.04, 0.07, 0.04] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 pointer-events-none"
        >
          <svg width="100%" height="100%">
            <defs>
              <pattern id="login-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#login-dots)" />
          </svg>
        </motion.div>

        {/* Floating orbs */}
        <motion.div
          custom={0}
          variants={floatVariants}
          animate="animate"
          className="absolute -top-20 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
        />
        <motion.div
          custom={1.2}
          variants={floatVariants}
          animate="animate"
          className="absolute top-1/3 -left-20 w-80 h-80 bg-brown-mid/15 rounded-full blur-3xl"
        />
        <motion.div
          custom={2.5}
          variants={floatVariants}
          animate="animate"
          className="absolute -bottom-20 right-1/4 w-[28rem] h-[28rem] bg-accent/5 rounded-full blur-3xl"
        />

        {/* Top: Logo */}
        <motion.div variants={leftItemVariants} className="relative z-10">
          <Link to="/" className="inline-block group">
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative p-1.5 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-2xl"
            >
              <img
                src={logo}
                alt="Gujju ni Dukan"
                className="h-20 w-30 object-cover rounded-[1.75rem] shadow-inner brightness-110"
              />
            </motion.div>
          </Link>
        </motion.div>

        {/* Center: Headline + decorative features */}
        <motion.div variants={leftItemVariants} className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl xl:text-5xl font-bold leading-tight mb-6">
            Welcome back to
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="text-accent block mt-1"
            >
              your marketplace
            </motion.span>
          </h2>
          <p className="text-primary-foreground/70 text-lg mb-10 leading-relaxed">
            Discover authentic Gujarati crafts, spices, snacks, and traditions — delivered to your doorstep.
          </p>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
            {decorativeItems.map(({ icon: Icon, label }) => (
              <motion.div
                key={label}
                variants={itemVariants}
                whileHover={{ x: 6, transition: { duration: 0.25 } }}
                className="flex items-center gap-4 cursor-default"
              >
                <motion.div
                  whileHover={{ scale: 1.12, rotate: 4 }}
                  className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center border border-accent/20"
                >
                  <Icon size={20} className="text-accent" />
                </motion.div>
                <span className="font-medium text-primary-foreground/90">{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Bottom: testimonial */}
        <motion.div variants={leftItemVariants} className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1, type: "spring", stiffness: 300 }}
                  className="w-8 h-8 rounded-full border-2 border-primary bg-accent/30 flex items-center justify-center text-xs font-bold text-primary-foreground"
                >
                  {String.fromCharCode(64 + i)}
                </motion.div>
              ))}
            </div>
            <motion.div
              animate={{ rotate: [0, 12, -12, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={16} className="text-accent" />
            </motion.div>
          </div>
          <p className="text-sm text-primary-foreground/60 max-w-xs">
            Join 10,000+ happy customers and 500+ trusted vendors across Gujarat.
          </p>
        </motion.div>
      </motion.div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] min-h-screen bg-gradient-warm flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md xl:max-w-lg"
        >
          {/* Mobile-only brand header */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <Link to="/" className="group">
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
                className="relative p-2 bg-white rounded-[2rem] border border-primary/15 shadow-2xl"
              >
                <img
                  src={logo}
                  alt="Gujju ni Dukan"
                  className="w-32 h-16 object-contain rounded-[1.75rem]"
                />
              </motion.div>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-card rounded-2xl border border-border shadow-lift p-8 sm:p-10 overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 hidden lg:block"
            >
              <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                Sign In
              </h2>
              <p className="text-muted-foreground text-sm">
                Enter your credentials to access your account
              </p>
            </motion.div>

            <motion.form
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Email Field */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <motion.div
                  className="relative"
                  animate={{
                    scale: focusedField === "email" ? 1.01 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <motion.div
                    animate={{
                      color: focusedField === "email" ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))",
                    }}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                  >
                    <Mail size={18} />
                  </motion.div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-3 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-[3px] focus:ring-accent/30 focus:border-accent transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </motion.div>
              </motion.div>

              {/* Password Field */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <motion.div
                  className="relative"
                  animate={{
                    scale: focusedField === "password" ? 1.01 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <motion.div
                    animate={{
                      color: focusedField === "password" ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))",
                    }}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                  >
                    <Lock size={18} />
                  </motion.div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-10 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-[3px] focus:ring-accent/30 focus:border-accent transition-all"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </motion.div>
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={itemVariants}>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    />
                  ) : (
                    <>
                      Sign In
                      <motion.div
                        initial={{ x: 0 }}
                        whileHover={{ x: 3 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <ArrowRight size={16} />
                      </motion.div>
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.form>

            {/* Sign Up Link */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-sm text-muted-foreground mt-6"
            >
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-accent hover:text-accent/80 transition-colors underline-grow"
              >
                Sign up
              </Link>
            </motion.p>
          </motion.div>

          {/* Footer Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center mt-6 text-xs text-muted-foreground"
          >
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
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoginPage;