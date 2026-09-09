import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Tag,
  Briefcase,
  Box,
} from 'lucide-react';
import { GSTSlab, ProductItem } from '../types';
import { COMMON_UNITS, formatINR, GST_SLABS } from '../utils/gstEngine';

interface ProductCatalogProps {
  products: ProductItem[];
  onSaveProduct: (product: ProductItem) => void;
  onDeleteProduct: (id: string) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  onSaveProduct,
  onDeleteProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'GOODS' | 'SERVICE'>('ALL');
  const [slabFilter, setSlabFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ProductItem>>({
    name: '',
    description: '',
    hsnSacCode: '',
    type: 'GOODS',
    unit: 'Nos',
    unitPrice: 1000,
    gstSlab: 18,
  });

  const handleOpenNew = () => {
    setEditingItem({
      name: '',
      description: '',
      hsnSacCode: '',
      type: 'GOODS',
      unit: 'Nos',
      unitPrice: 1000,
      gstSlab: 18,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: ProductItem) => {
    setEditingItem({ ...product });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.name?.trim()) {
      alert('Product or Service Name is required');
      return;
    }
    const productToSave: ProductItem = {
      id: editingItem.id || 'prod-' + Date.now(),
      name: editingItem.name.trim(),
      description: editingItem.description?.trim() || '',
      hsnSacCode: editingItem.hsnSacCode?.trim() || (editingItem.type === 'GOODS' ? '8471' : '998313'),
      type: editingItem.type || 'GOODS',
      unit: editingItem.unit || 'Nos',
      unitPrice: Number(editingItem.unitPrice) || 0,
      gstSlab: (editingItem.gstSlab ?? 18) as GSTSlab,
    };
    onSaveProduct(productToSave);
    setIsModalOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.hsnSacCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
    const matchesSlab =
      slabFilter === 'ALL' || p.gstSlab.toString() === slabFilter;

    return matchesSearch && matchesType && matchesSlab;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Product & Service Catalog
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Store reusable items with HSN/SAC codes, default prices, and tax
            slabs for 1-click invoice line addition
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product / Service</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, HSN code, description..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Type Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                typeFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('GOODS')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                typeFilter === 'GOODS'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Goods
            </button>
            <button
              onClick={() => setTypeFilter('SERVICE')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                typeFilter === 'SERVICE'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Services
            </button>
          </div>

          {/* Slab Filter */}
          <select
            value={slabFilter}
            onChange={(e) => setSlabFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 font-medium"
          >
            <option value="ALL">All Slabs</option>
            {GST_SLABS.map((s) => (
              <option key={s} value={s.toString()}>
                {s}% Slab
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Item Name & Description</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3 text-center">HSN / SAC</th>
                <th className="py-3 px-3 text-center">Unit</th>
                <th className="py-3 px-4 text-right">Default Rate (₹)</th>
                <th className="py-3 px-3 text-center">GST Slab</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      {p.description && (
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                          p.type === 'GOODS'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {p.type === 'GOODS' ? (
                          <Box className="w-3 h-3" />
                        ) : (
                          <Briefcase className="w-3 h-3" />
                        )}
                        <span>{p.type}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800">
                      {p.hsnSacCode}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 font-medium">
                      {p.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatINR(p.unitPrice)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                        {p.gstSlab}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition-colors"
                          title="Edit product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1.5 hover:bg-red-100 text-red-500 rounded-md transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No items found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                {editingItem.id ? 'Edit Catalog Item' : 'Add Item to Catalog'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Item / Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value })
                  }
                  placeholder="e.g. Enterprise Server or Software Consulting"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Item Description
                </label>
                <textarea
                  rows={2}
                  value={editingItem.description}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value })
                  }
                  placeholder="Technical specifications, scope, or details..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Classification
                  </label>
                  <select
                    value={editingItem.type}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        type: e.target.value as 'GOODS' | 'SERVICE',
                        hsnSacCode:
                          e.target.value === 'SERVICE' ? '998313' : '8471',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="GOODS">Goods (HSN Code)</option>
                    <option value="SERVICE">Services (SAC Code)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {editingItem.type === 'GOODS' ? 'HSN Code' : 'SAC Code'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.hsnSacCode}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        hsnSacCode: e.target.value,
                      })
                    }
                    placeholder="e.g. 8471"
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Unit of Measurement
                  </label>
                  <select
                    value={editingItem.unit}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, unit: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editingItem.unitPrice}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        unitPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    GST Slab Rate
                  </label>
                  <select
                    value={editingItem.gstSlab}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        gstSlab: parseInt(e.target.value, 10) as GSTSlab,
                      })
                    }
                    className="w-full px-3 py-2 font-bold text-emerald-700 border border-slate-300 rounded-lg bg-white"
                  >
                    {GST_SLABS.map((s) => (
                      <option key={s} value={s}>
                        {s}% GST
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
