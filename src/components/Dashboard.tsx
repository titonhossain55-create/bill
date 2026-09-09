import React, { useState } from 'react';
import {
  TrendingUp,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Clock,
  PlusCircle,
  FileSpreadsheet,
  Search,
  Eye,
  Printer,
  ChevronRight,
  IndianRupee,
  Building2,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { BusinessProfile, Invoice } from '../types';
import { formatINR } from '../utils/gstEngine';

interface DashboardProps {
  invoices: Invoice[];
  businessProfile: BusinessProfile;
  onNewInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  invoices,
  businessProfile,
  onNewInvoice,
  onViewInvoice,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

  // Compute Aggregations
  const totalSalesTurnover = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalTaxableTurnover = invoices.reduce(
    (sum, inv) => sum + inv.totalTaxableAmount,
    0
  );
  const totalGstCollected = invoices.reduce((sum, inv) => sum + inv.totalTax, 0);
  const totalCgst = invoices.reduce((sum, inv) => sum + inv.totalCgst, 0);
  const totalSgst = invoices.reduce((sum, inv) => sum + inv.totalSgst, 0);
  const totalIgst = invoices.reduce((sum, inv) => sum + inv.totalIgst, 0);

  const outstandingReceivables = invoices.reduce((sum, inv) => {
    if (inv.paymentStatus === 'PAID') return sum;
    return sum + (inv.balanceDue || inv.grandTotal);
  }, 0);

  const totalPaidAmount = invoices.reduce((sum, inv) => {
    if (inv.paymentStatus === 'PAID') return sum + inv.grandTotal;
    return sum + (inv.paidAmount || 0);
  }, 0);

  const paidCount = invoices.filter((i) => i.paymentStatus === 'PAID').length;
  const pendingCount = invoices.filter((i) => i.paymentStatus !== 'PAID').length;

  // B2B vs B2C metrics
  const b2bInvoices = invoices.filter((i) => i.customer.isB2B);
  const b2cInvoices = invoices.filter((i) => !i.customer.isB2B);
  const b2bTurnover = b2bInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const b2cTurnover = b2cInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

  // Filtered recent invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customer.gstin &&
        inv.customer.gstin.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === 'PAID') {
      return matchesSearch && inv.paymentStatus === 'PAID';
    }
    if (statusFilter === 'PENDING') {
      return matchesSearch && inv.paymentStatus !== 'PAID';
    }
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              GST Billing & Tax Dashboard
            </h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
              FY 2026-27
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registered Entity:{' '}
            <strong className="text-slate-800 font-medium">
              {businessProfile.legalName}
            </strong>{' '}
            • GSTIN: <span className="font-mono">{businessProfile.gstin}</span>{' '}
            ({businessProfile.state} - {businessProfile.stateCode})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('gstr1')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span>GSTR-1 Summary</span>
          </button>

          <button
            onClick={onNewInvoice}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Primary Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Sales Turnover */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Turnover
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatINR(totalSalesTurnover)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Taxable: <span className="font-mono">{formatINR(totalTaxableTurnover)}</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total GST Tax Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total GST Tax
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-blue-700 font-mono tracking-tight">
              {formatINR(totalGstCollected)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <span>CGST: ₹{Math.round(totalCgst).toLocaleString('en-IN')}</span>
              <span>•</span>
              <span>SGST: ₹{Math.round(totalSgst).toLocaleString('en-IN')}</span>
              <span>•</span>
              <span>IGST: ₹{Math.round(totalIgst).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Outstanding Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Outstanding Dues
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-700 font-mono tracking-tight">
              {formatINR(outstandingReceivables)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Collected:{' '}
              <span className="font-mono font-medium text-emerald-700">
                {formatINR(totalPaidAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Invoice Counts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Invoice Registry
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {invoices.length} <span className="text-xs text-slate-400 font-normal">Bills</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
              <span className="text-emerald-700 font-semibold">
                ● {paidCount} Paid
              </span>
              <span className="text-amber-700 font-semibold">
                ● {pendingCount} Pending
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Breakdown & B2B/B2C Split Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tax Split Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Tax Split: Intra-State vs. Inter-State
            </h2>
            <span className="text-[11px] text-slate-400">Total Tax Engine Output</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Central Tax (CGST)
              </span>
              <div className="text-base font-bold font-mono text-slate-900 mt-1">
                {formatINR(totalCgst)}
              </div>
              <span className="text-[10px] text-slate-500">Intra-State (50%)</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                State Tax (SGST)
              </span>
              <div className="text-base font-bold font-mono text-slate-900 mt-1">
                {formatINR(totalSgst)}
              </div>
              <span className="text-[10px] text-slate-500">Intra-State (50%)</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Integrated (IGST)
              </span>
              <div className="text-base font-bold font-mono text-slate-900 mt-1">
                {formatINR(totalIgst)}
              </div>
              <span className="text-[10px] text-slate-500">Inter-State (100%)</span>
            </div>
          </div>
        </div>

        {/* B2B vs B2C Split Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Sales Classification (GSTR-1 Categorization)
            </h2>
            <button
              onClick={() => onNavigateTab('gstr1')}
              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              <span>View Table</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  B2B Registered
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                  {b2bInvoices.length} Bills
                </span>
              </div>
              <div className="text-base font-bold font-mono text-slate-900 mt-1">
                {formatINR(b2bTurnover)}
              </div>
              <span className="text-[10px] text-slate-500">
                GSTIN Verified Buyers
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  B2C Retail
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-800 font-bold px-1.5 py-0.5 rounded">
                  {b2cInvoices.length} Bills
                </span>
              </div>
              <div className="text-base font-bold font-mono text-slate-900 mt-1">
                {formatINR(b2cTurnover)}
              </div>
              <span className="text-[10px] text-slate-500">
                Unregistered Consumers
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices Section with Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Recent Tax Invoices
            </h2>
            <p className="text-xs text-slate-500">
              Showing {filteredInvoices.length} of {invoices.length} recorded invoices
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search invoice or client..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden w-48 sm:w-56"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('PAID')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === 'PAID'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === 'PENDING'
                    ? 'bg-white text-amber-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending
              </button>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer & State</th>
                <th className="py-3 px-3">Supply Type</th>
                <th className="py-3 px-4 text-right">Taxable (₹)</th>
                <th className="py-3 px-4 text-right">Total GST (₹)</th>
                <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.slice(0, 10).map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{inv.date}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {inv.customer.businessName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {inv.customer.gstin || 'B2C Retail Consumer'} •{' '}
                        {inv.placeOfSupply}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                          inv.supplyType === 'INTRA_STATE'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {inv.supplyType === 'INTRA_STATE'
                          ? 'CGST+SGST'
                          : 'IGST'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {inv.totalTaxableAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {inv.totalTax.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatINR(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          inv.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.paymentStatus === 'PARTIAL'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onViewInvoice(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-semibold rounded-md transition-all shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No invoices matching current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {invoices.length > 10 && (
          <div className="p-3 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigateTab('invoices')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View All {invoices.length} Invoices →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
