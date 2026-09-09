import { BusinessProfile, Customer, Invoice, ProductItem } from '../types';
import { calculateInvoiceTotals, calculateLineItem } from './gstEngine';

const STORAGE_KEYS = {
  BUSINESS: 'gst_billing_business_profile_v1',
  CUSTOMERS: 'gst_billing_customers_v1',
  PRODUCTS: 'gst_billing_products_v1',
  INVOICES: 'gst_billing_invoices_v1',
};

export const INITIAL_BUSINESS_PROFILE: BusinessProfile = {
  legalName: 'Apex Technologies & Industrial Systems Pvt. Ltd.',
  tradeName: 'Apex Tech Solutions',
  gstin: '27AABCA1234F1Z5',
  pan: 'AABCA1234F',
  email: 'billing@apextech.in',
  phone: '+91 98200 12345',
  address: 'Unit 402, Pinnacle Business Park, Andheri East',
  city: 'Mumbai',
  state: 'Maharashtra',
  stateCode: '27',
  pincode: '400069',
  bankName: 'HDFC Bank Ltd.',
  accountNumber: '50200049182341',
  accountHolder: 'Apex Technologies Pvt Ltd',
  ifscCode: 'HDFC0000240',
  branch: 'Andheri East Branch, Mumbai',
  upiId: 'apextech@hdfcbank',
  invoicePrefix: 'INV-2026-',
  nextInvoiceNumber: 104,
  termsAndConditions: [
    'Goods once sold will not be taken back or exchanged.',
    'Interest @ 18% p.a. will be charged on all payments overdue past due date.',
    'Subject to Mumbai Jurisdiction only.',
    'All payments must be made via designated Bank Transfer or UPI.',
  ],
  defaultNotes: 'Thank you for choosing Apex Tech. Please reference the invoice number in all wire payment descriptions.',
};

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    businessName: 'TechNexus Solutions Pvt. Ltd.',
    contactPerson: 'Rajesh Verma',
    gstin: '27AABCT5432E1Z8',
    pan: 'AABCT5432E',
    email: 'accounts@technexus.in',
    phone: '+91 98210 98765',
    billingAddress: 'Tower B, 7th Floor, Mindspace Tech Park, Malad West',
    city: 'Mumbai',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '400064',
    placeOfSupply: 'Maharashtra (27)',
    isB2B: true,
  },
  {
    id: 'cust-2',
    businessName: 'Bangalore Silicon Networks Pvt. Ltd.',
    contactPerson: 'Ananya Rao',
    gstin: '29AABCB9876C1ZD',
    pan: 'AABCB9876C',
    email: 'finance@siliconnetworks.io',
    phone: '+91 98450 11223',
    billingAddress: '88, Outer Ring Road, Bellandur',
    city: 'Bengaluru',
    state: 'Karnataka',
    stateCode: '29',
    pincode: '560103',
    placeOfSupply: 'Karnataka (29)',
    isB2B: true,
  },
  {
    id: 'cust-3',
    businessName: 'Delhi Cloud Dynamics LLP',
    contactPerson: 'Vikramjit Singh',
    gstin: '07AABCD8888D1Z2',
    pan: 'AABCD8888D',
    email: 'billing@delhicloud.in',
    phone: '+91 98110 55443',
    billingAddress: '42, Barakhamba Road, Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
    stateCode: '07',
    pincode: '110001',
    placeOfSupply: 'Delhi (07)',
    isB2B: true,
  },
  {
    id: 'cust-4',
    businessName: 'Ramesh Sharma (Retail Consumer)',
    contactPerson: 'Ramesh Sharma',
    email: 'ramesh.sharma@gmail.com',
    phone: '+91 99200 44332',
    billingAddress: 'Flat 12B, Green Heights, Thane West',
    city: 'Thane',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '400601',
    placeOfSupply: 'Maharashtra (27)',
    isB2B: false,
  },
];

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    name: 'Enterprise Cloud Server Rack 2U',
    description: 'Intel Xeon Scalable, 128GB RAM, 2TB NVMe SSD Dual PSU',
    hsnSacCode: '8471',
    type: 'GOODS',
    unit: 'Nos',
    unitPrice: 145000,
    gstSlab: 18,
  },
  {
    id: 'prod-2',
    name: 'Software Architecture Consulting',
    description: 'Senior Technical Lead advisory & architecture review per day',
    hsnSacCode: '998313',
    type: 'SERVICE',
    unit: 'Day',
    unitPrice: 28000,
    gstSlab: 18,
  },
  {
    id: 'prod-3',
    name: 'Industrial IoT Controller Gateway',
    description: 'Modbus RS485 to MQTT industrial edge gateway IP67',
    hsnSacCode: '8517',
    type: 'GOODS',
    unit: 'Pcs',
    unitPrice: 16500,
    gstSlab: 18,
  },
  {
    id: 'prod-4',
    name: 'High Performance Solar Inverter 5kVA',
    description: 'Grid-tied hybrid solar inverter with MPPT tracking',
    hsnSacCode: '8504',
    type: 'GOODS',
    unit: 'Nos',
    unitPrice: 42000,
    gstSlab: 5,
  },
  {
    id: 'prod-5',
    name: 'Fiber Optic Patch Cord Single Mode 10m',
    description: 'LC-LC duplex low insertion loss optical cable',
    hsnSacCode: '8544',
    type: 'GOODS',
    unit: 'Pcs',
    unitPrice: 850,
    gstSlab: 12,
  },
  {
    id: 'prod-6',
    name: 'High-End 3D Graphic Workstation',
    description: 'Liquid-cooled dual GPU workstation for simulation',
    hsnSacCode: '8471',
    type: 'GOODS',
    unit: 'Nos',
    unitPrice: 285000,
    gstSlab: 28,
  },
  {
    id: 'prod-7',
    name: 'Annual Maintenance Contract (AMC) IT Support',
    description: '24/7 SLA infrastructure support and quarterly audits',
    hsnSacCode: '998719',
    type: 'SERVICE',
    unit: 'Month',
    unitPrice: 18000,
    gstSlab: 18,
  },
  {
    id: 'prod-8',
    name: 'System Operating & Standard Protocols Manual',
    description: 'Printed technical compliance manuals and guides',
    hsnSacCode: '4901',
    type: 'GOODS',
    unit: 'Set',
    unitPrice: 1200,
    gstSlab: 0,
  },
];

