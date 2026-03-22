// ============================================================================
// DiagOptim - Value Stream Mapping (VSM) Engine
// Generates current-state and future-state VSM from diagnostic answers
// ============================================================================

import type { PrismaClient } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

/** A single step in the value stream */
export interface VsmStep {
  /** Unique step identifier */
  id: string;
  /** Step name */
  name: string;
  /** Description of what happens in this step */
  description: string;
  /** Processing time in minutes (value-added time) */
  processTimeMinutes: number;
  /** Lead time in minutes (total elapsed time including waits) */
  leadTimeMinutes: number;
  /** Wait time before this step begins (in minutes) */
  waitTimeMinutes: number;
  /** Number of people involved */
  operators: number;
  /** First-pass yield / quality rate (0-1) */
  qualityRate: number;
  /** Whether this step is value-added from customer perspective */
  isValueAdded: boolean;
  /** Work-in-progress count (items waiting or being processed) */
  wipCount: number;
  /** Tools/systems used at this step */
  tools: string[];
  /** Order index in the process */
  order: number;
}

/** A bottleneck identified in the value stream */
export interface Bottleneck {
  /** Step where the bottleneck occurs */
  stepId: string;
  /** Step name */
  stepName: string;
  /** Type of bottleneck */
  type: 'capacity' | 'quality' | 'wait' | 'handoff' | 'batch';
  /** Severity (0-100) */
  severity: number;
  /** Description of the bottleneck */
  descriptionFr: string;
  /** English description */
  descriptionEn: string;
  /** Suggested countermeasure */
  suggestedActionFr: string;
  /** English suggested action */
  suggestedActionEn: string;
  /** Estimated time savings if resolved (minutes per cycle) */
  estimatedSavingsMinutes: number;
}

/** Improvement suggestion for future state */
export interface VsmImprovement {
  /** Target step ID */
  stepId: string;
  /** Type of improvement */
  type: 'eliminate' | 'combine' | 'reduce' | 'automate' | 'parallelize';
  /** Description */
  descriptionFr: string;
  descriptionEn: string;
  /** Estimated new process time after improvement */
  newProcessTimeMinutes: number;
  /** Estimated new lead time after improvement */
  newLeadTimeMinutes: number;
}

/** Complete VSM analysis result */
export interface VsmResult {
  /** Diagnostic ID this VSM belongs to */
  diagnosticId: string;
  /** Process being mapped */
  processName: string;
  /** Current state steps */
  currentState: VsmStep[];
  /** Future state steps (after improvements) */
  futureState: VsmStep[];
  /** Identified bottlenecks */
  bottlenecks: Bottleneck[];
  /** Improvement suggestions */
  improvements: VsmImprovement[];
  /** Total current lead time in minutes */
  totalLeadTime: number;
  /** Total current process time in minutes */
  totalProcessTime: number;
  /** Current process efficiency (process time / lead time) */
  currentEfficiency: number;
  /** Projected future lead time */
  futureLeadTime: number;
  /** Projected future process time */
  futureProcessTime: number;
  /** Projected future efficiency */
  futureEfficiency: number;
  /** Potential time savings */
  timeSavingsPercent: number;
}

/** Raw answer for VSM context */
export interface VsmAnswerInput {
  questionKey: string;
  answer: unknown;
  category: string;
}

// ============================================================================
// VSM ENGINE
// ============================================================================

