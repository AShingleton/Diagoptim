// ============================================================================
// DiagOptim - Adaptive Question Engine
// Core of the application: manages adaptive diagnostic conversations
//
// RULES:
// 1. NEVER more than 1 main question per screen (+ max 2 sub-questions)
// 2. Each question depends on ALL previous answers
// 3. If an uploaded document already answers a question -> SKIP
// 4. Conversational tone, human, no Lean jargon (except consultant mode)
// 5. Immediate feedback after every 3-5 answer blocks
// 6. Conditional branching: service company -> skip inventory/production questions
//
// FLOW:
// Phase 0: 3 framing questions (financial target, time horizon, autonomy)
// Phase 1: Company profiling (sector, size, revenue) -- enriched by documents/SIRENE
// Phase 2: 8 wastes diagnostic (adapted to sector)
// Phase 3: Deep-dive into 3 worst wastes (VSM, Ishikawa if relevant)
// Phase 4: Strategic analysis (SWOT, Porter if relevant)
// Phase 5: Recommendations + roadmap generation
// ============================================================================

import type { PrismaClient } from '@prisma/client';
import {
  type QuestionNode,
  type QuestionContext,
  type DiagnosticPhaseType,
  type SubscriptionTier,
  QUESTION_TREE,
  TOTAL_QUESTION_COUNT,
  getPhasesForType,
  planMeetsRequirement,
} from './decision-tree';
import {
  analyzeWastes,
  identifyTopWastes,
  type DiagnosticAnswerInput,
  type WasteAnalysisResult,
} from './waste-analyzer';

// ============================================================================
// TYPES
// ============================================================================

/** Result returned when requesting the next question */
export interface NextQuestionResult {
  /** The next question to display, or null if the phase/diagnostic is complete */
  question: QuestionNode | null;
  /** Follow-up questions (max 2) to display alongside the main question */
  followUps: QuestionNode[];
  /** Current diagnostic phase */
  phase: DiagnosticPhaseType;
  /** Progress through the entire diagnostic (0-100) */
  progressPercent: number;
  /** Number of questions answered so far */
  answeredCount: number;
  /** Total estimated questions remaining */
  remainingCount: number;
  /** Whether the diagnostic is complete (no more questions) */
  isComplete: boolean;
  /** Mini-insight to show (if a block of answers was just completed) */
  blockInsight: BlockInsight | null;
}

/** Result returned after submitting an answer */
export interface SubmitAnswerResult {
  /** Whether the answer was accepted and stored */
  success: boolean;
  /** Updated waste score if applicable */
  updatedScore: number | null;
  /** Whether this triggered a phase transition */
  phaseChanged: boolean;
  /** New phase if transition occurred */
  newPhase: DiagnosticPhaseType | null;
  /** Mini-insight triggered by this answer block (every 3-5 answers) */
  blockInsight: BlockInsight | null;
  /** Partial waste analysis snapshot (updated after waste questions) */
  wasteSnapshot: Partial<WasteAnalysisResult> | null;
}

/** Overall diagnostic progress */
export interface DiagnosticProgress {
  /** Current phase */
  currentPhase: DiagnosticPhaseType;
  /** Percentage complete (0-100) */
  progressPercent: number;
  /** Number of questions answered */
  answeredCount: number;
  /** Estimated remaining questions */
  remainingCount: number;
  /** Phase-level progress */
  phaseProgress: Record<DiagnosticPhaseType, { answered: number; total: number; complete: boolean }>;
  /** Time spent so far (minutes) */
  timeSpentMinutes: number;
  /** Estimated time remaining (minutes) */
  estimatedRemainingMinutes: number;
}

/** Mini-insight generated after a block of 3-5 answers */
export interface BlockInsight {
  /** Insight title */
  titleFr: string;
  titleEn: string;
  /** Insight description */
  descriptionFr: string;
  descriptionEn: string;
  /** Type of insight */
  type: 'strength' | 'weakness' | 'opportunity' | 'quick_win';
  /** Related waste category (if applicable) */
  relatedCategory: string | null;
  /** Estimated impact (EUR) if applicable */
  estimatedImpact: number | null;
}

