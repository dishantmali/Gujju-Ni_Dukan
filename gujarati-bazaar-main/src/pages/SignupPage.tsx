import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Eye, EyeOff, Mail, Lock, User, Store,
  Users, MapPin, Phone, Image as ImageIcon,
  Sparkles, ShoppingBag, Truck, Package
} from "lucide-react";
import { useAuthWithNavigate } from "@/hooks/useAuthWithNavigate";
import { toast } from "sonner";
import logo from "@/assets/logo.jpeg";

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

  const { register } = useAuthWithNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
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
    { icon: ShoppingBag, label: "Authentic Products", delay: 0 },
    { icon: Truck, label: "Fast Delivery", delay: 0.1 },
    { icon: Package, label: "Trusted Vendors", delay: 0.2 },
  ];

  return (
    <div className="min-h-screen flex bg-[#fdfcfb]">
      {/* Left Panel — Branding (hidden on small screens) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative bg-primary text-primary-foreground flex-col justify-between p-12 overflow-hidden shadow-2xl">
        {/* Animated Background Elements */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 50, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -left-20 w-[500px] h-[500px] bg-brown-mid/30 rounded-full blur-[100px]"
        />

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="signup-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#signup-dots)" />
          </svg>
        </div>

        {/* Top: Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10"
        >
          <Link to="/" className="inline-block group">
            <div className="relative p-1 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:bg-white/20">
              <img 
                src={logo} 
                alt="Gujju ni Dukan" 
                className="h-20 w-30 object-cover rounded-[1.75rem] shadow-inner brightness-110" 
              />
            </div>
          </Link>
        </motion.div>

        {/* Center: Headline + decorative features */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-semibold mb-6 border border-accent/30 backdrop-blur-sm">
              Join the Community
            </span>
            <h2 className="font-display text-5xl xl:text-6xl font-bold leading-[1.1] mb-8">
              Experience the
              <span className="text-accent italic block">Pride of Gujarat</span>
            </h2>
            <p className="text-primary-foreground/80 text-xl mb-12 leading-relaxed font-light max-w-md">
              The ultimate destination for authentic craftsmanship and traditional excellence.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6">
            {decorativeItems.map(({ icon: Icon, label, delay }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + delay, duration: 0.6 }}
                className="flex items-center gap-5 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-md group-hover:bg-accent/20 group-hover:border-accent/40 transition-all duration-300">
                  <Icon size={24} className="text-accent" />
                </div>
                <div>
                  <span className="font-semibold text-lg text-white block">{label}</span>
                  <span className="text-sm text-white/60">Curated for excellence</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom: testimonial */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="relative z-10 pt-8 border-t border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-primary bg-accent/40 flex items-center justify-center backdrop-blur-md shadow-lg"
                >
                  <User size={16} className="text-white" />
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Sparkles key={i} size={12} className="text-accent" />
                ))}
              </div>
              <p className="text-sm font-medium text-white/90">
                Loved by 10k+ Gujjus
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-[55%] xl:w-[60%] flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-16 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden"
        >
          <div className="p-8 sm:p-12">
            <div className="lg:hidden flex flex-col items-center mb-10">
              <Link to="/" className="group">
                <div className="relative p-1 bg-primary/5 rounded-[2rem] border border-primary/10 shadow-2xl transition-all duration-500 group-hover:scale-110">
                  <img 
                    src={logo} 
                    alt="Gujju ni Dukan" 
                    className="w-20 h-20 object-cover rounded-[1.75rem] shadow-inner" 
                  />
                </div>
              </Link>
              <div className="mt-8 text-center">
                <h1 className="text-2xl font-display font-black text-gray-900 tracking-tight uppercase tracking-[0.2em] opacity-80">
                  Welcome
                </h1>
                <div className="h-1 w-8 bg-accent mx-auto mt-2 rounded-full" />
              </div>
            </div>

            <div className="hidden lg:block mb-10">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">Create Account</h1>
              <p className="text-gray-500 text-lg">Join our vibrant marketplace community</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Role Selection */}
              <div className="p-1.5 bg-gray-50 rounded-2xl border border-gray-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: "buyer" }))}
                  className={`flex-1 py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 ${formData.role === "buyer"
                      ? "bg-white text-primary shadow-lg border border-gray-100 scale-[1.02]"
                      : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  <Users size={20} className={formData.role === "buyer" ? "text-accent" : ""} />
                  <span>Buyer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: "vendor" }))}
                  className={`flex-1 py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 ${formData.role === "vendor"
                      ? "bg-white text-primary shadow-lg border border-gray-100 scale-[1.02]"
                      : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  <Store size={20} className={formData.role === "vendor" ? "text-accent" : ""} />
                  <span>Vendor</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-accent transition-colors">
                      <User size={20} />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-accent/10 focus:border-accent focus:bg-white outline-none transition-all placeholder:text-gray-400 font-medium"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-accent transition-colors">
                      <Mail size={20} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-accent/10 focus:border-accent focus:bg-white outline-none transition-all placeholder:text-gray-400 font-medium"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Vendor Specific Fields with Animation */}
              {formData.role === "vendor" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pt-2"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Shop Name</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-accent transition-colors">
                          <Store size={20} />
                        </div>
                        <input
                          type="text"
                          name="shop_name"
                          value={formData.shop_name}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-accent/10 focus:border-accent focus:bg-white outline-none transition-all font-medium"
                          placeholder="Your business name"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-accent transition-colors">
                          <Phone size={20} />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-accent/10 focus:border-accent focus:bg-white outline-none transition-all font-medium"
                          placeholder="10-digit number"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Shop Address</label>
                    <div className="relative group">
                      <div className="absolute top-4 left-4 pointer-events-none group-focus-within:text-accent transition-colors">
                        <MapPin size={20} />
                      </div>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={2}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-accent/10 focus:border-accent focus:bg-white outline-none transition-all font-medium resize-none"
                        placeholder="Complete shop address"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Shop Logo</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-accent transition-colors">
                        <ImageIcon size={20} />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-accent/10 focus:border-accent focus:bg-white outline-none transition-all font-medium file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/5 file:text-primary hover:file:bg-primary/10"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-accent transition-colors">
                      <Lock size={20} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-accent/10 focus:border-accent focus:bg-white outline-none transition-all font-medium"
                      placeholder="Create password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Confirm Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-accent transition-colors">
                      <Lock size={20} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-accent/10 focus:border-accent focus:bg-white outline-none transition-all font-medium"
                      placeholder="Repeat password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-5 h-5 rounded-lg border-gray-300 text-accent focus:ring-accent mt-0.5"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-500 leading-relaxed">
                  I agree to the <Link to="/terms" className="text-primary font-bold hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-primary font-bold hover:underline">Privacy Policy</Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-bold text-lg shadow-xl shadow-primary/20 hover:bg-primary/95 hover:scale-[1.01] active:scale-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Create Account"
                )}
              </button>

              <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <span className="relative px-6 bg-white text-gray-400 text-sm font-medium">Already have an account?</span>
              </div>

              <Link
                to="/login"
                className="w-full flex items-center justify-center py-5 rounded-[1.5rem] border-2 border-gray-100 font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition-all duration-300"
              >
                Sign In to Your Account
              </Link>
            </form>

            <p className="mt-10 text-center text-sm text-gray-400">
              © 2024 Gujju ni Dukan. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
