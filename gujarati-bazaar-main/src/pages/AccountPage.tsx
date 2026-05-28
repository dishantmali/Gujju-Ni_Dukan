import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  Heart, 
  User, 
  MapPin, 
  Plus,
  Settings,
  ShoppingBag,
  LogOut,
  Star,
  Edit,
  Trash2,
  X,
  Check,
  Grid3X3
} from 'lucide-react';
import { useAuthWithNavigate } from '@/hooks/useAuthWithNavigate';
import { PageShell } from '@/components/PageShell';
import { toast } from 'sonner';

import api from '@/lib/api';
import { State, City } from 'country-state-city';
type Tab = "overview" | "orders" | "settings";

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Dashboard Overview", icon: Grid3X3 },
  { id: "orders", label: "My Orders", icon: ShoppingBag },
  { id: "settings", label: "Account Settings", icon: Settings },
];

const SkeletonOrderCard = () => (
  <div className="border border-border rounded-xl p-6 bg-card">
    <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
      <div className="space-y-2">
        <div className="h-3 w-24 bg-muted rounded-full animate-pulse" />
        <div className="h-4 w-32 bg-muted rounded-full animate-pulse" />
      </div>
      <div className="text-right space-y-2">
        <div className="h-3 w-12 bg-muted rounded-full ml-auto animate-pulse" />
        <div className="h-6 w-20 bg-muted rounded-full ml-auto animate-pulse" />
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 bg-muted rounded-md shrink-0 animate-pulse" />
      <div className="space-y-2 flex-1">
        <div className="h-4 w-3/4 bg-muted rounded-full animate-pulse" />
        <div className="h-3 w-1/2 bg-muted rounded-full animate-pulse" />
      </div>
    </div>
  </div>
);

