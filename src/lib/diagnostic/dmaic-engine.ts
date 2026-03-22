// ============================================================================
// DiagOptim - DMAIC Workflow Engine
// Generates structured DMAIC improvement plans from diagnostic data
// ============================================================================

import type { WasteCategoryId } from './decision-tree';

// ============================================================================
// TYPES
// ============================================================================

/** DMAIC phase identifier */
export type DmaicPhase = 'define' | 'measure' | 'analyze' | 'improve' | 'control';

/** A single deliverable within a DMAIC phase */
export interface DmaicDeliverable {
  /** Deliverable name */
  nameFr: string;
  nameEn: string;
  /** Description of what this deliverable contains */
  descriptionFr: string;
  descriptionEn: string;
  /** Estimated effort in hours */
  effortHours: number;
  /** Tool or template to use (e.g., "VSM", "Ishikawa", "Pareto") */
  tool?: string;
  /** Whether this deliverable is included in free plan */
  freeIncluded: boolean;
}

/** A key question to answer during a DMAIC phase */
export interface DmaicKeyQuestion {
  questionFr: string;
  questionEn: string;
  /** Suggested method to answer this question */
  suggestedMethod?: string;
}

/** A recommended tool for a DMAIC phase */
export interface DmaicTool {
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  /** Whether DiagOptim provides this tool built-in */
  builtIn: boolean;
}

/** A single DMAIC phase plan */
export interface DmaicPhaseDetail {
  /** Phase identifier */
  phase: DmaicPhase;
  /** Phase objective */
  objectiveFr: string;
  objectiveEn: string;
  /** Duration estimate in weeks */
  durationWeeks: number;
  /** Key questions to answer */
  keyQuestions: DmaicKeyQuestion[];
  /** Expected deliverables */
  deliverables: DmaicDeliverable[];
  /** Recommended tools */
  tools: DmaicTool[];
  /** Success criteria for moving to the next phase */
  gateCriteriaFr: string[];
  gateCriteriaEn: string[];
}

