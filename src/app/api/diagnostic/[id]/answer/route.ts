/**
 * POST /api/diagnostic/[id]/answer
 * Submit an answer to a diagnostic question.
 * Uses QuestionEngine.submitAnswer() to process, score, and handle branching.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { QuestionEngine } from '@/lib/diagnostic/question-engine';

const answerSchema = z.object({
  questionKey: z.string().min(1),
  answer: z.unknown(),
});

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
      include: { company: { select: { userId: true } } },
    });

    if (!diagnostic) {
      return NextResponse.json({ error: 'Diagnostic not found' }, { status: 404 });
    }

    if (diagnostic.company.userId !== userId) {
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

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('[POST /api/diagnostic/[id]/answer]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
