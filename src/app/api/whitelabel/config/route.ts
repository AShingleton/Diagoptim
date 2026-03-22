/**
 * POST /api/whitelabel/config
 * Create or update white-label configuration.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const configSchema = z.object({
  brandName: z.string().min(1).max(100),
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#2563EB'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#1E40AF'),
  customDomain: z.string().max(253).optional().nullable(),
  contactEmail: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has consultant or expert role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const allowedPlans = ['expert', 'consultant_solo', 'consultant_cabinet'];
    if (!user.subscription || !allowedPlans.includes(user.subscription.plan)) {
      return NextResponse.json(
        { error: 'White-label requires Expert or Consultant plan' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = configSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const config = await prisma.whiteLabelConfig.upsert({
      where: { userId },
      create: {
        userId,
        brandName: data.brandName,
        logoUrl: data.logoUrl ?? null,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        customDomain: data.customDomain ?? null,
        contactEmail: data.contactEmail,
        isActive: true,
      },
      update: {
        brandName: data.brandName,
        logoUrl: data.logoUrl ?? null,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        customDomain: data.customDomain ?? null,
        contactEmail: data.contactEmail,
      },
    });

    return NextResponse.json({ data: config });
  } catch (error) {
    console.error('[POST /api/whitelabel/config]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
