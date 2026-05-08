import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Package, 
  Archive, 
  Plus, 
  Tag, 
  Clock, 
  ShoppingBag, 
  CreditCard,
  LogOut,
  Edit,
  Trash2,
  RotateCcw,
  Save,
  X,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { IconPicker } from "@/components/IconPicker";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

import api from '@/lib/api';

const ImagePreview = ({ file, className }: { file: File; className?: string }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  if (!url) return null;
  return <img src={url} alt={file.name} className={className} />;
};

const isValidImageFile = (file: File) => file.type.startsWith('image/');

const VendorDashboard = () => {
  type VariantAttribute = {
    name: string;
    valuesText: string;
  };

  type NewVariantForm = {
    option_values: Record<string, string>;
    sku: string;
    price: string;
    stock_quantity: string;
  };

  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const canAccessVendorDashboard = isAuthenticated && user?.role === "vendor";
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("products");
  const [viewType, setViewType] = useState("grid");
  const [updatedFields, setUpdatedFields] = useState<{[key: string]: any}>({});
  const [editingStockId, setEditingStockId] = useState<number | null>(null);
  const [newStockValue, setNewStockValue] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Form states
  const [newProduct, setNewProduct] = useState({ 
    name: "", 
    price: "", 
    description: "", 
    category: "", 
    stock_quantity: "" 
  });
  const [newProductVariants, setNewProductVariants] = useState<NewVariantForm[]>([
    { option_values: {}, sku: "", price: "", stock_quantity: "" },
  ]);
  const [addProductStep, setAddProductStep] = useState(1);
  const [variantAttributes, setVariantAttributes] = useState<VariantAttribute[]>([
    { name: "Color", valuesText: "" },
    { name: "Size", valuesText: "" },
  ]);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  const [newProductImage, setNewProductImage] = useState<File | null>(null);
  const [newProductExtraImages, setNewProductExtraImages] = useState<File[]>([]);
  const [variantImageFiles, setVariantImageFiles] = useState<Record<number, File[]>>({});
  const [newCategory, setNewCategory] = useState({ name: "", icon: "FaShoppingBasket" });

  const [newOffer, setNewOffer] = useState({ title: "", discount_percent: "", start_date: "", end_date: "" });

  // Mock data queries (replace with actual API calls)
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['vendor-products'],
    queryFn: () => api.get('/vendor/products/') as any
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories/') as any
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['vendor-orders'],
    queryFn: () => api.get('/orders/') as any
  });

  const { data: subscriptionPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => api.get('/vendor/subscription/plans/') as any
  });

  const { data: currentSubscription } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: () => api.get('/vendor/subscription/current/') as any
  });

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please log in as a vendor.");
      navigate("/login", { replace: true });
      return;
    }
    if (user && user.role !== "vendor") {
      toast.error("Only vendors can access the vendor dashboard.");
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    if ((window as any).Razorpay) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Mutations
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => 
      api.patch(`/vendor/products/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      toast.success('Product updated successfully');
    },
    onError: () => {
      toast.error('Failed to update product');
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/vendor/products/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      toast.success('Product archived successfully');
    },
    onError: () => {
      toast.error('Failed to archive product');
    }
  });

  const addProductMutation = useMutation({
    mutationFn: (data: any) =>
      api.post('/vendor/products/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      toast.success('Product added! Waiting for admin approval.');
      setNewProduct({ name: "", price: "", description: "", category: "", stock_quantity: "" });
      setNewProductVariants([{ option_values: {}, sku: "", price: "", stock_quantity: "" }]);
      setVariantAttributes([
        { name: "Color", valuesText: "" },
        { name: "Size", valuesText: "" },
      ]);
      setBulkPrice("");
      setBulkStock("");
      setNewProductImage(null);
      setNewProductExtraImages([]);
      setVariantImageFiles({});
      setAddProductStep(1);
      setActiveTab("products");
    },
    onError: (error: any) => {
      // console.error("[VENDOR ADD PRODUCT ERROR]", error);
      // console.error("[VENDOR] response status:", error?.response?.status);
      // console.error("[VENDOR] response data type:", typeof error?.response?.data);
      // console.error("[VENDOR] response data:", error?.response?.data);
      const backendMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data.substring(0, 200) : undefined);
      toast.error(backendMessage || error.message || 'Failed to add product');
    }
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => 
      api.patch(`/vendor/order-items/${id}/status/`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      toast.success('Order status updated');
    },
    onError: () => {
      toast.error('Failed to update order status');
    }
  });

  const requestCategoryMutation = useMutation({
    mutationFn: (data: any) => api.post('/vendor/category-requests/', data),
    onSuccess: () => {
      toast.success('Category request submitted successfully');
      setNewCategory({ name: "", icon: "FaShoppingBasket" });
      setActiveTab("products");
    },

    onError: (error: any) => {
      toast.error(error.message || 'Failed to request category');
    }
  });

  const requestOfferMutation = useMutation({
    mutationFn: (data: any) => api.post('/vendor/offer-requests/', data),
    onSuccess: () => {
      toast.success('Offer request submitted successfully');
      setNewOffer({ title: "", discount_percent: "", start_date: "", end_date: "" });
      setActiveTab("products");
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to request offer');
    }
  });

  const createSubscriptionOrderMutation = useMutation({
    mutationFn: (planId: number) => api.post('/vendor/subscription/create-order/', { plan_id: planId }) as any,
    onSuccess: (data: any) => {
      // Free plan activates instantly on backend.
      if (!data?.razorpay_order_id) {
        toast.success(data?.message || 'Subscription activated successfully.');
        queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
        queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
        return;
      }

      const RazorpayCtor = (window as any).Razorpay;
      if (!RazorpayCtor) {
        toast.error('Razorpay is not loaded. Please refresh and try again.');
        return;
      }

      const options = {
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'Gujarati Bazaar',
        description: `${data.plan_name} Subscription`,
        order_id: data.razorpay_order_id,
        handler: async (response: any) => {
          try {
            await api.post('/vendor/subscription/verify/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: data.plan_id,
            });
            toast.success('Subscription activated successfully!');
            queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
            queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
          } catch (verifyError: any) {
            const msg = verifyError?.response?.data?.error || 'Payment verification failed.';
            toast.error(msg);
          }
        },
        theme: { color: '#A87C51' },
      };

      const razorpay = new RazorpayCtor(options);
      razorpay.open();
    },
    onError: (error: any) => {
      const backendMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.response?.data?.message;
      toast.error(backendMessage || 'Unable to start subscription checkout.');
    },
  });

  const handleFieldChange = (productId: string, field: string, value: string) => {
    setUpdatedFields(prev => ({ 
      ...prev, 
      [productId]: { ...(prev[productId] || {}), [field]: value } 
    }));
  };

  const handleQuickSave = async (productId: number) => {
    const changes = updatedFields[productId];
    if (!changes) return;
    
    updateProductMutation.mutate({ id: productId, data: changes });
    const newFields = { ...updatedFields };
    delete newFields[productId];
    setUpdatedFields(newFields);
  };

  const openEditModal = (product: any) => {
    setEditingProduct({ ...product });
    setIsEditModalOpen(true);
  };

  const handleFullUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    updateProductMutation.mutate({ 
      id: editingProduct.id, 
      data: {
        name: editingProduct.name,
        price: editingProduct.price,
        description: editingProduct.description,
        category: editingProduct.category,
        stock_quantity: editingProduct.stock_quantity
      }
    });
    setIsEditModalOpen(false);
    setEditingProduct(null);
  };

  const handleRestock = async (productId: number) => {
    if (!newStockValue || parseInt(newStockValue) < 1) {
      toast.error('Valid quantity required');
      return;
    }
    
    updateProductMutation.mutate({ 
      id: productId, 
      data: { stock_quantity: newStockValue } 
    });
    setEditingStockId(null);
    setNewStockValue("");
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm("Are you sure you want to archive this product?")) return;
    deleteProductMutation.mutate(productId);
  };

  const handleRestoreProduct = async (productId: number) => {
    updateProductMutation.mutate({ 
      id: productId, 
      data: { is_active: true } 
    });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentSubscription && currentSubscription.has_subscription === false) {
      toast.error("Please activate a subscription plan before adding products.");
      setActiveTab("subscription");
      return;
    }
    if (!newProductImage) {
      toast.error("Product image is required.");
      return;
    }

    const validVariants = newProductVariants
      .map((variant) => ({
        ...variant,
        price: variant.price.trim(),
        stock_quantity: variant.stock_quantity.trim(),
        sku: variant.sku.trim(),
      }))
      .filter((variant) => variant.price !== "" && variant.stock_quantity !== "");

    if (validVariants.length === 0) {
      toast.error("Add at least one variant with price and stock.");
      return;
    }

    const hasInvalidVariant = validVariants.some((variant) => {
      const price = Number(variant.price);
      const stock = Number(variant.stock_quantity);
      return Number.isNaN(price) || Number.isNaN(stock) || price < 0 || stock < 0;
    });

    if (hasInvalidVariant) {
      toast.error("Variant price and stock must be valid non-negative numbers.");
      return;
    }

    const payloadVariants = validVariants.map((variant) => ({
      sku: variant.sku,
      price: Number(variant.price),
      stock_quantity: Number(variant.stock_quantity),
      option_values: variant.option_values,
    }));

    const minPrice = Math.min(...payloadVariants.map((variant) => variant.price));
    const totalStock = payloadVariants.reduce(
      (sum, variant) => sum + variant.stock_quantity,
      0
    );

    const formData = new FormData();
    formData.append("name", newProduct.name);
    formData.append("description", newProduct.description);
    formData.append("category", String(newProduct.category));
    formData.append("price", String(minPrice));
    formData.append("stock_quantity", String(totalStock));
    formData.append("image", newProductImage);
    const variantsJson = JSON.stringify(payloadVariants);
    console.log("[VENDOR] payloadVariants:", payloadVariants);
    console.log("[VENDOR] variants_input JSON:", variantsJson);
    formData.append("variants_input", variantsJson);
    newProductExtraImages.forEach((file) => formData.append("extra_images", file));
    Object.entries(variantImageFiles).forEach(([index, files]) => {
      (files as File[]).forEach((file, imgIdx) => {
        formData.append(`variant_image_${index}_${imgIdx}`, file);
      });
    });

    addProductMutation.mutate(formData);
  };

  const handleVariantChange = (
    index: number,
    field: keyof NewVariantForm,
    value: string | Record<string, string>
  ) => {
    setNewProductVariants((prev) =>
      prev.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant
      )
    );
  };

  const addVariantRow = () => {
    setNewProductVariants((prev) => [
      ...prev,
      { option_values: {}, sku: "", price: "", stock_quantity: "" },
    ]);
  };

  const removeVariantRow = (index: number) => {
    setNewProductVariants((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, variantIndex) => variantIndex !== index);
    });
  };

  const normalizeListInput = (value: string): string[] => {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const generateVariantMatrix = () => {
    const cleanedAttributes = variantAttributes
      .map((attribute) => ({
        name: attribute.name.trim(),
        values: normalizeListInput(attribute.valuesText),
      }))
      .filter((attribute) => attribute.name && attribute.values.length > 0);

    if (cleanedAttributes.length === 0) {
      toast.error("Add at least one attribute with values.");
      return;
    }

    let combinations: Record<string, string>[] = [{}];
    cleanedAttributes.forEach((attribute) => {
      const nextCombinations: Record<string, string>[] = [];
      combinations.forEach((combo) => {
        attribute.values.forEach((value) => {
          nextCombinations.push({
            ...combo,
            [attribute.name]: value,
          });
        });
      });
      combinations = nextCombinations;
    });

    const productPrefix = newProduct.name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

    const generatedRows: NewVariantForm[] = combinations.map((combo) => {
      const skuParts = [productPrefix];
      Object.values(combo).forEach((value) => {
        if (value) skuParts.push(value.slice(0, 3).toUpperCase());
      });
      return {
        option_values: combo,
        sku: skuParts.filter(Boolean).join("-"),
        price: "",
        stock_quantity: "",
      };
    });

    setNewProductVariants(generatedRows.length ? generatedRows : [{ option_values: {}, sku: "", price: "", stock_quantity: "" }]);
    setVariantImageFiles({});
    toast.success("Variant combinations generated.");
  };

  const applyBulkToVariants = () => {
    if (!bulkPrice && !bulkStock) {
      toast.error("Enter bulk price and/or stock first.");
      return;
    }

    setNewProductVariants((prev) =>
      prev.map((variant) => ({
        ...variant,
        price: bulkPrice ? bulkPrice : variant.price,
        stock_quantity: bulkStock ? bulkStock : variant.stock_quantity,
      }))
    );
    toast.success("Bulk values applied.");
  };

  const nextAddProductStep = () => {
    if (addProductStep === 1) {
      if (!newProduct.name.trim() || !newProduct.description.trim() || !String(newProduct.category).trim()) {
        toast.error("Please complete basic product info first.");
        return;
      }
    }
    setAddProductStep((prev) => Math.min(prev + 1, 5));
  };

  const prevAddProductStep = () => {
    setAddProductStep((prev) => Math.max(prev - 1, 1));
  };

  const handleVariantAttributeChange = (
    index: number,
    field: keyof VariantAttribute,
    value: string
  ) => {
    setVariantAttributes((prev) =>
      prev.map((attribute, attributeIndex) =>
        attributeIndex === index ? { ...attribute, [field]: value } : attribute
      )
    );
  };

  const addVariantAttribute = () => {
    setVariantAttributes((prev) => [...prev, { name: "", valuesText: "" }]);
  };

  const removeVariantAttribute = (index: number) => {
    setVariantAttributes((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, attributeIndex) => attributeIndex !== index);
    });
  };

  const handleOrderStatusUpdate = async (orderId: number, newStatus: string) => {
    updateOrderStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleSubscribeToPlan = (planId: number) => {
    createSubscriptionOrderMutation.mutate(planId);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  // Filter products
  const activeProducts = products.filter((p: any) => p.is_active !== false);
  const archivedProducts = products.filter((p: any) => p.is_active === false);
  const pendingOrders = orders.filter((o: any) => o.status === "pending");

  const menuItems = [
    { key: "products", label: "Active Products", icon: Package, badge: null },
    { key: "archived", label: "Archived Products", icon: Archive, badge: null },
    { key: "orders", label: "Order Fulfillment", icon: ShoppingBag, badge: pendingOrders.length },
    { key: "add_product", label: "Add Product", icon: Plus, badge: null },
    { key: "subscription", label: "Subscription Plan", icon: CreditCard, badge: null },
    { key: "request_category", label: "Request Category", icon: Tag, badge: null },
    { key: "request_offer", label: "Request Offer", icon: Clock, badge: null },
  ];

  if (productsLoading || categoriesLoading || ordersLoading || plansLoading) {
    return (
      <PageShell>
        <div className="container py-20 text-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
            Loading dashboard...
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold text-foreground">Vendor Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your catalog and request marketplace features.</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl border border-border overflow-hidden sticky top-24"
            >
              <div className="px-6 py-4 bg-gradient-vendor">
                <p className="text-primary-foreground text-xs font-bold uppercase tracking-wider opacity-90">
                  Navigation
                </p>
              </div>
              <nav className="flex flex-col">
                {menuItems.map(({ key, label, icon: Icon, badge }, index) => (
                  <motion.button
                    key={key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center justify-between px-5 py-3.5 text-sm font-medium border-b border-border transition-all duration-200 ${
                      activeTab === key
                        ? "bg-primary text-primary-foreground border-l-4 border-l-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      {label}
                    </div>
                    {badge > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-accent text-accent-foreground">
                        {badge}
                      </span>
                    )}
                  </motion.button>
                ))}
              </nav>
              
              <div className="px-4 py-4 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium rounded-lg text-destructive hover:bg-destructive/10 transition-all"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </motion.div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Active Products Tab */}
            {activeTab === "products" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                <div className="px-6 py-5 border-b border-border bg-background-warm flex justify-between items-center">
                  <h2 className="font-display text-xl font-bold text-foreground">Active Products</h2>
                  <div className="flex bg-muted p-1 rounded-lg">
                    <button
                      onClick={() => setViewType("grid")}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                        viewType === "grid"
                          ? "bg-card shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewType("list")}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                        viewType === "list"
                          ? "bg-card shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      List Edit
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {activeProducts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No active products.</p>
                  ) : viewType === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeProducts.map((product: any, index: number) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border border-border rounded-xl p-4 bg-card hover:shadow-card transition-all"
                        >
                          <div className="h-48 bg-muted rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                className="max-h-full object-contain" 
                                alt={product.name} 
                              />
                            ) : (
                              <ImageIcon size={48} className="text-muted-foreground" />
                            )}
                          </div>
                          <h3 className="font-bold text-foreground truncate">{product.name}</h3>
                          <p className="text-brown-mid font-bold mb-2 text-lg">₹{parseFloat(product.price).toLocaleString()}</p>
                          <div className="mb-4">
                            <p className="text-sm text-muted-foreground">
                              Stock: <span className={`font-bold ${product.stock_quantity === 0 ? "text-destructive" : "text-foreground"}`}>
                                {product.stock_quantity}
                              </span>
                            </p>
                            {editingStockId === product.id ? (
                              <div className="mt-2 flex gap-2">
                                <input
                                  type="number"
                                  className="w-full p-2 border border-border rounded-md text-sm focus:border-accent outline-none"
                                  value={newStockValue}
                                  onChange={(e) => setNewStockValue(e.target.value)}
                                />
                                <button
                                  onClick={() => handleRestock(product.id)}
                                  className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-xs font-bold hover:bg-primary/90"
                                >
                                  <Save size={14} />
                                </button>
                                <button
                                  onClick={() => setEditingStockId(null)}
                                  className="text-muted-foreground hover:text-destructive p-1"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => openEditModal(product)}
                                  className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-md text-xs font-bold hover:bg-secondary/80 transition-all"
                                >
                                  <Edit size={14} className="inline mr-1" />
                                  Edit
                                </button>
                                {product.status === "approved" && product.stock_quantity === 0 && (
                                  <button
                                    onClick={() => {
                                      setEditingStockId(product.id);
                                      setNewStockValue("");
                                    }}
                                    className="flex-1 bg-accent text-accent-foreground py-2 rounded-md text-xs font-bold hover:bg-accent/90 transition-all"
                                  >
                                    Restock
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="px-3 bg-destructive/10 text-destructive rounded-md text-xs font-bold hover:bg-destructive/20 transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="pt-2 border-t border-border">
                            <span className={`text-xs px-2 py-1 uppercase font-bold rounded-md ${
                              product.status === "approved" 
                                ? "bg-success text-success-foreground" 
                                : product.status === "rejected" 
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {product.status}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-xs uppercase text-muted-foreground border-b border-border font-bold">
                            <th className="pb-3 px-2">Product</th>
                            <th className="pb-3 px-2">Price (₹)</th>
                            <th className="pb-3 px-2">Stock</th>
                            <th className="pb-3 px-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {activeProducts.map((product: any) => {
                            const hasChanges = !!updatedFields[product.id];
                            return (
                              <tr key={product.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                <td className="py-4 px-2 flex items-center gap-3">
                                  {product.image ? (
                                    <img src={product.image} className="w-10 h-10 object-cover rounded border border-border" alt="" />
                                  ) : (
                                    <div className="w-10 h-10 bg-muted rounded border border-border flex items-center justify-center">
                                      <ImageIcon size={16} className="text-muted-foreground" />
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-bold text-foreground block truncate max-w-xs">{product.name}</span>
                                    <span className={`text-xs uppercase font-bold ${
                                      product.status === "approved" ? "text-success" : 
                                      product.status === "rejected" ? "text-destructive" : "text-muted-foreground"
                                    }`}>
                                      {product.status}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4 px-2">
                                  <input
                                    type="number"
                                    defaultValue={product.price}
                                    onChange={(e) => handleFieldChange(product.id, "price", e.target.value)}
                                    className="w-24 p-2 border border-border rounded outline-none focus:border-accent transition-colors"
                                  />
                                </td>
                                <td className="py-4 px-2">
                                  <input
                                    type="number"
                                    defaultValue={product.stock_quantity}
                                    onChange={(e) => handleFieldChange(product.id, "stock_quantity", e.target.value)}
                                    className="w-20 p-2 border border-border rounded outline-none focus:border-accent transition-colors"
                                  />
                                </td>
                                <td className="py-4 px-2 text-right">
                                  {hasChanges ? (
                                    <button
                                      onClick={() => handleQuickSave(product.id)}
                                      disabled={updateProductMutation.isPending}
                                      className="bg-success text-success-foreground px-4 py-1.5 rounded text-xs font-bold hover:bg-success/90 shadow-sm disabled:opacity-50"
                                    >
                                      Save
                                    </button>
                                  ) : (
                                    <div className="flex justify-end items-center gap-2">
                                      <button
                                        onClick={() => openEditModal(product)}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                        title="Full Edit"
                                      >
                                        <Edit size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="text-destructive hover:text-destructive/80 transition-colors"
                                        title="Archive"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Other tabs would follow similar patterns... */}
            
            {/* Orders Tab */}
            {activeTab === "orders" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                <div className="px-6 py-5 border-b border-border bg-background-warm">
                  <h2 className="font-display text-xl font-bold text-foreground">Order Fulfillment</h2>
                </div>
                <div className="p-6 space-y-4">
                  {orders.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No orders to fulfill yet.</p>
                  ) : (
                    orders.map((order: any, index: number) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-border rounded-xl p-5 bg-card hover:shadow-card transition-all"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                          <div className="flex items-center gap-4">
                            {order.product_details?.image ? (
                              <img src={order.product_details.image} alt="" className="w-16 h-16 object-cover rounded-lg border bg-muted" />
                            ) : (
                              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                <Package size={24} className="text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-muted-foreground font-bold tracking-widest">
                                ORDER #{order.order_id} • {new Date(order.order_date).toLocaleDateString()}
                              </p>
                              <p className="font-bold text-foreground text-lg">
                                {order.product_details?.name} (x{order.quantity})
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                <span className="font-bold">Buyer:</span> {order.buyer_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <span className="font-bold">Address:</span> {order.address} | <span className="font-bold">Phone:</span> {order.phone}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 min-w-[150px]">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Update Status</label>
                            <select
                              className={`p-2 border rounded-lg text-sm font-bold outline-none transition-colors ${
                                order.status === "pending" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                order.status === "confirmed" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                order.status === "shipped" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                "bg-green-50 text-green-700 border-green-200"
                              }`}
                              value={order.status}
                              onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* Add Product Tab */}
            {activeTab === "add_product" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                <div className="px-6 py-5 border-b border-border bg-background-warm">
                  <h2 className="font-display text-xl font-bold text-foreground">Add New Product</h2>
                </div>
                <form onSubmit={handleAddProduct} className="p-6 space-y-5 max-w-2xl">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <span className={addProductStep >= 1 ? "text-foreground" : ""}>1. Basic Info</span>
                    <span className={addProductStep >= 2 ? "text-foreground" : ""}>2. Add Variants</span>
                    <span className={addProductStep >= 3 ? "text-foreground" : ""}>3. Variant Table</span>
                    <span className={addProductStep >= 4 ? "text-foreground" : ""}>4. Images</span>
                    <span className={addProductStep >= 5 ? "text-foreground" : ""}>5. Review</span>
                  </div>

                  {addProductStep === 1 && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-1">Product Name</label>
                        <input
                          type="text"
                          required
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-1">Category</label>
                        <select
                          required
                          value={newProduct.category}
                          onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                          className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all cursor-pointer"
                        >
                          <option value="" disabled>Select a category</option>
                          {categories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-1">Base Product Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          required
                          className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-muted file:text-foreground file:cursor-pointer hover:file:bg-accent hover:file:text-accent-foreground transition-all"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (file && !isValidImageFile(file)) {
                              toast.error("Only image files are allowed.");
                              return;
                            }
                            setNewProductImage(file);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-1">Description</label>
                        <textarea
                          required
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                          rows={4}
                          className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all resize-none"
                        />
                      </div>
                    </>
                  )}

                  {addProductStep === 2 && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-2">Variant Attributes</label>
                        <div className="space-y-3">
                          {variantAttributes.map((attribute, index) => (
                            <div key={`attribute-${index}`} className="grid grid-cols-12 gap-2">
                              <input
                                type="text"
                                placeholder="Attribute name (e.g. Fabric)"
                                value={attribute.name}
                                onChange={(e) => handleVariantAttributeChange(index, "name", e.target.value)}
                                className="col-span-4 p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                              />
                              <input
                                type="text"
                                placeholder="Values (comma separated)"
                                value={attribute.valuesText}
                                onChange={(e) => handleVariantAttributeChange(index, "valuesText", e.target.value)}
                                className="col-span-7 p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => removeVariantAttribute(index)}
                                className="col-span-1 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-all"
                                title="Remove attribute"
                              >
                                <X size={16} className="mx-auto" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={addVariantAttribute}
                            className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                          >
                            + Add another attribute
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={generateVariantMatrix}
                        className="w-full bg-secondary text-secondary-foreground py-3 rounded-full font-bold uppercase tracking-wider hover:bg-secondary/90 transition-all"
                      >
                        Generate Variant Table
                      </button>
                    </>
                  )}

                  {addProductStep === 3 && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="number"
                          min="0"
                          placeholder="Bulk Price"
                          value={bulkPrice}
                          onChange={(e) => setBulkPrice(e.target.value)}
                          className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="Bulk Stock"
                          value={bulkStock}
                          onChange={(e) => setBulkStock(e.target.value)}
                          className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={applyBulkToVariants}
                        className="w-full bg-secondary text-secondary-foreground py-2.5 rounded-lg text-sm font-bold hover:bg-secondary/80 transition-all"
                      >
                        Apply Bulk Values
                      </button>

                      {(() => {
                        const columnKeys = Array.from(
                          new Set(
                            newProductVariants.flatMap((variant) => Object.keys(variant.option_values || {}))
                          )
                        );
                        return (
                          <div className="space-y-3">
                            {newProductVariants.map((variant, index) => (
                              <div key={`variant-${index}`} className="grid grid-cols-12 gap-2">
                                {columnKeys.length > 0 ? (
                                  <div className="col-span-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${columnKeys.length}, minmax(0, 1fr))` }}>
                                    {columnKeys.map((key) => (
                                      <input
                                        key={`${index}-${key}`}
                                        type="text"
                                        placeholder={key}
                                        value={variant.option_values[key] ?? ""}
                                        onChange={(e) => {
                                          handleVariantChange(index, "option_values", {
                                            ...variant.option_values,
                                            [key]: e.target.value,
                                          });
                                        }}
                                        className="p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    placeholder="Variant label"
                                    className="col-span-4 p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                                    value=""
                                    onChange={() => {}}
                                  />
                                )}
                                <input
                                  type="text"
                                  placeholder="SKU (optional)"
                                  value={variant.sku}
                                  onChange={(e) => handleVariantChange(index, "sku", e.target.value)}
                                  className="col-span-3 p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  required
                                  placeholder="Price"
                                  value={variant.price}
                                  onChange={(e) => handleVariantChange(index, "price", e.target.value)}
                                  className="col-span-2 p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  required
                                  placeholder="Stock"
                                  value={variant.stock_quantity}
                                  onChange={(e) => handleVariantChange(index, "stock_quantity", e.target.value)}
                                  className="col-span-2 p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeVariantRow(index)}
                                  className="col-span-1 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-all"
                                  title="Remove variant"
                                >
                                  <X size={16} className="mx-auto" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={addVariantRow}
                              className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                            >
                              + Add another variant row
                            </button>
                          </div>
                        );
                      })()}
                    </>
                  )}

                  {addProductStep === 4 && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-3">Variant Images</label>
                        <div className="space-y-4">
                          {newProductVariants.map((variant, index) => {
                            const files = variantImageFiles[index] || [];
                            return (
                              <div key={`variant-image-${index}`} className="rounded-xl border border-border bg-card p-3 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-foreground">
                                    Variant {index + 1}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {Object.entries(variant.option_values || {}).map(([k, v]) => `${k}: ${v}`).join(", ") || "default"}
                                  </span>
                                </div>

                                {/* Selected image previews */}
                                {files.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {files.map((file, fidx) => (
                                      <div key={fidx} className="relative group">
                                        <ImagePreview
                                          file={file}
                                          className="h-16 w-16 rounded-lg object-cover border border-border"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setVariantImageFiles((prev) => ({
                                              ...prev,
                                              [index]: prev[index].filter((_, i) => i !== fidx),
                                            }));
                                          }}
                                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Add more button */}
                                <div className="flex items-center gap-2">
                                  <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                                    <ImageIcon size={14} />
                                    {files.length > 0 ? "Add more images" : "Choose images"}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      className="hidden"
                                      onChange={(e) => {
                                        const newFiles = Array.from(e.target.files || []);
                                        const validFiles = newFiles.filter((f) => {
                                          if (!isValidImageFile(f)) {
                                            toast.error(`"${f.name}" is not a valid image file.`);
                                            return false;
                                          }
                                          return true;
                                        });
                                        if (validFiles.length === 0) return;
                                        setVariantImageFiles((prev) => ({
                                          ...prev,
                                          [index]: [...(prev[index] || []), ...validFiles],
                                        }));
                                      }}
                                    />
                                  </label>
                                  {files.length > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      {files.length} image{files.length > 1 ? "s" : ""} selected
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-2">Additional Product Gallery Images (optional)</label>
                        <div className="space-y-2">
                          {newProductExtraImages.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {newProductExtraImages.map((file, idx) => (
                                <div key={idx} className="relative group">
                                  <ImagePreview
                                    file={file}
                                    className="h-16 w-16 rounded-lg object-cover border border-border"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setNewProductExtraImages((prev) => prev.filter((_, i) => i !== idx))}
                                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                            <ImageIcon size={14} />
                            {newProductExtraImages.length > 0 ? "Add more gallery images" : "Choose gallery images"}
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                const validFiles = files.filter((f) => {
                                  if (!isValidImageFile(f)) {
                                    toast.error(`"${f.name}" is not a valid image file.`);
                                    return false;
                                  }
                                  return true;
                                });
                                setNewProductExtraImages((prev) => [...prev, ...validFiles]);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Step 1 base image is required. Here you can assign images per variant and optional gallery images.
                      </p>
                    </>
                  )}

                  {addProductStep === 5 && (
                    <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
                      <p><span className="font-bold">Name:</span> {newProduct.name || "-"}</p>
                      <p><span className="font-bold">Category:</span> {newProduct.category || "-"}</p>
                      <p><span className="font-bold">Variants:</span> {newProductVariants.length}</p>
                      <p>
                        <span className="font-bold">Ready:</span>{" "}
                        {newProductVariants.some((v) => v.price && v.stock_quantity) ? "Yes" : "No (add price/stock)"}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    {addProductStep > 1 && (
                      <button
                        type="button"
                        onClick={prevAddProductStep}
                        className="flex-1 border border-border text-foreground py-3 rounded-full font-bold uppercase tracking-wider hover:bg-muted transition-all"
                      >
                        Back
                      </button>
                    )}
                    {addProductStep < 5 ? (
                      <button
                        type="button"
                        onClick={nextAddProductStep}
                        className="flex-1 bg-primary text-primary-foreground py-3 rounded-full font-bold uppercase tracking-wider hover:bg-primary/90 transition-all"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={addProductMutation.isPending}
                        className="flex-1 bg-primary text-primary-foreground py-3 rounded-full font-bold uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50"
                      >
                        {addProductMutation.isPending ? 'Submitting...' : 'Publish / Submit for Approval'}
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === "subscription" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                <div className="px-6 py-5 border-b border-border bg-background-warm">
                  <h2 className="font-display text-xl font-bold text-foreground">Subscription Plans</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose a plan to unlock product publishing limits.
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  {currentSubscription?.has_subscription !== false && currentSubscription?.plan_details && (
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                      <p className="text-sm font-bold text-foreground">
                        Current Plan: {currentSubscription.plan_details.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Limit: {currentSubscription.plan_details.product_limit} products | Valid until{" "}
                        {new Date(currentSubscription.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {plansLoading ? (
                    <p className="text-muted-foreground">Loading plans...</p>
                  ) : subscriptionPlans.length === 0 ? (
                    <p className="text-muted-foreground">No subscription plans available right now.</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {subscriptionPlans.map((plan: any) => {
                        const isCurrent = currentSubscription?.plan_details?.id === plan.id && currentSubscription?.is_active;
                        return (
                          <div key={plan.id} className="rounded-xl border border-border bg-muted/30 p-5 flex flex-col gap-3">
                            <div className="flex items-start justify-between">
                              <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                              {isCurrent && (
                                <span className="px-2 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{plan.description || "Subscription plan for vendors."}</p>
                            <p className="text-2xl font-black text-foreground">
                              ₹{Number(plan.price).toLocaleString()}
                              <span className="text-sm font-medium text-muted-foreground"> / {plan.duration_days} days</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Product limit: <span className="font-bold text-foreground">{plan.product_limit}</span>
                            </p>
                            <button
                              type="button"
                              disabled={isCurrent || createSubscriptionOrderMutation.isPending}
                              onClick={() => handleSubscribeToPlan(plan.id)}
                              className="mt-2 w-full bg-primary text-primary-foreground py-2.5 rounded-full font-bold uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50"
                            >
                              {isCurrent
                                ? "Current Plan"
                                : createSubscriptionOrderMutation.isPending
                                ? "Processing..."
                                : Number(plan.price) === 0
                                ? "Activate Plan"
                                : "Purchase Plan"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Archived Products Tab */}
            {activeTab === "archived" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                <div className="px-6 py-5 border-b border-border bg-background-warm">
                  <h2 className="font-display text-xl font-bold text-foreground">Archived Products</h2>
                </div>
                <div className="p-6">
                  {archivedProducts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No archived products.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                          <tr>
                            <th className="px-6 py-4 font-bold">Product</th>
                            <th className="px-6 py-4 font-bold">Price</th>
                            <th className="px-6 py-4 font-bold text-center">Status</th>
                            <th className="px-6 py-4 font-bold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-sm">
                          {archivedProducts.map((product: any) => (
                            <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                              <td className="px-6 py-4 flex items-center gap-3">
                                {product.image ? (
                                  <img src={product.image} className="w-10 h-10 object-cover rounded border border-border opacity-50" alt="" />
                                ) : (
                                  <div className="w-10 h-10 bg-muted rounded border border-border flex items-center justify-center">
                                    <ImageIcon size={16} className="text-muted-foreground" />
                                  </div>
                                )}
                                <span className="font-bold text-muted-foreground truncate max-w-xs">{product.name}</span>
                              </td>
                              <td className="px-6 py-4 text-muted-foreground">₹{parseFloat(product.price).toLocaleString()}</td>
                              <td className="px-6 py-4 text-center">
                                <span className="px-3 py-1 bg-destructive/10 text-destructive text-xs font-bold rounded-md uppercase">
                                  Archived
                                </span>
                              </td>
                              <td className="px-6 py-4 flex justify-end">
                                <button
                                  onClick={() => handleRestoreProduct(product.id)}
                                  className="px-4 py-2 text-xs font-bold uppercase text-muted-foreground border border-border hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                                >
                                  <RotateCcw size={14} />
                                  Restore
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Request Category Tab */}
            {activeTab === "request_category" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                <div className="px-6 py-5 border-b border-border bg-background-warm">
                  <h2 className="font-display text-xl font-bold text-foreground">Request New Category</h2>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); requestCategoryMutation.mutate(newCategory); }} className="p-6 space-y-5 max-w-2xl">
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1">Category Name</label>
                    <input
                      type="text"
                      required
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                      placeholder="e.g., Traditional Sweets"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-3">Category Icon</label>
                    <IconPicker 
                      value={newCategory.icon} 
                      onChange={(icon) => setNewCategory({ ...newCategory, icon })} 
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={requestCategoryMutation.isPending}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-full font-bold uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {requestCategoryMutation.isPending ? 'Submitting...' : 'Submit Category Request'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Request Offer Tab */}
            {activeTab === "request_offer" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                <div className="px-6 py-5 border-b border-border bg-background-warm">
                  <h2 className="font-display text-xl font-bold text-foreground">Request Promotional Offer</h2>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); requestOfferMutation.mutate(newOffer); }} className="p-6 space-y-5 max-w-2xl">
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1">Offer Title</label>
                    <input
                      type="text"
                      required
                      value={newOffer.title}
                      onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                      className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                      placeholder="e.g., Diwali Special 20%"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1">Discount Percentage (%)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={newOffer.discount_percent}
                      onChange={(e) => setNewOffer({ ...newOffer, discount_percent: e.target.value })}
                      className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-muted-foreground mb-1">Start Date</label>
                      <input
                        type="date"
                        required
                        value={newOffer.start_date}
                        onChange={(e) => setNewOffer({ ...newOffer, start_date: e.target.value })}
                        className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-muted-foreground mb-1">End Date</label>
                      <input
                        type="date"
                        required
                        value={newOffer.end_date}
                        onChange={(e) => setNewOffer({ ...newOffer, end_date: e.target.value })}
                        className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={requestOfferMutation.isPending}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-full font-bold uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {requestOfferMutation.isPending ? 'Submitting...' : 'Submit Offer Request'}
                  </button>
                </form>
              </motion.div>
            )}
          </main>
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && editingProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-2xl shadow-lift w-full max-w-3xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border bg-muted flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Edit Product Details</h2>
                  <p className="text-xs text-muted-foreground mt-1">Update information for {editingProduct.name}</p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleFullUpdate} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Product Name</label>
                      <input
                        type="text"
                        required
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Price (₹)</label>
                        <input
                          type="number"
                          required
                          value={editingProduct.price}
                          onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                          className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Stock</label>
                        <input
                          type="number"
                          required
                          value={editingProduct.stock_quantity}
                          onChange={(e) => setEditingProduct({ ...editingProduct, stock_quantity: e.target.value })}
                          className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Category</label>
                      <select
                        required
                        value={editingProduct.category}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-colors cursor-pointer"
                      >
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Description</label>
                      <textarea
                        required
                        rows={5}
                        value={editingProduct.description}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-colors resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Update Image (Optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-muted file:text-foreground hover:file:bg-accent hover:file:text-accent-foreground transition-all border border-border rounded-lg p-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-border flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-3 border border-border text-muted-foreground rounded-full font-bold uppercase tracking-widest hover:bg-muted transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateProductMutation.isPending}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors text-sm disabled:opacity-50"
                  >
                    {updateProductMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
};

export default VendorDashboard;
