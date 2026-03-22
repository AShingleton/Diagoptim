// ---------------------------------------------------------------------------
// DiagOptim – Document Analysis Prompts
// One prompt per document type, each instructing Claude to extract
// structured JSON matching the types in @/types/document.
// ---------------------------------------------------------------------------

import type { DocumentType } from "@/types/document";

/**
 * Returns the system prompt for analyzing a specific document type.
 * Each prompt tells Claude exactly which fields to extract and the
 * expected JSON schema.
 */
export function getDocumentAnalysisPrompt(type: DocumentType): string {
  const prompt = PROMPTS[type];
  if (!prompt) {
    return GENERIC_PROMPT;
  }
  return prompt;
}

// ---------------------------------------------------------------------------
// Shared preamble
// ---------------------------------------------------------------------------

const PREAMBLE = `Tu es un expert en extraction de donnees financieres et comptables pour DiagOptim, un outil de diagnostic Lean Management pour TPE/PME.

REGLES GENERALES :
- Extrais UNIQUEMENT les informations presentes dans le document.
- Si une valeur est absente ou illisible, utilise null.
- Tous les montants sont en nombre (pas de string), sans symboles de devise.
- Les dates sont au format ISO 8601 (YYYY-MM-DD).
- Reponds UNIQUEMENT avec un objet JSON valide, sans texte supplementaire.
- Ne fabrique JAMAIS de donnees. Si tu n'es pas sur, indique null.
`;

// ---------------------------------------------------------------------------
// Invoice / Facture
// ---------------------------------------------------------------------------

const INVOICE_PROMPT = `${PREAMBLE}
Tu analyses une FACTURE (invoice). Extrais les donnees suivantes :

Schema JSON attendu :
\`\`\`json
{
  "type": "invoice",
  "data": {
    "invoiceNumber": "string",
    "issueDate": "string (ISO date)",
    "dueDate": "string | null",
    "supplierName": "string",
    "supplierSiret": "string | null",
    "clientName": "string",
    "clientSiret": "string | null",
    "lineItems": [
      {
        "description": "string",
        "quantity": 0,
        "unitPriceHT": 0,
        "totalHT": 0,
        "vatRate": 0
      }
    ],
    "totalHT": 0,
    "totalVAT": 0,
    "totalTTC": 0,
    "currency": "EUR",
    "paymentTerms": "string | null",
    "department": "string | null"
  }
}
\`\`\`

REGLES SPECIFIQUES FACTURES :
- "vatRate" est un pourcentage (ex: 20 pour 20%).
- "department" est le code departement francais (ex: "75" pour Paris) extrait de l'adresse du fournisseur.
- Si plusieurs taux de TVA, chaque ligne doit avoir son propre vatRate.
- Verifie la coherence : totalHT + totalVAT doit etre proche de totalTTC.
- "currency" : utilise le code ISO 4217 (EUR, USD, etc.).
`;

// ---------------------------------------------------------------------------
// Quote / Devis
// ---------------------------------------------------------------------------

const QUOTE_PROMPT = `${PREAMBLE}
Tu analyses un DEVIS (quote). Extrais les donnees suivantes :

Schema JSON attendu :
\`\`\`json
{
  "type": "quote",
  "data": {
    "quoteNumber": "string",
    "issueDate": "string (ISO date)",
    "validUntil": "string | null (ISO date)",
    "supplierName": "string",
    "supplierSiret": "string | null",
    "clientName": "string",
    "clientSiret": "string | null",
    "lineItems": [
      {
        "description": "string",
        "quantity": 0,
        "unitPriceHT": 0,
        "totalHT": 0,
        "vatRate": 0
      }
    ],
    "totalHT": 0,
    "totalVAT": 0,
    "totalTTC": 0,
    "currency": "EUR",
    "conditions": "string | null"
  }
}
\`\`\`

REGLES SPECIFIQUES DEVIS :
- "validUntil" : date limite de validite du devis.
- "conditions" : conditions generales ou particulieres mentionnees (delai, garantie, etc.).
- Memes regles de coherence que les factures pour les montants.
`;

// ---------------------------------------------------------------------------
// Balance Sheet / Bilan
// ---------------------------------------------------------------------------

