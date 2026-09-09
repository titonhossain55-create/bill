import React, { useState } from 'react';
import {
  Building2,
  Save,
  CheckCircle2,
  CreditCard,
  QrCode,
  FileText,
  Plus,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { BusinessProfile } from '../types';
import {
  extractPanFromGSTIN,
  extractStateCodeFromGSTIN,
  getStateByCode,
  INDIAN_STATES,
} from '../utils/gstEngine';
import { INITIAL_BUSINESS_PROFILE } from '../utils/storage';

interface BusinessSettingsProps {
  businessProfile: BusinessProfile;
  onSaveProfile: (profile: BusinessProfile) => void;
}

export const BusinessSettings: React.FC<BusinessSettingsProps> = ({
  businessProfile,
  onSaveProfile,
}) => {
  const [profile, setProfile] = useState<BusinessProfile>(businessProfile);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newTerm, setNewTerm] = useState('');

  const handleGstinChange = (val: string) => {
    const clean = val.toUpperCase().trim();
    const detectedCode = extractStateCodeFromGSTIN(clean);
    const detectedPan = extractPanFromGSTIN(clean);

    let updatedState = profile.state;
    let updatedCode = profile.stateCode;

    if (detectedCode) {
      const stateObj = getStateByCode(detectedCode);
      if (stateObj) {
        updatedState = stateObj.name;
        updatedCode = stateObj.code;
      }
    }

    setProfile((prev) => ({
      ...prev,
      gstin: clean,
      pan: detectedPan || prev.pan,
      state: updatedState,
      stateCode: updatedCode,
    }));
  };

  const handleStateChange = (code: string) => {
    const s = getStateByCode(code);
    if (s) {
      setProfile((prev) => ({
        ...prev,
        stateCode: s.code,
        state: s.name,
      }));
    }
  };

  const handleAddTerm = () => {
    if (!newTerm.trim()) return;
    setProfile((prev) => ({
      ...prev,
      termsAndConditions: [...prev.termsAndConditions, newTerm.trim()],
    }));
    setNewTerm('');
  };

  const handleRemoveTerm = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      termsAndConditions: prev.termsAndConditions.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(profile);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetToDefaults = () => {
    if (
      window.confirm(
        'Reset business profile and bank details to original sample template?'
      )
    ) {
      setProfile(INITIAL_BUSINESS_PROFILE);
      onSaveProfile(INITIAL_BUSINESS_PROFILE);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Business Profile & GST Settings
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Details configured here are automatically printed on all standard GST
            Tax Invoices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            id="btn-save-business-profile"
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Business profile, GSTIN configuration, and bank credentials saved
            successfully!
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* 1. Legal Entity & GST Details */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Entity & Tax Identifiers</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Legal Registered Business Name *
              </label>
              <input
                type="text"
                required
                value={profile.legalName}
                onChange={(e) =>
                  setProfile({ ...profile, legalName: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Trade Name / Brand (Optional)
              </label>
              <input
                type="text"
                value={profile.tradeName}
                onChange={(e) =>
                  setProfile({ ...profile, tradeName: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Supplier GSTIN * (Auto-detects State & PAN)
              </label>
              <input
                type="text"
                required
                value={profile.gstin}
                onChange={(e) => handleGstinChange(e.target.value)}
                placeholder="27AABCA1234F1Z5"
                className="w-full px-3 py-2 font-mono text-sm font-bold border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Income Tax PAN *
              </label>
              <input
                type="text"
                required
                value={profile.pan}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    pan: e.target.value.toUpperCase(),
                  })
                }
                className="w-full px-3 py-2 font-mono text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Registered State & GST Code *
              </label>
              <select
                value={profile.stateCode}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-medium"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Registered Billing Address *
              </label>
              <input
                type="text"
                required
                value={profile.address}
                onChange={(e) =>
                  setProfile({ ...profile, address: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) =>
                    setProfile({ ...profile, city: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={profile.pincode}
                  onChange={(e) =>
                    setProfile({ ...profile, pincode: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Official Billing Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Business Phone / Mobile
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* 2. Bank Details & UPI Configuration */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Bank Settlement & UPI QR Configuration</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={profile.bankName}
                onChange={(e) =>
                  setProfile({ ...profile, bankName: e.target.value })
                }
                placeholder="e.g. HDFC Bank Ltd."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                value={profile.accountHolder}
                onChange={(e) =>
                  setProfile({ ...profile, accountHolder: e.target.value })
                }
                placeholder="Entity name on bank records"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={profile.accountNumber}
                onChange={(e) =>
                  setProfile({ ...profile, accountNumber: e.target.value })
                }
                className="w-full px-3 py-2 font-mono font-medium border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                value={profile.ifscCode}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    ifscCode: e.target.value.toUpperCase(),
                  })
                }
                placeholder="HDFC0000240"
                className="w-full px-3 py-2 font-mono font-medium border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Branch Name
              </label>
              <input
                type="text"
                value={profile.branch}
                onChange={(e) =>
                  setProfile({ ...profile, branch: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              UPI VPA / ID (Generates Dynamic QR Code on printed tax invoices)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={profile.upiId}
                onChange={(e) =>
                  setProfile({ ...profile, upiId: e.target.value.trim() })
                }
                placeholder="e.g. apextech@hdfcbank or 9820012345@paytm"
                className="w-full px-3 py-2 font-mono font-semibold text-emerald-800 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              When configured, invoices will feature a crisp UPI QR code that
              customers can scan directly with GPay, PhonePe, or Paytm for exact
              rupee settlement.
            </span>
          </div>
        </div>

        {/* 3. Invoice Numbering & Defaults */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Invoice Sequence & Standard Terms</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Invoice Number Prefix
              </label>
              <input
                type="text"
                value={profile.invoicePrefix}
                onChange={(e) =>
                  setProfile({ ...profile, invoicePrefix: e.target.value })
                }
                placeholder="INV-2026-"
                className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Next Invoice Serial Number
              </label>
              <input
                type="number"
                min="1"
                value={profile.nextInvoiceNumber}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    nextInvoiceNumber: parseInt(e.target.value, 10) || 1,
                  })
                }
                className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Default Customer Remarks / Notes
            </label>
            <textarea
              rows={2}
              value={profile.defaultNotes}
              onChange={(e) =>
                setProfile({ ...profile, defaultNotes: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          {/* Terms & Conditions list */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Standard Terms & Conditions (Printed on invoice)
            </label>
            <div className="space-y-2 mb-3">
              {profile.termsAndConditions.map((term, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <span className="text-slate-700">
                    {idx + 1}. {term}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTerm(idx)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Add another standard term..."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
              />
              <button
                type="button"
                onClick={handleAddTerm}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg shrink-0 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all"
          >
            Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
};
