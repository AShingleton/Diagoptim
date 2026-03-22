import { describe, it, expect } from "vitest";
import { anonymize, restoreAnonymized } from "@/lib/utils/anonymizer";

// ---------------------------------------------------------------------------
// SIRET replacement
// ---------------------------------------------------------------------------

describe("Anonymizer - SIRET replacement", () => {
  it("replaces a 14-digit SIRET number", () => {
    const input = "SIRET: 12345678901234";
    const result = anonymize(input);
    expect(result.text).not.toContain("12345678901234");
    expect(result.mapping.size).toBeGreaterThan(0);
  });

  it("replaces a SIRET with spaces", () => {
    const input = "SIRET : 123 456 789 01234";
    const result = anonymize(input);
    expect(result.text).not.toContain("123 456 789 01234");
  });

  it("replaces a 9-digit SIREN number", () => {
    const input = "SIREN 123456789";
    const result = anonymize(input);
    expect(result.text).not.toContain("123456789");
  });
});

// ---------------------------------------------------------------------------
// Email replacement
// ---------------------------------------------------------------------------

describe("Anonymizer - Email replacement", () => {
  it("replaces an email address", () => {
    const input = "Contact: jean.dupont@example.fr pour plus d'infos";
    const result = anonymize(input);
    expect(result.text).not.toContain("jean.dupont@example.fr");
    expect(result.mapping.size).toBeGreaterThan(0);
  });

  it("replaces multiple email addresses", () => {
    const input = "Envoyez a contact@acme.com ou support@acme.com";
    const result = anonymize(input);
    expect(result.text).not.toContain("contact@acme.com");
    expect(result.text).not.toContain("support@acme.com");
  });
});

// ---------------------------------------------------------------------------
// Phone number replacement (French formats)
// ---------------------------------------------------------------------------

describe("Anonymizer - Phone replacement", () => {
  it("replaces a French landline (01)", () => {
    const input = "Tel: 01 23 45 67 89";
    const result = anonymize(input);
    expect(result.text).not.toContain("01 23 45 67 89");
  });

  it("replaces a French mobile (06)", () => {
    const input = "Mobile: 06 12 34 56 78";
    const result = anonymize(input);
    expect(result.text).not.toContain("06 12 34 56 78");
  });

  it("replaces international format (+33)", () => {
    const input = "Tel: +33 6 12 34 56 78";
    const result = anonymize(input);
    expect(result.text).not.toContain("+33 6 12 34 56 78");
  });

  it("replaces phone with dot separators", () => {
    const input = "Tel: 01.23.45.67.89";
    const result = anonymize(input);
    expect(result.text).not.toContain("01.23.45.67.89");
  });
});

// ---------------------------------------------------------------------------
// Non-PII text preservation
// ---------------------------------------------------------------------------

describe("Anonymizer - Non-PII text remains unchanged", () => {
  it("preserves plain business text", () => {
    const input = "Notre entreprise fabrique des pieces en acier depuis 2005.";
    const result = anonymize(input);
    expect(result.text).toBe(input);
    expect(result.mapping.size).toBe(0);
  });

  it("preserves numeric values that are not PII", () => {
    const input = "Le chiffre d'affaires est de 2 500 000 euros.";
    const result = anonymize(input);
    expect(result.text).toContain("2 500 000");
  });

  it("preserves short numbers that are not phone/SIRET", () => {
    const input = "Nous avons 25 employes et 120 clients.";
    const result = anonymize(input);
    expect(result.text).toBe(input);
  });
});

// ---------------------------------------------------------------------------
// Restoration
// ---------------------------------------------------------------------------

describe("Anonymizer - restoreAnonymized", () => {
  it("restores all anonymized values to originals", () => {
    const original = "Contact: jean.dupont@example.fr, tel: 01 23 45 67 89, SIRET 12345678901234";
    const { text: anonymized, mapping } = anonymize(original);

    // The anonymized text should not contain original PII
    expect(anonymized).not.toContain("jean.dupont@example.fr");
    expect(anonymized).not.toContain("01 23 45 67 89");

    // Restoring should bring back original values
    const restored = restoreAnonymized(anonymized, mapping);
    expect(restored).toContain("jean.dupont@example.fr");
    expect(restored).toContain("01 23 45 67 89");
  });

  it("handles empty mapping gracefully", () => {
    const text = "Nothing to restore here.";
    const result = restoreAnonymized(text, new Map());
    expect(result).toBe(text);
  });

  it("round-trips text with mixed PII", () => {
    const original = "Facture pour contact@test.com, SIRET 98765432101234";
    const { text: anonymized, mapping } = anonymize(original);
    const restored = restoreAnonymized(anonymized, mapping);
    expect(restored).toContain("contact@test.com");
    expect(restored).toContain("98765432101234");
  });
});
