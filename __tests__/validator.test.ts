import { describe, it, expect } from "vitest";
import {
  validateExtractedData,
  checkConsistency,
  flagAnomalies,
} from "@/lib/documents/validator";
import type { ExtractedData } from "@/types/document";
import type { CompanyProfile } from "@/types/company";

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

function makeInvoiceData(overrides: Record<string, unknown> = {}): ExtractedData {
  return {
    type: "invoice",
    data: {
      invoiceNumber: "FAC-2025-001",
      issueDate: "2025-01-15",
      dueDate: "2025-02-15",
      supplierName: "Fournisseur Test SARL",
      supplierSiret: "12345678901234",
      clientName: "Client Test SAS",
      clientSiret: "98765432109876",
      lineItems: [
        { description: "Prestation A", quantity: 2, unitPriceHT: 500, totalHT: 1000, vatRate: 20 },
        { description: "Prestation B", quantity: 1, unitPriceHT: 300, totalHT: 300, vatRate: 20 },
      ],
      totalHT: 1300,
      totalVAT: 260,
      totalTTC: 1560,
      currency: "EUR",
      paymentTerms: "30 jours fin de mois",
      department: "75",
      ...overrides,
    },
  } as ExtractedData;
}

function makeCompanyProfile(overrides: Partial<CompanyProfile> = {}): CompanyProfile {
  return {
    name: "Test Enterprise",
    sector: "manufacturing",
    employeeCount: 25,
    annualRevenue: 2_000_000,
    location: "Paris",
    productsDescription: "Pieces metalliques",
    clientCount: 50,
    competitors: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// validateExtractedData
// ---------------------------------------------------------------------------

describe("Validator - validateExtractedData", () => {
  it("returns valid for correct invoice data", () => {
    const data = makeInvoiceData();
    const result = validateExtractedData(data, "invoice");
    expect(result.isValid).toBe(true);
    expect(result.errorCount).toBe(0);
  });

  it("catches missing required fields - no type", () => {
    const data = { data: { invoiceNumber: "X" } } as unknown as ExtractedData;
    const result = validateExtractedData(data, "invoice");
    expect(result.isValid).toBe(false);
    expect(result.errorCount).toBeGreaterThan(0);
    const typeIssue = result.issues.find((i) => i.field === "type");
    expect(typeIssue).toBeDefined();
  });

  it("catches missing required fields - no data", () => {
    const data = { type: "invoice" } as unknown as ExtractedData;
    const result = validateExtractedData(data, "invoice");
    expect(result.isValid).toBe(false);
    const dataIssue = result.issues.find((i) => i.field === "data");
    expect(dataIssue).toBeDefined();
  });

  it("catches missing invoice number", () => {
    const data = makeInvoiceData({ invoiceNumber: "" });
    const result = validateExtractedData(data, "invoice");
    expect(result.isValid).toBe(false);
    const issue = result.issues.find((i) => i.field === "invoiceNumber");
    expect(issue).toBeDefined();
  });

  it("catches missing supplier name", () => {
    const data = makeInvoiceData({ supplierName: "" });
    const result = validateExtractedData(data, "invoice");
    expect(result.isValid).toBe(false);
    const issue = result.issues.find((i) => i.field === "supplierName");
    expect(issue).toBeDefined();
  });

  it("catches negative totalHT", () => {
    const data = makeInvoiceData({ totalHT: -100 });
    const result = validateExtractedData(data, "invoice");
    expect(result.isValid).toBe(false);
  });

  it("catches invalid ISO date format", () => {
    const data = makeInvoiceData({ issueDate: "15/01/2025" });
    const result = validateExtractedData(data, "invoice");
    const dateIssue = result.issues.find((i) => i.field === "issueDate");
    expect(dateIssue).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// checkConsistency
// ---------------------------------------------------------------------------

describe("Validator - checkConsistency", () => {
  it("passes when HT + TVA = TTC", () => {
    const data = makeInvoiceData({
      totalHT: 1000,
      totalVAT: 200,
      totalTTC: 1200,
    });
    const checks = checkConsistency(data);
    const htCheck = checks.find((c) => c.checkName === "invoice_ht_tva_ttc");
    expect(htCheck).toBeDefined();
    expect(htCheck?.passed).toBe(true);
  });

  it("fails when HT + TVA != TTC", () => {
    const data = makeInvoiceData({
      totalHT: 1000,
      totalVAT: 200,
      totalTTC: 1500, // 1000 + 200 = 1200, not 1500
    });
    const checks = checkConsistency(data);
    const htCheck = checks.find((c) => c.checkName === "invoice_ht_tva_ttc");
    expect(htCheck).toBeDefined();
    expect(htCheck?.passed).toBe(false);
    expect(htCheck?.discrepancy).toBeGreaterThan(0);
  });

  it("checks line items sum against totalHT", () => {
    const data = makeInvoiceData({
      lineItems: [
        { description: "A", quantity: 1, unitPriceHT: 100, totalHT: 100, vatRate: 20 },
        { description: "B", quantity: 1, unitPriceHT: 200, totalHT: 200, vatRate: 20 },
      ],
      totalHT: 300,
      totalVAT: 60,
      totalTTC: 360,
    });
    const checks = checkConsistency(data);
    const lineCheck = checks.find((c) => c.checkName === "invoice_line_items_sum");
    expect(lineCheck).toBeDefined();
    expect(lineCheck?.passed).toBe(true);
  });

  it("verifies due date is after issue date", () => {
    const data = makeInvoiceData({
      issueDate: "2025-03-01",
      dueDate: "2025-04-01",
    });
    const checks = checkConsistency(data);
    const dateCheck = checks.find((c) => c.checkName === "invoice_date_order");
    expect(dateCheck).toBeDefined();
    expect(dateCheck?.passed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// flagAnomalies
// ---------------------------------------------------------------------------

describe("Validator - flagAnomalies", () => {
  it("flags invoice amount exceeding annual revenue threshold", () => {
    const data = makeInvoiceData({
      totalTTC: 1_500_000, // 75% of 2M revenue
    });
    const profile = makeCompanyProfile({ annualRevenue: 2_000_000 });
    const anomalies = flagAnomalies(data, profile);
    const outlier = anomalies.find((a) => a.type === "amount_outlier");
    expect(outlier).toBeDefined();
    expect(outlier?.field).toBe("totalTTC");
  });

  it("does not flag normal-sized invoice", () => {
    const data = makeInvoiceData({ totalTTC: 5_000 });
    const profile = makeCompanyProfile({ annualRevenue: 2_000_000 });
    const anomalies = flagAnomalies(data, profile);
    const outlier = anomalies.find((a) => a.type === "amount_outlier");
    expect(outlier).toBeUndefined();
  });

  it("flags zero VAT as informational", () => {
    const data = makeInvoiceData({
      totalHT: 1000,
      totalVAT: 0,
      totalTTC: 1000,
    });
    const anomalies = flagAnomalies(data);
    const zeroVat = anomalies.find(
      (a) => a.type === "suspicious_value" && a.field === "totalVAT",
    );
    expect(zeroVat).toBeDefined();
    expect(zeroVat?.severity).toBe("info");
  });

  it("handles missing company profile gracefully", () => {
    const data = makeInvoiceData({ totalTTC: 999_999 });
    const anomalies = flagAnomalies(data);
    // Should not throw, and no amount_outlier without profile
    const outlier = anomalies.find((a) => a.type === "amount_outlier");
    expect(outlier).toBeUndefined();
  });
});
