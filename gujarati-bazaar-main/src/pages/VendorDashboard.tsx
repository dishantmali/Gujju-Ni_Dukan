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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

import api from '@/lib/api';

const VendorDashboard = () => {
  const navigate = useNavigate();
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
  const [newCategory, setNewCategory] = useState({ name: "" });
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
    mutationFn: (data: any) => api.post('/vendor/products/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      toast.success('Product added! Waiting for admin approval.');
      setNewProduct({ name: "", price: "", description: "", category: "", stock_quantity: "" });
      setActiveTab("products");
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add product');
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
      setNewCategory({ name: "" });
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
    addProductMutation.mutate(newProduct);
  };

  const handleOrderStatusUpdate = async (orderId: number, newStatus: string) => {
    updateOrderStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const { logout } = useAuth();

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

  if (productsLoading || categoriesLoading || ordersLoading) {
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-muted-foreground mb-1">Price (₹)</label>
                      <input
                        type="number"
                        required
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-muted-foreground mb-1">Initial Stock</label>
                      <input
                        type="number"
                        required
                        value={newProduct.stock_quantity}
                        onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                        className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                      />
                    </div>
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
                    <label className="block text-sm font-bold text-muted-foreground mb-1">Description</label>
                    <textarea
                      required
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      rows={4}
                      className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1">Product Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-muted file:text-foreground file:cursor-pointer hover:file:bg-accent hover:file:text-accent-foreground transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={addProductMutation.isPending}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-full font-bold uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {addProductMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
                  </button>
                </form>
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
                    <label className="block text-sm font-bold text-muted-foreground mb-1">Category Image (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-muted file:text-foreground file:cursor-pointer hover:file:bg-accent hover:file:text-accent-foreground transition-all"
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
