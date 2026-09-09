import { GSTSlab, InvoiceLineItem, StateInfo, SupplyType } from '../types';

export const INDIAN_STATES: StateInfo[] = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '25', name: 'Daman & Diu' },
  { code: '26', name: 'Dadra & Nagar Haveli' },
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh (Old)' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman & Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh (New)' },
  { code: '38', name: 'Ladakh' },
  { code: '97', name: 'Other Territory' },
];

export const GST_SLABS: GSTSlab[] = [0, 5, 12, 18, 28];

export const COMMON_UNITS = [
  'Pcs',
  'Nos',
  'Box',
  'Kg',
  'Gm',
  'Ltr',
  'Mtr',
  'Set',
  'Bag',
  'Roll',
  'Pack',
  'Hour',
  'Day',
  'Month',
  'Service',
];

export function getStateByCode(code: string): StateInfo | undefined {
  const cleanCode = code.padStart(2, '0');
  return INDIAN_STATES.find((s) => s.code === cleanCode);
}

export function getStateByName(name: string): StateInfo | undefined {
  return INDIAN_STATES.find(
    (s) => s.name.toLowerCase() === name.trim().toLowerCase()
  );
}

export function extractStateCodeFromGSTIN(gstin?: string): string | null {
  if (!gstin || gstin.trim().length < 2) return null;
  const prefix = gstin.trim().substring(0, 2);
  if (/^\d{2}$/.test(prefix)) {
    return prefix;
  }
  return null;
}

export function extractPanFromGSTIN(gstin?: string): string | null {
  if (!gstin || gstin.trim().length < 12) return null;
  const clean = gstin.trim();
  const pan = clean.substring(2, 12);
  if (/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(pan)) {
    return pan.toUpperCase();
  }
  return null;
}

export function isValidGSTIN(gstin?: string): boolean {
  if (!gstin) return false;
  // 15 alphanumeric characters: 2 digits state + 10 chars PAN + 1 entity num + 1 'Z' + 1 checksum
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
  return regex.test(gstin.trim());
}

export function determineSupplyType(
  supplierStateCode: string,
  buyerStateCode: string
): SupplyType {
  const cleanSupplier = (supplierStateCode || '').padStart(2, '0');
  const cleanBuyer = (buyerStateCode || '').padStart(2, '0');
  if (cleanSupplier && cleanBuyer && cleanSupplier === cleanBuyer) {
    return 'INTRA_STATE';
  }
  return 'INTER_STATE';
}

export function calculateLineItem(
  item: {
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    gstSlab: GSTSlab;
  },
  supplyType: SupplyType
): {
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  lineTotal: number;
} {
  const qty = Number(item.quantity) || 0;
  const rate = Number(item.unitPrice) || 0;
  const discPercent = Math.min(100, Math.max(0, Number(item.discountPercent) || 0));
  
  const baseGross = qty * rate;
  const discountAmount = (baseGross * discPercent) / 100;
  const taxableAmount = Math.max(0, baseGross - discountAmount);
  
  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (supplyType === 'INTRA_STATE') {
    cgstRate = item.gstSlab / 2;
    sgstRate = item.gstSlab / 2;
    cgstAmount = (taxableAmount * cgstRate) / 100;
    sgstAmount = (taxableAmount * sgstRate) / 100;
  } else {
    igstRate = item.gstSlab;
    igstAmount = (taxableAmount * igstRate) / 100;
  }

  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const lineTotal = taxableAmount + totalTax;

  return {
    taxableAmount: Number(taxableAmount.toFixed(2)),
    cgstRate,
    cgstAmount: Number(cgstAmount.toFixed(2)),
    sgstRate,
    sgstAmount: Number(sgstAmount.toFixed(2)),
    igstRate,
    igstAmount: Number(igstAmount.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    lineTotal: Number(lineTotal.toFixed(2)),
  };
}

export function calculateInvoiceTotals(items: InvoiceLineItem[]) {
  let totalTaxableAmount = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  for (const item of items) {
    totalTaxableAmount += item.taxableAmount || 0;
    totalCgst += item.cgstAmount || 0;
    totalSgst += item.sgstAmount || 0;
    totalIgst += item.igstAmount || 0;
  }

  const totalTax = totalCgst + totalSgst + totalIgst;
  const subtotal = totalTaxableAmount + totalTax;
  
  // Commercial round-off to nearest rupee
  const grandTotal = Math.round(subtotal);
  const roundOff = Number((grandTotal - subtotal).toFixed(2));
  const amountInWords = numberToIndianWords(grandTotal);

  return {
    totalTaxableAmount: Number(totalTaxableAmount.toFixed(2)),
    totalCgst: Number(totalCgst.toFixed(2)),
    totalSgst: Number(totalSgst.toFixed(2)),
    totalIgst: Number(totalIgst.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    roundOff,
    grandTotal,
    amountInWords,
  };
}

// Number to Words in Indian numbering format (Crore, Lakh, Thousand, Hundred)
export function numberToIndianWords(n: number): string {
  if (isNaN(n) || n === 0) return 'Rupees Zero Only';

  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];

  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  function convertTwoDigits(num: number): string {
    if (num < 20) return ones[num];
    const rem = num % 10;
    return tens[Math.floor(num / 10)] + (rem ? ' ' + ones[rem] : '');
  }

  function convertThreeDigits(num: number): string {
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    let str = '';
    if (hundred > 0) {
      str += ones[hundred] + ' Hundred';
      if (remainder > 0) str += ' and ';
    }
    if (remainder > 0) {
      str += convertTwoDigits(remainder);
    }
    return str;
  }

  const rounded = Math.round(n * 100) / 100;
  const integerPart = Math.floor(rounded);
  const paisePart = Math.round((rounded - integerPart) * 100);

  let num = integerPart;
  let words = '';

  // Indian System: Crores (10,000,000), Lakhs (100,000), Thousands (1,000), Hundreds (100)
  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  const hundred = num; // remaining under 1000

  if (crore > 0) {
    words += convertTwoDigits(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertTwoDigits(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertTwoDigits(thousand) + ' Thousand ';
  }
  if (hundred > 0) {
    words += convertThreeDigits(hundred);
  }

  words = words.trim();
  if (!words) words = 'Zero';

  let result = 'Rupees ' + words;

  if (paisePart > 0) {
    result += ' and ' + convertTwoDigits(paisePart) + ' Paise';
  }

  result += ' Only';
  return result;
}

// Generate UPI payment intent URI
export function generateUpiUrl(params: {
  upiId: string;
  payeeName: string;
  amount: number;
  invoiceNumber: string;
}): string {
  const { upiId, payeeName, amount, invoiceNumber } = params;
  if (!upiId) return '';
  const cleanId = encodeURIComponent(upiId.trim());
  const cleanName = encodeURIComponent(payeeName.trim());
  const cleanAmount = amount.toFixed(2);
  const note = encodeURIComponent(`Invoice ${invoiceNumber}`);
  return `upi://pay?pa=${cleanId}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${note}`;
}

// Format Indian Rupee currency with standard Indian commas
export function formatINR(val: number): string {
  if (isNaN(val)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}
