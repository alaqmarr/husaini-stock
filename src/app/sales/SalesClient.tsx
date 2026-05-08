"use client";

import { useState, useEffect } from "react";
import { getSales, createSale } from "@/app/actions/sales";
import { getCustomers } from "@/app/actions/customers";
import { getProducts } from "@/app/actions/products";
import { useAlert } from "@/components/AlertProvider";
import { ShoppingCart, Plus, CheckCircle, Clock, Download } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SalesClient({ sales, customers, products }: { sales: any[], customers: any[], products: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showAlert } = useAlert();

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [cartonsSold, setCartonsSold] = useState<number | "">("");
  const [overrideRatePerScrew, setOverrideRatePerScrew] = useState<number | "">("");
  const [remarks, setRemarks] = useState("");
  const [hasGst, setHasGst] = useState(false);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const isNegativeStock = selectedProduct && Number(cartonsSold) > selectedProduct.currentCartons;

  // Order Preview Calculation
  let currentRate = 0;
  if (overrideRatePerScrew && Number(overrideRatePerScrew) > 0) {
    currentRate = Number(overrideRatePerScrew);
  } else if (selectedCustomerId && selectedProductId) {
    const cust = customers.find(c => c.id === selectedCustomerId);
    const priceObj = cust?.prices?.find((p: any) => p.productId === selectedProductId);
    if (priceObj) {
      currentRate = priceObj.ratePerScrew;
    }
  }

  let subtotal = 0;
  if (selectedProduct && cartonsSold && Number(cartonsSold) > 0 && currentRate > 0) {
    const totalScrews = Number(cartonsSold) * selectedProduct.boxesPerCarton * selectedProduct.screwsPerBox;
    subtotal = totalScrews * currentRate;
  }

  const taxAmount = hasGst ? subtotal * 0.18 : 0;
  const totalAmount = subtotal + taxAmount;

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedProductId || !cartonsSold) return;
    
    const res = await createSale({ 
      customerId: selectedCustomerId,
      hasGst,
      items: [{ 
        productId: selectedProductId, 
        cartonsSold: Number(cartonsSold),
        overrideRatePerScrew: overrideRatePerScrew ? Number(overrideRatePerScrew) : undefined,
        remarks: isNegativeStock ? remarks : undefined
      }]
    });
    
    if (res.success) {
      showAlert('success', 'Sale Recorded', `Sale recorded successfully!`);
      setIsModalOpen(false);
      setSelectedCustomerId("");
      setSelectedProductId("");
      setCartonsSold("");
      setOverrideRatePerScrew("");
      setRemarks("");
      setHasGst(false);
    } else {
      showAlert('error', 'Sale Failed', res.error);
    }
  };

  const generateWhatsAppLink = (sale: any) => {
    if (!sale.customer.phone) {
      showAlert('error', 'No Phone', 'Customer has no phone number recorded.');
      return;
    }
    const itemsDetails = sale.items.map((item: any) => 
      `- ${item.cartonsSold}x ${item.product.name} (@ ₹${item.ratePerScrew}/screw)`
    ).join('\n');

    let msg = "";
    if (sale.hasGst) {
      const subtotal = sale.totalAmount - sale.gstAmount;
      msg = `Hello ${sale.customer.name},\n\nYour order has been recorded:\n*Date:* ${format(new Date(sale.date), "dd MMM yyyy, HH:mm")}\n\n*Items:*\n${itemsDetails}\n\n*Subtotal:* ₹${subtotal.toLocaleString('en-IN')}\n*GST (18%):* ₹${sale.gstAmount.toLocaleString('en-IN')}\n*Total Amount:* ₹${sale.totalAmount.toLocaleString('en-IN')}\n*Payment Status:* ${sale.paymentStatus}\n\n*Current Outstanding Balance:* ₹${sale.customer.balance.toLocaleString('en-IN')}\n\nThank you for your business!`;
    } else {
      msg = `Hello ${sale.customer.name},\n\nYour order has been recorded:\n*Date:* ${format(new Date(sale.date), "dd MMM yyyy, HH:mm")}\n\n*Items:*\n${itemsDetails}\n\n*Total Amount:* ₹${sale.totalAmount.toLocaleString('en-IN')}\n*Payment Status:* ${sale.paymentStatus}\n\n*Current Outstanding Balance:* ₹${sale.customer.balance.toLocaleString('en-IN')}\n\nThank you for your business!`;
    }
    const phone = sale.customer.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const downloadInvoice = (sale: any) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("INVOICE", 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Date: ${format(new Date(sale.date), "dd MMM yyyy, HH:mm")}`, 14, 30);
    doc.text(`Customer: ${sale.customer.name}`, 14, 35);
    if (sale.customer.phone) doc.text(`Phone: ${sale.customer.phone}`, 14, 40);
    
    const tableData = sale.items.map((item: any) => [
      item.product.name,
      item.cartonsSold.toString(),
      `Rs. ${item.ratePerScrew.toFixed(2)}`,
      `Rs. ${(item.cartonsSold * item.product.boxesPerCarton * item.product.screwsPerBox * item.ratePerScrew).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Product', 'Cartons', 'Rate/Screw', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 50;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    
    if (sale.hasGst) {
      const subtotal = sale.totalAmount - sale.gstAmount;
      doc.text(`Subtotal: Rs. ${subtotal.toLocaleString('en-IN')}`, 14, finalY + 10);
      doc.text(`GST (18%): Rs. ${sale.gstAmount.toLocaleString('en-IN')}`, 14, finalY + 16);
      doc.text(`Total Amount: Rs. ${sale.totalAmount.toLocaleString('en-IN')}`, 14, finalY + 22);
      doc.text(`Payment Status: ${sale.paymentStatus}`, 14, finalY + 28);
    } else {
      doc.text(`Total Amount: Rs. ${sale.totalAmount.toLocaleString('en-IN')}`, 14, finalY + 10);
      doc.text(`Payment Status: ${sale.paymentStatus}`, 14, finalY + 16);
    }

    // Save PDF
    const slugifiedName = sale.customer.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    doc.save(`Invoice_${slugifiedName}_${format(new Date(sale.date), "yyyyMMdd")}.pdf`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600   bg-clip-text text-transparent">Sales</h1>
          <p className="text-slate-500 mt-1">Record new sales and notify customers via WhatsApp.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/30 transition-all"
        >
          <Plus className="w-5 h-5" />
          New Sale
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600 ">
          <thead className="bg-slate-50/50  border-b border-slate-200 ">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-900 ">Date</th>
              <th className="px-6 py-4 font-semibold text-slate-900 ">Customer</th>
              <th className="px-6 py-4 font-semibold text-slate-900 ">Items Details</th>
              <th className="px-6 py-4 font-semibold text-slate-900 ">Total Amount</th>
              <th className="px-6 py-4 font-semibold text-slate-900 ">Payment Status</th>
              <th className="px-6 py-4 font-semibold text-slate-900  text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No sales recorded yet.</td></tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id} className="border-b border-slate-100  hover:bg-slate-50/50 :bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(new Date(sale.date), "dd MMM yyyy, HH:mm")}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 ">
                    {sale.customer.name}
                  </td>
                  <td className="px-6 py-4">
                    {sale.items.map((item: any) => (
                      <div key={item.id} className="text-xs">
                        {item.cartonsSold}x {item.product.name} (@ ₹{item.ratePerScrew}/screw)
                      </div>
                    ))}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 ">
                    ₹{sale.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    {sale.paymentStatus === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800  ">
                        <Clock className="w-3.5 h-3.5" /> PENDING
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800  ">
                        <CheckCircle className="w-3.5 h-3.5" /> PAID
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => generateWhatsAppLink(sale)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 transition-colors bg-green-50 px-3 py-1.5 rounded-lg   :text-green-300"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                      Send WhatsApp
                    </button>
                    <button
                      onClick={() => downloadInvoice(sale)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg ml-2"
                      title="Download Invoice"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Sale Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900  mb-4">Record New Sale</h2>
            <form onSubmit={handleCreateSale}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 ">Select Customer</label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200  bg-white/50  focus:ring-2 focus:ring-primary/50 outline-none transition-all text-slate-900 "
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 ">Select Product</label>
                  <select
                    required
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200  bg-white/50  focus:ring-2 focus:ring-primary/50 outline-none transition-all text-slate-900 "
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.currentCartons} cartons in stock)</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700 ">Quantity (Cartons)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={cartonsSold}
                      onChange={(e) => setCartonsSold(Number(e.target.value) || "")}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200  bg-white/50  focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                      placeholder="e.g. 5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700 ">Rate per Screw (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={overrideRatePerScrew}
                      onChange={(e) => setOverrideRatePerScrew(Number(e.target.value) || "")}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200  bg-white/50  focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                      placeholder="Optional override"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 bg-white/50 border border-slate-200 p-3 rounded-xl">
                  <input
                    type="checkbox"
                    id="gstCheckbox"
                    checked={hasGst}
                    onChange={(e) => setHasGst(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                  />
                  <label htmlFor="gstCheckbox" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Include 18% GST
                  </label>
                </div>
                
                {isNegativeStock && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700 ">Remarks / Borrow Notes</label>
                    <input
                      type="text"
                      required
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-orange-300 bg-orange-50 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-orange-900"
                      placeholder="e.g. Borrowed 2 cartons from supplier X"
                    />
                    <p className="text-xs text-orange-600 mt-1">This sale will result in negative stock. Please add a note.</p>
                  </div>
                )}
                
                {/* Note for the user based on previous feedback */}
                <div className="bg-yellow-50  p-3 rounded-xl border border-yellow-100  text-sm text-yellow-800  flex items-start gap-2 mt-2">
                  <ShoppingCart className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>If you leave Rate blank, it uses the customer's preset rate. If you enter a new Rate, it will be saved for this customer automatically.</p>
                </div>

                {/* Order Preview */}
                {subtotal > 0 && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Subtotal:</span>
                      <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {hasGst && (
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>GST (18%):</span>
                        <span>₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Amount:</span>
                      <span>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}

              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100  :bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/30 transition-all"
                >
                  Confirm Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