/** Internal context built from all previous data */
export interface DiagnosticContext {
  /** Diagnostic ID */
  diagnosticId: string;
  /** Current phase */
  currentPhase: DiagnosticPhaseType;
  /** Diagnostic type */
  diagnosticType: string;
  /** Company profile */
  company: {
    sector: string;
    subsector: string;
    employeeCount: number;
    annualRevenue: number;
    clientCount: number;
  };
  /** User subscription plan */
  plan: SubscriptionTier;
  /** User locale */
  locale: 'fr' | 'en';
  /** All previous answers keyed by question ID */
  answers: Map<string, unknown>;
  /** All answer records for scoring */
  answerRecords: DiagnosticAnswerInput[];
  /** Document types that have been uploaded */
  documentsUploaded: string[];
  /** Questions already answered (by ID) */
  answeredQuestionIds: Set<string>;
  /** Answers since last block insight */
  answersSinceLastInsight: number;
  /** Total answers count */
  totalAnswerCount: number;
}

// ============================================================================
// QUESTION ENGINE
// ============================================================================

/**
 * The QuestionEngine manages adaptive diagnostic conversations.
 * It determines which question to ask next based on all accumulated context,
 * handles answer submission, scoring, phase transitions, and insight generation.
 */
export class QuestionEngine {
  /** Number of answers between block insights */
  private static readonly BLOCK_INSIGHT_INTERVAL = 4;

  constructor(private prisma: PrismaClient) {}

  // --------------------------------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------------------------------

  /**
   * Returns the next contextual question for this diagnostic.
   * Evaluates skip conditions, plan restrictions, and phase transitions.
   *
   * @param diagnosticId - The diagnostic to advance
   * @returns Next question and metadata
   */
  async getNextQuestion(diagnosticId: string): Promise<NextQuestionResult> {
    const context = await this.buildContext(diagnosticId);
    const phase = await this.determinePhase(diagnosticId);

    // Update phase in DB if it changed
    if (phase !== context.currentPhase) {
      await this.prisma.diagnostic.update({
        where: { id: diagnosticId },
        data: { currentPhase: phase },
      });
    }

    // Get ordered phases for this diagnostic type
    const phases = getPhasesForType(context.diagnosticType);
    const phaseIndex = phases.indexOf(phase);

    // Try to find the next unanswered question in the current phase, then subsequent phases
    for (let pi = phaseIndex; pi < phases.length; pi++) {
      const currentPhase = phases[pi];
      const questions = QUESTION_TREE[currentPhase] ?? [];

      const questionCtx = this.buildQuestionContext(context);

      for (const question of questions) {
        if (this.shouldSkipQuestion(question, questionCtx, context)) continue;

        // Collect follow-ups (max 2)
        const followUps = (question.followUp ?? [])
          .filter((fq) => !this.shouldSkipQuestion(fq, questionCtx, context))
          .slice(0, 2);

        // Check if we should show a block insight
        const blockInsight =
          context.answersSinceLastInsight >= QuestionEngine.BLOCK_INSIGHT_INTERVAL
            ? await this.generateBlockInsight(diagnosticId)
            : null;

        const progress = this.calculateProgress(context);

        return {
          question,
          followUps,
          phase: currentPhase,
          progressPercent: progress.progressPercent,
          answeredCount: progress.answeredCount,
          remainingCount: progress.remainingCount,
          isComplete: false,
          blockInsight,
        };
      }
    }

    // No more questions -> diagnostic is complete
    await this.prisma.diagnostic.update({
      where: { id: diagnosticId },
      data: {
        currentPhase: 'recommendations',
        status: 'completed',
        completedAt: new Date(),
      },
    });

    return {
      question: null,
      followUps: [],
      phase: 'recommendations',
      progressPercent: 100,
      answeredCount: context.totalAnswerCount,
      remainingCount: 0,
      isComplete: true,
      blockInsight: null,
    };
  }

