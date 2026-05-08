"use client";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Wallet, 
  AlertTriangle, 
  Package,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function DashboardClient({ stats }: { stats: any }) {

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-slide-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Overview</h1>
        <p className="text-slate-500 mt-1">Here is what's happening with your inventory today.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/sales" className="glass-card p-4 flex flex-col items-center justify-center gap-2 hover:bg-primary hover:text-white group transition-all duration-300 transform hover:-translate-y-1">
          <TrendingUp className="w-8 h-8 text-primary group-hover:text-white mb-2" />
          <span className="font-semibold text-sm md:text-base">New Sale</span>
        </Link>
        <Link href="/products" className="glass-card p-4 flex flex-col items-center justify-center gap-2 hover:bg-accent hover:text-white group transition-all duration-300 transform hover:-translate-y-1">
          <Package className="w-8 h-8 text-accent group-hover:text-white mb-2" />
          <span className="font-semibold text-sm md:text-base">Stock In</span>
        </Link>
        <Link href="/payments" className="glass-card p-4 flex flex-col items-center justify-center gap-2 hover:bg-green-500 hover:text-white group transition-all duration-300 transform hover:-translate-y-1">
          <Wallet className="w-8 h-8 text-green-500 group-hover:text-white mb-2" />
          <span className="font-semibold text-sm md:text-base">Record Payment</span>
        </Link>
        <Link href="/customers" className="glass-card p-4 flex flex-col items-center justify-center gap-2 hover:bg-purple-500 hover:text-white group transition-all duration-300 transform hover:-translate-y-1">
          <ArrowRight className="w-8 h-8 text-purple-500 group-hover:text-white mb-2" />
          <span className="font-semibold text-sm md:text-base">Ledgers</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6 border-l-4 border-l-primary relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all"></div>
          <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Today's Sales</h3>
          <p className="text-4xl font-bold text-slate-900 ">₹{stats.todaySales.toLocaleString('en-IN')}</p>
        </div>
        
        <div className="glass-card p-6 border-l-4 border-l-yellow-500 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl group-hover:bg-yellow-500/20 transition-all"></div>
          <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Pending Payments</h3>
          <p className="text-4xl font-bold text-slate-900 ">₹{stats.pendingPayments.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* 7-Day Sales Trend Chart */}
      <div className="glass-card p-6 mb-8 h-80">
        <h2 className="text-lg font-bold text-slate-900 mb-4">7-Day Sales Trend</h2>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `₹${value}`} />
            <Tooltip 
              cursor={{ fill: '#f1f5f9' }} 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Sales']}
            />
            <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 ">Recent Sales</h2>
            <Link href="/sales" className="text-sm font-medium text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {stats.recentTransactions.length === 0 ? (
              <p className="text-sm text-slate-500">No recent transactions.</p>
            ) : (
              stats.recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50 :bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 :border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {tx.customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900 ">{tx.customer.name}</p>
                      <p className="text-xs text-slate-500">{format(new Date(tx.date), "dd MMM, HH:mm")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-slate-900 ">₹{tx.totalAmount.toLocaleString('en-IN')}</p>
                    <p className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-1 ${tx.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {tx.paymentStatus}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900  flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Low Stock Alerts
            </h2>
            <Link href="/products" className="text-sm font-medium text-primary hover:underline">Manage</Link>
          </div>
          <div className="space-y-4">
            {stats.lowStockProducts.length === 0 ? (
              <p className="text-sm text-slate-500">All stock levels are looking good.</p>
            ) : (
              stats.lowStockProducts.map((product: any) => (
                <div key={product.id} className="flex justify-between items-center p-3 rounded-lg bg-red-50/50  border border-red-100 ">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-100  text-red-600 ">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900 ">{product.name}</p>
                      <p className="text-xs text-slate-500">Needs restocking soon</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600 ">{product.currentCartons} Cartons</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
