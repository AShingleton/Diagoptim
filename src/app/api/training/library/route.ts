/**
 * GET /api/training/library
 * Get training library with optional filters.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const querySchema = z.object({
  methodology: z.enum(['lean', 'six_sigma', 'strategy', 'general']).optional(),
  type: z.enum(['theory_video', 'practice_video', 'memory_sheet', 'implementation_guide']).optional(),
  sector: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = querySchema.safeParse(searchParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { methodology, type, sector, page, pageSize } = parsed.data;

    const where: Record<string, unknown> = {};
    if (methodology) where.methodology = methodology;
    if (type) where.type = type;
    if (sector) where.sector = sector;

    const [trainings, total] = await Promise.all([
      prisma.training.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          userProgress: {
            where: { userId },
            select: { status: true, progressPercent: true, completedAt: true },
          },
        },
      }),
      prisma.training.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: trainings.map((t) => ({
        ...t,
        userProgress: t.userProgress[0] ?? null,
      })),
      meta: {
        page,
        pageSize,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('[GET /api/training/library]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
