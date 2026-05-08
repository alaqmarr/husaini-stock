"use client";

import { useEffect, useState, use } from "react";
import { getCustomerLedger } from "@/app/actions/ledger";
import { useAlert } from "@/components/AlertProvider";
import { FileDown, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function LedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  const [data, setData] = useState<{ customer: any, ledger: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showAlert } = useAlert();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getCustomerLedger(id);
        setData(res);
      } catch (e: any) {
        showAlert('error', 'Error', e.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const generatePDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const { customer, ledger } = data;

    // Header
    doc.setFontSize(20);
    doc.text("Customer Ledger Statement", 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Customer Name: ${customer.name}`, 14, 32);
    doc.text(`Phone: ${customer.phone || 'N/A'}`, 14, 38);
    doc.text(`Address: ${customer.address || 'N/A'}`, 14, 44);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Current Outstanding Balance: Rs. ${customer.balance.toLocaleString('en-IN')}`, 14, 52);

    const tableColumn = ["Date", "Description", "Debit (Rs)", "Credit (Rs)", "Balance (Rs)"];
    const tableRows = ledger.map(entry => [
      format(new Date(entry.date), "dd/MM/yyyy"),
      entry.description,
      entry.debit > 0 ? entry.debit.toLocaleString('en-IN') : "-",
      entry.credit > 0 ? entry.credit.toLocaleString('en-IN') : "-",
      entry.runningBalance.toLocaleString('en-IN')
    ]);

    autoTable(doc, {
      startY: 60,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] } // Primary blue
    });

    const dateStr = format(new Date(), "yyyy-MM-dd");
    const slugifiedName = customer.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    doc.save(`ledger-${slugifiedName}-${dateStr}.pdf`);
    showAlert('success', 'PDF Downloaded', 'Ledger statement has been saved.');
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading ledger...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500">Failed to load ledger data.</div>;
  }

  const { customer, ledger } = data;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-slide-in">
      <div className="mb-6">
        <Link href="/customers" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 :text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600   bg-clip-text text-transparent">
              Ledger: {customer.name}
            </h1>
            <p className="text-slate-500 mt-1">Detailed transaction history</p>
          </div>
          <button
            onClick={generatePDF}
            className="flex items-center gap-2 bg-slate-900  text-white  px-5 py-2.5 rounded-xl font-medium shadow-lg transition-all hover:opacity-90"
          >
            <FileDown className="w-5 h-5" />
            Export to PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 md:col-span-1 border-t-4 border-t-primary">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Current Balance</h3>
          <p className={`text-3xl font-bold ${customer.balance > 0 ? 'text-red-600 ' : 'text-green-600 '}`}>
            ₹{customer.balance.toLocaleString('en-IN')}
          </p>
          {customer.balance > 0 && <p className="text-xs text-red-500 mt-1">Amount due from customer</p>}
        </div>
        <div className="glass-card p-6 md:col-span-2">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Customer Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400">Phone</p>
              <p className="font-medium text-slate-900 ">{customer.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Address</p>
              <p className="font-medium text-slate-900 ">{customer.address || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 ">
            <thead className="bg-slate-50/50  border-b border-slate-200 ">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-900  whitespace-nowrap">Date</th>
                <th className="px-6 py-4 font-semibold text-slate-900 ">Description</th>
                <th className="px-6 py-4 font-semibold text-slate-900  text-right whitespace-nowrap">Debit (₹)</th>
                <th className="px-6 py-4 font-semibold text-slate-900  text-right whitespace-nowrap">Credit (₹)</th>
                <th className="px-6 py-4 font-semibold text-slate-900  text-right whitespace-nowrap">Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No transactions recorded yet.</td>
                </tr>
              ) : (
                ledger.map((entry, index) => (
                  <tr key={`${entry.id}-${index}`} className="border-b border-slate-100  hover:bg-slate-50/50 :bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                      {format(new Date(entry.date), "dd MMM yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      {entry.description}
                      {entry.type === 'SALE' && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800  ">SALE</span>}
                      {entry.type === 'PAYMENT' && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800  ">PAYMENT</span>}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-red-600 ">
                      {entry.debit > 0 ? entry.debit.toLocaleString('en-IN') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-green-600 ">
                      {entry.credit > 0 ? entry.credit.toLocaleString('en-IN') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 ">
                      {entry.runningBalance.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
