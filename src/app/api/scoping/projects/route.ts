import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createProject, listProjects } from '@/lib/scoping/service';

const createSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1).max(120),
  ownerType: z.enum(['consultant', 'client_lead']),
  requiredRespondents: z.number().int().min(1).max(20),
});

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await listProjects(prisma, userId);
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  // Ensure the company belongs to the user (owner) before creating a project on it.
  const company = await prisma.company.findFirst({ where: { id: parsed.data.companyId, userId } });
  if (!company) return NextResponse.json({ error: 'Company not found or access denied' }, { status: 404 });
  const project = await createProject(prisma, { userId, ...parsed.data });
  return NextResponse.json({ data: project }, { status: 201 });
}
