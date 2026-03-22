import type { Company } from "@/types/company";

/**
 * Result of an anonymization operation, containing the cleaned text
 * and a mapping to restore original values.
 */
export interface AnonymizedResult {
  /** The text with all PII replaced by placeholders */
  text: string;
  /** Map from placeholder tokens to original values for restoration */
  mapping: Map<string, string>;
}

/**
 * Company data with all sensitive fields anonymized.
 */
export interface AnonymizedCompanyData {
  /** Anonymized company name */
  name: string;
  /** Anonymized sector (kept as-is, not PII) */
  sector: string;
  /** Employee count (kept as-is, not PII) */
  employeeCount: number;
  /** Revenue range bucket instead of exact value */
  revenueRange: string;
  /** Anonymized location (region only) */
  location: string;
  /** Anonymized products description */
  productsDescription: string;
}

/** Pattern definition for regex-based PII detection */
interface PatternDefinition {
  /** Unique name for this pattern type */
  name: string;
  /** Regex to detect the PII */
  regex: RegExp;
  /** Placeholder token to replace matches with */
  placeholder: string;
}

/**
 * Common French first names used for person name detection.
 * This list covers the most frequent names to catch common occurrences.
 */
const FRENCH_FIRST_NAMES: readonly string[] = [
  "Jean", "Pierre", "Marie", "Michel", "Philippe", "Alain", "Jacques",
  "Bernard", "Patrick", "Nicolas", "François", "Christophe", "Laurent",
  "Frédéric", "Stéphane", "Olivier", "David", "Thierry", "Éric", "Daniel",
  "Catherine", "Nathalie", "Isabelle", "Sylvie", "Valérie", "Sophie",
  "Sandrine", "Christine", "Véronique", "Anne", "Céline", "Aurélie",
  "Julien", "Thomas", "Alexandre", "Antoine", "Maxime", "Mathieu",
  "Guillaume", "Sébastien", "Camille", "Léa", "Manon", "Chloé", "Emma",
  "Louis", "Lucas", "Hugo", "Arthur", "Gabriel", "Raphaël", "Jules",
  "Paul", "Marc", "André", "Robert", "Claude", "Gérard", "René",
] as const;

/**
 * Common French last names used for person name detection.
 */
const FRENCH_LAST_NAMES: readonly string[] = [
  "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit",
  "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel",
  "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier", "Morel",
  "Girard", "André", "Lefèvre", "Mercier", "Dupont", "Lambert", "Bonnet",
  "François", "Martinez", "Legrand", "Garnier", "Faure", "Rousseau",
  "Blanc", "Guérin", "Muller", "Henry", "Roussel", "Nicolas", "Perrin",
  "Morin", "Mathieu", "Clément", "Gauthier", "Dumont", "Lopez", "Fontaine",
  "Chevalier", "Robin", "Masson", "Sanchez", "Gérard", "Nguyen",
] as const;

/**
 * Regex patterns for detecting various types of PII in French text.
 * Patterns are ordered from most specific to least specific to avoid
 * partial matches interfering with broader patterns.
 */
