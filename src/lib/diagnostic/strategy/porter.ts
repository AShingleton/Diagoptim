/**
 * Porter's Five Forces Analysis Engine
 *
 * Evaluates the competitive landscape by scoring five structural forces
 * and deriving an overall competitive position assessment.
 */

import type { DiagnosticAnswer } from '@/types/diagnostic';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PorterForce =
  | 'supplierPower'
  | 'buyerPower'
  | 'newEntrants'
  | 'substitutes'
  | 'rivalry';

export interface ForceDetail {
  force: PorterForce;
  /** Score from 1 (low threat) to 5 (high threat) */
  score: number;
  label: string;
  description: string;
  drivers: string[];
}

export interface PorterScores {
  supplierPower: number;
  buyerPower: number;
  newEntrants: number;
  substitutes: number;
  rivalry: number;
}

export type CompetitivePositionLevel = 'strong' | 'moderate' | 'weak';

export interface CompetitivePosition {
  level: CompetitivePositionLevel;
  averageForceScore: number;
  summary: string;
  recommendations: string[];
}

export interface PorterResult {
  scores: PorterScores;
  forces: ForceDetail[];
  position: CompetitivePosition;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FORCE_LABELS: Record<PorterForce, string> = {
  supplierPower: 'Pouvoir de négociation des fournisseurs',
  buyerPower: 'Pouvoir de négociation des clients',
  newEntrants: 'Menace de nouveaux entrants',
  substitutes: 'Menace de produits de substitution',
  rivalry: 'Intensité de la concurrence',
};

/** Maps question IDs to the force they contribute to and their weight. */
interface ForceMapping {
  questionId: string;
  force: PorterForce;
  /** How the raw answer value is converted to a 1-5 contribution */
  interpret: (value: unknown) => number;
}

function numericScale(value: unknown): number {
  if (typeof value === 'number') return Math.round(clamp(value / 20, 1, 5));
  return 3; // neutral fallback
}

function invertedScale(value: unknown): number {
  if (typeof value === 'number') return Math.round(clamp((100 - value) / 20, 1, 5));
  return 3;
}

function yesNoScale(value: unknown): number {
  if (value === 'yes' || value === true) return 4;
  if (value === 'no' || value === false) return 2;
  return 3;
}

const FORCE_MAPPINGS: ForceMapping[] = [
  // Supplier power
  { questionId: 'strategic-supplier-concentration', force: 'supplierPower', interpret: numericScale },
  { questionId: 'strategic-supplier-switching', force: 'supplierPower', interpret: numericScale },
  { questionId: 'strategic-raw-material-scarcity', force: 'supplierPower', interpret: yesNoScale },

  // Buyer power
  { questionId: 'strategic-client-concentration', force: 'buyerPower', interpret: numericScale },
  { questionId: 'strategic-price-sensitivity', force: 'buyerPower', interpret: numericScale },
  { questionId: 'strategic-client-switching', force: 'buyerPower', interpret: invertedScale },

  // New entrants
  { questionId: 'strategic-entry-barriers', force: 'newEntrants', interpret: invertedScale },
  { questionId: 'strategic-capital-requirements', force: 'newEntrants', interpret: invertedScale },
  { questionId: 'strategic-brand-loyalty', force: 'newEntrants', interpret: invertedScale },

  // Substitutes
  { questionId: 'strategic-substitute-availability', force: 'substitutes', interpret: numericScale },
  { questionId: 'strategic-substitute-performance', force: 'substitutes', interpret: numericScale },

  // Rivalry
  { questionId: 'strategic-competitor-count', force: 'rivalry', interpret: numericScale },
  { questionId: 'strategic-market-growth', force: 'rivalry', interpret: invertedScale },
  { questionId: 'strategic-differentiation', force: 'rivalry', interpret: invertedScale },
];

// Sector-based default adjustments (partial overrides when no answer exists)
const SECTOR_DEFAULTS: Record<string, Partial<PorterScores>> = {
  manufacturing: { supplierPower: 3, newEntrants: 2, rivalry: 4 },
  retail: { buyerPower: 4, substitutes: 4, rivalry: 5 },
  technology: { newEntrants: 4, substitutes: 3, rivalry: 4 },
  services: { buyerPower: 3, newEntrants: 4, rivalry: 3 },
  construction: { supplierPower: 4, newEntrants: 2, rivalry: 3 },
  food: { buyerPower: 4, substitutes: 4, rivalry: 4 },
  healthcare: { supplierPower: 3, newEntrants: 1, rivalry: 2 },
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

// ---------------------------------------------------------------------------
// Force score calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the score (1-5) for a given Porter force based on answers.
 *
 * @param force - The Porter force to evaluate
 * @param answers - Diagnostic answers
 * @returns Score from 1 (low threat) to 5 (high threat)
 */
export function calculateForceScore(force: PorterForce, answers: DiagnosticAnswer[]): number {
  const relevantMappings = FORCE_MAPPINGS.filter((m) => m.force === force);

  if (relevantMappings.length === 0) return 3;

  let total = 0;
  let count = 0;

  for (const mapping of relevantMappings) {
    const raw = findAnswer(answers, mapping.questionId);
    if (raw !== undefined) {
      total += mapping.interpret(raw);
      count += 1;
    }
  }

  if (count === 0) return 3; // neutral when no data
  return Math.round(clamp(total / count, 1, 5));
}

// ---------------------------------------------------------------------------
// Force description
// ---------------------------------------------------------------------------

const FORCE_DESCRIPTIONS: Record<PorterForce, Record<number, string>> = {
  supplierPower: {
    1: 'Nombreuses alternatives fournisseurs, faible pouvoir de négociation.',
    2: 'Pouvoir fournisseur limité, quelques alternatives disponibles.',
    3: 'Pouvoir fournisseur modéré, dépendance partielle.',
    4: 'Fournisseurs concentrés avec un pouvoir de négociation significatif.',
    5: 'Très forte dépendance fournisseurs, peu d\'alternatives viables.',
  },
  buyerPower: {
    1: 'Clients très dispersés, faible pouvoir individuel.',
    2: 'Pouvoir client limité, bonne fidélisation.',
    3: 'Pouvoir client modéré, sensibilité prix moyenne.',
    4: 'Clients concentrés pouvant exercer une pression sur les prix.',
    5: 'Très forte concentration client, risque de dépendance majeur.',
  },
  newEntrants: {
    1: 'Barrières à l\'entrée très élevées, marché protégé.',
    2: 'Barrières significatives décourageant la plupart des entrants.',
    3: 'Barrières modérées, entrées possibles avec investissement.',
    4: 'Faibles barrières, nouveaux concurrents probables.',
    5: 'Marché très accessible, entrées fréquentes.',
  },
  substitutes: {
    1: 'Aucun substitut réel identifié.',
    2: 'Substituts existants mais de performance inférieure.',
    3: 'Substituts comparables disponibles dans certains segments.',
    4: 'Substituts performants et compétitifs en prix.',
    5: 'Nombreux substituts supérieurs menaçant le marché.',
  },
  rivalry: {
    1: 'Marché peu concurrentiel, croissance forte.',
    2: 'Concurrence modérée avec différenciation possible.',
    3: 'Concurrence active, parts de marché disputées.',
    4: 'Concurrence intense, pression sur les marges.',
    5: 'Guerre des prix, marché saturé et en déclin.',
  },
};

/**
 * Generate a human-readable description for a given force at a given score.
 *
 * @param force - The Porter force
 * @param score - The calculated score (1-5)
 * @param sector - The company sector for contextualisation
 * @returns A descriptive string for the force
 */
export function generateForceDescription(force: PorterForce, score: number, sector: string): string {
  const clamped = clamp(Math.round(score), 1, 5);
  const base = FORCE_DESCRIPTIONS[force][clamped];
  return `[${sector}] ${base}`;
}

// ---------------------------------------------------------------------------
// Force drivers
// ---------------------------------------------------------------------------

function getForceDrivers(force: PorterForce, score: number): string[] {
  const highDrivers: Record<PorterForce, string[]> = {
    supplierPower: [
      'Concentration élevée des fournisseurs',
      'Coûts de changement importants',
      'Matières premières rares ou spécialisées',
    ],
    buyerPower: [
      'Concentration de la base clients',
      'Forte sensibilité aux prix',
      'Faibles coûts de transfert pour les clients',
    ],
    newEntrants: [
      'Faibles barrières à l\'entrée',
      'Faible besoin en capital',
      'Absence de fidélisation forte à la marque',
    ],
    substitutes: [
      'Disponibilité de produits alternatifs',
      'Performance comparable ou supérieure des substituts',
      'Rapport qualité-prix attractif des substituts',
    ],
    rivalry: [
      'Grand nombre de concurrents directs',
      'Croissance du marché faible ou négative',
      'Faible différenciation entre les offres',
    ],
  };

  const lowDrivers: Record<PorterForce, string[]> = {
    supplierPower: [
      'Multiples sources d\'approvisionnement',
      'Faibles coûts de changement',
    ],
    buyerPower: [
      'Base clients diversifiée',
      'Forte valeur ajoutée perçue',
    ],
    newEntrants: [
      'Investissements requis élevés',
      'Réglementations strictes',
      'Forte fidélité à la marque',
    ],
    substitutes: [
      'Produit unique, pas de substitut direct',
      'Coûts de transfert élevés',
    ],
    rivalry: [
      'Marché en croissance',
      'Forte différenciation des offres',
    ],
  };

  return score >= 3 ? highDrivers[force] : lowDrivers[force];
}

// ---------------------------------------------------------------------------
// Competitive position assessment
// ---------------------------------------------------------------------------

/**
 * Assess the overall competitive position from the five force scores.
 *
 * @param forces - Scores for each of the five forces (1-5)
 * @returns A competitive position assessment with recommendations
 */
export function assessCompetitivePosition(forces: PorterScores): CompetitivePosition {
  const scores = Object.values(forces);
  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  let level: CompetitivePositionLevel;
  let summary: string;
  const recommendations: string[] = [];

  if (avg <= 2.2) {
    level = 'strong';
    summary =
      'Position concurrentielle forte. L\'environnement est favorable avec des pressions structurelles limitées.';
    recommendations.push('Consolider les avantages concurrentiels existants.');
    recommendations.push('Investir dans l\'innovation pour maintenir les barrières à l\'entrée.');
  } else if (avg <= 3.5) {
    level = 'moderate';
    summary =
      'Position concurrentielle modérée. Certaines forces exercent une pression notable.';

    if (forces.supplierPower >= 4) {
      recommendations.push('Diversifier les sources d\'approvisionnement pour réduire la dépendance.');
    }
    if (forces.buyerPower >= 4) {
      recommendations.push('Élargir la base clients et renforcer la différenciation.');
    }
    if (forces.rivalry >= 4) {
      recommendations.push('Renforcer la proposition de valeur unique pour se démarquer.');
    }
    if (forces.newEntrants >= 4) {
      recommendations.push('Créer des barrières à l\'entrée (brevets, exclusivités, fidélisation).');
    }
    if (forces.substitutes >= 4) {
      recommendations.push('Innover pour rendre les substituts moins attractifs.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Surveiller activement l\'évolution des forces concurrentielles.');
    }
  } else {
    level = 'weak';
    summary =
      'Position concurrentielle fragile. L\'environnement structurel est défavorable avec de fortes pressions.';
    recommendations.push('Repenser le modèle économique pour contourner les pressions concurrentielles.');
    recommendations.push('Envisager une spécialisation de niche pour réduire l\'exposition aux forces du marché.');
    recommendations.push('Évaluer les options de diversification ou de consolidation sectorielle.');
  }

  return { level, averageForceScore: Math.round(avg * 10) / 10, summary, recommendations };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Run a full Porter's Five Forces analysis.
 *
 * @param answers - All diagnostic answers
 * @param sector - The company sector / industry
 * @returns Complete Porter analysis result
 */
export function analyzePorterForces(answers: DiagnosticAnswer[], sector: string): PorterResult {
  const allForces: PorterForce[] = ['supplierPower', 'buyerPower', 'newEntrants', 'substitutes', 'rivalry'];

  // Start with sector defaults, then override with calculated scores
  const sectorKey = sector.toLowerCase();
  const defaults = SECTOR_DEFAULTS[sectorKey] ?? {};

  const scores: PorterScores = {
    supplierPower: 3,
    buyerPower: 3,
    newEntrants: 3,
    substitutes: 3,
    rivalry: 3,
    ...defaults,
  };

  // Calculate scores from answers (overrides defaults when answers exist)
  for (const force of allForces) {
    const relevantMappings = FORCE_MAPPINGS.filter((m) => m.force === force);
    const hasRelevantAnswers = relevantMappings.some((m) =>
      answers.some((a) => a.questionId === m.questionId),
    );

    if (hasRelevantAnswers) {
      scores[force] = calculateForceScore(force, answers);
    }
  }

  const forces: ForceDetail[] = allForces.map((force) => ({
    force,
    score: scores[force],
    label: FORCE_LABELS[force],
    description: generateForceDescription(force, scores[force], sector),
    drivers: getForceDrivers(force, scores[force]),
  }));

  const position = assessCompetitivePosition(scores);

  return {
    scores,
    forces,
    position,
    generatedAt: new Date().toISOString(),
  };
}
