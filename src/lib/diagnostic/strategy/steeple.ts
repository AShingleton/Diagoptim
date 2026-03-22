/**
 * STEEPLE Analysis Engine
 *
 * Analyses the macro-environment across seven factors:
 * Social, Technological, Economic, Environmental, Political, Legal, Ethical.
 */

import type { DiagnosticAnswer } from '@/types/diagnostic';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SteepleFactor =
  | 'social'
  | 'technological'
  | 'economic'
  | 'environmental'
  | 'political'
  | 'legal'
  | 'ethical';

export type ImpactLevel = 'positive' | 'neutral' | 'negative';

export interface FactorAssessment {
  factor: SteepleFactor;
  label: string;
  /** Score from 1 (very unfavourable) to 5 (very favourable) */
  score: number;
  impact: ImpactLevel;
  description: string;
  keyFindings: string[];
  /** How much this factor affects the business (1 = marginal, 5 = critical) */
  relevance: number;
}

export interface Trend {
  id: string;
  factor: SteepleFactor;
  description: string;
  /** Expected direction: improving, stable, or worsening */
  direction: 'improving' | 'stable' | 'worsening';
  /** Time horizon in months */
  timeHorizon: number;
  /** Potential impact on the business (1-5) */
  impact: number;
  actionRequired: boolean;
}