  /**
   * Processes an answer, updates scores, decides branching.
   *
   * @param diagnosticId - The diagnostic being answered
   * @param questionKey - The question ID being answered
   * @param answer - The answer value
   * @returns Result with scoring and phase transition info
   */
  async submitAnswer(
    diagnosticId: string,
    questionKey: string,
    answer: unknown,
  ): Promise<SubmitAnswerResult> {
    const context = await this.buildContext(diagnosticId);

    // Find the question definition
    const question = this.findQuestion(questionKey);
    if (!question) {
      return {
        success: false,
        updatedScore: null,
        phaseChanged: false,
        newPhase: null,
        blockInsight: null,
        wasteSnapshot: null,
      };
    }

    // Calculate score for this answer
    const score = this.calculateAnswerScore(question, answer);

    // Store the answer
    await this.prisma.diagnosticAnswer.create({
      data: {
        diagnosticId,
        questionKey,
        questionText: context.locale === 'en' ? question.textEn : question.textFr,
        answer: JSON.parse(JSON.stringify(answer)),
        score,
        category: question.category,
        phase: question.phase,
      },
    });

    // Determine if phase should transition
    const newPhase = await this.determinePhase(diagnosticId);
    const phaseChanged = newPhase !== context.currentPhase;

    if (phaseChanged) {
      await this.prisma.diagnostic.update({
        where: { id: diagnosticId },
        data: { currentPhase: newPhase },
      });
    }

    // Generate block insight if threshold reached
    const answersSince = context.answersSinceLastInsight + 1;
    const blockInsight =
      answersSince >= QuestionEngine.BLOCK_INSIGHT_INTERVAL
        ? await this.generateBlockInsight(diagnosticId)
        : null;

    // Generate waste snapshot if we're in waste phase
    let wasteSnapshot: Partial<WasteAnalysisResult> | null = null;
    if (question.phase === 'wastes' || question.phase === 'deepening') {
      const updatedContext = await this.buildContext(diagnosticId);
      const analysis = analyzeWastes(
        updatedContext.answerRecords,
        updatedContext.company.sector,
        updatedContext.company.annualRevenue,
        updatedContext.company.employeeCount,
      );
      wasteSnapshot = {
        scores: analysis.scores,
        globalScore: analysis.globalScore,
        topWastes: analysis.topWastes,
      };

      // Update global score on diagnostic
      await this.prisma.diagnostic.update({
        where: { id: diagnosticId },
        data: { globalScore: analysis.globalScore },
      });
    }

    return {
      success: true,
      updatedScore: score,
      phaseChanged,
      newPhase: phaseChanged ? newPhase : null,
      blockInsight,
      wasteSnapshot,
    };
  }

  /**
   * Returns current diagnostic progress and partial insights.
   *
   * @param diagnosticId - The diagnostic to check
   * @returns Progress information
   */
  async getProgress(diagnosticId: string): Promise<DiagnosticProgress> {
    const context = await this.buildContext(diagnosticId);
    const progress = this.calculateProgress(context);

    const phases = getPhasesForType(context.diagnosticType);
    const phaseProgress: Record<DiagnosticPhaseType, { answered: number; total: number; complete: boolean }> =
      {} as Record<DiagnosticPhaseType, { answered: number; total: number; complete: boolean }>;

    for (const phase of phases) {
      const phaseQuestions = QUESTION_TREE[phase] ?? [];
      const questionCtx = this.buildQuestionContext(context);

      const applicableQuestions = phaseQuestions.filter(
        (q) => !this.shouldSkipQuestion(q, questionCtx, context),
      );
      const answeredInPhase = applicableQuestions.filter(
        (q) => context.answeredQuestionIds.has(q.id),
      ).length;

      phaseProgress[phase] = {
        answered: answeredInPhase,
        total: applicableQuestions.length,
        complete: answeredInPhase >= applicableQuestions.length,
      };
    }

    // Estimate time: ~30 seconds per question
    const timeSpentMinutes = Math.round((context.totalAnswerCount * 0.5));
    const estimatedRemainingMinutes = Math.round((progress.remainingCount * 0.5));

    return {
      currentPhase: context.currentPhase,
      progressPercent: progress.progressPercent,
      answeredCount: progress.answeredCount,
      remainingCount: progress.remainingCount,
      phaseProgress,
      timeSpentMinutes,
      estimatedRemainingMinutes,
    };
  }

