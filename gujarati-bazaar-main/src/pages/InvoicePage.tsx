import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import logo from '@/assets/logo.jpeg';

// Helper to convert number to words (Indian Rupees Format)
function numberToWords(num: number): string {
  const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  const rounded = Math.round(num * 100) / 100;
  if (rounded === 0) return 'zero rupees only';
  
  const intPart = Math.floor(rounded);
  const decPart = Math.round((rounded - intPart) * 100);

  const convert = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + 'hundred ' + (n % 100 ? 'and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + 'thousand ' + (n % 1000 ? convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + 'lakh ' + (n % 100000 ? convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + 'crore ' + (n % 10000000 ? convert(n % 10000000) : '');
  };

  let words = convert(intPart) + 'rupees';
  if (decPart > 0) {
    words += ' and ' + convert(decPart) + 'paise';
  }
  return words.trim().replace(/\s+/g, ' ') + ' only';
}

function getBuyerState(address: string): string {
  if (!address) return "Gujarat";
  const lines = address.split('\n');
  const lastLine = lines[lines.length - 1] || "";
  const match = lastLine.match(/,\s*([A-Za-z\s]+?)\s*-\s*\d+/);
  if (match) return match[1].trim();
  const parts = lastLine.split(',');
  if (parts.length >= 2) return parts[1].split('-')[0].trim();
  return "Gujarat";
}

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

  useEffect(() => {
    if (order && !loading) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('download') === 'true') {
        const timer = setTimeout(() => {
          handleDownloadPDF();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [order, loading]);

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

  // Calculate buyer state and platform state
  const buyerState = getBuyerState(order.address);
  const isPlatformSameState = buyerState.toLowerCase().trim() === "gujarat";

  // Calculations
  const discount = parseFloat(order.discount_amount || '0');
  
  // Distribute discount proportionally across items based on final price snapshot
  const rawSubtotal = order.items.reduce((sum: number, item: any) => {
    const itemFinalPrice = parseFloat(item.price_snapshot || item.price || '0');
    return sum + (itemFinalPrice * item.quantity);
  }, 0) || 1; // avoid divide by zero

  const formattedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const displayPlatformFee = parseFloat(order.platform_fee || '0');
  const platformFeeGst = parseFloat(order.platform_fee_gst || '0');
  const displayShippingFee = parseFloat(order.shipping_charge || '0');
  const shippingFeeGst = parseFloat(order.shipping_charge_gst || '0');

  const displayGrandTotal = parseFloat(order.total_price || '0');

  // Platform and shipping GST rates
  const platformGstRate = displayPlatformFee > 0 ? (platformFeeGst / displayPlatformFee) * 100 : 18.0;
  const shippingGstRate = displayShippingFee > 0 ? (shippingFeeGst / displayShippingFee) * 100 : 18.0;

  const tableItems = order.items.map((item: any, idx: number) => {
    const gstRate = parseFloat(item.gst_rate || '18');
    const itemFinalPrice = parseFloat(item.price_snapshot || item.price || '0');
    const itemQty = item.quantity;
    
    // Proportional discount distribution
    const itemShare = (itemFinalPrice * itemQty) / rawSubtotal;
    const itemDiscount = discount * itemShare;
    const itemFinalPriceAfterDiscount = itemFinalPrice - (itemDiscount / itemQty);

    // Extract product GST correctly and dynamically
    const itemBasePrice = itemFinalPriceAfterDiscount / (1 + gstRate / 100);
    const itemTotalGst = (itemFinalPriceAfterDiscount - itemBasePrice) * itemQty;
    const itemTotalBase = itemBasePrice * itemQty;
    const itemTotalFinal = itemFinalPriceAfterDiscount * itemQty;

    // Check same state for product vendor state vs buyer state
    const vendorState = item.vendor_state || 'Gujarat';
    const isProductSameState = buyerState.toLowerCase().trim() === vendorState.toLowerCase().trim();

    return {
      slNo: idx + 1,
      description: item.product_name_snapshot || item.product_details?.name,
      variant: item.variant_options_snapshot,
      seller: item.vendor_shop_snapshot || item.vendor_shop || 'Independent Merchant',
      unitPrice: itemBasePrice,
      discount: itemDiscount / itemQty,
      qty: itemQty,
      netAmount: itemTotalBase,
      taxRate: gstRate,
      taxType: isProductSameState ? 'CGST + SGST' : 'IGST',
      taxAmount: itemTotalGst,
      totalAmount: itemTotalFinal
    };
  });

  // Dynamically calculate tax splits to match table items and config fees exactly
  let finalCgst = 0;
  let finalSgst = 0;
  let finalIgst = 0;

  tableItems.forEach((it: any) => {
    if (it.taxType === 'CGST + SGST') {
      finalCgst += it.taxAmount / 2;
      finalSgst += it.taxAmount / 2;
    } else {
      finalIgst += it.taxAmount;
    }
  });

  // Add platform fee GST splits
  if (isPlatformSameState) {
    finalCgst += platformFeeGst / 2;
    finalSgst += platformFeeGst / 2;
  } else {
    finalIgst += platformFeeGst;
  }

  // Add shipping fee GST splits
  if (isPlatformSameState) {
    finalCgst += shippingFeeGst / 2;
    finalSgst += shippingFeeGst / 2;
  } else {
    finalIgst += shippingFeeGst;
  }

  const netBaseSubtotal = tableItems.reduce((sum: number, it: any) => sum + it.netAmount, 0);

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-8 md:py-12 px-4 print:bg-white print:py-0 print:px-0 font-sans text-xs text-slate-800">
      <div className="max-w-4xl mx-auto bg-white border border-[#E8D5BC] rounded-2xl shadow-card p-6 md:p-10 print:border-none print:shadow-none print:p-0" id="printable-invoice">
        
        {/* Action Header (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-[#E8D5BC] print:hidden w-full">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-sm font-bold text-[#5C2E0A]/60 hover:text-[#5C2E0A] transition-colors"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          
          <button 
            onClick={handleDownloadPDF} 
            disabled={pdfLoading}
            className="flex items-center gap-2 bg-[#5C2E0A] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md hover:bg-[#5C2E0A]/90 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {pdfLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating Invoice...
              </>
            ) : (
              <>
                📄 Download PDF Invoice
              </>
            )}
          </button>
        </div>

        {/* Brand Header & Invoice Type */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Brand Logo" className="h-14 object-contain" />
          </div>
          <div className="text-right">
            <h1 className="text-lg font-black uppercase text-slate-800 font-display">Tax Invoice/Bill of Supply/Cash Memo</h1>
            <p className="text-[10px] text-slate-500 font-semibold">(Original for Recipient)</p>
          </div>
        </div>

        {/* Address and Tax Info Section (Amazon style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-slate-200">
          <div>
            <h3 className="font-extrabold uppercase text-slate-400 text-[10px] tracking-wider mb-1">Sold By :</h3>
            <p className="font-bold text-slate-800">Gujju Ni Dukan Operator</p>
            <p className="text-slate-600 leading-relaxed">
              123 Gujarati Bazaar Complex,<br />
              Ashram Road, Ahmedabad,<br />
              GUJARAT, 380009, IN
            </p>
            <p className="mt-2 font-medium">GSTIN: <span className="font-mono text-slate-700">24AAECR0564M1Z9</span></p>
            <p className="font-medium">PAN: <span className="font-mono text-slate-700">AAECR0564M</span></p>
          </div>
          <div>
            <h3 className="font-extrabold uppercase text-slate-400 text-[10px] tracking-wider mb-1">Billing Address :</h3>
            <p className="font-bold text-slate-800">{order.buyer_name || 'Valued Customer'}</p>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{order.address}</p>
            <p className="mt-2 font-medium">State/UT Code: <span className="font-semibold text-slate-700">{buyerState}</span></p>
          </div>
          <div>
            <h3 className="font-extrabold uppercase text-slate-400 text-[10px] tracking-wider mb-1">Shipping Address :</h3>
            <p className="font-bold text-slate-800">{order.buyer_name || 'Valued Customer'}</p>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{order.address}</p>
            <p className="mt-2 font-medium">State/UT Code: <span className="font-semibold text-slate-700">{buyerState}</span></p>
            <p className="font-medium">Place of supply: <span className="font-semibold text-slate-700">{buyerState}</span></p>
            <p className="font-medium">Place of delivery: <span className="font-semibold text-slate-700">{buyerState}</span></p>
          </div>
        </div>

        {/* Invoice and Order Reference details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Order Number</p>
            <p className="font-bold text-slate-800 font-mono">{order.razorpay_order_id || `GJB-ORD-${order.id}`}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Order Date</p>
            <p className="font-bold text-slate-800">{formattedDate}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Invoice Number</p>
            <p className="font-bold text-slate-800 font-mono">GJB-INV-{order.id}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Invoice Date</p>
            <p className="font-bold text-slate-800">{formattedDate}</p>
          </div>
        </div>

        {/* Detailed Item Breakdown Table */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                <th className="py-2 px-3 text-center border-r border-slate-200 w-10">SI. No</th>
                <th className="py-2 px-3 border-r border-slate-200">Description</th>
                <th className="py-2 px-3 text-right border-r border-slate-200 w-24">Unit Price (Base)</th>
                <th className="py-2 px-3 text-right border-r border-slate-200 w-20">Discount</th>
                <th className="py-2 px-3 text-center border-r border-slate-200 w-12">Qty</th>
                <th className="py-2 px-3 text-right border-r border-slate-200 w-24">Net Amount</th>
                <th className="py-2 px-3 text-right border-r border-slate-200 w-20">Tax Rate</th>
                <th className="py-2 px-3 text-center border-r border-slate-200 w-24">Tax Type</th>
                <th className="py-2 px-3 text-right border-r border-slate-200 w-20">Tax Amount</th>
                <th className="py-2 px-3 text-right w-24">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {tableItems.map((item: any) => (
                <tr key={item.slNo} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-3 px-3 text-center border-r border-slate-100 font-medium text-slate-500">{item.slNo}</td>
                  <td className="py-3 px-3 border-r border-slate-100">
                    <p className="font-bold text-slate-800">{item.description}</p>
                    {item.variant && (
                      <p className="text-[10px] text-slate-400 mt-0.5">Variant: {item.variant}</p>
                    )}
                    <p className="text-[10px] text-slate-500 mt-1">Seller: <span className="font-semibold">{item.seller}</span></p>
                  </td>
                  <td className="py-3 px-3 text-right border-r border-slate-100">₹{item.unitPrice.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right border-r border-slate-100 text-slate-400">₹{item.discount.toFixed(2)}</td>
                  <td className="py-3 px-3 text-center border-r border-slate-100 font-bold">{item.qty}</td>
                  <td className="py-3 px-3 text-right border-r border-slate-100">₹{item.netAmount.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right border-r border-slate-100">{item.taxRate.toFixed(1)}%</td>
                  <td className="py-3 px-3 text-center border-r border-slate-100 text-[10px] text-slate-500">{item.taxType}</td>
                  <td className="py-3 px-3 text-right border-r border-slate-100 font-medium text-slate-700">
                    {item.taxType === 'CGST + SGST' ? (
                      `₹${(item.taxAmount / 2).toFixed(2)} + ₹${(item.taxAmount / 2).toFixed(2)}`
                    ) : (
                      `₹${item.taxAmount.toFixed(2)}`
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-800">₹{item.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
              
              {/* Platform Service Fee Row */}
              {displayPlatformFee > 0 && (
                <tr className="border-b border-slate-100 bg-slate-50/10">
                  <td className="py-2 px-3 text-center border-r border-slate-100 font-medium text-slate-400">-</td>
                  <td className="py-2 px-3 border-r border-slate-100">
                    <p className="font-bold text-slate-700">Platform Marketplace Fee</p>
                    <p className="text-[10px] text-slate-400">Convenience and transaction hosting fee</p>
                  </td>
                  <td className="py-2 px-3 text-right border-r border-slate-100">₹{displayPlatformFee.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right border-r border-slate-100 text-slate-400">₹0.00</td>
                  <td className="py-2 px-3 text-center border-r border-slate-100 font-bold">1</td>
                  <td className="py-2 px-3 text-right border-r border-slate-100">₹{displayPlatformFee.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right border-r border-slate-100">{platformGstRate.toFixed(1)}%</td>
                  <td className="py-2 px-3 text-center border-r border-slate-100 text-[10px] text-slate-500">{isPlatformSameState ? 'CGST + SGST' : 'IGST'}</td>
                  <td className="py-2 px-3 text-right border-r border-slate-100 font-medium text-slate-700">
                    {isPlatformSameState ? (
                      `₹${(platformFeeGst / 2).toFixed(2)} + ₹${(platformFeeGst / 2).toFixed(2)}`
                    ) : (
                      `₹${platformFeeGst.toFixed(2)}`
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-700">₹{(displayPlatformFee + platformFeeGst).toFixed(2)}</td>
                </tr>
              )}

              {/* Shipping Charges Row */}
              {displayShippingFee > 0 && (
                <tr className="border-b border-slate-100 bg-slate-50/10">
                  <td className="py-2 px-3 text-center border-r border-slate-100 font-medium text-slate-400">-</td>
                  <td className="py-2 px-3 border-r border-slate-100">
                    <p className="font-bold text-slate-700">Shipping Charges</p>
                    <p className="text-[10px] text-slate-400">Delivery service and handling</p>
                  </td>
                  <td className="py-2 px-3 text-right border-r border-slate-100">₹{displayShippingFee.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right border-r border-slate-100 text-slate-400">₹0.00</td>
                  <td className="py-2 px-3 text-center border-r border-slate-100 font-bold">1</td>
                  <td className="py-2 px-3 text-right border-r border-slate-100">₹{displayShippingFee.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right border-r border-slate-100">{shippingGstRate.toFixed(1)}%</td>
                  <td className="py-2 px-3 text-center border-r border-slate-100 text-[10px] text-slate-500">{isPlatformSameState ? 'CGST + SGST' : 'IGST'}</td>
                  <td className="py-2 px-3 text-right border-r border-slate-100 font-medium text-slate-700">
                    {isPlatformSameState ? (
                      `₹${(shippingFeeGst / 2).toFixed(2)} + ₹${(shippingFeeGst / 2).toFixed(2)}`
                    ) : (
                      `₹${shippingFeeGst.toFixed(2)}`
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-700">₹{(displayShippingFee + shippingFeeGst).toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary footer with Splits & Amount in Words */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Amount in words & digital signature */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Amount in Words</span>
              <p className="font-bold text-slate-800 capitalize leading-relaxed">{numberToWords(displayGrandTotal)}</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-wider pl-1">
              <CheckCircle2 size={14} className="text-emerald-600" /> Digitally Signed Verified Invoice
            </div>
          </div>
          
          {/* Detailed Totals breakdown list */}
          <div className="w-full space-y-2.5 text-sm border border-slate-100 p-4 rounded-lg bg-slate-50/50">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Total Net Amount (Base) :</span>
              <span className="font-bold text-slate-800">₹{(netBaseSubtotal + displayPlatformFee + displayShippingFee).toFixed(2)}</span>
            </div>

            <div className="border-t border-slate-300 pt-2.5 flex justify-between text-slate-800 font-black text-base font-display">
              <span>Grand Total :</span>
              <span className="text-[#5C2E0A] text-lg font-bold">₹{displayGrandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Invoice Legal Declarations */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400 font-medium">
          <p>Thank you for supporting regional artisans and vendors at Gujju Ni Dukan!</p>
          <p className="mt-1">For support, queries, or returns please email support@gujaratibazaar.com</p>
        </div>

      </div>
    </div>
  );
}
