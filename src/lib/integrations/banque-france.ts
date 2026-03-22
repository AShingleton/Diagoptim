/**
 * Banque de France sector benchmark data.
 *
 * Provides financial ratios and sector benchmarks keyed by NAF code.
 * Uses static reference data for common NAF codes; in production,
 * this could be enriched via the Banque de France Open Data API.
 *
 * @see https://www.banque-france.fr/statistiques
 * @module integrations/banque-france
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Sector benchmark data for a given NAF code. */
export interface SectorBenchmarkData {
  codeNaf: string;
  sectorLabel: string;
  sampleSize: number;
  year: number;
  profitability: ProfitabilityBenchmarks;
  liquidity: LiquidityBenchmarks;
  solvency: SolvencyBenchmarks;
  activity: ActivityBenchmarks;
  productivity: ProductivityBenchmarks;
}

/** Profitability ratios benchmark (percentages). */
export interface ProfitabilityBenchmarks {
  /** Marge brute d'exploitation / CA */
  grossMarginRate: BenchmarkRange;
  /** Résultat net / CA */
  netMarginRate: BenchmarkRange;
  /** EBE / CA (Excédent Brut d'Exploitation) */
  ebitdaRate: BenchmarkRange;
  /** Résultat d'exploitation / CA */
  operatingMarginRate: BenchmarkRange;
}

/** Liquidity ratios benchmark. */
export interface LiquidityBenchmarks {
  /** Actif circulant / Passif circulant */
  currentRatio: BenchmarkRange;
  /** (Actif circulant - Stocks) / Passif circulant */
  quickRatio: BenchmarkRange;
  /** Trésorerie / CA journalier */
  cashDaysSales: BenchmarkRange;
}

/** Solvency ratios benchmark. */
export interface SolvencyBenchmarks {
  /** Capitaux propres / Total bilan */
  equityRatio: BenchmarkRange;
  /** Dettes financières / Capitaux propres */
  debtToEquity: BenchmarkRange;
  /** Dettes financières / EBE */
  debtToEbitda: BenchmarkRange;
}

/** Activity ratios benchmark (in days). */
export interface ActivityBenchmarks {
  /** Délai moyen de paiement clients (jours) */
  daysReceivable: BenchmarkRange;
  /** Délai moyen de paiement fournisseurs (jours) */
  daysPayable: BenchmarkRange;
  /** Rotation des stocks (jours) */
  daysInventory: BenchmarkRange;
}

/** Productivity benchmarks. */
export interface ProductivityBenchmarks {
  /** CA / Effectif */
  revenuePerEmployee: BenchmarkRange;
  /** Valeur ajoutée / Effectif */
  valueAddedPerEmployee: BenchmarkRange;
  /** Charges de personnel / Valeur ajoutée */
  laborCostRatio: BenchmarkRange;
}

/** A benchmark range with quartiles. */
export interface BenchmarkRange {
  q1: number;   // 25th percentile (lower quartile)
  median: number;
  q3: number;   // 75th percentile (upper quartile)
}

/** Financial ratios computed or looked up for a specific NAF code. */
export interface FinancialRatios {
  codeNaf: string;
  sectorLabel: string;
  year: number;
  ratios: {
    grossMarginRate: BenchmarkRange;
    netMarginRate: BenchmarkRange;
    currentRatio: BenchmarkRange;
    debtToEquity: BenchmarkRange;
    daysReceivable: BenchmarkRange;
    daysPayable: BenchmarkRange;
    revenuePerEmployee: BenchmarkRange;
  };
}

// ---------------------------------------------------------------------------
// Static benchmark data for common NAF codes
// ---------------------------------------------------------------------------

