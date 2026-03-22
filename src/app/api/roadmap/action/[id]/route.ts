/**
 * PATCH /api/roadmap/action/[id]
 * Update action status.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const paramsSchema = z.object({ id: z.string().uuid() });

const updateSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done', 'skipped']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const parsedParams = paramsSchema.safeParse({ id });
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsedParams.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsedBody = updateSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsedBody.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Verify the action belongs to the user via roadmap -> diagnostic -> company
    const action = await prisma.roadmapAction.findFirst({
      where: {
        id,
        roadmap: { diagnostic: { company: { userId } } },
      },
    });

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    const { status } = parsedBody.data;
    const updated = await prisma.roadmapAction.update({
      where: { id },
      data: {
        status,
        completedAt: status === 'done' ? new Date() : null,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('[PATCH /api/roadmap/action/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
