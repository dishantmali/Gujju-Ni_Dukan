import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import dukanLogo from '@/assets/logo.jpeg';

import api from '@/lib/api';
import { IconPickerModal } from '@/components/IconPickerModal';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Pencil, X } from 'lucide-react';
import { DateTimePicker } from '@/components/ui/date-time-picker';


const Icons = {
  Overview: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /></svg>,
  Vendors: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857" /></svg>,
  Products: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  Users: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Categories: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
  Orders: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  Offers: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Banners: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Subscriptions: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  Reviews: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.908c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.908a1 1 0 00.95-.69l1.519-4.674z" /></svg>,
  Coupons: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>,
};

// ─── Dummy Overview Data ──────────────────────────────────────────────────────
const DUMMY_STATS = [
  { label: 'Total Orders', value: '2,458', change: '+18.6%', up: true, icon: '🛍️', color: 'from-[#FFF7ED] to-[#FFE4C4]', iconBg: 'bg-orange-100', iconColor: 'text-orange-500' },
  { label: 'Total Revenue', value: '₹12,45,680', change: '+24.5%', up: true, icon: '💰', color: 'from-[#F0FDF4] to-[#DCFCE7]', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
  { label: 'Total Products', value: '8,342', change: '+12.3%', up: true, icon: '📦', color: 'from-[#EFF6FF] to-[#DBEAFE]', iconBg: 'bg-blue-100', iconColor: 'text-blue-500' },
  { label: 'Total Users', value: '15,876', change: '+20.1%', up: true, icon: '👥', color: 'from-[#FAF5FF] to-[#EDE9FE]', iconBg: 'bg-purple-100', iconColor: 'text-purple-500' },
];

const SALES_DATA = [
  { day: 'May 10', orders: 180, revenue: 8500 },
  { day: 'May 11', orders: 220, revenue: 12000 },
  { day: 'May 12', orders: 195, revenue: 9800 },
  { day: 'May 13', orders: 340, revenue: 18500 },
  { day: 'May 14', orders: 280, revenue: 15200 },
  { day: 'May 15', orders: 410, revenue: 22000 },
  { day: 'May 16', orders: 375, revenue: 19800 },
  { day: 'May 17', orders: 460, revenue: 24500 },
  { day: 'May 18', orders: 390, revenue: 21000 },
];

const REVENUE_BREAKDOWN = [
  { label: 'Vendor Earnings', value: 8454380, pct: 67.9, color: '#5A3825' },
  { label: 'Platform Commission', value: 2456300, pct: 19.7, color: '#A87C51' },
  { label: 'Delivery Charges', value: 1203200, pct: 9.7, color: '#C4956A' },
  { label: 'Other Income', value: 334590, pct: 2.7, color: '#E8D5BC' },
];

const TOP_PRODUCTS = [
  { name: 'Kaju Katli', sku: 'SKU-SW-001', orders: 342, revenue: '₹1,71,000', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=80&q=80' },
  { name: 'Filter Coffee Blend', sku: 'SKU-SW-002', orders: 289, revenue: '₹1,45,680', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=80&q=80' },
  { name: 'Masala Chai', sku: 'SKU-NK-003', orders: 256, revenue: '₹1,28,000', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=80&q=80' },
  { name: 'Mango Pickle', sku: 'SKU-PB-004', orders: 198, revenue: '₹59,000', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=80&q=80' },
  { name: 'Gathiya Namkeen', sku: 'SKU-SN-005', orders: 176, revenue: '₹88,000', img: 'https://images.unsplash.com/photo-1623428454614-abaf00244e52?w=80&q=80' },
];

const TOP_VENDORS = [
  { name: 'Mithai Wala', orders: 842, revenue: '₹4,25,600', avatar: 'M', color: '#5A3825' },
  { name: 'Coffee Corner', orders: 645, revenue: '₹2,93,500', avatar: 'C', color: '#A87C51' },
  { name: 'Gadget Zone', orders: 532, revenue: '₹2,10,500', avatar: 'G', color: '#6B7280' },
  { name: 'Home Needs', orders: 321, revenue: '₹1,35,200', avatar: 'H', color: '#3B82F6' },
  { name: 'Daily Essentials', orders: 116, revenue: '₹65,400', avatar: 'D', color: '#10B981' },
];

const ALERTS = [
  { icon: '📦', label: '5 Products', sub: 'Low in stock', color: 'bg-red-50 border-red-200', iconBg: 'bg-red-100', textColor: 'text-red-600' },
  { icon: '👤', label: '2 Vendors', sub: 'Inactive for 7+ days', color: 'bg-yellow-50 border-yellow-200', iconBg: 'bg-yellow-100', textColor: 'text-yellow-600' },
  { icon: '🎁', label: '3 Offers', sub: 'Ending today', color: 'bg-blue-50 border-blue-200', iconBg: 'bg-blue-100', textColor: 'text-blue-600' },
  { icon: '↩️', label: '19 Orders', sub: 'Return requested', color: 'bg-orange-50 border-orange-200', iconBg: 'bg-orange-100', textColor: 'text-orange-600' },
  { icon: '📈', label: 'High Traffic', sub: 'Today ↑ 122%', color: 'bg-green-50 border-green-200', iconBg: 'bg-green-100', textColor: 'text-green-600' },
];

const QUICK_ACTIONS = [
  { icon: '🏷️', label: 'Add Category', tab: 'categories' },
  { icon: '📰', label: 'Create News', tab: 'news' },
  { icon: '🖼️', label: 'Add Banner', tab: 'marketingBanners' },
  { icon: '📦', label: 'Manage Products', tab: 'products' },
  { icon: '👥', label: 'Manage Vendors', tab: 'vendors' },
  { icon: '🛒', label: 'View Orders', tab: 'orders' },
];

const ORDERS_BAR = [180, 420, 310, 580, 490, 720, 640, 810, 750, 620, 880, 790, 950, 840, 720, 680, 910, 850, 780, 920, 860, 730, 810, 950, 880, 820, 760, 900, 840, 760, 820];

const ORDER_STATUS = [
  { label: 'Delivered', count: 1450, pct: 59, color: '#5A3825' },
  { label: 'Processing', count: 820, pct: 21, color: '#A87C51' },
  { label: 'Shipped', count: 390, pct: 13, color: '#C4956A' },
  { label: 'Cancelled', count: 188, pct: 7, color: '#E8D5BC' },
];

const TRAFFIC_DATA = [12, 18, 14, 22, 19, 28, 24, 32, 29, 25, 35, 31, 38, 34, 29, 36, 42, 38, 45, 41, 37, 44, 48, 43, 40, 47, 52, 48, 44, 51];

// SVG Chart Components
const BarChart = ({ data, color = '#A87C51', width = 400, height = 120 }) => {
  const max = Math.max(...data);
  const barW = (width / data.length) - 2;
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {data.map((v, i) => {
        const bh = (v / max) * (height - 4);
        return <rect key={i} x={i * (width / data.length)} y={height - bh} width={barW} height={bh} rx="2" fill={color} opacity="0.8" />;
      })}
    </svg>
  );
};

const DonutChart = ({ segments, size = 130, thickness = 28 }) => {
  const r = (size - thickness) / 2;
  const cx = size / 2; const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3EDE5" strokeWidth={thickness} />
      {segments.map((seg, i) => {
        const dash = (seg.pct / 100) * circ;
        const gap = circ - dash;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset} strokeLinecap="butt"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
        );
        offset += dash; return el;
      })}
    </svg>
  );
};

const AreaChart = ({ data, color = '#A87C51', width = 400, height = 100 }) => {
  const max = Math.max(...data); const min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - 8 - ((v - min) / (max - min || 1)) * (height - 16);
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const area = `${pts[0]} ` + pts.slice(1).join(' ') + ` ${width},${height} 0,${height}`;
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#areaGrad)" />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const SalesLineChart = ({ data }) => {
  const W = 500; const H = 120; const pad = 10;
  const maxO = Math.max(...data.map(d => d.orders));
  const maxR = Math.max(...data.map(d => d.revenue));
  const ox = (i) => pad + (i / (data.length - 1)) * (W - pad * 2);
  const oy = (v) => H - pad - ((v / maxO) * (H - pad * 2));
  const ry = (v) => H - pad - ((v / maxR) * (H - pad * 2));
  const orderPts = data.map((d, i) => `${ox(i)},${oy(d.orders)}`).join(' ');
  const revPts = data.map((d, i) => `${ox(i)},${ry(d.revenue)}`).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={pad} y1={H - pad - f * (H - pad * 2)} x2={W - pad} y2={H - pad - f * (H - pad * 2)} stroke="#F0E8DF" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      <polyline points={orderPts} fill="none" stroke="#2C1E16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={revPts} fill="none" stroke="#A87C51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 3" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={ox(i)} cy={oy(d.orders)} r="3.5" fill="#2C1E16" stroke="white" strokeWidth="1.5" />
          <circle cx={ox(i)} cy={ry(d.revenue)} r="3.5" fill="#A87C51" stroke="white" strokeWidth="1.5" />
        </g>
      ))}
    </svg>
  );
};

