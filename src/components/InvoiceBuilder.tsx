import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Save,
  ArrowLeft,
  Search,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Building,
  Calendar,
  Layers,
  ChevronRight,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import {
  BusinessProfile,
  Customer,
  GSTSlab,
  Invoice,
  InvoiceLineItem,
  ProductItem,
  SupplyType,
} from '../types';
import {
  COMMON_UNITS,
  determineSupplyType,
  extractPanFromGSTIN,
  extractStateCodeFromGSTIN,
  formatINR,
  getStateByCode,
  GST_SLABS,
  INDIAN_STATES,
  isValidGSTIN,
  calculateLineItem,
  calculateInvoiceTotals,
} from '../utils/gstEngine';

interface InvoiceBuilderProps {
  businessProfile: BusinessProfile;
  customers: Customer[];
  products: ProductItem[];
  initialInvoice?: Invoice | null;
  onSave: (invoice: Invoice, shouldPrint?: boolean) => void;
  onCancel: () => void;
  onAddNewCustomer: (customer: Customer) => void;
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({
  businessProfile,
  customers,
  products,
  initialInvoice,
  onSave,
  onCancel,
  onAddNewCustomer,
}) => {
  // Invoice Metadata
  const [invoiceNumber, setInvoiceNumber] = useState<string>(() => {
    if (initialInvoice) return initialInvoice.invoiceNumber;
    return `${businessProfile.invoicePrefix}${String(
      businessProfile.nextInvoiceNumber
    ).padStart(3, '0')}`;
  });

  const [date, setDate] = useState<string>(() => {
    if (initialInvoice) return initialInvoice.date;
    return new Date().toISOString().split('T')[0];
  });

  const [dueDate, setDueDate] = useState<string>(() => {
    if (initialInvoice) return initialInvoice.dueDate;
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });

  const [reverseCharge, setReverseCharge] = useState<boolean>(
    initialInvoice?.reverseCharge || false
  );

  // Customer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    if (initialInvoice) return initialInvoice.customer.id;
    return customers[0]?.id || '';
  });

  // Client entry mode (existing vs instant new client entry)
  const [isNewClientMode, setIsNewClientMode] = useState<boolean>(false);
  const [clientForm, setClientForm] = useState<Partial<Customer>>({
    businessName: '',
    contactPerson: '',
    gstin: '',
    phone: '',
    email: '',
    billingAddress: '',
    city: '',
    state: businessProfile.state,
    stateCode: businessProfile.stateCode,
    pincode: '',
    placeOfSupply: `${businessProfile.state} (${businessProfile.stateCode})`,
    isB2B: true,
  });

  // Supply Type & Place of Supply
  const [placeOfSupplyCode, setPlaceOfSupplyCode] = useState<string>(() => {
    if (initialInvoice) return initialInvoice.placeOfSupplyCode;
    return customers[0]?.stateCode || businessProfile.stateCode;
  });

  const [manualOverride, setManualOverride] = useState<boolean>(
    initialInvoice?.manualSupplyTypeOverride || false
  );

  const [manualSupplyType, setManualSupplyType] = useState<SupplyType>(() => {
    if (initialInvoice) return initialInvoice.supplyType;
    return determineSupplyType(businessProfile.stateCode, placeOfSupplyCode);
  });

  // Derived effective supply type
  const effectiveSupplyType: SupplyType = manualOverride
    ? manualSupplyType
    : determineSupplyType(businessProfile.stateCode, placeOfSupplyCode);

  // Line Items
  const [items, setItems] = useState<InvoiceLineItem[]>(() => {
    if (initialInvoice && initialInvoice.items.length > 0) {
      return initialInvoice.items;
    }
    const defaultProduct = products[0];
    const initialRaw = {
      id: 'item-' + Date.now(),
      productId: defaultProduct?.id,
      description: defaultProduct?.name || 'Consulting / Engineering Service',
      hsnSacCode: defaultProduct?.hsnSacCode || '998313',
      quantity: 1,
      unit: defaultProduct?.unit || 'Nos',
      unitPrice: defaultProduct?.unitPrice || 10000,
      discountPercent: 0,
      gstSlab: (defaultProduct?.gstSlab ?? 18) as GSTSlab,
    };
    const calc = calculateLineItem(initialRaw, effectiveSupplyType);
    return [{ ...initialRaw, ...calc }];
  });

  // Payment Status & Notes
  const [paymentStatus, setPaymentStatus] = useState<Invoice['paymentStatus']>(
    initialInvoice?.paymentStatus || 'PENDING'
  );
  const [paymentMode, setPaymentMode] = useState<Invoice['paymentMode']>(
    initialInvoice?.paymentMode || 'BANK_TRANSFER'
  );
  const [paidAmount, setPaidAmount] = useState<number>(
    initialInvoice?.paidAmount || 0
  );
  const [notes, setNotes] = useState<string>(
    initialInvoice?.notes ?? businessProfile.defaultNotes
  );

  // Auto-detect State & Place of Supply when customer changes
  useEffect(() => {
    if (!isNewClientMode && selectedCustomerId) {
      const cust = customers.find((c) => c.id === selectedCustomerId);
      if (cust) {
        setPlaceOfSupplyCode(cust.stateCode);
      }
    }
  }, [selectedCustomerId, isNewClientMode, customers]);

  // Handle GSTIN input in new client form with auto-detection of state and PAN
  const handleClientGstinChange = (val: string) => {
    const cleanGstin = val.toUpperCase().trim();
    const detectedStateCode = extractStateCodeFromGSTIN(cleanGstin);
    const detectedPan = extractPanFromGSTIN(cleanGstin);

    let updatedState = clientForm.state;
    let updatedCode = clientForm.stateCode;
    let updatedPlace = clientForm.placeOfSupply;

    if (detectedStateCode) {
      const stateObj = getStateByCode(detectedStateCode);
      if (stateObj) {
        updatedState = stateObj.name;
        updatedCode = stateObj.code;
        updatedPlace = `${stateObj.name} (${stateObj.code})`;
        setPlaceOfSupplyCode(stateObj.code);
      }
    }

    setClientForm((prev) => ({
      ...prev,
      gstin: cleanGstin,
      pan: detectedPan || prev.pan,
      state: updatedState,
      stateCode: updatedCode,
      placeOfSupply: updatedPlace,
      isB2B: cleanGstin.length > 0,
    }));
  };

  // Recalculate line items when supply type changes
  const recalculateAllItems = (supply: SupplyType) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        const calc = calculateLineItem(item, supply);
        return { ...item, ...calc };
      })
    );
  };

  const handlePlaceOfSupplyChange = (code: string) => {
    setPlaceOfSupplyCode(code);
    if (!manualOverride) {
      const newSupply = determineSupplyType(businessProfile.stateCode, code);
      recalculateAllItems(newSupply);
    }
  };

  const handleToggleManualOverride = () => {
    const nextOverride = !manualOverride;
    setManualOverride(nextOverride);
    if (!nextOverride) {
      const autoSupply = determineSupplyType(
        businessProfile.stateCode,
        placeOfSupplyCode
      );
      setManualSupplyType(autoSupply);
      recalculateAllItems(autoSupply);
    }
  };

  const handleManualSupplyTypeToggle = (type: SupplyType) => {
    setManualSupplyType(type);
    recalculateAllItems(type);
  };

  // Line Item Handlers
  const handleItemChange = (
    index: number,
    field: keyof InvoiceLineItem,
    value: any
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };
      const calc = calculateLineItem(target, effectiveSupplyType);
      updated[index] = { ...target, ...calc };
      return updated;
    });
  };

  const handleSelectProduct = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setItems((prev) => {
      const updated = [...prev];
      const target: InvoiceLineItem = {
        ...updated[index],
        productId: prod.id,
        description: prod.name,
        hsnSacCode: prod.hsnSacCode,
        unit: prod.unit,
        unitPrice: prod.unitPrice,
        gstSlab: prod.gstSlab,
      };
      const calc = calculateLineItem(target, effectiveSupplyType);
      updated[index] = { ...target, ...calc };
      return updated;
    });
  };

  const handleAddLineItem = () => {
    const defaultProduct = products[0];
    const raw = {
      id: 'item-' + Date.now(),
      productId: defaultProduct?.id,
      description: defaultProduct?.name || 'New Item',
      hsnSacCode: defaultProduct?.hsnSacCode || '8471',
      quantity: 1,
      unit: defaultProduct?.unit || 'Nos',
      unitPrice: defaultProduct?.unitPrice || 1000,
      discountPercent: 0,
      gstSlab: (defaultProduct?.gstSlab ?? 18) as GSTSlab,
    };
    const calc = calculateLineItem(raw, effectiveSupplyType);
    setItems((prev) => [...prev, { ...raw, ...calc }]);
  };

  const handleDuplicateItem = (index: number) => {
    const itemToClone = items[index];
    const cloned: InvoiceLineItem = {
      ...itemToClone,
      id: 'item-' + Date.now() + Math.random().toString().slice(2, 6),
    };
    setItems((prev) => [...prev.slice(0, index + 1), cloned, ...prev.slice(index + 1)]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Invoice calculations
  const totals = calculateInvoiceTotals(items);

  const handleSaveInvoice = (shouldPrint = false) => {
    let customerObj: Customer;

    if (isNewClientMode) {
      if (!clientForm.businessName?.trim()) {
        alert('Please enter client or business name');
        return;
      }
      const newCustId = 'cust-' + Date.now();
      const stateObj = getStateByCode(clientForm.stateCode || '27');
      customerObj = {
        id: newCustId,
        businessName: clientForm.businessName.trim(),
        contactPerson: clientForm.contactPerson?.trim() || '',
        gstin: clientForm.gstin?.trim() || undefined,
        pan: clientForm.pan?.trim() || undefined,
        phone: clientForm.phone?.trim() || '',
        email: clientForm.email?.trim() || '',
        billingAddress: clientForm.billingAddress?.trim() || 'Address on file',
        city: clientForm.city?.trim() || '',
        state: stateObj?.name || 'Maharashtra',
        stateCode: stateObj?.code || '27',
        pincode: clientForm.pincode?.trim() || '',
        placeOfSupply: `${stateObj?.name || 'Maharashtra'} (${stateObj?.code || '27'})`,
        isB2B: !!clientForm.gstin?.trim(),
      };
      onAddNewCustomer(customerObj);
    } else {
      const found = customers.find((c) => c.id === selectedCustomerId);
      if (!found) {
        alert('Please select a customer');
        return;
      }
      customerObj = found;
    }

    const stateObj = getStateByCode(placeOfSupplyCode);
    const placeOfSupplyText = stateObj
      ? `${stateObj.name} (${stateObj.code})`
      : `Code ${placeOfSupplyCode}`;

    const effectivePaid =
      paymentStatus === 'PAID'
        ? totals.grandTotal
        : paymentStatus === 'PENDING'
        ? 0
        : Math.min(totals.grandTotal, Number(paidAmount) || 0);

    const invoice: Invoice = {
      id: initialInvoice ? initialInvoice.id : 'inv-' + Date.now(),
      invoiceNumber: invoiceNumber.trim() || 'INV-001',
      date,
      dueDate,
      seller: businessProfile,
      customer: customerObj,
      placeOfSupply: placeOfSupplyText,
      placeOfSupplyCode,
      supplyType: effectiveSupplyType,
      manualSupplyTypeOverride: manualOverride,
      reverseCharge,
      items,
      ...totals,
      paymentStatus,
      paymentMode,
      paidAmount: effectivePaid,
      balanceDue: Math.max(0, totals.grandTotal - effectivePaid),
      notes,
      terms: businessProfile.termsAndConditions,
      createdAt: initialInvoice?.createdAt || new Date().toISOString(),
    };

    onSave(invoice, shouldPrint);
  };

  const sellerStateObj = getStateByCode(businessProfile.stateCode);
  const buyerStateObj = getStateByCode(placeOfSupplyCode);

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {initialInvoice ? 'Edit Tax Invoice' : 'Create GST Tax Invoice'}
            </h1>
            <p className="text-xs text-slate-500">
              Standard CBIC GST-compliant invoice format with automatic tax
              computations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            id="btn-save-invoice-draft"
            onClick={() => handleSaveInvoice(false)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg shadow-xs transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Invoice</span>
          </button>
          <button
            id="btn-save-and-print"
            onClick={() => handleSaveInvoice(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-xs transition-all flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            <span>Save & Preview / Print</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Invoice Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Invoice Meta Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Invoice Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="INV-2026-101"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reverseCharge}
                  onChange={(e) => setReverseCharge(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-700">
                  Tax Payable on Reverse Charge (RCM)?
                </span>
              </label>
              <span className="text-slate-400 text-[11px]">
                Supplier GSTIN: {businessProfile.gstin} ({businessProfile.state})
              </span>
            </div>
          </div>

          {/* 2. Customer & Tax Engine Detection Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                <span>Buyer (Customer) Details</span>
              </h2>

              <button
                type="button"
                onClick={() => setIsNewClientMode(!isNewClientMode)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
              >
                {isNewClientMode
                  ? '← Choose Existing Customer'
                  : '+ Enter New / Instant Buyer'}
              </button>
            </div>

            {!isNewClientMode ? (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Select Registered Client
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.businessName}{' '}
                      {c.gstin ? `[GSTIN: ${c.gstin}]` : '[B2C Consumer]'} -{' '}
                      {c.state} ({c.stateCode})
                    </option>
                  ))}
                </select>

                {/* Selected customer preview summary */}
                {selectedCustomerId && (
                  (() => {
                    const cust = customers.find((c) => c.id === selectedCustomerId);
                    if (!cust) return null;
                    return (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 block">
                            Billing Address:
                          </span>
                          <span className="font-medium text-slate-800">
                            {cust.billingAddress}, {cust.city}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">
                            GSTIN & PAN:
                          </span>
                          <span className="font-mono font-medium text-slate-800">
                            {cust.gstin || 'Unregistered B2C Retail'}
                          </span>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            ) : (
              /* Instant new client form */
              <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Business / Customer Name *
                    </label>
                    <input
                      type="text"
                      value={clientForm.businessName}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          businessName: e.target.value,
                        })
                      }
                      placeholder="e.g. Acme Industries Ltd."
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Customer GSTIN (Auto-detects State)
                    </label>
                    <input
                      type="text"
                      value={clientForm.gstin}
                      onChange={(e) => handleClientGstinChange(e.target.value)}
                      placeholder="e.g. 29AABCB9876C1ZD"
                      className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={clientForm.contactPerson}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          contactPerson: e.target.value,
                        })
                      }
                      placeholder="Name"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={clientForm.phone}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+91 98..."
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={clientForm.email}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="accounts@..."
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Billing Address & City
                  </label>
                  <input
                    type="text"
                    value={clientForm.billingAddress}
                    onChange={(e) =>
                      setClientForm({
                        ...clientForm,
                        billingAddress: e.target.value,
                      })
                    }
                    placeholder="Street, locality, city"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                  />
                </div>
              </div>
            )}

            {/* Place of Supply & Tax Engine Detection Status */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Place of Supply (State) *
                  </label>
                  <select
                    value={placeOfSupplyCode}
                    onChange={(e) => handlePlaceOfSupplyChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* GST Engine Diagnosis Pill */}
                <div>
                  <span className="block text-xs font-semibold text-slate-700 mb-1">
                    Tax Engine Classification:
                  </span>
                  <div
                    className={`p-2.5 rounded-lg border flex items-center justify-between ${
                      effectiveSupplyType === 'INTRA_STATE'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-blue-50 border-blue-300 text-blue-900'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            effectiveSupplyType === 'INTRA_STATE'
                              ? 'bg-emerald-600'
                              : 'bg-blue-600'
                          }`}
                        />
                        {effectiveSupplyType === 'INTRA_STATE'
                          ? 'Intra-State Supply (CGST + SGST)'
                          : 'Inter-State Supply (IGST)'}
                      </div>
                      <div className="text-[11px] opacity-80 mt-0.5">
                        Seller: {businessProfile.stateCode} ({sellerStateObj?.name}) → Buyer: {placeOfSupplyCode} ({buyerStateObj?.name})
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleManualOverride}
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-white/80 hover:bg-white border border-slate-300 text-slate-700 shadow-2xs"
                    >
                      {manualOverride ? 'Auto' : 'Override'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Manual Override controls if toggled */}
              {manualOverride && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Manual Override Active (e.g. SEZ zero-rated or deemed export)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleManualSupplyTypeToggle('INTRA_STATE')}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        manualSupplyType === 'INTRA_STATE'
                          ? 'bg-amber-600 text-white'
                          : 'bg-white text-slate-700 border'
                      }`}
                    >
                      CGST + SGST
                    </button>
                    <button
                      type="button"
                      onClick={() => handleManualSupplyTypeToggle('INTER_STATE')}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        manualSupplyType === 'INTER_STATE'
                          ? 'bg-amber-600 text-white'
                          : 'bg-white text-slate-700 border'
                      }`}
                    >
                      IGST
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Real-Time Line Items Builder */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Invoice Line Items</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Itemized HSN/SAC codes, quantities, units, and GST slabs
                </p>
              </div>

              <button
                type="button"
                id="btn-add-line-item"
                onClick={handleAddLineItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Line items list */}
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-all space-y-3"
                >
                  {/* Top row: Product picker or Custom name */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Catalog Shortcut
                      </label>
                      <select
                        value={item.productId || ''}
                        onChange={(e) =>
                          handleSelectProduct(index, e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                      >
                        <option value="">Custom Item Entry</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.hsnSacCode}) - ₹{p.unitPrice}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Description / Particulars *
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, 'description', e.target.value)
                        }
                        placeholder="Item description"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-end gap-1 pt-4 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleDuplicateItem(index)}
                        className="p-1.5 hover:bg-slate-200 text-slate-500 rounded"
                        title="Duplicate item"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length <= 1}
                        className={`p-1.5 rounded ${
                          items.length <= 1
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'hover:bg-red-100 text-red-500'
                        }`}
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Second row: HSN, Qty, Unit, Rate, Discount, Slab */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        HSN / SAC
                      </label>
                      <input
                        type="text"
                        value={item.hsnSacCode}
                        onChange={(e) =>
                          handleItemChange(index, 'hsnSacCode', e.target.value)
                        }
                        placeholder="8471"
                        className="w-full px-2 py-1.5 font-mono text-xs border border-slate-300 rounded-md bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'quantity',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-2 py-1.5 text-xs font-medium border border-slate-300 rounded-md bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Unit
                      </label>
                      <select
                        value={item.unit}
                        onChange={(e) =>
                          handleItemChange(index, 'unit', e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                      >
                        {COMMON_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Rate / Unit (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'unitPrice',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-2 py-1.5 text-xs font-mono border border-slate-300 rounded-md bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Discount %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={item.discountPercent}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'discountPercent',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        GST Slab
                      </label>
                      <select
                        value={item.gstSlab}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'gstSlab',
                            parseInt(e.target.value, 10) as GSTSlab
                          )
                        }
                        className="w-full px-2 py-1.5 text-xs font-semibold border border-slate-300 rounded-md bg-white text-emerald-700"
                      >
                        {GST_SLABS.map((slab) => (
                          <option key={slab} value={slab}>
                            {slab}% GST
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Item calculation mini summary pill */}
                  <div className="flex flex-wrap items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                    <div>
                      <span>Taxable Value: </span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{item.taxableAmount.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      {effectiveSupplyType === 'INTRA_STATE' ? (
                        <span>
                          CGST ({item.cgstRate}%): ₹{item.cgstAmount.toFixed(2)} +
                          SGST ({item.sgstRate}%): ₹{item.sgstAmount.toFixed(2)}
                        </span>
                      ) : (
                        <span>
                          IGST ({item.igstRate}%): ₹{item.igstAmount.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div>
                      <span>Item Total: </span>
                      <span className="font-mono font-bold text-emerald-700 text-xs">
                        ₹{item.lineTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={handleAddLineItem}
                className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-600 hover:text-emerald-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Line Item</span>
              </button>
            </div>
          </div>

          {/* 4. Payment & Remarks */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
              Payment Settlement & Remarks
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) =>
                    setPaymentStatus(e.target.value as Invoice['paymentStatus'])
                  }
                  className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="PAID">Paid in Full</option>
                  <option value="PENDING">Pending / Unpaid</option>
                  <option value="PARTIAL">Partially Paid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Settlement Method
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) =>
                    setPaymentMode(e.target.value as Invoice['paymentMode'])
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI">UPI (Google Pay / PhonePe)</option>
                  <option value="CHEQUE">Cheque / DD</option>
                  <option value="CASH">Cash</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {paymentStatus === 'PARTIAL' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount Received (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Remarks / Delivery Instructions
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Remarks printed on invoice..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>

        {/* Right Col: Real-time Tax Computation & Grand Total Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Summary Box */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs sticky top-24">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
              Tax Computation Summary
            </h2>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Total Taxable Value:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatINR(totals.totalTaxableAmount)}
                </span>
              </div>

              {effectiveSupplyType === 'INTRA_STATE' ? (
                <>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Central GST (CGST):</span>
                    <span className="font-mono font-medium">
                      {formatINR(totals.totalCgst)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                    <span>State GST (SGST):</span>
                    <span className="font-mono font-medium">
                      {formatINR(totals.totalSgst)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                  <span>Integrated GST (IGST):</span>
                  <span className="font-mono font-medium">
                    {formatINR(totals.totalIgst)}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-1 font-semibold text-slate-800">
                <span>Total GST Collected:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatINR(totals.totalTax)}
                </span>
              </div>

              <div className="flex justify-between py-1 text-slate-500 text-[11px]">
                <span>Invoice Subtotal:</span>
                <span className="font-mono">{formatINR(totals.subtotal)}</span>
              </div>

              {totals.roundOff !== 0 && (
                <div className="flex justify-between py-1 text-slate-500 text-[11px] border-b border-slate-100">
                  <span>Commercial Round-off:</span>
                  <span className="font-mono">
                    {totals.roundOff > 0 ? `+${totals.roundOff.toFixed(2)}` : totals.roundOff.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Grand Total Big Box */}
              <div className="bg-slate-900 text-white p-4 rounded-xl mt-3 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Grand Total (Payable)
                </span>
                <div className="font-mono font-black text-2xl tracking-tight text-emerald-400">
                  {formatINR(totals.grandTotal)}
                </div>
              </div>

              {/* Words conversion */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Amount in Words (Indian Standard)
                </span>
                <p className="font-serif italic text-xs font-semibold text-slate-800 leading-snug">
                  {totals.amountInWords}
                </p>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() => handleSaveInvoice(true)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                <span>Save & Preview / Print Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveInvoice(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save and Return to List</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
