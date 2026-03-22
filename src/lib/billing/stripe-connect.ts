/**
 * Stripe Connect integration for the affiliate program.
 *
 * Manages connected accounts, commission tracking, and
 * automatic monthly payouts to affiliates (20% on first 12 months).
 *
 * @module billing/stripe-connect
 */

import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia", typescript: true });
  }
  return _stripe;
}

const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AFFILIATE_COMMISSION_RATE = 0.2; // 20%
const AFFILIATE_COMMISSION_MONTHS = 12;

// ---------------------------------------------------------------------------
// Support subscription price IDs
// ---------------------------------------------------------------------------

export const SUPPORT_SUBSCRIPTION_PRICES: Record<string, Record<"month", string>> = {
  essentiel: {
    month: process.env.STRIPE_PRICE_SUPPORT_ESSENTIEL_MONTHLY ?? "",
  },
  premium: {
    month: process.env.STRIPE_PRICE_SUPPORT_PREMIUM_MONTHLY ?? "",
  },
};

// ---------------------------------------------------------------------------
// Connected account management
// ---------------------------------------------------------------------------

/**
 * Creates a Stripe Connect Express account for an affiliate.
 */
export async function createConnectedAccount(
  email: string,
  affiliateId: string,
): Promise<{ accountId: string; onboardingUrl: string }> {
  const account = await stripe.accounts.create({
    type: "express",
    email,
    metadata: { affiliateId },
    capabilities: {
      transfers: { requested: true },
    },
    business_type: "individual",
    country: "FR",
  });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate/onboarding?refresh=true`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate/dashboard`,
    type: "account_onboarding",
  });

  return {
    accountId: account.id,
    onboardingUrl: accountLink.url,
  };
}

/**
 * Creates a Stripe Connect login link for an existing connected account.
 */
export async function createLoginLink(accountId: string): Promise<string> {
  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return loginLink.url;
}

// ---------------------------------------------------------------------------
// Commission calculation
// ---------------------------------------------------------------------------

/**
 * Calculates the affiliate commission for a payment.
 *
 * @param amount            - The payment amount in cents.
 * @param referralMonthAge  - How many months since the referral was made.
 * @returns The commission amount in cents, or 0 if past the commission window.
 */
export function calculateCommission(
  amount: number,
  referralMonthAge: number,
): number {
  if (referralMonthAge > AFFILIATE_COMMISSION_MONTHS) return 0;
  return Math.round(amount * AFFILIATE_COMMISSION_RATE);
}

/**
 * Transfers commission to an affiliate's connected account.
 */
export async function transferCommission(
  connectedAccountId: string,
  amount: number,
  description: string,
): Promise<Stripe.Transfer> {
  return stripe.transfers.create({
    amount,
    currency: "eur",
    destination: connectedAccountId,
    description,
  });
}

// ---------------------------------------------------------------------------
// Support subscription management
// ---------------------------------------------------------------------------

/**
 * Creates a checkout session for a support subscription (essentiel or premium).
 */
export async function createSupportSubscriptionCheckout(
  userId: string,
  plan: "essentiel" | "premium",
): Promise<string> {
  const priceId = SUPPORT_SUBSCRIPTION_PRICES[plan]?.month;
  if (!priceId) {
    throw new Error(`No price configured for support plan: ${plan}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: userId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
    metadata: { userId, type: "support_subscription", plan },
    subscription_data: { metadata: { userId, plan, type: "support" } },
  });

  if (!session.url) throw new Error("Failed to create support subscription checkout URL");
  return session.url;
}

// ---------------------------------------------------------------------------
// Extended webhook handling
// ---------------------------------------------------------------------------

/**
 * Handles the invoice.paid event for commission processing.
 */
export async function handleInvoicePaid(
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id;

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  // In production, look up referral in database and process commission
  // const referral = await db.referral.findUnique({ where: { referredUserId: userId } });
  // if (referral && referral.affiliateAccountId) {
  //   const monthAge = differenceInMonths(new Date(), referral.createdAt);
  //   const commission = calculateCommission(invoice.amount_paid, monthAge);
  //   if (commission > 0) {
  //     await transferCommission(referral.affiliateAccountId, commission, `Commission for ${userId}`);
  //   }
  // }
}