export class VsmEngine {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generates a complete VSM analysis from diagnostic answers and process description.
   *
   * @param diagnosticId - The diagnostic this VSM belongs to
   * @param processName - Name of the process being mapped
   * @param answers - Relevant diagnostic answers
   * @param processDescription - Free-text description of the process steps
   * @returns Complete VSM result
   */
  async generateVsm(
    diagnosticId: string,
    processName: string,
    answers: VsmAnswerInput[],
    processDescription?: string,
  ): Promise<VsmResult> {
    // Parse process steps from description or use default generic flow
    const currentState = processDescription
      ? this.parseProcessDescription(processDescription)
      : this.buildDefaultProcessSteps(answers);

    // Enrich steps with waste data from answers
    this.enrichStepsFromAnswers(currentState, answers);

    // Identify bottlenecks
    const bottlenecks = identifyBottlenecks(currentState);

    // Generate future state
    const { futureState, improvements } = generateFutureState(currentState, bottlenecks);

    // Calculate metrics
    const totalLeadTime = calculateLeadTime(currentState);
    const totalProcessTime = calculateProcessTime(currentState);
    const currentEfficiency = calculateEfficiency(totalLeadTime, totalProcessTime);

    const futureLeadTime = calculateLeadTime(futureState);
    const futureProcessTime = calculateProcessTime(futureState);
    const futureEfficiency = calculateEfficiency(futureLeadTime, futureProcessTime);

    const timeSavingsPercent =
      totalLeadTime > 0
        ? Math.round(((totalLeadTime - futureLeadTime) / totalLeadTime) * 100)
        : 0;

    const result: VsmResult = {
      diagnosticId,
      processName,
      currentState,
      futureState,
      bottlenecks,
      improvements,
      totalLeadTime,
      totalProcessTime,
      currentEfficiency,
      futureLeadTime,
      futureProcessTime,
      futureEfficiency,
      timeSavingsPercent,
    };

    // Persist to database
    await this.prisma.vsmMap.create({
      data: {
        diagnosticId,
        processName,
        steps: JSON.parse(JSON.stringify(currentState)),
        bottlenecks: JSON.parse(JSON.stringify(bottlenecks)),
        currentState: JSON.parse(JSON.stringify(currentState)),
        futureState: JSON.parse(JSON.stringify(futureState)),
      },
    });

    return result;
  }

  /**
   * Parses a free-text process description into structured VSM steps.
   */
  private parseProcessDescription(description: string): VsmStep[] {
    const lines = description
      .split(/[\n;,]/)
      .map((l) => l.trim())
      .filter((l) => l.length > 2);

    return lines.map((line, index) => ({
      id: `step_${index + 1}`,
      name: line.length > 50 ? line.substring(0, 50) + '...' : line,
      description: line,
      processTimeMinutes: 30, // Default — will be enriched
      leadTimeMinutes: 60,
      waitTimeMinutes: 30,
      operators: 1,
      qualityRate: 0.95,
      isValueAdded: true,
      wipCount: 1,
      tools: [],
      order: index,
    }));
  }

  /**
   * Builds a default generic process flow when no description is provided.
   */
  private buildDefaultProcessSteps(_answers: VsmAnswerInput[]): VsmStep[] {
    const defaultSteps: Partial<VsmStep>[] = [
      { name: 'Reception commande', description: 'Reception et enregistrement de la commande client', isValueAdded: false },
      { name: 'Planification', description: 'Planification de la production ou du service', isValueAdded: false },
      { name: 'Approvisionnement', description: 'Approvisionnement en matieres ou ressources', isValueAdded: false },
      { name: 'Production / Realisation', description: 'Execution du travail principal', isValueAdded: true },
      { name: 'Controle qualite', description: 'Verification de la conformite', isValueAdded: false },
      { name: 'Expedition / Livraison', description: 'Envoi au client ou livraison du service', isValueAdded: true },
      { name: 'Facturation', description: 'Emission et envoi de la facture', isValueAdded: false },
    ];

    return defaultSteps.map((step, index) => ({
      id: `step_${index + 1}`,
      name: step.name ?? `Etape ${index + 1}`,
      description: step.description ?? '',
      processTimeMinutes: step.isValueAdded ? 60 : 20,
      leadTimeMinutes: step.isValueAdded ? 90 : 45,
      waitTimeMinutes: 25,
      operators: 1,
      qualityRate: 0.95,
      isValueAdded: step.isValueAdded ?? false,
      wipCount: 1,
      tools: [],
      order: index,
    }));
  }

