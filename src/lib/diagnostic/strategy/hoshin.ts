/**
 * Hoshin Kanri Matrix Engine
 *
 * Generates a strategic deployment matrix linking:
 * Vision -> Breakthrough Objectives -> Annual Objectives -> Improvement Priorities -> KPIs
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Objective {
  id: string;
  description: string;
  type: 'breakthrough' | 'annual';
  /** Link to parent breakthrough objective (only for annual) */
  parentId?: string;
  /** Priority order */
  priority: number;
}

export interface Kpi {
  id: string;
  name: string;
  unit: string;
  currentValue: number;
  targetValue: number;
  /** Measurement frequency */
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export interface ObjectiveKpiLink {
  objectiveId: string;
  kpiId: string;
  /** How strongly linked (1 = weak correlation, 3 = strong correlation) */
  correlation: 1 | 2 | 3;
}

export interface HoshinAction {
  id: string;
  description: string;
  objectiveId: string;
  /** Estimated duration in weeks */
  durationWeeks: number;
  /** Effort level */
  effort: 'low' | 'medium' | 'high';
  /** Expected impact */
  impact: 'low' | 'medium' | 'high';
}

export interface Assignment {
  actionId: string;
  roleLabel: string;
  /** Responsible person index (0-based, relative to team) */
  responsibleIndex: number;
  /** Whether this role is the lead or a contributor */
  role: 'lead' | 'contributor';
}

export interface ImprovementPriority {
  id: string;
  description: string;
  linkedObjectiveIds: string[];
  actions: HoshinAction[];
}

export interface HoshinMatrix {
  vision: string;
  breakthroughObjectives: Objective[];
  annualObjectives: Objective[];
  improvementPriorities: ImprovementPriority[];
  kpis: Kpi[];
  links: ObjectiveKpiLink[];
  assignments: Assignment[];
}

export interface DiagnosticResults {
  globalScore: number;
  wasteScores: Record<string, number>;
  topWeaknesses: string[];
  topStrengths: string[];
  financialGoalType?: 'increase_revenue' | 'reduce_costs';
  financialGoalAmount?: number;
  timeHorizonMonths?: number;
}

export interface HoshinResult {
  matrix: HoshinMatrix;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _idSeq = 0;
function nextId(prefix: string): string {
  _idSeq++;
  return `${prefix}-${_idSeq}`;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ---------------------------------------------------------------------------
// Breakthrough objectives from diagnostic
// ---------------------------------------------------------------------------

function deriveBreakthroughObjectives(
  diagnosticResults: DiagnosticResults,
  vision: string,
): Objective[] {
  const objectives: Objective[] = [];
  let priority = 1;

  // Financial breakthrough
  if (diagnosticResults.financialGoalType === 'increase_revenue' && diagnosticResults.financialGoalAmount) {
    objectives.push({
      id: nextId('bo'),
      description: `Augmenter le chiffre d'affaires de ${diagnosticResults.financialGoalAmount.toLocaleString('fr-FR')} €`,
      type: 'breakthrough',
      priority: priority++,
    });
  } else if (diagnosticResults.financialGoalType === 'reduce_costs' && diagnosticResults.financialGoalAmount) {
    objectives.push({
      id: nextId('bo'),
      description: `Réduire les coûts opérationnels de ${diagnosticResults.financialGoalAmount.toLocaleString('fr-FR')} €`,
      type: 'breakthrough',
      priority: priority++,
    });
  }

  // Waste-based breakthrough (top 2 waste categories)
  const sortedWastes = Object.entries(diagnosticResults.wasteScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  for (const [waste, score] of sortedWastes) {
    if (score >= 50) {
      objectives.push({
        id: nextId('bo'),
        description: `Éliminer les gaspillages majeurs en "${waste}" (score actuel : ${score}/100)`,
        type: 'breakthrough',
        priority: priority++,
      });
    }
  }

  // Quality / score breakthrough
  if (diagnosticResults.globalScore < 60) {
    objectives.push({
      id: nextId('bo'),
      description: `Atteindre un score global de performance opérationnelle ≥ 75/100`,
      type: 'breakthrough',
      priority: priority++,
    });
  }

  // Ensure at least one breakthrough objective
  if (objectives.length === 0) {
    objectives.push({
      id: nextId('bo'),
      description: `Renforcer l'excellence opérationnelle en ligne avec la vision : "${vision}"`,
      type: 'breakthrough',
      priority: 1,
    });
  }

  return objectives;
}

// ---------------------------------------------------------------------------
// Annual objectives
// ---------------------------------------------------------------------------

function deriveAnnualObjectives(
  breakthroughObjectives: Objective[],
  diagnosticResults: DiagnosticResults,
): Objective[] {
  const annuals: Objective[] = [];
  let priority = 1;
  const months = diagnosticResults.timeHorizonMonths ?? 12;

  for (const bo of breakthroughObjectives) {
    // Each breakthrough gets 2-3 annual objectives
    if (bo.description.includes('chiffre d\'affaires')) {
      annuals.push({
        id: nextId('ao'),
        description: `Identifier et activer 3 nouveaux leviers de croissance dans les ${Math.min(months, 6)} prochains mois`,
        type: 'annual',
        parentId: bo.id,
        priority: priority++,
      });
      annuals.push({
        id: nextId('ao'),
        description: 'Optimiser le processus commercial pour réduire le cycle de vente de 20 %',
        type: 'annual',
        parentId: bo.id,
        priority: priority++,
      });
    } else if (bo.description.includes('coûts')) {
      annuals.push({
        id: nextId('ao'),
        description: 'Cartographier les postes de coûts et identifier les 5 premiers gisements d\'économie',
        type: 'annual',
        parentId: bo.id,
        priority: priority++,
      });
      annuals.push({
        id: nextId('ao'),
        description: 'Mettre en place un suivi mensuel des coûts par processus',
        type: 'annual',
        parentId: bo.id,
        priority: priority++,
      });
    } else if (bo.description.includes('gaspillages')) {
      annuals.push({
        id: nextId('ao'),
        description: 'Réaliser un VSM (Value Stream Mapping) sur les 2 processus les plus critiques',
        type: 'annual',
        parentId: bo.id,
        priority: priority++,
      });
      annuals.push({
        id: nextId('ao'),
        description: 'Mettre en place un chantier 5S dans les zones identifiées comme critiques',
        type: 'annual',
        parentId: bo.id,
        priority: priority++,
      });
      annuals.push({
        id: nextId('ao'),
        description: 'Réduire le taux de non-conformité de 30 % sur les 12 prochains mois',
        type: 'annual',
        parentId: bo.id,
        priority: priority++,
      });
    } else if (bo.description.includes('score global')) {
      annuals.push({
        id: nextId('ao'),
        description: 'Former 80 % des collaborateurs aux principes du Lean Management',
        type: 'annual',
        parentId: bo.id,
        priority: priority++,
      });
      annuals.push({
        id: nextId('ao'),
        description: 'Instaurer des réunions quotidiennes de pilotage opérationnel (stand-up)',
        type: 'annual',
        parentId: bo.id,
        priority: priority++,
      });
    } else {
      annuals.push({
        id: nextId('ao'),
        description: `Définir les jalons trimestriels pour atteindre : "${bo.description}"`,
        type: 'annual',
        parentId: bo.id,
        priority: priority++,
      });
    }
  }

  return annuals;
}

// ---------------------------------------------------------------------------
// Improvement priorities & actions
// ---------------------------------------------------------------------------

function deriveImprovementPriorities(
  annualObjectives: Objective[],
  diagnosticResults: DiagnosticResults,
): ImprovementPriority[] {
  const priorities: ImprovementPriority[] = [];

  // Group by breakthrough objective parent
  const byParent = new Map<string, Objective[]>();
  for (const ao of annualObjectives) {
    const key = ao.parentId ?? 'general';
    const group = byParent.get(key) ?? [];
    group.push(ao);
    byParent.set(key, group);
  }

  const parentKeys = Array.from(byParent.keys());
  for (const key of parentKeys) {
    const objectives = byParent.get(key)!;
    const actions: HoshinAction[] = objectives.map((obj) => ({
      id: nextId('ha'),
      description: `Action : ${obj.description}`,
      objectiveId: obj.id,
      durationWeeks: obj.description.includes('Former') ? 8 : obj.description.includes('VSM') ? 4 : 6,
      effort: obj.description.includes('Former') ? 'high' as const : 'medium' as const,
      impact: 'high' as const,
    }));

    // Add a quick win
    if (diagnosticResults.topWeaknesses.length > 0) {
      actions.push({
        id: nextId('ha'),
        description: `Quick win : traiter la faiblesse « ${diagnosticResults.topWeaknesses[0]} »`,
        objectiveId: objectives[0].id,
        durationWeeks: 2,
        effort: 'low',
        impact: 'medium',
      });
    }

    priorities.push({
      id: nextId('ip'),
      description: `Priorité d'amélioration liée à : ${objectives[0].description}`,
      linkedObjectiveIds: objectives.map((o) => o.id),
      actions,
    });
  }

  return priorities;
}

// ---------------------------------------------------------------------------
// KPI generation
// ---------------------------------------------------------------------------

function deriveKpis(diagnosticResults: DiagnosticResults): Kpi[] {
  const kpis: Kpi[] = [];

  // Global performance KPI
  kpis.push({
    id: nextId('kpi'),
    name: 'Score global de performance opérationnelle',
    unit: '/100',
    currentValue: diagnosticResults.globalScore,
    targetValue: clamp(diagnosticResults.globalScore + 20, 0, 100),
    frequency: 'monthly',
  });

  // Top waste KPIs
  const topWastes = Object.entries(diagnosticResults.wasteScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  for (const [waste, score] of topWastes) {
    kpis.push({
      id: nextId('kpi'),
      name: `Score gaspillage "${waste}"`,
      unit: '/100',
      currentValue: score,
      targetValue: clamp(score - 25, 0, 100),
      frequency: 'monthly',
    });
  }

  // Financial KPI
  if (diagnosticResults.financialGoalType === 'increase_revenue' && diagnosticResults.financialGoalAmount) {
    kpis.push({
      id: nextId('kpi'),
      name: 'Chiffre d\'affaires additionnel',
      unit: '€',
      currentValue: 0,
      targetValue: diagnosticResults.financialGoalAmount,
      frequency: 'monthly',
    });
  } else if (diagnosticResults.financialGoalType === 'reduce_costs' && diagnosticResults.financialGoalAmount) {
    kpis.push({
      id: nextId('kpi'),
      name: 'Économies réalisées',
      unit: '€',
      currentValue: 0,
      targetValue: diagnosticResults.financialGoalAmount,
      frequency: 'monthly',
    });
  }

  // Action completion KPI
  kpis.push({
    id: nextId('kpi'),
    name: 'Taux de réalisation des actions',
    unit: '%',
    currentValue: 0,
    targetValue: 90,
    frequency: 'weekly',
  });

  return kpis;
}

// ---------------------------------------------------------------------------
// Objective-KPI linking
// ---------------------------------------------------------------------------

/**
 * Create links between objectives and KPIs based on content matching.
 *
 * @param objectives - All objectives (breakthrough + annual)
 * @returns Array of objective-KPI links
 */
export function linkObjectivesToKpis(objectives: Objective[]): ObjectiveKpiLink[] {
  // This is a simplified matching; in production, KPIs would be passed as well.
  // For now, generate logical links based on objective index/type.
  const links: ObjectiveKpiLink[] = [];

  for (const obj of objectives) {
    // Link each objective to the global score KPI (assumed first)
    links.push({
      objectiveId: obj.id,
      kpiId: 'kpi-1', // global performance
      correlation: obj.type === 'breakthrough' ? 3 : 2,
    });
  }

  return links;
}

function linkObjectivesToKpisWithKpis(objectives: Objective[], kpis: Kpi[]): ObjectiveKpiLink[] {
  const links: ObjectiveKpiLink[] = [];

  for (const obj of objectives) {
    // Global performance KPI linked to all objectives
    const globalKpi = kpis.find((k) => k.name.includes('global'));
    if (globalKpi) {
      links.push({
        objectiveId: obj.id,
        kpiId: globalKpi.id,
        correlation: obj.type === 'breakthrough' ? 3 : 2,
      });
    }

    // Link waste-related objectives to corresponding waste KPIs
    if (obj.description.includes('gaspillages') || obj.description.includes('VSM') || obj.description.includes('5S')) {
      const wasteKpis = kpis.filter((k) => k.name.includes('gaspillage'));
      for (const wk of wasteKpis) {
        links.push({ objectiveId: obj.id, kpiId: wk.id, correlation: 3 });
      }
    }

    // Link financial objectives to financial KPIs
    if (obj.description.includes('chiffre d\'affaires') || obj.description.includes('coûts') || obj.description.includes('économie')) {
      const finKpis = kpis.filter((k) => k.unit === '€');
      for (const fk of finKpis) {
        links.push({ objectiveId: obj.id, kpiId: fk.id, correlation: 3 });
      }
    }

    // Link action-oriented objectives to completion KPI
    const completionKpi = kpis.find((k) => k.name.includes('réalisation'));
    if (completionKpi && obj.type === 'annual') {
      links.push({ objectiveId: obj.id, kpiId: completionKpi.id, correlation: 2 });
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return links.filter((l) => {
    const key = `${l.objectiveId}-${l.kpiId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Responsibility assignment
// ---------------------------------------------------------------------------

const ROLE_LABELS = [
  'Direction générale',
  'Responsable opérations',
  'Responsable qualité',
  'Chef d\'équipe',
  'Responsable RH',
  'Responsable commercial',
  'Responsable financier',
];

/**
 * Assign responsibilities for Hoshin actions across the team.
 *
 * @param actions - All Hoshin actions to assign
 * @param teamSize - Number of team members available
 * @returns Array of assignments
 */
export function assignResponsibilities(actions: HoshinAction[], teamSize: number): Assignment[] {
  const effectiveSize = clamp(teamSize, 1, ROLE_LABELS.length);
  const assignments: Assignment[] = [];

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    // Lead assignment: distribute evenly across team
    const leadIndex = i % effectiveSize;
    assignments.push({
      actionId: action.id,
      roleLabel: ROLE_LABELS[leadIndex] ?? `Membre ${leadIndex + 1}`,
      responsibleIndex: leadIndex,
      role: 'lead',
    });

    // High-effort actions get a contributor
    if (action.effort === 'high' && effectiveSize > 1) {
      const contribIndex = (leadIndex + 1) % effectiveSize;
      assignments.push({
        actionId: action.id,
        roleLabel: ROLE_LABELS[contribIndex] ?? `Membre ${contribIndex + 1}`,
        responsibleIndex: contribIndex,
        role: 'contributor',
      });
    }
  }

  return assignments;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Generate a complete Hoshin Kanri strategic deployment matrix.
 *
 * @param vision - The company vision statement
 * @param diagnosticResults - Aggregated diagnostic results
 * @returns Complete Hoshin Kanri matrix
 */
export function generateHoshinMatrix(
  vision: string,
  diagnosticResults: DiagnosticResults,
): HoshinResult {
  _idSeq = 0;

  const breakthroughObjectives = deriveBreakthroughObjectives(diagnosticResults, vision);
  const annualObjectives = deriveAnnualObjectives(breakthroughObjectives, diagnosticResults);
  const improvementPriorities = deriveImprovementPriorities(annualObjectives, diagnosticResults);
  const kpis = deriveKpis(diagnosticResults);

  const allObjectives = [...breakthroughObjectives, ...annualObjectives];
  const links = linkObjectivesToKpisWithKpis(allObjectives, kpis);

  const allActions = improvementPriorities.flatMap((p) => p.actions);
  const teamSize = Math.max(2, Math.min(7, Math.ceil(allActions.length / 3)));
  const assignments = assignResponsibilities(allActions, teamSize);

  return {
    matrix: {
      vision,
      breakthroughObjectives,
      annualObjectives,
      improvementPriorities,
      kpis,
      links,
      assignments,
    },
    generatedAt: new Date().toISOString(),
  };
}