const BENCHMARK_DATA: Record<string, SectorBenchmarkData> = {
  "25.11Z": {
    codeNaf: "25.11Z",
    sectorLabel: "Fabrication de structures métalliques et de parties de structures",
    sampleSize: 2340,
    year: 2024,
    profitability: {
      grossMarginRate: { q1: 18, median: 25, q3: 32 },
      netMarginRate: { q1: 1.5, median: 3.5, q3: 6 },
      ebitdaRate: { q1: 4, median: 7, q3: 11 },
      operatingMarginRate: { q1: 2, median: 4.5, q3: 8 },
    },
    liquidity: {
      currentRatio: { q1: 1.1, median: 1.4, q3: 1.9 },
      quickRatio: { q1: 0.8, median: 1.1, q3: 1.5 },
      cashDaysSales: { q1: 10, median: 25, q3: 45 },
    },
    solvency: {
      equityRatio: { q1: 20, median: 32, q3: 45 },
      debtToEquity: { q1: 0.3, median: 0.8, q3: 1.5 },
      debtToEbitda: { q1: 1, median: 2.5, q3: 4.5 },
    },
    activity: {
      daysReceivable: { q1: 35, median: 55, q3: 75 },
      daysPayable: { q1: 30, median: 50, q3: 70 },
      daysInventory: { q1: 15, median: 30, q3: 50 },
    },
    productivity: {
      revenuePerEmployee: { q1: 110000, median: 150000, q3: 200000 },
      valueAddedPerEmployee: { q1: 45000, median: 58000, q3: 72000 },
      laborCostRatio: { q1: 60, median: 70, q3: 80 },
    },
  },

  "62.01Z": {
    codeNaf: "62.01Z",
    sectorLabel: "Programmation informatique",
    sampleSize: 12500,
    year: 2024,
    profitability: {
      grossMarginRate: { q1: 55, median: 70, q3: 82 },
      netMarginRate: { q1: 3, median: 8, q3: 15 },
      ebitdaRate: { q1: 5, median: 12, q3: 20 },
      operatingMarginRate: { q1: 3, median: 9, q3: 16 },
    },
    liquidity: {
      currentRatio: { q1: 1.2, median: 1.6, q3: 2.5 },
      quickRatio: { q1: 1.1, median: 1.5, q3: 2.3 },
      cashDaysSales: { q1: 15, median: 35, q3: 65 },
    },
    solvency: {
      equityRatio: { q1: 25, median: 40, q3: 55 },
      debtToEquity: { q1: 0.1, median: 0.4, q3: 1.0 },
      debtToEbitda: { q1: 0.5, median: 1.5, q3: 3.0 },
    },
    activity: {
      daysReceivable: { q1: 40, median: 60, q3: 85 },
      daysPayable: { q1: 25, median: 40, q3: 60 },
      daysInventory: { q1: 0, median: 2, q3: 10 },
    },
    productivity: {
      revenuePerEmployee: { q1: 80000, median: 120000, q3: 180000 },
      valueAddedPerEmployee: { q1: 55000, median: 75000, q3: 100000 },
      laborCostRatio: { q1: 55, median: 68, q3: 78 },
    },
  },

  "47.11F": {
    codeNaf: "47.11F",
    sectorLabel: "Hypermarchés",
    sampleSize: 450,
    year: 2024,
    profitability: {
      grossMarginRate: { q1: 20, median: 24, q3: 28 },
      netMarginRate: { q1: 0.5, median: 1.5, q3: 2.5 },
      ebitdaRate: { q1: 2, median: 3.5, q3: 5 },
      operatingMarginRate: { q1: 1, median: 2, q3: 3.5 },
    },
    liquidity: {
      currentRatio: { q1: 0.6, median: 0.8, q3: 1.1 },
      quickRatio: { q1: 0.3, median: 0.5, q3: 0.7 },
      cashDaysSales: { q1: 3, median: 8, q3: 15 },
    },
    solvency: {
      equityRatio: { q1: 15, median: 28, q3: 40 },
      debtToEquity: { q1: 0.5, median: 1.2, q3: 2.5 },
      debtToEbitda: { q1: 1.5, median: 3, q3: 5 },
    },
    activity: {
      daysReceivable: { q1: 2, median: 5, q3: 12 },
      daysPayable: { q1: 35, median: 50, q3: 65 },
      daysInventory: { q1: 20, median: 30, q3: 40 },
    },
    productivity: {
      revenuePerEmployee: { q1: 200000, median: 280000, q3: 350000 },
      valueAddedPerEmployee: { q1: 35000, median: 45000, q3: 55000 },
      laborCostRatio: { q1: 65, median: 75, q3: 85 },
    },
  },

  "43.21A": {
    codeNaf: "43.21A",
    sectorLabel: "Travaux d'installation électrique dans tous locaux",
    sampleSize: 8200,
    year: 2024,
    profitability: {
      grossMarginRate: { q1: 25, median: 35, q3: 45 },
      netMarginRate: { q1: 2, median: 4, q3: 7 },
      ebitdaRate: { q1: 4, median: 7, q3: 11 },
      operatingMarginRate: { q1: 2.5, median: 5, q3: 8.5 },
    },
    liquidity: {
      currentRatio: { q1: 1.1, median: 1.4, q3: 2.0 },
      quickRatio: { q1: 0.9, median: 1.2, q3: 1.7 },
      cashDaysSales: { q1: 8, median: 20, q3: 40 },
    },
    solvency: {
      equityRatio: { q1: 20, median: 35, q3: 50 },
      debtToEquity: { q1: 0.2, median: 0.6, q3: 1.3 },
      debtToEbitda: { q1: 0.8, median: 2, q3: 4 },
    },
    activity: {
      daysReceivable: { q1: 40, median: 60, q3: 80 },
      daysPayable: { q1: 30, median: 45, q3: 65 },
      daysInventory: { q1: 5, median: 15, q3: 30 },
    },
    productivity: {
      revenuePerEmployee: { q1: 90000, median: 130000, q3: 170000 },
      valueAddedPerEmployee: { q1: 40000, median: 55000, q3: 70000 },
      laborCostRatio: { q1: 60, median: 72, q3: 82 },
    },
  },

  "56.10A": {
    codeNaf: "56.10A",
    sectorLabel: "Restauration traditionnelle",
    sampleSize: 35000,
    year: 2024,
    profitability: {
      grossMarginRate: { q1: 60, median: 68, q3: 74 },
      netMarginRate: { q1: -1, median: 3, q3: 7 },
      ebitdaRate: { q1: 3, median: 8, q3: 14 },
      operatingMarginRate: { q1: 1, median: 5, q3: 10 },
    },
    liquidity: {
      currentRatio: { q1: 0.5, median: 0.8, q3: 1.2 },
      quickRatio: { q1: 0.4, median: 0.7, q3: 1.0 },
      cashDaysSales: { q1: 5, median: 15, q3: 30 },
    },
    solvency: {
      equityRatio: { q1: 10, median: 25, q3: 40 },
      debtToEquity: { q1: 0.5, median: 1.5, q3: 3.0 },
      debtToEbitda: { q1: 1, median: 3, q3: 6 },
    },
    activity: {
      daysReceivable: { q1: 1, median: 3, q3: 8 },
      daysPayable: { q1: 20, median: 35, q3: 50 },
      daysInventory: { q1: 5, median: 10, q3: 18 },
    },
    productivity: {
      revenuePerEmployee: { q1: 50000, median: 70000, q3: 95000 },
      valueAddedPerEmployee: { q1: 30000, median: 42000, q3: 55000 },
      laborCostRatio: { q1: 55, median: 65, q3: 78 },
    },
  },
};

