// ---------------------------------------------------------------------------
// DiagOptim – Sectoral Benchmarks
// Reference data for comparing company diagnostic results against industry norms
// ---------------------------------------------------------------------------

import type { CompanyProfile } from "@/types/company";
import type { WasteCategory, WasteScores } from "@/types/diagnostic";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Benchmark data for a given sector / sub-sector. */
export interface SectorBenchmarks {
  /** Sector identifier. */
  sector: string;
  /** Optional sub-sector for more granular data. */
  subsector: string | null;
  /** Average waste scores across companies in this sector (0-10). */
  avgWasteScores: WasteScores;
  /** Top-quartile (best 25 %) waste scores – lower is better. */
  topQuartileScores: WasteScores;
  /** Average annual revenue per employee in EUR. */
  avgRevPerEmployee: number;
  /** Average net margin as a decimal (e.g. 0.08 for 8 %). */
  avgMargin: number;
  /** Sample size used to compute the benchmarks. */
  sampleSize: number;
}

/** Result of comparing a company against its sector benchmarks. */
export interface BenchmarkComparison {
  /** The company's global score. */
  companyGlobalScore: number;
  /** The sector average global score. */
  sectorAvgGlobalScore: number;
  /** The sector top-quartile global score. */
  sectorTopQuartileGlobalScore: number;
  /** Per-category comparison. */
  categories: CategoryComparison[];
  /** Revenue per employee comparison. */
  revPerEmployee: {
    company: number;
    sectorAvg: number;
    percentile: PercentileLabel;
  };
  /** Overall positioning label. */
  positioning: PositioningLabel;
}

/** Comparison detail for a single waste category. */
export interface CategoryComparison {
  category: WasteCategory;
  companyScore: number;
  sectorAvg: number;
  sectorTopQuartile: number;
  /** Positive = better than sector average, negative = worse. */
  delta: number;
  positioning: PositioningLabel;
}

export type PositioningLabel =
  | "excellent"
  | "above_average"
  | "average"
  | "below_average"
  | "critical";

export type PercentileLabel =
  | "top_10"
  | "top_25"
  | "median"
  | "bottom_25"
  | "bottom_10";

// ---------------------------------------------------------------------------
// Benchmark data
// ---------------------------------------------------------------------------

