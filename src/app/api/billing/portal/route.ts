/**
 * POST /api/billing/portal
 * Create Stripe customer portal session.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPortalSession } from '@/lib/billing/stripe';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: { stripeCustomerId: true },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 },
      );
    }

    const url = await createPortalSession(subscription.stripeCustomerId);

    return NextResponse.json({ data: { url } });
  } catch (error) {
    console.error('[POST /api/billing/portal]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