  /**
   * Enriches VSM steps with data extracted from waste diagnostic answers.
   */
  private enrichStepsFromAnswers(steps: VsmStep[], answers: VsmAnswerInput[]): void {
    // High waiting score -> increase wait times
    const waitingAnswers = answers.filter((a) => a.category === 'waiting');
    if (waitingAnswers.length > 0) {
      const avgWaitScore = this.averageScore(waitingAnswers);
      for (const step of steps) {
        if (!step.isValueAdded) {
          step.waitTimeMinutes = Math.round(step.waitTimeMinutes * (1 + avgWaitScore / 10));
          step.leadTimeMinutes = step.processTimeMinutes + step.waitTimeMinutes;
        }
      }
    }

    // High defect score -> reduce quality rates
    const defectAnswers = answers.filter((a) => a.category === 'defects');
    if (defectAnswers.length > 0) {
      const avgDefectScore = this.averageScore(defectAnswers);
      for (const step of steps) {
        if (step.isValueAdded) {
          step.qualityRate = Math.max(0.5, step.qualityRate - avgDefectScore / 100);
        }
      }
    }

    // High overprocessing -> mark some VA steps as non-VA
    const opAnswers = answers.filter((a) => a.category === 'overprocessing');
    if (opAnswers.length > 0) {
      const avgOpScore = this.averageScore(opAnswers);
      if (avgOpScore > 6) {
        // Add a synthetic overprocessing step
        const lastVA = steps.findIndex((s) => s.isValueAdded);
        if (lastVA >= 0) {
          steps[lastVA].processTimeMinutes = Math.round(
            steps[lastVA].processTimeMinutes * (1 + avgOpScore / 20),
          );
          steps[lastVA].leadTimeMinutes =
            steps[lastVA].processTimeMinutes + steps[lastVA].waitTimeMinutes;
        }
      }
    }

    // Recalculate lead times
    for (const step of steps) {
      step.leadTimeMinutes = step.processTimeMinutes + step.waitTimeMinutes;
    }
  }

  /**
   * Computes average numeric score from answers.
   */
  private averageScore(answers: VsmAnswerInput[]): number {
    const numericAnswers = answers
      .map((a) => {
        const val = typeof a.answer === 'number' ? a.answer : Number(a.answer);
        return isNaN(val) ? null : val;
      })
      .filter((v): v is number => v !== null);

    return numericAnswers.length > 0
      ? numericAnswers.reduce((s, v) => s + v, 0) / numericAnswers.length
      : 5;
  }
}

// ============================================================================
// PURE FUNCTIONS (exported for testing and standalone use)
// ============================================================================

/**
 * Identifies bottlenecks in a value stream.
 *
 * @param steps - Ordered VSM steps
 * @returns Array of identified bottlenecks, sorted by severity
 */
