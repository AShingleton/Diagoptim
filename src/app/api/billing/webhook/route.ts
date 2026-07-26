/**
 * POST /api/billing/webhook
 * Stripe webhook handler. No auth required - verified by Stripe signature.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleWebhook } from '@/lib/billing/stripe';
// Plan and SubscriptionStatus are Prisma enums defined in schema.prisma.
// They will be available after `prisma generate`. Using local type aliases as fallback.
type Plan = 'free' | 'starter' | 'pro' | 'expert' | 'consultant_solo' | 'consultant_cabinet';
type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const result = await handleWebhook(body, signature);

    if (!result.success) {
      // Unhandled event type - acknowledge to Stripe
      return NextResponse.json({ received: true, handled: false });
    }

    // Process the webhook result
    switch (result.event) {
      case 'checkout.session.completed': {
        const { userId, planId } = result.metadata;
        if (userId && planId && result.customerId && result.subscriptionId) {
          await prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              plan: planId as Plan,
              stripeCustomerId: result.customerId,
              stripeSubscriptionId: result.subscriptionId,
              status: 'active',
              currentPeriodEnd: null,
            },
            update: {
              plan: planId as Plan,
              stripeCustomerId: result.customerId,
              stripeSubscriptionId: result.subscriptionId,
              status: 'active',
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const stripeStatus = result.metadata.status;
        const statusMap: Record<string, SubscriptionStatus> = {
          active: 'active',
          past_due: 'past_due',
          canceled: 'canceled',
          trialing: 'trialing',
        };
        const dbStatus = statusMap[stripeStatus] ?? 'active';

        if (result.subscriptionId) {
          const currentPeriodEnd = result.metadata.currentPeriodEnd
            ? new Date(Number(result.metadata.currentPeriodEnd) * 1000)
            : null;

          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: result.subscriptionId },
            data: {
              status: dbStatus,
              currentPeriodEnd,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        if (result.subscriptionId) {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: result.subscriptionId },
            data: {
              status: 'canceled',
              plan: 'free',
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        if (result.subscriptionId) {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: result.subscriptionId },
            data: { status: 'past_due' },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true, handled: true });
  } catch (error) {
    console.error('[POST /api/billing/webhook]', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}