const BENCHMARKS: SectorBenchmarks[] = [
  // ---- Manufacturing ----
  {
    sector: "manufacturing",
    subsector: null,
    avgWasteScores: {
      overproduction: 5.5,
      waiting: 5.0,
      transport: 4.5,
      overprocessing: 5.0,
      inventory: 5.5,
      motion: 4.0,
      defects: 4.5,
      skills: 4.0,
    },
    topQuartileScores: {
      overproduction: 3.0,
      waiting: 2.5,
      transport: 2.5,
      overprocessing: 3.0,
      inventory: 3.0,
      motion: 2.0,
      defects: 2.0,
      skills: 2.5,
    },
    avgRevPerEmployee: 180_000,
    avgMargin: 0.06,
    sampleSize: 450,
  },

  // ---- Retail ----
  {
    sector: "retail",
    subsector: null,
    avgWasteScores: {
      overproduction: 4.0,
      waiting: 4.5,
      transport: 5.0,
      overprocessing: 3.5,
      inventory: 6.0,
      motion: 4.0,
      defects: 3.5,
      skills: 4.5,
    },
    topQuartileScores: {
      overproduction: 2.0,
      waiting: 2.5,
      transport: 3.0,
      overprocessing: 2.0,
      inventory: 3.5,
      motion: 2.0,
      defects: 2.0,
      skills: 2.5,
    },
    avgRevPerEmployee: 220_000,
    avgMargin: 0.04,
    sampleSize: 380,
  },

  // ---- Services / Consulting ----
  {
    sector: "services",
    subsector: "consulting",
    avgWasteScores: {
      overproduction: 4.5,
      waiting: 5.5,
      transport: 3.0,
      overprocessing: 5.5,
      inventory: 3.0,
      motion: 3.5,
      defects: 4.0,
      skills: 5.0,
    },
    topQuartileScores: {
      overproduction: 2.5,
      waiting: 3.0,
      transport: 1.5,
      overprocessing: 3.0,
      inventory: 1.5,
      motion: 2.0,
      defects: 2.0,
      skills: 2.5,
    },
    avgRevPerEmployee: 120_000,
    avgMargin: 0.12,
    sampleSize: 520,
  },

  // ---- Services (general) ----
  {
    sector: "services",
    subsector: null,
    avgWasteScores: {
      overproduction: 4.0,
      waiting: 5.0,
      transport: 3.5,
      overprocessing: 5.0,
      inventory: 3.0,
      motion: 3.5,
      defects: 4.0,
      skills: 5.0,
    },
    topQuartileScores: {
      overproduction: 2.0,
      waiting: 2.5,
      transport: 2.0,
      overprocessing: 2.5,
      inventory: 1.5,
      motion: 2.0,
      defects: 2.0,
      skills: 2.5,
    },
    avgRevPerEmployee: 110_000,
    avgMargin: 0.10,
    sampleSize: 620,
  },

  // ---- Construction ----
  {
    sector: "construction",
    subsector: null,
    avgWasteScores: {
      overproduction: 4.0,
      waiting: 6.0,
      transport: 6.0,
      overprocessing: 4.0,
      inventory: 5.0,
      motion: 5.5,
      defects: 5.0,
      skills: 4.0,
    },
    topQuartileScores: {
      overproduction: 2.0,
      waiting: 3.5,
      transport: 3.5,
      overprocessing: 2.0,
      inventory: 3.0,
      motion: 3.0,
      defects: 2.5,
      skills: 2.0,
    },
    avgRevPerEmployee: 150_000,
    avgMargin: 0.05,
    sampleSize: 310,
  },

  // ---- Food / Restaurant ----
  {
    sector: "food",
    subsector: "restaurant",
    avgWasteScores: {
      overproduction: 6.5,
      waiting: 5.0,
      transport: 3.5,
      overprocessing: 4.0,
      inventory: 6.0,
      motion: 4.5,
      defects: 5.0,
      skills: 4.5,
    },
    topQuartileScores: {
      overproduction: 3.5,
      waiting: 2.5,
      transport: 2.0,
      overprocessing: 2.0,
      inventory: 3.0,
      motion: 2.5,
      defects: 2.5,
      skills: 2.5,
    },
    avgRevPerEmployee: 85_000,
    avgMargin: 0.07,
    sampleSize: 280,
  },

  // ---- Food (general / agro-alimentaire) ----
  {
    sector: "food",
    subsector: null,
    avgWasteScores: {
      overproduction: 6.0,
      waiting: 4.5,
      transport: 4.5,
      overprocessing: 4.5,
      inventory: 5.5,
      motion: 4.0,
      defects: 5.5,
      skills: 4.0,
    },
    topQuartileScores: {
      overproduction: 3.0,
      waiting: 2.5,
      transport: 2.5,
      overprocessing: 2.5,
      inventory: 3.0,
      motion: 2.0,
      defects: 3.0,
      skills: 2.0,
    },
    avgRevPerEmployee: 160_000,
    avgMargin: 0.04,
    sampleSize: 350,
  },

  // ---- Healthcare ----
  {
    sector: "healthcare",
    subsector: null,
    avgWasteScores: {
      overproduction: 3.5,
      waiting: 6.5,
      transport: 4.0,
      overprocessing: 5.5,
      inventory: 4.0,
      motion: 4.0,
      defects: 5.0,
      skills: 4.5,
    },
    topQuartileScores: {
      overproduction: 2.0,
      waiting: 3.5,
      transport: 2.0,
      overprocessing: 3.0,
      inventory: 2.0,
      motion: 2.0,
      defects: 2.5,
      skills: 2.5,
    },
    avgRevPerEmployee: 95_000,
    avgMargin: 0.08,
    sampleSize: 240,
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Retrieves benchmark data for a given sector and optional sub-sector.
 * Falls back to the general sector entry, then to a computed default
 * if no specific benchmarks exist.
 */
export function getBenchmarks(
  sector: string,
  subsector?: string
): SectorBenchmarks {
  const key = sector.toLowerCase().trim();
  const subKey = subsector?.toLowerCase().trim() ?? null;

  // Try exact match with subsector first
  if (subKey) {
    const exact = BENCHMARKS.find(
      (b) => b.sector === key && b.subsector === subKey
    );
    if (exact) return exact;
  }

  // Try sector-level match (subsector = null)
  const sectorMatch = BENCHMARKS.find(
    (b) => b.sector === key && b.subsector === null
  );
  if (sectorMatch) return sectorMatch;

  // Try any entry for this sector
  const anyMatch = BENCHMARKS.find((b) => b.sector === key);
  if (anyMatch) return anyMatch;

  // Fallback: compute an average across all sectors
  return computeDefaultBenchmarks(sector);
}

/**
 * Compares a company's waste scores against its sector benchmarks.
 * Returns a detailed comparison with per-category deltas and
 * an overall positioning label.
 */
export function compareToSector(
  company: CompanyProfile,
  wasteScores: WasteScores
): BenchmarkComparison {
  const benchmarks = getBenchmarks(company.sector);
  const categories = Object.keys(wasteScores) as WasteCategory[];

  // Per-category comparison
  const categoryComparisons: CategoryComparison[] = categories.map((cat) => {
    const companyScore = wasteScores[cat];
    const sectorAvg = benchmarks.avgWasteScores[cat];
    const sectorTop = benchmarks.topQuartileScores[cat];
    const delta = sectorAvg - companyScore; // positive = company is better

    return {
      category: cat,
      companyScore,
      sectorAvg,
      sectorTopQuartile: sectorTop,
      delta,
      positioning: getPositioning(companyScore, sectorAvg, sectorTop),
    };
  });

  // Global scores (using equal weights for benchmark comparison)
  const equalWeight = 1 / categories.length;
  const companyGlobal =
    100 -
    categories.reduce((sum, cat) => sum + wasteScores[cat] * equalWeight * 10, 0);
  const sectorAvgGlobal =
    100 -
    categories.reduce(
      (sum, cat) => sum + benchmarks.avgWasteScores[cat] * equalWeight * 10,
      0
    );
  const sectorTopGlobal =
    100 -
    categories.reduce(
      (sum, cat) =>
        sum + benchmarks.topQuartileScores[cat] * equalWeight * 10,
      0
    );

  // Revenue per employee
  const companyRevPerEmp =
    company.employeeCount > 0
      ? company.annualRevenue / company.employeeCount
      : 0;

  const revPercentile = getRevenuePercentile(
    companyRevPerEmp,
    benchmarks.avgRevPerEmployee
  );

  // Overall positioning
  const avgDelta =
    categoryComparisons.reduce((sum, c) => sum + c.delta, 0) /
    categoryComparisons.length;

  return {
    companyGlobalScore: Math.round(companyGlobal),
    sectorAvgGlobalScore: Math.round(sectorAvgGlobal),
    sectorTopQuartileGlobalScore: Math.round(sectorTopGlobal),
    categories: categoryComparisons,
    revPerEmployee: {
      company: Math.round(companyRevPerEmp),
      sectorAvg: benchmarks.avgRevPerEmployee,
      percentile: revPercentile,
    },
    positioning: deltaToPositioning(avgDelta),
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Determines the positioning label based on company score vs sector benchmarks.
 * Lower waste scores are better.
 */
function getPositioning(
  companyScore: number,
  sectorAvg: number,
  sectorTopQuartile: number
): PositioningLabel {
  if (companyScore <= sectorTopQuartile) return "excellent";
  if (companyScore <= sectorAvg - 1) return "above_average";
  if (companyScore <= sectorAvg + 1) return "average";
  if (companyScore <= sectorAvg + 3) return "below_average";
  return "critical";
}

/**
 * Converts an average delta into a positioning label.
 */
function deltaToPositioning(avgDelta: number): PositioningLabel {
  if (avgDelta >= 2) return "excellent";
  if (avgDelta >= 0.5) return "above_average";
  if (avgDelta >= -0.5) return "average";
  if (avgDelta >= -2) return "below_average";
  return "critical";
}

/**
 * Determines a revenue-per-employee percentile label.
 */
function getRevenuePercentile(
  companyRevPerEmp: number,
  sectorAvg: number
): PercentileLabel {
  if (sectorAvg <= 0) return "median";

  const ratio = companyRevPerEmp / sectorAvg;
  if (ratio >= 1.5) return "top_10";
  if (ratio >= 1.2) return "top_25";
  if (ratio >= 0.8) return "median";
  if (ratio >= 0.5) return "bottom_25";
  return "bottom_10";
}

/**
 * Computes a fallback benchmark by averaging all known sectors.
 */
function computeDefaultBenchmarks(sector: string): SectorBenchmarks {
  const categories: WasteCategory[] = [
    "overproduction",
    "waiting",
    "transport",
    "overprocessing",
    "inventory",
    "motion",
    "defects",
    "skills",
  ];

  // Only use sector-level entries (subsector === null) to avoid double-counting
  const sectorLevel = BENCHMARKS.filter((b) => b.subsector === null);
  const count = sectorLevel.length;

  const avgScores = {} as WasteScores;
  const topScores = {} as WasteScores;

  for (const cat of categories) {
    avgScores[cat] =
      Math.round(
        (sectorLevel.reduce((s, b) => s + b.avgWasteScores[cat], 0) / count) *
          10
      ) / 10;
    topScores[cat] =
      Math.round(
        (sectorLevel.reduce((s, b) => s + b.topQuartileScores[cat], 0) /
          count) *
          10
      ) / 10;
  }

  const avgRev =
    Math.round(
      sectorLevel.reduce((s, b) => s + b.avgRevPerEmployee, 0) / count
    );
  const avgMargin =
    Math.round(
      (sectorLevel.reduce((s, b) => s + b.avgMargin, 0) / count) * 100
    ) / 100;

  return {
    sector,
    subsector: null,
    avgWasteScores: avgScores,
    topQuartileScores: topScores,
    avgRevPerEmployee: avgRev,
    avgMargin,
    sampleSize: 0, // synthetic benchmark
  };
}
