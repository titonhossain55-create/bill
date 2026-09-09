import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  Building2,
  Users,
  Layers,
  ArrowDownToLine,
  Filter,
} from 'lucide-react';
import { GSTSlab, Invoice } from '../types';
import { formatINR, GST_SLABS } from '../utils/gstEngine';

interface GSTR1SummaryProps {
  invoices: Invoice[];
}

export const GSTR1Summary: React.FC<GSTR1SummaryProps> = ({ invoices }) => {
  const [period, setPeriod] = useState<'ALL' | 'THIS_MONTH' | 'FY_2026'>('ALL');
  const [copied, setCopied] = useState(false);

  // Filter invoices based on selected period
  const activeInvoices = invoices.filter((inv) => {
    if (period === 'ALL') return true;
    const invDate = new Date(inv.date);
    const now = new Date();
    if (period === 'THIS_MONTH') {
      return (
        invDate.getMonth() === now.getMonth() &&
        invDate.getFullYear() === now.getFullYear()
      );
    }
    if (period === 'FY_2026') {
      // Indian FY 2026-27 starts April 1, 2026 to March 31, 2027
      const fyStart = new Date('2026-04-01');
      const fyEnd = new Date('2027-03-31');
      return invDate >= fyStart && invDate <= fyEnd;
    }
    return true;
  });

  // B2B (registered with GSTIN) vs B2C (unregistered)
  const b2bInvoices = activeInvoices.filter((i) => i.customer.isB2B);
  const b2cInvoices = activeInvoices.filter((i) => !i.customer.isB2B);

  const b2bTaxable = b2bInvoices.reduce((sum, i) => sum + i.totalTaxableAmount, 0);
  const b2bTax = b2bInvoices.reduce((sum, i) => sum + i.totalTax, 0);
  const b2bTotal = b2bInvoices.reduce((sum, i) => sum + i.grandTotal, 0);

  const b2cTaxable = b2cInvoices.reduce((sum, i) => sum + i.totalTaxableAmount, 0);
  const b2cTax = b2cInvoices.reduce((sum, i) => sum + i.totalTax, 0);
  const b2cTotal = b2cInvoices.reduce((sum, i) => sum + i.grandTotal, 0);

  const totalTurnover = b2bTotal + b2cTotal;
  const totalTaxable = b2bTaxable + b2cTaxable;
  const totalTax = b2bTax + b2cTax;

  // Slab-wise aggregation
  const slabMap = new Map<
    GSTSlab,
    {
      slab: GSTSlab;
      taxable: number;
      cgst: number;
      sgst: number;
      igst: number;
      totalTax: number;
      itemCount: number;
    }
  >();

  GST_SLABS.forEach((s) => {
    slabMap.set(s, {
      slab: s,
      taxable: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
      itemCount: 0,
    });
  });

  // HSN-wise aggregation
  const hsnMap = new Map<
    string,
    {
      hsnCode: string;
      desc: string;
      unit: string;
      quantity: number;
      totalValue: number;
      taxableValue: number;
      cgst: number;
      sgst: number;
      igst: number;
      totalTax: number;
    }
  >();

  activeInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      // Slab Map
      const slabEntry = slabMap.get(item.gstSlab);
      if (slabEntry) {
        slabEntry.taxable += item.taxableAmount;
        slabEntry.cgst += item.cgstAmount;
        slabEntry.sgst += item.sgstAmount;
        slabEntry.igst += item.igstAmount;
        slabEntry.totalTax += item.totalTax;
        slabEntry.itemCount += 1;
      }

      // HSN Map
      const hsnKey = `${item.hsnSacCode}_${item.gstSlab}`;
      const existingHsn = hsnMap.get(hsnKey);
      if (existingHsn) {
        existingHsn.quantity += item.quantity;
        existingHsn.totalValue += item.lineTotal;
        existingHsn.taxableValue += item.taxableAmount;
        existingHsn.cgst += item.cgstAmount;
        existingHsn.sgst += item.sgstAmount;
        existingHsn.igst += item.igstAmount;
        existingHsn.totalTax += item.totalTax;
      } else {
        hsnMap.set(hsnKey, {
          hsnCode: item.hsnSacCode || 'N/A',
          desc: item.description,
          unit: item.unit,
          quantity: item.quantity,
          totalValue: item.lineTotal,
          taxableValue: item.taxableAmount,
          cgst: item.cgstAmount,
          sgst: item.sgstAmount,
          igst: item.igstAmount,
          totalTax: item.totalTax,
        });
      }
    });
  });

  const slabRows = Array.from(slabMap.values());
  const hsnRows = Array.from(hsnMap.values());

  const exportCSV = () => {
    let csv = 'GSTR-1 Tax Summary Report\n';
    csv += `Period: ${period}\n`;
    csv += `Generated On: ${new Date().toLocaleDateString()}\n\n`;

    csv += '--- B2B vs B2C Sales Split ---\n';
    csv += 'Category,Invoices Count,Taxable Value (INR),Total Tax (INR),Grand Total (INR)\n';
    csv += `B2B (Registered GSTIN),${b2bInvoices.length},${b2bTaxable.toFixed(2)},${b2bTax.toFixed(2)},${b2bTotal.toFixed(2)}\n`;
    csv += `B2C (Retail Consumer),${b2cInvoices.length},${b2cTaxable.toFixed(2)},${b2cTax.toFixed(2)},${b2cTotal.toFixed(2)}\n`;
    csv += `TOTAL,${activeInvoices.length},${totalTaxable.toFixed(2)},${totalTax.toFixed(2)},${totalTurnover.toFixed(2)}\n\n`;

    csv += '--- GST Slab-wise Breakdown ---\n';
    csv += 'GST Slab (%),Taxable Value (INR),CGST (INR),SGST (INR),IGST (INR),Total Tax (INR)\n';
    slabRows.forEach((row) => {
      csv += `${row.slab}%,${row.taxable.toFixed(2)},${row.cgst.toFixed(2)},${row.sgst.toFixed(2)},${row.igst.toFixed(2)},${row.totalTax.toFixed(2)}\n`;
    });
    csv += '\n';

    csv += '--- HSN / SAC Summary ---\n';
    csv += 'HSN/SAC,Description,Unit,Total Quantity,Total Value,Taxable Value,CGST,SGST,IGST,Total Tax\n';
    hsnRows.forEach((h) => {
      csv += `"${h.hsnCode}","${h.desc}","${h.unit}",${h.quantity},${h.totalValue.toFixed(2)},${h.taxableValue.toFixed(2)},${h.cgst.toFixed(2)},${h.sgst.toFixed(2)},${h.igst.toFixed(2)},${h.totalTax.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GSTR1_Summary_${period}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyCAExport = async () => {
    let text = `*GSTR-1 TAX SUMMARY REPORT*\n`;
    text += `Period: ${period}\n`;
    text += `Total Turnover: ${formatINR(totalTurnover)}\n`;
    text += `Total Taxable: ${formatINR(totalTaxable)}\n`;
    text += `Total GST Collected: ${formatINR(totalTax)}\n\n`;
    text += `*B2B vs B2C Split:*\n`;
    text += `- B2B (Registered): ${b2bInvoices.length} invoices | Taxable: ${formatINR(b2bTaxable)} | Tax: ${formatINR(b2bTax)}\n`;
    text += `- B2C (Consumer): ${b2cInvoices.length} invoices | Taxable: ${formatINR(b2cTaxable)} | Tax: ${formatINR(b2cTax)}\n\n`;
    text += `*Slab-wise Tax Breakdown:*\n`;
    slabRows.forEach((r) => {
      if (r.taxable > 0) {
        text += `- ${r.slab}% Slab: Taxable ${formatINR(r.taxable)} | CGST ${formatINR(r.cgst)} | SGST ${formatINR(r.sgst)} | IGST ${formatINR(r.igst)}\n`;
      }
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900">
              GSTR-1 Tax Computation & Filing Summary
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Slab-wise breakdown, B2B vs. B2C separation, and HSN/SAC summary
            ready for GST Portal upload
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-700"
          >
            <option value="ALL">All Recorded Invoices</option>
            <option value="THIS_MONTH">Current Month</option>
            <option value="FY_2026">Financial Year 2026-27</option>
          </select>

          <button
            onClick={copyCAExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
            title="Copy formatted text summary"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* B2B vs B2C Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* B2B Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Table 4: B2B Invoices (Registered Buyers)
                </h2>
                <span className="text-xs text-slate-500">
                  Supplies made to buyers with valid GSTIN
                </span>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
              {b2bInvoices.length} Invoices
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Taxable Value
              </span>
              <span className="text-sm font-bold font-mono text-slate-900">
                {formatINR(b2bTaxable)}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Total Tax
              </span>
              <span className="text-sm font-bold font-mono text-blue-700">
                {formatINR(b2bTax)}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Invoice Total
              </span>
              <span className="text-sm font-bold font-mono text-slate-900">
                {formatINR(b2bTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* B2C Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Table 7: B2C Invoices (Retail Consumers)
                </h2>
                <span className="text-xs text-slate-500">
                  Supplies to unregistered retail buyers
                </span>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
              {b2cInvoices.length} Invoices
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Taxable Value
              </span>
              <span className="text-sm font-bold font-mono text-slate-900">
                {formatINR(b2cTaxable)}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Total Tax
              </span>
              <span className="text-sm font-bold font-mono text-purple-700">
                {formatINR(b2cTax)}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Invoice Total
              </span>
              <span className="text-sm font-bold font-mono text-slate-900">
                {formatINR(b2cTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Standard GST Slabs Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Slab-wise GST Rate Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Central GST (CGST), State GST (SGST), and Integrated GST (IGST) by
              statutory tax slab
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
            5 Statutory Slabs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">GST Slab Rate</th>
                <th className="py-3 px-4 text-center">Items Billed</th>
                <th className="py-3 px-4 text-right">Taxable Value (₹)</th>
                <th className="py-3 px-4 text-right">Central Tax - CGST (₹)</th>
                <th className="py-3 px-4 text-right">State Tax - SGST (₹)</th>
                <th className="py-3 px-4 text-right">Integrated Tax - IGST (₹)</th>
                <th className="py-3 px-4 text-right">Total Tax (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slabRows.map((row) => (
                <tr key={row.slab} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-mono">
                      {row.slab}% GST
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600 font-mono">
                    {row.itemCount}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                    {row.taxable.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">
                    {row.cgst.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">
                    {row.sgst.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">
                    {row.igst.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                    {row.totalTax.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Total Footer */}
            <tfoot className="bg-slate-900 text-white font-semibold">
              <tr>
                <td colSpan={2} className="py-3 px-4 text-sm font-bold">
                  Total GSTR-1 Summary
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                  {totalTaxable.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold">
                  {slabRows.reduce((s, r) => s + r.cgst, 0).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold">
                  {slabRows.reduce((s, r) => s + r.sgst, 0).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold">
                  {slabRows.reduce((s, r) => s + r.igst, 0).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-base">
                  {totalTax.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Table 12: HSN Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Table 12: HSN / SAC Code Summary
            </h2>
            <p className="text-xs text-slate-500">
              Itemized classification required for Section 12 GST filing
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">HSN / SAC</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-3 text-center">UQC</th>
                <th className="py-3 px-3 text-right">Total Qty</th>
                <th className="py-3 px-3 text-right">Total Value (₹)</th>
                <th className="py-3 px-3 text-right">Taxable Value (₹)</th>
                <th className="py-3 px-3 text-right">CGST (₹)</th>
                <th className="py-3 px-3 text-right">SGST (₹)</th>
                <th className="py-3 px-3 text-right">IGST (₹)</th>
                <th className="py-3 px-4 text-right">Total Tax (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hsnRows.map((h, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {h.hsnCode}
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-medium">
                    {h.desc}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-600">
                    {h.unit}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium">
                    {h.quantity}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {h.totalValue.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-slate-900">
                    {h.taxableValue.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    {h.cgst.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    {h.sgst.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    {h.igst.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    {h.totalTax.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
