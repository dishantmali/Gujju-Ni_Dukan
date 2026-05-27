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
  Image as ImageIcon,
  CheckCircle2,
  Ticket,
  User
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { IconPicker } from "@/components/IconPicker";
import { DateTimePicker } from "@/components/ui/date-time-picker";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

import api from '@/lib/api';
import { getBackendErrorMessage } from "@/lib/errorHelper";

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
  const [updatedFields, setUpdatedFields] = useState<{ [key: string]: any }>({});
  const [editingStockId, setEditingStockId] = useState<number | null>(null);
  const [newStockValue, setNewStockValue] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletedVariantImageIds, setDeletedVariantImageIds] = useState<number[]>([]);
  const [deletedProductImageIds, setDeletedProductImageIds] = useState<number[]>([]);
  const [editVariantNewImages, setEditVariantNewImages] = useState<Record<number, File[]>>({});
  const [editProductNewGalleryImages, setEditProductNewGalleryImages] = useState<File[]>([]);
  const [isEditOfferModalOpen, setIsEditOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    stock_quantity: "",
    is_new: true
  });
  const [newProductVariants, setNewProductVariants] = useState<NewVariantForm[]>([
    { option_values: {}, sku: "", price: "", stock_quantity: "" },
  ]);
  const [addProductStep, setAddProductStep] = useState(1);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_type: "rupee",
    discount_value: "",
    start_datetime: "",
    end_datetime: "",
    limit_per_user: "1",
    max_usages: "",
    min_purchase_amount: "0",
    max_discount_cap: "",
    products: [] as number[]
  });
  const [isCreateCouponModalOpen, setIsCreateCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [couponViewMode, setCouponViewMode] = useState<"grid" | "table">("grid");
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

  const [newOffer, setNewOffer] = useState({ title: "", discount_percent: "", start_date: "", end_date: "", products: [] as number[] });

  // Vendor Profile State
  const [profileForm, setProfileForm] = useState({
    shop_name: "",
    city: "",
    address_line_1: "",
    address_line_2: "",
    state: "",
    pincode: "",
    phone: ""
  });
  const [profileLogo, setProfileLogo] = useState<File | null>(null);

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

  const { data: offersList = [], isLoading: offersLoading } = useQuery({
    queryKey: ['vendor-offers'],
    queryFn: () => api.get('/vendor/offer-requests/') as any
  });

  const { data: coupons = [], isLoading: couponsLoading } = useQuery({
    queryKey: ['vendor-coupons'],
    queryFn: () => api.get('/vendor/coupons/') as any
  });

  const { data: vendorProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn: () => api.get('/vendor/profile/') as any,
    enabled: isAuthenticated && user?.role === "vendor"
  });

  // Populate profile form when data loads
  useEffect(() => {
    if (vendorProfile) {
      setProfileForm({
        shop_name: vendorProfile.shop_name || "",
        city: vendorProfile.city || "",
        address_line_1: vendorProfile.address_line_1 || "",
        address_line_2: vendorProfile.address_line_2 || "",
        state: vendorProfile.state || "",
        pincode: vendorProfile.pincode || "",
        phone: vendorProfile.phone || ""
      });
    }
  }, [vendorProfile]);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please log in as a vendor.");
      navigate("/login", { replace: true });
      return;
    }
    if (user && user.role !== "vendor") {
      toast.error("Only vendors can access the vendor dashboard.");
      navigate("/", { replace: true });
      return;
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
  const updateVendorProfileMutation = useMutation({
    mutationFn: (data: FormData) => api.patch('/vendor/profile/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
      toast.success('Profile updated successfully');
      setProfileLogo(null);
    },
    onError: (error: any) => {
      toast.error(getBackendErrorMessage(error, 'Failed to update profile'));
    }
  });

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
      setNewProduct({ name: "", price: "", description: "", category: "", stock_quantity: "", is_new: true });
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
      toast.error(getBackendErrorMessage(error, 'Failed to request category'));
    }
  });

  const requestOfferMutation = useMutation({
    mutationFn: (data: any) => api.post('/vendor/offer-requests/', data),
    onSuccess: () => {
      toast.success('Offer created successfully');
      setNewOffer({ title: "", discount_percent: "", start_date: "", end_date: "", products: [] as number[] });
      queryClient.invalidateQueries({ queryKey: ['vendor-offers'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      setActiveTab("products");
    },
    onError: (error: any) => {
      toast.error(getBackendErrorMessage(error, 'Failed to request offer'));
    }
  });

  const createCouponMutation = useMutation({
    mutationFn: (data: any) => api.post('/vendor/coupons/', data),
    onSuccess: () => {
      toast.success('Coupon created successfully');
      setNewCoupon({
        code: "",
        discount_type: "rupee",
        discount_value: "",
        start_datetime: "",
        end_datetime: "",
        limit_per_user: "1",
        max_usages: "",
        min_purchase_amount: "0",
        max_discount_cap: "",
        products: [] as number[]
      });
      queryClient.invalidateQueries({ queryKey: ['vendor-coupons'] });
      setIsCreateCouponModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(getBackendErrorMessage(error, 'Failed to create coupon'));
    }
  });

  const updateCouponMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => api.patch(`/vendor/coupons/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-coupons'] });
      toast.success('Coupon updated successfully');
    },
    onError: () => toast.error('Failed to update coupon')
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/vendor/coupons/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-coupons'] });
      toast.success('Coupon deleted successfully');
    },
    onError: () => toast.error('Failed to delete coupon')
  });

  const updateOfferMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => api.patch(`/vendor/offer-requests/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-offers'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      toast.success('Offer updated successfully');
    },
    onError: () => toast.error('Failed to update offer')
  });

  const deleteOfferMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/vendor/offer-requests/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-offers'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      toast.success('Offer deleted successfully');
    },
    onError: () => toast.error('Failed to delete offer')
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
    // Ensure variants are present or empty array
    setEditingProduct({
      ...product,
      variants: product.variants || [],
      is_new: product.is_new !== undefined ? product.is_new : true
    });
    setDeletedVariantImageIds([]);
    setDeletedProductImageIds([]);
    setEditVariantNewImages({});
    setEditProductNewGalleryImages([]);
    setIsEditModalOpen(true);
  };

  const handleEditVariantChange = (index: number, field: string, value: any) => {
    if (!editingProduct) return;
    const updatedVariants = [...(editingProduct.variants || [])];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setEditingProduct({ ...editingProduct, variants: updatedVariants });
  };

  const addEditVariantRow = () => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      variants: [
        ...(editingProduct.variants || []),
        { option_values: {}, sku: "", price: "", stock_quantity: "" }
      ]
    });
  };

  const removeEditVariantRow = (index: number) => {
    if (!editingProduct) return;
    const variantToRemove = (editingProduct.variants || [])[index];
    if (variantToRemove?.id) {
      // If removing an existing variant, also mark its images for deletion if they aren't already
      const imageIds = (variantToRemove.images || []).map((img: any) => img.id);
      setDeletedVariantImageIds(prev => [...prev, ...imageIds]);
    }
    const updatedVariants = (editingProduct.variants || []).filter((_: any, i: number) => i !== index);
    setEditingProduct({ ...editingProduct, variants: updatedVariants });

    // Also clean up new images state for this index
    const newImages = { ...editVariantNewImages };
    delete newImages[index];
    // Need to shift other indices if we want to keep them aligned, 
    // but handleFullUpdate will use the current indices of editingProduct.variants.
    setEditVariantNewImages(newImages);
  };

  const handleRemoveExistingVariantImage = (variantId: number, imageId: number) => {
    setDeletedVariantImageIds(prev => [...prev, imageId]);
    setEditingProduct((prev: any) => ({
      ...prev,
      variants: prev.variants.map((v: any) =>
        v.id === variantId
          ? { ...v, images: v.images.filter((img: any) => img.id !== imageId) }
          : v
      )
    }));
  };

  const handleFullUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const variants = editingProduct.variants || [];

    // Calculate total stock and min price from variants if they exist
    let finalPrice = editingProduct.price;
    let finalStock = editingProduct.stock_quantity;

    if (variants.length > 0) {
      finalPrice = Math.min(...variants.map((v: any) => parseFloat(v.price) || 0));
      finalStock = variants.reduce((sum: number, v: any) => sum + (parseInt(v.stock_quantity) || 0), 0);
    }

    const formData = new FormData();
    formData.append("name", editingProduct.name);
    formData.append("price", String(finalPrice));
    formData.append("description", editingProduct.description);
    formData.append("category", editingProduct.category);
    formData.append("stock_quantity", String(finalStock));
    formData.append("is_new", String(editingProduct.is_new));

    if (variants.length > 0) {
      formData.append("variants_input", JSON.stringify(variants));
    }

    if (deletedVariantImageIds.length > 0) {
      formData.append("delete_variant_image_ids", JSON.stringify(deletedVariantImageIds));
    }

    if (deletedProductImageIds.length > 0) {
      formData.append("delete_product_image_ids", JSON.stringify(deletedProductImageIds));
    }

    // Append new variant images
    Object.entries(editVariantNewImages).forEach(([vidx, files]) => {
      files.forEach((file, fidx) => {
        formData.append(`variant_image_${vidx}_${fidx}`, file);
      });
    });

    // Append new product gallery images
    editProductNewGalleryImages.forEach((file) => {
      formData.append("extra_images", file);
    });

    // Handle new main image if selected
    const imageInput = document.getElementById('edit-product-image') as HTMLInputElement;
    if (imageInput && imageInput.files?.[0]) {
      formData.append("image", imageInput.files[0]);
    }

    updateProductMutation.mutate({
      id: editingProduct.id,
      data: formData
    });
    setIsEditModalOpen(false);
    setEditingProduct(null);
  };

  const openEditCouponModal = (coupon: any) => {
    setEditingCoupon(coupon);
    setNewCoupon({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_purchase_amount: String(coupon.min_purchase_amount),
      max_discount_cap: coupon.max_discount_cap ? String(coupon.max_discount_cap) : '',
      limit_per_user: String(coupon.limit_per_user || 1),
      max_usages: coupon.max_usages ? String(coupon.max_usages) : '',
      start_datetime: coupon.start_datetime ? coupon.start_datetime.substring(0, 16) : '',
      end_datetime: coupon.end_datetime ? coupon.end_datetime.substring(0, 16) : '',
      products: coupon.products || []
    });
    setIsCreateCouponModalOpen(true);
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

  const handleAddProduct = async (e?: React.FormEvent) => {
    e?.preventDefault();
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
    formData.append("is_new", String(newProduct.is_new));
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

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("shop_name", profileForm.shop_name);
    formData.append("city", profileForm.city);
    formData.append("address_line_1", profileForm.address_line_1);
    formData.append("address_line_2", profileForm.address_line_2);
    formData.append("state", profileForm.state);
    formData.append("pincode", profileForm.pincode);
    formData.append("phone", profileForm.phone);
    if (profileLogo) {
      formData.append("logo", profileLogo);
    }
    updateVendorProfileMutation.mutate(formData);
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
    { key: "request_offer", label: "Create Offer", icon: Clock, badge: null },
    { key: "coupons", label: "My Coupons", icon: Ticket, badge: null },
    { key: "profile", label: "Edit Profile", icon: User, badge: null },
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

  if (vendorProfile && vendorProfile.is_approved === false) {
    return (
      <PageShell>
        <div className="container py-20 text-center">
          <div className="max-w-md mx-auto p-8 rounded-2xl bg-card border shadow-sm">
            <Clock className="w-16 h-16 mx-auto text-amber-500 mb-6" />
            <h2 className="text-2xl font-bold font-display mb-4">Pending Admin Approval</h2>
            <p className="text-muted-foreground mb-6">
              Your vendor profile is currently under review by our administration team. You will be able to access your dashboard and manage your products once your account has been approved.
            </p>
            <div className="p-4 bg-amber-500/10 text-amber-600 rounded-xl text-sm font-medium">
              We'll notify you as soon as your account is ready!
            </div>
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
                    className={`flex items-center justify-between px-5 py-3.5 text-sm font-medium border-b border-border transition-all duration-200 ${activeTab === key
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
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewType === "grid"
                        ? "bg-card shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewType("list")}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewType === "list"
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
                            <span className={`text-xs px-2 py-1 uppercase font-bold rounded-md ${product.status === "approved"
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
                                    <span className={`text-xs uppercase font-bold ${product.status === "approved" ? "text-success" :
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
                              className={`p-2 border rounded-lg text-sm font-bold outline-none transition-colors ${order.status === "pending" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
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
                <div className="p-6 space-y-5 max-w-2xl">
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
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          id="new-product-is-new"
                          checked={newProduct.is_new}
                          onChange={(e) => setNewProduct({ ...newProduct, is_new: e.target.checked })}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary/20 bg-background"
                        />
                        <label htmlFor="new-product-is-new" className="text-sm font-bold text-muted-foreground cursor-pointer">
                          Mark as New Arrival (Show "NEW" Tag)
                        </label>
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
                                    onChange={() => { }}
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
                    <div className="space-y-5">
                      {/* Product Info Card */}
                      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                        <h3 className="font-bold text-foreground">Product Information</h3>
                        <div className="flex flex-col sm:flex-row gap-4">
                          {newProductImage && (
                            <div className="shrink-0">
                              <p className="text-xs text-muted-foreground font-medium mb-1">Base Image</p>
                              <ImagePreview file={newProductImage} className="h-28 w-28 rounded-lg object-cover border border-border" />
                            </div>
                          )}
                          <div className="flex-1 space-y-2">
                            <div>
                              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Name</span>
                              <p className="text-sm font-semibold text-foreground">{newProduct.name || "-"}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Category</span>
                              <p className="text-sm font-semibold text-foreground">
                                {categories.find((c: any) => String(c.id) === String(newProduct.category))?.name || newProduct.category || "-"}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Description</span>
                              <p className="text-sm text-muted-foreground leading-relaxed">{newProduct.description || "-"}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Variants Card */}
                      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                        <h3 className="font-bold text-foreground">Variants ({newProductVariants.length})</h3>
                        {newProductVariants.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Options</th>
                                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">SKU</th>
                                  <th className="text-right py-2 pr-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Price</th>
                                  <th className="text-right py-2 text-muted-foreground font-medium text-xs uppercase tracking-wider">Stock</th>
                                </tr>
                              </thead>
                              <tbody>
                                {newProductVariants.map((variant, index) => (
                                  <tr key={index} className="border-b border-border/50 last:border-0">
                                    <td className="py-2 pr-4 text-foreground">
                                      {Object.entries(variant.option_values || {}).map(([k, v]) => `${k}: ${v}`).join(", ") || "Default"}
                                    </td>
                                    <td className="py-2 pr-4 text-muted-foreground">{variant.sku || "-"}</td>
                                    <td className="py-2 pr-4 text-right font-medium">
                                      {variant.price ? `₹${Number(variant.price).toLocaleString()}` : "-"}
                                    </td>
                                    <td className="py-2 text-right">
                                      <span className={variant.stock_quantity ? "text-success font-medium" : "text-destructive font-medium"}>
                                        {variant.stock_quantity || "0"}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No variants configured.</p>
                        )}
                        {newProductVariants.some((v) => !v.price || !v.stock_quantity) && (
                          <p className="text-xs text-destructive font-medium">Warning: Some variants are missing price or stock.</p>
                        )}
                      </div>

                      {/* Gallery Images */}
                      {newProductExtraImages.length > 0 && (
                        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                          <h3 className="font-bold text-foreground">Gallery Images ({newProductExtraImages.length})</h3>
                          <div className="flex flex-wrap gap-2">
                            {newProductExtraImages.map((file, idx) => (
                              <ImagePreview key={idx} file={file} className="h-16 w-16 rounded-lg object-cover border border-border" />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Variant Images */}
                      {Object.entries(variantImageFiles).some(([_, files]) => files.length > 0) && (
                        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                          <h3 className="font-bold text-foreground">Variant Images</h3>
                          <div className="space-y-3">
                            {Object.entries(variantImageFiles).map(([index, files]) => {
                              if (files.length === 0) return null;
                              const variant = newProductVariants[Number(index)];
                              const label = variant
                                ? Object.entries(variant.option_values || {}).map(([k, v]) => `${k}: ${v}`).join(", ") || `Variant ${Number(index) + 1}`
                                : `Variant ${Number(index) + 1}`;
                              return (
                                <div key={index} className="space-y-1">
                                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {files.map((file, fidx) => (
                                      <ImagePreview key={fidx} file={file} className="h-14 w-14 rounded-lg object-cover border border-border" />
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Summary / Readiness */}
                      <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
                        <h3 className="font-bold text-foreground">Summary & Readiness</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-muted-foreground">Total Variants</span>
                          <span className="font-medium text-foreground text-right">{newProductVariants.length}</span>

                          <span className="text-muted-foreground">Price Range</span>
                          <span className="font-medium text-foreground text-right">
                            {newProductVariants.some((v) => v.price)
                              ? (() => {
                                const prices = newProductVariants
                                  .filter((v) => v.price)
                                  .map((v) => Number(v.price));
                                const min = Math.min(...prices);
                                const max = Math.max(...prices);
                                return min === max ? `₹${min.toLocaleString()}` : `₹${min.toLocaleString()} – ₹${max.toLocaleString()}`;
                              })()
                              : "Not set"}
                          </span>

                          <span className="text-muted-foreground">Total Stock</span>
                          <span className="font-medium text-foreground text-right">
                            {newProductVariants.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="pt-3 border-t border-border space-y-1">
                          {newProductImage ? (
                            <p className="text-xs text-success font-medium flex items-center gap-1.5">
                              <CheckCircle2 size={14} /> Base product image uploaded
                            </p>
                          ) : (
                            <p className="text-xs text-destructive font-medium">Missing: Base product image</p>
                          )}
                          {newProduct.name.trim() ? (
                            <p className="text-xs text-success font-medium flex items-center gap-1.5">
                              <CheckCircle2 size={14} /> Product name provided
                            </p>
                          ) : (
                            <p className="text-xs text-destructive font-medium">Missing: Product name</p>
                          )}
                          {newProduct.category ? (
                            <p className="text-xs text-success font-medium flex items-center gap-1.5">
                              <CheckCircle2 size={14} /> Category selected
                            </p>
                          ) : (
                            <p className="text-xs text-destructive font-medium">Missing: Category</p>
                          )}
                          {newProduct.description.trim() ? (
                            <p className="text-xs text-success font-medium flex items-center gap-1.5">
                              <CheckCircle2 size={14} /> Description provided
                            </p>
                          ) : (
                            <p className="text-xs text-destructive font-medium">Missing: Description</p>
                          )}
                          {newProductVariants.every((v) => v.price && v.stock_quantity) ? (
                            <p className="text-xs text-success font-medium flex items-center gap-1.5">
                              <CheckCircle2 size={14} /> All variants have price & stock
                            </p>
                          ) : (
                            <p className="text-xs text-destructive font-medium">Warning: Some variants are missing price or stock</p>
                          )}
                        </div>
                      </div>
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
                        type="button"
                        onClick={handleAddProduct}
                        disabled={addProductMutation.isPending}
                        className="flex-1 bg-primary text-primary-foreground py-3 rounded-full font-bold uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50"
                      >
                        {addProductMutation.isPending ? 'Submitting...' : 'Publish / Submit for Approval'}
                      </button>
                    )}
                  </div>
                </div>
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

            {/* Offer Tab */}
            {activeTab === "request_offer" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                <div className="px-6 py-5 border-b border-border bg-background-warm">
                  <h2 className="font-display text-xl font-bold text-foreground">Create Promotional Offer</h2>
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
                      <DateTimePicker
                        type="date"
                        value={newOffer.start_date}
                        onChange={(val) => setNewOffer({ ...newOffer, start_date: val })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-muted-foreground mb-1">End Date</label>
                      <DateTimePicker
                        type="date"
                        value={newOffer.end_date}
                        onChange={(val) => setNewOffer({ ...newOffer, end_date: val })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1">Apply to Products</label>
                    <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-2 bg-muted/50 custom-scrollbar">
                      {products.filter((p: any) => p.is_active).length === 0 ? (
                        <p className="text-xs text-muted-foreground p-2">No active products available.</p>
                      ) : (
                        products.filter((p: any) => p.is_active).map((product: any) => (
                          <label key={product.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={newOffer.products.includes(product.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewOffer({ ...newOffer, products: [...newOffer.products, product.id] });
                                } else {
                                  setNewOffer({ ...newOffer, products: newOffer.products.filter(id => id !== product.id) });
                                }
                              }}
                              className="w-4 h-4 text-primary border-border rounded focus:ring-primary/20 bg-background"
                            />
                            <span className="text-sm font-medium text-foreground line-clamp-1 flex-1">{product.name}</span>
                            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                              ₹{parseFloat(product.price).toLocaleString()}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={requestOfferMutation.isPending || newOffer.products.length === 0}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-full font-bold uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {requestOfferMutation.isPending ? 'Submitting...' : 'Create Offer'}
                  </button>
                </form>

                {/* Active Offers Table */}
                <div className="border-t border-border mt-6">
                  <div className="px-6 py-5 bg-background-warm border-b border-border">
                    <h3 className="font-display text-lg font-bold text-foreground">Your Offers</h3>
                  </div>
                  <div className="p-6">
                    {offersLoading ? (
                      <p className="text-sm text-muted-foreground">Loading offers...</p>
                    ) : offersList.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No offers created yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                              <th className="p-3 font-bold">Offer Title</th>
                              <th className="p-3 font-bold">Discount</th>
                              <th className="p-3 font-bold">Products</th>
                              <th className="p-3 font-bold">Valid Dates</th>
                              <th className="p-3 font-bold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {offersList.map((offer: any) => (
                              <tr key={offer.id} className="hover:bg-muted/30 transition-colors">
                                <td className="p-3 font-medium text-sm">{offer.title}</td>
                                <td className="p-3 font-bold text-success text-sm">{offer.discount_percent}%</td>
                                <td className="p-3 text-sm text-muted-foreground">
                                  {offer.products?.length || 0} product(s)
                                </td>
                                <td className="p-3 text-sm text-muted-foreground">
                                  {new Date(offer.start_date).toLocaleDateString()} - {new Date(offer.end_date).toLocaleDateString()}
                                </td>
                                <td className="p-3 text-right space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingOffer({
                                        id: offer.id,
                                        title: offer.title,
                                        discount_percent: offer.discount_percent,
                                        start_date: offer.start_date,
                                        end_date: offer.end_date,
                                        products: offer.products || []
                                      });
                                      setIsEditOfferModalOpen(true);
                                    }}
                                    className="p-1.5 bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground rounded transition-colors inline-flex"
                                    title="Edit Offer"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this offer?')) {
                                        deleteOfferMutation.mutate(offer.id);
                                      }
                                    }}
                                    className="p-1.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded transition-colors inline-flex"
                                    title="Delete Offer"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Coupons Tab */}
            {activeTab === "coupons" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Glassmorphic Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-5 bg-gradient-to-br from-amber-500/5 to-orange-500/10 rounded-2xl border border-amber-500/15 backdrop-blur-sm flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-amber-800/80 tracking-wider">Total Coupons</p>
                      <h4 className="text-3xl font-black text-brown-mid mt-1">{coupons.length}</h4>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
                      <Ticket size={22} />
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-emerald-500/5 to-teal-500/10 rounded-2xl border border-emerald-500/15 backdrop-blur-sm flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-emerald-800/80 tracking-wider">Active & Live</p>
                      <h4 className="text-3xl font-black text-emerald-800 mt-1">
                        {coupons.filter((c: any) => c.is_active && new Date(c.end_datetime) > new Date() && new Date() >= new Date(c.start_datetime)).length}
                      </h4>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700">
                      <CheckCircle2 size={22} />
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-indigo-500/5 to-purple-500/10 rounded-2xl border border-indigo-500/15 backdrop-blur-sm flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-indigo-800/80 tracking-wider">Redemptions</p>
                      <h4 className="text-3xl font-black text-indigo-900 mt-1">
                        {coupons.reduce((sum: number, c: any) => sum + (c.usages_count ?? c.usages?.length ?? 0), 0)}
                      </h4>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-700">
                      <ShoppingBag size={22} />
                    </div>
                  </div>
                </div>

                {/* Main Coupons Container */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                  <div className="px-6 py-5 border-b border-border bg-background-warm flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                      <h2 className="font-display text-xl font-bold text-foreground">My Coupons</h2>
                      <p className="text-sm text-muted-foreground mt-1">Manage vendor-restricted discount coupons</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* View Toggle */}
                      {coupons.length > 0 && (
                        <div className="flex bg-muted p-1 rounded-lg">
                          <button
                            onClick={() => setCouponViewMode("grid")}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${couponViewMode === "grid"
                              ? "bg-card shadow-sm text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            Ticket Grid
                          </button>
                          <button
                            onClick={() => setCouponViewMode("table")}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${couponViewMode === "table"
                              ? "bg-card shadow-sm text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            Table List
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setEditingCoupon(null);
                          setNewCoupon({ code: '', discount_type: 'rupee', discount_value: '', min_purchase_amount: '0', max_discount_cap: '', limit_per_user: '1', max_usages: '', start_datetime: '', end_datetime: '', products: [] });
                          setIsCreateCouponModalOpen(true);
                        }}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus size={14} /> Create Coupon
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {couponsLoading ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Loading coupons...</p>
                    ) : coupons.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No coupons created yet. Click "Create Coupon" to start.</p>
                    ) : couponViewMode === "grid" ? (
                      /* Visual Ticket Stub Grid */
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {coupons.map((coupon: any, idx: number) => {
                          const now = new Date();
                          const start = new Date(coupon.start_datetime);
                          const end = new Date(coupon.end_datetime);
                          const isExpired = now > end;
                          const isUpcoming = now < start;
                          const usages = coupon.usages_count ?? coupon.usages?.length ?? 0;

                          let timelineStatus = "Active";
                          let timelineClass = "bg-success/10 text-success border-success/20";
                          if (isExpired) {
                            timelineStatus = "Expired";
                            timelineClass = "bg-destructive/10 text-destructive border-destructive/20";
                          } else if (isUpcoming) {
                            timelineStatus = "Upcoming";
                            timelineClass = "bg-accent/10 text-accent border-accent/20";
                          }

                          return (
                            <motion.div
                              key={coupon.id}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              whileHover={{ y: -4 }}
                              className="relative bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-card transition-all flex flex-col min-h-[240px]"
                            >
                              {/* Ticket Notch cutouts */}
                              <div className="absolute -left-2 top-[140px] w-4 h-8 bg-background border border-border rounded-full z-10"></div>
                              <div className="absolute -right-2 top-[140px] w-4 h-8 bg-background border border-border rounded-full z-10"></div>

                              {/* Top Part */}
                              <div className="p-5 flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                  <span className={`px-2 py-0.5 rounded border text-[9px] uppercase font-extrabold tracking-wider ${timelineClass}`}>
                                    {timelineStatus}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-semibold bg-muted/60 px-2 py-0.5 rounded-full border">
                                    Min Pay: ₹{parseFloat(coupon.min_purchase_amount).toLocaleString()}
                                  </span>
                                </div>

                                <div className="text-center my-4">
                                  <h3 className="font-display font-black text-3xl text-brown-mid tracking-tight">
                                    {coupon.discount_type === 'rupee'
                                      ? `₹${parseFloat(coupon.discount_value).toLocaleString()}`
                                      : `${parseFloat(coupon.discount_value)}%`} OFF
                                  </h3>
                                  {coupon.discount_type === 'percentage' && coupon.max_discount_cap && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5">Cap: ₹{parseFloat(coupon.max_discount_cap)}</p>
                                  )}
                                  <div className="mt-3.5 inline-block px-4 py-1.5 bg-muted/60 rounded-xl border border-dashed border-border/80">
                                    <span className="font-mono text-sm font-black text-foreground tracking-widest uppercase">{coupon.code}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Dashed Separator Line */}
                              <div className="border-t border-dashed border-border/80 mx-5"></div>

                              {/* Bottom Part */}
                              <div className="p-4 bg-muted/20 px-6 flex justify-between items-center text-xs text-muted-foreground mt-auto">
                                <div>
                                  <p className="font-medium text-foreground/80">
                                    Redeemed: <span className="font-bold text-foreground">{usages}</span>{coupon.max_usages && ` / ${coupon.max_usages}`}
                                  </p>
                                  <p className="text-[9px] text-muted-foreground mt-0.5">
                                    Ends: {end.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' })}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openEditCouponModal(coupon)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/80"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => updateCouponMutation.mutate({ id: coupon.id, data: { is_active: !coupon.is_active } })}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${coupon.is_active
                                      ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80"
                                      : "bg-success/10 text-success border-success/20 hover:bg-success/20"
                                      }`}
                                  >
                                    {coupon.is_active ? 'Pause' : 'Resume'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this coupon?')) {
                                        deleteCouponMutation.mutate(coupon.id);
                                      }
                                    }}
                                    className="p-2 bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground text-destructive rounded-xl transition-colors flex items-center justify-center border border-destructive/20"
                                    title="Delete"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Classic Dense Table List */
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground font-bold">
                              <th className="p-3">Code</th>
                              <th className="p-3">Discount</th>
                              <th className="p-3">Min Purchase</th>
                              <th className="p-3">Valid Dates (IST)</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-center">Redemptions</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {coupons.map((coupon: any) => {
                              const now = new Date();
                              const start = new Date(coupon.start_datetime);
                              const end = new Date(coupon.end_datetime);
                              const isExpired = now > end;
                              const isUpcoming = now < start;

                              let timelineStatus = "Active";
                              let timelineColor = "text-success bg-success/10 border-success/20";
                              if (isExpired) {
                                timelineStatus = "Expired";
                                timelineColor = "text-destructive bg-destructive/10 border-destructive/20";
                              } else if (isUpcoming) {
                                timelineStatus = "Upcoming";
                                timelineColor = "text-accent bg-accent/10 border-accent/20";
                              }

                              return (
                                <tr key={coupon.id} className="hover:bg-muted/30 transition-colors">
                                  <td className="p-3 font-black text-sm text-foreground tracking-wider">{coupon.code}</td>
                                  <td className="p-3 text-sm font-semibold">
                                    {coupon.discount_type === 'rupee'
                                      ? `₹${parseFloat(coupon.discount_value).toLocaleString()}`
                                      : `${parseFloat(coupon.discount_value)}%`}
                                    {coupon.discount_type === 'percentage' && coupon.max_discount_cap && (
                                      <span className="text-xs text-muted-foreground block font-normal">Max Cap: ₹{coupon.max_discount_cap}</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-sm text-muted-foreground">₹{parseFloat(coupon.min_purchase_amount).toLocaleString()}</td>
                                  <td className="p-3 text-xs text-muted-foreground leading-normal">
                                    {start.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' })} <br />
                                    to <br />
                                    {end.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' })}
                                  </td>
                                  <td className="p-3 text-xs">
                                    <div className="flex flex-col gap-1 items-start">
                                      <span className={`px-2.5 py-0.5 rounded border text-[10px] uppercase font-bold tracking-wider ${timelineColor}`}>
                                        {timelineStatus}
                                      </span>
                                      {!coupon.is_active && (
                                        <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[9px] uppercase font-semibold">
                                          Deactivated
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3 text-sm font-semibold text-center text-brown-mid">
                                    {coupon.usages_count ?? coupon.usages?.length ?? 0}
                                    {coupon.max_usages && (
                                      <span className="text-xs text-muted-foreground font-normal"> / {coupon.max_usages}</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right space-x-2 whitespace-nowrap">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => openEditCouponModal(coupon)}
                                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                        title="Edit Coupon"
                                      >
                                        <Edit size={16} />
                                      </button>
                                      <button
                                        onClick={() => updateCouponMutation.mutate({ id: coupon.id, data: { is_active: !coupon.is_active } })}
                                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${coupon.is_active
                                          ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                          : "bg-success/15 text-success hover:bg-success/25"
                                          }`}
                                      >
                                        {coupon.is_active ? 'Deactivate' : 'Activate'}
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm('Are you sure you want to delete this coupon?')) {
                                            deleteCouponMutation.mutate(coupon.id);
                                          }
                                        }}
                                        className="p-1.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded transition-colors inline-flex align-middle"
                                        title="Delete Coupon"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                <div className="px-6 py-5 border-b border-border bg-background-warm flex justify-between items-center">
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground">Edit Profile</h2>
                    <p className="text-sm text-muted-foreground mt-1">Update your shop details and contact information.</p>
                  </div>
                </div>

                {profileLoading ? (
                  <div className="p-12 text-center text-muted-foreground">Loading profile...</div>
                ) : (
                  <form onSubmit={handleProfileSubmit} className="p-8 space-y-6">
                    <div className="flex gap-8">
                      <div className="flex-1 space-y-5">
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Shop Name</label>
                          <input
                            type="text"
                            required
                            value={profileForm.shop_name}
                            onChange={(e) => setProfileForm({ ...profileForm, shop_name: e.target.value })}
                            className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Phone</label>
                          <input
                            type="text"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                            className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-colors"
                          />
                        </div>
                      </div>
                      <div className="w-48 flex flex-col items-center">
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 text-center">Shop Logo</label>
                        <div className="w-32 h-32 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/50 relative cursor-pointer hover:border-primary transition-colors">
                          {profileLogo ? (
                            <ImagePreview file={profileLogo} className="w-full h-full object-cover" />
                          ) : vendorProfile?.logo ? (
                            <img src={vendorProfile.logo} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="text-muted-foreground" size={32} />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                              if (e.target.files?.[0]) setProfileLogo(e.target.files[0]);
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center mt-2">Click to upload new logo</p>
                      </div>
                    </div>


                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Address Line 1</label>
                          <input
                            type="text"
                            required
                            value={profileForm.address_line_1}
                            onChange={(e) => setProfileForm({ ...profileForm, address_line_1: e.target.value })}
                            className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Address Line 2</label>
                          <input
                            type="text"
                            value={profileForm.address_line_2}
                            onChange={(e) => setProfileForm({ ...profileForm, address_line_2: e.target.value })}
                            className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-colors"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">City</label>
                          <input
                            type="text"
                            required
                            value={profileForm.city}
                            onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                            className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">State</label>
                          <input
                            type="text"
                            required
                            value={profileForm.state}
                            onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                            className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Pincode</label>
                          <input
                            type="text"
                            required
                            value={profileForm.pincode}
                            onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                            className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border flex justify-end">
                      <button
                        type="submit"
                        disabled={updateVendorProfileMutation.isPending}
                        className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                      >
                        <Save size={18} />
                        {updateVendorProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                      </button>
                    </div>
                  </form>
                )}
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
              className="bg-card rounded-2xl shadow-lift w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
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

              <form onSubmit={handleFullUpdate} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
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
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="edit-product-is-new"
                        checked={editingProduct.is_new}
                        onChange={(e) => setEditingProduct({ ...editingProduct, is_new: e.target.checked })}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary/20 bg-background"
                      />
                      <label htmlFor="edit-product-is-new" className="text-sm font-bold text-muted-foreground cursor-pointer">
                        Mark as New Arrival (Show "NEW" Tag)
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Update Main Image (Optional)</label>
                      <div className="flex items-center gap-4">
                        {editingProduct.image && (
                          <img src={editingProduct.image} alt="" className="w-12 h-12 object-cover rounded border border-border" />
                        )}
                        <input
                          id="edit-product-image"
                          type="file"
                          accept="image/*"
                          className="flex-1 text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-muted file:text-foreground hover:file:bg-accent hover:file:text-accent-foreground transition-all border border-border rounded-lg p-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Product Gallery</label>
                      <div className="flex flex-wrap gap-2 items-center p-2 bg-muted rounded-lg border border-border">
                        {editingProduct.product_images?.map((imgObj: any) => (
                          <div key={imgObj.id} className="relative group">
                            <img src={imgObj.image} alt="" className="w-10 h-10 object-cover rounded border border-border" />
                            <button
                              type="button"
                              onClick={() => {
                                setDeletedProductImageIds(prev => [...prev, imgObj.id]);
                                setEditingProduct((prev: any) => ({
                                  ...prev,
                                  product_images: prev.product_images.filter((img: any) => img.id !== imgObj.id)
                                }));
                              }}
                              className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                        {editProductNewGalleryImages.map((file, idx) => (
                          <div key={`new-gallery-${idx}`} className="relative group">
                            <ImagePreview file={file} className="w-10 h-10 object-cover rounded border border-primary/30" />
                            <button
                              type="button"
                              onClick={() => setEditProductNewGalleryImages(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                        <label className="w-10 h-10 flex items-center justify-center rounded border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                          <Plus size={14} className="text-muted-foreground" />
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              const validFiles = files.filter(f => isValidImageFile(f));
                              setEditProductNewGalleryImages(prev => [...prev, ...validFiles]);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Variants Section in Edit Modal */}
                <div className="pt-6 border-t border-border">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Product Variants</h3>
                    <button
                      type="button"
                      onClick={addEditVariantRow}
                      className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                      + Add Variant
                    </button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {(editingProduct.variants || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-4 bg-muted/30 rounded-lg">
                        No variants defined for this product.
                        {editingProduct.variants?.length === 0 && " Basic price and stock will be used."}
                      </p>
                    ) : (
                      editingProduct.variants.map((variant: any, index: number) => {
                        const columnKeys: string[] = Array.from(
                          new Set(
                            editingProduct.variants.flatMap((v: any) => Object.keys(v.option_values || {}))
                          )
                        );
                        return (
                          <div key={`edit-variant-${index}`} className="grid grid-cols-12 gap-2 items-center bg-muted/20 p-2 rounded-lg border border-border/50">
                            <div className="col-span-4 grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(1, columnKeys.length)}, minmax(0, 1fr))` }}>
                              {columnKeys.length > 0 ? (
                                columnKeys.map((key: string) => (
                                  <input
                                    key={`edit-${index}-${key}`}
                                    type="text"
                                    placeholder={key}
                                    value={variant.option_values?.[key] || ""}
                                    onChange={(e) => {
                                      const newOptions = { ...(variant.option_values || {}), [key]: e.target.value };
                                      handleEditVariantChange(index, "option_values", newOptions);
                                    }}
                                    className="p-2 bg-card border border-border rounded text-xs outline-none focus:border-accent"
                                  />
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground px-2">Default</span>
                              )}
                            </div>
                            <input
                              type="text"
                              placeholder="SKU"
                              value={variant.sku || ""}
                              onChange={(e) => handleEditVariantChange(index, "sku", e.target.value)}
                              className="col-span-3 p-2 bg-card border border-border rounded text-xs outline-none focus:border-accent"
                            />
                            <input
                              type="number"
                              placeholder="Price"
                              value={variant.price || ""}
                              onChange={(e) => handleEditVariantChange(index, "price", e.target.value)}
                              className="col-span-2 p-2 bg-card border border-border rounded text-xs outline-none focus:border-accent"
                            />
                            <input
                              type="number"
                              placeholder="Stock"
                              value={variant.stock_quantity || ""}
                              onChange={(e) => handleEditVariantChange(index, "stock_quantity", e.target.value)}
                              className="col-span-2 p-2 bg-card border border-border rounded text-xs outline-none focus:border-accent"
                            />
                            <button
                              type="button"
                              onClick={() => removeEditVariantRow(index)}
                              className="col-span-1 text-destructive hover:text-destructive/80 transition-colors flex justify-center"
                            >
                              <Trash2 size={14} />
                            </button>

                            {/* Variant Images Area */}
                            <div className="col-span-12 mt-2 pt-2 border-t border-border/30">
                              <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase mr-2">Images:</span>
                                {variant.images?.map((imgObj: any) => (
                                  <div key={imgObj.id} className="relative group">
                                    <img src={imgObj.image} alt="" className="w-10 h-10 object-cover rounded border border-border" />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveExistingVariantImage(variant.id, imgObj.id)}
                                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ))}
                                {editVariantNewImages[index]?.map((file, fidx) => (
                                  <div key={`new-${index}-${fidx}`} className="relative group">
                                    <ImagePreview file={file} className="w-10 h-10 object-cover rounded border border-primary/30" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditVariantNewImages(prev => ({
                                          ...prev,
                                          [index]: prev[index].filter((_, i) => i !== fidx)
                                        }));
                                      }}
                                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ))}
                                <label className="w-10 h-10 flex items-center justify-center rounded border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                                  <Plus size={14} className="text-muted-foreground" />
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files || []);
                                      const validFiles = files.filter(f => isValidImageFile(f));
                                      setEditVariantNewImages(prev => ({
                                        ...prev,
                                        [index]: [...(prev[index] || []), ...validFiles]
                                      }));
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {editingProduct.variants?.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-2 italic">
                      * Base price and total stock will be automatically updated based on variants.
                    </p>
                  )}
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

        {/* Edit Offer Modal */}
        {isEditOfferModalOpen && editingOffer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-2xl shadow-lift w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-border bg-muted flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Edit Offer</h2>
                  <p className="text-xs text-muted-foreground mt-1">Update promotional details</p>
                </div>
                <button
                  onClick={() => setIsEditOfferModalOpen(false)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateOfferMutation.mutate({ id: editingOffer.id, data: editingOffer });
                  setIsEditOfferModalOpen(false);
                }}
                className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar"
              >
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1">Offer Title</label>
                  <input
                    type="text"
                    required
                    value={editingOffer.title}
                    onChange={(e) => setEditingOffer({ ...editingOffer, title: e.target.value })}
                    className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1">Discount Percentage (%)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={editingOffer.discount_percent}
                    onChange={(e) => setEditingOffer({ ...editingOffer, discount_percent: e.target.value })}
                    className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1">Start Date</label>
                    <DateTimePicker
                      type="date"
                      value={editingOffer.start_date}
                      onChange={(val) => setEditingOffer({ ...editingOffer, start_date: val })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1">End Date</label>
                    <DateTimePicker
                      type="date"
                      value={editingOffer.end_date}
                      onChange={(val) => setEditingOffer({ ...editingOffer, end_date: val })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1">Apply to Products</label>
                  <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-2 bg-muted/50 custom-scrollbar">
                    {products.filter((p: any) => p.is_active).map((product: any) => (
                      <label key={product.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={editingOffer.products.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingOffer({ ...editingOffer, products: [...editingOffer.products, product.id] });
                            } else {
                              setEditingOffer({ ...editingOffer, products: editingOffer.products.filter((id: number) => id !== product.id) });
                            }
                          }}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary/20 bg-background"
                        />
                        <span className="text-sm font-medium text-foreground line-clamp-1 flex-1">{product.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-border flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditOfferModalOpen(false)}
                    className="px-6 py-2.5 border border-border text-muted-foreground rounded-full font-bold uppercase tracking-widest hover:bg-muted transition-colors text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateOfferMutation.isPending || editingOffer.products.length === 0}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors text-xs disabled:opacity-50"
                  >
                    {updateOfferMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Create Coupon Modal */}
        {isCreateCouponModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-2xl shadow-lift w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
                  <p className="text-xs text-muted-foreground mt-1">Design a discount restricted to your products</p>
                </div>
                <button
                  onClick={() => setIsCreateCouponModalOpen(false)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (new Date(newCoupon.start_datetime) >= new Date(newCoupon.end_datetime)) {
                    toast.error('End date/time must be strictly after start date/time.');
                    return;
                  }
                  if (newCoupon.discount_type === 'percentage' && (Number(newCoupon.discount_value) <= 0 || Number(newCoupon.discount_value) > 100)) {
                    toast.error('Percentage discount must be between 1 and 100.');
                    return;
                  }
                  const payload = {
                    ...newCoupon,
                    discount_value: Number(newCoupon.discount_value),
                    limit_per_user: Number(newCoupon.limit_per_user),
                    min_purchase_amount: Number(newCoupon.min_purchase_amount),
                    max_usages: newCoupon.max_usages ? Number(newCoupon.max_usages) : null,
                    max_discount_cap: newCoupon.max_discount_cap ? Number(newCoupon.max_discount_cap) : null,
                  };
                  if (editingCoupon) {
                    updateCouponMutation.mutate({ id: editingCoupon.id, data: payload });
                  } else {
                    createCouponMutation.mutate(payload);
                  }
                  setIsCreateCouponModalOpen(false);
                  setEditingCoupon(null);
                }}
                className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar"
              >
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FESTIVE20"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                    className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all font-mono uppercase tracking-wider"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1">Discount Type</label>
                    <select
                      value={newCoupon.discount_type}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                      className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                    >
                      <option value="rupee">Flat Rupee (₹)</option>
                      <option value="percentage">Percentage (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1">Discount Value</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      placeholder={newCoupon.discount_type === 'percentage' ? "e.g. 15" : "e.g. 150"}
                      value={newCoupon.discount_value}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                      className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                    />
                  </div>
                </div>

                {newCoupon.discount_type === 'percentage' && (
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1">Maximum Discount Cap (₹, Optional)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 500"
                      value={newCoupon.max_discount_cap}
                      onChange={(e) => setNewCoupon({ ...newCoupon, max_discount_cap: e.target.value })}
                      className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1">Start Date & Time</label>
                    <DateTimePicker
                      type="datetime-local"
                      value={newCoupon.start_datetime}
                      onChange={(val) => setNewCoupon({ ...newCoupon, start_datetime: val })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1">End Date & Time</label>
                    <DateTimePicker
                      type="datetime-local"
                      value={newCoupon.end_datetime}
                      onChange={(val) => setNewCoupon({ ...newCoupon, end_datetime: val })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">Limit Per User</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newCoupon.limit_per_user}
                      onChange={(e) => setNewCoupon({ ...newCoupon, limit_per_user: e.target.value })}
                      className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">Total Max Uses</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Optional"
                      value={newCoupon.max_usages}
                      onChange={(e) => setNewCoupon({ ...newCoupon, max_usages: e.target.value })}
                      className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">Min Subtotal (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={newCoupon.min_purchase_amount}
                      onChange={(e) => setNewCoupon({ ...newCoupon, min_purchase_amount: e.target.value })}
                      className="w-full p-3 bg-muted border border-border rounded-lg outline-none focus:border-accent transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1">Apply to Specific Products</label>
                  <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-2 bg-muted/50 custom-scrollbar">
                    {products.filter((p: any) => p.is_active).length === 0 ? (
                      <p className="text-xs text-muted-foreground p-2">No active products available.</p>
                    ) : (
                      products.filter((p: any) => p.is_active).map((product: any) => (
                        <label key={product.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={newCoupon.products.includes(product.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewCoupon({ ...newCoupon, products: [...newCoupon.products, product.id] });
                              } else {
                                setNewCoupon({ ...newCoupon, products: newCoupon.products.filter(id => id !== product.id) });
                              }
                            }}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary/20 bg-background"
                          />
                          <span className="text-sm font-medium text-foreground line-clamp-1 flex-1">{product.name}</span>
                          <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                            ₹{parseFloat(product.price).toLocaleString()}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    * Leave unchecked to apply to all your active products in the cart.
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsCreateCouponModalOpen(false); setEditingCoupon(null); }}
                    className="px-4 py-2 border border-border rounded-lg text-sm font-bold text-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createCouponMutation.isPending || updateCouponMutation.isPending}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {createCouponMutation.isPending || updateCouponMutation.isPending ? 'Saving...' : editingCoupon ? 'Update' : 'Create'}
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
