/**
 * GET /api/roadmap/[id]/gantt
 * Get Gantt chart data for a roadmap.
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

    const roadmap = await prisma.roadmap.findFirst({
      where: {
        id,
        diagnostic: { company: { userId } },
      },
      include: {
        actions: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
    }

    // Build Gantt-compatible data
    const startDate = roadmap.generatedAt;
    const ganttItems = roadmap.actions.map((action) => {
      const actionStart = new Date(startDate);
      actionStart.setDate(actionStart.getDate() + action.sortOrder * 7);
      const actionEnd = new Date(actionStart);
      actionEnd.setDate(actionEnd.getDate() + action.durationWeeks * 7);

      return {
        id: action.id,
        title: action.title,
        category: action.category,
        status: action.status,
        effortLevel: action.effortLevel,
        startDate: actionStart.toISOString(),
        endDate: actionEnd.toISOString(),
        durationWeeks: action.durationWeeks,
        dueDate: action.dueDate?.toISOString() ?? null,
        completedAt: action.completedAt?.toISOString() ?? null,
        estimatedGain: action.estimatedGain,
        responsibleRole: action.responsibleRole,
        linkedWaste: action.linkedWaste,
      };
    });

    return NextResponse.json({
      data: {
        roadmapId: roadmap.id,
        timelineMonths: roadmap.timelineMonths,
        startDate: startDate.toISOString(),
        items: ganttItems,
      },
    });
  } catch (error) {
    console.error('[GET /api/roadmap/[id]/gantt]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