// Helper to construct sample initial invoices
function generateInitialInvoices(): Invoice[] {
  const seller = INITIAL_BUSINESS_PROFILE;

  // Invoice 1: Intra-State (Maharashtra to Maharashtra) -> TechNexus
  const cust1 = INITIAL_CUSTOMERS[0];
  const items1Raw = [
    {
      id: 'item-1-1',
      productId: 'prod-1',
      description: 'Enterprise Cloud Server Rack 2U (Intel Xeon, 128GB RAM)',
      hsnSacCode: '8471',
      quantity: 1,
      unit: 'Nos',
      unitPrice: 145000,
      discountPercent: 5,
      gstSlab: 18 as const,
    },
    {
      id: 'item-1-2',
      productId: 'prod-2',
      description: 'Software Architecture Consulting (Deployment & Config)',
      hsnSacCode: '998313',
      quantity: 2,
      unit: 'Day',
      unitPrice: 28000,
      discountPercent: 0,
      gstSlab: 18 as const,
    },
  ];

  const items1 = items1Raw.map((it) => {
    const calc = calculateLineItem(it, 'INTRA_STATE');
    return { ...it, ...calc };
  });
  const totals1 = calculateInvoiceTotals(items1);

  const inv1: Invoice = {
    id: 'inv-101',
    invoiceNumber: 'INV-2026-101',
    date: '2026-09-02',
    dueDate: '2026-09-17',
    seller,
    customer: cust1,
    placeOfSupply: 'Maharashtra (27)',
    placeOfSupplyCode: '27',
    supplyType: 'INTRA_STATE',
    manualSupplyTypeOverride: false,
    reverseCharge: false,
    items: items1,
    ...totals1,
    paymentStatus: 'PAID',
    paymentMode: 'BANK_TRANSFER',
    paidAmount: totals1.grandTotal,
    balanceDue: 0,
    notes: seller.defaultNotes,
    terms: seller.termsAndConditions,
    createdAt: new Date('2026-09-02T10:30:00').toISOString(),
  };

  // Invoice 2: Inter-State (Maharashtra to Karnataka) -> Bangalore Silicon Networks
  const cust2 = INITIAL_CUSTOMERS[1];
  const items2Raw = [
    {
      id: 'item-2-1',
      productId: 'prod-3',
      description: 'Industrial IoT Controller Gateway (IP67 Rated)',
      hsnSacCode: '8517',
      quantity: 4,
      unit: 'Pcs',
      unitPrice: 16500,
      discountPercent: 2,
      gstSlab: 18 as const,
    },
    {
      id: 'item-2-2',
      productId: 'prod-5',
      description: 'Fiber Optic Patch Cord Single Mode 10m',
      hsnSacCode: '8544',
      quantity: 12,
      unit: 'Pcs',
      unitPrice: 850,
      discountPercent: 0,
      gstSlab: 12 as const,
    },
  ];

  const items2 = items2Raw.map((it) => {
    const calc = calculateLineItem(it, 'INTER_STATE');
    return { ...it, ...calc };
  });
  const totals2 = calculateInvoiceTotals(items2);

  const inv2: Invoice = {
    id: 'inv-102',
    invoiceNumber: 'INV-2026-102',
    date: '2026-09-05',
    dueDate: '2026-09-20',
    seller,
    customer: cust2,
    placeOfSupply: 'Karnataka (29)',
    placeOfSupplyCode: '29',
    supplyType: 'INTER_STATE',
    manualSupplyTypeOverride: false,
    reverseCharge: false,
    items: items2,
    ...totals2,
    paymentStatus: 'PENDING',
    paidAmount: 0,
    balanceDue: totals2.grandTotal,
    notes: 'Urgent shipping via BlueDart Air cargo.',
    terms: seller.termsAndConditions,
    createdAt: new Date('2026-09-05T14:15:00').toISOString(),
  };

  // Invoice 3: Retail Consumer (B2C) Intra-State
  const cust4 = INITIAL_CUSTOMERS[3];
  const items3Raw = [
    {
      id: 'item-3-1',
      productId: 'prod-4',
      description: 'High Performance Solar Inverter 5kVA (Residential Hybrid)',
      hsnSacCode: '8504',
      quantity: 1,
      unit: 'Nos',
      unitPrice: 42000,
      discountPercent: 0,
      gstSlab: 5 as const,
    },
  ];

  const items3 = items3Raw.map((it) => {
    const calc = calculateLineItem(it, 'INTRA_STATE');
    return { ...it, ...calc };
  });
  const totals3 = calculateInvoiceTotals(items3);

  const inv3: Invoice = {
    id: 'inv-103',
    invoiceNumber: 'INV-2026-103',
    date: '2026-09-07',
    dueDate: '2026-09-07',
    seller,
    customer: cust4,
    placeOfSupply: 'Maharashtra (27)',
    placeOfSupplyCode: '27',
    supplyType: 'INTRA_STATE',
    manualSupplyTypeOverride: false,
    reverseCharge: false,
    items: items3,
    ...totals3,
    paymentStatus: 'PAID',
    paymentMode: 'UPI',
    paidAmount: totals3.grandTotal,
    balanceDue: 0,
    notes: 'Paid via Google Pay UPI.',
    terms: seller.termsAndConditions,
    createdAt: new Date('2026-09-07T16:45:00').toISOString(),
  };

  return [inv1, inv2, inv3];
}

export function loadBusinessProfile(): BusinessProfile {
  try {
    const item = localStorage.getItem(STORAGE_KEYS.BUSINESS);
    return item ? JSON.parse(item) : INITIAL_BUSINESS_PROFILE;
  } catch {
    return INITIAL_BUSINESS_PROFILE;
  }
}

export function saveBusinessProfile(profile: BusinessProfile): void {
  localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(profile));
}

export function loadCustomers(): Customer[] {
  try {
    const item = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return item ? JSON.parse(item) : INITIAL_CUSTOMERS;
  } catch {
    return INITIAL_CUSTOMERS;
  }
}

export function saveCustomers(customers: Customer[]): void {
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
}

export function loadProducts(): ProductItem[] {
  try {
    const item = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return item ? JSON.parse(item) : INITIAL_PRODUCTS;
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function saveProducts(products: ProductItem[]): void {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

export function loadInvoices(): Invoice[] {
  try {
    const item = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return item ? JSON.parse(item) : generateInitialInvoices();
  } catch {
    return generateInitialInvoices();
  }
}

export function saveInvoices(invoices: Invoice[]): void {
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
}
