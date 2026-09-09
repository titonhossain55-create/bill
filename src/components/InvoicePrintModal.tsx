import React, { useState } from 'react';
import {
  X,
  Printer,
  Share2,
  Copy,
  Check,
  Mail,
  MessageCircle,
  Download,
  Building2,
  FileCheck,
} from 'lucide-react';
import { Invoice, InvoiceCopyType } from '../types';
import { formatINR, generateUpiUrl } from '../utils/gstEngine';
import { generateQrCodeDataUrl } from '../utils/qrCode';

interface InvoicePrintModalProps {
  invoice: Invoice;
  onClose: () => void;
  onUpdateStatus?: (id: string, status: Invoice['paymentStatus']) => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  onClose,
  onUpdateStatus,
}) => {
  const [copyType, setCopyType] = useState<InvoiceCopyType>('ORIGINAL');
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const copyLabels: Record<InvoiceCopyType, string> = {
    ORIGINAL: 'Original for Recipient',
    DUPLICATE: 'Duplicate for Transporter',
    TRIPLATE: 'Triplicate for Supplier',
  };

  const isIntraState = invoice.supplyType === 'INTRA_STATE';

  // Compute HSN summary for the bottom tax breakdown table
  const hsnMap = new Map<
    string,
    {
      hsnSacCode: string;
      taxableValue: number;
      cgstRate: number;
      cgstAmount: number;
      sgstRate: number;
      sgstAmount: number;
      igstRate: number;
      igstAmount: number;
      totalTax: number;
    }
  >();

  invoice.items.forEach((item) => {
    const key = `${item.hsnSacCode}_${item.gstSlab}`;
    const existing = hsnMap.get(key);
    if (existing) {
      existing.taxableValue += item.taxableAmount;
      existing.cgstAmount += item.cgstAmount;
      existing.sgstAmount += item.sgstAmount;
      existing.igstAmount += item.igstAmount;
      existing.totalTax += item.totalTax;
    } else {
      hsnMap.set(key, {
        hsnSacCode: item.hsnSacCode || 'N/A',
        taxableValue: item.taxableAmount,
        cgstRate: item.cgstRate,
        cgstAmount: item.cgstAmount,
        sgstRate: item.sgstRate,
        sgstAmount: item.sgstAmount,
        igstRate: item.igstRate,
        igstAmount: item.igstAmount,
        totalTax: item.totalTax,
      });
    }
  });

  const hsnRows = Array.from(hsnMap.values());

  const handlePrint = () => {
    window.print();
  };

  const getSummaryText = () => {
    return (
      `*TAX INVOICE SUMMARY*\n` +
      `Invoice No: ${invoice.invoiceNumber}\n` +
      `Date: ${invoice.date}\n` +
      `Seller: ${invoice.seller.legalName} (GSTIN: ${invoice.seller.gstin})\n` +
      `Buyer: ${invoice.customer.businessName} ${
        invoice.customer.gstin ? `(GSTIN: ${invoice.customer.gstin})` : ''
      }\n` +
      `Place of Supply: ${invoice.placeOfSupply}\n` +
      `---------------------------\n` +
      `Taxable Value: ${formatINR(invoice.totalTaxableAmount)}\n` +
      (isIntraState
        ? `CGST: ${formatINR(invoice.totalCgst)}\nSGST: ${formatINR(invoice.totalSgst)}\n`
        : `IGST: ${formatINR(invoice.totalIgst)}\n`) +
      `Grand Total: ${formatINR(invoice.grandTotal)}\n` +
      `Status: ${invoice.paymentStatus}\n` +
      (invoice.seller.upiId ? `Pay via UPI: ${invoice.seller.upiId}\n` : '') +
      `---------------------------\n` +
      `Generated via GST Invoicing Engine`
    );
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(getSummaryText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(getSummaryText());
    const phone = invoice.customer.phone.replace(/[^0-9]/g, '');
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(
      `Tax Invoice ${invoice.invoiceNumber} from ${invoice.seller.legalName}`
    );
    const body = encodeURIComponent(getSummaryText());
    window.location.href = `mailto:${invoice.customer.email || ''}?subject=${subject}&body=${body}`;
  };

  const upiUrl = generateUpiUrl({
    upiId: invoice.seller.upiId,
    payeeName: invoice.seller.legalName,
    amount: invoice.grandTotal,
    invoiceNumber: invoice.invoiceNumber,
  });

  const qrImageUrl = upiUrl ? generateQrCodeDataUrl(upiUrl, 140) : '';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      {/* Top Action Floating Bar (Hidden when printing) */}
      <div className="no-print fixed top-4 right-4 z-50 flex items-center gap-2 bg-slate-900/90 text-white p-2 rounded-xl shadow-lg border border-slate-700 backdrop-blur-md">
        {/* Copy Type Selector */}
        <select
          value={copyType}
          onChange={(e) => setCopyType(e.target.value as InvoiceCopyType)}
          className="bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-600 focus:outline-hidden"
        >
          <option value="ORIGINAL">Original for Recipient</option>
          <option value="DUPLICATE">Duplicate for Transporter</option>
          <option value="TRIPLATE">Triplicate for Supplier</option>
        </select>

        {/* Print / Save PDF Button */}
        <button
          id="btn-print-invoice"
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          title="Print or Save as PDF"
        >
          <Printer className="w-4 h-4" />
          <span>Print / PDF</span>
        </button>

        {/* WhatsApp Share */}
        <button
          onClick={handleWhatsAppShare}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg shadow-sm transition-all"
          title="Share via WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </button>

        {/* Email Share */}
        <button
          onClick={handleEmailShare}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-sm transition-all"
          title="Send via Email"
        >
          <Mail className="w-4 h-4" />
          <span className="hidden sm:inline">Email</span>
        </button>

        {/* Copy text */}
        <button
          onClick={handleCopySummary}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all"
          title="Copy formatted summary"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>

        {/* Close */}
        <button
          id="btn-close-print-modal"
          onClick={onClose}
          className="p-1.5 bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-red-200 rounded-lg transition-all ml-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Invoice Document Wrapper */}
      <div className="print-container bg-white text-slate-900 w-full max-w-4xl mx-auto shadow-2xl rounded-xl p-6 sm:p-8 my-8 print:my-0 print:p-4 print:shadow-none print:max-w-none border border-slate-200 print:border-none">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-1">
                GST Form INV-01
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                TAX INVOICE
              </h1>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wide bg-slate-100 border border-slate-300 rounded-md text-slate-800">
                {copyLabels[copyType]}
              </span>
              {invoice.paymentStatus === 'PAID' && (
                <div className="mt-1">
                  <span className="inline-block px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded border border-emerald-300">
                    PAID
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seller & Invoice Details Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-300 rounded-lg p-4 mb-4 text-xs">
          {/* Supplier Info */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Supplier (Billed From)
            </span>
            <div className="font-bold text-slate-900 text-sm mb-0.5">
              {invoice.seller.legalName}
            </div>
            {invoice.seller.tradeName &&
              invoice.seller.tradeName !== invoice.seller.legalName && (
                <div className="text-slate-600 italic mb-1">
                  Trading as: {invoice.seller.tradeName}
                </div>
              )}
            <div className="text-slate-600 mb-1 leading-relaxed">
              {invoice.seller.address}, {invoice.seller.city} -{' '}
              {invoice.seller.pincode}
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1 border-t border-slate-100">
              <div>
                <span className="font-semibold text-slate-700">GSTIN: </span>
                <span className="font-mono font-bold text-slate-900">
                  {invoice.seller.gstin}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">PAN: </span>
                <span className="font-mono">{invoice.seller.pan}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">State: </span>
                <span>
                  {invoice.seller.state} (Code: {invoice.seller.stateCode})
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Contact: </span>
                <span>{invoice.seller.phone}</span>
              </div>
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="sm:border-l sm:border-slate-200 sm:pl-4 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200">
                <span className="font-bold text-slate-700">Invoice No:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {invoice.invoiceNumber}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="block text-[10px] text-slate-500 font-medium">
                    Invoice Date
                  </span>
                  <span className="font-semibold text-slate-900">
                    {invoice.date}
                  </span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="block text-[10px] text-slate-500 font-medium">
                    Due Date
                  </span>
                  <span className="font-semibold text-slate-900">
                    {invoice.dueDate || invoice.date}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Place of Supply:</span>
                  <span className="font-semibold text-slate-900">
                    {invoice.placeOfSupply}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Supply Nature:</span>
                  <span className="font-semibold text-slate-900">
                    {isIntraState
                      ? 'Intra-State (CGST+SGST)'
                      : 'Inter-State (IGST)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Reverse Charge:</span>
                  <span className="font-semibold text-slate-900">
                    {invoice.reverseCharge ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Mode:</span>
                  <span className="font-semibold text-slate-900">
                    {invoice.paymentMode || 'Bank / UPI'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buyer (Bill To) & Ship To Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-300 rounded-lg p-4 mb-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Details of Receiver / Billed To:
            </span>
            <div className="font-bold text-slate-900 text-sm mb-0.5">
              {invoice.customer.businessName}
            </div>
            {invoice.customer.contactPerson && (
              <div className="text-slate-600 mb-1">
                Attn: {invoice.customer.contactPerson}
              </div>
            )}
            <div className="text-slate-600 mb-1 leading-relaxed">
              {invoice.customer.billingAddress}
              {invoice.customer.city ? `, ${invoice.customer.city}` : ''}
              {invoice.customer.pincode ? ` - ${invoice.customer.pincode}` : ''}
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1 border-t border-slate-100">
              <div>
                <span className="font-semibold text-slate-700">GSTIN: </span>
                <span className="font-mono font-bold text-slate-900">
                  {invoice.customer.gstin || 'Unregistered / B2C'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">State: </span>
                <span>
                  {invoice.customer.state} ({invoice.customer.stateCode})
                </span>
              </div>
            </div>
          </div>

          <div className="sm:border-l sm:border-slate-200 sm:pl-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Details of Consignee / Shipped To:
            </span>
            <div className="font-semibold text-slate-800 text-xs mb-0.5">
              {invoice.customer.businessName}
            </div>
            <div className="text-slate-600 mb-1 leading-relaxed text-xs">
              {invoice.customer.billingAddress}
              {invoice.customer.city ? `, ${invoice.customer.city}` : ''}
            </div>
            <div className="pt-1 border-t border-slate-100 text-xs">
              <span className="font-semibold text-slate-700">
                Place of Delivery:{' '}
              </span>
              <span className="font-medium text-slate-900">
                {invoice.placeOfSupply}
              </span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-300 rounded-lg overflow-hidden mb-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300">
                <th className="py-2 px-2 text-center w-8">#</th>
                <th className="py-2 px-3">Item Description</th>
                <th className="py-2 px-2 text-center">HSN/SAC</th>
                <th className="py-2 px-2 text-right">Qty</th>
                <th className="py-2 px-2 text-center">Unit</th>
                <th className="py-2 px-2 text-right">Rate (₹)</th>
                <th className="py-2 px-2 text-right">Disc %</th>
                <th className="py-2 px-2 text-right">Taxable (₹)</th>
                {isIntraState ? (
                  <>
                    <th className="py-2 px-2 text-right">CGST</th>
                    <th className="py-2 px-2 text-right">SGST</th>
                  </>
                ) : (
                  <th className="py-2 px-2 text-right">IGST</th>
                )}
                <th className="py-2 px-3 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/50">
                  <td className="py-2 px-2 text-center text-slate-500 font-mono">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3">
                    <div className="font-medium text-slate-900">
                      {item.description}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-slate-700">
                    {item.hsnSacCode || '-'}
                  </td>
                  <td className="py-2 px-2 text-right font-medium text-slate-900">
                    {item.quantity}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-600">
                    {item.unit}
                  </td>
                  <td className="py-2 px-2 text-right font-mono">
                    {item.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-right text-slate-600">
                    {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-medium text-slate-900">
                    {item.taxableAmount.toFixed(2)}
                  </td>
                  {isIntraState ? (
                    <>
                      <td className="py-2 px-2 text-right font-mono text-slate-700">
                        <div className="text-[10px] text-slate-500">
                          {item.cgstRate}%
                        </div>
                        {item.cgstAmount.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-700">
                        <div className="text-[10px] text-slate-500">
                          {item.sgstRate}%
                        </div>
                        {item.sgstAmount.toFixed(2)}
                      </td>
                    </>
                  ) : (
                    <td className="py-2 px-2 text-right font-mono text-slate-700">
                      <div className="text-[10px] text-slate-500">
                        {item.igstRate}%
                      </div>
                      {item.igstAmount.toFixed(2)}
                    </td>
                  )}
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    {item.lineTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Table Subtotals Footer */}
            <tfoot className="bg-slate-50 font-semibold text-slate-900 border-t border-slate-300">
              <tr>
                <td colSpan={3} className="py-2 px-3 text-right">
                  Total Quantities:
                </td>
                <td className="py-2 px-2 text-right font-bold">
                  {invoice.items.reduce((sum, it) => sum + it.quantity, 0)}
                </td>
                <td colSpan={3} className="py-2 px-2 text-right font-bold">
                  Total Taxable:
                </td>
                <td className="py-2 px-2 text-right font-mono font-bold">
                  {invoice.totalTaxableAmount.toFixed(2)}
                </td>
                {isIntraState ? (
                  <>
                    <td className="py-2 px-2 text-right font-mono font-bold">
                      {invoice.totalCgst.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold">
                      {invoice.totalSgst.toFixed(2)}
                    </td>
                  </>
                ) : (
                  <td className="py-2 px-2 text-right font-mono font-bold">
                    {invoice.totalIgst.toFixed(2)}
                  </td>
                )}
                <td className="py-2 px-3 text-right font-mono font-bold text-sm">
                  {invoice.subtotal.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* HSN/SAC Tax Breakdown Table (Mandatory GST compliance) */}
        <div className="border border-slate-300 rounded-lg overflow-hidden mb-4">
          <div className="bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-300">
            HSN / SAC Tax Breakdown Summary
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-1.5 px-3">HSN / SAC</th>
                <th className="py-1.5 px-2 text-right">Taxable Value (₹)</th>
                {isIntraState ? (
                  <>
                    <th className="py-1.5 px-2 text-right">CGST Rate</th>
                    <th className="py-1.5 px-2 text-right">CGST Amt (₹)</th>
                    <th className="py-1.5 px-2 text-right">SGST Rate</th>
                    <th className="py-1.5 px-2 text-right">SGST Amt (₹)</th>
                  </>
                ) : (
                  <>
                    <th className="py-1.5 px-2 text-right">IGST Rate</th>
                    <th className="py-1.5 px-2 text-right">IGST Amt (₹)</th>
                  </>
                )}
                <th className="py-1.5 px-3 text-right">Total Tax (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hsnRows.map((hsn, idx) => (
                <tr key={idx}>
                  <td className="py-1.5 px-3 font-mono font-medium">
                    {hsn.hsnSacCode}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono">
                    {hsn.taxableValue.toFixed(2)}
                  </td>
                  {isIntraState ? (
                    <>
                      <td className="py-1.5 px-2 text-right">{hsn.cgstRate}%</td>
                      <td className="py-1.5 px-2 text-right font-mono">
                        {hsn.cgstAmount.toFixed(2)}
                      </td>
                      <td className="py-1.5 px-2 text-right">{hsn.sgstRate}%</td>
                      <td className="py-1.5 px-2 text-right font-mono">
                        {hsn.sgstAmount.toFixed(2)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-1.5 px-2 text-right">{hsn.igstRate}%</td>
                      <td className="py-1.5 px-2 text-right font-mono">
                        {hsn.igstAmount.toFixed(2)}
                      </td>
                    </>
                  )}
                  <td className="py-1.5 px-3 text-right font-mono font-semibold">
                    {hsn.totalTax.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculations & Words Conversion Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Amount In Words & Notes */}
          <div className="border border-slate-300 rounded-lg p-3 text-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Total Invoice Amount in Words
              </span>
              <p className="font-bold text-slate-900 italic text-sm leading-relaxed mb-3">
                {invoice.amountInWords}
              </p>

              {invoice.notes && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    Customer Remarks
                  </span>
                  <p className="text-slate-600 text-xs">{invoice.notes}</p>
                </div>
              )}
            </div>

            {/* Terms & Conditions list */}
            {invoice.terms && invoice.terms.length > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Terms & Conditions
                </span>
                <ul className="list-decimal list-inside text-[11px] text-slate-600 space-y-0.5">
                  {invoice.terms.map((term, i) => (
                    <li key={i}>{term}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Totals Summary Column */}
          <div className="border border-slate-300 rounded-lg p-3 text-xs space-y-1.5 bg-slate-50">
            <div className="flex justify-between text-slate-700 py-0.5">
              <span>Total Taxable Value:</span>
              <span className="font-mono font-medium">
                {formatINR(invoice.totalTaxableAmount)}
              </span>
            </div>

            {isIntraState ? (
              <>
                <div className="flex justify-between text-slate-700 py-0.5">
                  <span>Central Tax (CGST):</span>
                  <span className="font-mono font-medium">
                    {formatINR(invoice.totalCgst)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700 py-0.5">
                  <span>State Tax (SGST):</span>
                  <span className="font-mono font-medium">
                    {formatINR(invoice.totalSgst)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-slate-700 py-0.5">
                <span>Integrated Tax (IGST):</span>
                <span className="font-mono font-medium">
                  {formatINR(invoice.totalIgst)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-700 py-0.5 border-t border-slate-200">
              <span>Total Tax Amount:</span>
              <span className="font-mono font-medium">
                {formatINR(invoice.totalTax)}
              </span>
            </div>

            {invoice.roundOff !== 0 && (
              <div className="flex justify-between text-slate-600 py-0.5">
                <span>Commercial Round-off:</span>
                <span className="font-mono">
                  {invoice.roundOff > 0 ? `+${invoice.roundOff.toFixed(2)}` : invoice.roundOff.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center bg-slate-900 text-white p-2.5 rounded-md mt-2">
              <span className="font-bold text-sm tracking-wide">
                Invoice Total (INR):
              </span>
              <span className="font-mono font-black text-lg">
                {formatINR(invoice.grandTotal)}
              </span>
            </div>

            {invoice.paymentStatus !== 'PAID' && invoice.paidAmount > 0 && (
              <div className="pt-2 border-t border-slate-200 space-y-1 text-[11px]">
                <div className="flex justify-between text-emerald-700">
                  <span>Amount Paid:</span>
                  <span className="font-mono">{formatINR(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Balance Due:</span>
                  <span className="font-mono">{formatINR(invoice.balanceDue)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bank & Settlement Details + Signatory Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-300 rounded-lg p-3 text-xs">
          {/* Bank Info */}
          <div className="sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Bank Details for NEFT / RTGS
            </span>
            <div className="space-y-0.5 text-slate-700">
              <div>
                <span className="font-semibold text-slate-900">Bank: </span>
                {invoice.seller.bankName}
              </div>
              <div>
                <span className="font-semibold text-slate-900">A/C No: </span>
                <span className="font-mono font-bold text-slate-900">
                  {invoice.seller.accountNumber}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-900">IFSC: </span>
                <span className="font-mono font-bold text-slate-900">
                  {invoice.seller.ifscCode}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-900">Branch: </span>
                {invoice.seller.branch}
              </div>
            </div>
          </div>

          {/* UPI QR Code */}
          <div className="sm:col-span-1 flex items-center justify-center sm:border-l sm:border-r border-slate-200 py-1 sm:px-3">
            {invoice.seller.upiId ? (
              <div className="flex items-center gap-3">
                {qrImageUrl && (
                  <img
                    src={qrImageUrl}
                    alt="UPI QR Code"
                    className="w-20 h-20 border border-slate-300 rounded p-1 bg-white"
                  />
                )}
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide block">
                    Scan & Pay with UPI
                  </span>
                  <p className="font-mono text-[11px] font-bold text-slate-900">
                    {invoice.seller.upiId}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    GPay, PhonePe, Paytm
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 text-[11px]">
                No UPI ID configured
              </div>
            )}
          </div>

          {/* Authorized Signatory Stamp Box */}
          <div className="sm:col-span-1 flex flex-col justify-between text-right">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block">
                For {invoice.seller.legalName}
              </span>
            </div>
            <div className="pt-8">
              <div className="border-t border-slate-400 inline-block w-36 pt-1 text-center">
                <span className="font-bold text-slate-800 text-[11px] block">
                  Authorized Signatory
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer legal disclaimer */}
        <div className="mt-4 text-center text-[10px] text-slate-400 border-t border-slate-200 pt-2">
          This is a computer-generated tax invoice issued under Section 31 of
          the Central Goods and Services Tax Act, 2017.
        </div>
      </div>
    </div>
  );
};
