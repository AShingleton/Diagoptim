/**
 * GET /api/reports/[diagnosticId]/download/[format]
 * Download report as PDF or DOCX.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const paramsSchema = z.object({
  diagnosticId: z.string().uuid(),
  format: z.enum(['pdf', 'docx']),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ diagnosticId: string; format: string }> },
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const parsed = paramsSchema.safeParse(resolvedParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { diagnosticId, format } = parsed.data;

    const diagnostic = await prisma.diagnostic.findFirst({
      where: {
        id: diagnosticId,
        company: { userId },
        status: 'completed',
      },
      include: {
        company: true,
        answers: true,
        insights: { orderBy: { priority: 'asc' } },
        roadmap: { include: { actions: { orderBy: { sortOrder: 'asc' } } } },
        swotAnalyses: { take: 1 },
      },
    });

    if (!diagnostic) {
      return NextResponse.json({ error: 'Completed diagnostic not found' }, { status: 404 });
    }

    // Fetch user locale for report generation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { locale: true },
    });

    const locale = user?.locale ?? 'fr';

    // Build report data structure for generators
    const reportData = {
      company: diagnostic.company,
      globalScore: diagnostic.globalScore ?? 0,
      results: diagnostic.results,
      insights: diagnostic.insights,
      roadmapActions: diagnostic.roadmap?.actions ?? [],
      swot: diagnostic.swotAnalyses[0] ?? null,
      generatedAt: new Date().toISOString(),
    };

    const reportConfig = {
      locale: locale as 'fr' | 'en',
      sections: [
        'executive_summary',
        'company_overview',
        'diagnostic_methodology',
        'waste_analysis',
        'recommendations',
        'roadmap',
      ],
      includeCharts: true,
      brandingLogoUrl: null as string | null,
      brandingColor: null as string | null,
      customHeader: null as string | null,
      customFooter: null as string | null,
    };

    if (format === 'pdf') {
      const { generatePdfReport } = await import('@/lib/reports/pdf-generator');
      const buffer = await generatePdfReport(reportData as never, reportConfig as never);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="report-${diagnosticId}.pdf"`,
        },
      });
    }

    // DOCX format
    const { generateDocxReport } = await import('@/lib/reports/docx-generator');
    const buffer = await (generateDocxReport as (data: unknown, config: unknown) => Promise<Buffer>)(
      reportData,
      reportConfig,
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="report-${diagnosticId}.docx"`,
      },
    });
  } catch (error) {
    console.error('[GET /api/reports/[diagnosticId]/download/[format]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
