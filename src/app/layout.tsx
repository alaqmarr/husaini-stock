import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AlertProvider } from "@/components/AlertProvider";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const prefferedRegion = ['sin1']
export const metadata: Metadata = {
  title: "Stock Management",
  description: "Manage inventory, customers, and sales.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col md:flex-row h-screen overflow-hidden text-slate-900`}>
        <AlertProvider>
          <div className="md:hidden glass-panel w-full p-4 flex items-center justify-between z-20">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              StockManager
            </h1>
            <span className="text-xs text-primary font-medium px-2 py-1 bg-primary/10 rounded-md">Mobile View</span>
          </div>
          <Sidebar />
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0 relative z-0">
            {children}
          </main>
        </AlertProvider>
      </body>
    </html>
  );
}
