"use client";

import { useState, useEffect } from "react";
import { getProducts, createProduct, updateProductStock } from "@/app/actions/products";
import { useAlert } from "@/components/AlertProvider";
import { Package, Plus, ArrowUpCircle } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  
  const { showAlert } = useAlert();

  // Form states
  const [name, setName] = useState("");
  const [boxesPerCarton, setBoxesPerCarton] = useState<number | "">("");
  const [screwsPerBox, setScrewsPerBox] = useState<number | "">("");
  const [stockAdd, setStockAdd] = useState<number | "">("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    const data = await getProducts();
    setProducts(data);
    setIsLoading(false);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !boxesPerCarton || !screwsPerBox) return;
    
    const res = await createProduct({ 
      name, 
      boxesPerCarton: Number(boxesPerCarton), 
      screwsPerBox: Number(screwsPerBox) 
    });
    
    if (res.success) {
      showAlert('success', 'Product Created', `${name} has been added to inventory.`);
      setIsModalOpen(false);
      setName("");
      setBoxesPerCarton("");
      setScrewsPerBox("");
      fetchProducts();
    } else {
      showAlert('error', 'Error', res.error);
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !stockAdd) return;
    
    const res = await updateProductStock(selectedProductId, Number(stockAdd));
    if (res.success) {
      showAlert('success', 'Stock Updated', `Added ${stockAdd} cartons to inventory.`);
      setIsStockModalOpen(false);
      setStockAdd("");
      fetchProducts();
    } else {
      showAlert('error', 'Error', res.error);
    }
  };

  // Live calculation for the user interface
  const totalScrewsPerCarton = (Number(boxesPerCarton) || 0) * (Number(screwsPerBox) || 0);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600   bg-clip-text text-transparent">Products & Stock</h1>
          <p className="text-slate-500 mt-1">Manage your screw inventory and carton sizes.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/30 transition-all"
        >
          <Plus className="w-5 h-5" />
          New Product
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600 ">
          <thead className="bg-slate-50/50  border-b border-slate-200 ">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-900 ">Product Name</th>
              <th className="px-6 py-4 font-semibold text-slate-900 ">Size Details</th>
              <th className="px-6 py-4 font-semibold text-slate-900 ">Current Stock (Cartons)</th>
              <th className="px-6 py-4 font-semibold text-slate-900  text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading inventory...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No products found. Add one to get started.</td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-b border-slate-100  hover:bg-slate-50/50 :bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900  flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Package className="w-5 h-5" />
                    </div>
                    {product.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900 ">{product.boxesPerCarton} Boxes / Carton</div>
                    <div className="text-xs text-slate-500">{product.screwsPerBox} Screws / Box</div>
                    <div className="text-xs text-primary font-medium mt-0.5">{product.boxesPerCarton * product.screwsPerBox} Total Screws/Carton</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.currentCartons > 5 ? 'bg-green-100 text-green-800  ' : 'bg-red-100 text-red-800  '}`}>
                      {product.currentCartons} Cartons
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedProductId(product.id);
                        setIsStockModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-lg"
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      Stock In
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900  mb-4">Add New Product</h2>
            <form onSubmit={handleCreateProduct}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 ">Product Name / Size</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200  bg-white/50  focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    placeholder="e.g. 1.5 inch Drywall Screw"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700 ">Boxes per Carton</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={boxesPerCarton}
                      onChange={(e) => setBoxesPerCarton(Number(e.target.value) || "")}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200  bg-white/50  focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                      placeholder="e.g. 10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700 ">Screws per Box</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={screwsPerBox}
                      onChange={(e) => setScrewsPerBox(Number(e.target.value) || "")}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200  bg-white/50  focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                      placeholder="e.g. 200"
                    />
                  </div>
                </div>
                
                {/* Live Details Section requested by user */}
                <div className="bg-blue-50  border border-blue-100  rounded-xl p-4 mt-2">
                  <h4 className="text-sm font-semibold text-blue-800  mb-2">Carton Details Summary</h4>
                  <ul className="text-sm text-blue-700  space-y-1">
                    <li>Boxes inside 1 Carton: <strong>{boxesPerCarton || 0}</strong></li>
                    <li>Screws inside 1 Box: <strong>{screwsPerBox || 0}</strong></li>
                    <li className="pt-2 border-t border-blue-200  mt-2 font-medium">
                      Total Screws in 1 Carton: <span className="text-lg text-blue-900 ">{totalScrewsPerCarton.toLocaleString()}</span>
                    </li>
                  </ul>
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
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock In Modal */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900  mb-4">Stock In (Add Cartons)</h2>
            <form onSubmit={handleAddStock}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 ">Quantity (Cartons)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={stockAdd}
                    onChange={(e) => setStockAdd(Number(e.target.value) || "")}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200  bg-white/50  focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    placeholder="Number of cartons received"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100  :bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/30 transition-all"
                >
                  Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
