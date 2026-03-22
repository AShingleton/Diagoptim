/**
 * GET /api/diagnostic/[id]/progress
 * Get diagnostic progress including phase breakdown and partial insights.
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

    const engine = new QuestionEngine(prisma);
    const progress = await engine.getProgress(diagnosticId);

    // Also fetch any generated insights
    const insights = await prisma.diagnosticInsight.findMany({
      where: { diagnosticId },
      orderBy: { priority: 'asc' },
    });

    return NextResponse.json({
      data: {
        ...progress,
        insights,
        diagnosticStatus: diagnostic.status,
        globalScore: diagnostic.globalScore,
      },
    });
  } catch (error) {
    console.error('[GET /api/diagnostic/[id]/progress]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
