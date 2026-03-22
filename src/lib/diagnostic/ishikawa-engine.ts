// ============================================================================
// DiagOptim - Ishikawa (Fishbone / 6M) Diagram Engine
// Generates root cause analysis using the 6M methodology
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

/** The 6M categories for Ishikawa analysis */
export type IshikawaCategory =
  | 'man'        // Main d'oeuvre / People
  | 'machine'    // Machines / Equipment
  | 'method'     // Methodes / Processes
  | 'material'   // Matieres / Materials
  | 'measurement'// Mesure / Measurement
  | 'environment';// Milieu / Mother Nature (Environment)

/** A single cause in the fishbone diagram */
export interface IshikawaCause {
  /** Unique cause ID */
  id: string;
  /** 6M category this cause belongs to */
  category: IshikawaCategory;
  /** Cause description (French) */
  descriptionFr: string;
  /** Cause description (English) */
  descriptionEn: string;
  /** Likelihood this is a contributing factor (0-100) */
  likelihood: number;
  /** Impact severity if this cause is confirmed (0-100) */
  impact: number;
  /** Priority score = likelihood * impact / 100 */
  priority: number;
  /** Sub-causes (for drilling down) */
  subCauses?: IshikawaCause[];
  /** Source: how this cause was identified */
  source: 'answer' | 'inferred' | 'document' | 'manual';
}

/** Company profile context for cause analysis */
export interface CompanyProfile {
  sector: string;
  subsector: string;
  employeeCount: number;
  annualRevenue: number;
  digitalMaturity?: number;
}

/** Answer input for Ishikawa generation */
export interface IshikawaAnswerInput {
  questionKey: string;
  answer: unknown;
  score: number | null;
  category: string;
}