const isValidImageFile = (file: File) => file.type.startsWith('image/');

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const profileRef = useRef(null);

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allVendors, setAllVendors] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categoryRequests, setCategoryRequests] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [vendorSubscriptions, setVendorSubscriptions] = useState<any[]>([]);
  const [newPlan, setNewPlan] = useState({ name: '', price: '', product_limit: '', duration_days: 30, features: '' });
  const [editingPlan, setEditingPlan] = useState(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [manualReviews, setManualReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ name: '', city: '', stars: 5, description: '', is_active: true });
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [platformReviews, setPlatformReviews] = useState<any[]>([]);
  const [activeReviewSubTab, setActiveReviewSubTab] = useState<'manual' | 'platform'>('manual');
  const [loading, setLoading] = useState(true);

  // Coupon States
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_type: 'rupee',
    discount_value: '',
    min_purchase_amount: '0',
    max_discount_cap: '',
    limit_per_user: 1,
    max_usages: '',
    start_datetime: '',
    end_datetime: '',
    products: [] as number[],
    is_active: true
  });
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);

  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('mdi:shopping');
  const [newCatIconType, setNewCatIconType] = useState('iconify');
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  const [newNews, setNewNews] = useState({ title: '', start_date: '', end_date: '' });
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [newBannerYoutubeUrl, setNewBannerYoutubeUrl] = useState('');
  const [newBannerLinkUrl, setNewBannerLinkUrl] = useState('');
  const [newBannerPosition, setNewBannerPosition] = useState<'left' | 'right'>('left');
  const [newBannerOrder, setNewBannerOrder] = useState(0);
  const [newBannerStartDatetime, setNewBannerStartDatetime] = useState('');
  const [newBannerEndDatetime, setNewBannerEndDatetime] = useState('');
  const [heroBanners, setHeroBanners] = useState<any[]>([]);
  const [heroBannerImageFile, setHeroBannerImageFile] = useState(null);
  const [salesRange, setSalesRange] = useState('Last 7 Days');
  const [revenueRange, setRevenueRange] = useState('This Month');
  const [ordersRange, setOrdersRange] = useState('This Month');
  const [trafficRange, setTrafficRange] = useState('This Month');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, vendRes, userRes, catRes, orderRes, catReqRes, offerRes]: any[] = await Promise.all([
          api.get('/admin/products/pending/'),
          api.get('/admin/vendors/pending/'),
          api.get('/admin/users/'),
          api.get('/admin/categories/'),
          api.get('/admin/orders/'),
          api.get('/admin/category-requests/'),
          api.get('/admin/news/')
        ]);
        setAllProducts(prodRes || []);
        setAllVendors(vendRes || []);
        setUsers(userRes || []);
        setCategories(catRes || []);
        setOrders(orderRes || []);
        setCategoryRequests(catReqRes || []);
        setNews(offerRes || []);

        try {
          const bannerRes: any = await api.get('/admin/banners/');
          setBanners(bannerRes || []);
        } catch (e) { console.warn("Banners endpoint not ready yet", e); }

        try {
          const heroRes: any = await api.get('/admin/hero-banners/');
          setHeroBanners(heroRes || []);
        } catch (e) { console.warn("Hero banners endpoint not ready yet", e); }

        try {
          const subRes: any = await api.get('/admin/subscription-plans/');
          const vendSubRes: any = await api.get('/admin/vendor-subscriptions/');
          setSubscriptionPlans(subRes || []);
          setVendorSubscriptions(vendSubRes || []);
        } catch (e) { console.warn("Subscription endpoints not ready yet", e); }

        try {
          const reviewsRes: any = await api.get('/admin/manual-reviews/');
          setManualReviews(reviewsRes || []);
        } catch (e) { console.warn("Manual reviews endpoint error", e); }

        try {
          const platformRes: any = await api.get('/admin/platform-reviews/');
          setPlatformReviews(platformRes || []);
        } catch (e) { console.warn("Platform reviews endpoint error", e); }

        try {
          const coupRes: any = await api.get('/admin/coupons/');
          // Guarantee that only platform coupons are set
          const adminCoupons = (coupRes || []).filter((c: any) => !c.vendor);
          setCoupons(adminCoupons);
        } catch (e) { console.warn("Coupons endpoint error", e); }

      } catch (error) {
        console.error(error);
        toast.error("Error loading admin data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handler = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  // --- ACTIONS (APPROVE / REJECT) ---
  const handleAction = async (type, id, action) => {
    try {
      if (type === 'product') {
        await api.post(`/admin/products/${id}/action/`, { action });
        setAllProducts(allProducts.map(p =>
          p.id === id
            ? { ...p, status: action === 'approve' ? 'approved' : 'rejected', is_active: action === 'approve' }
            : p
        ));
      } else if (type === 'vendor') {
        await api.post(`/admin/vendors/${id}/action/`, { action });
        setAllVendors(allVendors.map(v =>
          v.id === id
            ? { ...v, is_approved: action === 'approve', is_active: action === 'approve' }
            : v
        ));
        // Refresh products to reflect Archived/Restored state without page reload
        const prodRes: any = await api.get('/admin/products/pending/');
        setAllProducts(prodRes || []);
      }
      toast.success(`${type} ${action}d successfully`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || `Failed to ${action} ${type}`);
    }
  };

  const handleCatRequestAction = async (id, action) => {
    try {
      await api.post(`/admin/category-requests/${id}/action/`, { action });
      setCategoryRequests(categoryRequests.filter(req => req.id !== id));
      if (action === 'approve') { const res: any = await api.get('/admin/categories/'); setCategories(res || []); }
      toast.success(`Category request ${action}d`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed category request action");
    }
  };

  const handleToggleNews = async (id, isActive) => {
    try {
      const res = await api.patch(`/admin/news/${id}/`, { is_active: isActive });
      setNews(news.map(n => n.id === id ? res : n));
      toast.success(`News ${isActive ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update news");
    }
  };

  const handleDeleteNews = async (id) => {
    if (!window.confirm("Are you sure you want to delete this news?")) return;
    try {
      await api.delete(`/admin/news/${id}/`);
      setNews(news.filter(n => n.id !== id));
      toast.success("News deleted");
    } catch { toast.error("Failed to delete news"); }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatIcon) return toast.error("Please select an icon for the category");
    try {
      if (editingCategoryId) {
        const res = await api.put(`/admin/categories/${editingCategoryId}/`, {
          name: newCatName,
          icon: newCatIcon,
          icon_type: newCatIconType
        });
        setCategories(categories.map(c => c.id === editingCategoryId ? res : c));
        setEditingCategoryId(null);
        toast.success("Category updated!");
      } else {
        const res = await api.post('/admin/categories/', {
          name: newCatName,
          icon: newCatIcon,
          icon_type: newCatIconType
        });
        setCategories([...categories, res]);
        toast.success("Category created!");
      }
      setNewCatName('');
      setNewCatIcon('mdi:shopping');
      setNewCatIconType('iconify');
    } catch { toast.error(editingCategoryId ? "Failed to update category" : "Failed to create category"); }
  };

  const handleEditCategory = (cat) => {
    setEditingCategoryId(cat.id);
    setNewCatName(cat.name);
    setNewCatIcon(cat.icon);
    setNewCatIconType(cat.icon_type || 'iconify');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setNewCatName('');
    setNewCatIcon('mdi:shopping');
    setNewCatIconType('iconify');
  };


  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure? This may affect products in this category.")) return;
    try {
      await api.delete(`/admin/categories/${id}/`);
      setCategories(categories.filter(c => c.id !== id));
      toast.success("Category deleted");
    } catch { toast.error("Failed to delete category"); }
  };

  const handleCreateNews = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: newNews.title,
        start_date: newNews.start_date,
        end_date: newNews.end_date,
        is_active: true
      };
      const res = await api.post('/admin/news/', payload);
      setNews([res, ...news]);
      setNewNews({ title: '', start_date: '', end_date: '' });
      toast.success("News created!");
    } catch { toast.error("Failed to create news"); }
  };

  const handleCreateBanner = async (e) => {
    e.preventDefault();
    if (newBannerPosition === 'left' && !bannerImageFile) return toast.error("Please provide an image for the left banner");
    if (newBannerPosition === 'right' && !newBannerYoutubeUrl) return toast.error("Please provide a YouTube URL for the right banner");
    if (!newBannerStartDatetime || !newBannerEndDatetime) return toast.error("Please provide start and end date/time for the banner");
    const formData = new FormData();
    if (newBannerPosition === 'left' && bannerImageFile) {
      formData.append('image', bannerImageFile);
    }
    if (newBannerPosition === 'right' && newBannerYoutubeUrl) {
      formData.append('youtube_url', newBannerYoutubeUrl);
    }
    if (newBannerLinkUrl) {
      formData.append('link_url', newBannerLinkUrl);
    }
    formData.append('is_active', 'true');
    formData.append('position', newBannerPosition);
    formData.append('display_order', String(newBannerOrder));
    const startFormatted = new Date(newBannerStartDatetime).toLocaleString();
    const endFormatted = new Date(newBannerEndDatetime).toLocaleString();
    formData.append('title', `Marketing Banner | ${newBannerPosition === 'left' ? 'Left' : 'Right'} | ${startFormatted} → ${endFormatted}`);
    try {
      const res = await api.post('/admin/banners/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setBanners([res, ...banners]);
      setBannerImageFile(null);
      setNewBannerYoutubeUrl('');
      setNewBannerLinkUrl('');
      setNewBannerOrder(0);
      setNewBannerStartDatetime('');
      setNewBannerEndDatetime('');
      const fi = document.getElementById('bannerImageInput') as HTMLInputElement; if (fi) fi.value = '';
      toast.success("Marketing banner uploaded!");
    } catch { toast.error("Failed to upload banner"); }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;
    try {
      await api.delete(`/admin/banners/${id}/`);
      setBanners(banners.filter(b => b.id !== id));
      toast.success("Banner deleted");
    } catch { toast.error("Failed to delete banner"); }
  };

  const handleCreateHeroBanner = async (e) => {
    e.preventDefault();
    if (!heroBannerImageFile) return toast.error("Please provide an image for the hero banner");
    const formData = new FormData();
    formData.append('image', heroBannerImageFile);
    formData.append('is_active', 'true');
    formData.append('title', 'Hero Banner');
    try {
      const res = await api.post('/admin/hero-banners/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setHeroBanners([res, ...heroBanners]);
      setHeroBannerImageFile(null);
      const fi = document.getElementById('heroBannerInput') as HTMLInputElement; if (fi) fi.value = '';
      toast.success("Hero banner uploaded!");
    } catch { toast.error("Failed to upload hero banner"); }
  };

  const handleDeleteHeroBanner = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hero banner?")) return;
    try {
      await api.delete(`/admin/hero-banners/${id}/`);
      setHeroBanners(heroBanners.filter(b => b.id !== id));
      toast.success("Hero banner deleted");
    } catch { toast.error("Failed to delete hero banner"); }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        const res = await api.put(`/admin/subscription-plans/${editingPlan.id}/`, newPlan);
        setSubscriptionPlans(subscriptionPlans.map(p => p.id === editingPlan.id ? res : p));
        toast.success("Plan updated!");
      } else {
        const res = await api.post('/admin/subscription-plans/', newPlan);
        setSubscriptionPlans([...subscriptionPlans, res]);
        toast.success("Plan created!");
      }
      setNewPlan({ name: '', price: '', product_limit: '', duration_days: 30, features: '' });
      setEditingPlan(null);
    } catch {
      toast.error("Failed to save plan");
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm("Delete this pricing plan? Vendors on this plan might be affected.")) return;
    try {
      await api.delete(`/admin/subscription-plans/${id}/`);
      setSubscriptionPlans(subscriptionPlans.filter(p => p.id !== id));
      toast.success("Plan deleted");
    } catch {
      toast.error("Failed to delete plan");
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setNewPlan({
      name: plan.name,
      price: plan.price,
      product_limit: plan.product_limit,
      duration_days: plan.duration_days,
      features: plan.features || ''
    });
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    try {
      if (editingReview) {
        const res = await api.put(`/admin/manual-reviews/${editingReview.id}/`, newReview);
        setManualReviews(manualReviews.map(r => r.id === editingReview.id ? res : r));
        toast.success("Manual review updated!");
      } else {
        const res = await api.post('/admin/manual-reviews/', newReview);
        setManualReviews([res, ...manualReviews]);
        toast.success("Manual review created!");
      }
      setNewReview({ name: '', city: '', stars: 5, description: '', is_active: true });
      setEditingReview(null);
    } catch (err) {
      toast.error("Failed to save manual review");
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setNewReview({
      name: review.name,
      city: review.city,
      stars: review.stars,
      description: review.description,
      is_active: review.is_active
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm("Are you sure you want to delete this manual review?")) return;
    try {
      await api.delete(`/admin/manual-reviews/${id}/`);
      setManualReviews(manualReviews.filter(r => r.id !== id));
      toast.success("Manual review deleted");
    } catch {
      toast.error("Failed to delete manual review");
    }
  };

  const handleCancelEditReview = () => {
    setEditingReview(null);
    setNewReview({ name: '', city: '', stars: 5, description: '', is_active: true });
  };

  const handleTogglePlatformReviewFeatured = async (id, currentFeatured) => {
    try {
      const res = await api.patch(`/admin/platform-reviews/${id}/`, { is_featured: !currentFeatured });
      setPlatformReviews(platformReviews.map(r => r.id === id ? res : r));
      toast.success(currentFeatured ? "Platform review unfeatured" : "Platform review approved and featured!");
    } catch {
      toast.error("Failed to update platform review status.");
    }
  };

  const handleDeletePlatformReview = async (id) => {
    if (!window.confirm("Are you sure you want to delete this platform review?")) return;
    try {
      await api.delete(`/admin/platform-reviews/${id}/`);
      setPlatformReviews(platformReviews.filter(r => r.id !== id));
      toast.success("Platform review deleted");
    } catch {
      toast.error("Failed to delete platform review");
    }
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    const payload = {
      ...newCoupon,
      code: newCoupon.code.toUpperCase().trim(),
      discount_value: parseFloat(newCoupon.discount_value),
      min_purchase_amount: parseFloat(newCoupon.min_purchase_amount || '0'),
      max_discount_cap: newCoupon.max_discount_cap ? parseFloat(newCoupon.max_discount_cap) : null,
      max_usages: newCoupon.max_usages ? parseInt(newCoupon.max_usages) : null,
      limit_per_user: parseInt(String(newCoupon.limit_per_user)),
    };
    try {
      if (editingCoupon) {
        const res = await api.put(`/admin/coupons/${editingCoupon.id}/`, payload);
        setCoupons(coupons.map(c => c.id === editingCoupon.id ? res : c));
        toast.success("Coupon updated successfully!");
      } else {
        const res = await api.post('/admin/coupons/', payload);
        setCoupons([res, ...coupons]);
        toast.success("Coupon created successfully!");
      }
      setNewCoupon({
        code: '',
        discount_type: 'rupee',
        discount_value: '',
        min_purchase_amount: '0',
        max_discount_cap: '',
        limit_per_user: 1,
        max_usages: '',
        start_datetime: '',
        end_datetime: '',
        products: [],
        is_active: true
      });
      setEditingCoupon(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save coupon.");
    }
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setNewCoupon({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_purchase_amount: String(coupon.min_purchase_amount),
      max_discount_cap: coupon.max_discount_cap ? String(coupon.max_discount_cap) : '',
      limit_per_user: coupon.limit_per_user,
      max_usages: coupon.max_usages ? String(coupon.max_usages) : '',
      start_datetime: coupon.start_datetime ? coupon.start_datetime.substring(0, 16) : '',
      end_datetime: coupon.end_datetime ? coupon.end_datetime.substring(0, 16) : '',
      products: coupon.products || [],
      is_active: coupon.is_active
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await api.delete(`/admin/coupons/${id}/`);
      setCoupons(coupons.filter(c => c.id !== id));
      toast.success("Coupon deleted!");
    } catch {
      toast.error("Failed to delete coupon.");
    }
  };

  const handleCancelEditCoupon = () => {
    setEditingCoupon(null);
    setNewCoupon({
      code: '',
      discount_type: 'rupee',
      discount_value: '',
      min_purchase_amount: '0',
      max_discount_cap: '',
      limit_per_user: 1,
      max_usages: '',
      start_datetime: '',
      end_datetime: '',
      products: [],
      is_active: true
    });
  };

  const handleToggleCouponActive = async (coupon) => {
    try {
      const res = await api.patch(`/admin/coupons/${coupon.id}/`, { is_active: !coupon.is_active });
      setCoupons(coupons.map(c => c.id === coupon.id ? res : c));
      toast.success(`Coupon ${!coupon.is_active ? 'activated' : 'deactivated'}!`);
    } catch {
      toast.error("Failed to toggle coupon status.");
    }
  };

  if (loading) return (
    <div className="fixed inset-0 z-[60] bg-[var(--bg-main)] flex items-center justify-center text-[var(--coffee-light)] font-sans">
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="font-bold tracking-widest uppercase">Loading Portal...</span>
      </div>
    </div>
  );

  // --- SAFE FILTERING ---
  // Using '!== false' ensures that if the backend hasn't updated the old records yet (undefined), they default to TRUE.
  const pendingVendorsList = allVendors.filter(v => !v.is_approved && v.is_active !== false);
  const directoryVendorsList = allVendors.filter(v => v.is_approved || v.is_active === false);
  const pendingProductsList = allProducts.filter(p => p.status === 'pending');
  const directoryProductsList = allProducts.filter(p => p.status !== 'pending');
  const pendingCatReqs = categoryRequests.filter(r => r.status === 'pending');
  const pendingPlatformReviewsCount = platformReviews.filter(r => !r.is_featured).length;

  const navItems = [
    { key: 'overview', label: 'Overview', Icon: Icons.Overview, badge: null },
    { key: 'vendors', label: 'Manage Vendors', Icon: Icons.Vendors, badge: pendingVendorsList.length },
    { key: 'products', label: 'Manage Products', Icon: Icons.Products, badge: pendingProductsList.length },
    { key: 'users', label: 'Users Directory', Icon: Icons.Users, badge: null },
    { key: 'subscriptions', label: 'Manage Subs', Icon: Icons.Subscriptions, badge: null },
    { key: 'categories', label: 'Categories', Icon: Icons.Categories, badge: pendingCatReqs.length },
    { key: 'news', label: 'News', Icon: Icons.Offers, badge: null },
    { key: 'headerBanners', label: 'Header Banner', Icon: Icons.Banners, badge: null },
    { key: 'marketingBanners', label: 'Marketing Banner', Icon: Icons.Banners, badge: null },
    { key: 'reviews', label: 'Reviews', Icon: Icons.Reviews, badge: pendingPlatformReviewsCount > 0 ? pendingPlatformReviewsCount : null },
    { key: 'orders', label: 'Global Orders', Icon: Icons.Orders, badge: null },
    { key: 'coupons', label: 'Coupons', Icon: Icons.Coupons, badge: null },
  ];

  const RangeSelect = ({ value, onChange, options }) => (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="text-xs font-semibold text-[var(--coffee-light)] bg-[var(--bg-main)] border border-[var(--border)] rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:border-[var(--border-hover)] transition-colors">
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );

  return (
    <div className="fixed inset-0 z-[60] flex bg-[#F3EDE5] font-sans overflow-hidden">
      {isSidebarOpen && (<div className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />)}

      {/* ── Sidebar ── */}
      <aside className={`absolute lg:relative w-[260px] bg-white border-r border-[#E8D5BC] flex flex-col h-full shrink-0 shadow-sm z-50 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center px-6 h-[80px] shrink-0 cursor-pointer" onClick={() => navigate('/')}>
          <img src={dukanLogo} alt="Logo" className="h-18 w-auto object-contain logo-transparent bg-white" />
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1 custom-scrollbar">
          <p className="px-3 text-[10px] font-bold text-[#A87C51] uppercase tracking-widest mb-4 mt-2">Admin Controls</p>
          {navItems.map(({ key, label, Icon, badge }) => {
            const isActive = activeTab === key;
            return (
              <button key={key} onClick={() => { setActiveTab(key); setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 group relative ${isActive ? 'bg-[#5A3825] text-white shadow-lg' : 'text-[#8C7B6E] hover:bg-[#F3EDE5] hover:text-[#5A3825]'}`}>
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-white' : 'text-[#A87C51] group-hover:text-[#5A3825]'} transition-colors`}><Icon /></span>
                  {label}
                </div>
                {badge > 0 && (
                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-[#5A3825] text-white'}`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-6 border-t border-[#E8D5BC] shrink-0 text-center">
          <p className="text-[11px] text-[#A87C51] font-medium">© {new Date().getFullYear()} Gujju Ni Dukan</p>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-[80px] bg-white border-b border-[#E8D5BC] flex items-center justify-between px-8 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-[#5A3825] hover:bg-[#F3EDE5] rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="hidden sm:flex items-center gap-3 bg-[#FAF7F2] border border-[#E8D5BC] rounded-xl px-4 py-2.5 w-80 focus-within:border-[#A87C51] transition-colors">
              <svg className="w-4 h-4 text-[#A87C51]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input className="bg-transparent text-sm outline-none text-[#5A3825] placeholder:text-[#A87C51] w-full" placeholder="Search anything..." />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-[#A87C51] hover:bg-[#F3EDE5] rounded-xl transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </button>

            <div className="relative" ref={profileRef}>
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 p-1 pr-3 hover:bg-[#F3EDE5] rounded-full transition-all border border-transparent hover:border-[#E8D5BC]">
                <div className="w-10 h-10 rounded-full bg-[#5A3825] flex items-center justify-center text-white font-black shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-black text-[#5A3825] leading-none mb-1">{user?.name || 'Admin'}</p>
                  <p className="text-[10px] font-bold text-[#A87C51] uppercase tracking-wider leading-none">SUPER ADMIN</p>
                </div>
                <svg className={`w-4 h-4 text-[#A87C51] transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>

              <div className={`absolute right-0 mt-3 w-56 bg-white border border-[#E8D5BC] rounded-2xl shadow-xl py-2 z-50 transition-all duration-200 origin-top-right ${isProfileOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
                <div className="px-4 py-3 border-b border-[#FAF7F2] mb-1">
                  <p className="text-xs font-bold text-[#A87C51] uppercase tracking-widest mb-1">Signed in as</p>
                  <p className="text-sm font-black text-[#5A3825] truncate">{user?.email || 'superadmin@gujjunidukan.com'}</p>
                </div>
                <button onClick={() => { navigate('/'); setIsProfileOpen(false); }} className="w-full px-4 py-2.5 text-sm font-bold text-[#8C7B6E] hover:bg-[#F3EDE5] hover:text-[#5A3825] flex items-center gap-3 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  Return to Store
                </button>
                <div className="my-1 border-t border-[#FAF7F2]"></div>
                <button onClick={handleLogout} className="w-full px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Tab Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#F3EDE5]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >

              {/* ── OVERVIEW TAB ────────────────────────────────────────────────── */}
              {activeTab === 'overview' && (
                <div className="space-y-8">

                  {/* ── Stat Cards ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {DUMMY_STATS.map((s, i) => (
                      <div key={i} className="bg-white rounded-2xl p-6 border border-[#E8D5BC] shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-[10px] font-bold text-[#A87C51] uppercase tracking-wider">{s.label}</p>
                            <h3 className="text-3xl font-black text-[#5A3825] mt-1 tracking-tight">{s.value}</h3>
                          </div>
                          <div className={`${s.iconBg} w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner`}>{s.icon}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${s.up ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{s.up ? '↑' : '↓'} {s.change}</span>
                          <span className="text-[10px] font-medium text-[#8C7B6E]">vs last 7 days</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Quick Actions ── */}
                  <div className="bg-white rounded-2xl border border-[#E8D5BC] shadow-sm p-8">
                    <h2 className="text-[10px] font-bold text-[#A87C51] mb-6 uppercase tracking-widest">Quick Actions</h2>
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-6 gap-4">
                      {QUICK_ACTIONS.map((qa, i) => (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          key={i}
                          onClick={() => setActiveTab(qa.tab)}
                          className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-[#FAF7F2] hover:border-[#E8D5BC] hover:bg-[#FAF7F2] transition-all duration-200 group bg-[#FAF7F2]/30"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-2xl group-hover:bg-white shadow-sm transition-colors">{qa.icon}</div>
                          <span className="text-xs font-bold text-[#8C7B6E] group-hover:text-[#5A3825]">{qa.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* ── Sales Overview + Revenue Breakdown ── */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E8D5BC] shadow-sm p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">Sales Overview</h2>
                        <RangeSelect value={salesRange} onChange={setSalesRange} options={['Last 7 Days', 'Last 14 Days', 'This Month']} />
                      </div>
                      <div className="flex items-center gap-5 mb-3">
                        <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#5A3825] inline-block rounded"></span><span className="text-xs text-[var(--text-muted)]">Orders</span></div>
                        <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block rounded" style={{ borderTop: '2px dashed #C4956A', background: 'none' }}></span><span className="text-xs text-[var(--text-muted)]">Revenue (₹)</span></div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex flex-col justify-between text-[10px] text-[var(--text-light)] text-right w-6 py-1"><span>500</span><span>400</span><span>300</span><span>200</span><span>0</span></div>
                        <div className="flex-1 relative" style={{ height: '120px' }}><SalesLineChart data={SALES_DATA} /></div>
                        <div className="flex flex-col justify-between text-[10px] text-[var(--brown-mid)] text-left w-8 py-1"><span>25k</span><span>15k</span><span>10k</span><span>5k</span><span>0k</span></div>
                      </div>
                      <div className="flex justify-between mt-2 pl-9 pr-8">
                        {SALES_DATA.map(d => <span key={d.day} className="text-[10px] text-[var(--text-light)]">{d.day.replace('May ', '')}</span>)}
                      </div>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8D5BC] shadow-sm p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">Revenue Breakdown</h2>
                        <RangeSelect value={revenueRange} onChange={setRevenueRange} options={['This Month', 'Last Month', 'This Year']} />
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="relative inline-flex items-center justify-center mb-4">
                          <DonutChart segments={REVENUE_BREAKDOWN} size={140} thickness={26} />
                          <div className="absolute text-center pointer-events-none">
                            <p className="text-[10px] text-[var(--text-light)] font-medium">Total Revenue</p>
                            <p className="text-sm font-black text-[var(--text-dark)] leading-tight">₹12,45,680</p>
                          </div>
                        </div>
                        <div className="w-full space-y-2">
                          {REVENUE_BREAKDOWN.map((seg, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                                <span className="text-xs text-[var(--text-muted)]">{seg.label}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-[var(--text-dark)]">₹{(seg.value / 100000).toFixed(2)}L</span>
                                <span className="text-[10px] text-[var(--text-light)] ml-1.5">({seg.pct}%)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Top Products + Top Vendors ── */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl border border-[#E8D5BC] shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between px-8 py-6 border-b border-[#FAF7F2]">
                        <h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">Top Performing Products</h2>
                        <button onClick={() => setActiveTab('products')} className="text-xs font-semibold text-[#8C7B6E] hover:text-[#5A3825] transition-colors">View All →</button>
                      </div>
                      <div className="divide-y divide-gray-50">
                        <div className="grid grid-cols-12 px-5 py-2 bg-[var(--bg-main)]"><span className="col-span-6 text-[10px] font-bold text-[var(--text-light)] uppercase tracking-wider">Product</span><span className="col-span-3 text-[10px] font-bold text-[var(--text-light)] uppercase tracking-wider text-center">Orders</span><span className="col-span-3 text-[10px] font-bold text-[var(--text-light)] uppercase tracking-wider text-right">Revenue</span></div>
                        {TOP_PRODUCTS.map((p, i) => (
                          <div key={i} className="grid grid-cols-12 items-center px-5 py-3 hover:bg-[var(--bg-main)] transition-colors">
                            <div className="col-span-6 flex items-center gap-3"><img src={p.img} alt={p.name} className="w-9 h-9 rounded-lg object-cover border border-[var(--border)] mix-blend-multiply" /><div><p className="text-xs font-bold text-[var(--text-dark)] truncate max-w-[120px]">{p.name}</p><p className="text-[10px] text-[var(--text-light)]">{p.sku}</p></div></div>
                            <div className="col-span-3 text-center"><span className="text-xs font-bold text-[var(--text-dark)]">{p.orders}</span></div>
                            <div className="col-span-3 text-right"><span className="text-xs font-bold text-[var(--brown-mid)]">{p.revenue}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-[#E8D5BC] shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between px-8 py-6 border-b border-[#FAF7F2]">
                        <h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">Top Performing Vendors</h2>
                        <button onClick={() => setActiveTab('vendors')} className="text-xs font-semibold text-[#8C7B6E] hover:text-[#5A3825] transition-colors">View All →</button>
                      </div>
                      <div className="divide-y divide-gray-50">
                        <div className="grid grid-cols-12 px-5 py-2 bg-[var(--bg-main)]"><span className="col-span-6 text-[10px] font-bold text-[var(--text-light)] uppercase tracking-wider">Vendor</span><span className="col-span-3 text-[10px] font-bold text-[var(--text-light)] uppercase tracking-wider text-center">Orders</span><span className="col-span-3 text-[10px] font-bold text-[var(--text-light)] uppercase tracking-wider text-right">Revenue</span></div>
                        {TOP_VENDORS.map((v, i) => (
                          <div key={i} className="grid grid-cols-12 items-center px-5 py-3 hover:bg-[var(--bg-main)] transition-colors">
                            <div className="col-span-6 flex items-center gap-3"><div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm" style={{ background: v.color }}>{v.avatar}</div><p className="text-xs font-bold text-[var(--text-dark)] truncate max-w-[120px]">{v.name}</p></div>
                            <div className="col-span-3 text-center"><span className="text-xs font-bold text-[var(--text-dark)]">{v.orders}</span></div>
                            <div className="col-span-3 text-right"><span className="text-xs font-bold text-[var(--brown-mid)]">{v.revenue}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Alerts & Insights ── */}
                  <div className="bg-white rounded-2xl border border-[#E8D5BC] shadow-sm p-8">
                    <h2 className="text-[10px] font-bold text-[#A87C51] mb-6 uppercase tracking-widest">Alerts & Insights</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {ALERTS.map((a, i) => (
                        <div key={i} className={`${a.color} border rounded-xl p-4 flex flex-col gap-2`}>
                          <div className={`${a.iconBg} w-9 h-9 rounded-lg flex items-center justify-center text-lg`}>{a.icon}</div>
                          <div><p className={`text-sm font-bold ${a.textColor}`}>{a.label}</p><p className="text-xs text-[var(--text-muted)] mt-0.5">{a.sub}</p></div>
                          <button className={`text-xs font-semibold ${a.textColor} mt-auto hover:underline text-left`}>View Details →</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── VENDORS TAB ── */}
              {activeTab === 'vendors' && (
                <div className="animate-fade-in flex flex-col gap-8">
                  <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5BC] overflow-hidden">
                    <div className="px-8 py-6 border-b border-[#FAF7F2] bg-white flex items-center justify-between">
                      <h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">Pending Vendor Applications</h2>
                      {pendingVendorsList.length > 0 && <span className="bg-[#FAF7F2] text-[#A87C51] px-2.5 py-1 rounded-full text-[10px] font-black border border-[#E8D5BC]">{pendingVendorsList.length} New</span>}
                    </div>
                    {pendingVendorsList.length === 0 ? (
                      <div className="p-16 text-center bg-[var(--bg-main)]/20">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-2xl">🤝</div>
                        <p className="text-[var(--text-muted)] font-bold text-sm tracking-wide">No pending vendor applications</p>
                        <p className="text-[var(--text-light)] text-xs mt-1">Check back later for new registration requests.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left whitespace-nowrap">
                          <thead className="bg-[var(--bg-main)] text-[var(--text-light)] text-xs uppercase tracking-wider border-b border-[var(--border)]">
                            <tr>
                              <th className="px-6 py-4 font-bold">Shop Details</th>
                              <th className="px-6 py-4 font-bold">Contact Info</th>
                              <th className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {pendingVendorsList.map(v => (
                              <tr key={v.id} className="hover:bg-[var(--bg-main)] transition-colors duration-150">
                                <td className="px-6 py-4"><p className="font-bold text-[var(--text-dark)] text-base">{v.shop_name}</p><p className="text-sm text-[var(--text-muted)] line-clamp-1 mt-0.5">{v.address}</p></td>
                                <td className="px-6 py-4"><p className="text-sm text-[var(--text-dark)] font-medium">{v.email}</p><p className="text-sm text-[var(--text-muted)] mt-1">{v.phone}</p></td>
                                <td className="px-6 py-4 flex justify-end gap-3 items-center h-full">
                                  <button onClick={() => handleAction('vendor', v.id, 'reject')} className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-all duration-200 active:scale-95 hover:shadow-sm">Reject</button>
                                  <button onClick={() => handleAction('vendor', v.id, 'approve')} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-white bg-[#5A3825] hover:bg-[#432A1C] rounded-xl transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg">Approve</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5BC] overflow-hidden">
                    <div className="px-8 py-6 border-b border-[#FAF7F2] bg-white">
                      <h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">Vendors Directory</h2>
                    </div>
                    {directoryVendorsList.length === 0 ? (
                      <div className="p-16 text-center bg-[var(--bg-main)]/20">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-2xl">🏪</div>
                        <p className="text-[var(--text-muted)] font-bold text-sm tracking-wide">No vendors in directory</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left whitespace-nowrap">
                          <thead className="bg-[var(--bg-main)] text-[var(--text-light)] text-xs uppercase tracking-wider border-b border-[var(--border)]">
                            <tr>
                              <th className="px-6 py-4 font-bold">Shop Details</th>
                              <th className="px-6 py-4 font-bold">Contact Info</th>
                              <th className="px-6 py-4 font-bold text-center">Status</th>
                              <th className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {directoryVendorsList.map(v => {
                              const isActive = v.is_active !== false; // FAILSAFE: Treat undefined as active
                              return (
                                <tr key={v.id} className="hover:bg-[var(--bg-main)] transition-colors duration-150">
                                  <td className="px-6 py-4"><p className="font-bold text-[var(--text-dark)] text-base">{v.shop_name}</p><p className="text-sm text-[var(--text-muted)] line-clamp-1 mt-0.5">{v.address}</p></td>
                                  <td className="px-6 py-4"><p className="text-sm text-[var(--text-dark)] font-medium">{v.email}</p><p className="text-sm text-[var(--text-muted)] mt-1">{v.phone}</p></td>
                                  <td className="px-6 py-4 text-center">{isActive ? <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wider rounded-md">Approved</span> : <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider rounded-md">Suspended</span>}</td>
                                  <td className="px-6 py-4 flex justify-end gap-3 items-center h-full">
                                    {isActive ? (
                                      <button onClick={() => handleAction('vendor', v.id, 'reject')} className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition-all duration-200 active:scale-95 hover:shadow-sm">Suspend</button>
                                    ) : (
                                      <button onClick={() => handleAction('vendor', v.id, 'approve')} className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#8C7B6E] border border-[#E8D5BC] hover:bg-[#FAF7F2] rounded-xl transition-all duration-200 active:scale-95 hover:shadow-sm">Restore</button>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── PRODUCTS TAB ── */}
              {activeTab === 'products' && (
                <div className="animate-fade-in flex flex-col gap-8">
                  <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5BC] overflow-hidden">
                    <div className="px-8 py-6 border-b border-[#FAF7F2] bg-white flex items-center justify-between">
                      <h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">Pending Product Reviews</h2>
                      {pendingProductsList.length > 0 && <span className="bg-[#FAF7F2] text-[#A87C51] px-2.5 py-1 rounded-full text-[10px] font-black border border-[#E8D5BC]">{pendingProductsList.length} New</span>}
                    </div>
                    {pendingProductsList.length === 0 ? (
                      <div className="p-16 text-center bg-[var(--bg-main)]/20">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-2xl">📦</div>
                        <p className="text-[var(--text-muted)] font-bold text-sm tracking-wide">No products awaiting review</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left whitespace-nowrap">
                          <thead className="bg-[var(--bg-main)] text-[var(--text-light)] text-xs uppercase tracking-wider border-b border-[var(--border)]">
                            <tr>
                              <th className="px-6 py-4 font-bold">Product</th>
                              <th className="px-6 py-4 font-bold">Vendor</th>
                              <th className="px-6 py-4 font-bold">Price</th>
                              <th className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {pendingProductsList.map(p => (
                              <tr key={p.id} className="hover:bg-[var(--bg-main)] transition-colors duration-150">
                                <td className="px-6 py-4 flex items-center gap-4"><img src={p.image} className="w-12 h-12 object-contain bg-[var(--bg-main)] rounded-lg border border-[var(--border)]" alt={p.name} /><span className="font-bold text-[var(--text-dark)]">{p.name}</span></td>
                                <td className="px-6 py-4"><span className="text-xs font-bold text-[var(--brown-mid)] uppercase tracking-widest bg-[var(--brown-mid)]/10 px-2 py-1 rounded-md">{p.vendor_shop}</span></td>
                                <td className="px-6 py-4 font-bold text-[var(--text-dark)]">₹{parseFloat(p.price).toLocaleString()}</td>
                                <td className="px-6 py-4"><div className="flex justify-end gap-3">
                                  <button onClick={() => handleAction('product', p.id, 'reject')} className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-all duration-200 active:scale-95 hover:shadow-sm">Reject</button>
                                  <button onClick={() => handleAction('product', p.id, 'approve')} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-white bg-[#5A3825] hover:bg-[#432A1C] rounded-xl transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg">Approve</button>
                                </div></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5BC] overflow-hidden">
                    <div className="px-8 py-6 border-b border-[#FAF7F2] bg-white">
                      <h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">Global Product Directory</h2>
                    </div>
                    {directoryProductsList.length === 0 ? (
                      <div className="p-16 text-center bg-[var(--bg-main)]/20">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-2xl">🗃️</div>
                        <p className="text-[var(--text-muted)] font-bold text-sm tracking-wide">No products in directory</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left whitespace-nowrap">
                          <thead className="bg-[var(--bg-main)] text-[var(--text-light)] text-xs uppercase tracking-wider border-b border-[var(--border)]">
                            <tr>
                              <th className="px-6 py-4 font-bold">Product</th>
                              <th className="px-6 py-4 font-bold">Vendor</th>
                              <th className="px-6 py-4 font-bold">Price</th>
                              <th className="px-6 py-4 font-bold text-center">Status</th>
                              <th className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {directoryProductsList.map(p => {
                              const pIsActive = p.is_active !== false; // FAILSAFE: Treat undefined as active
                              return (
                                <tr key={p.id} className="hover:bg-[var(--bg-main)] transition-colors duration-150">
                                  <td className="px-6 py-4 flex items-center gap-4"><img src={p.image} className="w-12 h-12 object-contain bg-[var(--bg-main)] rounded-lg border border-[var(--border)]" alt={p.name} /><div><span className="font-bold text-[var(--text-dark)] block">{p.name}</span><span className="text-xs text-[var(--text-muted)]">₹{parseFloat(p.price).toLocaleString()}</span></div></td>
                                  <td className="px-6 py-4"><span className="text-xs font-bold text-[var(--brown-mid)] uppercase tracking-widest bg-[var(--brown-mid)]/10 px-2 py-1 rounded-md">{p.vendor_shop}</span></td>
                                  <td className="px-6 py-4 font-bold text-[var(--text-dark)]">₹{parseFloat(p.price).toLocaleString()}</td>
                                  <td className="px-6 py-4 text-center">{pIsActive ? <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wider rounded-md">Active</span> : <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider rounded-md">Archived</span>}</td>
                                  <td className="px-6 py-4"><div className="flex justify-end gap-3">
                                    <button onClick={() => handleAction('product', p.id, pIsActive ? 'reject' : 'approve')} className={`px-5 py-2 text-xs font-bold uppercase rounded-lg transition-colors border ${pIsActive ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--bg-secondary)]'}`}>{pIsActive ? 'Archive' : 'Restore'}</button>
                                  </div></td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── USERS TAB ── */}
              {activeTab === 'users' && (
                <div className="animate-fade-in bg-white rounded-2xl shadow-sm border border-[#E8D5BC] overflow-hidden">
                  <div className="px-8 py-6 border-b border-[#FAF7F2] bg-white">
                    <h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">Global Users Directory</h2>
                  </div>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead className="bg-[var(--bg-main)] text-[var(--text-light)] text-xs uppercase tracking-wider border-b border-[var(--border)]">
                        <tr>
                          <th className="px-6 py-4 font-bold">User ID</th>
                          <th className="px-6 py-4 font-bold">Name</th>
                          <th className="px-6 py-4 font-bold">Email</th>
                          <th className="px-6 py-4 font-bold">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-[var(--bg-main)] transition-colors duration-150">
                            <td className="px-6 py-4 font-medium text-[var(--text-light)]">#{u.id}</td>
                            <td className="px-6 py-4 font-bold text-[var(--text-dark)]">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[var(--bg-main)] text-[var(--brown-mid)] flex items-center justify-center font-bold text-xs border border-[var(--border)]">
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                {u.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[var(--text-muted)]">{u.email}</td>
                            <td className="px-6 py-4">
                              <span className="bg-[#FAF7F2] text-[#A87C51] border border-[#E8D5BC] px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">{u.role}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── SUBSCRIPTIONS TAB ── */}
              {activeTab === 'subscriptions' && (
                <div className="animate-fade-in flex flex-col gap-8">

                  {/* Create / Edit Plan Form */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E8D5BC]">
                    <h2 className="text-[10px] font-bold text-[#A87C51] mb-8 uppercase tracking-widest">{editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}</h2>
                    <form onSubmit={handleSavePlan} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-[#A87C51] uppercase tracking-wider mb-2 ml-1">Plan Name</label>
                        <input type="text" required value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors" placeholder="e.g. Pro Tier" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Price (₹)</label>
                        <input type="number" required value={newPlan.price} onChange={e => setNewPlan({ ...newPlan, price: e.target.value })} className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors" placeholder="e.g. 999" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Product Limit</label>
                        <input type="number" required value={newPlan.product_limit} onChange={e => setNewPlan({ ...newPlan, product_limit: e.target.value })} className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors" placeholder="e.g. 100" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Features (Comma Separated)</label>
                        <input type="text" value={newPlan.features} onChange={e => setNewPlan({ ...newPlan, features: e.target.value })} className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors" placeholder="Priority support, Analytics" />
                      </div>
                      <div className="md:col-span-2 flex gap-3 mt-2">
                        <button type="submit" className="flex-1 bg-[#5A3825] text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#432A1C] shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98]">
                          {editingPlan ? "Save Changes" : "Create Plan"}
                        </button>
                        {editingPlan && (
                          <button type="button" onClick={() => { setEditingPlan(null); setNewPlan({ name: '', price: '', product_limit: '', duration_days: 30, features: '' }); }} className="px-8 py-4 border border-[#E8D5BC] text-[#8C7B6E] rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#FAF7F2] transition-all duration-300 active:scale-[0.98]">
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Live Plans Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {subscriptionPlans.map(plan => (
                      <div key={plan.id} className="bg-white border border-[#E8D5BC] rounded-2xl p-8 shadow-sm hover:shadow-md transition-all relative">
                        <h4 className="text-xl font-bold text-[var(--text-dark)]">{plan.name}</h4>
                        <p className="text-3xl font-bold text-[var(--brown-mid)] mt-2">₹{parseFloat(plan.price).toLocaleString()}<span className="text-sm text-[var(--text-muted)] font-normal">/mo</span></p>
                        <ul className="mt-4 space-y-2 text-sm text-[var(--text-muted)] mb-6 border-t border-gray-50 pt-4">
                          <li><strong>Limit:</strong> {plan.product_limit} Products</li>
                          {plan.features && plan.features.split(',').map((f, idx) => <li key={idx}>• {f.trim()}</li>)}
                        </ul>
                        <div className="flex gap-2 absolute top-4 right-4">
                          <button onClick={() => handleEditPlan(plan)} className="text-[var(--brown-mid)] hover:text-[var(--coffee-light)] text-xs font-bold uppercase bg-[var(--bg-main)] px-3 py-1.5 rounded-md border border-[var(--border)]">Edit</button>
                          <button onClick={() => handleDeletePlan(plan.id)} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase bg-red-50 px-3 py-1.5 rounded-md border border-red-100">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vendor Subscriptions Matrix Table */}
                  <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden mt-4">
                    <div className="px-6 py-5 border-b border-[var(--border)] bg-[var(--bg-card)]">
                      <h2 className="text-lg font-bold text-[var(--text-dark)]">Vendor Subscriptions Matrix</h2>
                    </div>
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-[var(--bg-main)] text-[var(--text-light)] text-xs uppercase tracking-wider border-b border-[var(--border)]">
                          <tr>
                            <th className="px-6 py-4 font-bold">Vendor ID</th>
                            <th className="px-6 py-4 font-bold">Current Plan</th>
                            <th className="px-6 py-4 font-bold">Start Date</th>
                            <th className="px-6 py-4 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {vendorSubscriptions.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-10 text-[var(--text-muted)] bg-[var(--bg-main)]/30">No active subscriptions found.</td></tr>
                          ) : (
                            vendorSubscriptions.map(sub => (
                              <tr key={sub.id} className="hover:bg-[var(--bg-main)] transition-colors duration-150">
                                <td className="px-6 py-4 font-bold text-[var(--text-dark)]">Vendor #{sub.vendor}</td>
                                <td className="px-6 py-4 font-bold text-[var(--brown-mid)]">{sub.plan_details?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 text-[var(--text-muted)]">{new Date(sub.start_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                  {sub.is_active ?
                                    <span className="bg-green-50 text-green-600 border border-green-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">Active</span> :
                                    <span className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">Expired</span>
                                  }
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── CATEGORIES TAB ── */}
              {activeTab === 'categories' && (
                <div className="animate-fade-in flex flex-col gap-8">
                  {pendingCatReqs.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5BC] overflow-hidden">
                      <div className="px-8 py-6 border-b border-[#FAF7F2] bg-white"><h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">Pending Category Requests</h2></div>
                      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 bg-[var(--bg-main)]/30">
                        {pendingCatReqs.map(req => (
                          <div key={req.id} className="bg-white border border-[#E8D5BC] rounded-2xl p-5 hover:border-[#E8D5BC]/40 transition-colors">
                            <div className="w-full h-36 bg-gray-50 flex items-center justify-center rounded-xl mb-5 shadow-inner text-indigo-600">
                              <CategoryIcon name={req.icon} iconType={req.icon_type} size={64} />
                            </div>
                            <p className="text-[10px] font-black text-[#8C7B6E] uppercase tracking-widest mb-1 truncate">Req by: {req.vendor_shop}</p>
                            <h3 className="font-bold text-[#5A3825] text-xl truncate mb-5">{req.name}</h3>

                            <div className="grid grid-cols-2 gap-3">
                              <button onClick={() => handleCatRequestAction(req.id, 'reject')} className="w-full py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">Reject</button>
                              <button onClick={() => handleCatRequestAction(req.id, 'approve')} className="w-full py-2.5 text-xs font-bold text-white bg-[var(--coffee-light)] hover:bg-[var(--coffee-brown)] rounded-lg transition-colors shadow-md">Approve</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-1">
                      <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E8D5BC]">
                        <div className="flex items-center justify-between mb-8">
                          <h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">{editingCategoryId ? 'Edit Category' : 'Create Category'}</h2>
                          {editingCategoryId && (
                            <button onClick={handleCancelEdit} className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest flex items-center gap-1 transition-colors">
                              <X size={12} /> Cancel
                            </button>
                          )}
                        </div>
                        <form onSubmit={handleCreateCategory} className="space-y-5">
                          <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Category Name</label>
                            <input type="text" placeholder="e.g., Sweets" required value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Category Icon</label>
                            <button
                              type="button"
                              onClick={() => setIconPickerOpen(true)}
                              className="w-full flex items-center gap-4 p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl hover:border-[var(--brown-mid)] hover:bg-[#F5EFE7] active:bg-[#EDE4D3] transition-all duration-200 text-left cursor-pointer group"
                            >
                              <div className="w-10 h-10 rounded-lg bg-white border border-border/40 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                <CategoryIcon name={newCatIcon} iconType={newCatIconType} size={22} className="text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{newCatIcon || 'Select an icon'}</p>
                                <p className="text-[10px] text-muted-foreground">Click to open icon picker</p>
                              </div>
                              <svg className="w-4 h-4 text-muted-foreground group-hover:text-[var(--brown-mid)] transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                            <IconPickerModal
                              open={iconPickerOpen}
                              onOpenChange={setIconPickerOpen}
                              value={newCatIcon}
                              iconType={newCatIconType}
                              onChange={(v, t) => { setNewCatIcon(v); setNewCatIconType(t); }}
                            />
                          </div>

                          <button type="submit" className="w-full bg-[#5A3825] text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#432A1C] shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] mt-2">
                            {editingCategoryId ? 'Update Category' : 'Publish Category'}
                          </button>
                        </form>
                      </div>
                    </div>
                    <div className="xl:col-span-2">
                      <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5BC] overflow-hidden h-full flex flex-col">
                        <div className="px-8 py-6 border-b border-[#FAF7F2] shrink-0"><h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">Live Categories</h2></div>
                        <div className="divide-y divide-gray-50 flex-1 overflow-y-auto">
                          {categories.length === 0
                            ? <p className="p-10 text-center text-[var(--text-muted)] bg-[var(--bg-main)]/30">No categories active.</p>
                            : categories.filter(Boolean).map(cat => (
                              <div key={cat.id} className="p-4 px-6 flex justify-between items-center hover:bg-[var(--bg-main)] transition-colors">
                                <div className="flex items-center gap-5">
                                  <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
                                    <CategoryIcon name={cat.icon} iconType={cat.icon_type} size={28} />
                                  </div>
                                  <span className="font-bold text-[var(--text-dark)] text-lg">{cat.name}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button onClick={() => handleEditCategory(cat)} className="text-[var(--brown-mid)] hover:bg-[var(--bg-main)] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-transparent hover:border-[var(--border)] transition-all duration-200 active:scale-95 flex items-center gap-1.5">
                                    <Pencil size={12} /> Edit
                                  </button>
                                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-transparent hover:border-red-100 transition-all duration-200 active:scale-95">Delete</button>
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── NEWS TAB ── */}
              {activeTab === 'news' && (
                <div className="animate-fade-in flex flex-col gap-8">
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-1">
                      <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E8D5BC]">
                        <h2 className="text-[10px] font-bold text-[#A87C51] mb-8 uppercase tracking-widest">Create News</h2>
                        <form onSubmit={handleCreateNews} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">News Title</label>
                            <input type="text" required value={newNews.title} onChange={e => setNewNews({ ...newNews, title: e.target.value })} className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Start Date</label>
                              <DateTimePicker type="date" value={newNews.start_date} onChange={(val) => setNewNews({ ...newNews, start_date: val })} />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">End Date</label>
                              <DateTimePicker type="date" value={newNews.end_date} onChange={(val) => setNewNews({ ...newNews, end_date: val })} />
                            </div>
                          </div>
                          <button type="submit" className="w-full bg-[#5A3825] text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#432A1C] shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] mt-4">Broadcast News</button>
                        </form>
                      </div>
                    </div>
                    <div className="xl:col-span-2">
                      <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5BC] overflow-hidden h-full flex flex-col">
                        <div className="px-8 py-6 border-b border-[#FAF7F2] bg-white shrink-0"><h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">Live News</h2></div>
                        <div className="divide-y divide-gray-50 flex-1 overflow-y-auto">
                          {news.length === 0
                            ? <p className="p-10 text-center text-[var(--text-muted)] bg-[var(--bg-main)]/30">No news added.</p>
                            : news.map(n => (
                              <div key={n.id} className="p-4 px-6 flex justify-between items-center hover:bg-[var(--bg-main)] transition-colors">
                                <div className="flex items-center gap-5">
                                  <div>
                                    <span className="font-bold text-[var(--text-dark)] text-base block">{n.title}</span>
                                    <span className="text-xs font-medium text-[var(--brown-mid)] bg-[var(--brown-mid)]/10 px-2 py-0.5 rounded mt-1 inline-block">{n.start_date} → {n.end_date}</span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleToggleNews(n.id, !n.is_active)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-200 active:scale-95 ${n.is_active ? 'text-orange-500 border-orange-200 hover:bg-orange-50' : 'text-green-500 border-green-200 hover:bg-green-50'}`}>
                                    {n.is_active ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <button onClick={() => handleDeleteNews(n.id)} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-transparent hover:border-red-100 transition-all duration-200 active:scale-95">Delete</button>
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── HEADER BANNER TAB ── */}
              {activeTab === 'headerBanners' && (
                <div className="animate-fade-in flex flex-col gap-8">
                  <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5BC] overflow-hidden">
                    <div className="px-8 py-6 border-b border-[#FAF7F2] bg-white shrink-0">
                      <h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">Header Banner</h2>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Manage the main hero banner displayed at the top of the homepage.</p>
                    </div>
                    <div className="p-6 flex flex-col gap-6 bg-[var(--bg-main)]/30">
                      {/* + Upload area */}
                      <form onSubmit={handleCreateHeroBanner} className="flex flex-col gap-3">
                        <label
                          htmlFor="heroBannerInput"
                          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#D7C8B4] bg-[#FAF7F2] hover:bg-[#F5F0E8] hover:border-[#A87C51] transition-colors cursor-pointer py-6"
                        >
                          <svg className="w-6 h-6 text-[#A87C51]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                          <span className="text-xs font-bold text-[#A87C51] uppercase tracking-wider">Add Header Banner</span>
                          <span className="text-[10px] text-[var(--text-light)]">Click to choose image (wide banner recommended)</span>
                        </label>
                        <input id="heroBannerInput" type="file" accept="image/*" className="hidden" onChange={e => {
                          const file = e.target.files?.[0] || null;
                          if (file && !isValidImageFile(file)) {
                            toast.error("Only image files are allowed.");
                            return;
                          }
                          setHeroBannerImageFile(file);
                        }} />

                        {heroBannerImageFile && (
                          <div className="flex items-center gap-3 animate-fade-in">
                            <button type="submit" className="bg-[#5A3825] text-white px-5 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-[#432A1C] transition-colors shadow-sm">Upload</button>
                            <button type="button" onClick={() => setHeroBannerImageFile(null)} className="text-[var(--text-muted)] hover:text-red-500 text-xs font-bold uppercase tracking-wider">Cancel</button>
                          </div>
                        )}
                      </form>

                      {/* Hero banner preview */}
                      <div className="flex flex-col gap-4">
                        {heroBanners.length === 0 ? (
                          <div className="py-8 text-center border-2 border-dashed border-[var(--border)] rounded-xl bg-[var(--bg-card)]">
                            <p className="text-[var(--coffee-light)] font-light text-sm">No custom header banner uploaded. Default design is live.</p>
                          </div>
                        ) : (
                          heroBanners.map(hero => (
                            <div key={hero.id} className="relative group rounded-xl overflow-hidden shadow-sm border border-[var(--border)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-[var(--bg-card)]">
                              <img src={hero.image} alt="Header banner" className="w-full h-48 object-cover" />
                              <div className="absolute inset-0 bg-[#2C1E16]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                                <button onClick={() => handleDeleteHeroBanner(hero.id)} className="bg-red-500 text-white px-8 py-2.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-red-600 shadow-xl active:scale-95">Delete Header Banner</button>
                              </div>
                              <div className="absolute top-3 left-3 bg-[var(--bg-card)]/95 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-green-600 shadow-sm">Active</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── MARKETING BANNER TAB ── */}
              {activeTab === 'marketingBanners' && (
                <div className="animate-fade-in flex flex-col gap-8">
                  {/* Premium Sub-tabs navigation */}
                  <div className="flex gap-4 border-b border-[#E8D5BC] pb-4 shrink-0">
                    <button
                      onClick={() => setNewBannerPosition('left')}
                      className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all duration-300 ${newBannerPosition === 'left'
                          ? 'bg-[#5A3825] text-white shadow-md'
                          : 'border border-[#E8D5BC] hover:bg-[#FAF7F2] text-[#8C7B6E]'
                        }`}
                    >
                      Image Banners (Left Side)
                    </button>
                    <button
                      onClick={() => setNewBannerPosition('right')}
                      className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all duration-300 ${newBannerPosition === 'right'
                          ? 'bg-[#5A3825] text-white shadow-md'
                          : 'border border-[#E8D5BC] hover:bg-[#FAF7F2] text-[#8C7B6E]'
                        }`}
                    >
                      YouTube Videos (Right Side)
                    </button>
                  </div>

                  {/* Upload Form */}
                  <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5BC] overflow-hidden">
                    <div className="px-8 py-6 border-b border-[#FAF7F2] bg-white shrink-0">
                      <h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">
                        Add {newBannerPosition === 'left' ? 'Image Banner' : 'YouTube Video'}
                      </h2>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Upload a promotional {newBannerPosition === 'left' ? 'banner image' : 'YouTube video link'} with a scheduled time period.
                      </p>
                    </div>
                    <div className="p-6 bg-[var(--bg-main)]/30">
                      <form onSubmit={handleCreateBanner} className="space-y-5">
                        {/* Image / Video Upload */}
                        <div className="mb-6">
                          {newBannerPosition === 'left' ? (
                            <>
                              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Upload Desktop Image (1920x800)</label>
                              <input key="banner-image-input" type="file" accept="image/*" id="bannerImageInput"
                                className="w-full text-sm file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-[#5A3825] file:text-white hover:file:bg-[#432A1C] border border-[var(--border)] rounded-xl bg-white p-1.5 transition-all"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file && !isValidImageFile(file)) return toast.error("Only image files are allowed.");
                                  setBannerImageFile(file);
                                }} />
                              
                              <div className="mt-4">
                                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Redirect Link URL (Optional)</label>
                                <input type="url" value={newBannerLinkUrl} onChange={e => setNewBannerLinkUrl(e.target.value)}
                                  placeholder="https://example.com/product/123"
                                  className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors text-sm"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">YouTube Video URL</label>
                              <input key="banner-youtube-input" type="url" value={newBannerYoutubeUrl} onChange={e => setNewBannerYoutubeUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors text-sm"
                              />
                            </>
                          )}
                        </div>

                        {/* Time Period */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Start Date & Time</label>
                            <DateTimePicker
                              type="datetime-local"
                              value={newBannerStartDatetime}
                              onChange={(val) => setNewBannerStartDatetime(val)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">End Date & Time</label>
                            <DateTimePicker
                              type="datetime-local"
                              value={newBannerEndDatetime}
                              onChange={(val) => setNewBannerEndDatetime(val)}
                            />
                          </div>
                        </div>

                        {/* Order */}
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Display Order</label>
                            <input
                              type="number"
                              min={0}
                              value={newBannerOrder}
                              onChange={e => setNewBannerOrder(Number(e.target.value))}
                              className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors text-sm"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3 pt-2">
                          <button type="submit" className="flex-1 bg-[#5A3825] text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#432A1C] shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98]">
                            Upload {newBannerPosition === 'left' ? 'Marketing Banner' : 'YouTube Video'}
                          </button>
                          {(bannerImageFile || newBannerYoutubeUrl || newBannerLinkUrl) && (
                            <button type="button" onClick={() => { setBannerImageFile(null); setNewBannerYoutubeUrl(''); setNewBannerLinkUrl(''); setNewBannerStartDatetime(''); setNewBannerEndDatetime(''); const fi = document.getElementById('bannerImageInput') as HTMLInputElement; if (fi) fi.value = ''; }} className="px-8 py-4 border border-[#E8D5BC] text-[#8C7B6E] rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#FAF7F2] transition-all duration-300 active:scale-[0.98]">
                              Clear
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* BANNERS LIST */}
                  <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5BC] overflow-hidden">
                    <div className="px-8 py-6 border-b border-[#FAF7F2] bg-white shrink-0">
                      <h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">
                        {newBannerPosition === 'left' ? 'Left Side Banners' : 'Right Side Banners'}
                      </h2>
                    </div>
                    <div className="p-6 bg-[var(--bg-main)]/30">
                      {banners.filter(b => newBannerPosition === 'left' ? (b.position === 'left' || !b.position) : b.position === 'right').length === 0 ? (
                        <div className="py-12 text-center border-2 border-dashed border-[var(--border)] rounded-xl bg-[var(--bg-card)]">
                          <p className="text-[var(--coffee-light)] font-light text-sm">
                            No {newBannerPosition === 'left' ? 'left side' : 'right side'} banners yet.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {banners.filter(b => newBannerPosition === 'left' ? (b.position === 'left' || !b.position) : b.position === 'right').map(banner => (
                            <div key={banner.id} className="relative group rounded-xl overflow-hidden shadow-sm border border-[var(--border)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-[var(--bg-card)]">
                              {banner.youtube_url ? (
                                <div className="w-full h-40 bg-black flex items-center justify-center text-white p-4">
                                  <span className="text-xs text-center line-clamp-2">YouTube Video: {banner.youtube_url}</span>
                                </div>
                              ) : (
                                <img src={banner.image} alt="Marketing banner" className="w-full h-40 object-cover" />
                              )}
                              <div className="absolute inset-0 bg-[#2C1E16]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                                <button onClick={() => handleDeleteBanner(banner.id)} className="bg-red-500 text-white px-8 py-2.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-red-600 shadow-xl active:scale-95">Delete</button>
                              </div>
                              <div className="absolute top-3 left-3 bg-[var(--bg-card)]/95 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-green-600 shadow-sm">Active</div>
                              <div className="absolute bottom-3 right-3 bg-[var(--bg-card)]/95 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-[#A87C51] shadow-sm">#{banner.display_order || 0}</div>
                              {banner.title && banner.title.includes('→') && (
                                <div className="absolute bottom-3 left-3 bg-[var(--bg-card)]/95 px-2 py-1 rounded-md text-[10px] font-bold tracking-wider text-[#5A3825] shadow-sm max-w-[70%] truncate">🕐 {banner.title.split('|').pop()?.trim()}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ORDERS TAB ── */}
              {activeTab === 'orders' && (
                <div className="animate-fade-in bg-white rounded-2xl shadow-sm border border-[#E8D5BC] overflow-hidden">
                  <div className="px-8 py-6 border-b border-[#FAF7F2] bg-white">
                    <h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">Global Ledger</h2>
                  </div>
                  {orders.length === 0
                    ? <div className="p-16 text-center text-[var(--text-muted)] font-medium bg-[var(--bg-main)]/30">No orders recorded in ledger.</div>
                    : (
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left whitespace-nowrap">
                          <thead className="bg-[var(--bg-main)] text-[var(--text-light)] text-xs uppercase tracking-wider border-b border-[var(--border)]">
                            <tr>
                              <th className="px-6 py-4 font-bold">Order ID</th>
                              <th className="px-6 py-4 font-bold">Customer</th>
                              <th className="px-6 py-4 font-bold">Total Val</th>
                              <th className="px-6 py-4 font-bold">Pay Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {orders.map(order => (
                              <tr key={order.id} className="hover:bg-[var(--bg-main)] transition-colors duration-150">
                                <td className="px-6 py-4 font-bold text-[var(--text-light)]">#{order.id}</td>
                                <td className="px-6 py-4">
                                  <p className="font-bold text-[var(--text-dark)] text-base">{order.buyer_name}</p>
                                  <p className="text-sm text-[var(--text-muted)]">{order.buyer_email}</p>
                                </td>
                                <td className="px-6 py-4 font-black text-[var(--brown-mid)] text-lg">₹{parseFloat(order.total_price).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${order.payment_status === 'paid' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-yellow-50 text-yellow-600 border border-yellow-100'}`}>
                                    {order.payment_status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                </div>
              )}

              {/* ── REVIEWS TAB ── */}
              {activeTab === 'reviews' && (
                <div className="animate-fade-in flex flex-col gap-8">
                  {/* Premium Sub-tabs navigation */}
                  <div className="flex gap-4 border-b border-[#E8D5BC] pb-4 shrink-0">
                    <button
                      onClick={() => setActiveReviewSubTab('manual')}
                      className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all duration-300 ${activeReviewSubTab === 'manual'
                          ? 'bg-[#5A3825] text-white shadow-md'
                          : 'border border-[#E8D5BC] hover:bg-[#FAF7F2] text-[#8C7B6E]'
                        }`}
                    >
                      Manual Reviews
                    </button>
                    <button
                      onClick={() => setActiveReviewSubTab('platform')}
                      className={`relative px-6 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all duration-300 ${activeReviewSubTab === 'platform'
                          ? 'bg-[#5A3825] text-white shadow-md'
                          : 'border border-[#E8D5BC] hover:bg-[#FAF7F2] text-[#8C7B6E]'
                        }`}
                    >
                      Buyer Platform Reviews
                      {pendingPlatformReviewsCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-white animate-pulse">
                          {pendingPlatformReviewsCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {activeReviewSubTab === 'manual' ? (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                      {/* Creation/Edit Form */}
                      <div className="xl:col-span-1">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E8D5BC]">
                          <h2 className="text-[10px] font-bold text-[#A87C51] mb-8 uppercase tracking-widest">
                            {editingReview ? 'Edit Manual Review' : 'Create Manual Review'}
                          </h2>
                          <form onSubmit={handleSaveReview} className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Reviewer Name</label>
                              <input
                                type="text"
                                required
                                value={newReview.name}
                                onChange={e => setNewReview({ ...newReview, name: e.target.value })}
                                className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors text-sm text-[var(--text-dark)]"
                                placeholder="e.g. Dishant Mali"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">City / Location</label>
                              <input
                                type="text"
                                required
                                value={newReview.city}
                                onChange={e => setNewReview({ ...newReview, city: e.target.value })}
                                className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors text-sm text-[var(--text-dark)]"
                                placeholder="e.g. Ahmedabad, Gujarat"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Star Rating</label>
                              <select
                                value={newReview.stars}
                                onChange={e => setNewReview({ ...newReview, stars: parseInt(e.target.value) })}
                                className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors text-sm text-[var(--text-dark)] cursor-pointer"
                              >
                                <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                                <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                                <option value="3">⭐⭐⭐ (3 Stars)</option>
                                <option value="2">⭐⭐ (2 Stars)</option>
                                <option value="1">⭐ (1 Star)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Review Content</label>
                              <textarea
                                required
                                rows={4}
                                value={newReview.description}
                                onChange={e => setNewReview({ ...newReview, description: e.target.value })}
                                className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors text-sm text-[var(--text-dark)] resize-none"
                                placeholder="Describe customer's shopping experience..."
                              />
                            </div>

                            <div className="flex items-center gap-3 py-2">
                              <input
                                type="checkbox"
                                id="is_active"
                                checked={newReview.is_active}
                                onChange={e => setNewReview({ ...newReview, is_active: e.target.checked })}
                                className="w-4 h-4 rounded text-[#5A3825] focus:ring-[#5A3825] border-gray-300 cursor-pointer"
                              />
                              <label htmlFor="is_active" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer select-none">
                                Show live on homepage
                              </label>
                            </div>

                            <div className="flex gap-3 pt-2">
                              <button
                                type="submit"
                                className="flex-1 bg-[#5A3825] text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#432A1C] shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
                              >
                                {editingReview ? 'Update Review' : 'Publish Review'}
                              </button>
                              {editingReview && (
                                <button
                                  type="button"
                                  onClick={handleCancelEditReview}
                                  className="px-5 py-4 border border-[#E8D5BC] text-[#8C7B6E] rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#FAF7F2] transition-all duration-300 active:scale-[0.98]"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </form>
                        </div>
                      </div>

                      {/* Manual Reviews List */}
                      <div className="xl:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5BC] overflow-hidden h-full flex flex-col">
                          <div className="px-8 py-6 border-b border-[#FAF7F2] bg-white shrink-0">
                            <h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">Live Testimonials</h2>
                          </div>
                          <div className="divide-y divide-gray-50 flex-1 overflow-y-auto">
                            {manualReviews.length === 0 ? (
                              <p className="p-10 text-center text-[var(--text-muted)] bg-[var(--bg-main)]/30 font-medium">
                                No manual reviews created yet. Falling back to default homepage testimonials.
                              </p>
                            ) : (
                              manualReviews.map(review => (
                                <div key={review.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-[var(--bg-main)] transition-colors">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-3">
                                      <span className="font-bold text-[var(--text-dark)] text-lg">{review.name}</span>
                                      <span className="text-[10px] font-bold text-[#A87C51] bg-[#FAF7F2] border border-[#E8D5BC] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        {review.city}
                                      </span>
                                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md ${review.is_active
                                          ? 'bg-green-50 text-green-600 border border-green-200'
                                          : 'bg-gray-50 text-gray-500 border border-gray-200'
                                        }`}>
                                        {review.is_active ? 'Live' : 'Hidden'}
                                      </span>
                                    </div>
                                    <div className="flex text-yellow-400">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <svg
                                          key={i}
                                          className={`w-4 h-4 ${i < review.stars ? 'fill-current' : 'text-gray-300'}`}
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      ))}
                                    </div>
                                    <p className="text-sm text-[var(--text-muted)] italic font-medium leading-relaxed max-w-2xl">
                                      "{review.description}"
                                    </p>
                                  </div>
                                  <div className="flex gap-2 self-end md:self-auto">
                                    <button
                                      onClick={() => handleEditReview(review)}
                                      className="px-3.5 py-2 border border-[#E8D5BC] hover:bg-[#FAF7F2] text-[#8C7B6E] rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors active:scale-95"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteReview(review.id)}
                                      className="px-3.5 py-2 border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors active:scale-95"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5BC] overflow-hidden flex flex-col w-full">
                      <div className="px-8 py-6 border-b border-[#FAF7F2] bg-white shrink-0 flex justify-between items-center">
                        <h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">Buyer Submitted Platform Reviews</h2>
                        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-main)] px-3 py-1 rounded-full border border-[var(--border)]">
                          Total: {platformReviews.length}
                        </span>
                      </div>
                      <div className="divide-y divide-gray-50 flex-1 overflow-y-auto">
                        {platformReviews.length === 0 ? (
                          <p className="p-12 text-center text-[var(--text-muted)] bg-[var(--bg-main)]/30 font-medium">
                            No buyer platform reviews submitted yet.
                          </p>
                        ) : (
                          platformReviews.map(review => (
                            <div key={review.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-[var(--bg-main)] transition-colors">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="font-bold text-[var(--text-dark)] text-lg">
                                    {review.reviewer_name || "Verified Buyer"}
                                  </span>
                                  {review.created_at && (
                                    <span className="text-[10px] font-bold text-[#A87C51] bg-[#FAF7F2] border border-[#E8D5BC] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md ${review.is_featured
                                      ? 'bg-green-50 text-green-600 border border-green-200'
                                      : 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                                    }`}>
                                    {review.is_featured ? 'Approved & Featured' : 'Pending Approval'}
                                  </span>
                                </div>
                                <div className="flex text-yellow-400">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <svg
                                      key={i}
                                      className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`}
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                                <p className="text-sm text-[var(--text-muted)] italic font-medium leading-relaxed max-w-3xl">
                                  "{review.feedback_text}"
                                </p>
                              </div>
                              <div className="flex gap-2 self-end md:self-auto shrink-0">
                                <button
                                  onClick={() => handleTogglePlatformReviewFeatured(review.id, review.is_featured)}
                                  className={`px-3.5 py-2 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 active:scale-95 ${review.is_featured
                                      ? 'border-[#E8D5BC] hover:bg-[#FAF7F2] text-[#8C7B6E]'
                                      : 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700'
                                    }`}
                                >
                                  {review.is_featured ? 'Unapprove' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => handleDeletePlatformReview(review.id)}
                                  className="px-3.5 py-2 border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors active:scale-95"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── COUPONS TAB ── */}
              {activeTab === 'coupons' && (
                <div className="animate-fade-in flex flex-col gap-8">
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Creation / Edit Form */}
                    <div className="xl:col-span-1">
                      <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E8D5BC]">
                        <div className="flex items-center justify-between mb-8">
                          <h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">
                            {editingCoupon ? 'Edit Platform Coupon' : 'Create Platform Coupon'}
                          </h2>
                          {editingCoupon && (
                            <button
                              type="button"
                              onClick={handleCancelEditCoupon}
                              className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest flex items-center gap-1 transition-colors"
                            >
                              <X size={12} /> Cancel
                            </button>
                          )}
                        </div>
                        <form onSubmit={handleSaveCoupon} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Promo Code</label>
                            <input
                              type="text"
                              required
                              value={newCoupon.code}
                              onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                              className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors text-sm text-[var(--text-dark)] uppercase"
                              placeholder="e.g. WELCOME100"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Discount Type</label>
                              <select
                                value={newCoupon.discount_type}
                                onChange={e => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                                className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors text-sm text-[var(--text-dark)] cursor-pointer"
                              >
                                <option value="rupee">Rupee (₹)</option>
                                <option value="percentage">Percentage (%)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Discount Value</label>
                              <input
                                type="number"
                                required
                                min={0}
                                value={newCoupon.discount_value}
                                onChange={e => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                                className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors text-sm"
                                placeholder={newCoupon.discount_type === 'percentage' ? 'e.g. 10' : 'e.g. 150'}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Min Order Val (₹)</label>
                              <input
                                type="number"
                                min={0}
                                value={newCoupon.min_purchase_amount}
                                onChange={e => setNewCoupon({ ...newCoupon, min_purchase_amount: e.target.value })}
                                className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors text-sm"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Max Cap (₹)</label>
                              <input
                                type="number"
                                min={0}
                                value={newCoupon.max_discount_cap}
                                onChange={e => setNewCoupon({ ...newCoupon, max_discount_cap: e.target.value })}
                                className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors text-sm"
                                placeholder="Optional cap"
                                disabled={newCoupon.discount_type !== 'percentage'}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Start Date & Time</label>
                              <DateTimePicker
                                type="datetime-local"
                                value={newCoupon.start_datetime}
                                onChange={(val) => setNewCoupon({ ...newCoupon, start_datetime: val })}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">End Date & Time</label>
                              <DateTimePicker
                                type="datetime-local"
                                value={newCoupon.end_datetime}
                                onChange={(val) => setNewCoupon({ ...newCoupon, end_datetime: val })}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Limit Per Customer</label>
                              <input
                                type="number"
                                required
                                min={1}
                                value={newCoupon.limit_per_user}
                                onChange={e => setNewCoupon({ ...newCoupon, limit_per_user: parseInt(e.target.value) || 1 })}
                                className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors text-sm"
                                placeholder="1"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Total Max Usages</label>
                              <input
                                type="number"
                                min={1}
                                value={newCoupon.max_usages}
                                onChange={e => setNewCoupon({ ...newCoupon, max_usages: e.target.value })}
                                className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors text-sm"
                                placeholder="Optional limit"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">Restrict to Products (Optional)</label>
                            <div className="max-h-36 overflow-y-auto border border-[var(--border)] rounded-xl p-3 bg-[var(--bg-main)] space-y-2 custom-scrollbar">
                              {directoryProductsList.length === 0 ? (
                                <p className="text-xs text-[var(--text-light)]">No products listed in directory.</p>
                              ) : (
                                directoryProductsList.map(prod => {
                                  const isChecked = newCoupon.products.includes(prod.id);
                                  return (
                                    <label key={prod.id} className="flex items-center gap-2 text-xs font-semibold text-[var(--text-dark)] cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          if (isChecked) {
                                            setNewCoupon({ ...newCoupon, products: newCoupon.products.filter(id => id !== prod.id) });
                                          } else {
                                            setNewCoupon({ ...newCoupon, products: [...newCoupon.products, prod.id] });
                                          }
                                        }}
                                        className="w-3.5 h-3.5 text-[#5A3825] focus:ring-[#5A3825] border-gray-300 rounded cursor-pointer"
                                      />
                                      {prod.name} (₹{parseFloat(prod.price)})
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 py-1">
                            <input
                              type="checkbox"
                              id="coupon_is_active"
                              checked={newCoupon.is_active}
                              onChange={e => setNewCoupon({ ...newCoupon, is_active: e.target.checked })}
                              className="w-4 h-4 rounded text-[#5A3825] focus:ring-[#5A3825] border-gray-300 cursor-pointer"
                            />
                            <label htmlFor="coupon_is_active" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer select-none">
                              Activate Coupon
                            </label>
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-[#5A3825] text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#432A1C] shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] mt-2"
                          >
                            {editingCoupon ? 'Update Coupon' : 'Publish Coupon'}
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Coupons Ledger / List */}
                    <div className="xl:col-span-2">
                      <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5BC] overflow-hidden h-full flex flex-col">
                        <div className="px-8 py-6 border-b border-[#FAF7F2] bg-white shrink-0 flex justify-between items-center">
                          <h2 className="text-[10px] font-bold text-[#A87C51] uppercase tracking-widest">Active & Expired Promo Coupons</h2>
                          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-main)] px-3 py-1 rounded-full border border-[var(--border)]">
                            Total: {coupons.length}
                          </span>
                        </div>
                        <div className="divide-y divide-gray-50 flex-1 overflow-y-auto">
                          {coupons.length === 0 ? (
                            <div className="p-16 text-center bg-[var(--bg-main)]/20 flex-1 flex flex-col justify-center items-center">
                              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm text-2xl">🎫</div>
                              <p className="text-[var(--text-muted)] font-bold text-sm tracking-wide">No platform coupons created yet</p>
                              <p className="text-[var(--text-light)] text-xs mt-1">Use the coupon editor to publish a new promo code.</p>
                            </div>
                          ) : (
                            coupons.map(coupon => {
                              const isPercentage = coupon.discount_type === 'percentage';
                              return (
                                <div key={coupon.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-[var(--bg-main)] transition-colors">
                                  <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <span className="font-black text-[var(--text-dark)] text-xl tracking-wide bg-[#FAF7F2] border border-[#E8D5BC] px-3 py-1 rounded-xl">
                                        {coupon.code}
                                      </span>
                                      <span className="text-[10px] font-bold text-[#A87C51] bg-white border border-[#E8D5BC] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        {isPercentage ? `${parseFloat(coupon.discount_value)}% Off` : `₹${parseFloat(coupon.discount_value)} Off`}
                                      </span>
                                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md ${coupon.is_active
                                          ? 'bg-green-50 text-green-600 border border-green-200'
                                          : 'bg-gray-50 text-gray-500 border border-gray-200'
                                        }`}>
                                        {coupon.is_active ? 'Active' : 'Disabled'}
                                      </span>
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)] font-medium space-y-1 mt-1.5">
                                      <p>📅 <strong>Timeline:</strong> {new Date(coupon.start_datetime).toLocaleDateString()} → {new Date(coupon.end_datetime).toLocaleDateString()}</p>
                                      <p>🛍️ <strong>Usage:</strong> {coupon.usages_count} redeemed {coupon.max_usages ? `/ ${coupon.max_usages} max` : '(unlimited)'}</p>
                                      <p>💳 <strong>Rule:</strong> Min spend ₹{parseFloat(coupon.min_purchase_amount)} {coupon.max_discount_cap ? `| Max Cap ₹${parseFloat(coupon.max_discount_cap)}` : ''}</p>
                                      {coupon.products && coupon.products.length > 0 && (
                                        <p>📦 <strong>Scoped to:</strong> {coupon.products.length} specific product(s)</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 self-end md:self-auto shrink-0">
                                    <button
                                      onClick={() => handleToggleCouponActive(coupon)}
                                      className={`px-3 py-2 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 active:scale-95 ${coupon.is_active
                                          ? 'border-[#E8D5BC] hover:bg-[#FAF7F2] text-[#8C7B6E]'
                                          : 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700'
                                        }`}
                                    >
                                      {coupon.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button
                                      onClick={() => handleEditCoupon(coupon)}
                                      className="px-3.5 py-2 border border-[#E8D5BC] hover:bg-[#FAF7F2] text-[#8C7B6E] rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors active:scale-95"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCoupon(coupon.id)}
                                      className="px-3.5 py-2 border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors active:scale-95"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;