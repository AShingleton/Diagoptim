/**
 * GET /api/reports/[diagnosticId]
 * Generate or retrieve the report for a completed diagnostic.
 *
 * POST /api/reports/[diagnosticId]
 * Request report generation — creates a ReportJob and returns its ID for polling.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createReportJob } from '@/lib/jobs/processor';

const paramsSchema = z.object({
  diagnosticId: z.string().uuid(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ diagnosticId: string }> },
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { diagnosticId } = await params;
    const parsed = paramsSchema.safeParse({ diagnosticId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Verify the diagnostic belongs to the user
    const diagnostic = await prisma.diagnostic.findFirst({
      where: {
        id: diagnosticId,
        company: { userId },
      },
      include: {
        company: true,
        answers: true,
        insights: { orderBy: { priority: 'asc' } },
        roadmap: { include: { actions: { orderBy: { sortOrder: 'asc' } } } },
        swotAnalyses: { take: 1 },
        vsmMaps: true,
        ishikawaDiagrams: true,
      },
    });

    if (!diagnostic) {
      return NextResponse.json({ error: 'Diagnostic not found' }, { status: 404 });
    }

    if (diagnostic.status !== 'completed') {
      return NextResponse.json(
        { error: 'Diagnostic must be completed before generating a report' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      data: {
        diagnosticId: diagnostic.id,
        company: diagnostic.company,
        globalScore: diagnostic.globalScore,
        results: diagnostic.results,
        insights: diagnostic.insights,
        answers: diagnostic.answers,
        roadmap: diagnostic.roadmap,
        swot: diagnostic.swotAnalyses[0] ?? null,
        vsmMaps: diagnostic.vsmMaps,
        ishikawaDiagrams: diagnostic.ishikawaDiagrams,
        completedAt: diagnostic.completedAt,
      },
    });
  } catch (error) {
    console.error('[GET /api/reports/[diagnosticId]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ diagnosticId: string }> },
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { diagnosticId } = await params;
    const parsed = paramsSchema.safeParse({ diagnosticId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Verify the diagnostic belongs to the user and is completed
    const diagnostic = await prisma.diagnostic.findFirst({
      where: {
        id: diagnosticId,
        company: { userId },
        status: 'completed',
      },
    });

    if (!diagnostic) {
      return NextResponse.json(
        { error: 'Completed diagnostic not found' },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const format = (body as Record<string, unknown>).format === 'docx' ? 'docx' : 'pdf';

    const job = await createReportJob(diagnosticId, format);

    return NextResponse.json(
      {
        data: {
          jobId: job.id,
          status: job.status,
          format,
        },
      },
      { status: 202 },
    );
  } catch (error) {
    console.error('[POST /api/reports/[diagnosticId]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