/** Complete DMAIC plan for a waste category */
export interface DmaicPlan {
  /** Diagnostic ID */
  diagnosticId: string;
  /** Target waste category */
  wasteCategory: WasteCategoryId;
  /** Problem statement derived from diagnostic */
  problemStatementFr: string;
  problemStatementEn: string;
  /** Target improvement metric */
  targetMetricFr: string;
  targetMetricEn: string;
  /** All 5 phases */
  phases: DmaicPhaseDetail[];
  /** Total estimated duration in weeks */
  totalDurationWeeks: number;
  /** Total estimated effort in hours */
  totalEffortHours: number;
  /** Estimated ROI multiplier (e.g., 3.5 = 3.5x return on time invested) */
  estimatedRoi: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Waste category details for problem statement generation */
const WASTE_DETAILS: Record<WasteCategoryId, {
  problemFr: string;
  problemEn: string;
  metricFr: string;
  metricEn: string;
  baseRoi: number;
}> = {
  transport: {
    problemFr: 'Deplacements inutiles de materiaux, produits ou informations generant des couts et des delais',
    problemEn: 'Unnecessary movement of materials, products, or information generating costs and delays',
    metricFr: 'Reduction des distances parcourues et temps de transfert',
    metricEn: 'Reduction in distances traveled and transfer times',
    baseRoi: 2.5,
  },
  inventory: {
    problemFr: 'Stocks excessifs immobilisant du capital et occupant de l\'espace inutilement',
    problemEn: 'Excessive inventory tying up capital and taking up space unnecessarily',
    metricFr: 'Reduction du niveau de stock moyen et du taux d\'obsolescence',
    metricEn: 'Reduction in average stock level and obsolescence rate',
    baseRoi: 3.0,
  },
  motion: {
    problemFr: 'Mouvements inutiles des collaborateurs reduisant la productivite et augmentant la fatigue',
    problemEn: 'Unnecessary employee movements reducing productivity and increasing fatigue',
    metricFr: 'Reduction du temps de deplacement par poste de travail',
    metricEn: 'Reduction in travel time per workstation',
    baseRoi: 2.0,
  },
  waiting: {
    problemFr: 'Temps d\'attente et delais ralentissant les processus et frustrant les equipes et clients',
    problemEn: 'Wait times and delays slowing down processes and frustrating teams and clients',
    metricFr: 'Reduction du temps de cycle et du delai moyen de traitement',
    metricEn: 'Reduction in cycle time and average processing delay',
    baseRoi: 4.0,
  },
  overproduction: {
    problemFr: 'Production ou preparation de travail en exces par rapport a la demande reelle',
    problemEn: 'Production or preparation of work in excess of actual demand',
    metricFr: 'Alignement production/demande et reduction des invendus',
    metricEn: 'Production/demand alignment and unsold inventory reduction',
    baseRoi: 3.5,
  },
  overprocessing: {
    problemFr: 'Etapes de traitement inutiles ou excessives n\'apportant pas de valeur au client',
    problemEn: 'Unnecessary or excessive processing steps not adding customer value',
    metricFr: 'Reduction du nombre d\'etapes et du temps de traitement total',
    metricEn: 'Reduction in number of steps and total processing time',
    baseRoi: 3.0,
  },
  defects: {
    problemFr: 'Erreurs, defauts et retouches generant des couts de non-qualite importants',
    problemEn: 'Errors, defects, and rework generating significant non-quality costs',
    metricFr: 'Reduction du taux de defaut et du cout de non-qualite',
    metricEn: 'Reduction in defect rate and cost of non-quality',
    baseRoi: 5.0,
  },
  skills: {
    problemFr: 'Competences des collaborateurs sous-utilisees freinant l\'innovation et la motivation',
    problemEn: 'Employee skills underutilized, hindering innovation and motivation',
    metricFr: 'Amelioration de l\'adequation poste/competences et du taux d\'initiative',
    metricEn: 'Improvement in role/skill fit and initiative rate',
    baseRoi: 2.5,
  },
};

// ============================================================================
// CORE FUNCTION
// ============================================================================

/**
 * Generates a complete DMAIC improvement plan for a given waste category.
 *
 * @param diagnosticId - The diagnostic this plan belongs to
 * @param wasteCategory - The waste category to address
 * @param wasteScore - Current waste score (0-100) for calibrating intensity
 * @param employeeCount - Company size for effort estimation
 * @returns Complete DMAIC plan
 */
export function generateDmaicPlan(
  diagnosticId: string,
  wasteCategory: WasteCategoryId,
  wasteScore: number = 50,
  employeeCount: number = 10,
): DmaicPlan {
  const details = WASTE_DETAILS[wasteCategory];

  // Scale effort based on company size and waste severity
  const effortMultiplier = getEffortMultiplier(employeeCount, wasteScore);

  const phases: DmaicPhaseDetail[] = [
    buildDefinePhase(wasteCategory, effortMultiplier),
    buildMeasurePhase(wasteCategory, effortMultiplier),
    buildAnalyzePhase(wasteCategory, effortMultiplier),
    buildImprovePhase(wasteCategory, effortMultiplier),
    buildControlPhase(wasteCategory, effortMultiplier),
  ];

  const totalDurationWeeks = phases.reduce((s, p) => s + p.durationWeeks, 0);
  const totalEffortHours = phases.reduce(
    (s, p) => s + p.deliverables.reduce((ds, d) => ds + d.effortHours, 0),
    0,
  );

  // ROI scales with waste severity
  const estimatedRoi = Math.round(details.baseRoi * (wasteScore / 50) * 10) / 10;

  return {
    diagnosticId,
    wasteCategory,
    problemStatementFr: details.problemFr,
    problemStatementEn: details.problemEn,
    targetMetricFr: details.metricFr,
    targetMetricEn: details.metricEn,
    phases,
    totalDurationWeeks,
    totalEffortHours,
    estimatedRoi,
  };
}

// ============================================================================
// PHASE BUILDERS
// ============================================================================

function buildDefinePhase(waste: WasteCategoryId, multiplier: number): DmaicPhaseDetail {
  return {
    phase: 'define',
    objectiveFr: 'Cadrer le probleme, definir le perimetre et les objectifs mesurables',
    objectiveEn: 'Frame the problem, define the scope and measurable objectives',
    durationWeeks: Math.max(1, Math.round(1 * multiplier)),
    keyQuestions: [
      {
        questionFr: 'Quel est le probleme concret et mesurable ?',
        questionEn: 'What is the concrete, measurable problem?',
        suggestedMethod: 'QQOQCCP',
      },
      {
        questionFr: 'Quel est l\'impact financier estime ?',
        questionEn: 'What is the estimated financial impact?',
        suggestedMethod: 'Cost of Poor Quality (COPQ)',
      },
      {
        questionFr: 'Qui est le client du processus et quelles sont ses attentes ?',
        questionEn: 'Who is the process customer and what are their expectations?',
        suggestedMethod: 'Voice of Customer (VOC)',
      },
    ],
    deliverables: [
      {
        nameFr: 'Charte de projet',
        nameEn: 'Project charter',
        descriptionFr: 'Document cadrant le probleme, les objectifs, le perimetre et l\'equipe',
        descriptionEn: 'Document framing the problem, objectives, scope, and team',
        effortHours: Math.round(3 * multiplier),
        freeIncluded: true,
      },
      {
        nameFr: 'SIPOC du processus',
        nameEn: 'Process SIPOC',
        descriptionFr: 'Vue de haut niveau du processus (Suppliers, Inputs, Process, Outputs, Customers)',
        descriptionEn: 'High-level process view (Suppliers, Inputs, Process, Outputs, Customers)',
        effortHours: Math.round(2 * multiplier),
        tool: 'SIPOC',
        freeIncluded: true,
      },
    ],
    tools: [
      {
        nameFr: 'SIPOC',
        nameEn: 'SIPOC',
        descriptionFr: 'Cartographie de haut niveau du processus',
        descriptionEn: 'High-level process mapping',
        builtIn: false,
      },
    ],
    gateCriteriaFr: [
      'Probleme clairement defini et mesurable',
      'Objectif chiffre valide par la direction',
      'Equipe projet identifiee',
    ],
    gateCriteriaEn: [
      'Problem clearly defined and measurable',
      'Quantified objective validated by management',
      'Project team identified',
    ],
  };
}

function buildMeasurePhase(waste: WasteCategoryId, multiplier: number): DmaicPhaseDetail {
  const tools: DmaicTool[] = [
    {
      nameFr: 'VSM (Value Stream Mapping)',
      nameEn: 'VSM (Value Stream Mapping)',
      descriptionFr: 'Cartographie des flux de valeur pour identifier les gaspillages',
      descriptionEn: 'Value stream mapping to identify wastes',
      builtIn: true,
    },
  ];

  // Add waste-specific measurement tools
  if (waste === 'defects') {
    tools.push({
      nameFr: 'Feuille de releve',
      nameEn: 'Check sheet',
      descriptionFr: 'Collecte structuree des donnees de defauts',
      descriptionEn: 'Structured defect data collection',
      builtIn: false,
    });
  }

  return {
    phase: 'measure',
    objectiveFr: 'Mesurer la performance actuelle et collecter les donnees',
    objectiveEn: 'Measure current performance and collect data',
    durationWeeks: Math.max(1, Math.round(2 * multiplier)),
    keyQuestions: [
      {
        questionFr: 'Quelle est la performance actuelle du processus ?',
        questionEn: 'What is the current process performance?',
        suggestedMethod: 'VSM',
      },
      {
        questionFr: 'Les donnees sont-elles fiables et suffisantes ?',
        questionEn: 'Is the data reliable and sufficient?',
        suggestedMethod: 'Plan de collecte de donnees',
      },
      {
        questionFr: 'Ou se situent les principales variations ?',
        questionEn: 'Where are the main variations?',
        suggestedMethod: 'Diagramme de Pareto',
      },
    ],
    deliverables: [
      {
        nameFr: 'VSM etat actuel',
        nameEn: 'Current state VSM',
        descriptionFr: 'Cartographie detaillee du flux actuel avec temps de cycle et delais',
        descriptionEn: 'Detailed current flow mapping with cycle times and delays',
        effortHours: Math.round(4 * multiplier),
        tool: 'VSM',
        freeIncluded: false,
      },
      {
        nameFr: 'Tableau de bord des indicateurs',
        nameEn: 'KPI dashboard',
        descriptionFr: 'Indicateurs cles mesures avant amelioration (baseline)',
        descriptionEn: 'Key indicators measured before improvement (baseline)',
        effortHours: Math.round(3 * multiplier),
        freeIncluded: true,
      },
    ],
    tools,
    gateCriteriaFr: [
      'Donnees de base (baseline) collectees et validees',
      'VSM etat actuel complete',
      'Indicateurs de performance identifies',
    ],
    gateCriteriaEn: [
      'Baseline data collected and validated',
      'Current state VSM completed',
      'Performance indicators identified',
    ],
  };
}

function buildAnalyzePhase(waste: WasteCategoryId, multiplier: number): DmaicPhaseDetail {
  return {
    phase: 'analyze',
    objectiveFr: 'Identifier et valider les causes racines du probleme',
    objectiveEn: 'Identify and validate root causes of the problem',
    durationWeeks: Math.max(1, Math.round(2 * multiplier)),
    keyQuestions: [
      {
        questionFr: 'Quelles sont les causes racines du probleme ?',
        questionEn: 'What are the root causes of the problem?',
        suggestedMethod: 'Ishikawa + 5 Pourquoi',
      },
      {
        questionFr: 'Quelles causes ont le plus d\'impact ?',
        questionEn: 'Which causes have the most impact?',
        suggestedMethod: 'Matrice impact/effort',
      },
      {
        questionFr: 'Les causes identifiees sont-elles validees par les donnees ?',
        questionEn: 'Are identified causes validated by data?',
        suggestedMethod: 'Analyse de correlation',
      },
    ],
    deliverables: [
      {
        nameFr: 'Diagramme d\'Ishikawa',
        nameEn: 'Ishikawa diagram',
        descriptionFr: 'Analyse des causes par la methode 6M (Main d\'oeuvre, Machines, Methodes, Matieres, Mesure, Milieu)',
        descriptionEn: '6M root cause analysis (Man, Machine, Method, Material, Measurement, Mother Nature)',
        effortHours: Math.round(3 * multiplier),
        tool: 'Ishikawa',
        freeIncluded: false,
      },
      {
        nameFr: 'Analyse des 5 Pourquoi',
        nameEn: '5 Whys analysis',
        descriptionFr: 'Approfondissement des causes racines par questionnement iteratif',
        descriptionEn: 'Root cause deepening through iterative questioning',
        effortHours: Math.round(2 * multiplier),
        freeIncluded: true,
      },
      {
        nameFr: 'Matrice de priorisation',
        nameEn: 'Prioritization matrix',
        descriptionFr: 'Classement des causes par impact et facilite de resolution',
        descriptionEn: 'Cause ranking by impact and ease of resolution',
        effortHours: Math.round(2 * multiplier),
        freeIncluded: true,
      },
    ],
    tools: [
      {
        nameFr: 'Ishikawa (6M)',
        nameEn: 'Ishikawa (6M)',
        descriptionFr: 'Diagramme en arete de poisson pour l\'analyse des causes',
        descriptionEn: 'Fishbone diagram for cause analysis',
        builtIn: true,
      },
      {
        nameFr: '5 Pourquoi',
        nameEn: '5 Whys',
        descriptionFr: 'Methode de questionnement iteratif pour trouver la cause racine',
        descriptionEn: 'Iterative questioning method to find root cause',
        builtIn: false,
      },
    ],
    gateCriteriaFr: [
      'Causes racines identifiees et validees par les donnees',
      'Top 3 des causes classees par impact',
      'Accord de l\'equipe sur les causes a traiter',
    ],
    gateCriteriaEn: [
      'Root causes identified and validated by data',
      'Top 3 causes ranked by impact',
      'Team agreement on causes to address',
    ],
  };
}

function buildImprovePhase(waste: WasteCategoryId, multiplier: number): DmaicPhaseDetail {
  const wasteSpecificTools = getImproveTools(waste);

  return {
    phase: 'improve',
    objectiveFr: 'Mettre en oeuvre les solutions pour eliminer les causes racines',
    objectiveEn: 'Implement solutions to eliminate root causes',
    durationWeeks: Math.max(2, Math.round(4 * multiplier)),
    keyQuestions: [
      {
        questionFr: 'Quelles solutions attaquent les causes racines identifiees ?',
        questionEn: 'Which solutions address the identified root causes?',
        suggestedMethod: 'Brainstorming + matrice de selection',
      },
      {
        questionFr: 'Peut-on tester la solution a petite echelle avant deploiement ?',
        questionEn: 'Can we test the solution on a small scale before deployment?',
        suggestedMethod: 'Pilote / PDCA',
      },
      {
        questionFr: 'Les resultats du pilote confirment-ils l\'amelioration attendue ?',
        questionEn: 'Do pilot results confirm the expected improvement?',
        suggestedMethod: 'Comparaison avant/apres',
      },
    ],
    deliverables: [
      {
        nameFr: 'VSM etat futur',
        nameEn: 'Future state VSM',
        descriptionFr: 'Vision cible du processus apres amelioration',
        descriptionEn: 'Target process vision after improvement',
        effortHours: Math.round(3 * multiplier),
        tool: 'VSM',
        freeIncluded: false,
      },
      {
        nameFr: 'Plan d\'action detaille',
        nameEn: 'Detailed action plan',
        descriptionFr: 'Liste des actions avec responsables, echeances et indicateurs de suivi',
        descriptionEn: 'Action list with owners, deadlines, and tracking indicators',
        effortHours: Math.round(4 * multiplier),
        freeIncluded: true,
      },
      {
        nameFr: 'Rapport de pilote',
        nameEn: 'Pilot report',
        descriptionFr: 'Resultats du test a petite echelle et validation des gains',
        descriptionEn: 'Small-scale test results and gains validation',
        effortHours: Math.round(5 * multiplier),
        freeIncluded: false,
      },
    ],
    tools: wasteSpecificTools,
    gateCriteriaFr: [
      'Solutions pilotees avec resultats positifs',
      'Plan de deploiement valide',
      'Gains estimes confirmes par le pilote',
    ],
    gateCriteriaEn: [
      'Solutions piloted with positive results',
      'Deployment plan validated',
      'Estimated gains confirmed by pilot',
    ],
  };
}

function buildControlPhase(waste: WasteCategoryId, multiplier: number): DmaicPhaseDetail {
  return {
    phase: 'control',
    objectiveFr: 'Perenniser les ameliorations et empecher le retour aux anciennes pratiques',
    objectiveEn: 'Sustain improvements and prevent regression to old practices',
    durationWeeks: Math.max(2, Math.round(3 * multiplier)),
    keyQuestions: [
      {
        questionFr: 'Comment s\'assurer que les gains sont durables ?',
        questionEn: 'How to ensure gains are sustainable?',
        suggestedMethod: 'Plan de controle',
      },
      {
        questionFr: 'Les standards sont-ils documentes et compris par tous ?',
        questionEn: 'Are standards documented and understood by everyone?',
        suggestedMethod: 'Standards visuels / SOP',
      },
      {
        questionFr: 'Quel est le plan de reaction en cas de derive ?',
        questionEn: 'What is the reaction plan if performance drifts?',
        suggestedMethod: 'Plan de reaction',
      },
    ],
    deliverables: [
      {
        nameFr: 'Plan de controle',
        nameEn: 'Control plan',
        descriptionFr: 'Document definissant les indicateurs a surveiller et les seuils d\'alerte',
        descriptionEn: 'Document defining indicators to monitor and alert thresholds',
        effortHours: Math.round(3 * multiplier),
        freeIncluded: true,
      },
      {
        nameFr: 'Standards operatoires (SOP)',
        nameEn: 'Standard Operating Procedures (SOP)',
        descriptionFr: 'Procedures standardisees documentant les nouvelles pratiques',
        descriptionEn: 'Standardized procedures documenting new practices',
        effortHours: Math.round(4 * multiplier),
        freeIncluded: false,
      },
      {
        nameFr: 'Tableau de bord de suivi',
        nameEn: 'Monitoring dashboard',
        descriptionFr: 'Indicateurs visuels pour le suivi continu des performances',
        descriptionEn: 'Visual indicators for continuous performance monitoring',
        effortHours: Math.round(2 * multiplier),
        freeIncluded: true,
      },
    ],
    tools: [
      {
        nameFr: 'Management visuel',
        nameEn: 'Visual management',
        descriptionFr: 'Affichage des indicateurs cles pour detection rapide des derives',
        descriptionEn: 'Display of key indicators for quick drift detection',
        builtIn: false,
      },
      {
        nameFr: 'Audits de maintien',
        nameEn: 'Sustainability audits',
        descriptionFr: 'Audits periodiques pour verifier le respect des standards',
        descriptionEn: 'Periodic audits to verify standard compliance',
        builtIn: false,
      },
    ],
    gateCriteriaFr: [
      'Plan de controle en place et actif',
      'Standards documentes et equipe formee',
      'Gains confirmes sur 4+ semaines',
      'Transfert de responsabilite au process owner',
    ],
    gateCriteriaEn: [
      'Control plan in place and active',
      'Standards documented and team trained',
      'Gains confirmed over 4+ weeks',
      'Responsibility transferred to process owner',
    ],
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calculates effort multiplier based on company size and waste severity.
 */
function getEffortMultiplier(employeeCount: number, wasteScore: number): number {
  let multiplier = 1.0;

  // Scale up for larger companies
  if (employeeCount > 50) multiplier *= 1.5;
  else if (employeeCount > 20) multiplier *= 1.2;
  else if (employeeCount <= 5) multiplier *= 0.7;

  // Scale up for severe waste
  if (wasteScore > 75) multiplier *= 1.3;
  else if (wasteScore > 50) multiplier *= 1.1;
  else if (wasteScore < 30) multiplier *= 0.8;

  return Math.round(multiplier * 10) / 10;
}

/**
 * Returns waste-specific tools for the Improve phase.
 */
function getImproveTools(waste: WasteCategoryId): DmaicTool[] {
  const commonTools: DmaicTool[] = [
    {
      nameFr: 'PDCA (Plan-Do-Check-Act)',
      nameEn: 'PDCA (Plan-Do-Check-Act)',
      descriptionFr: 'Cycle d\'amelioration continue pour tester et valider les solutions',
      descriptionEn: 'Continuous improvement cycle to test and validate solutions',
      builtIn: false,
    },
  ];

  const wasteTools: Partial<Record<WasteCategoryId, DmaicTool[]>> = {
    transport: [
      {
        nameFr: 'Diagramme spaghetti',
        nameEn: 'Spaghetti diagram',
        descriptionFr: 'Visualisation des flux physiques pour optimiser l\'implantation',
        descriptionEn: 'Physical flow visualization to optimize layout',
        builtIn: false,
      },
    ],
    inventory: [
      {
        nameFr: 'Kanban',
        nameEn: 'Kanban',
        descriptionFr: 'Systeme de gestion visuelle des flux en mode tire',
        descriptionEn: 'Visual pull-based flow management system',
        builtIn: false,
      },
    ],
    motion: [
      {
        nameFr: '5S',
        nameEn: '5S',
        descriptionFr: 'Organisation du poste de travail (Trier, Ranger, Nettoyer, Standardiser, Maintenir)',
        descriptionEn: 'Workplace organization (Sort, Set in order, Shine, Standardize, Sustain)',
        builtIn: false,
      },
    ],
    waiting: [
      {
        nameFr: 'SMED',
        nameEn: 'SMED',
        descriptionFr: 'Reduction des temps de changement de serie',
        descriptionEn: 'Single-Minute Exchange of Die - setup time reduction',
        builtIn: false,
      },
    ],
    defects: [
      {
        nameFr: 'Poka-Yoke',
        nameEn: 'Poka-Yoke',
        descriptionFr: 'Systemes anti-erreur rendant les defauts impossibles',
        descriptionEn: 'Error-proofing systems making defects impossible',
        builtIn: false,
      },
    ],
    overprocessing: [
      {
        nameFr: 'Analyse de la valeur',
        nameEn: 'Value analysis',
        descriptionFr: 'Identification et elimination des etapes sans valeur ajoutee',
        descriptionEn: 'Identification and elimination of non-value-added steps',
        builtIn: false,
      },
    ],
    overproduction: [
      {
        nameFr: 'Takt Time',
        nameEn: 'Takt Time',
        descriptionFr: 'Cadencer la production sur la demande reelle du client',
        descriptionEn: 'Pace production to actual customer demand',
        builtIn: false,
      },
    ],
    skills: [
      {
        nameFr: 'Matrice de competences',
        nameEn: 'Skills matrix',
        descriptionFr: 'Cartographie des competences pour identifier les gaps et opportunites',
        descriptionEn: 'Skills mapping to identify gaps and opportunities',
        builtIn: false,
      },
    ],
  };

  return [...commonTools, ...(wasteTools[waste] ?? [])];
}
