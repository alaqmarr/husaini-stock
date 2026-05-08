"use client";

import { useState, useEffect } from "react";
import { getCustomers, createCustomer, setCustomerPrice } from "@/app/actions/customers";
import { getProducts } from "@/app/actions/products";
import { useAlert } from "@/components/AlertProvider";
import { Users, Plus, IndianRupee, Settings2, FileText } from "lucide-react";

export default function CustomersClient({ customers, products }: { customers: any[], products: any[] }) {
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  const { showAlert } = useAlert();

  // Form states - Customer
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Form states - Pricing
  const [selectedProductId, setSelectedProductId] = useState("");
  const [ratePerScrew, setRatePerScrew] = useState<number | "">("");

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    
    const res = await createCustomer({ name, phone, address });
    
    if (res.success) {
      showAlert('success', 'Customer Created', `${name} has been added.`);
      setIsModalOpen(false);
      setName("");
      setPhone("");
      setAddress("");
    } else {
      showAlert('error', 'Error', res.error);
    }
  };

  const handleSetPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedProductId || !ratePerScrew) return;
    
    const res = await setCustomerPrice(selectedCustomerId, selectedProductId, Number(ratePerScrew));
    
    if (res.success) {
      showAlert('success', 'Pricing Updated', 'Custom rate applied for customer.');
      setIsPricingModalOpen(false);
      setRatePerScrew("");
      setSelectedProductId("");
    } else {
      showAlert('error', 'Error', res.error);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600   bg-clip-text text-transparent">Customers</h1>
          <p className="text-slate-500 mt-1">Manage accounts, pricing, and ledgers.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/30 transition-all"
        >
          <Plus className="w-5 h-5" />
          New Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">No customers found. Add one to get started.</div>
        ) : (
          customers.map((customer) => (
            <div key={customer.id} className="glass-card p-6 flex flex-col hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 ">{customer.name}</h3>
                    <p className="text-sm text-slate-500">{customer.phone}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-2 mb-4 bg-slate-50  rounded-xl p-4 border border-slate-100 ">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Outstanding Balance</div>
                <div className={`text-2xl font-bold ${customer.balance > 0 ? 'text-red-600 ' : 'text-green-600 '}`}>
                  ₹{customer.balance.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="mt-auto space-y-2">
                <button
                  onClick={() => {
                    setSelectedCustomerId(customer.id);
                    setIsPricingModalOpen(true);
                  }}
                  className="w-full flex justify-center items-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-slate-200  hover:bg-slate-50 :bg-slate-800 transition-colors"
                >
                  <Settings2 className="w-4 h-4" />
                  Custom Rates
                </button>
                <a
                  href={`/ledger/${customer.id}`}
                  className="w-full flex justify-center items-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-slate-100  hover:bg-slate-200 :bg-slate-700 transition-colors text-slate-900 "
                >
                  <FileText className="w-4 h-4" />
                  View Ledger
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900  mb-4">Add New Customer</h2>
            <form onSubmit={handleCreateCustomer}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 ">Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200  bg-white/50  focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 ">Phone Number (WhatsApp)</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200  bg-white/50  focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    placeholder="+91..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 ">Address (Optional)</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200  bg-white/50  focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    rows={2}
                  />
                </div>
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Pricing Modal */}
      {isPricingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900  mb-4">Set Custom Rate</h2>
            <form onSubmit={handleSetPricing}>
              <div className="space-y-4">
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
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 ">Rate per Screw (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      value={ratePerScrew}
                      onChange={(e) => setRatePerScrew(Number(e.target.value) || "")}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200  bg-white/50  focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                      placeholder="e.g. 0.50"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPricingModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100  :bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/30 transition-all"
                >
                  Apply Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
