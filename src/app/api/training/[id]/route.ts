/**
 * GET /api/training/[id]
 * Get training detail.
 */
import { NextRequest, NextResponse } from 'next/server';
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

    const training = await prisma.training.findUnique({
      where: { id },
      include: {
        userProgress: {
          where: { userId },
          select: { id: true, status: true, progressPercent: true, completedAt: true },
        },
      },
    });

    if (!training) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        ...training,
        userProgress: training.userProgress[0] ?? null,
      },
    });
  } catch (error) {
    console.error('[GET /api/training/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