const BALANCE_SHEET_PROMPT = `${PREAMBLE}
Tu analyses un BILAN COMPTABLE (balance sheet). Extrais les donnees suivantes :

Schema JSON attendu :
\`\`\`json
{
  "type": "balance_sheet",
  "data": {
    "fiscalYear": "string (ex: 2024)",
    "closingDate": "string (ISO date)",
    "assets": {
      "fixedAssets": [
        { "label": "string", "amount": 0, "subcategories": [] }
      ],
      "currentAssets": [
        { "label": "string", "amount": 0, "subcategories": [] }
      ],
      "totalAssets": 0
    },
    "liabilities": {
      "equity": [
        { "label": "string", "amount": 0, "subcategories": [] }
      ],
      "provisions": [
        { "label": "string", "amount": 0, "subcategories": [] }
      ],
      "debts": [
        { "label": "string", "amount": 0, "subcategories": [] }
      ],
      "totalLiabilities": 0
    },
    "currency": "EUR"
  }
}
\`\`\`

REGLES SPECIFIQUES BILAN :
- totalAssets doit egaler totalLiabilities (equilibre du bilan).
- Regroupe les postes comptables en categories logiques (immobilisations corporelles, incorporelles, financieres, etc.).
- Les subcategories sont optionnelles : utilise-les uniquement si le document detaille les sous-postes.
- Si le document presente N et N-1, extrais uniquement l'exercice le plus recent.
`;

// ---------------------------------------------------------------------------
// Income Statement / Compte de resultat
// ---------------------------------------------------------------------------

const INCOME_STATEMENT_PROMPT = `${PREAMBLE}
Tu analyses un COMPTE DE RESULTAT (income statement). Extrais les donnees suivantes :

Schema JSON attendu :
\`\`\`json
{
  "type": "income_statement",
  "data": {
    "fiscalYear": "string",
    "closingDate": "string (ISO date)",
    "revenue": [
      { "label": "string", "amount": 0 }
    ],
    "totalRevenue": 0,
    "expenses": [
      { "label": "string", "amount": 0 }
    ],
    "totalExpenses": 0,
    "operatingIncome": 0,
    "financialResult": 0,
    "exceptionalResult": 0,
    "netIncome": 0,
    "currency": "EUR"
  }
}
\`\`\`

REGLES SPECIFIQUES COMPTE DE RESULTAT :
- "operatingIncome" = totalRevenue - totalExpenses (charges d'exploitation).
- Les montants de charges sont positifs (pas negatifs).
- Verifie : netIncome = operatingIncome + financialResult + exceptionalResult (avant impots, simplifie).
- Extrais l'exercice le plus recent si N et N-1 sont presentes.
`;

// ---------------------------------------------------------------------------
// Bank Statement / Releve bancaire
// ---------------------------------------------------------------------------

const BANK_STATEMENT_PROMPT = `${PREAMBLE}
Tu analyses un RELEVE BANCAIRE (bank statement). Extrais les donnees suivantes :

Schema JSON attendu :
\`\`\`json
{
  "type": "bank_statement",
  "data": {
    "bankName": "string",
    "accountNumber": "string (masque: XXXX...1234)",
    "statementPeriod": {
      "from": "string (ISO date)",
      "to": "string (ISO date)"
    },
    "openingBalance": 0,
    "closingBalance": 0,
    "transactions": [
      {
        "date": "string (ISO date)",
        "label": "string",
        "debit": null,
        "credit": null,
        "balance": 0,
        "category": "string | null"
      }
    ],
    "currency": "EUR"
  }
}
\`\`\`

REGLES SPECIFIQUES RELEVE BANCAIRE :
- "accountNumber" : masque le numero pour la securite (garde uniquement les 4 derniers chiffres).
- Chaque transaction a soit un debit soit un credit, jamais les deux (l'autre est null).
- "category" : tente de categoriser chaque transaction (salaires, fournisseurs, charges sociales, loyer, etc.).
- Les transactions doivent etre dans l'ordre chronologique.
- Verifie que openingBalance +/- transactions = closingBalance.
`;

// ---------------------------------------------------------------------------
// Generic / Fallback
// ---------------------------------------------------------------------------

const GENERIC_PROMPT = `${PREAMBLE}
Tu analyses un document dont le type exact n'est pas specifie. Extrais autant d'informations structurees que possible.

Reponds avec un JSON de cette forme :
\`\`\`json
{
  "type": "other",
  "summary": "string (resume du document en 2-3 phrases)",
  "keyFigures": {
    "label": "valeur"
  },
  "entities": {
    "companies": ["string"],
    "dates": ["string (ISO date)"],
    "amounts": [0]
  },
  "rawText": "string (texte brut extrait)"
}
\`\`\`

Extrais en priorite : noms d'entreprises, dates, montants financiers, et tout indicateur chiffre pertinent pour un diagnostic d'entreprise.
`;

// ---------------------------------------------------------------------------
// Prompt registry
// ---------------------------------------------------------------------------

const PROMPTS: Record<string, string> = {
  invoice: INVOICE_PROMPT,
  quote: QUOTE_PROMPT,
  balance_sheet: BALANCE_SHEET_PROMPT,
  income_statement: INCOME_STATEMENT_PROMPT,
  bank_statement: BANK_STATEMENT_PROMPT,
  // The following types fall back to the generic prompt
  // tax_return, payroll, contract, other
};