export interface SteepleResult {
  assessments: FactorAssessment[];
  /** Overall macro-environment score (1-5) */
  overallScore: number;
  overallDescription: string;
  trends: Trend[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FACTOR_LABELS: Record<SteepleFactor, string> = {
  social: 'Social',
  technological: 'Technologique',
  economic: 'Économique',
  environmental: 'Environnemental',
  political: 'Politique',
  legal: 'Légal',
  ethical: 'Éthique',
};

const ALL_FACTORS: SteepleFactor[] = [
  'social',
  'technological',
  'economic',
  'environmental',
  'political',
  'legal',
  'ethical',
];

interface FactorQuestionMapping {
  questionId: string;
  factor: SteepleFactor;
  interpret: (value: unknown) => number; // returns 1-5
}

function numericToFive(value: unknown): number {
  if (typeof value === 'number') return Math.max(1, Math.min(5, Math.round(value / 20)));
  return 3;
}

function invertedToFive(value: unknown): number {
  if (typeof value === 'number') return Math.max(1, Math.min(5, Math.round((100 - value) / 20)));
  return 3;
}

function yesNoFavourable(value: unknown): number {
  if (value === 'yes' || value === true) return 4;
  if (value === 'no' || value === false) return 2;
  return 3;
}

const QUESTION_MAPPINGS: FactorQuestionMapping[] = [
  // Social
  { questionId: 'strategic-workforce-availability', factor: 'social', interpret: numericToFive },
  { questionId: 'strategic-demographics', factor: 'social', interpret: numericToFive },
  { questionId: 'strategic-employee-satisfaction', factor: 'social', interpret: numericToFive },

  // Technological
  { questionId: 'strategic-digital-maturity', factor: 'technological', interpret: numericToFive },
  { questionId: 'strategic-innovation', factor: 'technological', interpret: numericToFive },
  { questionId: 'strategic-tech-adoption', factor: 'technological', interpret: numericToFive },

  // Economic
  { questionId: 'strategic-market-growth', factor: 'economic', interpret: numericToFive },
  { questionId: 'strategic-economic-stability', factor: 'economic', interpret: numericToFive },
  { questionId: 'strategic-inflation-impact', factor: 'economic', interpret: invertedToFive },

  // Environmental
  { questionId: 'strategic-environmental-compliance', factor: 'environmental', interpret: numericToFive },
  { questionId: 'strategic-sustainability', factor: 'environmental', interpret: numericToFive },
  { questionId: 'strategic-carbon-footprint', factor: 'environmental', interpret: invertedToFive },

  // Political
  { questionId: 'strategic-political-stability', factor: 'political', interpret: numericToFive },
  { questionId: 'strategic-government-support', factor: 'political', interpret: yesNoFavourable },
  { questionId: 'strategic-trade-policy', factor: 'political', interpret: numericToFive },

  // Legal
  { questionId: 'strategic-regulatory', factor: 'legal', interpret: invertedToFive },
  { questionId: 'strategic-compliance-cost', factor: 'legal', interpret: invertedToFive },
  { questionId: 'strategic-ip-protection', factor: 'legal', interpret: numericToFive },

  // Ethical
  { questionId: 'strategic-csr-maturity', factor: 'ethical', interpret: numericToFive },
  { questionId: 'strategic-supply-chain-ethics', factor: 'ethical', interpret: numericToFive },
  { questionId: 'strategic-transparency', factor: 'ethical', interpret: numericToFive },
];

// ---------------------------------------------------------------------------
// Sector & location default profiles
// ---------------------------------------------------------------------------

interface SectorProfile {
  factorDefaults: Partial<Record<SteepleFactor, number>>;
  factorRelevance: Partial<Record<SteepleFactor, number>>;
}

const SECTOR_PROFILES: Record<string, SectorProfile> = {
  manufacturing: {
    factorDefaults: { environmental: 3, legal: 3, technological: 3 },
    factorRelevance: { environmental: 5, technological: 4, social: 3, legal: 4 },
  },
  technology: {
    factorDefaults: { technological: 4, ethical: 3, legal: 3 },
    factorRelevance: { technological: 5, legal: 4, ethical: 4, social: 3 },
  },
  retail: {
    factorDefaults: { social: 3, economic: 3 },
    factorRelevance: { social: 5, economic: 5, environmental: 3, ethical: 3 },
  },
  services: {
    factorDefaults: { social: 3, legal: 3 },
    factorRelevance: { social: 4, legal: 3, ethical: 3, technological: 3 },
  },
  construction: {
    factorDefaults: { environmental: 2, political: 3, legal: 3 },
    factorRelevance: { environmental: 5, political: 4, legal: 5, social: 3 },
  },
  food: {
    factorDefaults: { environmental: 3, ethical: 3, legal: 3 },
    factorRelevance: { legal: 5, environmental: 4, ethical: 4, social: 4 },
  },
};

const LOCATION_ADJUSTMENTS: Record<string, Partial<Record<SteepleFactor, number>>> = {
  france: { political: 4, legal: 3, social: 3, environmental: 3 },
  germany: { political: 4, legal: 3, technological: 4, environmental: 3 },
  usa: { political: 3, economic: 4, legal: 3 },
  uk: { political: 3, legal: 3, economic: 3 },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function findAnswer(answers: DiagnosticAnswer[], questionId: string): unknown | undefined {
  return answers.find((a) => a.questionId === questionId)?.value;
}

function impactFromScore(score: number): ImpactLevel {
  if (score >= 3.5) return 'positive';
  if (score >= 2.5) return 'neutral';
  return 'negative';
}

// ---------------------------------------------------------------------------
// Factor descriptions
// ---------------------------------------------------------------------------

function buildDescription(factor: SteepleFactor, score: number, sector: string): string {
  const scoreLabel = score >= 4 ? 'favorable' : score >= 3 ? 'modéré' : score >= 2 ? 'défavorable' : 'très défavorable';

  const descriptions: Record<SteepleFactor, string> = {
    social: `L'environnement social est ${scoreLabel} pour le secteur ${sector}. Inclut la disponibilité de main-d'œuvre, l'évolution démographique et les attentes sociétales.`,
    technological: `Le contexte technologique est ${scoreLabel}. Évalue la maturité digitale, la capacité d'innovation et l'adoption technologique dans le secteur ${sector}.`,
    economic: `Les conditions économiques sont ${scoreLabel}. Prend en compte la croissance du marché, la stabilité économique et l'impact de l'inflation.`,
    environmental: `Le cadre environnemental est ${scoreLabel} pour le secteur ${sector}. Concerne la conformité, la durabilité et l'empreinte carbone.`,
    political: `L'environnement politique est ${scoreLabel}. Évalue la stabilité politique, les soutiens gouvernementaux et les politiques commerciales.`,
    legal: `Le contexte légal est ${scoreLabel} pour le secteur ${sector}. Inclut la pression réglementaire, les coûts de conformité et la protection de la propriété intellectuelle.`,
    ethical: `La dimension éthique est ${scoreLabel}. Évalue la maturité RSE, l'éthique de la chaîne d'approvisionnement et la transparence.`,
  };

  return descriptions[factor];
}

function buildKeyFindings(factor: SteepleFactor, score: number): string[] {
  const findings: string[] = [];

  if (score >= 4) {
    const positiveFindings: Record<SteepleFactor, string[]> = {
      social: ['Bonne disponibilité de compétences sur le marché', 'Climat social favorable'],
      technological: ['Maturité digitale élevée', 'Capacité d\'innovation au-dessus de la moyenne'],
      economic: ['Marché en croissance', 'Conditions économiques stables'],
      environmental: ['Bonne conformité environnementale', 'Démarche développement durable engagée'],
      political: ['Cadre politique stable et prévisible', 'Possibilité de soutiens publics'],
      legal: ['Cadre réglementaire maîtrisé', 'Bonne protection juridique'],
      ethical: ['Engagement RSE reconnu', 'Chaîne d\'approvisionnement éthique'],
    };
    findings.push(...positiveFindings[factor]);
  } else if (score <= 2) {
    const negativeFindings: Record<SteepleFactor, string[]> = {
      social: ['Difficultés de recrutement', 'Tensions sociales possibles'],
      technological: ['Retard technologique identifié', 'Faible capacité d\'innovation'],
      economic: ['Pressions économiques significatives', 'Impact inflationniste notable'],
      environmental: ['Risques de non-conformité environnementale', 'Empreinte carbone élevée'],
      political: ['Incertitude politique affectant l\'activité', 'Risque de changements réglementaires'],
      legal: ['Pression réglementaire forte', 'Coûts de conformité élevés'],
      ethical: ['Démarche RSE insuffisante', 'Risques éthiques dans la chaîne de valeur'],
    };
    findings.push(...negativeFindings[factor]);
  } else {
    findings.push(`Situation ${FACTOR_LABELS[factor].toLowerCase()} stable, à surveiller.`);
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Factor assessment
// ---------------------------------------------------------------------------

/**
 * Assess a single STEEPLE factor based on diagnostic answers.
 *
 * @param factor - The STEEPLE factor to assess
 * @param answers - All diagnostic answers
 * @returns Assessment of the factor
 */
export function assessFactor(factor: SteepleFactor, answers: DiagnosticAnswer[]): FactorAssessment {
  const mappings = QUESTION_MAPPINGS.filter((m) => m.factor === factor);

  let total = 0;
  let count = 0;

  for (const mapping of mappings) {
    const raw = findAnswer(answers, mapping.questionId);
    if (raw !== undefined) {
      total += mapping.interpret(raw);
      count += 1;
    }
  }

  const score = count > 0 ? Math.round((total / count) * 10) / 10 : 3;

  return {
    factor,
    label: FACTOR_LABELS[factor],
    score: clamp(score, 1, 5),
    impact: impactFromScore(score),
    description: '',  // filled in by analyzeSteeple with sector context
    keyFindings: buildKeyFindings(factor, score),
    relevance: 3, // default, overridden by sector profile
  };
}

// ---------------------------------------------------------------------------
// Trend identification
// ---------------------------------------------------------------------------

let _trendId = 0;

/**
 * Identify key macro-environmental trends from the STEEPLE assessment.
 *
 * @param result - The STEEPLE result containing all factor assessments
 * @returns Array of identified trends
 */
export function identifyKeyTrends(result: SteepleResult): Trend[] {
  _trendId = 0;
  const trends: Trend[] = [];

  for (const assessment of result.assessments) {
    // Generate trends for factors with notable scores
    if (assessment.score <= 2 && assessment.relevance >= 4) {
      _trendId++;
      trends.push({
        id: `trend-${_trendId}`,
        factor: assessment.factor,
        description: `Dégradation du contexte ${assessment.label.toLowerCase()} nécessitant une action corrective`,
        direction: 'worsening',
        timeHorizon: 12,
        impact: assessment.relevance,
        actionRequired: true,
      });
    }

    if (assessment.score >= 4 && assessment.relevance >= 3) {
      _trendId++;
      trends.push({
        id: `trend-${_trendId}`,
        factor: assessment.factor,
        description: `Contexte ${assessment.label.toLowerCase()} favorable à exploiter`,
        direction: 'improving',
        timeHorizon: 24,
        impact: assessment.relevance,
        actionRequired: false,
      });
    }
  }

  // Always flag ongoing digital transformation trend
  const techAssessment = result.assessments.find((a) => a.factor === 'technological');
  if (techAssessment && techAssessment.score <= 3) {
    _trendId++;
    trends.push({
      id: `trend-${_trendId}`,
      factor: 'technological',
      description: 'Accélération de la transformation digitale dans le secteur',
      direction: 'improving',
      timeHorizon: 18,
      impact: 4,
      actionRequired: true,
    });
  }

  // Environmental trend (EU Green Deal, regulatory pressure)
  const envAssessment = result.assessments.find((a) => a.factor === 'environmental');
  if (envAssessment && envAssessment.relevance >= 3) {
    _trendId++;
    trends.push({
      id: `trend-${_trendId}`,
      factor: 'environmental',
      description: 'Renforcement des exigences environnementales et réglementaires (taxonomie EU, CSRD)',
      direction: 'worsening',
      timeHorizon: 24,
      impact: 4,
      actionRequired: true,
    });
  }

  // Sort by impact descending
  trends.sort((a, b) => b.impact - a.impact);

  return trends;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Run a full STEEPLE macro-environment analysis.
 *
 * @param answers - All diagnostic answers
 * @param sector - The company sector
 * @param location - The company location / country
 * @returns Complete STEEPLE analysis result
 */
export function analyzeSteeple(
  answers: DiagnosticAnswer[],
  sector: string,
  location: string,
): SteepleResult {
  const sectorKey = sector.toLowerCase();
  const locationKey = location.toLowerCase().split(',')[0].trim();

  const sectorProfile = SECTOR_PROFILES[sectorKey];
  const locationAdj = LOCATION_ADJUSTMENTS[locationKey] ?? {};

  const assessments: FactorAssessment[] = ALL_FACTORS.map((factor) => {
    const assessment = assessFactor(factor, answers);

    // Apply sector defaults if no answers contributed
    const mappings = QUESTION_MAPPINGS.filter((m) => m.factor === factor);
    const hasAnswers = mappings.some((m) => answers.some((a) => a.questionId === m.questionId));

    if (!hasAnswers) {
      const sectorDefault = sectorProfile?.factorDefaults[factor];
      const locDefault = locationAdj[factor];
      if (sectorDefault !== undefined && locDefault !== undefined) {
        assessment.score = clamp(Math.round(((sectorDefault + locDefault) / 2) * 10) / 10, 1, 5);
      } else if (sectorDefault !== undefined) {
        assessment.score = sectorDefault;
      } else if (locDefault !== undefined) {
        assessment.score = locDefault;
      }
      assessment.impact = impactFromScore(assessment.score);
    }

    // Apply sector relevance
    if (sectorProfile?.factorRelevance[factor] !== undefined) {
      assessment.relevance = sectorProfile.factorRelevance[factor]!;
    }

    // Build description with sector context
    assessment.description = buildDescription(factor, assessment.score, sector);

    return assessment;
  });

  const overallScore =
    Math.round(
      (assessments.reduce((sum, a) => sum + a.score * a.relevance, 0) /
        assessments.reduce((sum, a) => sum + a.relevance, 0)) *
        10,
    ) / 10;

  let overallDescription: string;
  if (overallScore >= 3.5) {
    overallDescription =
      'L\'environnement macro-économique est globalement favorable. Les conditions sont propices au développement.';
  } else if (overallScore >= 2.5) {
    overallDescription =
      'L\'environnement macro-économique est mitigé. Certains facteurs nécessitent une attention particulière.';
  } else {
    overallDescription =
      'L\'environnement macro-économique est défavorable. Des actions d\'adaptation sont nécessaires.';
  }

  const result: SteepleResult = {
    assessments,
    overallScore: clamp(overallScore, 1, 5),
    overallDescription,
    trends: [], // filled below
    generatedAt: new Date().toISOString(),
  };

  result.trends = identifyKeyTrends(result);

  return result;
}
