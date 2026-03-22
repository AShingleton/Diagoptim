/**
 * POST /api/diagnostic/[id]/complete
 * Finalize a diagnostic, mark it as completed, and trigger report generation.
 * Computes final waste analysis and stores results.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeWastes, type DiagnosticAnswerInput } from '@/lib/diagnostic/waste-analyzer';

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
      include: {
        company: { select: { userId: true, sector: true, annualRevenue: true, employeeCount: true } },
        answers: { orderBy: { createdAt: 'asc' } },
      },
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

    // Build answer records for final analysis
    const answerRecords: DiagnosticAnswerInput[] = diagnostic.answers.map((a) => ({
      questionKey: a.questionKey,
      answer: String(a.answer ?? ""),
      score: a.score ?? 0,
      category: a.category,
    }));

    // Run final waste analysis
    const wasteAnalysis = analyzeWastes(
      answerRecords,
      diagnostic.company.sector,
      diagnostic.company.annualRevenue,
      diagnostic.company.employeeCount,
    );

    // Finalize diagnostic
    const updated = await prisma.diagnostic.update({
      where: { id: diagnosticId },
      data: {
        status: 'completed',
        currentPhase: 'recommendations',
        globalScore: wasteAnalysis.globalScore,
        completedAt: new Date(),
        results: JSON.parse(JSON.stringify({
          wasteAnalysis: {
            scores: wasteAnalysis.scores,
            globalScore: wasteAnalysis.globalScore,
            topWastes: wasteAnalysis.topWastes,
          },
        })),
      },
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        status: updated.status,
        globalScore: updated.globalScore,
        completedAt: updated.completedAt,
      },
    });
  } catch (error) {
    console.error('[POST /api/diagnostic/[id]/complete]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
