// ---------------------------------------------------------------------------
// DiagOptim – Scoring Algorithms
// Lean Management / Six Sigma waste scoring and gain estimation
// ---------------------------------------------------------------------------

import type { CompanyProfile } from "@/types/company";
import type { DiagnosticAnswer, WasteCategory, WasteScores } from "@/types/diagnostic";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Weight multiplier for each waste category (sums to 1.0). */
export interface SectorWeights {
  overproduction: number;
  waiting: number;
  transport: number;
  overprocessing: number;
  inventory: number;
  motion: number;
  defects: number;
  skills: number;
}

/** Estimated financial gain for a single waste category. */
export interface GainEstimate {
  /** The waste category this gain relates to. */
  category: WasteCategory;
  /** Minimum estimated annual gain in EUR. */
  minGain: number;
  /** Maximum estimated annual gain in EUR. */
  maxGain: number;
  /** Confidence level of the estimate (0-1). */
  confidence: number;
  /** Human-readable description of the gain potential. */
  description: string;
}

// ---------------------------------------------------------------------------
// Default sector weights (sum = 1.0)
// ---------------------------------------------------------------------------

const DEFAULT_WEIGHTS: SectorWeights = {
  overproduction: 0.15,
  waiting: 0.15,
  transport: 0.10,
  overprocessing: 0.15,
  inventory: 0.10,
  motion: 0.10,
  defects: 0.15,
  skills: 0.10,
};

/**
 * Sector-specific weight overrides.
 * Only categories that differ from the default are listed.
 */
const SECTOR_WEIGHT_OVERRIDES: Record<string, Partial<SectorWeights>> = {
  services: {
    inventory: 0.05,
    skills: 0.15,
  },
  consulting: {
    inventory: 0.05,
    skills: 0.15,
  },
  manufacturing: {
    // Default weights are well-suited for manufacturing
  },
  construction: {
    transport: 0.15,
    motion: 0.15,
    skills: 0.05,
    inventory: 0.05,
  },
  retail: {
    inventory: 0.15,
    transport: 0.15,
    overprocessing: 0.10,
    skills: 0.05,
    motion: 0.05,
  },
  food: {
    overproduction: 0.20,
    inventory: 0.15,
    defects: 0.15,
    skills: 0.05,
    motion: 0.05,
    transport: 0.05,
  },
  restaurant: {
    overproduction: 0.20,
    waiting: 0.15,
    inventory: 0.15,
    defects: 0.10,
    skills: 0.05,
    transport: 0.05,
    motion: 0.05,
  },
  healthcare: {
    waiting: 0.20,
    defects: 0.20,
    overprocessing: 0.15,
    skills: 0.10,
    inventory: 0.05,
    transport: 0.05,
  },
};

// ---------------------------------------------------------------------------
// Gain estimation parameters by waste category
// ---------------------------------------------------------------------------

interface GainParameters {
  /** Percentage of revenue that this waste typically represents (min). */
  revenueShareMin: number;
  /** Percentage of revenue that this waste typically represents (max). */
  revenueShareMax: number;
  /** Typical reduction achievable with Lean improvements (0-1). */
  reductionRate: number;
  /** Description template (French). */
  descriptionFr: string;
}

