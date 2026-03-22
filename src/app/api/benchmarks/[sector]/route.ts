/**
 * GET /api/benchmarks/[sector]
 * Get sector benchmarks.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const paramsSchema = z.object({
  sector: z.string().min(1).max(100),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sector: string }> },
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sector } = await params;
    const parsed = paramsSchema.safeParse({ sector: decodeURIComponent(sector) });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const decodedSector = parsed.data.sector;

    // Aggregate completed diagnostics for this sector
    const sectorDiagnostics = await prisma.diagnostic.findMany({
      where: {
        status: 'completed',
        globalScore: { not: null },
        company: { sector: decodedSector },
      },
      select: {
        globalScore: true,
        results: true,
        completedAt: true,
      },
    });

    if (sectorDiagnostics.length === 0) {
      return NextResponse.json({
        data: {
          sector: decodedSector,
          sampleSize: 0,
          benchmarks: null,
          message: 'No benchmark data available for this sector yet',
        },
      });
    }

    const scores = sectorDiagnostics
      .map((d) => d.globalScore)
      .filter((s): s is number => s !== null);

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const sortedScores = [...scores].sort((a: number, b: number) => a - b);
    const medianScore = sortedScores[Math.floor(sortedScores.length / 2)];

    // Compute percentile for the user's latest diagnostic in this sector
    const userDiagnostic = await prisma.diagnostic.findFirst({
      where: {
        status: 'completed',
        globalScore: { not: null },
        company: { userId, sector: decodedSector },
      },
      orderBy: { completedAt: 'desc' },
      select: { globalScore: true },
    });

    let userPercentile: number | null = null;
    if (userDiagnostic?.globalScore !== null && userDiagnostic?.globalScore !== undefined) {
      const belowCount = scores.filter((s: number) => s < userDiagnostic.globalScore!).length;
      userPercentile = Math.round((belowCount / scores.length) * 100);
    }

    return NextResponse.json({
      data: {
        sector: decodedSector,
        sampleSize: scores.length,
        benchmarks: {
          averageScore: Math.round(avgScore * 10) / 10,
          medianScore: medianScore ?? 0,
          minScore,
          maxScore,
        },
        userScore: userDiagnostic?.globalScore ?? null,
        userPercentile,
      },
    });
  } catch (error) {
    console.error('[GET /api/benchmarks/[sector]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
