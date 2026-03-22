/**
 * SWOT / TOWS Analysis Engine
 *
 * Generates a SWOT analysis from diagnostic answers and company profile,
 * then derives TOWS cross-matrix strategies and prioritises them.
 */

import type { DiagnosticAnswer, WasteScores, WasteCategory } from '@/types/diagnostic';
import type { CompanyProfile } from '@/types/company';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SwotItem {
  id: string;
  description: string;
  /** Impact score 1-5 */
  impact: number;
  /** Origin of the item (e.g. question id, waste category, profile field) */
  source: string;
}

export interface SwotData {
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
}

export interface Strategy {
  id: string;
  description: string;
  type: 'SO' | 'WO' | 'ST' | 'WT';
  /** Priority rank (lower is higher priority, starting at 1) */
  priority: number;
  /** Estimated impact 0-100 */
  estimatedImpact: number;
}

export interface TowsStrategies {
  /** Leverage strengths to exploit opportunities */
  SO: Strategy[];
  /** Overcome weaknesses by exploiting opportunities */
  WO: Strategy[];
  /** Use strengths to mitigate threats */
  ST: Strategy[];
  /** Minimise weaknesses and avoid threats */
  WT: Strategy[];
}

export interface SwotResult {
  swot: SwotData;
  tows: TowsStrategies;
  prioritisedStrategies: Strategy[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const WASTE_LABELS: Record<WasteCategory, string> = {
  overproduction: 'Surproduction',
  waiting: 'Attentes',
  transport: 'Transports inutiles',
  overprocessing: 'Sur-traitement',
  inventory: 'Stocks excessifs',
  motion: 'Mouvements inutiles',
  defects: 'Défauts / rebuts',
  skills: 'Sous-utilisation des compétences',
};

/** Threshold below which a waste score is considered a strength (low waste). */
const STRENGTH_THRESHOLD = 30;
/** Threshold above which a waste score is considered a weakness (high waste). */
const WEAKNESS_THRESHOLD = 60;

let _idCounter = 0;
function nextId(prefix: string): string {
  _idCounter += 1;
  return `${prefix}-${_idCounter}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function answerValue(answers: DiagnosticAnswer[], questionId: string): unknown | undefined {
  const a = answers.find((ans) => ans.questionId === questionId);
  return a?.value;
}

// ---------------------------------------------------------------------------
// SWOT generation
// ---------------------------------------------------------------------------

/**
 * Build strengths and weaknesses from waste scores.
 */
function deriveFromWastes(wasteScores: WasteScores): { strengths: SwotItem[]; weaknesses: SwotItem[] } {
  const strengths: SwotItem[] = [];
  const weaknesses: SwotItem[] = [];

  for (const [category, score] of Object.entries(wasteScores) as [WasteCategory, number][]) {
    if (score <= STRENGTH_THRESHOLD) {
      strengths.push({
        id: nextId('sw-s'),
        description: `Faible niveau de gaspillage en ${WASTE_LABELS[category]} (score ${score}/100)`,
        impact: clamp(Math.round((100 - score) / 20), 1, 5),
        source: `waste:${category}`,
      });
    } else if (score >= WEAKNESS_THRESHOLD) {
      weaknesses.push({
        id: nextId('sw-w'),
        description: `Niveau élevé de gaspillage en ${WASTE_LABELS[category]} (score ${score}/100)`,
        impact: clamp(Math.round(score / 20), 1, 5),
        source: `waste:${category}`,
      });
    }
  }

  return { strengths, weaknesses };
}

/**
 * Derive profile-based strengths / weaknesses / opportunities / threats.
 */
function deriveFromProfile(profile: CompanyProfile): Partial<SwotData> {
  const strengths: SwotItem[] = [];
  const weaknesses: SwotItem[] = [];
  const opportunities: SwotItem[] = [];
  const threats: SwotItem[] = [];

  // --- Revenue & size ---
  if (profile.annualRevenue > 5_000_000) {
    strengths.push({
      id: nextId('pr-s'),
      description: 'Chiffre d\'affaires significatif offrant une capacité d\'investissement',
      impact: 4,
      source: 'profile:annualRevenue',
    });
  } else if (profile.annualRevenue < 500_000) {
    weaknesses.push({
      id: nextId('pr-w'),
      description: 'Chiffre d\'affaires limité réduisant la marge de manœuvre financière',
      impact: 3,
      source: 'profile:annualRevenue',
    });
  }

  // --- Employee count ---
  if (profile.employeeCount >= 50) {
    strengths.push({
      id: nextId('pr-s'),
      description: 'Masse salariale permettant la spécialisation des fonctions',
      impact: 3,
      source: 'profile:employeeCount',
    });
    threats.push({
      id: nextId('pr-t'),
      description: 'Coûts fixes salariaux élevés en cas de baisse d\'activité',
      impact: 3,
      source: 'profile:employeeCount',
    });
  } else if (profile.employeeCount <= 5) {
    weaknesses.push({
      id: nextId('pr-w'),
      description: 'Effectif réduit limitant la polyvalence et la résilience',
      impact: 3,
      source: 'profile:employeeCount',
    });
    opportunities.push({
      id: nextId('pr-o'),
      description: 'Agilité organisationnelle facilitant les changements rapides',
      impact: 3,
      source: 'profile:employeeCount',
    });
  }

  // --- Competition ---
  if (profile.competitors.length >= 5) {
    threats.push({
      id: nextId('pr-t'),
      description: 'Forte concurrence sur le marché',
      impact: 4,
      source: 'profile:competitors',
    });
  } else if (profile.competitors.length <= 1) {
    opportunities.push({
      id: nextId('pr-o'),
      description: 'Faible pression concurrentielle, potentiel de croissance',
      impact: 4,
      source: 'profile:competitors',
    });
  }

  // --- Client concentration ---
  if (profile.clientCount >= 100) {
    strengths.push({
      id: nextId('pr-s'),
      description: 'Base client diversifiée réduisant le risque de dépendance',
      impact: 4,
      source: 'profile:clientCount',
    });
  } else if (profile.clientCount <= 5) {
    threats.push({
      id: nextId('pr-t'),
      description: 'Forte concentration client – risque de dépendance',
      impact: 5,
      source: 'profile:clientCount',
    });
  }

  return { strengths, weaknesses, opportunities, threats };
}

/**
 * Derive additional items from strategic-category answers.
 */
function deriveFromAnswers(answers: DiagnosticAnswer[]): Partial<SwotData> {
  const opportunities: SwotItem[] = [];
  const threats: SwotItem[] = [];
  const strengths: SwotItem[] = [];
  const weaknesses: SwotItem[] = [];

  // Digital maturity (assumes question id pattern)
  const digitalMaturity = answerValue(answers, 'strategic-digital-maturity');
  if (typeof digitalMaturity === 'number') {
    if (digitalMaturity >= 70) {
      strengths.push({
        id: nextId('an-s'),
        description: 'Bonne maturité digitale facilitant l\'optimisation des processus',
        impact: 4,
        source: 'answer:strategic-digital-maturity',
      });
    } else if (digitalMaturity <= 30) {
      weaknesses.push({
        id: nextId('an-w'),
        description: 'Faible maturité digitale freinant la productivité',
        impact: 4,
        source: 'answer:strategic-digital-maturity',
      });
      opportunities.push({
        id: nextId('an-o'),
        description: 'Fort potentiel de gains via la digitalisation',
        impact: 4,
        source: 'answer:strategic-digital-maturity',
      });
    }
  }

  // Export / internationalisation
  const exportLevel = answerValue(answers, 'strategic-export');
  if (typeof exportLevel === 'number') {
    if (exportLevel >= 50) {
      strengths.push({
        id: nextId('an-s'),
        description: 'Présence à l\'export diversifiant les marchés',
        impact: 3,
        source: 'answer:strategic-export',
      });
    } else {
      opportunities.push({
        id: nextId('an-o'),
        description: 'Potentiel de développement à l\'international',
        impact: 3,
        source: 'answer:strategic-export',
      });
    }
  }

  // Innovation capacity
  const innovation = answerValue(answers, 'strategic-innovation');
  if (typeof innovation === 'number') {
    if (innovation >= 60) {
      strengths.push({
        id: nextId('an-s'),
        description: 'Capacité d\'innovation élevée',
        impact: 4,
        source: 'answer:strategic-innovation',
      });
    } else if (innovation <= 25) {
      threats.push({
        id: nextId('an-t'),
        description: 'Risque d\'obsolescence par manque d\'innovation',
        impact: 4,
        source: 'answer:strategic-innovation',
      });
    }
  }

  // Regulatory exposure
  const regulatory = answerValue(answers, 'strategic-regulatory');
  if (typeof regulatory === 'string' && regulatory === 'high') {
    threats.push({
      id: nextId('an-t'),
      description: 'Forte exposition réglementaire pouvant engendrer des coûts de conformité',
      impact: 4,
      source: 'answer:strategic-regulatory',
    });
  }

  return { strengths, weaknesses, opportunities, threats };
}

function mergePartial(base: SwotData, partial: Partial<SwotData>): void {
  if (partial.strengths) base.strengths.push(...partial.strengths);
  if (partial.weaknesses) base.weaknesses.push(...partial.weaknesses);
  if (partial.opportunities) base.opportunities.push(...partial.opportunities);
  if (partial.threats) base.threats.push(...partial.threats);
}

// ---------------------------------------------------------------------------
// TOWS generation
// ---------------------------------------------------------------------------

function buildCrossStrategy(
  type: 'SO' | 'WO' | 'ST' | 'WT',
  listA: SwotItem[],
  listB: SwotItem[],
  templateFn: (a: SwotItem, b: SwotItem) => string,
): Strategy[] {
  const strategies: Strategy[] = [];
  const maxCombinations = Math.min(listA.length * listB.length, 6);
  const pairs: { a: SwotItem; b: SwotItem; score: number }[] = [];

  for (const a of listA) {
    for (const b of listB) {
      pairs.push({ a, b, score: a.impact + b.impact });
    }
  }

  // Sort by combined impact descending
  pairs.sort((x, y) => y.score - x.score);

  for (let i = 0; i < Math.min(pairs.length, maxCombinations); i++) {
    const { a, b, score } = pairs[i];
    strategies.push({
      id: nextId(`tows-${type.toLowerCase()}`),
      description: templateFn(a, b),
      type,
      priority: i + 1,
      estimatedImpact: clamp(score * 10, 10, 100),
    });
  }

  return strategies;
}

/**
 * Generate TOWS cross-matrix strategies from SWOT data.
 *
 * @param swot - The SWOT data containing strengths, weaknesses, opportunities, and threats
 * @returns TOWS strategies grouped by quadrant (SO, WO, ST, WT)
 */
export function generateTowsStrategies(swot: SwotData): TowsStrategies {
  const SO = buildCrossStrategy(
    'SO',
    swot.strengths,
    swot.opportunities,
    (s, o) =>
      `Utiliser « ${s.description} » pour saisir « ${o.description} »`,
  );

  const WO = buildCrossStrategy(
    'WO',
    swot.weaknesses,
    swot.opportunities,
    (w, o) =>
      `Corriger « ${w.description} » en exploitant « ${o.description} »`,
  );

  const ST = buildCrossStrategy(
    'ST',
    swot.strengths,
    swot.threats,
    (s, t) =>
      `S'appuyer sur « ${s.description} » pour contrer « ${t.description} »`,
  );

  const WT = buildCrossStrategy(
    'WT',
    swot.weaknesses,
    swot.threats,
    (w, t) =>
      `Réduire « ${w.description} » pour limiter l'exposition à « ${t.description} »`,
  );

  return { SO, WO, ST, WT };
}

// ---------------------------------------------------------------------------
// Prioritisation
// ---------------------------------------------------------------------------

/**
 * Flatten TOWS strategies and sort by estimated impact (descending), then reassign priority ranks.
 *
 * @param tows - The TOWS strategies to prioritise
 * @returns Sorted array of strategies with updated priority ranks
 */
export function prioritizeStrategies(tows: TowsStrategies): Strategy[] {
  const all: Strategy[] = [...tows.SO, ...tows.WO, ...tows.ST, ...tows.WT];

  // Boost SO and ST strategies slightly (offensive & defensive strengths first)
  const boosted = all.map((s) => ({
    ...s,
    _sortScore: s.estimatedImpact + (s.type === 'SO' ? 10 : s.type === 'ST' ? 5 : 0),
  }));

  boosted.sort((a, b) => b._sortScore - a._sortScore);

  return boosted.map(({ _sortScore: _, ...strategy }, index) => ({
    ...strategy,
    priority: index + 1,
  }));
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Generate a full SWOT analysis with TOWS cross-matrix and prioritised strategies.
 *
 * @param answers - All diagnostic answers collected so far
 * @param companyProfile - The company profile information
 * @param wasteScores - Calculated waste scores per category (0-100)
 * @returns Complete SWOT result including TOWS strategies
 */
export function generateSwot(
  answers: DiagnosticAnswer[],
  companyProfile: CompanyProfile,
  wasteScores: WasteScores,
): SwotResult {
  // Reset id counter for deterministic output in tests
  _idCounter = 0;

  const swot: SwotData = {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
  };

  // 1. Waste-based items
  const wasteItems = deriveFromWastes(wasteScores);
  swot.strengths.push(...wasteItems.strengths);
  swot.weaknesses.push(...wasteItems.weaknesses);

  // 2. Profile-based items
  mergePartial(swot, deriveFromProfile(companyProfile));

  // 3. Answer-based items
  mergePartial(swot, deriveFromAnswers(answers));

  // 4. Sort each quadrant by impact descending
  for (const key of ['strengths', 'weaknesses', 'opportunities', 'threats'] as const) {
    swot[key].sort((a, b) => b.impact - a.impact);
  }

  // 5. TOWS
  const tows = generateTowsStrategies(swot);

  // 6. Prioritise
  const prioritisedStrategies = prioritizeStrategies(tows);

  return {
    swot,
    tows,
    prioritisedStrategies,
    generatedAt: new Date().toISOString(),
  };
}
