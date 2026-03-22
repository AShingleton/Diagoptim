/**
 * POST /api/roadmap/generate
 * Generate a roadmap from diagnostic results.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const generateSchema = z.object({
  diagnosticId: z.string().uuid(),
  timelineMonths: z.number().int().min(1).max(36),
  capacityHoursPerWeek: z.number().min(0.5).max(168),
  hasDedicatedPerson: z.boolean(),
  budget: z.number().min(0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { diagnosticId, timelineMonths, capacityHoursPerWeek, hasDedicatedPerson, budget } =
      parsed.data;

    // Verify diagnostic belongs to user and is completed
    const diagnostic = await prisma.diagnostic.findFirst({
      where: {
        id: diagnosticId,
        company: { userId },
        status: 'completed',
      },
      include: {
        insights: { orderBy: { priority: 'asc' } },
        roadmap: true,
      },
    });

    if (!diagnostic) {
      return NextResponse.json(
        { error: 'Completed diagnostic not found' },
        { status: 404 },
      );
    }

    // Delete existing roadmap if regenerating
    if (diagnostic.roadmap) {
      await prisma.roadmap.delete({ where: { id: diagnostic.roadmap.id } });
    }

    // Generate actions from insights
    const actions = diagnostic.insights.map((insight, index) => {
      const isQuickWin = insight.type === 'quick_win';
      const category = isQuickWin
        ? 'quick_win'
        : insight.priority <= 3
          ? 'short_term'
          : insight.priority <= 6
            ? 'structural'
            : 'transformation';

      const durationWeeks = isQuickWin ? 2 : category === 'short_term' ? 4 : category === 'structural' ? 8 : 12;
      const weeksOffset = index * Math.max(1, Math.floor(durationWeeks / 2));
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + weeksOffset * 7 + durationWeeks * 7);

      return {
        title: insight.title,
        description: insight.description,
        category: category as 'quick_win' | 'short_term' | 'structural' | 'transformation',
        estimatedGain: insight.estimatedImpact,
        effortLevel: (isQuickWin ? 'low' : category === 'structural' ? 'high' : 'medium') as 'low' | 'medium' | 'high',
        durationWeeks,
        responsibleRole: hasDedicatedPerson ? 'Responsable Lean' : 'Dirigeant',
        status: 'todo' as const,
        dueDate,
        linkedWaste: insight.category,
        sortOrder: index,
      };
    });

    const roadmap = await prisma.roadmap.create({
      data: {
        diagnosticId,
        timelineMonths,
        capacityHoursPerWeek,
        hasDedicatedPerson,
        budget: budget ?? null,
        actions: {
          create: actions,
        },
      },
      include: {
        actions: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return NextResponse.json({ data: roadmap }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/roadmap/generate]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
