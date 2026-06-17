"use client";

import { useState, useEffect } from "react";
import { Search, X, Check, Image as ImageIcon } from "lucide-react";
import { Product, getProducts } from "@/lib/services/products";

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Product, qty: number, rate: number) => void;
  addedProductIds: string[];
}

export default function ProductPickerModal({ isOpen, onClose, onAddProduct, addedProductIds }: ProductPickerModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Local state for tracking quantities and rates in the modal before adding
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [rates, setRates] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
    
    // Initialize default rates and qty
    const initialRates: Record<string, number> = {};
    const initialQty: Record<string, number> = {};
    data.forEach(p => {
      if (p.id) {
        initialRates[p.id] = p.wholesaleRate;
        initialQty[p.id] = 1;
      }
    });
    setRates(initialRates);
    setQuantities(initialQty);
    setLoading(false);
  };

  if (!isOpen) return null;

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.modelNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = (product: Product) => {
    if (product.id && !addedProductIds.includes(product.id)) {
      onAddProduct(product, quantities[product.id] || 1, rates[product.id] || product.wholesaleRate);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-gray-900">Add Products to Quotation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Search by name or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="p-4 w-16">Image</th>
                <th className="p-4">Product</th>
                <th className="p-4 w-24 text-right">MRP</th>
                <th className="p-4 w-32">Rate</th>
                <th className="p-4 w-24">Qty</th>
                <th className="p-4 w-24 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">Loading products...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No products match your search.</td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isAdded = product.id ? addedProductIds.includes(product.id) : false;
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded object-cover border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center border border-gray-200">
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.modelNo}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-900 text-right">₹{product.mrp}</td>
                      <td className="p-4">
                        <input
                          type="number"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-primary focus:border-primary"
                          value={product.id ? rates[product.id] || "" : ""}
                          onChange={(e) => {
                            if (product.id) {
                              setRates({ ...rates, [product.id]: parseFloat(e.target.value) || 0 });
                            }
                          }}
                          disabled={isAdded}
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          min="1"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-primary focus:border-primary"
                          value={product.id ? quantities[product.id] || "" : ""}
                          onChange={(e) => {
                            if (product.id) {
                              setQuantities({ ...quantities, [product.id]: parseInt(e.target.value) || 1 });
                            }
                          }}
                          disabled={isAdded}
                        />
                      </td>
                      <td className="p-4 text-right">
                        {isAdded ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" /> Added
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAdd(product)}
                            className="px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-800 transition-colors"
                          >
                            Add
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
