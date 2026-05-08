"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Wallet,
  Settings
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Products & Stock", href: "/products", icon: Package },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Sales", href: "/sales", icon: ShoppingCart },
  { name: "Payments", href: "/payments", icon: Wallet },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full w-64 flex-col glass-panel z-10">
        <div className="flex h-16 items-center px-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            StockManager
          </h1>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
          <nav className="mt-2 flex-1 space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-slate-700 hover:bg-white/60 hover:text-slate-900"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-primary"
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full glass-panel border-t border-white/40 z-50 flex justify-around items-center p-2 pb-safe">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                isActive ? "text-primary font-bold" : "text-slate-500"
              }`}
            >
              <item.icon className="h-6 w-6 mb-1" />
              <span className="text-[10px] font-medium text-center">{item.name.replace(" & Stock", "")}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
