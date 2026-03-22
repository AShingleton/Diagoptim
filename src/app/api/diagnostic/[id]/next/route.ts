/**
 * GET /api/diagnostic/[id]/next
 * Get the next question for a diagnostic session.
 * Uses QuestionEngine.getNextQuestion() to determine adaptive next question.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { QuestionEngine } from '@/lib/diagnostic/question-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: diagnosticId } = await params;

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership: diagnostic -> company -> user
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

    const engine = new QuestionEngine(prisma);
    const result = await engine.getNextQuestion(diagnosticId);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('[GET /api/diagnostic/[id]/next]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