// ---------------------------------------------------------------------------
// Default fallback benchmarks
// ---------------------------------------------------------------------------

const DEFAULT_BENCHMARKS: SectorBenchmarkData = {
  codeNaf: "XX.XXZ",
  sectorLabel: "Tous secteurs confondus (données moyennes)",
  sampleSize: 0,
  year: 2024,
  profitability: {
    grossMarginRate: { q1: 25, median: 40, q3: 60 },
    netMarginRate: { q1: 1, median: 4, q3: 8 },
    ebitdaRate: { q1: 4, median: 8, q3: 14 },
    operatingMarginRate: { q1: 2, median: 5, q3: 10 },
  },
  liquidity: {
    currentRatio: { q1: 1.0, median: 1.4, q3: 2.0 },
    quickRatio: { q1: 0.7, median: 1.1, q3: 1.6 },
    cashDaysSales: { q1: 10, median: 25, q3: 50 },
  },
  solvency: {
    equityRatio: { q1: 20, median: 35, q3: 50 },
    debtToEquity: { q1: 0.3, median: 0.8, q3: 1.5 },
    debtToEbitda: { q1: 1, median: 2.5, q3: 4.5 },
  },
  activity: {
    daysReceivable: { q1: 20, median: 45, q3: 70 },
    daysPayable: { q1: 25, median: 45, q3: 65 },
    daysInventory: { q1: 10, median: 25, q3: 45 },
  },
  productivity: {
    revenuePerEmployee: { q1: 80000, median: 130000, q3: 200000 },
    valueAddedPerEmployee: { q1: 40000, median: 55000, q3: 75000 },
    laborCostRatio: { q1: 58, median: 70, q3: 80 },
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Retrieves sector benchmark data for a given NAF code.
 *
 * Returns pre-loaded static data for known NAF codes, or falls back
 * to cross-sector average benchmarks for unknown codes.
 *
 * @param codeNaf - The NAF (APE) code (e.g., "25.11Z").
 * @returns Sector benchmark data with quartile distributions.
 */
export async function getSectorBenchmarks(codeNaf: string): Promise<SectorBenchmarkData> {
  const normalized = normalizeNafCode(codeNaf);
  const data = BENCHMARK_DATA[normalized];

  if (data) {
    return data;
  }

  // Return default cross-sector benchmarks with the requested code
  return {
    ...DEFAULT_BENCHMARKS,
    codeNaf: normalized,
    sectorLabel: `Secteur NAF ${normalized} (données moyennes tous secteurs)`,
  };
}

/**
 * Retrieves key financial ratios for a given NAF code.
 *
 * This is a simplified view of the full benchmark data, containing
 * the most commonly used ratios for comparison.
 *
 * @param codeNaf - The NAF (APE) code.
 * @returns Key financial ratios with quartile distributions.
 */
export async function getFinancialRatios(codeNaf: string): Promise<FinancialRatios> {
  const benchmarks = await getSectorBenchmarks(codeNaf);

  return {
    codeNaf: benchmarks.codeNaf,
    sectorLabel: benchmarks.sectorLabel,
    year: benchmarks.year,
    ratios: {
      grossMarginRate: benchmarks.profitability.grossMarginRate,
      netMarginRate: benchmarks.profitability.netMarginRate,
      currentRatio: benchmarks.liquidity.currentRatio,
      debtToEquity: benchmarks.solvency.debtToEquity,
      daysReceivable: benchmarks.activity.daysReceivable,
      daysPayable: benchmarks.activity.daysPayable,
      revenuePerEmployee: benchmarks.productivity.revenuePerEmployee,
    },
  };
}

/**
 * Returns all NAF codes that have benchmark data available.
 *
 * @returns Array of NAF code strings.
 */
export function getAvailableNafCodes(): string[] {
  return Object.keys(BENCHMARK_DATA);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalizes a NAF code to the standard "XX.XXA" format.
 *
 * @param code - Raw NAF code input (e.g., "2511Z", "25.11Z", "25.11 Z").
 * @returns Normalized NAF code.
 */
function normalizeNafCode(code: string): string {
  const cleaned = code.replace(/\s/g, "").toUpperCase();

  // Already in correct format "XX.XXZ"
  if (/^\d{2}\.\d{2}[A-Z]$/.test(cleaned)) {
    return cleaned;
  }

  // Format "XXXXZ" -> "XX.XXZ"
  if (/^\d{4}[A-Z]$/.test(cleaned)) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
  }

  return cleaned;
}
