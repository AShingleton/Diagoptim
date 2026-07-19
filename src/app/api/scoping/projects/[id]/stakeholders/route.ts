import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { addStakeholder, canManageProject } from '@/lib/scoping/service';

const createSchema = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email(),
  roleLabel: z.string().min(1).max(80),
  hierarchyParentId: z.string().uuid().nullable().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  if (!(await canManageProject(prisma, id, userId))) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }
  const stakeholder = await addStakeholder(prisma, { projectId: id, ...parsed.data });
  return NextResponse.json({ data: stakeholder }, { status: 201 });
}
