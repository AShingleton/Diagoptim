/**
 * POST /api/training/[id]/progress
 * Update training progress.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const paramsSchema = z.object({ id: z.string().uuid() });

const progressSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'completed']),
  progressPercent: z.number().min(0).max(100),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: trainingId } = await params;
    const parsedParams = paramsSchema.safeParse({ id: trainingId });
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsedParams.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsedBody = progressSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsedBody.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Verify training exists
    const training = await prisma.training.findUnique({ where: { id: trainingId } });
    if (!training) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 });
    }

    const { status, progressPercent } = parsedBody.data;

    const progress = await prisma.userTrainingProgress.upsert({
      where: {
        userId_trainingId: { userId, trainingId },
      },
      create: {
        userId,
        trainingId,
        status,
        progressPercent,
        completedAt: status === 'completed' ? new Date() : null,
      },
      update: {
        status,
        progressPercent,
        completedAt: status === 'completed' ? new Date() : null,
      },
    });

    return NextResponse.json({ data: progress });
  } catch (error) {
    console.error('[POST /api/training/[id]/progress]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
