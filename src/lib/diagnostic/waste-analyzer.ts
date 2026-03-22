// ============================================================================
// DiagOptim - 8 Wastes Analyzer (TIMWOODS)
// Analyzes Lean waste scores from diagnostic answers
// ============================================================================

import type { WasteCategoryId } from './decision-tree';

// ============================================================================
// TYPES
// ============================================================================

/** Raw answer from the diagnostic */
export interface DiagnosticAnswerInput {
  questionKey: string;
  answer: unknown;
  score: number | null;
  category: string;
}

/** Score for a single waste category (0-100) */
export interface WasteScore {
  category: WasteCategoryId;
  score: number;
  /** Number of questions answered for this category */
  answeredCount: number;
  /** Number of total applicable questions for this category */
  totalCount: number;
  /** Confidence level based on how many questions were answered (0-1) */
  confidence: number;
}

/** Complete waste scores for all 8 categories */
export type WasteScores = Record<WasteCategoryId, WasteScore>;

/** Financial and operational impact estimate for a waste */
export interface ImpactEstimate {
  /** Estimated annual financial loss in EUR */
  annualLossEstimate: number;
  /** Low end of the estimate range */
  annualLossLow: number;
  /** High end of the estimate range */
  annualLossHigh: number;
  /** Estimated hours lost per month */
  hoursLostPerMonth: number;
  /** Impact as percentage of revenue */
  revenueImpactPercent: number;
  /** Human-readable description (French) */
  descriptionFr: string;
  /** Human-readable description (English) */
  descriptionEn: string;
}