const GAIN_PARAMS: Record<WasteCategory, GainParameters> = {
  overproduction: {
    revenueShareMin: 0.02,
    revenueShareMax: 0.08,
    reductionRate: 0.4,
    descriptionFr:
      "Reduction des productions inutiles, des rapports non lus et des taches sans valeur ajoutee.",
  },
  waiting: {
    revenueShareMin: 0.03,
    revenueShareMax: 0.10,
    reductionRate: 0.35,
    descriptionFr:
      "Reduction des temps d'attente : validations, approvisionnements, decisions, pannes.",
  },
  transport: {
    revenueShareMin: 0.01,
    revenueShareMax: 0.06,
    reductionRate: 0.3,
    descriptionFr:
      "Optimisation des deplacements de materiaux, documents et informations.",
  },
  overprocessing: {
    revenueShareMin: 0.02,
    revenueShareMax: 0.07,
    reductionRate: 0.35,
    descriptionFr:
      "Simplification des processus, elimination des controles et etapes redondants.",
  },
  inventory: {
    revenueShareMin: 0.01,
    revenueShareMax: 0.05,
    reductionRate: 0.3,
    descriptionFr:
      "Reduction des stocks excessifs et des en-cours : matieres, dossiers, projets empiles.",
  },
  motion: {
    revenueShareMin: 0.01,
    revenueShareMax: 0.04,
    reductionRate: 0.4,
    descriptionFr:
      "Amelioration de l'ergonomie, reduction des deplacements inutiles et des gestes repetitifs.",
  },
  defects: {
    revenueShareMin: 0.02,
    revenueShareMax: 0.08,
    reductionRate: 0.5,
    descriptionFr:
      "Reduction des erreurs, retouches, retours clients et non-conformites.",
  },
  skills: {
    revenueShareMin: 0.01,
    revenueShareMax: 0.05,
    reductionRate: 0.25,
    descriptionFr:
      "Meilleure utilisation des competences, formation, polyvalence et implication des equipes.",
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculates the waste score for a given category based on diagnostic answers.
 * Returns a score between 0 (no waste) and 10 (critical waste).
 *
 * The algorithm averages the normalised values of all answers belonging
 * to the given category. Numeric answers are mapped to the 0-10 range,
 * boolean "yes" counts as high waste (7), "no" as low waste (2),
 * and text answers are given a neutral 5.
 */
export function calculateWasteScore(
  category: WasteCategory,
  answers: DiagnosticAnswer[]
): number {
  const relevant = answers.filter((a) => a.questionId.includes(category));

  if (relevant.length === 0) return 0;

  let totalScore = 0;

  for (const answer of relevant) {
    totalScore += normalizeAnswer(answer.value);
  }

  const raw = totalScore / relevant.length;
  return Math.round(raw * 10) / 10; // one decimal place
}

/**
 * Calculates the global diagnostic score (0-100) from individual waste
 * scores and sector-specific weights.
 *
 * A score of 100 means zero waste detected (ideal state).
 * Formula: 100 - weighted sum of (wasteScore * weight * 10)
 */
export function calculateGlobalScore(
  wasteScores: WasteScores,
  weights: SectorWeights
): number {
  const categories = Object.keys(wasteScores) as WasteCategory[];

  let weightedSum = 0;
  for (const cat of categories) {
    weightedSum += wasteScores[cat] * weights[cat] * 10;
  }

  // Clamp to [0, 100]
  const score = Math.max(0, Math.min(100, 100 - weightedSum));
  return Math.round(score);
}

/**
 * Returns the weight distribution for a given sector.
 * Falls back to default weights if the sector is unknown.
 */
export function getSectorWeights(sector: string): SectorWeights {
  const key = sector.toLowerCase().trim();
  const overrides = SECTOR_WEIGHT_OVERRIDES[key];

  if (!overrides) return { ...DEFAULT_WEIGHTS };

  const merged: SectorWeights = { ...DEFAULT_WEIGHTS, ...overrides };

  // Re-normalize so weights sum to 1.0
  const sum = Object.values(merged).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1.0) > 0.001) {
    const categories = Object.keys(merged) as (keyof SectorWeights)[];
    for (const cat of categories) {
      merged[cat] = merged[cat] / sum;
    }
  }

  return merged;
}

/**
 * Estimates potential financial gains per waste category based on
 * waste scores, company revenue, and sector-specific parameters.
 *
 * Higher waste scores yield higher estimated gains (more room for improvement).
 */
export function estimateGains(
  wasteScores: WasteScores,
  companyProfile: CompanyProfile
): GainEstimate[] {
  const revenue = companyProfile.annualRevenue;
  if (revenue <= 0) return [];

  const categories = Object.keys(wasteScores) as WasteCategory[];
  const gains: GainEstimate[] = [];

  for (const cat of categories) {
    const score = wasteScores[cat];
    const params = GAIN_PARAMS[cat];

    // Scale the potential gain by the waste severity (score / 10)
    const severityFactor = score / 10;

    const wasteCostMin = revenue * params.revenueShareMin * severityFactor;
    const wasteCostMax = revenue * params.revenueShareMax * severityFactor;

    const minGain = Math.round(wasteCostMin * params.reductionRate);
    const maxGain = Math.round(wasteCostMax * params.reductionRate);

    // Confidence: higher with higher scores (more signal) and
    // lower for extreme scores (ceiling effect)
    const confidence =
      score <= 1
        ? 0.3
        : score <= 3
          ? 0.5
          : score <= 7
            ? 0.8
            : 0.7;

    gains.push({
      category: cat,
      minGain,
      maxGain,
      confidence,
      description: params.descriptionFr,
    });
  }

  // Sort by maxGain descending
  gains.sort((a, b) => b.maxGain - a.maxGain);

  return gains;
}

/**
 * Calculates a priority score for an action based on its impact and effort.
 * Higher priority = higher impact + lower effort.
 *
 * @param impact - Expected impact on a 0-10 scale.
 * @param effort - Required effort on a 0-10 scale.
 * @returns Priority score between 0 (lowest) and 100 (highest).
 */
export function calculatePriority(impact: number, effort: number): number {
  // Guard against division by zero; minimum effort is 0.5
  const safeEffort = Math.max(0.5, effort);
  const raw = (impact / safeEffort) * 10;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Normalizes a diagnostic answer value to a 0-10 scale.
 */
function normalizeAnswer(value: unknown): number {
  if (typeof value === "number") {
    // Assume already on 0-10 scale or clamp
    return Math.max(0, Math.min(10, value));
  }

  if (typeof value === "boolean") {
    // true = high waste, false = low waste
    return value ? 7 : 2;
  }

  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "yes" || lower === "oui") return 7;
    if (lower === "no" || lower === "non") return 2;
    if (lower === "maybe" || lower === "peut-etre" || lower === "parfois") return 5;
    // Free-text: neutral score
    return 5;
  }

  if (Array.isArray(value)) {
    // Multi-select: more selections = higher waste indicator
    return Math.min(10, value.length * 2);
  }

  return 5; // unknown type: neutral
}
