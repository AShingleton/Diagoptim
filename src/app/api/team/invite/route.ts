/**
 * POST /api/team/invite
 * Invite a team member to a company.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'collaborator', 'observer']),
  companyId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, role, companyId } = parsed.data;

    // Verify the inviting user owns the company or is an owner team member
    const company = await prisma.company.findFirst({
      where: { id: companyId, userId },
    });

    if (!company) {
      // Check if user is an owner team member
      const membership = await prisma.teamMember.findFirst({
        where: { companyId, userId, role: 'owner' },
      });
      if (!membership) {
        return NextResponse.json({ error: 'Not authorized for this company' }, { status: 403 });
      }
    }

    // Find or create the invited user
    let invitedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!invitedUser) {
      invitedUser = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          role: 'user',
        },
      });
    }

    // Check for existing membership
    const existing = await prisma.teamMember.findUnique({
      where: { companyId_userId: { companyId, userId: invitedUser.id } },
    });

    if (existing) {
      return NextResponse.json({ error: 'User is already a team member' }, { status: 409 });
    }

    const member = await prisma.teamMember.create({
      data: {
        companyId,
        userId: invitedUser.id,
        role,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    // TODO: Send invitation email

    return NextResponse.json({ data: member }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/team/invite]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
