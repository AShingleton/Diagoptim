/**
 * GET /api/billing/subscription
 * Get current subscription status.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return NextResponse.json({
        data: {
          plan: 'free',
          status: 'active',
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodEnd: null,
        },
      });
    }

    // Also fetch active support packs
    const activePacks = await prisma.supportPack.findMany({
      where: {
        userId,
        status: { in: ['purchased', 'partially_used'] },
        expiresAt: { gt: new Date() },
      },
      orderBy: { purchasedAt: 'desc' },
    });

    return NextResponse.json({
      data: {
        plan: subscription.plan,
        status: subscription.status,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        currentPeriodEnd: subscription.currentPeriodEnd,
        supportPacks: activePacks,
      },
    });
  } catch (error) {
    console.error('[GET /api/billing/subscription]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
