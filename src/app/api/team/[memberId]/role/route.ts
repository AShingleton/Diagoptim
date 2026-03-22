/**
 * PATCH /api/team/[memberId]/role
 * Change team member role.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const paramsSchema = z.object({ memberId: z.string().uuid() });

const roleSchema = z.object({
  role: z.enum(['owner', 'collaborator', 'observer']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberId } = await params;
    const parsedParams = paramsSchema.safeParse({ memberId });
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsedParams.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsedBody = roleSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsedBody.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Find the team member and verify the requester has authority
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: { company: true },
    });

    if (!member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    // Requester must be company owner or an owner team member
    const isCompanyOwner = member.company.userId === userId;
    const isTeamOwner = await prisma.teamMember.findFirst({
      where: { companyId: member.companyId, userId, role: 'owner' },
    });

    if (!isCompanyOwner && !isTeamOwner) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role: parsedBody.data.role },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('[PATCH /api/team/[memberId]/role]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
