/**
 * GET /api/roadmap/[id]
 * Get roadmap with all actions.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

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

    const roadmap = await prisma.roadmap.findFirst({
      where: {
        id,
        diagnostic: { company: { userId } },
      },
      include: {
        actions: { orderBy: { sortOrder: 'asc' } },
        diagnostic: {
          select: {
            id: true,
            type: true,
            globalScore: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
    }

    // Compute progress stats
    const total = roadmap.actions.length;
    const done = roadmap.actions.filter((a) => a.status === 'done').length;
    const inProgress = roadmap.actions.filter((a) => a.status === 'in_progress').length;
    const skipped = roadmap.actions.filter((a) => a.status === 'skipped').length;

    return NextResponse.json({
      data: {
        ...roadmap,
        progress: {
          total,
          done,
          inProgress,
          skipped,
          todo: total - done - inProgress - skipped,
          percentComplete: total > 0 ? Math.round((done / total) * 100) : 0,
        },
      },
    });
  } catch (error) {
    console.error('[GET /api/roadmap/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