// Helper component for interactive 5-star rating
const StarRatingInput = ({ rating, setRating }) => {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          onClick={() => setRating(star)}
          className={`transition-colors duration-200 focus:outline-none ${star <= rating ? 'text-accent' : 'text-gray-200 hover:text-accent/60'}`}
        >
          <svg className="w-10 h-10 fill-current drop-shadow-sm" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

const AccountPage = () => {
  const { logout } = useAuthWithNavigate();

  // --- Layout State ---
  const [tab, setTab] = useState<Tab>("overview");

  // --- Orders State ---
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Profile & Address State ---
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '' });
  const [addresses, setAddresses] = useState([]);
  
  // Password State
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // OTP Modal State
  const [otpModal, setOtpModal] = useState({ isOpen: false, type: '', step: 1, newValue: '', otp: '', loading: false });

  // Address Modal State
  const [addressModal, setAddressModal] = useState({ isOpen: false, isEditing: false, id: null, street: '', city: '', state: '', pincode: '', is_default: false });
  const [availableCities, setAvailableCities] = useState<any[]>([]);

  // Update cities when state changes
  useEffect(() => {
    if (addressModal.state) {
      const selectedStateObj = State.getStatesOfCountry('IN').find(s => s.name === addressModal.state);
      if (selectedStateObj) {
        setAvailableCities(City.getCitiesOfState('IN', selectedStateObj.isoCode));
      } else {
        setAvailableCities([]);
      }
    } else {
      setAvailableCities([]);
    }
  }, [addressModal.state]);

  // Review States
  const [reviewedItemIds, setReviewedItemIds] = useState(new Set());
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedItemToReview, setSelectedItemToReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [platformReviewModalOpen, setPlatformReviewModalOpen] = useState(false);
  const [platformRating, setPlatformRating] = useState(5);
  const [platformFeedback, setPlatformFeedback] = useState('');
  const [submittingPlatform, setSubmittingPlatform] = useState(false);

  useEffect(() => {
    // Fetch Orders
    api.get('/orders/')
      .then((res: any) => setOrders(res))
      .catch(err => console.error("Failed to fetch orders:", err))
      .finally(() => setLoading(false));
      
    // Fetch Profile & Addresses
    fetchProfileData();
  }, []);

  const fetchProfileData = () => {
    api.get('/profile/').then((res: any) => {
      setProfileData({ name: res.name, email: res.email, phone: res.profile?.phone || '' });
      setAddresses(res.addresses || []);
    }).catch(err => console.error("Failed to fetch profile:", err));
  };

  // --- OTP Handlers for Email/Phone ---
  const requestOtp = async (e) => {
    e.preventDefault();
    if (otpModal.type === 'phone') {
      const digits = otpModal.newValue.trim().replace(/^\+91/, '');
      if (!/^[6-9]\d{9}$/.test(digits)) {
        toast.error("Phone number must be exactly 10 digits and start with 6, 7, 8, or 9.");
        return;
      }
    }
    if (otpModal.type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpModal.newValue)) {
        toast.error("Please enter a valid email address.");
        return;
      }
    }
    setOtpModal(prev => ({ ...prev, loading: true }));
    try {
      await api.post('/request-contact-otp/', { type: otpModal.type, new_value: otpModal.newValue });
      setOtpModal(prev => ({ ...prev, step: 2, loading: false }));
      toast.success(`OTP sent to your new ${otpModal.type}`);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to send OTP");
      setOtpModal(prev => ({ ...prev, loading: false }));
    }
  };

  const verifyOtpAndUpdate = async (e) => {
    e.preventDefault();
    setOtpModal(prev => ({ ...prev, loading: true }));
    try {
      await api.post('/verify-contact-otp/', { type: otpModal.type, new_value: otpModal.newValue, otp: otpModal.otp });
      toast.success(`${otpModal.type} updated successfully!`);
      setOtpModal({ isOpen: false, type: '', step: 1, newValue: '', otp: '', loading: false });
      fetchProfileData();
    } catch (error) {
      toast.error("Invalid OTP");
      setOtpModal(prev => ({ ...prev, loading: false }));
    }
  };

  // --- Password Handler ---
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return toast.error("New passwords do not match!");
    setUpdatingPassword(true);
    try {
      await api.post('/change-password/', { current_password: passwords.current, new_password: passwords.new });
      toast.success("Password updated successfully!");
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // --- Address Handlers ---
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      if (addressModal.isEditing) {
        await api.put(`/addresses/${addressModal.id}/`, addressModal);
        toast.success("Address updated!");
      } else {
        await api.post('/addresses/', addressModal);
        toast.success("Address added!");
      }
      setAddressModal(prev => ({ ...prev, isOpen: false }));
      fetchProfileData();
    } catch (error) {
      toast.error("Failed to save address");
    }
  };

  const deleteAddress = async (id) => {
    if(!window.confirm("Delete this address?")) return;
    try {
      await api.delete(`/addresses/${id}/`);
      toast.success("Address removed");
      fetchProfileData();
    } catch (err) { toast.error("Failed to delete"); }
  };

  // --- Handlers for Reviews ---
  const openProductReviewModal = (item) => {
    setSelectedItemToReview(item);
    setReviewRating(5);
    setReviewText('');
    setReviewModalOpen(true);
  };

  const handleProductReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.post(`/products/${selectedItemToReview.product_details.id}/reviews/`, {
        order_item: selectedItemToReview.id,
        rating: reviewRating,
        review_text: reviewText
      });
      toast.success("Review submitted successfully!");
      setReviewedItemIds(prev => new Set(prev).add(selectedItemToReview.id));
      setReviewModalOpen(false);
    } catch (error) {
      const errorMsg = error?.response?.data?.[0] || error?.response?.data?.non_field_errors?.[0] || "Failed to submit review or already reviewed.";
      toast.error(errorMsg);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handlePlatformReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingPlatform(true);
    try {
      await api.post('/platform-reviews/', {
        rating: platformRating,
        feedback_text: platformFeedback
      });
      toast.success("Thank you for your feedback!");
      setPlatformReviewModalOpen(false);
    } catch (error) {
      toast.error("Failed to submit feedback.");
    } finally {
      setSubmittingPlatform(false);
    }
  };

  return (
    <PageShell>
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 font-sans relative">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Menu */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-foreground mb-4 px-4">My Account</h2>
            <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-2 md:pb-0">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all whitespace-nowrap md:whitespace-normal
                      ${active 
                        ? 'bg-secondary text-accent border-l-4 border-accent' 
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground border-l-4 border-transparent'
                      }`}
                  >
                    <Icon size={16} />
                    {t.label}
                  </button>
                );
              })}
              
              {/* Dedicated Wishlist Link */}
              <Link
                to="/wishlist"
                className="flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-muted-foreground hover:bg-secondary hover:text-foreground border-l-4 border-transparent"
              >
                <Heart size={16} />
                My Wishlist
              </Link>
            </nav>

            {/* Logout Button */}
            <div className="mt-4 pt-4 border-t border-border">
              <button
                onClick={() => { logout(); toast.success('Logged out successfully'); }}
                className="flex items-center gap-3 px-4 py-3 w-full text-sm font-bold rounded-lg text-destructive hover:bg-destructive/10 transition-all duration-200"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          
          {/* TAB: OVERVIEW */}
          {tab === "overview" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-foreground mb-8 border-b border-border pb-4">Dashboard Overview</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-4">
                  <div className="bg-secondary p-4 rounded-full text-accent">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-muted-foreground uppercase">Total Orders</p>
                    <p className="text-2xl font-black text-accent">{orders.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-secondary border border-dashed border-border rounded-xl p-10 text-center mt-6">
                <p className="text-accent font-bold">Welcome back, {profileData.name || 'User'}! Keep track of your recent activity here.</p>
              </div>
            </div>
          )}

          {/* TAB: MY ORDERS */}
          {tab === "orders" && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-border pb-4 gap-4">
                <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
                <button
                  onClick={() => {
                    setPlatformRating(5);
                    setPlatformFeedback('');
                    setPlatformReviewModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-secondary text-accent border border-border hover:border-accent px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-200 shadow-sm active:scale-95"
                >
                  <Star className="w-4 h-4" />
                  Rate Platform
                </button>
              </div>

              {loading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => <SkeletonOrderCard key={i} />)}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-20 bg-secondary rounded-xl border border-dashed border-border">
                  <p className="text-muted-foreground font-medium">You haven't placed any orders yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map(order => (
                    <div key={order.id} className="border border-border rounded-xl p-6 bg-card shadow-sm">
                      <div className="flex justify-between items-center border-b border-border pb-4 mb-4 bg-secondary -mx-6 -mt-6 px-6 pt-6 rounded-t-xl">
                        <div>
                          <p className="text-sm text-muted-foreground font-bold tracking-widest">ORDER #{order.id}</p>
                          <p className="font-bold text-foreground mt-1 text-sm">
                            Payment: <span className="uppercase text-success bg-success/10 px-2 py-0.5 rounded ml-1">{order.payment_status}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground font-bold">Total</p>
                          <p className="font-bold text-xl text-accent">
                            ₹{parseFloat(order.total_price).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {order.items?.map(item => (
                          <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3 border border-border rounded-lg bg-card">
                            <div className="flex items-center gap-4">
                              <img src={item.product_details?.image} className="w-16 h-16 object-cover bg-secondary rounded-md border border-border shrink-0" alt="" />
                              <div>
                                <p className="font-bold text-foreground">{item.product_details?.name}</p>
                                <p className="text-sm text-muted-foreground">Qty: {item.quantity} | Vendor: {item.vendor_shop}</p>
                              </div>
                            </div>
                            
                            <div className="text-right flex flex-col items-end gap-2">
                              <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full ${
                                item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                item.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                item.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                                'bg-success/10 text-success'
                              }`}>
                                {item.status}
                              </span>
                              
                              {item.status === 'delivered' && !reviewedItemIds.has(item.id) && (
                                <button onClick={() => openProductReviewModal(item)} className="text-[11px] font-bold text-accent hover:text-accent/80 underline underline-offset-2 transition-colors">
                                  Leave a Review
                                </button>
                              )}
                              {reviewedItemIds.has(item.id) && (
                                <span className="text-[11px] font-bold text-muted-foreground">Reviewed ✓</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* TAB: SETTINGS */}
          {tab === "settings" && (
            <div className="space-y-8">
              <div className="border-b border-border pb-4">
                <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
                <p className="text-muted-foreground mt-2">Manage your security and address book.</p>
              </div>
              
              {/* Profile Information */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                {!isEditingProfile ? (
                  <div>
                    <div className="flex justify-between items-start mb-10">
                      <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-accent">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">Profile Information</h3>
                          <p className="text-sm text-muted-foreground">Update your basic profile details</p>
                        </div>
                      </div>
                      <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-accent rounded-lg text-sm font-bold hover:bg-secondary transition-colors">
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    </div>

                    <div className="space-y-6 max-w-2xl">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <span className="text-sm font-medium text-muted-foreground">Full Name</span>
                        <span className="col-span-2 text-sm font-medium text-foreground">{profileData.name || 'Not provided'}</span>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <span className="text-sm font-medium text-muted-foreground">Email Address</span>
                        <div className="col-span-2 flex items-center gap-3">
                          <span className="text-sm font-medium text-foreground truncate">{profileData.email}</span>
                          {profileData.email && <span className="px-2.5 py-1 bg-success/10 text-success text-xs font-bold rounded-md whitespace-nowrap">Verified</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <span className="text-sm font-medium text-muted-foreground">Phone Number</span>
                        <span className="col-span-2 text-sm font-medium text-foreground">{profileData.phone || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-foreground">Edit Profile</h3>
                      <p className="text-sm text-muted-foreground">Update your details below.</p>
                    </div>
                    <div className="space-y-5 max-w-2xl">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Full Name</label>
                        <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="w-full p-3.5 bg-secondary border border-border rounded-xl outline-none focus:border-accent" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Email Address</label>
                          <div className="flex justify-between items-center p-3.5 bg-muted border border-border rounded-xl">
                            <span className="text-muted-foreground font-medium truncate">{profileData.email}</span>
                            <button onClick={() => setOtpModal(prev => ({ ...prev, isOpen: true, type: 'email', step: 1, newValue: '', otp: '' }))} className="text-sm font-bold text-accent hover:text-accent/80 ml-2 shrink-0">Change</button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Phone Number</label>
                          <div className="flex justify-between items-center p-3.5 bg-muted border border-border rounded-xl">
                            <span className="text-muted-foreground font-medium">{profileData.phone || 'Not set'}</span>
                            <button onClick={() => setOtpModal(prev => ({ ...prev, isOpen: true, type: 'phone', step: 1, newValue: '', otp: '' }))} className="text-sm font-bold text-accent hover:text-accent/80">{profileData.phone ? 'Change' : 'Add'}</button>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button onClick={() => { setIsEditingProfile(false); fetchProfileData(); }} className="px-6 py-3 bg-muted text-muted-foreground font-bold rounded-xl hover:bg-muted transition-colors">Cancel</button>
                        <button onClick={async () => { await api.put('/profile/', {name: profileData.name}); toast.success("Profile saved"); setIsEditingProfile(false); fetchProfileData(); }} className="px-8 py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-colors shadow-md">Save Changes</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Change Password */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-6">Change Password</h3>
                <form onSubmit={handlePasswordSubmit} className="flex flex-col md:flex-row gap-4 max-w-full">
                  <input type="password" placeholder="Current Password" required value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} className="flex-1 p-3.5 bg-secondary border border-border rounded-xl outline-none focus:border-accent text-sm" />
                  <input type="password" placeholder="New Password" required value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="flex-1 p-3.5 bg-secondary border border-border rounded-xl outline-none focus:border-accent text-sm" />
                  <input type="password" placeholder="Confirm New" required value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="flex-1 p-3.5 bg-secondary border border-border rounded-xl outline-none focus:border-accent text-sm" />
                  <button type="submit" disabled={updatingPassword} className="px-8 py-3.5 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 disabled:opacity-50 transition-colors whitespace-nowrap">Update</button>
                </form>
              </div>

              {/* Address Book */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-foreground">Address Book</h3>
                  <button onClick={() => setAddressModal({ isOpen: true, isEditing: false, id: null, street: '', city: '', state: '', pincode: '', is_default: false })} className="flex items-center gap-2 text-sm font-bold text-accent hover:text-accent/80">
                    <Plus className="w-5 h-5" /> Add New Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-10 bg-secondary rounded-xl border border-dashed border-border">
                    <p className="text-muted-foreground">No saved addresses yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map(addr => (
                      <div key={addr.id} className={`p-5 rounded-xl border ${addr.is_default ? 'border-accent bg-secondary' : 'border-border bg-card'}`}>
                        {addr.is_default && <span className="inline-block px-2 py-1 bg-accent text-white text-[10px] font-bold uppercase rounded mb-2">Default</span>}
                        <p className="text-foreground font-medium leading-relaxed">{addr.street}<br/>{addr.city}, {addr.state} {addr.pincode}</p>
                        <div className="mt-4 flex gap-4 text-sm font-bold">
                          <button onClick={() => {
                                const matchedState = State.getStatesOfCountry('IN').find(s => s.name.toLowerCase() === (addr.state || "").toLowerCase())?.name || addr.state || "";
                                const matchedCity = City.getCitiesOfState('IN', State.getStatesOfCountry('IN').find(s => s.name === matchedState)?.isoCode || '').find(c => c.name.toLowerCase() === (addr.city || "").toLowerCase())?.name || addr.city || "";
                                setAddressModal({
                                  isOpen: true,
                                  isEditing: true,
                                  id: addr.id,
                                  street: addr.street,
                                  city: matchedCity,
                                  state: matchedState,
                                  pincode: addr.pincode,
                                  is_default: addr.is_default
                                })
                              }} className="text-accent hover:text-accent/80">Edit</button>
                          <button onClick={() => deleteAddress(addr.id)} className="text-destructive hover:text-destructive/80">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}

      {/* OTP Verification Modal */}
      {otpModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center">
            <h2 className="text-xl font-bold text-foreground mb-2">Change {otpModal.type}</h2>
            <p className="text-sm text-muted-foreground mb-6">Verify your new {otpModal.type} to secure your account.</p>
            
            {otpModal.step === 1 ? (
              <form onSubmit={requestOtp}>
                <input required type={otpModal.type === 'email' ? 'email' : 'text'} placeholder={`Enter new ${otpModal.type}`} value={otpModal.newValue} onChange={e => setOtpModal({...otpModal, newValue: e.target.value})} className="w-full p-3.5 mb-4 bg-secondary border border-border rounded-xl outline-none focus:border-accent" />
                <button type="submit" disabled={otpModal.loading} className="w-full py-3.5 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 disabled:opacity-50 transition-colors">Send OTP</button>
              </form>
            ) : (
              <form onSubmit={verifyOtpAndUpdate}>
                <input required type="text" placeholder="Enter 6-digit OTP" value={otpModal.otp} onChange={e => setOtpModal({...otpModal, otp: e.target.value})} className="w-full p-3.5 mb-4 bg-secondary border border-border rounded-xl outline-none text-center tracking-widest text-lg focus:border-accent" />
                <button type="submit" disabled={otpModal.loading} className="w-full py-3.5 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 disabled:opacity-50 transition-colors">Verify & Update</button>
              </form>
            )}
            <button type="button" onClick={() => setOtpModal({ isOpen: false, type: '', step: 1, newValue: '', otp: '', loading: false })} className="mt-4 text-sm font-bold text-muted-foreground hover:text-muted-foreground">Cancel</button>
          </div>
        </div>
      )}

      {/* Address Form Modal */}
      {addressModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">{addressModal.isEditing ? 'Edit Address' : 'Add New Address'}</h2>
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <textarea required placeholder="Street Address" value={addressModal.street} onChange={e => setAddressModal({...addressModal, street: e.target.value})} className="w-full p-3.5 bg-secondary border border-border rounded-xl outline-none focus:border-accent resize-none" rows={2} />
              <div className="grid grid-cols-2 gap-4">
                <select 
                  required 
                  value={addressModal.state} 
                  onChange={e => setAddressModal({...addressModal, state: e.target.value, city: ''})} 
                  className="p-3.5 bg-secondary border border-border rounded-xl outline-none focus:border-accent"
                >
                  <option value="" disabled>Select State</option>
                  {State.getStatesOfCountry('IN').map(state => (
                    <option key={state.isoCode} value={state.name}>{state.name}</option>
                  ))}
                </select>
                <select 
                  required 
                  value={addressModal.city} 
                  onChange={e => setAddressModal({...addressModal, city: e.target.value})} 
                  className="p-3.5 bg-secondary border border-border rounded-xl outline-none focus:border-accent"
                  disabled={!addressModal.state}
                >
                  <option value="" disabled>Select City</option>
                  {availableCities.map(city => (
                    <option key={city.name} value={city.name}>{city.name}</option>
                  ))}
                </select>
              </div>
              <input required type="text" placeholder="Pincode" value={addressModal.pincode} onChange={e => setAddressModal({...addressModal, pincode: e.target.value})} className="w-full p-3.5 bg-secondary border border-border rounded-xl outline-none focus:border-accent" />
              
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input type="checkbox" checked={addressModal.is_default} onChange={e => setAddressModal({...addressModal, is_default: e.target.checked})} className="w-4 h-4 text-accent rounded border-border focus:ring-accent" />
                <span className="text-sm font-medium text-muted-foreground">Set as default shipping address</span>
              </label>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setAddressModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 py-3 bg-muted text-muted-foreground font-bold rounded-xl hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-colors">Save Address</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Review Modal */}
      {reviewModalOpen && selectedItemToReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-secondary flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">Rate Product</h2>
              <button onClick={() => setReviewModalOpen(false)} className="text-muted-foreground hover:text-destructive p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleProductReviewSubmit} className="p-6">
              <div className="flex items-center gap-4 mb-6 p-4 bg-muted rounded-xl border border-border">
                <img src={selectedItemToReview.product_details?.image} className="w-12 h-12 object-cover rounded-md border border-border bg-card" alt="" />
                <div>
                  <p className="font-bold text-sm text-foreground">{selectedItemToReview.product_details?.name}</p>
                  <p className="text-xs text-muted-foreground">Sold by {selectedItemToReview.vendor_shop}</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center mb-6">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Your Rating</p>
                <StarRatingInput rating={reviewRating} setRating={setReviewRating} />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-muted-foreground mb-2 ml-1">Write a Review (Optional)</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="How was the quality? Did it meet your expectations?"
                  rows={3}
                  className="w-full p-3 bg-secondary border border-border rounded-xl outline-none focus:border-accent resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-accent text-white py-3.5 rounded-full font-bold uppercase tracking-widest hover:bg-accent/90 disabled:bg-muted shadow-md transition-colors"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Platform Review Modal */}
      {platformReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-secondary flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">Rate Gujju Ni Dukan</h2>
              <button onClick={() => setPlatformReviewModalOpen(false)} className="text-muted-foreground hover:text-destructive p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePlatformReviewSubmit} className="p-6">
              <div className="flex flex-col items-center mb-6 pt-2">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Overall Experience</p>
                <StarRatingInput rating={platformRating} setRating={setPlatformRating} />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-muted-foreground mb-2 ml-1">Your Feedback <span className="text-destructive">*</span></label>
                <textarea
                  required
                  value={platformFeedback}
                  onChange={(e) => setPlatformFeedback(e.target.value)}
                  placeholder="What did you love? How can we improve?"
                  rows={4}
                  className="w-full p-3 bg-secondary border border-border rounded-xl outline-none focus:border-accent resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingPlatform}
                className="w-full bg-accent text-white py-3.5 rounded-full font-bold uppercase tracking-widest hover:bg-accent/90 disabled:bg-muted shadow-md transition-colors"
              >
                {submittingPlatform ? 'Submitting...' : 'Send Feedback'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
    </PageShell>
  );
};

export default AccountPage;
