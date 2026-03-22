/**
 * POST /api/billing/pack/purchase
 * Purchase a support pack via Stripe.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createPackPayment } from '@/lib/billing/stripe';

const purchaseSchema = z.object({
  packType: z.enum(['coup_de_pouce', 'acceleration', 'transformation']),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = purchaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { packType } = parsed.data;
    const url = await createPackPayment(userId, packType);

    return NextResponse.json({ data: { url } });
  } catch (error) {
    console.error('[POST /api/billing/pack/purchase]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
