import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canManageProject, getProjectDetail } from '@/lib/scoping/service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await canManageProject(prisma, id, userId))) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }
  const detail = await getProjectDetail(prisma, id);
  if (!detail) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  return NextResponse.json({ data: detail });
}
