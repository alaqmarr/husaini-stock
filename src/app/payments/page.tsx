"use client";

import { useState, useEffect } from "react";
import { getPayments, getPendingPayments, createPayment, markPaymentCompleted } from "@/app/actions/payments";
import { getCustomers } from "@/app/actions/customers";
import { useAlert } from "@/components/AlertProvider";
import { Wallet, Plus, CheckCircle, Clock, Filter } from "lucide-react";
import { format } from "date-fns";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewFilter, setViewFilter] = useState<'ALL' | 'PENDING'>('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showAlert } = useAlert();

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState("CASH");
  const [status, setStatus] = useState("COMPLETED");

  useEffect(() => {
    fetchData();
  }, [viewFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    let payData;
    if (viewFilter === 'PENDING') {
      payData = await getPendingPayments();
    } else {
      payData = await getPayments();
    }
    const custData = await getCustomers();
    
    setPayments(payData);
    setCustomers(custData);
    setIsLoading(false);
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !amount) return;
    
    const res = await createPayment({ 
      customerId: selectedCustomerId,
      amount: Number(amount),
      method,
      status
    });
    
    if (res.success) {
      showAlert('success', 'Payment Recorded', `Payment recorded successfully!`);
      setIsModalOpen(false);
      setSelectedCustomerId("");
      setAmount("");
      setMethod("CASH");
      setStatus("COMPLETED");
      fetchData();
    } else {
      showAlert('error', 'Payment Failed', res.error);
    }
  };

  const handleMarkCompleted = async (paymentId: string) => {
    const res = await markPaymentCompleted(paymentId);
    if (res.success) {
      showAlert('success', 'Payment Completed', 'Payment has been cleared and customer balance updated.');
      fetchData();
    } else {
      showAlert('error', 'Error', res.error);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600   bg-clip-text text-transparent">Payments</h1>
          <p className="text-slate-500 mt-1">Record and track customer payments.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/30 transition-all"
        >
          <Plus className="w-5 h-5" />
          Record Payment
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setViewFilter('ALL')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewFilter === 'ALL' ? 'bg-slate-800 text-white  ' : 'bg-slate-200 text-slate-700 hover:bg-slate-300  '}`}
        >
          All Payments
        </button>
        <button
          onClick={() => setViewFilter('PENDING')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewFilter === 'PENDING' ? 'bg-yellow-500 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300  '}`}
        >
          <Clock className="w-4 h-4" />
          Pending Only
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600 ">
          <thead className="bg-slate-50/50  border-b border-slate-200 ">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-900 ">Date</th>
              <th className="px-6 py-4 font-semibold text-slate-900 ">Customer</th>
              <th className="px-6 py-4 font-semibold text-slate-900 ">Method</th>
              <th className="px-6 py-4 font-semibold text-slate-900 ">Amount</th>
              <th className="px-6 py-4 font-semibold text-slate-900 ">Status</th>
              <th className="px-6 py-4 font-semibold text-slate-900  text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading payments...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No payments found.</td></tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="border-b border-slate-100  hover:bg-slate-50/50 :bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(new Date(payment.date), "dd MMM yyyy, HH:mm")}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 ">
                    {payment.customer.name}
                  </td>
                  <td className="px-6 py-4">
                    {payment.method.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 ">
                    ₹{payment.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    {payment.status === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800  ">
                        <Clock className="w-3.5 h-3.5" /> PENDING
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800  ">
                        <CheckCircle className="w-3.5 h-3.5" /> COMPLETED
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {payment.status === 'PENDING' && (
                      <button
                        onClick={() => handleMarkCompleted(payment.id)}
                        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-lg"
                      >
                        Mark Completed
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900  mb-4">Record Payment</h2>
            <form onSubmit={handleCreatePayment}>
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
                      <option key={c.id} value={c.id}>{c.name} (Balance: ₹{c.balance})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 ">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || "")}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200  bg-white/50  focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    placeholder="e.g. 5000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700 ">Method</label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200  bg-white/50  focus:ring-2 focus:ring-primary/50 outline-none transition-all text-slate-900 "
                    >
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="UPI">UPI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700 ">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200  bg-white/50  focus:ring-2 focus:ring-primary/50 outline-none transition-all text-slate-900 "
                    >
                      <option value="COMPLETED">Completed</option>
                      <option value="PENDING">Pending (Uncleared)</option>
                    </select>
                  </div>
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
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
