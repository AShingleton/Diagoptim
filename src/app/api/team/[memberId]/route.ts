/**
 * DELETE /api/team/[memberId]
 * Remove a team member.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const paramsSchema = z.object({ memberId: z.string().uuid() });

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberId } = await params;
    const parsed = paramsSchema.safeParse({ memberId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

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
    // Users can also remove themselves
    const isSelf = member.userId === userId;

    if (!isCompanyOwner && !isTeamOwner && !isSelf) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await prisma.teamMember.delete({ where: { id: memberId } });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('[DELETE /api/team/[memberId]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
