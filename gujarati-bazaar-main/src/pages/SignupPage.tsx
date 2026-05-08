import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Mail, Lock, User, Store,
  Users, MapPin, Phone, Image as ImageIcon,
  Sparkles, ShoppingBag, Truck, Package, ArrowRight
} from "lucide-react";
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
    transition: { staggerChildren: 0.08, delayChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
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

const vendorVariants = {
  hidden: { opacity: 0, height: 0, y: -10 },
  visible: {
    opacity: 1,
    height: "auto",
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], staggerChildren: 0.06 },
  },
  exit: {
    opacity: 0,
    height: 0,
    y: -10,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "buyer" as "buyer" | "vendor",
    shop_name: "",
    address: "",
    phone: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { register } = useAuthWithNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Only image files are allowed for the shop logo.");
        return;
      }
      setLogoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.role === "vendor") {
      if (!formData.shop_name || !formData.phone || !formData.address) {
        toast.error("Please fill in all vendor details");
        return;
      }
      const phoneDigits = formData.phone.trim();
      if (!/^\d{10}$/.test(phoneDigits)) {
        toast.error("Phone number must be exactly 10 digits.");
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      setIsLoading(true);

      let submitData: any;

      if (formData.role === "vendor") {
        submitData = new FormData();
        submitData.append("name", formData.name);
        submitData.append("email", formData.email);
        submitData.append("password", formData.password);
        submitData.append("role", formData.role);
        submitData.append("shop_name", formData.shop_name);
        submitData.append("contact_details", formData.phone);
        submitData.append("phone", formData.phone);
        submitData.append("address", formData.address);
        if (logoFile) {
          submitData.append("logo", logoFile);
        }
      } else {
        submitData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        };
      }

      await register(submitData);
      toast.success("Account created successfully!");
    } catch (error: any) {
      toast.error(error.message || "Registration failed. Please try again.");
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
      {/* Left Panel — Branding (hidden on small screens) */}
      <motion.div
        variants={leftPanelVariants}
        initial="hidden"
        animate="visible"
        className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative bg-primary text-primary-foreground flex-col justify-between p-12 overflow-hidden shadow-2xl"
      >
        {/* Animated pattern overlay */}
        <motion.div
          animate={{ opacity: [0.04, 0.07, 0.04] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 pointer-events-none"
        >
          <svg width="100%" height="100%">
            <defs>
              <pattern id="signup-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#signup-dots)" />
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
        <motion.div variants={leftItemVariants} className="relative z-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-semibold mb-6 border border-accent/30 backdrop-blur-sm">
            Join the Community
          </span>
          <h2 className="font-display text-5xl xl:text-6xl font-bold leading-[1.1] mb-8">
            Experience the
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="text-accent italic block"
            >
              Pride of Gujarat
            </motion.span>
          </h2>
          <p className="text-primary-foreground/80 text-xl mb-12 leading-relaxed font-light max-w-md">
            The ultimate destination for authentic craftsmanship and traditional excellence.
          </p>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 gap-6">
            {decorativeItems.map(({ icon: Icon, label }) => (
              <motion.div
                key={label}
                variants={itemVariants}
                whileHover={{ x: 6, transition: { duration: 0.25 } }}
                className="flex items-center gap-5 cursor-default"
              >
                <motion.div
                  whileHover={{ scale: 1.12, rotate: 4 }}
                  className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center border border-accent/20 backdrop-blur-sm"
                >
                  <Icon size={24} className="text-accent" />
                </motion.div>
                <div>
                  <span className="font-semibold text-lg text-primary-foreground block">{label}</span>
                  <span className="text-sm text-primary-foreground/60">Curated for excellence</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Bottom: testimonial */}
        <motion.div variants={leftItemVariants} className="relative z-10 pt-8 border-t border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1, type: "spring", stiffness: 300 }}
                  className="w-10 h-10 rounded-full border-2 border-primary bg-accent/30 flex items-center justify-center text-xs font-bold text-primary-foreground backdrop-blur-md"
                >
                  {String.fromCharCode(64 + i)}
                </motion.div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <motion.div
                  animate={{ rotate: [0, 12, -12, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles size={14} className="text-accent" />
                </motion.div>
              </div>
              <p className="text-sm font-medium text-primary-foreground/90">
                Loved by 10k+ Gujjus
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-[55%] xl:w-[60%] flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-16 overflow-y-auto bg-gradient-warm">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="w-full max-w-2xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="bg-card rounded-2xl border border-border shadow-lift p-8 sm:p-10 overflow-hidden"
          >
            <div className="lg:hidden flex flex-col items-center mb-10">
              <Link to="/" className="group">
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.96 }}
                  className="relative p-1 bg-primary/5 rounded-[2rem] border border-primary/10 shadow-2xl"
                >
                  <img
                    src={logo}
                    alt="Gujju ni Dukan"
                    className="w-20 h-20 object-cover rounded-[1.75rem] shadow-inner"
                  />
                </motion.div>
              </Link>
              <div className="mt-8 text-center">
                <h1 className="text-2xl font-display font-black text-foreground tracking-tight uppercase tracking-[0.2em] opacity-80">
                  Welcome
                </h1>
                <div className="h-1 w-8 bg-accent mx-auto mt-2 rounded-full" />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden lg:block mb-10"
            >
              <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Create Account</h1>
              <p className="text-muted-foreground text-lg">Join our vibrant marketplace community</p>
            </motion.div>

            <motion.form
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Role Selection */}
              <motion.div variants={itemVariants} className="p-1.5 bg-muted/60 rounded-2xl border border-border flex gap-2 relative">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: "buyer" }))}
                  className={`relative z-10 flex-1 py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 ${formData.role === "buyer"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Users size={20} className={formData.role === "buyer" ? "text-accent" : ""} />
                  <span>Buyer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: "vendor" }))}
                  className={`relative z-10 flex-1 py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 ${formData.role === "vendor"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Store size={20} className={formData.role === "vendor" ? "text-accent" : ""} />
                  <span>Vendor</span>
                </button>
                <motion.div
                  layout
                  className="absolute top-1.5 bottom-1.5 bg-card rounded-xl shadow-md border border-border"
                  style={{ width: "calc(50% - 6px)" }}
                  animate={{
                    x: formData.role === "buyer" ? 0 : "calc(100% + 4px)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              </motion.div>

              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground ml-1">Full Name</label>
                  <motion.div
                    className="relative"
                    animate={{ scale: focusedField === "name" ? 1.01 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <motion.div
                      animate={{ color: focusedField === "name" ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))" }}
                      className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                    >
                      <User size={20} />
                    </motion.div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-2xl focus:ring-[3px] focus:ring-accent/20 focus:border-accent outline-none transition-all placeholder:text-muted-foreground font-medium"
                      placeholder="Enter your name"
                      required
                    />
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground ml-1">Email Address</label>
                  <motion.div
                    className="relative"
                    animate={{ scale: focusedField === "email" ? 1.01 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <motion.div
                      animate={{ color: focusedField === "email" ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))" }}
                      className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                    >
                      <Mail size={20} />
                    </motion.div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-2xl focus:ring-[3px] focus:ring-accent/20 focus:border-accent outline-none transition-all placeholder:text-muted-foreground font-medium"
                      placeholder="you@example.com"
                      required
                    />
                  </motion.div>
                </div>
              </motion.div>

              {/* Vendor Specific Fields with Animation */}
              <AnimatePresence mode="wait">
                {formData.role === "vendor" && (
                  <motion.div
                    key="vendor-fields"
                    variants={vendorVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6 pt-2 overflow-hidden"
                  >
                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground ml-1">Shop Name</label>
                        <motion.div
                          className="relative"
                          animate={{ scale: focusedField === "shop_name" ? 1.01 : 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <motion.div
                            animate={{ color: focusedField === "shop_name" ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))" }}
                            className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                          >
                            <Store size={20} />
                          </motion.div>
                          <input
                            type="text"
                            name="shop_name"
                            value={formData.shop_name}
                            onChange={handleChange}
                            onFocus={() => setFocusedField("shop_name")}
                            onBlur={() => setFocusedField(null)}
                            className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-2xl focus:ring-[3px] focus:ring-accent/20 focus:border-accent outline-none transition-all font-medium"
                            placeholder="Your business name"
                            required
                          />
                        </motion.div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground ml-1">Phone Number</label>
                        <motion.div
                          className="relative"
                          animate={{ scale: focusedField === "phone" ? 1.01 : 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <motion.div
                            animate={{ color: focusedField === "phone" ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))" }}
                            className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                          >
                            <Phone size={20} />
                          </motion.div>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            onFocus={() => setFocusedField("phone")}
                            onBlur={() => setFocusedField(null)}
                            className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-2xl focus:ring-[3px] focus:ring-accent/20 focus:border-accent outline-none transition-all font-medium"
                            placeholder="10-digit number"
                            required
                          />
                        </motion.div>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2">
                      <label className="text-sm font-bold text-foreground ml-1">Shop Address</label>
                      <motion.div
                        className="relative"
                        animate={{ scale: focusedField === "address" ? 1.01 : 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        <motion.div
                          animate={{ color: focusedField === "address" ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))" }}
                          className="absolute top-4 left-4 pointer-events-none"
                        >
                          <MapPin size={20} />
                        </motion.div>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          onFocus={() => setFocusedField("address")}
                          onBlur={() => setFocusedField(null)}
                          rows={2}
                          className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-2xl focus:ring-[3px] focus:ring-accent/20 focus:border-accent outline-none transition-all font-medium resize-none"
                          placeholder="Complete shop address"
                          required
                        />
                      </motion.div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2">
                      <label className="text-sm font-bold text-foreground ml-1">Shop Logo</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                          <ImageIcon size={20} />
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-2xl focus:ring-[3px] focus:ring-accent/20 focus:border-accent outline-none transition-all font-medium file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/5 file:text-primary hover:file:bg-primary/10"
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground ml-1">Password</label>
                  <motion.div
                    className="relative"
                    animate={{ scale: focusedField === "password" ? 1.01 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <motion.div
                      animate={{ color: focusedField === "password" ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))" }}
                      className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                    >
                      <Lock size={20} />
                    </motion.div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-12 pr-12 py-4 bg-background border border-border rounded-2xl focus:ring-[3px] focus:ring-accent/20 focus:border-accent outline-none transition-all font-medium"
                      placeholder="Create password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground ml-1">Confirm Password</label>
                  <motion.div
                    className="relative"
                    animate={{ scale: focusedField === "confirmPassword" ? 1.01 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <motion.div
                      animate={{ color: focusedField === "confirmPassword" ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))" }}
                      className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                    >
                      <Lock size={20} />
                    </motion.div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-12 pr-12 py-4 bg-background border border-border rounded-2xl focus:ring-[3px] focus:ring-accent/20 focus:border-accent outline-none transition-all font-medium"
                      placeholder="Repeat password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </motion.div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-5 h-5 rounded-lg border-border text-accent focus:ring-accent mt-0.5"
                  required
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                  I agree to the <Link to="/terms" className="text-primary font-bold hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-primary font-bold hover:underline">Privacy Policy</Link>
                </label>
              </motion.div>

              <motion.div variants={itemVariants}>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="w-full bg-primary text-primary-foreground py-5 rounded-[1.5rem] font-bold text-lg shadow-xl shadow-primary/20 hover:bg-primary/95 transition-colors duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-4 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    />
                  ) : (
                    <>
                      Create Account
                      <motion.div
                        initial={{ x: 0 }}
                        whileHover={{ x: 3 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <ArrowRight size={18} />
                      </motion.div>
                    </>
                  )}
                </motion.button>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="relative flex items-center justify-center py-2"
              >
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <span className="relative px-6 bg-card text-muted-foreground text-sm font-medium">Already have an account?</span>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center py-5 rounded-[1.5rem] border-2 border-border font-bold text-foreground hover:bg-muted hover:border-border/80 transition-all duration-300"
                >
                  Sign In to Your Account
                </Link>
              </motion.div>
            </motion.form>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-10 text-center text-sm text-muted-foreground"
            >
              © 2024 Gujju ni Dukan. All rights reserved.
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SignupPage;
