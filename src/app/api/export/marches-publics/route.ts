/**
 * POST /api/export/marches-publics
 * Export for public procurement (memoire technique).
 */
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const exportSchema = z.object({
  companyId: z.string().uuid(),
  diagnosticId: z.string().uuid().optional(),
  sections: z
    .array(z.enum([
      'presentation',
      'methodology',
      'certifications',
      'references',
      'team',
      'approach',
      'planning',
      'quality_assurance',
    ]))
    .optional()
    .default(['presentation', 'methodology', 'approach', 'quality_assurance']),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = exportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { companyId, diagnosticId, sections } = parsed.data;

    // Verify company belongs to user
    const company = await prisma.company.findFirst({
      where: { id: companyId, userId },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Optionally load diagnostic data
    let diagnostic = null;
    if (diagnosticId) {
      diagnostic = await prisma.diagnostic.findFirst({
        where: { id: diagnosticId, companyId, status: 'completed' },
        include: {
          insights: { orderBy: { priority: 'asc' } },
          roadmap: { include: { actions: { orderBy: { sortOrder: 'asc' } } } },
        },
      });
    }

    // Build the memoire technique document structure
    const memoireTechnique = {
      company: {
        name: company.name,
        siret: company.siret,
        sector: company.sector,
        location: company.location,
        employeeCount: company.employeeCount,
        annualRevenue: company.annualRevenue,
      },
      sections,
      diagnostic: diagnostic
        ? {
            globalScore: diagnostic.globalScore,
            insights: diagnostic.insights,
            roadmap: diagnostic.roadmap,
          }
        : null,
      generatedAt: new Date().toISOString(),
    };

    // Generate PDF
    const { generatePdfReport } = await import('@/lib/reports/pdf-generator');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { locale: true },
    });

    const buffer = await generatePdfReport(
      {
        company,
        globalScore: diagnostic?.globalScore ?? 0,
        results: null,
        insights: diagnostic?.insights ?? [],
        roadmapActions: diagnostic?.roadmap?.actions ?? [],
        swot: null,
        generatedAt: new Date().toISOString(),
        wasteScores: {},
        financialSummary: null,
        memorySheets: [],
      } as never,
      {
        locale: (user?.locale ?? 'fr') as 'fr' | 'en',
        sections: ['company_overview', 'recommendations', 'roadmap'],
        includeCharts: false,
        brandingLogoUrl: null,
        brandingColor: null,
        customHeader: 'Memoire Technique',
        customFooter: `${company.name} - ${company.siret}`,
      } as never,
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="memoire-technique-${company.name.replace(/\s+/g, '-')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[POST /api/export/marches-publics]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
