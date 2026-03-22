/**
 * POST /api/whitelabel/invite
 * Invite a client (consultant only).
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const inviteSchema = z.object({
  companyName: z.string().min(1),
  contactEmail: z.string().email(),
  contactName: z.string().min(1),
  sector: z.string().optional().default(''),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { companyName, contactEmail, contactName, sector, notes } = parsed.data;

    // Check if user with this email already exists
    let clientUser = await prisma.user.findUnique({
      where: { email: contactEmail },
    });

    // Create a placeholder user if they don't exist
    if (!clientUser) {
      clientUser = await prisma.user.create({
        data: {
          email: contactEmail,
          name: contactName,
          role: 'user',
        },
      });
    }

    // Create company for the client
    const company = await prisma.company.create({
      data: {
        userId: clientUser.id,
        name: companyName,
        siret: '',
        sector,
        subsector: '',
        productsDescription: '',
        location: '',
        employeeCount: 0,
        annualRevenue: 0,
        clientCount: 0,
        competitors: [],
      },
    });

    // Create the consultant-client relationship
    const consultantClient = await prisma.consultantClient.create({
      data: {
        consultantId: userId,
        companyId: company.id,
        status: 'active',
        notes: notes ?? null,
      },
      include: { company: true },
    });

    // TODO: Send invitation email via @/lib/notifications/email

    return NextResponse.json({ data: consultantClient }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/whitelabel/invite]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