/** Complete Ishikawa analysis result */
export interface IshikawaResult {
  /** The problem statement being analyzed */
  problem: string;
  /** All causes organized by 6M category */
  causes: Record<IshikawaCategory, IshikawaCause[]>;
  /** Flat list of all causes */
  allCauses: IshikawaCause[];
  /** Identified root cause (most likely fundamental cause) */
  rootCause: string;
  /** Root cause details */
  rootCauseDetail: IshikawaCause;
  /** Causes prioritized by impact * likelihood */
  prioritizedCauses: IshikawaCause[];
  /** Number of causes identified per category */
  categoryCounts: Record<IshikawaCategory, number>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** 6M category labels */
const CATEGORY_LABELS: Record<IshikawaCategory, { fr: string; en: string }> = {
  man: { fr: 'Main d\'oeuvre', en: 'People' },
  machine: { fr: 'Machines', en: 'Machines' },
  method: { fr: 'Methodes', en: 'Methods' },
  material: { fr: 'Matieres', en: 'Materials' },
  measurement: { fr: 'Mesure', en: 'Measurement' },
  environment: { fr: 'Milieu', en: 'Environment' },
};

const ALL_CATEGORIES: IshikawaCategory[] = [
  'man', 'machine', 'method', 'material', 'measurement', 'environment',
];

/**
 * Mapping from waste categories to typical 6M causes.
 * Each entry provides template causes that are common for a given waste.
 */
const WASTE_TO_CAUSES: Record<string, Array<{ category: IshikawaCategory; fr: string; en: string; likelihood: number }>> = {
  waiting: [
    { category: 'method', fr: 'Processus de validation trop long', en: 'Approval process too long', likelihood: 70 },
    { category: 'machine', fr: 'Outils informatiques lents ou indisponibles', en: 'Slow or unavailable IT tools', likelihood: 55 },
    { category: 'man', fr: 'Manque de polyvalence des equipes', en: 'Lack of team cross-training', likelihood: 50 },
    { category: 'material', fr: 'Retards de livraison fournisseurs', en: 'Supplier delivery delays', likelihood: 60 },
    { category: 'measurement', fr: 'Absence de suivi des delais', en: 'No delay tracking in place', likelihood: 45 },
    { category: 'environment', fr: 'Pics d\'activite saisonniers non anticipes', en: 'Unanticipated seasonal peaks', likelihood: 40 },
  ],
  defects: [
    { category: 'man', fr: 'Formation insuffisante des operateurs', en: 'Insufficient operator training', likelihood: 65 },
    { category: 'method', fr: 'Absence de procedures standardisees', en: 'No standardized procedures', likelihood: 70 },
    { category: 'machine', fr: 'Equipements mal entretenus ou obsoletes', en: 'Poorly maintained or obsolete equipment', likelihood: 55 },
    { category: 'material', fr: 'Matieres premieres de qualite variable', en: 'Variable raw material quality', likelihood: 50 },
    { category: 'measurement', fr: 'Controles qualite insuffisants', en: 'Insufficient quality controls', likelihood: 60 },
    { category: 'environment', fr: 'Conditions de travail inappropriees (temperature, bruit)', en: 'Inappropriate working conditions (temperature, noise)', likelihood: 35 },
  ],
  overprocessing: [
    { category: 'method', fr: 'Processus non revus depuis longtemps', en: 'Processes not reviewed for a long time', likelihood: 75 },
    { category: 'man', fr: 'Perfectionnisme excessif sans valeur ajoutee', en: 'Excessive perfectionism without added value', likelihood: 50 },
    { category: 'measurement', fr: 'Criteres de qualite non alignes avec les attentes client', en: 'Quality criteria not aligned with customer expectations', likelihood: 65 },
    { category: 'machine', fr: 'Outils inadaptes generant des etapes supplementaires', en: 'Inadequate tools generating extra steps', likelihood: 55 },
    { category: 'material', fr: 'Specifications trop complexes', en: 'Overly complex specifications', likelihood: 45 },
  ],
  overproduction: [
    { category: 'method', fr: 'Production en mode pousse (push) sans commande ferme', en: 'Push production without firm orders', likelihood: 70 },
    { category: 'measurement', fr: 'Previsions de demande imprecises', en: 'Inaccurate demand forecasting', likelihood: 65 },
    { category: 'man', fr: 'Peur de manquer / reflexe de securite', en: 'Fear of shortage / safety reflex', likelihood: 55 },
    { category: 'machine', fr: 'Lots minimum imposes par les machines', en: 'Minimum batch sizes imposed by machines', likelihood: 45 },
  ],
  transport: [
    { category: 'method', fr: 'Flux de circulation non optimises', en: 'Unoptimized flow paths', likelihood: 65 },
    { category: 'environment', fr: 'Implantation des locaux inadaptee', en: 'Inadequate facility layout', likelihood: 60 },
    { category: 'machine', fr: 'Manque d\'equipement de manutention', en: 'Lack of material handling equipment', likelihood: 45 },
    { category: 'measurement', fr: 'Pas de mesure des distances parcourues', en: 'No measurement of distances traveled', likelihood: 40 },
  ],
  inventory: [
    { category: 'method', fr: 'Absence de gestion de stock en flux tire', en: 'No pull-based inventory management', likelihood: 70 },
    { category: 'measurement', fr: 'Pas de suivi en temps reel des niveaux de stock', en: 'No real-time stock level tracking', likelihood: 60 },
    { category: 'man', fr: 'Habitude de commander en grande quantite', en: 'Habit of ordering in large quantities', likelihood: 50 },
    { category: 'material', fr: 'Delais fournisseurs longs obligeant a stocker', en: 'Long supplier lead times forcing stockholding', likelihood: 55 },
  ],
  motion: [
    { category: 'environment', fr: 'Poste de travail mal agence (pas de 5S)', en: 'Poorly arranged workstation (no 5S)', likelihood: 70 },
    { category: 'method', fr: 'Taches non standardisees', en: 'Non-standardized tasks', likelihood: 55 },
    { category: 'machine', fr: 'Outils ranges loin du poste de travail', en: 'Tools stored far from workstation', likelihood: 50 },
    { category: 'man', fr: 'Manque d\'ergonomie / formation au geste', en: 'Lack of ergonomics / gesture training', likelihood: 45 },
  ],
  skills: [
    { category: 'man', fr: 'Plan de formation inexistant ou inadapte', en: 'Nonexistent or inadequate training plan', likelihood: 70 },
    { category: 'method', fr: 'Fiches de poste non a jour', en: 'Outdated job descriptions', likelihood: 55 },
    { category: 'measurement', fr: 'Pas d\'evaluation des competences', en: 'No skills assessment', likelihood: 60 },
    { category: 'environment', fr: 'Culture d\'entreprise peu participative', en: 'Low-participation company culture', likelihood: 50 },
  ],
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Generates a complete Ishikawa root cause analysis.
 *
 * @param problem - The problem statement to analyze
 * @param answers - Diagnostic answers providing context
 * @param context - Company profile for sector-specific adjustments
 * @returns Complete Ishikawa result
 */
export function generateIshikawa(
  problem: string,
  answers: IshikawaAnswerInput[],
  context: CompanyProfile,
): IshikawaResult {
  const causesByCategory: Record<IshikawaCategory, IshikawaCause[]> = {
    man: [],
    machine: [],
    method: [],
    material: [],
    measurement: [],
    environment: [],
  };

  let causeIdCounter = 0;

  // Step 1: Identify relevant waste categories from answers
  const wasteCategories = identifyRelevantWastes(answers);

  // Step 2: Generate causes from waste-to-cause mappings
  for (const wasteCategory of wasteCategories) {
    const templateCauses = WASTE_TO_CAUSES[wasteCategory] ?? [];

    for (const template of templateCauses) {
      causeIdCounter++;
      const adjustedLikelihood = adjustLikelihoodForContext(
        template.likelihood,
        template.category,
        context,
      );
      const impact = estimateImpact(wasteCategory, template.category, context);

      const cause: IshikawaCause = {
        id: `cause_${causeIdCounter}`,
        category: template.category,
        descriptionFr: template.fr,
        descriptionEn: template.en,
        likelihood: adjustedLikelihood,
        impact,
        priority: Math.round((adjustedLikelihood * impact) / 100),
        source: 'inferred',
      };

      causesByCategory[template.category].push(cause);
    }
  }

  // Step 3: Add causes directly from diagnostic answers
  for (const answer of answers) {
    if (answer.score !== null && answer.score >= 7) {
      const mappedCategory = mapAnswerToCategory(answer.category);
      if (mappedCategory) {
        causeIdCounter++;
        const cause: IshikawaCause = {
          id: `cause_${causeIdCounter}`,
          category: mappedCategory,
          descriptionFr: `Score eleve sur "${answer.questionKey}" (${answer.score}/10)`,
          descriptionEn: `High score on "${answer.questionKey}" (${answer.score}/10)`,
          likelihood: Math.min(95, (answer.score ?? 0) * 10),
          impact: 60,
          priority: 0,
          source: 'answer',
        };
        cause.priority = Math.round((cause.likelihood * cause.impact) / 100);
        causesByCategory[mappedCategory].push(cause);
      }
    }
  }

  // Step 4: Deduplicate causes within each category
  for (const cat of ALL_CATEGORIES) {
    causesByCategory[cat] = deduplicateCauses(causesByCategory[cat]);
  }

  // Step 5: Build flat list and prioritize
  const allCauses = ALL_CATEGORIES.flatMap((cat) => causesByCategory[cat]);
  const prioritizedCauses = prioritizeCauses(allCauses);

  // Step 6: Identify root cause
  const rootCauseDetail = prioritizedCauses[0] ?? {
    id: 'unknown',
    category: 'method' as IshikawaCategory,
    descriptionFr: 'Cause racine non identifiable avec les donnees disponibles',
    descriptionEn: 'Root cause not identifiable with available data',
    likelihood: 0,
    impact: 0,
    priority: 0,
    source: 'inferred' as const,
  };
  const rootCause = identifyRootCause(prioritizedCauses);

  // Category counts
  const categoryCounts = {} as Record<IshikawaCategory, number>;
  for (const cat of ALL_CATEGORIES) {
    categoryCounts[cat] = causesByCategory[cat].length;
  }

  return {
    problem,
    causes: causesByCategory,
    allCauses,
    rootCause,
    rootCauseDetail,
    prioritizedCauses,
    categoryCounts,
  };
}

/**
 * Identifies the most likely root cause from prioritized causes.
 * Uses the "5 Whys" principle: the root cause is typically in Methods or People.
 *
 * @param causes - Prioritized list of causes
 * @returns Root cause description string
 */
export function identifyRootCause(causes: IshikawaCause[]): string {
  if (causes.length === 0) {
    return 'Donnees insuffisantes pour identifier une cause racine.';
  }

  // Prefer 'method' causes as root causes (systemic), then 'man' (organizational)
  const methodCauses = causes.filter((c) => c.category === 'method');
  const manCauses = causes.filter((c) => c.category === 'man');

  const rootCandidate =
    methodCauses.find((c) => c.priority >= 40) ??
    manCauses.find((c) => c.priority >= 40) ??
    causes[0];

  return rootCandidate.descriptionFr;
}

/**
 * Prioritizes causes by their priority score (impact * likelihood / 100).
 * Returns a new sorted array (does not mutate input).
 *
 * @param causes - List of causes to prioritize
 * @returns Sorted array, highest priority first
 */
export function prioritizeCauses(causes: IshikawaCause[]): IshikawaCause[] {
  return [...causes].sort((a, b) => b.priority - a.priority);
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Identifies which waste categories have significant scores.
 */
function identifyRelevantWastes(answers: IshikawaAnswerInput[]): string[] {
  const categoryScores = new Map<string, { total: number; count: number }>();

  for (const answer of answers) {
    if (answer.score === null) continue;
    const existing = categoryScores.get(answer.category) ?? { total: 0, count: 0 };
    existing.total += answer.score;
    existing.count += 1;
    categoryScores.set(answer.category, existing);
  }

  return Array.from(categoryScores.entries())
    .filter(([, data]) => data.count > 0 && data.total / data.count >= 5)
    .sort((a, b) => b[1].total / b[1].count - a[1].total / a[1].count)
    .map(([category]) => category);
}

/**
 * Adjusts cause likelihood based on company context.
 */
function adjustLikelihoodForContext(
  baseLikelihood: number,
  category: IshikawaCategory,
  context: CompanyProfile,
): number {
  let adjusted = baseLikelihood;

  // Small companies: more likely people/method issues, less machine issues
  if (context.employeeCount <= 10) {
    if (category === 'man') adjusted += 10;
    if (category === 'method') adjusted += 10;
    if (category === 'machine') adjusted -= 15;
    if (category === 'measurement') adjusted += 5;
  }

  // Low digital maturity increases measurement/method issues
  if (context.digitalMaturity !== undefined && context.digitalMaturity <= 4) {
    if (category === 'measurement') adjusted += 15;
    if (category === 'method') adjusted += 10;
  }

  return Math.max(5, Math.min(95, adjusted));
}

/**
 * Estimates impact based on waste type and 6M category.
 */
function estimateImpact(
  wasteCategory: string,
  ishikawaCategory: IshikawaCategory,
  context: CompanyProfile,
): number {
  // Base impact depends on waste type severity
  const wasteBaseImpact: Record<string, number> = {
    defects: 75,
    waiting: 70,
    overprocessing: 65,
    overproduction: 65,
    inventory: 60,
    transport: 55,
    motion: 50,
    skills: 60,
  };

  let impact = wasteBaseImpact[wasteCategory] ?? 50;

  // Method and machine causes tend to have higher impact (systemic)
  if (ishikawaCategory === 'method') impact += 10;
  if (ishikawaCategory === 'machine') impact += 5;

  // Scale by revenue: higher revenue = higher absolute impact
  if (context.annualRevenue > 5_000_000) impact += 5;

  return Math.max(10, Math.min(95, impact));
}

/**
 * Maps answer categories to 6M categories.
 */
function mapAnswerToCategory(answerCategory: string): IshikawaCategory | null {
  const mapping: Record<string, IshikawaCategory> = {
    skills: 'man',
    motion: 'man',
    waiting: 'method',
    overprocessing: 'method',
    overproduction: 'method',
    defects: 'measurement',
    transport: 'environment',
    inventory: 'material',
  };
  return mapping[answerCategory] ?? null;
}

/**
 * Deduplicates causes by description similarity within a category.
 */
function deduplicateCauses(causes: IshikawaCause[]): IshikawaCause[] {
  const seen = new Set<string>();
  return causes.filter((cause) => {
    const key = cause.descriptionFr.toLowerCase().substring(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { CATEGORY_LABELS, ALL_CATEGORIES };
