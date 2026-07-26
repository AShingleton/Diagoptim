/**
 * GET /api/training/memory-sheet/[id]/download
 * Download memory sheet as PDF.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const paramsSchema = z.object({ id: z.string().uuid() });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const parsed = paramsSchema.safeParse({ id });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Memory sheets are trainings of type memory_sheet
    const training = await prisma.training.findFirst({
      where: { id, type: 'memory_sheet' },
    });

    if (!training) {
      return NextResponse.json({ error: 'Memory sheet not found' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { locale: true },
    });

    // Generate a simple PDF for the memory sheet
    const { generatePdfReport } = await import('@/lib/reports/pdf-generator');
    const reportData = {
      company: { name: '', sector: '', employeeCount: 0, annualRevenue: 0, location: '' },
      globalScore: 0,
      results: null,
      insights: [],
      roadmapActions: [],
      swot: null,
      generatedAt: new Date().toISOString(),
      wasteScores: {},
      financialSummary: null,
      memorySheets: [],
    };

    const reportConfig = {
      locale: (user?.locale ?? 'fr') as 'fr' | 'en',
      sections: ['executive_summary'],
      includeCharts: false,
      brandingLogoUrl: null as string | null,
      brandingColor: null as string | null,
      customHeader: training.title,
      customFooter: null as string | null,
    };

    const buffer = await generatePdfReport(reportData as never, reportConfig as never);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="memory-sheet-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[GET /api/training/memory-sheet/[id]/download]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
