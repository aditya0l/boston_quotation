"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Eye, Download, Trash2, Edit } from "lucide-react";
import { Quotation, getQuotations, deleteQuotation } from "@/lib/services/quotations";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ShareModal from "@/components/ShareModal";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const router = useRouter();

  const fetchQuotations = async () => {
    setLoading(true);
    const data = await getQuotations();
    setQuotations(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this quotation?")) {
      await deleteQuotation(id);
      fetchQuotations();
    }
  };

  const filteredQuotations = quotations.filter((q) =>
    q.qoNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
        <Link
          href="/quotations/create"
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Quotation
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4 items-center justify-between">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Search by QO number or client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                <th className="p-4">QO Number</th>
                <th className="p-4">Date</th>
                <th className="p-4">Client Name</th>
                <th className="p-4 text-right">Total Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Loading quotations...
                  </td>
                </tr>
              ) : filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No quotations found.
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((qo) => (
                  <tr key={qo.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{qo.qoNumber}</td>
                    <td className="p-4 text-sm text-gray-500">{new Date(qo.date).toLocaleDateString()}</td>
                    <td className="p-4 text-sm text-gray-900">{qo.clientName}</td>
                    <td className="p-4 text-sm font-medium text-gray-900 text-right">
                      ₹{qo.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${qo.status === "Confirmed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {qo.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {qo.status === "Draft" && (
                          <Link
                            href={`/quotations/create?edit=${qo.id}`}
                            className="p-1 text-gray-400 hover:text-primary transition-colors"
                            title="Edit Draft"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setSelectedQuotation(qo);
                            setIsShareModalOpen(true);
                          }}
                          className="p-1 text-gray-400 hover:text-primary transition-colors"
                          title="Preview & Share"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(qo.id!)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
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

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        quotation={selectedQuotation} 
      />
    </div>
  );
}
