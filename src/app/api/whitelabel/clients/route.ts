/**
 * GET /api/whitelabel/clients
 * List consultant's clients.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const querySchema = z.object({
  status: z.enum(['active', 'archived']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a consultant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'consultant') {
      return NextResponse.json({ error: 'Consultant access required' }, { status: 403 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = querySchema.safeParse(searchParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { status, page, pageSize } = parsed.data;

    const where: Record<string, unknown> = { consultantId: userId };
    if (status) where.status = status;

    const [clients, total] = await Promise.all([
      prisma.consultantClient.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { addedAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              sector: true,
              employeeCount: true,
              diagnostics: {
                select: { id: true, globalScore: true, status: true, completedAt: true },
                orderBy: { startedAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      }),
      prisma.consultantClient.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: clients,
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
    console.error('[GET /api/whitelabel/clients]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
