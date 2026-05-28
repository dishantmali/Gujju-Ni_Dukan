import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Loader2, CheckCircle2, ShoppingBag } from 'lucide-react';
import api from '@/lib/api';

export default function InvoicePage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPDF = () => {
    setPdfLoading(true);
    
    const element = document.getElementById('printable-invoice');
    if (!element) {
      setPdfLoading(false);
      return;
    }
    
    const clone = element.cloneNode(true) as HTMLElement;
    const actionHeader = clone.querySelector('.print-hidden');
    if (actionHeader) {
      actionHeader.remove();
    }
    
    clone.style.padding = '40px';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';

    const triggerGeneration = () => {
      const opt = {
        margin:       0.2,
        filename:     `GJB-Invoice-ORD-${order.id}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      (window as any).html2pdf().from(clone).set(opt).save()
        .then(() => setPdfLoading(false))
        .catch(() => setPdfLoading(false));
    };

    if ((window as any).html2pdf) {
      triggerGeneration();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => {
      triggerGeneration();
    };
    script.onerror = () => {
      setPdfLoading(false);
      window.print();
    };
    document.head.appendChild(script);
  };

  useEffect(() => {
    api.get('/orders/')
      .then((res: any) => {
        const found = res.find((o: any) => o.id === parseInt(orderId || '0'));
        if (found) {
          setOrder(found);
        } else {
          // Fallback if order not found in user list: check admin global orders
          api.get('/admin/orders/')
            .then((adminRes: any) => {
              const adminFound = adminRes.find((o: any) => o.id === parseInt(orderId || '0'));
              if (adminFound) {
                setOrder(adminFound);
              } else {
                navigate('/account');
              }
            })
            .catch(() => navigate('/account'));
        }
      })
      .catch(() => navigate('/account'))
      .finally(() => setLoading(false));
  }, [orderId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6F0]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#E8A020]" />
          <p className="text-sm font-bold text-[#5C2E0A]/60">Loading tax invoice...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  // Calculate pricing breakdown
  const itemsSubtotal = order.items.reduce((sum: number, item: any) => {
    const itemPrice = parseFloat(item.price_snapshot || item.price || '0');
    return sum + (itemPrice * item.quantity);
  }, 0);

  const discount = parseFloat(order.discount_amount || '0');
  const netSubtotal = Math.max(0, itemsSubtotal - discount);

  // Smart reconstruction of Platform Fee & GST
  // In VerifyCartPaymentView, total_price = netSubtotal + platform_fee (5%) + GST (18% on fee)
  // Which is equal to netSubtotal * 1.059
  // In VerifyPaymentView (single product), total_price = netSubtotal only
  const dbTotalPrice = parseFloat(order.total_price || '0');
  const isCartCheckout = Math.abs(dbTotalPrice - netSubtotal) > 1.5;

  let platformFee = 0;
  let gst = 0;
  let finalGrandTotal = 0;

  if (isCartCheckout) {
    const calculatedSubtotalAfterDiscount = dbTotalPrice / 1.059;
    platformFee = calculatedSubtotalAfterDiscount * 0.05;
    gst = platformFee * 0.18;
    finalGrandTotal = dbTotalPrice;
  } else {
    platformFee = netSubtotal * 0.05;
    gst = platformFee * 0.18;
    finalGrandTotal = netSubtotal + platformFee + gst;
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-8 md:py-16 px-4 print:bg-white print:py-0 print:px-0">
      <div className="max-w-4xl mx-auto bg-white border border-[#30 30% 86%] rounded-2xl shadow-card p-6 md:p-12 print:border-none print:shadow-none print:p-0" id="printable-invoice">
        
        {/* Action Header (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-[#30 30% 86%] print:hidden w-full">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-sm font-bold text-[#5C2E0A]/60 hover:text-[#5C2E0A] transition-colors"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          
          <button 
            onClick={handleDownloadPDF} 
            disabled={pdfLoading}
            className="flex items-center gap-2 bg-[#5C2E0A] text-white px-6 py-3 rounded-full font-bold text-sm shadow-md hover:bg-[#5C2E0A]/90 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {pdfLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                📄 Download PDF
              </>
            )}
          </button>
        </div>

        {/* Invoice Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-[#5C2E0A] tracking-wider uppercase font-display">
                GUJJU NI DUKAN
              </span>
            </div>
            <p className="text-xs text-[#5C2E0A]/60 mt-1 font-medium">Premium Warm Earthy Marketplace</p>
            <p className="text-xs text-[#5C2E0A]/60 mt-0.5">Gujarat, India | support@gujaratibazaar.com</p>
          </div>
          <div className="md:text-right">
            <h1 className="text-3xl font-black uppercase text-[#5C2E0A] tracking-tight font-display">Tax Invoice</h1>
            <p className="text-sm font-bold text-[#5C2E0A]/60 mt-1">Invoice #: GJB-ORD-{order.id}</p>
            <p className="text-xs text-[#5C2E0A]/60 mt-0.5">
              Date: {new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}
            </p>
          </div>
        </div>

        {/* Invoice Meta Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 p-6 bg-[#FAF6F0] rounded-xl border border-[#30 30% 86%] print:bg-white print:border print:border-[#30 30% 86%]">
          <div>
            <h3 className="text-xs font-black uppercase text-[#5C2E0A]/40 tracking-wider mb-2">Billed To (Buyer)</h3>
            <p className="font-bold text-[#5C2E0A] text-base">{order.buyer_name || 'Valued Customer'}</p>
            <p className="text-sm text-[#5C2E0A]/80 mt-1.5 leading-relaxed whitespace-pre-wrap">{order.address}</p>
            <p className="text-sm text-[#5C2E0A]/80 mt-1.5 font-semibold">Phone: {order.phone}</p>
            <p className="text-sm text-[#5C2E0A]/80">Email: {order.buyer_email}</p>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-[#5C2E0A]/40 tracking-wider mb-2">Payment Details</h3>
            <p className="font-bold text-[#5C2E0A] text-base">
              Status: <span className="uppercase text-[#142 50% 36%] bg-[#142 50% 36%]/10 px-2.5 py-0.5 rounded font-black text-xs ml-1 print:border print:border-[#142 50% 36%] print:bg-transparent">{order.payment_status}</span>
            </p>
            {order.razorpay_order_id && (
              <p className="text-sm text-[#5C2E0A]/80 mt-2 font-medium">Razorpay Order ID: <span className="font-mono text-xs">{order.razorpay_order_id}</span></p>
            )}
            {order.razorpay_payment_id && (
              <p className="text-sm text-[#5C2E0A]/80 font-medium">Razorpay Payment ID: <span className="font-mono text-xs">{order.razorpay_payment_id}</span></p>
            )}
            <p className="text-sm text-[#5C2E0A]/60 mt-2">Method: Digital Online Payment</p>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="mb-10 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#30 30% 86%] text-xs font-black text-[#5C2E0A]/40 uppercase">
                <th className="py-3 px-2">Item Description</th>
                <th className="py-3 px-2">Store (Vendor)</th>
                <th className="py-3 px-2 text-center">Qty</th>
                <th className="py-3 px-2 text-right">Unit Price</th>
                <th className="py-3 px-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item: any) => {
                const itemPrice = parseFloat(item.price_snapshot || item.price || '0');
                const itemSubtotal = itemPrice * item.quantity;
                return (
                  <tr key={item.id} className="border-b border-[#30 30% 86%]/60 text-sm hover:bg-[#FAF6F0]/20 print:hover:bg-transparent">
                    <td className="py-4 px-2">
                      <p className="font-bold text-[#5C2E0A]">{item.product_name_snapshot || item.product_details?.name}</p>
                      {item.variant_options_snapshot && (
                        <span className="text-xs text-[#5C2E0A]/60 bg-[#FAF6F0] border border-[#30 30% 86%]/65 px-2 py-0.5 rounded mt-1.5 inline-block font-semibold print:bg-white print:border">
                          {item.variant_options_snapshot}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-2 text-[#5C2E0A]/80 font-medium">{item.vendor_shop_snapshot || item.vendor_shop || 'Independent Merchant'}</td>
                    <td className="py-4 px-2 text-center font-bold text-[#5C2E0A]">{item.quantity}</td>
                    <td className="py-4 px-2 text-right text-[#5C2E0A] font-medium">₹{itemPrice.toFixed(2)}</td>
                    <td className="py-4 px-2 text-right font-bold text-[#5C2E0A]">₹{itemSubtotal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary */}
        <div className="flex justify-end">
          <div className="w-full md:w-80 space-y-3.5 text-sm">
            <div className="flex justify-between text-[#5C2E0A]/60 font-medium">
              <span>Subtotal</span>
              <span className="font-bold text-[#5C2E0A]">₹{itemsSubtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600 font-medium">
                <span>Discount ({order.coupon_code || 'COUPON'})</span>
                <span className="font-bold">-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#5C2E0A]/60 font-medium">
              <span>Platform Service Fee (5%)</span>
              <span className="font-bold text-[#5C2E0A]">₹{platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#5C2E0A]/60 font-medium">
              <span>GST (18% on Fee)</span>
              <span className="font-bold text-[#5C2E0A]">₹{gst.toFixed(2)}</span>
            </div>
            <div className="border-t border-[#30 30% 86%] pt-4 flex justify-between text-[#5C2E0A] font-black text-lg font-display">
              <span>Grand Total</span>
              <span className="text-[#E8A020] text-xl">₹{finalGrandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Invoice Footer */}
        <div className="mt-16 pt-8 border-t border-[#30 30% 86%]/60 text-center">
          <div className="flex justify-center items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-2">
            <CheckCircle2 size={14} className="text-emerald-600" /> This is a digitally verified invoice.
          </div>
          <p className="text-xs text-[#5C2E0A]/60 font-medium">Thank you for supporting regional artisans and vendors at Gujju Ni Dukan!</p>
          <p className="text-[10px] text-[#5C2E0A]/40 mt-1">If you have any questions, please contact support@gujaratibazaar.com</p>
        </div>

      </div>
    </div>
  );
}
