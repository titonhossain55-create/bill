import React, { useState, useEffect } from 'react';
import {
  loadBusinessProfile,
  loadCustomers,
  loadInvoices,
  loadProducts,
  saveBusinessProfile,
  saveCustomers,
  saveInvoices,
  saveProducts,
} from './utils/storage';
import { BusinessProfile, Customer, Invoice, ProductItem } from './types';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceBuilder } from './components/InvoiceBuilder';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { GSTR1Summary } from './components/GSTR1Summary';
import { ProductCatalog } from './components/ProductCatalog';
import { CustomerDirectory } from './components/CustomerDirectory';
import { BusinessSettings } from './components/BusinessSettings';
import { CheckCircle2, Info } from 'lucide-react';

export default function App() {
  // Application Data States with local storage initialization
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(
    loadBusinessProfile
  );
  const [customers, setCustomers] = useState<Customer[]>(loadCustomers);
  const [products, setProducts] = useState<ProductItem[]>(loadProducts);
  const [invoices, setInvoices] = useState<Invoice[]>(loadInvoices);

  // Active View & Modals
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] =
    useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Synchronize state changes to LocalStorage
  const handleSaveProfile = (newProfile: BusinessProfile) => {
    setBusinessProfile(newProfile);
    saveBusinessProfile(newProfile);
    showToast('Business profile and GST settings updated.');
  };

  const handleSaveCustomer = (newCustomer: Customer) => {
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === newCustomer.id);
      let updated: Customer[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = newCustomer;
      } else {
        updated = [newCustomer, ...prev];
      }
      saveCustomers(updated);
      return updated;
    });
    showToast(`Customer "${newCustomer.businessName}" saved.`);
  };

  const handleDeleteCustomer = (id: string) => {
    if (window.confirm('Delete this customer from directory?')) {
      setCustomers((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        saveCustomers(updated);
        return updated;
      });
      showToast('Customer deleted.');
    }
  };

  const handleSaveProduct = (newProduct: ProductItem) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === newProduct.id);
      let updated: ProductItem[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = newProduct;
      } else {
        updated = [newProduct, ...prev];
      }
      saveProducts(updated);
      return updated;
    });
    showToast(`Item "${newProduct.name}" saved to catalog.`);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Remove this product/service from catalog?')) {
      setProducts((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        saveProducts(updated);
        return updated;
      });
      showToast('Product removed.');
    }
  };

  // Invoice Actions
  const handleSaveInvoice = (invoice: Invoice, shouldPrint = false) => {
    setInvoices((prev) => {
      const idx = prev.findIndex((i) => i.id === invoice.id);
      let updated: Invoice[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = invoice;
      } else {
        updated = [invoice, ...prev];
        // Increment invoice serial number in profile
        const nextNum = businessProfile.nextInvoiceNumber + 1;
        const updatedProfile = {
          ...businessProfile,
          nextInvoiceNumber: nextNum,
        };
        setBusinessProfile(updatedProfile);
        saveBusinessProfile(updatedProfile);
      }
      saveInvoices(updated);
      return updated;
    });

    setEditingInvoice(null);
    showToast(`Invoice ${invoice.invoiceNumber} saved successfully.`);

    if (shouldPrint) {
      setSelectedInvoiceForPrint(invoice);
    } else {
      setActiveTab('invoices');
    }
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      setInvoices((prev) => {
        const updated = prev.filter((i) => i.id !== id);
        saveInvoices(updated);
        return updated;
      });
      showToast('Invoice deleted.');
    }
  };

  const handleDuplicateInvoice = (invoice: Invoice) => {
    const nextNum = businessProfile.nextInvoiceNumber;
    const newInvoiceNumber = `${businessProfile.invoicePrefix}${String(
      nextNum
    ).padStart(3, '0')}`;

    const duplicated: Invoice = {
      ...invoice,
      id: 'inv-' + Date.now(),
      invoiceNumber: newInvoiceNumber,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      paymentStatus: 'PENDING',
      paidAmount: 0,
      balanceDue: invoice.grandTotal,
      createdAt: new Date().toISOString(),
    };

    setInvoices((prev) => {
      const updated = [duplicated, ...prev];
      saveInvoices(updated);
      return updated;
    });

    const updatedProfile = {
      ...businessProfile,
      nextInvoiceNumber: nextNum + 1,
    };
    setBusinessProfile(updatedProfile);
    saveBusinessProfile(updatedProfile);

    showToast(`Duplicated into ${duplicated.invoiceNumber}.`);
    setSelectedInvoiceForPrint(duplicated);
  };

  const handleTogglePaymentStatus = (
    id: string,
    newStatus: Invoice['paymentStatus']
  ) => {
    setInvoices((prev) => {
      const updated = prev.map((inv) => {
        if (inv.id !== id) return inv;
        const isPaid = newStatus === 'PAID';
        return {
          ...inv,
          paymentStatus: newStatus,
          paidAmount: isPaid ? inv.grandTotal : 0,
          balanceDue: isPaid ? 0 : inv.grandTotal,
        };
      });
      saveInvoices(updated);
      return updated;
    });
    showToast(`Invoice marked as ${newStatus}.`);
  };

  const handleStartNewInvoice = () => {
    setEditingInvoice(null);
    setActiveTab('new-invoice');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setActiveTab('new-invoice');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Main Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setEditingInvoice(null);
          setActiveTab(tab);
        }}
        onNewInvoice={handleStartNewInvoice}
        businessProfile={businessProfile}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            invoices={invoices}
            businessProfile={businessProfile}
            onNewInvoice={handleStartNewInvoice}
            onViewInvoice={(inv) => setSelectedInvoiceForPrint(inv)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoiceList
            invoices={invoices}
            onNewInvoice={handleStartNewInvoice}
            onViewInvoice={(inv) => setSelectedInvoiceForPrint(inv)}
            onEditInvoice={handleEditInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onDuplicateInvoice={handleDuplicateInvoice}
            onToggleStatus={handleTogglePaymentStatus}
          />
        )}

        {activeTab === 'new-invoice' && (
          <InvoiceBuilder
            businessProfile={businessProfile}
            customers={customers}
            products={products}
            initialInvoice={editingInvoice}
            onSave={handleSaveInvoice}
            onCancel={() => {
              setEditingInvoice(null);
              setActiveTab('invoices');
            }}
            onAddNewCustomer={handleSaveCustomer}
          />
        )}

        {activeTab === 'gstr1' && <GSTR1Summary invoices={invoices} />}

        {activeTab === 'products' && (
          <ProductCatalog
            products={products}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerDirectory
            customers={customers}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        )}

        {activeTab === 'settings' && (
          <BusinessSettings
            businessProfile={businessProfile}
            onSaveProfile={handleSaveProfile}
          />
        )}
      </main>

      {/* Printable / PDF Modal */}
      {selectedInvoiceForPrint && (
        <InvoicePrintModal
          invoice={selectedInvoiceForPrint}
          onClose={() => setSelectedInvoiceForPrint(null)}
          onUpdateStatus={handleTogglePaymentStatus}
        />
      )}
    </div>
  );
}