/** Full result of a waste analysis */
export interface WasteAnalysisResult {
  /** Scores for all 8 waste categories */
  scores: WasteScores;
  /** Overall diagnostic score (0-100, lower = better) */
  globalScore: number;
  /** Top wastes ordered by severity (worst first) */
  topWastes: WasteCategoryId[];
  /** Impact estimates for top wastes */
  impacts: Map<WasteCategoryId, ImpactEstimate>;
  /** Date of analysis */
  analyzedAt: Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** All waste category identifiers in TIMWOODS order */
const ALL_WASTE_CATEGORIES: WasteCategoryId[] = [
  'transport', 'inventory', 'motion', 'waiting',
  'overproduction', 'overprocessing', 'defects', 'skills',
];

/** Human-readable labels */
const WASTE_LABELS: Record<WasteCategoryId, { fr: string; en: string }> = {
  transport: { fr: 'Transport', en: 'Transport' },
  inventory: { fr: 'Stocks excessifs', en: 'Excess Inventory' },
  motion: { fr: 'Mouvements inutiles', en: 'Unnecessary Motion' },
  waiting: { fr: 'Attentes', en: 'Waiting' },
  overproduction: { fr: 'Surproduction', en: 'Overproduction' },
  overprocessing: { fr: 'Sur-traitement', en: 'Overprocessing' },
  defects: { fr: 'Defauts / Retouches', en: 'Defects / Rework' },
  skills: { fr: 'Competences sous-utilisees', en: 'Underutilized Skills' },
};

/**
 * Sector-specific impact multipliers.
 * Higher multiplier = this waste type matters more in this sector.
 */
const SECTOR_IMPACT_MULTIPLIERS: Record<string, Partial<Record<WasteCategoryId, number>>> = {
  manufacturing: { transport: 1.3, inventory: 1.5, defects: 1.4, overproduction: 1.3 },
  metalwork: { transport: 1.2, inventory: 1.4, defects: 1.5, motion: 1.3 },
  food_processing: { inventory: 1.6, defects: 1.5, waiting: 1.2, overproduction: 1.4 },
  construction: { transport: 1.5, waiting: 1.4, defects: 1.3, motion: 1.2 },
  services: { waiting: 1.4, overprocessing: 1.3, skills: 1.5, motion: 1.2 },
  consulting: { overprocessing: 1.5, skills: 1.4, waiting: 1.3 },
  it: { overprocessing: 1.3, defects: 1.4, skills: 1.5, waiting: 1.3 },
  retail: { inventory: 1.5, transport: 1.3, overproduction: 1.4, waiting: 1.2 },
  logistics: { transport: 1.6, waiting: 1.4, inventory: 1.3, motion: 1.2 },
  health: { waiting: 1.5, defects: 1.4, overprocessing: 1.3, skills: 1.3 },
};

/**
 * Base impact coefficients: estimated annual cost as proportion of revenue
 * per waste point (score on 0-100 scale). These are industry averages.
 */
const BASE_IMPACT_COEFFICIENTS: Record<WasteCategoryId, number> = {
  transport: 0.00015,
  inventory: 0.00020,
  motion: 0.00010,
  waiting: 0.00025,
  overproduction: 0.00020,
  overprocessing: 0.00015,
  defects: 0.00030,
  skills: 0.00012,
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Analyzes waste scores from diagnostic answers.
 *
 * @param answers - All diagnostic answers with their scores
 * @param sector - Company sector for sector-specific adjustments
 * @param annualRevenue - Annual revenue for impact estimation
 * @param employeeCount - Employee count for hours estimation
 * @returns Complete waste analysis result
 */
export function analyzeWastes(
  answers: DiagnosticAnswerInput[],
  sector: string,
  annualRevenue: number = 0,
  employeeCount: number = 1,
): WasteAnalysisResult {
  const scores = calculateWasteScores(answers, sector);
  const topWastes = identifyTopWastes(scores, ALL_WASTE_CATEGORIES.length);
  const impacts = new Map<WasteCategoryId, ImpactEstimate>();

  for (const category of topWastes) {
    impacts.set(
      category,
      estimateWasteImpact(category, scores[category].score, annualRevenue, employeeCount, sector),
    );
  }

  // Global score: weighted average of all waste scores
  let totalWeight = 0;
  let weightedSum = 0;
  for (const cat of ALL_WASTE_CATEGORIES) {
    const w = scores[cat].confidence;
    weightedSum += scores[cat].score * w;
    totalWeight += w;
  }
  const globalScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  return {
    scores,
    globalScore,
    topWastes,
    impacts,
    analyzedAt: new Date(),
  };
}

/**
 * Calculates waste scores from raw answers.
 */
function calculateWasteScores(
  answers: DiagnosticAnswerInput[],
  sector: string,
): WasteScores {
  const scores = {} as WasteScores;

  for (const cat of ALL_WASTE_CATEGORIES) {
    const catAnswers = answers.filter((a) => a.category === cat && a.score !== null);
    const totalApplicable = answers.filter((a) => a.category === cat).length;

    if (catAnswers.length === 0) {
      scores[cat] = {
        category: cat,
        score: 0,
        answeredCount: 0,
        totalCount: totalApplicable,
        confidence: 0,
      };
      continue;
    }

    // Compute weighted average score (answers score on 1-10 scale -> convert to 0-100)
    const rawAvg =
      catAnswers.reduce((sum, a) => sum + (a.score ?? 0), 0) / catAnswers.length;
    let normalizedScore = Math.round((rawAvg / 10) * 100);

    // Apply sector multiplier
    const multiplier = SECTOR_IMPACT_MULTIPLIERS[sector]?.[cat] ?? 1.0;
    normalizedScore = Math.min(100, Math.round(normalizedScore * multiplier));

    const confidence = Math.min(1, catAnswers.length / Math.max(totalApplicable, 1));

    scores[cat] = {
      category: cat,
      score: normalizedScore,
      answeredCount: catAnswers.length,
      totalCount: totalApplicable,
      confidence,
    };
  }

  return scores;
}

/**
 * Returns waste categories sorted by severity (worst first).
 *
 * @param scores - The waste scores record
 * @param count - Number of top wastes to return
 * @returns Ordered array of waste category IDs
 */
export function identifyTopWastes(
  scores: WasteScores,
  count: number = 3,
): WasteCategoryId[] {
  return ALL_WASTE_CATEGORIES
    .filter((cat) => scores[cat].confidence > 0)
    .sort((a, b) => scores[b].score - scores[a].score)
    .slice(0, count);
}

/**
 * Generates a human-readable description of a waste score.
 *
 * @param category - Waste category
 * @param score - Normalized score (0-100)
 * @param sector - Company sector
 * @returns Descriptions in French and English
 */
export function generateWasteDescription(
  category: WasteCategoryId,
  score: number,
  sector: string,
): { fr: string; en: string } {
  const label = WASTE_LABELS[category];
  const severity = getSeverityLevel(score);

  const sectorContext = getSectorContext(category, sector);

  const descFr = buildDescriptionFr(label.fr, score, severity, sectorContext);
  const descEn = buildDescriptionEn(label.en, score, severity, sectorContext);

  return { fr: descFr, en: descEn };
}

/**
 * Estimates the financial and operational impact of a waste.
 *
 * @param category - Waste category
 * @param score - Normalized score (0-100)
 * @param revenue - Annual revenue in EUR
 * @param employees - Number of employees
 * @param sector - Company sector
 * @returns Impact estimate
 */
export function estimateWasteImpact(
  category: WasteCategoryId,
  score: number,
  revenue: number,
  employees: number,
  sector: string = 'other',
): ImpactEstimate {
  const baseCoeff = BASE_IMPACT_COEFFICIENTS[category];
  const sectorMultiplier = SECTOR_IMPACT_MULTIPLIERS[sector]?.[category] ?? 1.0;

  const annualLossEstimate = Math.round(revenue * baseCoeff * score * sectorMultiplier);
  const annualLossLow = Math.round(annualLossEstimate * 0.6);
  const annualLossHigh = Math.round(annualLossEstimate * 1.5);

  // Estimate hours lost: assume 1,600 productive hours per employee per year
  const totalHoursYear = employees * 1600;
  const hoursLostYear = Math.round(totalHoursYear * baseCoeff * score * sectorMultiplier * 0.5);
  const hoursLostPerMonth = Math.round(hoursLostYear / 12);

  const revenueImpactPercent = revenue > 0
    ? Math.round((annualLossEstimate / revenue) * 10000) / 100
    : 0;

  const label = WASTE_LABELS[category];
  const descriptionFr = `Le gaspillage "${label.fr}" represente une perte estimee entre ${formatEur(annualLossLow)} et ${formatEur(annualLossHigh)} par an, soit environ ${revenueImpactPercent}% de votre CA.`;
  const descriptionEn = `The "${label.en}" waste represents an estimated loss between ${formatEur(annualLossLow)} and ${formatEur(annualLossHigh)} per year, approximately ${revenueImpactPercent}% of your revenue.`;

  return {
    annualLossEstimate,
    annualLossLow,
    annualLossHigh,
    hoursLostPerMonth,
    revenueImpactPercent,
    descriptionFr,
    descriptionEn,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

type SeverityLevel = 'low' | 'moderate' | 'high' | 'critical';

function getSeverityLevel(score: number): SeverityLevel {
  if (score <= 25) return 'low';
  if (score <= 50) return 'moderate';
  if (score <= 75) return 'high';
  return 'critical';
}

function getSectorContext(category: WasteCategoryId, sector: string): string {
  const contexts: Record<string, Partial<Record<WasteCategoryId, string>>> = {
    manufacturing: {
      transport: 'flux de materiaux entre postes',
      inventory: 'en-cours de production et stocks de matieres',
      defects: 'taux de rebut et retouches',
    },
    services: {
      waiting: 'delais de traitement des demandes clients',
      overprocessing: 'livrables sur-documentes',
      skills: 'polyvalence des equipes',
    },
    it: {
      defects: 'bugs et dette technique',
      overprocessing: 'fonctionnalites non utilisees',
      skills: 'adequation competences/missions',
    },
    metalwork: {
      transport: 'manipulation des pieces entre machines',
      defects: 'non-conformites soudure/usinage',
      inventory: 'chutes de matiere et stock de pieces',
    },
  };

  return contexts[sector]?.[category] ?? '';
}

function buildDescriptionFr(
  label: string,
  score: number,
  severity: SeverityLevel,
  sectorContext: string,
): string {
  const severityFr: Record<SeverityLevel, string> = {
    low: 'faible',
    moderate: 'modere',
    high: 'eleve',
    critical: 'critique',
  };

  let desc = `Niveau de gaspillage "${label}" : ${severityFr[severity]} (${score}/100).`;
  if (sectorContext) {
    desc += ` Dans votre secteur, cela concerne principalement : ${sectorContext}.`;
  }

  if (severity === 'critical') {
    desc += ' Action corrective prioritaire recommandee.';
  } else if (severity === 'high') {
    desc += ' Des ameliorations significatives sont possibles.';
  }

  return desc;
}

function buildDescriptionEn(
  label: string,
  score: number,
  severity: SeverityLevel,
  _sectorContext: string,
): string {
  const severityEn: Record<SeverityLevel, string> = {
    low: 'low',
    moderate: 'moderate',
    high: 'high',
    critical: 'critical',
  };

  let desc = `"${label}" waste level: ${severityEn[severity]} (${score}/100).`;

  if (severity === 'critical') {
    desc += ' Priority corrective action recommended.';
  } else if (severity === 'high') {
    desc += ' Significant improvements are possible.';
  }

  return desc;
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}
