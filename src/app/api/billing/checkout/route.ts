/**
 * POST /api/billing/checkout
 * Create Stripe checkout session for a subscription.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createCheckoutSession } from '@/lib/billing/stripe';

const checkoutSchema = z.object({
  planId: z.enum(['starter', 'pro', 'expert', 'consultant_solo', 'consultant_cabinet']),
  interval: z.enum(['month', 'year']),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { planId, interval } = parsed.data;
    const url = await createCheckoutSession(userId, planId, interval);

    return NextResponse.json({ data: { url } });
  } catch (error) {
    console.error('[POST /api/billing/checkout]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