export function identifyBottlenecks(steps: VsmStep[]): Bottleneck[] {
  const bottlenecks: Bottleneck[] = [];

  if (steps.length === 0) return bottlenecks;

  const avgProcessTime =
    steps.reduce((s, st) => s + st.processTimeMinutes, 0) / steps.length;
  const avgWaitTime =
    steps.reduce((s, st) => s + st.waitTimeMinutes, 0) / steps.length;

  for (const step of steps) {
    // Capacity bottleneck: process time significantly above average
    if (step.processTimeMinutes > avgProcessTime * 1.5) {
      bottlenecks.push({
        stepId: step.id,
        stepName: step.name,
        type: 'capacity',
        severity: Math.min(100, Math.round(((step.processTimeMinutes / avgProcessTime) - 1) * 100)),
        descriptionFr: `L'etape "${step.name}" prend ${step.processTimeMinutes} min, soit ${Math.round(step.processTimeMinutes / avgProcessTime * 100 - 100)}% de plus que la moyenne.`,
        descriptionEn: `Step "${step.name}" takes ${step.processTimeMinutes} min, ${Math.round(step.processTimeMinutes / avgProcessTime * 100 - 100)}% above average.`,
        suggestedActionFr: 'Analyser la charge de travail, envisager un doublement de poste ou une automatisation partielle.',
        suggestedActionEn: 'Analyze workload, consider doubling the station or partial automation.',
        estimatedSavingsMinutes: Math.round(step.processTimeMinutes - avgProcessTime),
      });
    }

    // Wait bottleneck: excessive wait time
    if (step.waitTimeMinutes > avgWaitTime * 2 && step.waitTimeMinutes > 30) {
      bottlenecks.push({
        stepId: step.id,
        stepName: step.name,
        type: 'wait',
        severity: Math.min(100, Math.round(((step.waitTimeMinutes / avgWaitTime) - 1) * 80)),
        descriptionFr: `Temps d'attente excessif avant "${step.name}" : ${step.waitTimeMinutes} min.`,
        descriptionEn: `Excessive wait time before "${step.name}": ${step.waitTimeMinutes} min.`,
        suggestedActionFr: 'Mettre en place un systeme de flux tire (pull) ou reduire la taille des lots.',
        suggestedActionEn: 'Implement a pull system or reduce batch sizes.',
        estimatedSavingsMinutes: Math.round(step.waitTimeMinutes - avgWaitTime),
      });
    }

    // Quality bottleneck: low first-pass yield
    if (step.qualityRate < 0.90) {
      bottlenecks.push({
        stepId: step.id,
        stepName: step.name,
        type: 'quality',
        severity: Math.min(100, Math.round((1 - step.qualityRate) * 200)),
        descriptionFr: `Taux de qualite faible a l'etape "${step.name}" : ${Math.round(step.qualityRate * 100)}%. Retouches frequentes.`,
        descriptionEn: `Low quality rate at step "${step.name}": ${Math.round(step.qualityRate * 100)}%. Frequent rework.`,
        suggestedActionFr: 'Mettre en place un poka-yoke (detrompeur) ou renforcer les standards visuels.',
        suggestedActionEn: 'Implement poka-yoke (error-proofing) or reinforce visual standards.',
        estimatedSavingsMinutes: Math.round(step.processTimeMinutes * (1 - step.qualityRate)),
      });
    }

    // High WIP bottleneck
    if (step.wipCount > 5) {
      bottlenecks.push({
        stepId: step.id,
        stepName: step.name,
        type: 'batch',
        severity: Math.min(100, step.wipCount * 10),
        descriptionFr: `En-cours eleve a l'etape "${step.name}" : ${step.wipCount} elements en attente.`,
        descriptionEn: `High WIP at step "${step.name}": ${step.wipCount} items in queue.`,
        suggestedActionFr: 'Reduire la taille des lots et introduire des limites WIP.',
        suggestedActionEn: 'Reduce batch sizes and introduce WIP limits.',
        estimatedSavingsMinutes: Math.round(step.waitTimeMinutes * 0.3),
      });
    }
  }

  // Sort by severity descending
  bottlenecks.sort((a, b) => b.severity - a.severity);

  return bottlenecks;
}

/**
 * Calculates total lead time (sum of all step lead times).
 *
 * @param steps - VSM steps
 * @returns Total lead time in minutes
 */
export function calculateLeadTime(steps: VsmStep[]): number {
  return steps.reduce((total, step) => total + step.leadTimeMinutes, 0);
}

/**
 * Calculates total process time (sum of actual processing times only).
 *
 * @param steps - VSM steps
 * @returns Total process time in minutes
 */
export function calculateProcessTime(steps: VsmStep[]): number {
  return steps.reduce((total, step) => total + step.processTimeMinutes, 0);
}

/**
 * Calculates process cycle efficiency (PCE).
 * PCE = Process Time / Lead Time.
 * World-class is typically > 25%.
 *
 * @param leadTime - Total lead time
 * @param processTime - Total process time
 * @returns Efficiency ratio (0-1)
 */
export function calculateEfficiency(leadTime: number, processTime: number): number {
  if (leadTime <= 0) return 0;
  return Math.round((processTime / leadTime) * 100) / 100;
}

/**
 * Generates a future-state VSM by applying improvements to bottlenecks.
 *
 * @param currentState - Current VSM steps
 * @param bottlenecks - Identified bottlenecks
 * @returns Future state steps and improvement descriptions
 */
