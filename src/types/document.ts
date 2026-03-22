// ---------------------------------------------------------------------------
// Document types for the DiagOptim document processing pipeline
// ---------------------------------------------------------------------------

export type DocumentType =
  | "invoice"
  | "quote"
  | "balance_sheet"
  | "income_statement"
  | "bank_statement"
  | "tax_return"
  | "payroll"
  | "contract"
  | "other";

export type DocumentStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "extracted"
  | "validated"
  | "error";

export type DocumentMimeType =
  | "application/pdf"
  | "image/png"
  | "image/jpeg"
  | "image/webp";

// ---------------------------------------------------------------------------
// Core document model
// ---------------------------------------------------------------------------

export interface Document {
  id: string;
  companyId: string;
  diagnosticId: string;
  fileName: string;
  mimeType: DocumentMimeType;
  sizeBytes: number;
  storagePath: string;
  type: DocumentType;
  status: DocumentStatus;
  extractedData: ExtractedData | null;
  confidence: number | null; // 0–1 extraction confidence
  errorMessage: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Extracted data – discriminated union by document type
// ---------------------------------------------------------------------------

export type ExtractedData =
  | { type: "invoice"; data: ExtractedInvoiceData }
  | { type: "quote"; data: ExtractedQuoteData }
  | { type: "balance_sheet"; data: ExtractedBalanceSheet }
  | { type: "income_statement"; data: ExtractedIncomeStatement }
  | { type: "bank_statement"; data: ExtractedBankStatement };

// ---------------------------------------------------------------------------
// Invoice
// ---------------------------------------------------------------------------

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPriceHT: number;
  totalHT: number;
  vatRate: number; // e.g. 20 for 20 %
}

export interface ExtractedInvoiceData {
  invoiceNumber: string;
  issueDate: string; // ISO date
  dueDate: string | null;
  supplierName: string;
  supplierSiret: string | null;
  clientName: string;
  clientSiret: string | null;
  lineItems: InvoiceLineItem[];
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
  currency: string; // ISO 4217, e.g. "EUR"
  paymentTerms: string | null;
  department: string | null; // French department code
}

// ---------------------------------------------------------------------------
// Quote / Devis
// ---------------------------------------------------------------------------

export interface QuoteLineItem {
  description: string;
  quantity: number;
  unitPriceHT: number;
  totalHT: number;
  vatRate: number;
}

export interface ExtractedQuoteData {
  quoteNumber: string;
  issueDate: string;
  validUntil: string | null;
  supplierName: string;
  supplierSiret: string | null;
  clientName: string;
  clientSiret: string | null;
  lineItems: QuoteLineItem[];
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
  currency: string;
  conditions: string | null;
}

// ---------------------------------------------------------------------------
// Balance Sheet (Bilan)
// ---------------------------------------------------------------------------

export interface BalanceSheetCategory {
  label: string;
  amount: number;
  subcategories?: BalanceSheetCategory[];
}

export interface ExtractedBalanceSheet {
  fiscalYear: string; // e.g. "2024"
  closingDate: string;
  assets: {
    fixedAssets: BalanceSheetCategory[];
    currentAssets: BalanceSheetCategory[];
    totalAssets: number;
  };
  liabilities: {
    equity: BalanceSheetCategory[];
    provisions: BalanceSheetCategory[];
    debts: BalanceSheetCategory[];
    totalLiabilities: number;
  };
  currency: string;
}

// ---------------------------------------------------------------------------
// Income Statement (Compte de résultat)
// ---------------------------------------------------------------------------

export interface IncomeStatementLine {
  label: string;
  amount: number;
}

export interface ExtractedIncomeStatement {
  fiscalYear: string;
  closingDate: string;
  revenue: IncomeStatementLine[];
  totalRevenue: number;
  expenses: IncomeStatementLine[];
  totalExpenses: number;
  operatingIncome: number;
  financialResult: number;
  exceptionalResult: number;
  netIncome: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// Bank Statement (Relevé bancaire)
// ---------------------------------------------------------------------------

export interface BankTransaction {
  date: string;
  label: string;
  debit: number | null;
  credit: number | null;
  balance: number;
  category: string | null;
}

export interface ExtractedBankStatement {
  bankName: string;
  accountNumber: string; // masked
  statementPeriod: { from: string; to: string };
  openingBalance: number;
  closingBalance: number;
  transactions: BankTransaction[];
  currency: string;
}

// ---------------------------------------------------------------------------
// Upload helpers
// ---------------------------------------------------------------------------

export interface DocumentUploadRequest {
  file: File;
  type: DocumentType;
  companyId: string;
  diagnosticId: string;
}

export interface DocumentUploadResponse {
  documentId: string;
  storagePath: string;
  status: DocumentStatus;
}
