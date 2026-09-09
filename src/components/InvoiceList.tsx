import React, { useState } from 'react';
import {
  Search,
  PlusCircle,
  Eye,
  Edit2,
  Trash2,
  Copy,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  Share2,
  Download,
  Filter,
} from 'lucide-react';
import { Invoice } from '../types';
import { formatINR } from '../utils/gstEngine';

interface InvoiceListProps {
  invoices: Invoice[];
  onNewInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onDuplicateInvoice: (invoice: Invoice) => void;
  onToggleStatus: (id: string, newStatus: Invoice['paymentStatus']) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  onNewInvoice,
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onDuplicateInvoice,
  onToggleStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'AMOUNT_DESC'>('DATE_DESC');

  const filteredInvoices = invoices
    .filter((inv) => {
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.customer.gstin &&
          inv.customer.gstin.toLowerCase().includes(searchTerm.toLowerCase()));

      if (statusFilter === 'PAID') return matchSearch && inv.paymentStatus === 'PAID';
      if (statusFilter === 'PENDING') return matchSearch && inv.paymentStatus !== 'PAID';
      return matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'DATE_DESC') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'DATE_ASC') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'AMOUNT_DESC') {
        return b.grandTotal - a.grandTotal;
      }
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Invoice Repository
          </h1>
          <p className="text-xs text-slate-500">
            Manage, edit, duplicate, and print GST tax invoices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNewInvoice}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Invoice</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice #, customer name, GSTIN..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        {/* Filter Chips & Sorting */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({invoices.length})
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === 'PAID'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paid ({invoices.filter((i) => i.paymentStatus === 'PAID').length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === 'PENDING'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending (
              {invoices.filter((i) => i.paymentStatus !== 'PAID').length})
            </button>
          </div>

          {/* Sort Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
          >
            <option value="DATE_DESC">Newest First</option>
            <option value="DATE_ASC">Oldest First</option>
            <option value="AMOUNT_DESC">Highest Amount</option>
          </select>
        </div>
      </div>

      {/* Invoice List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-3">Place of Supply</th>
                <th className="py-3 px-3 text-right">Taxable</th>
                <th className="py-3 px-3 text-right">GST</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">{inv.date}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {inv.customer.businessName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {inv.customer.gstin || 'Unregistered / B2C'}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-medium text-slate-800">
                        {inv.placeOfSupply}
                      </div>
                      <span
                        className={`inline-block px-1.5 py-0.2 text-[10px] font-bold rounded ${
                          inv.supplyType === 'INTRA_STATE'
                            ? 'text-emerald-700'
                            : 'text-blue-700'
                        }`}
                      >
                        {inv.supplyType === 'INTRA_STATE'
                          ? 'Intra (CGST+SGST)'
                          : 'Inter (IGST)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                      {inv.totalTaxableAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                      {inv.totalTax.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatINR(inv.grandTotal)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() =>
                          onToggleStatus(
                            inv.id,
                            inv.paymentStatus === 'PAID' ? 'PENDING' : 'PAID'
                          )
                        }
                        title="Click to toggle Paid/Pending"
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide transition-all ${
                          inv.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                      >
                        {inv.paymentStatus}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 rounded-md transition-all"
                          title="Print / Preview Invoice"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditInvoice(inv)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition-all"
                          title="Edit Invoice"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDuplicateInvoice(inv)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition-all"
                          title="Duplicate Invoice"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteInvoice(inv.id)}
                          className="p-1.5 hover:bg-red-100 text-red-500 rounded-md transition-all"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No invoices found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
