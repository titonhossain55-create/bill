export type GSTSlab = 0 | 5 | 12 | 18 | 28;

export type SupplyType = 'INTRA_STATE' | 'INTER_STATE';

export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIAL';

export type InvoiceCopyType = 'ORIGINAL' | 'DUPLICATE' | 'TRIPLATE';

export interface StateInfo {
  code: string; // 2-digit, e.g. "27"
  name: string; // e.g. "Maharashtra"
}

export interface BusinessProfile {
  legalName: string;
  tradeName: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  stateCode: string; // e.g. "27"
  pincode: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  ifscCode: string;
  branch: string;
  upiId: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  termsAndConditions: string[];
  defaultNotes: string;
}

export interface Customer {
  id: string;
  businessName: string;
  contactPerson: string;
  gstin?: string; // Optional for B2C consumer
  pan?: string;
  email: string;
  phone: string;
  billingAddress: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  placeOfSupply: string;
  isB2B: boolean;
}

export interface ProductItem {
  id: string;
  name: string;
  description?: string;
  hsnSacCode: string;
  type: 'GOODS' | 'SERVICE';
  unit: string; // Pcs, Box, Kg, Mtr, Nos, Set, Hr, etc.
  unitPrice: number;
  gstSlab: GSTSlab;
}

export interface InvoiceLineItem {
  id: string;
  productId?: string;
  description: string;
  hsnSacCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  gstSlab: GSTSlab;
  
  // Computed fields
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  
  // Seller Snapshot at time of issue
  seller: BusinessProfile;
  
  // Buyer Details
  customer: Customer;
  placeOfSupply: string; // State name & code
  placeOfSupplyCode: string;
  supplyType: SupplyType;
  manualSupplyTypeOverride: boolean;
  reverseCharge: boolean;
  
  // Line Items
  items: InvoiceLineItem[];
  
  // Financial Summary
  totalTaxableAmount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  subtotal: number;
  roundOff: number; // e.g. -0.24 or +0.15
  grandTotal: number;
  amountInWords: string;
  
  // Payment
  paymentStatus: PaymentStatus;
  paymentMode?: 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'OTHER';
  paidAmount: number;
  balanceDue: number;
  
  // Remarks & Metadata
  notes?: string;
  terms?: string[];
  createdAt: string;
}

export interface HSNSummaryRow {
  hsnSacCode: string;
  description: string;
  uqc: string;
  totalQuantity: number;
  totalValue: number;
  taxableValue: number;
  gstRate: GSTSlab;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
}

export interface GSTR1Summary {
  period: string;
  b2bInvoicesCount: number;
  b2bTaxableValue: number;
  b2bTotalTax: number;
  b2cInvoicesCount: number;
  b2cTaxableValue: number;
  b2cTotalTax: number;
  totalTurnover: number;
  totalTax: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  slabBreakdown: {
    slab: GSTSlab;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    invoiceCount: number;
  }[];
  hsnSummary: HSNSummaryRow[];
}
