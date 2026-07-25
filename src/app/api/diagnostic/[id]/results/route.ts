/**
 * GET /api/diagnostic/[id]/results
 * Get complete diagnostic results. Only available when status is "completed".
 * Returns waste scores, SWOT data, insights, and the full results payload.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const diagnostic = await prisma.diagnostic.findUnique({
      where: { id: diagnosticId },
      include: {
        company: { select: { userId: true, name: true, sector: true } },
        answers: { orderBy: { createdAt: 'asc' } },
        insights: { orderBy: { priority: 'asc' } },
        swotAnalyses: true,
        porterAnalyses: true,
        roadmap: {
          include: { actions: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });

    if (!diagnostic) {
      return NextResponse.json({ error: 'Diagnostic not found' }, { status: 404 });
    }

    if (diagnostic.company.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (diagnostic.status !== 'completed') {
      return NextResponse.json(
        { error: 'Diagnostic not yet completed' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      data: {
        id: diagnostic.id,
        type: diagnostic.type,
        status: diagnostic.status,
        globalScore: diagnostic.globalScore,
        results: diagnostic.results,
        company: diagnostic.company,
        answers: diagnostic.answers,
        insights: diagnostic.insights,
        swotAnalyses: diagnostic.swotAnalyses,
        porterAnalyses: diagnostic.porterAnalyses,
        roadmap: diagnostic.roadmap,
        startedAt: diagnostic.startedAt,
        completedAt: diagnostic.completedAt,
      },
    });
  } catch (error) {
    console.error('[GET /api/diagnostic/[id]/results]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
