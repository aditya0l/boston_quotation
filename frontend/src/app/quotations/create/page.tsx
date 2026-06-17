"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from "lucide-react";
import { Client, getClients } from "@/lib/services/clients";
import { Quotation, QuotationItem, addQuotation, updateQuotation, getQuotation } from "@/lib/services/quotations";
import { Product } from "@/lib/services/products";
import ProductPickerModal from "@/components/ProductPickerModal";
import { numberToWords } from "@/lib/numberToWords";

function QuotationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<Quotation>>({
    qoNumber: `QO-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split("T")[0],
    dispatchDate: "",
    bookingDate: "",
    clientId: "",
    clientName: "",
    status: "Draft",
    items: [],
  });

  useEffect(() => {
    const initData = async () => {
      const clientsData = await getClients();
      setClients(clientsData);

      if (editId) {
        const quote = await getQuotation(editId);
        if (quote) setFormData(quote);
      }
      setLoading(false);
    };
    initData();
  }, [editId]);

  const handleAddProduct = (product: Product, qty: number, rate: number) => {
    const newItem: QuotationItem = {
      id: crypto.randomUUID(),
      productId: product.id!,
      productName: product.name,
      productImage: product.imageUrl,
      modelNo: product.modelNo,
      qty,
      rate,
      mrp: product.mrp,
      amount: qty * rate,
      sortOrder: (formData.items?.length || 0) + 1,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const updateItem = (id: string, field: keyof QuotationItem, value: number) => {
    setFormData((prev) => {
      const newItems = prev.items?.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'qty' || field === 'rate') {
            updated.amount = updated.qty * updated.rate;
          }
          return updated;
        }
        return item;
      }) || [];
      return { ...prev, items: newItems };
    });
  };

  const removeItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items?.filter(item => item.id !== id) || [],
    }));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const items = [...(formData.items || [])];
    if (direction === 'up' && index > 0) {
      const temp = items[index];
      items[index] = items[index - 1];
      items[index - 1] = temp;
    } else if (direction === 'down' && index < items.length - 1) {
      const temp = items[index];
      items[index] = items[index + 1];
      items[index + 1] = temp;
    }
    setFormData((prev) => ({ ...prev, items }));
  };

  // Calculations
  const subtotal = formData.items?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const gst = subtotal * 0.18;
  const total = subtotal + gst;
  const totalRounded = Math.round(total);
  const amountInWords = numberToWords(totalRounded);

  const handleSave = async (status: "Draft" | "Confirmed") => {
    if (!formData.clientId) {
      alert("Please select a client.");
      return;
    }
    if (!formData.items || formData.items.length === 0) {
      alert("Please add at least one item.");
      return;
    }

    setSaving(true);
    const quoteData: Omit<Quotation, 'id'> = {
      ...(formData as any),
      status,
      subtotal,
      gst,
      total: totalRounded,
      amountInWords,
      items: formData.items.map((item, index) => ({ ...item, sortOrder: index + 1 })),
    };

    if (editId) {
      await updateQuotation(editId, quoteData);
    } else {
      await addQuotation(quoteData);
    }
    router.push("/quotations");
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {editId ? "Edit Quotation" : "Create Quotation"}
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => handleSave("Draft")}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSave("Confirmed")}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? "Saving..." : "Save & Confirm"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">QO Number *</label>
            <input
              type="text"
              value={formData.qoNumber}
              onChange={(e) => setFormData({ ...formData, qoNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary bg-gray-50"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select
              value={formData.clientId}
              onChange={(e) => {
                const client = clients.find(c => c.id === e.target.value);
                setFormData({ ...formData, clientId: client?.id || "", clientName: client?.name || "" });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            >
              <option value="">Select a Client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dispatch Date</label>
            <input
              type="date"
              value={formData.dispatchDate}
              onChange={(e) => setFormData({ ...formData, dispatchDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
          <button
            onClick={() => setIsPickerOpen(true)}
            className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Products
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4 w-16">Image</th>
                <th className="p-4">Product Details</th>
                <th className="p-4 w-24">QTY</th>
                <th className="p-4 w-32">Rate (₹)</th>
                <th className="p-4 w-32 text-right">Amount (₹)</th>
                <th className="p-4 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!formData.items || formData.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    No items added yet. Click "Add Products" to start.
                  </td>
                </tr>
              ) : (
                formData.items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 group">
                    <td className="p-4 text-center text-sm font-medium text-gray-400">{index + 1}</td>
                    <td className="p-4">
                      {item.productImage ? (
                        <img src={item.productImage} alt={item.productName} className="w-10 h-10 rounded object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200"></div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900 text-sm">{item.productName}</div>
                      <div className="text-xs text-gray-500">{item.modelNo} | MRP: ₹{item.mrp}</div>
                    </td>
                    <td className="p-4">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-primary"
                      />
                    </td>
                    <td className="p-4">
                      <input
                        type="number"
                        min="0"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-primary"
                      />
                    </td>
                    <td className="p-4 text-right font-medium text-gray-900">
                      ₹{item.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30">
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button onClick={() => moveItem(index, 'down')} disabled={index === formData.items!.length - 1} className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30">
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeItem(item.id)} className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Amount in Words</h3>
            <p className="text-gray-900 font-medium capitalize">{amountInWords}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-primary font-medium">
              <span>GST (18%)</span>
              <span>₹{gst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-3 border-t border-gray-100 flex justify-between text-xl font-bold text-gray-900">
              <span>Grand Total</span>
              <span>₹{totalRounded.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </div>

      <ProductPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onAddProduct={handleAddProduct}
        addedProductIds={formData.items?.map(i => i.productId) || []}
      />
    </div>
  );
}

export default function QuotationCreatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading editor...</div>}>
      <QuotationForm />
    </Suspense>
  );
}