export function generateFutureState(
  currentState: VsmStep[],
  bottlenecks: Bottleneck[],
): { futureState: VsmStep[]; improvements: VsmImprovement[] } {
  // Deep clone current state
  const futureState: VsmStep[] = currentState.map((s) => ({ ...s }));
  const improvements: VsmImprovement[] = [];

  const bottleneckStepIds = new Set(bottlenecks.map((b) => b.stepId));

  for (const step of futureState) {
    if (!bottleneckStepIds.has(step.id)) continue;

    const stepBottlenecks = bottlenecks.filter((b) => b.stepId === step.id);
    const originalProcess = step.processTimeMinutes;
    const originalLead = step.leadTimeMinutes;

    for (const bn of stepBottlenecks) {
      switch (bn.type) {
        case 'capacity':
          // Reduce process time by splitting or automating
          step.processTimeMinutes = Math.round(step.processTimeMinutes * 0.65);
          improvements.push({
            stepId: step.id,
            type: 'automate',
            descriptionFr: `Automatiser partiellement l'etape "${step.name}" pour reduire le temps de traitement.`,
            descriptionEn: `Partially automate step "${step.name}" to reduce processing time.`,
            newProcessTimeMinutes: step.processTimeMinutes,
            newLeadTimeMinutes: step.processTimeMinutes + step.waitTimeMinutes,
          });
          break;

        case 'wait':
          // Reduce wait time through pull system
          step.waitTimeMinutes = Math.round(step.waitTimeMinutes * 0.4);
          improvements.push({
            stepId: step.id,
            type: 'reduce',
            descriptionFr: `Reduire les attentes avant "${step.name}" via un systeme de flux tire.`,
            descriptionEn: `Reduce wait times before "${step.name}" through a pull system.`,
            newProcessTimeMinutes: step.processTimeMinutes,
            newLeadTimeMinutes: step.processTimeMinutes + step.waitTimeMinutes,
          });
          break;

        case 'quality':
          // Improve quality rate
          step.qualityRate = Math.min(0.99, step.qualityRate + 0.08);
          improvements.push({
            stepId: step.id,
            type: 'reduce',
            descriptionFr: `Mettre en place des controles anti-erreur a l'etape "${step.name}".`,
            descriptionEn: `Implement error-proofing controls at step "${step.name}".`,
            newProcessTimeMinutes: step.processTimeMinutes,
            newLeadTimeMinutes: step.processTimeMinutes + step.waitTimeMinutes,
          });
          break;

        case 'batch':
          // Reduce WIP and batch sizes
          step.wipCount = Math.max(1, Math.round(step.wipCount * 0.3));
          step.waitTimeMinutes = Math.round(step.waitTimeMinutes * 0.6);
          improvements.push({
            stepId: step.id,
            type: 'reduce',
            descriptionFr: `Reduire les lots et introduire des limites d'en-cours a l'etape "${step.name}".`,
            descriptionEn: `Reduce batch sizes and introduce WIP limits at step "${step.name}".`,
            newProcessTimeMinutes: step.processTimeMinutes,
            newLeadTimeMinutes: step.processTimeMinutes + step.waitTimeMinutes,
          });
          break;

        case 'handoff':
          // Eliminate handoff by combining steps
          improvements.push({
            stepId: step.id,
            type: 'combine',
            descriptionFr: `Combiner les etapes autour de "${step.name}" pour reduire les transferts.`,
            descriptionEn: `Combine steps around "${step.name}" to reduce handoffs.`,
            newProcessTimeMinutes: step.processTimeMinutes,
            newLeadTimeMinutes: step.processTimeMinutes + step.waitTimeMinutes,
          });
          break;
      }
    }

    // Recalculate lead time
    step.leadTimeMinutes = step.processTimeMinutes + step.waitTimeMinutes;

    // Only record improvement if something actually changed
    if (step.processTimeMinutes === originalProcess && step.leadTimeMinutes === originalLead) {
      // No change, remove last improvement
      const lastImprovement = improvements[improvements.length - 1];
      if (lastImprovement?.stepId === step.id) {
        improvements.pop();
      }
    }
  }

  // Remove non-value-added steps that have zero-impact in future state
  const optimizedFuture = futureState.filter((step) => {
    if (step.isValueAdded) return true;
    // Keep NVA steps but flag them
    return true;
  });

  return { futureState: optimizedFuture, improvements };
}
