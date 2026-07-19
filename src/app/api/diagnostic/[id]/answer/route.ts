/**
 * POST /api/diagnostic/[id]/answer
 * Submit an answer to a diagnostic question.
 * Uses QuestionEngine.submitAnswer() to process, score, and handle branching.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { QuestionEngine } from '@/lib/diagnostic/question-engine';
import { canAccessDiagnostic } from '@/lib/diagnostic/access';
import { QUESTION_TREE, type QuestionNode } from '@/lib/diagnostic/decision-tree';
import { generateScopingFollowUp } from '@/lib/ai/engine';

const answerSchema = z.object({
  questionKey: z.string().min(1),
  answer: z.unknown(),
});

/** Minimum answer length (chars) before an adaptive follow-up is worth asking. */
const SCOPING_FOLLOWUP_MIN_LENGTH = 40;

/** Finds a question definition (top-level or follow-up) by its id. */
function findQuestionNode(questionKey: string): QuestionNode | null {
  for (const phase of Object.values(QUESTION_TREE)) {
    for (const question of phase) {
      if (question.id === questionKey) return question;
      if (question.followUp) {
        for (const fu of question.followUp) {
          if (fu.id === questionKey) return fu;
        }
      }
    }
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: diagnosticId } = await params;

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const diagnostic = await prisma.diagnostic.findUnique({
      where: { id: diagnosticId },
      include: { company: { select: { userId: true, sector: true } } },
    });

    if (!diagnostic) {
      return NextResponse.json({ error: 'Diagnostic not found' }, { status: 404 });
    }

    if (!(await canAccessDiagnostic(prisma, diagnosticId, userId))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (diagnostic.status === 'completed') {
      return NextResponse.json(
        { error: 'Diagnostic already completed' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = answerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { questionKey, answer } = parsed.data;

    const engine = new QuestionEngine(prisma);
    const result = await engine.submitAnswer(diagnosticId, questionKey, answer);

    // Adaptive AI follow-up: only for scoping-phase questions with a substantive
    // free-text answer. Non-fatal — never fail the request on a follow-up error.
    let aiFollowUp: string | null = null;
    const answeredQuestion = findQuestionNode(questionKey);
    if (
      answeredQuestion?.phase === 'scoping' &&
      typeof answer === 'string' &&
      answer.length > SCOPING_FOLLOWUP_MIN_LENGTH
    ) {
      try {
        const followUpResult = await generateScopingFollowUp({
          questionTextFr: answeredQuestion.textFr,
          category: answeredQuestion.category,
          answer,
          sector: diagnostic.company.sector,
        });
        aiFollowUp = followUpResult.followUp;
      } catch (followUpError) {
        console.error('[POST /api/diagnostic/[id]/answer] follow-up', followUpError);
        aiFollowUp = null;
      }
    }

    return NextResponse.json({ data: result, aiFollowUp });
  } catch (error) {
    console.error('[POST /api/diagnostic/[id]/answer]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