const PATTERNS: readonly PatternDefinition[] = [
  {
    name: "SIRET",
    regex: /\b\d{3}\s?\d{3}\s?\d{3}\s?\d{5}\b/g,
    placeholder: "[SIRET]",
  },
  {
    name: "SIREN",
    regex: /\b\d{3}\s?\d{3}\s?\d{3}\b/g,
    placeholder: "[SIRET]",
  },
  {
    name: "IBAN",
    regex: /\b[A-Z]{2}\d{2}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{0,4}\b/g,
    placeholder: "[BANK]",
  },
  {
    name: "BIC",
    regex: /\b[A-Z]{4}FR[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/g,
    placeholder: "[BANK]",
  },
  {
    name: "EMAIL",
    regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    placeholder: "[EMAIL]",
  },
  {
    name: "PHONE_INTL",
    regex: /(?:\+33|0033)[\s.-]?\d[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/g,
    placeholder: "[PHONE]",
  },
  {
    name: "PHONE_FR",
    regex: /\b0[1-9][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}\b/g,
    placeholder: "[PHONE]",
  },
  {
    name: "IP_V4",
    regex: /\b(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    placeholder: "[IP]",
  },
  {
    name: "ADDRESS",
    regex: /\b\d{1,4}[\s,]+(?:rue|avenue|boulevard|allée|impasse|chemin|place|cours|route|passage)\s+[A-ZÀ-Ý][a-zà-ÿ]+(?:\s+[A-ZÀ-Ý][a-zà-ÿ]+)*(?:[\s,]+\d{5}\s+[A-ZÀ-Ý][a-zà-ÿ]+(?:\s+[A-ZÀ-Ý][a-zà-ÿ]+)*)?\b/gi,
    placeholder: "[ADDRESS]",
  },
  {
    name: "POSTAL_CODE_CITY",
    regex: /\b\d{5}\s+[A-ZÀ-Ý][a-zà-ÿ]+(?:[-\s][A-ZÀ-Ý][a-zà-ÿ]+)*\b/g,
    placeholder: "[ADDRESS]",
  },
] as const;

/**
 * Builds a regex that matches common French full names (first + last).
 * Uses word boundaries to avoid false positives on partial matches.
 */
function buildNamePattern(): RegExp {
  const firstNames = FRENCH_FIRST_NAMES.join("|");
  const lastNames = FRENCH_LAST_NAMES.join("|");
  return new RegExp(
    `\\b(?:${firstNames})\\s+(?:${lastNames})\\b|\\b(?:M\\.|Mme|Mr|Mlle)\\.?\\s+[A-ZÀ-Ý][a-zà-ÿ]+(?:\\s+[A-ZÀ-Ý][a-zà-ÿ]+)?\\b`,
    "g"
  );
}

/**
 * Anonymizes a text string by replacing all detected PII with placeholders.
 * Returns both the anonymized text and a mapping for later restoration.
 *
 * @param text - The raw text potentially containing PII
 * @returns An AnonymizedResult with cleaned text and restoration mapping
 */
export function anonymize(text: string): AnonymizedResult {
  const mapping = new Map<string, string>();
  let counter = 0;
  let result = text;

  /**
   * Replaces all matches of a pattern, storing each original value
   * in the mapping with a unique indexed placeholder.
   */
  function replaceWithMapping(regex: RegExp, placeholderBase: string): void {
    result = result.replace(regex, (match: string) => {
      counter++;
      const token = `${placeholderBase}_${counter}`;
      mapping.set(token, match);
      return token;
    });
  }

  // Apply all regex-based patterns
  for (const pattern of PATTERNS) {
    replaceWithMapping(new RegExp(pattern.regex.source, pattern.regex.flags), pattern.placeholder.replace("[", "").replace("]", ""));
  }

  // Apply person name detection last to avoid conflicts with other patterns
  const namePattern = buildNamePattern();
  replaceWithMapping(namePattern, "PERSON");

  return { text: result, mapping };
}

/**
 * Anonymizes company data before sending to AI APIs.
 * Preserves structural information while removing identifying details.
 *
 * @param data - The company data to anonymize
 * @returns An AnonymizedCompanyData object safe for AI processing
 */
export function anonymizeCompanyData(data: Company): AnonymizedCompanyData {
  const revenueRange = getRevenueRange(data.annualRevenue);

  return {
    name: "[COMPANY]",
    sector: data.sector ?? "non renseigné",
    employeeCount: data.employeeCount ?? 0,
    revenueRange,
    location: anonymizeLocation(data.location),
    productsDescription: data.productsDescription
      ? anonymize(data.productsDescription).text
      : "non renseigné",
  };
}

/**
 * Restores anonymized text to its original form using the mapping
 * produced during anonymization.
 *
 * @param text - The anonymized text containing placeholder tokens
 * @param mapping - The Map from anonymize() linking tokens to original values
 * @returns The text with all placeholders replaced by original values
 */
export function restoreAnonymized(text: string, mapping: Map<string, string>): string {
  let restored = text;
  for (const [token, original] of mapping) {
    restored = restored.replace(token, original);
  }
  return restored;
}

/**
 * Converts an exact revenue figure to a bucketed range string.
 * Prevents exact financial data from leaking to AI.
 */
function getRevenueRange(revenue: number | undefined): string {
  if (revenue === undefined || revenue === null) {
    return "non renseigné";
  }
  if (revenue < 100_000) return "< 100k EUR";
  if (revenue < 500_000) return "100k-500k EUR";
  if (revenue < 1_000_000) return "500k-1M EUR";
  if (revenue < 5_000_000) return "1M-5M EUR";
  if (revenue < 10_000_000) return "5M-10M EUR";
  if (revenue < 50_000_000) return "10M-50M EUR";
  if (revenue < 100_000_000) return "50M-100M EUR";
  return "> 100M EUR";
}

/**
 * Reduces a location string to a region-level identifier.
 * Strips street addresses and postal codes, keeping only
 * the general area for AI context.
 */
function anonymizeLocation(location: string | undefined): string {
  if (!location) return "France";

  // Extract department number from postal code if present
  const postalMatch = location.match(/\b(\d{2})\d{3}\b/);
  if (postalMatch) {
    return `Département ${postalMatch[1]}`;
  }

  // If it looks like a city name only (no numbers), keep a generic version
  const cityMatch = location.match(/\b([A-ZÀ-Ý][a-zà-ÿ]+(?:[-\s][A-ZÀ-Ý][a-zà-ÿ]+)*)\s*$/);
  if (cityMatch) {
    return `Région de ${cityMatch[1]}`;
  }

  return "France";
}
