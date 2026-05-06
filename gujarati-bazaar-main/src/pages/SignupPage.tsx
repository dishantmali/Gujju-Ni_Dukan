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
    <div className="min-h-screen flex">
      {/* Left Panel — Branding (hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-primary text-primary-foreground flex-col justify-between p-12 overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="signup-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#signup-dots)" />
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
            Join the heart of
            <span className="text-accent block mt-1">Gujarat&apos;s marketplace</span>
          </h2>
          <p className="text-primary-foreground/70 text-lg mb-10 leading-relaxed">
            Connect with artisans, discover regional treasures, and grow your business with India&apos;s most vibrant Gujarati community.
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
      <div className="w-full lg:w-1/2 xl:w-[45%] h-screen bg-white flex items-center justify-center overflow-hidden p-6 sm:p-10 lg:p-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl h-full flex flex-col justify-center"
        >
          {/* Mobile-only brand header */}
          <div className="lg:hidden text-center mb-6">
            <img src={logo} alt="Gujju ni Dukan" className="w-14 h-14 rounded-2xl object-cover mx-auto mb-3 shadow-lift logo-transparent bg-background" />
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Gujju ni Dukan
            </h1>
            <p className="text-muted-foreground text-sm">
              Create your account and start exploring
            </p>
          </div>

          <div
            className="w-full overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 4rem)" }}
          >
            <div className="mb-8">
              <h2 className="font-display text-3xl font-bold text-foreground mb-2">
                Create Account
              </h2>
              <p className="text-muted-foreground">
                Join thousands of shoppers and sellers today
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  I want to join as
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: "buyer" }))}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                      formData.role === "buyer"
                        ? "border-accent bg-accent/10 text-accent font-semibold"
                        : "border-border bg-transparent hover:border-muted-foreground/50 text-muted-foreground"
                    }`}
                  >
                    <Users size={18} />
                    <span>Buyer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: "vendor" }))}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                      formData.role === "vendor"
                        ? "border-accent bg-accent/10 text-accent font-semibold"
                        : "border-border bg-transparent hover:border-muted-foreground/50 text-muted-foreground"
                    }`}
                  >
                    <Store size={18} />
                    <span>Vendor</span>
                  </button>
                </div>
              </div>

              {/* Name + Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User size={18} className="text-muted-foreground" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={18} className="text-muted-foreground" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Vendor Specific Fields */}
              {formData.role === "vendor" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Shop Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Store size={18} className="text-muted-foreground" />
                        </div>
                        <input
                          type="text"
                          name="shop_name"
                          value={formData.shop_name}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                          placeholder="Your store name"
                          required={formData.role === "vendor"}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Phone size={18} className="text-muted-foreground" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                          placeholder="10-digit number"
                          required={formData.role === "vendor"}
                          pattern="[0-9]{10}"
                          title="Please enter exactly 10 digits"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Shop Address
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-4 flex items-start pointer-events-none">
                        <MapPin size={18} className="text-muted-foreground" />
                      </div>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={1}
                        className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none"
                        placeholder="Full shop address"
                        required={formData.role === "vendor"}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Shop Logo (Optional)
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <ImageIcon size={18} className="text-muted-foreground" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-foreground hover:file:bg-muted"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Password + Confirm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={18} className="text-muted-foreground" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-11 pr-10 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                      placeholder="Create password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff size={18} className="text-muted-foreground hover:text-foreground" />
                      ) : (
                        <Eye size={18} className="text-muted-foreground hover:text-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={18} className="text-muted-foreground" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-11 pr-10 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                      placeholder="Confirm password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} className="text-muted-foreground hover:text-foreground" />
                      ) : (
                        <Eye size={18} className="text-muted-foreground hover:text-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-4 h-4 text-accent bg-background border-border rounded focus:ring-accent mt-1"
                  required
                />
                <label htmlFor="terms" className="ml-3 text-sm text-muted-foreground leading-relaxed">
                  I agree to the{" "}
                  <Link to="/terms" className="text-accent hover:text-accent/80 transition-colors font-medium">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-accent hover:text-accent/80 transition-colors font-medium">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-base"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>

              {/* Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-muted-foreground">Or continue with</span>
                </div>
              </div>

              {/* Social */}
              <div className="space-y-3">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-background border border-border rounded-xl hover:bg-muted transition-all duration-200"
                >
                  <div className="w-5 h-5 bg-red-500 rounded"></div>
                  <span className="font-medium">Continue with Google</span>
                </button>
              </div>

              {/* Sign In Link */}
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-accent hover:text-accent/80 transition-colors"
                >
                  Sign in
                </Link>
              </p>

              {/* Vendor Notice */}
              {formData.role === "vendor" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-3 bg-accent/10 border border-accent/20 rounded-xl"
                >
                  <p className="text-sm text-accent">
                    <strong>Vendor Notice:</strong> After registration, your account will require admin approval before you can start selling products.
                  </p>
                </motion.div>
              )}
            </form>

            {/* Footer */}
            <div className="text-center mt-6 text-xs text-muted-foreground">
              <p>
                By signing up, you agree to our{" "}
                <Link to="/terms" className="hover:text-foreground transition-colors">
                  Terms
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