  /**
   * Marks questions as answered by document extraction.
   * When a document provides data that answers diagnostic questions, those
   * questions are skipped and auto-answered from extracted data.
   *
   * @param diagnosticId - The diagnostic
   * @param documentId - The document that was processed
   * @returns Array of question IDs that were auto-answered
   */
  async skipQuestionsFromDocument(
    diagnosticId: string,
    documentId: string,
  ): Promise<string[]> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document || !document.extractedData) {
      return [];
    }

    const extractedData = document.extractedData as Record<string, unknown>;
    const skippedQuestionIds: string[] = [];

    // Map document data to question answers
    const docMappings = this.getDocumentToQuestionMappings(document.type);

    for (const mapping of docMappings) {
      const value = extractedData[mapping.dataField];
      if (value === undefined || value === null) continue;

      // Check if question was already answered
      const existing = await this.prisma.diagnosticAnswer.findFirst({
        where: { diagnosticId, questionKey: mapping.questionId },
      });

      if (existing) continue;

      // Auto-answer the question
      await this.prisma.diagnosticAnswer.create({
        data: {
          diagnosticId,
          questionKey: mapping.questionId,
          questionText: `[Auto-rempli depuis ${document.type}]`,
          answer: { value, source: 'document', documentId },
          score: null,
          category: mapping.category,
          phase: mapping.phase,
        },
      });

      skippedQuestionIds.push(mapping.questionId);
    }

    return skippedQuestionIds;
  }

  /**
   * Generates a mini-insight after a block of answers.
   * Called every 3-5 answers to provide immediate feedback.
   *
   * @param diagnosticId - The diagnostic
   * @returns A block insight
   */
  async generateBlockInsight(diagnosticId: string): Promise<BlockInsight> {
    const context = await this.buildContext(diagnosticId);
    const recentAnswers = context.answerRecords.slice(-QuestionEngine.BLOCK_INSIGHT_INTERVAL);

    // Determine the dominant category in recent answers
    const categoryCounts = new Map<string, number>();
    for (const answer of recentAnswers) {
      const count = categoryCounts.get(answer.category) ?? 0;
      categoryCounts.set(answer.category, count + 1);
    }

    const dominantCategory = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'general';

    // Calculate average score for recent answers
    const scoredAnswers = recentAnswers.filter((a) => a.score !== null);
    const avgScore =
      scoredAnswers.length > 0
        ? scoredAnswers.reduce((s, a) => s + (a.score ?? 0), 0) / scoredAnswers.length
        : 5;

    // Generate insight based on score level
    if (avgScore <= 3) {
      return {
        titleFr: 'Bon point !',
        titleEn: 'Good point!',
        descriptionFr: `Vos reponses montrent de bonnes pratiques dans le domaine "${this.getCategoryLabel(dominantCategory, 'fr')}". C'est un atout pour votre entreprise.`,
        descriptionEn: `Your answers show good practices in "${this.getCategoryLabel(dominantCategory, 'en')}". This is an asset for your company.`,
        type: 'strength',
        relatedCategory: dominantCategory,
        estimatedImpact: null,
      };
    } else if (avgScore <= 5) {
      return {
        titleFr: 'Piste d\'amelioration',
        titleEn: 'Improvement opportunity',
        descriptionFr: `Le domaine "${this.getCategoryLabel(dominantCategory, 'fr')}" presente des marges de progression. De petites actions pourraient faire une difference.`,
        descriptionEn: `The area of "${this.getCategoryLabel(dominantCategory, 'en')}" has room for improvement. Small actions could make a difference.`,
        type: 'opportunity',
        relatedCategory: dominantCategory,
        estimatedImpact: null,
      };
    } else if (avgScore <= 7) {
      const estimatedImpact = context.company.annualRevenue > 0
        ? Math.round(context.company.annualRevenue * 0.005 * (avgScore / 10))
        : null;
      return {
        titleFr: 'Point d\'attention',
        titleEn: 'Attention point',
        descriptionFr: `Le domaine "${this.getCategoryLabel(dominantCategory, 'fr')}" merite une attention particuliere. Des gains rapides sont probablement possibles.`,
        descriptionEn: `The "${this.getCategoryLabel(dominantCategory, 'en')}" area deserves special attention. Quick wins are likely possible.`,
        type: 'quick_win',
        relatedCategory: dominantCategory,
        estimatedImpact,
      };
    } else {
      const estimatedImpact = context.company.annualRevenue > 0
        ? Math.round(context.company.annualRevenue * 0.01 * (avgScore / 10))
        : null;
      return {
        titleFr: 'Alerte gaspillage',
        titleEn: 'Waste alert',
        descriptionFr: `Le domaine "${this.getCategoryLabel(dominantCategory, 'fr')}" montre un niveau de gaspillage important. C'est une priorite d'amelioration.`,
        descriptionEn: `The "${this.getCategoryLabel(dominantCategory, 'en')}" area shows a significant waste level. This is an improvement priority.`,
        type: 'weakness',
        relatedCategory: dominantCategory,
        estimatedImpact,
      };
    }
  }

  // --------------------------------------------------------------------------
  // PRIVATE METHODS
  // --------------------------------------------------------------------------

  /**
   * Determines which phase should be active based on answers.
   * Evaluates completion of each phase sequentially.
   */
  private async determinePhase(diagnosticId: string): Promise<DiagnosticPhaseType> {
    const diagnostic = await this.prisma.diagnostic.findUniqueOrThrow({
      where: { id: diagnosticId },
      include: { answers: true },
    });

    const phases = getPhasesForType(diagnostic.type);
    const answeredKeys = new Set(diagnostic.answers.map((a: { questionKey: string }) => a.questionKey));

    for (const phase of phases) {
      const phaseQuestions = QUESTION_TREE[phase] ?? [];

      // Documents and recommendations phases have no questions
      if (phaseQuestions.length === 0) continue;

      // Check if any questions in this phase are still unanswered
      const hasUnanswered = phaseQuestions.some((q) => !answeredKeys.has(q.id));

      if (hasUnanswered) {
        return phase;
      }
    }

    return 'recommendations';
  }

  /**
   * Builds complete context from all previous answers and company data.
   */
  private async buildContext(diagnosticId: string): Promise<DiagnosticContext> {
    const diagnostic = await this.prisma.diagnostic.findUniqueOrThrow({
      where: { id: diagnosticId },
      include: {
        company: {
          include: {
            documents: { select: { type: true } },
            user: {
              include: { subscription: { select: { plan: true } } },
            },
          },
        },
        answers: { orderBy: { createdAt: 'asc' } },
      },
    });

    const answers = new Map<string, unknown>();
    const answerRecords: DiagnosticAnswerInput[] = [];
    const answeredQuestionIds = new Set<string>();

    for (const answer of diagnostic.answers) {
      answers.set(answer.questionKey, answer.answer);
      answeredQuestionIds.add(answer.questionKey);
      answerRecords.push({
        questionKey: answer.questionKey,
        answer: answer.answer,
        score: answer.score,
        category: answer.category,
      });
    }

    const documentsUploaded = diagnostic.company.documents.map((d: { type: string }) => d.type);
    const plan = (diagnostic.company.user.subscription?.plan ?? 'free') as SubscriptionTier;
    const locale = (diagnostic.company.user.locale ?? 'fr') as 'fr' | 'en';

    // Count answers since last insight (we generate insights every BLOCK_INSIGHT_INTERVAL answers)
    const answersSinceLastInsight =
      diagnostic.answers.length % QuestionEngine.BLOCK_INSIGHT_INTERVAL;

    return {
      diagnosticId,
      currentPhase: diagnostic.currentPhase as DiagnosticPhaseType,
      diagnosticType: diagnostic.type,
      company: {
        sector: diagnostic.company.sector,
        subsector: diagnostic.company.subsector,
        employeeCount: diagnostic.company.employeeCount,
        annualRevenue: diagnostic.company.annualRevenue,
        clientCount: diagnostic.company.clientCount,
      },
      plan,
      locale,
      answers,
      answerRecords,
      documentsUploaded,
      answeredQuestionIds,
      answersSinceLastInsight,
      totalAnswerCount: diagnostic.answers.length,
    };
  }

  /**
   * Determines if a question should be skipped in the current context.
   */
  private shouldSkipQuestion(
    question: QuestionNode,
    questionCtx: QuestionContext,
    context: DiagnosticContext,
  ): boolean {
    // Already answered
    if (context.answeredQuestionIds.has(question.id)) return true;

    // Plan restriction
    if (!planMeetsRequirement(context.plan, question.requiresPlan)) return true;

    // Custom skip condition
    if (question.skipIf && question.skipIf(questionCtx)) return true;

    return false;
  }

  /**
   * Converts internal context to the QuestionContext interface expected by skip conditions.
   */
  private buildQuestionContext(context: DiagnosticContext): QuestionContext {
    return {
      sector: context.company.sector,
      subsector: context.company.subsector,
      employeeCount: context.company.employeeCount,
      annualRevenue: context.company.annualRevenue,
      answers: context.answers,
      documentsUploaded: context.documentsUploaded,
      plan: context.plan,
      locale: context.locale,
    };
  }

  /**
   * Calculates the numeric score for a given answer.
   * Scale questions: direct 1-10 score.
   * Choice questions: mapped to score based on option position.
   * Boolean questions: true=1, false=10 (or reversed based on question intent).
   */
  private calculateAnswerScore(question: QuestionNode, answer: unknown): number | null {
    if (question.scoringWeight === 0) return null;

    switch (question.type) {
      case 'scale': {
        const val = typeof answer === 'number' ? answer : Number(answer);
        return isNaN(val) ? null : Math.max(1, Math.min(10, val));
      }

      case 'choice': {
        if (!question.options) return null;
        const answerStr = String(answer);
        const index = question.options.findIndex((o) => o.value === answerStr);
        if (index === -1) return null;
        // Map option position to 1-10 scale (first option = lowest score)
        return Math.round(1 + (index / Math.max(1, question.options.length - 1)) * 9);
      }

      case 'boolean': {
        const boolVal = answer === true || answer === 'true' || answer === 'yes';
        // For most waste questions, "yes" = problem exists = high score
        return boolVal ? 8 : 2;
      }

      case 'number': {
        return null; // Number questions are for data collection, not scoring
      }

      case 'text':
      case 'multi_select':
      default:
        return null;
    }
  }

  /**
   * Calculates overall progress metrics.
   */
  private calculateProgress(context: DiagnosticContext): {
    progressPercent: number;
    answeredCount: number;
    remainingCount: number;
  } {
    const questionCtx = this.buildQuestionContext(context);
    const phases = getPhasesForType(context.diagnosticType);

    let totalApplicable = 0;
    let totalAnswered = 0;

    for (const phase of phases) {
      const questions = QUESTION_TREE[phase] ?? [];
      for (const q of questions) {
        if (!this.shouldSkipQuestion(q, questionCtx, { ...context, answeredQuestionIds: new Set() })) {
          totalApplicable++;
          if (context.answeredQuestionIds.has(q.id)) {
            totalAnswered++;
          }
        }
      }
    }

    const progressPercent = totalApplicable > 0
      ? Math.round((totalAnswered / totalApplicable) * 100)
      : 0;

    return {
      progressPercent,
      answeredCount: totalAnswered,
      remainingCount: totalApplicable - totalAnswered,
    };
  }

  /**
   * Finds a question definition by its ID across all phases.
   */
  private findQuestion(questionKey: string): QuestionNode | null {
    for (const phase of Object.values(QUESTION_TREE)) {
      for (const question of phase) {
        if (question.id === questionKey) return question;

        // Check follow-ups
        if (question.followUp) {
          for (const fu of question.followUp) {
            if (fu.id === questionKey) return fu;
          }
        }
      }
    }
    return null;
  }

  /**
   * Returns questions that can be skipped based on sector and existing answers.
   */
  private getSkippableQuestions(
    sector: string,
    answers: Map<string, unknown>,
  ): Set<string> {
    const skippable = new Set<string>();
    const questionCtx: QuestionContext = {
      sector,
      subsector: '',
      employeeCount: 0,
      annualRevenue: 0,
      answers,
      documentsUploaded: [],
      plan: 'free',
      locale: 'fr',
    };

    for (const phase of Object.values(QUESTION_TREE)) {
      for (const question of phase) {
        if (question.skipIf && question.skipIf(questionCtx)) {
          skippable.add(question.id);
        }
      }
    }

    return skippable;
  }

  /**
   * Maps document types to the questions they can auto-answer.
   */
  private getDocumentToQuestionMappings(
    documentType: string,
  ): Array<{ dataField: string; questionId: string; category: string; phase: string }> {
    const mappings: Record<
      string,
      Array<{ dataField: string; questionId: string; category: string; phase: string }>
    > = {
      balance_sheet: [
        { dataField: 'revenue', questionId: 'profile_revenue', category: 'profile', phase: 'profile' },
        { dataField: 'employeeCount', questionId: 'profile_employees', category: 'profile', phase: 'profile' },
      ],
      invoice: [
        { dataField: 'clientCount', questionId: 'profile_clients', category: 'profile', phase: 'profile' },
      ],
      brochure_company: [
        { dataField: 'sector', questionId: 'profile_sector', category: 'profile', phase: 'profile' },
        { dataField: 'products', questionId: 'profile_products', category: 'profile', phase: 'profile' },
      ],
      insurance: [],
      quote: [],
      brochure_client: [],
    };

    return mappings[documentType] ?? [];
  }

  /**
   * Returns a human-readable label for a waste/question category.
   */
  private getCategoryLabel(category: string, locale: 'fr' | 'en'): string {
    const labels: Record<string, { fr: string; en: string }> = {
      framing: { fr: 'Cadrage', en: 'Framing' },
      profile: { fr: 'Profil', en: 'Profile' },
      transport: { fr: 'Transport', en: 'Transport' },
      inventory: { fr: 'Stocks', en: 'Inventory' },
      motion: { fr: 'Mouvements', en: 'Motion' },
      waiting: { fr: 'Attentes', en: 'Waiting' },
      overproduction: { fr: 'Surproduction', en: 'Overproduction' },
      overprocessing: { fr: 'Sur-traitement', en: 'Overprocessing' },
      defects: { fr: 'Defauts', en: 'Defects' },
      skills: { fr: 'Competences', en: 'Skills' },
      deepening: { fr: 'Approfondissement', en: 'Deepening' },
      swot: { fr: 'Analyse strategique', en: 'Strategic analysis' },
      porter: { fr: 'Forces concurrentielles', en: 'Competitive forces' },
      general: { fr: 'General', en: 'General' },
    };

    return labels[category]?.[locale] ?? category;
  }
}
