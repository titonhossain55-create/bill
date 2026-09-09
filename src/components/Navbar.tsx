import React from 'react';
import {
  FileText,
  PlusCircle,
  LayoutDashboard,
  Receipt,
  Package,
  Users,
  Settings,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { BusinessProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewInvoice: () => void;
  businessProfile: BusinessProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewInvoice,
  businessProfile,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'gstr1', label: 'GSTR-1 Summary', icon: FileSpreadsheet },
    { id: 'products', label: 'Catalog', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm font-bold text-lg tracking-tight">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">
                  GST Invoicer
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 tracking-wider">
                  Tax Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                {businessProfile.tradeName || businessProfile.legalName} •{' '}
                <span className="font-mono text-[11px] text-slate-600">
                  {businessProfile.gstin}
                </span>
              </p>
            </div>
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2">
            <button
              id="btn-create-new-invoice"
              onClick={onNewInvoice}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-xs transition-all active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">New Invoice</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-between overflow-x-auto py-2 border-t border-slate-100 gap-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
