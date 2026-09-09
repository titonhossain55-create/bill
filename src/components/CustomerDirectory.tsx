import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  Mail,
  Phone,
  MapPin,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Customer } from '../types';
import {
  extractPanFromGSTIN,
  extractStateCodeFromGSTIN,
  getStateByCode,
  INDIAN_STATES,
  isValidGSTIN,
} from '../utils/gstEngine';

interface CustomerDirectoryProps {
  customers: Customer[];
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export const CustomerDirectory: React.FC<CustomerDirectoryProps> = ({
  customers,
  onSaveCustomer,
  onDeleteCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'B2B' | 'B2C'>('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer>>({
    businessName: '',
    contactPerson: '',
    gstin: '',
    pan: '',
    email: '',
    phone: '',
    billingAddress: '',
    city: '',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '',
    placeOfSupply: 'Maharashtra (27)',
    isB2B: true,
  });

  const handleOpenNew = () => {
    setEditingCustomer({
      businessName: '',
      contactPerson: '',
      gstin: '',
      pan: '',
      email: '',
      phone: '',
      billingAddress: '',
      city: '',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '',
      placeOfSupply: 'Maharashtra (27)',
      isB2B: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer({ ...customer });
    setIsModalOpen(true);
  };

  const handleGstinInput = (val: string) => {
    const clean = val.toUpperCase().trim();
    const detectedCode = extractStateCodeFromGSTIN(clean);
    const detectedPan = extractPanFromGSTIN(clean);

    let updatedState = editingCustomer.state;
    let updatedCode = editingCustomer.stateCode;
    let updatedPlace = editingCustomer.placeOfSupply;

    if (detectedCode) {
      const stateObj = getStateByCode(detectedCode);
      if (stateObj) {
        updatedState = stateObj.name;
        updatedCode = stateObj.code;
        updatedPlace = `${stateObj.name} (${stateObj.code})`;
      }
    }

    setEditingCustomer((prev) => ({
      ...prev,
      gstin: clean,
      pan: detectedPan || prev.pan,
      state: updatedState,
      stateCode: updatedCode,
      placeOfSupply: updatedPlace,
      isB2B: clean.length > 0,
    }));
  };

  const handleStateChange = (code: string) => {
    const s = getStateByCode(code);
    if (s) {
      setEditingCustomer((prev) => ({
        ...prev,
        stateCode: s.code,
        state: s.name,
        placeOfSupply: `${s.name} (${s.code})`,
      }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer.businessName?.trim()) {
      alert('Client / Business name is required');
      return;
    }

    const stateObj = getStateByCode(editingCustomer.stateCode || '27');
    const customerToSave: Customer = {
      id: editingCustomer.id || 'cust-' + Date.now(),
      businessName: editingCustomer.businessName.trim(),
      contactPerson: editingCustomer.contactPerson?.trim() || '',
      gstin: editingCustomer.gstin?.trim() || undefined,
      pan: editingCustomer.pan?.trim() || undefined,
      email: editingCustomer.email?.trim() || '',
      phone: editingCustomer.phone?.trim() || '',
      billingAddress: editingCustomer.billingAddress?.trim() || 'Address on file',
      city: editingCustomer.city?.trim() || '',
      state: stateObj?.name || 'Maharashtra',
      stateCode: stateObj?.code || '27',
      pincode: editingCustomer.pincode?.trim() || '',
      placeOfSupply: `${stateObj?.name || 'Maharashtra'} (${stateObj?.code || '27'})`,
      isB2B: !!editingCustomer.gstin?.trim(),
    };

    onSaveCustomer(customerToSave);
    setIsModalOpen(false);
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.gstin && c.gstin.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'ALL' ||
      (categoryFilter === 'B2B' && c.isB2B) ||
      (categoryFilter === 'B2C' && !c.isB2B);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Customer Directory
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Store regular buyers, business addresses, GSTIN numbers, and
            default places of supply
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, GSTIN, city..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              categoryFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Clients ({customers.length})
          </button>
          <button
            onClick={() => setCategoryFilter('B2B')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              categoryFilter === 'B2B'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            B2B Registered ({customers.filter((c) => c.isB2B).length})
          </button>
          <button
            onClick={() => setCategoryFilter('B2C')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              categoryFilter === 'B2C'
                ? 'bg-white text-purple-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            B2C Consumers ({customers.filter((c) => !c.isB2B).length})
          </button>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((c) => (
          <div
            key={c.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-1 ${
                      c.isB2B
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {c.isB2B ? 'B2B Registered' : 'B2C Retail Consumer'}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {c.businessName}
                  </h3>
                  {c.contactPerson && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Attn: {c.contactPerson}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-md"
                    title="Edit client"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteCustomer(c.id)}
                    className="p-1.5 hover:bg-red-50 text-red-500 rounded-md"
                    title="Delete client"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* GSTIN & State Badge */}
              <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">GSTIN:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {c.gstin || 'None (Consumer)'}
                  </span>
                </div>
                {c.pan && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">PAN:</span>
                    <span className="font-mono text-slate-700">{c.pan}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Place of Supply:</span>
                  <span className="font-medium text-slate-900">
                    {c.state} ({c.stateCode})
                  </span>
                </div>
              </div>

              {/* Address & Contact Details */}
              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">
                    {c.billingAddress}, {c.city} - {c.pincode}
                  </span>
                </div>
                {c.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                {editingCustomer.id ? 'Edit Customer' : 'Add New Customer'}
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
                  Business or Buyer Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingCustomer.businessName}
                  onChange={(e) =>
                    setEditingCustomer({
                      ...editingCustomer,
                      businessName: e.target.value,
                    })
                  }
                  placeholder="e.g. Acme Tech Solutions Pvt. Ltd."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  GSTIN (Auto-detects State & PAN)
                </label>
                <input
                  type="text"
                  value={editingCustomer.gstin || ''}
                  onChange={(e) => handleGstinInput(e.target.value)}
                  placeholder="e.g. 27AABCA1234F1Z5 (Leave blank for retail consumer)"
                  className="w-full px-3 py-2 font-mono text-xs border border-slate-300 rounded-lg bg-white"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  First 2 digits determine State Code, next 10 are PAN.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.pan || ''}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        pan: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="AABCA1234F"
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    State / Place of Supply *
                  </label>
                  <select
                    value={editingCustomer.stateCode}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.contactPerson || ''}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        contactPerson: e.target.value,
                      })
                    }
                    placeholder="Name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.phone || ''}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+91 98..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editingCustomer.email || ''}
                  onChange={(e) =>
                    setEditingCustomer({
                      ...editingCustomer,
                      email: e.target.value,
                    })
                  }
                  placeholder="accounts@client.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Billing Street Address
                </label>
                <input
                  type="text"
                  value={editingCustomer.billingAddress || ''}
                  onChange={(e) =>
                    setEditingCustomer({
                      ...editingCustomer,
                      billingAddress: e.target.value,
                    })
                  }
                  placeholder="Office/Floor, Tech Park, Street"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.city || ''}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        city: e.target.value,
                      })
                    }
                    placeholder="Mumbai / Bengaluru"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.pincode || ''}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        pincode: e.target.value,
                      })
                    }
                    placeholder="400001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
