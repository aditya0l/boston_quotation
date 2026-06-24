"use client";

import { useState, useRef, useEffect } from "react";
import { X, Download, Share2 } from "lucide-react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { Quotation } from "@/lib/services/quotations";
import { CompanySettings, getSettings } from "@/lib/services/settings";
import { getClient, Client } from "@/lib/services/clients";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
}

type TemplateType = "wholesale" | "retail" | "loading";

export default function ShareModal({ isOpen, onClose, quotation }: ShareModalProps) {
  const [template, setTemplate] = useState<TemplateType>("wholesale");
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [generating, setGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && quotation) {
      getSettings().then(setSettings);
      getClient(quotation.clientId).then(setClient);
    }
  }, [isOpen, quotation]);

  const handleDownload = async () => {
    if (!printRef.current || !quotation) return;
    setGenerating(true);

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/webp", 0.75); // Compressed WebP
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "WEBP", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Quotation_${quotation.qoNumber}_${template}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setGenerating(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!quotation) return;
    const text = `Hello,\nHere is your quotation *${quotation.qoNumber}* for a total of *₹${quotation.total.toLocaleString("en-IN")}*.\nThank you!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  if (!isOpen || !quotation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">Share Quotation</h2>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(["wholesale", "retail", "loading"] as TemplateType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTemplate(t)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                    template === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={generating}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              {generating ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary-light transition-colors text-sm"
            >
              <Share2 className="w-4 h-4 mr-2" />
              WhatsApp
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-500 ml-2">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Preview Area - Zoomed out container */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center">
          <div 
            className="bg-white shadow-lg relative transform origin-top"
            style={{ width: "210mm", minHeight: "297mm", padding: "15mm" }} // A4 Size in MM
            ref={printRef}
          >
            {/* --- PDF CONTENT START --- */}
            {settings && (
              <div className="text-gray-900 font-sans">
                {/* Header Section */}
                <div className="flex justify-between items-start border-b-2 border-primary pb-4 mb-6">
                  <div className="w-1/3">
                    {settings.logo && (
                      <img 
                        src={settings.logo} 
                        alt="Company Logo" 
                        style={{ maxHeight: "80px", objectFit: "contain", filter: "brightness(0)" }} 
                      />
                    )}
                  </div>
                  <div className="w-2/3 text-right text-sm">
                    <h1 className="text-2xl font-bold text-black uppercase mb-1">{settings.name}</h1>
                    {settings.address1 && <p>{settings.address1}</p>}
                    {settings.address2 && <p>{settings.address2}</p>}
                    {settings.phone && <p>Ph: {settings.phone}</p>}
                    {settings.email && <p>Email: {settings.email}</p>}
                    {settings.website && <p>Web: {settings.website}</p>}
                    {settings.gst && <p className="font-bold mt-1">GSTIN: {settings.gst}</p>}
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold uppercase tracking-wider underline underline-offset-4 decoration-2">
                    {template === "loading" ? "Dispatch / Loading Slip" : "Gym Equipment Quotation"}
                  </h2>
                </div>

                {/* Client Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm border border-gray-300 p-4 rounded-md">
                  <div>
                    <p className="mb-1"><span className="font-bold inline-block w-24">QO No:</span> {quotation.qoNumber}</p>
                    <p className="mb-1"><span className="font-bold inline-block w-24">Date:</span> {new Date(quotation.date).toLocaleDateString()}</p>
                    <p className="mb-1"><span className="font-bold inline-block w-24">Booking Date:</span> {quotation.bookingDate ? new Date(quotation.bookingDate).toLocaleDateString() : "-"}</p>
                    <p className="mb-1"><span className="font-bold inline-block w-24">Dispatch Date:</span> {quotation.dispatchDate ? new Date(quotation.dispatchDate).toLocaleDateString() : "-"}</p>
                  </div>
                  <div>
                    <p className="font-bold text-base mb-1">{quotation.clientName}</p>
                    {client?.address && <p>{client.address}</p>}
                    <p>{client?.city} {client?.state}</p>
                    {client?.phone && <p>Ph: {client.phone}</p>}
                    {client?.gst && <p className="font-bold mt-1">GSTIN: {client.gst}</p>}
                  </div>
                </div>                 {/* Items Table */}
                <table className="w-full text-left border-collapse text-sm mb-6">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="border border-gray-300 p-2 w-10 text-center uppercase">S.No</th>
                      <th className="border border-gray-300 p-2 text-center uppercase">Items</th>
                      <th className="border border-gray-300 p-2 w-40 text-center uppercase">Picture</th>
                      {template === "loading" && <th className="border border-gray-300 p-2 text-center uppercase">Model No.</th>}
                      <th className="border border-gray-300 p-2 w-12 text-center uppercase">QTY</th>
                      {template === "wholesale" && <th className="border border-gray-300 p-2 w-20 text-center uppercase">MRP</th>}
                      {template === "wholesale" && <th className="border border-gray-300 p-2 w-20 text-center uppercase">Rate</th>}
                      {template !== "loading" && <th className="border border-gray-300 p-2 w-24 text-center uppercase">Amount</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.items.map((item, index) => (
                      <tr key={item.id} className="border-b border-gray-300">
                        <td className="border border-gray-300 p-2 text-center align-middle">{index + 1}</td>
                        <td className="border border-gray-300 p-2 font-medium align-middle text-center">{item.productName}</td>
                        <td className="border border-gray-300 p-2 text-center align-middle">
                          {item.productImage ? (
                            <img src={item.productImage} alt={item.productName} className="w-36 h-36 object-contain mx-auto" />
                          ) : "-"}
                        </td>
                        {template === "loading" && <td className="border border-gray-300 p-2 text-center align-middle text-xs">{item.modelNo}</td>}
                        <td className="border border-gray-300 p-2 text-center font-bold align-middle">{item.qty}</td>
                        {template === "wholesale" && <td className="border border-gray-300 p-2 text-center align-middle line-through text-gray-500 text-xs">₹{item.mrp}</td>}
                        {template === "wholesale" && <td className="border border-gray-300 p-2 text-center align-middle">₹{item.rate.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>}
                        {template !== "loading" && <td className="border border-gray-300 p-2 text-center font-bold align-middle">₹{item.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Section */}
                {template !== "loading" && (
                  <div className="flex justify-end mb-6">
                    <div className="w-1/2">
                      <table className="w-full text-right text-sm">
                        <tbody>
                          <tr>
                            <td className="p-2 font-bold text-gray-600">Subtotal:</td>
                            <td className="p-2 font-bold border-b border-gray-300">₹{quotation.subtotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                          </tr>
                          <tr className="text-primary">
                            <td className="p-2 font-bold">GST (18%):</td>
                            <td className="p-2 font-bold border-b border-gray-300">₹{quotation.gst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                          </tr>
                          <tr className="text-lg text-black">
                            <td className="p-2 font-bold uppercase">Grand Total:</td>
                            <td className="p-2 font-bold">₹{quotation.total.toLocaleString("en-IN")}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Amount in words */}
                {template !== "loading" && (
                  <div className="mb-6 bg-gray-50 p-2 border border-gray-300 rounded text-sm">
                    <span className="font-bold">Amount in words:</span> <span className="capitalize">{quotation.amountInWords}</span>
                  </div>
                )}

                {/* Bank & Terms */}
                <div className="grid grid-cols-2 gap-8 text-xs mt-12">
                  {settings.bankDetails && (
                    <div>
                      <h3 className="font-bold uppercase mb-2 border-b border-gray-300 pb-1">Bank Details</h3>
                      <pre className="font-sans whitespace-pre-wrap">{settings.bankDetails}</pre>
                    </div>
                  )}
                  {settings.terms && (
                    <div>
                      <h3 className="font-bold uppercase mb-2 border-b border-gray-300 pb-1">Terms & Conditions</h3>
                      <pre className="font-sans whitespace-pre-wrap">{settings.terms}</pre>
                    </div>
                  )}
                </div>

                {/* Signature */}
                <div className="mt-16 flex justify-end">
                  <div className="text-center">
                    <div className="border-b border-gray-400 w-48 mb-2"></div>
                    <p className="text-xs font-bold uppercase">For {settings.name}</p>
                    <p className="text-xs text-gray-500">Authorized Signatory</p>
                  </div>
                </div>
                
              </div>
            )}
            {/* --- PDF CONTENT END --- */}
          </div>
        </div>
      </div>
    </div>
  );
}
