import Stripe from "stripe";

/**
 * Lazy-initialized Stripe client to avoid build-time errors
 * when STRIPE_SECRET_KEY is not yet configured.
 */
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    _stripe = new Stripe(key, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return _stripe;
}

/** @deprecated Use getStripe() instead — kept for backward compat */
const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/** Webhook event types handled by the application */
type HandledEventType =
  | "checkout.session.completed"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "invoice.payment_failed";

/**
 * Result of processing a Stripe webhook event.
 */
export interface WebhookResult {
  /** The type of event that was processed */
  event: HandledEventType | string;
  /** Whether the event was successfully handled */
  success: boolean;
  /** The Stripe customer ID associated with the event */
  customerId: string | null;
  /** The Stripe subscription ID, if applicable */
  subscriptionId: string | null;
  /** Additional metadata from the event processing */
  metadata: Record<string, string>;
}

/**
 * Mapping of DiagOptim plan IDs to Stripe Price IDs.
 * Must be configured in environment variables.
 */
const PRICE_IDS: Record<string, Record<"month" | "year", string>> = {
  starter: {
    month: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? "",
    year: process.env.STRIPE_PRICE_STARTER_YEARLY ?? "",
  },
  pro: {
    month: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
    year: process.env.STRIPE_PRICE_PRO_YEARLY ?? "",
  },
  expert: {
    month: process.env.STRIPE_PRICE_EXPERT_MONTHLY ?? "",
    year: process.env.STRIPE_PRICE_EXPERT_YEARLY ?? "",
  },
  consultant_solo: {
    month: process.env.STRIPE_PRICE_CONSULTANT_SOLO_MONTHLY ?? "",
    year: process.env.STRIPE_PRICE_CONSULTANT_SOLO_YEARLY ?? "",
  },
  consultant_cabinet: {
    month: process.env.STRIPE_PRICE_CONSULTANT_CABINET_MONTHLY ?? "",
    year: process.env.STRIPE_PRICE_CONSULTANT_CABINET_YEARLY ?? "",
  },
};

/**
 * Mapping of support pack types to Stripe Price IDs.
 */
const PACK_PRICE_IDS: Record<string, string> = {
  coup_de_pouce: process.env.STRIPE_PRICE_PACK_COUP_DE_POUCE ?? "",
  acceleration: process.env.STRIPE_PRICE_PACK_ACCELERATION ?? "",
  transformation: process.env.STRIPE_PRICE_PACK_TRANSFORMATION ?? "",
};

/**
 * Creates a Stripe Checkout session for a subscription plan.
 *
 * @param userId - The DiagOptim user ID (stored as client_reference_id)
 * @param planId - The plan identifier (e.g., "starter", "pro")
 * @param interval - Billing interval: "month" or "year"
 * @returns The Checkout session URL for redirect
 * @throws Error if the plan or interval is invalid
 */
export async function createCheckoutSession(
  userId: string,
  planId: string,
  interval: "month" | "year"
): Promise<string> {
  const priceConfig = PRICE_IDS[planId];
  if (!priceConfig) {
    throw new Error(`Unknown plan: ${planId}`);
  }

  const priceId = priceConfig[interval];
  if (!priceId) {
    throw new Error(`No price configured for plan ${planId} with interval ${interval}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: userId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
    metadata: {
      userId,
      planId,
      interval,
    },
    subscription_data: {
      metadata: {
        userId,
        planId,
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session URL");
  }

  return session.url;
}

/**
 * Creates a Stripe Customer Portal session for subscription management.
 *
 * @param customerId - The Stripe customer ID
 * @returns The portal session URL for redirect
 */
export async function createPortalSession(customerId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  });

  return session.url;
}

/**
 * Processes a Stripe webhook event.
 * Verifies the signature and dispatches to the appropriate handler.
 *
 * @param body - The raw request body string
 * @param signature - The Stripe-Signature header value
 * @returns A WebhookResult describing what was processed
 * @throws Error if the signature verification fails
 */
export async function handleWebhook(
  body: string,
  signature: string
): Promise<WebhookResult> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

  const result: WebhookResult = {
    event: event.type,
    success: false,
    customerId: null,
    subscriptionId: null,
    metadata: {},
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      result.customerId = typeof session.customer === "string"
        ? session.customer
        : session.customer?.id ?? null;
      result.subscriptionId = typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id ?? null;
      result.metadata = {
        userId: session.client_reference_id ?? "",
        planId: session.metadata?.planId ?? "",
        interval: session.metadata?.interval ?? "",
      };
      result.success = true;
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      result.customerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id ?? null;
      result.subscriptionId = subscription.id;
      result.metadata = {
        status: subscription.status,
        planId: subscription.metadata?.planId ?? "",
        cancelAtPeriodEnd: String(subscription.cancel_at_period_end),
        currentPeriodEnd: String(subscription.current_period_end),
      };
      result.success = true;
      break;
    }

    case "customer.subscription.deleted": {
      const deletedSub = event.data.object as Stripe.Subscription;
      result.customerId = typeof deletedSub.customer === "string"
        ? deletedSub.customer
        : deletedSub.customer?.id ?? null;
      result.subscriptionId = deletedSub.id;
      result.metadata = {
        status: "canceled",
        planId: deletedSub.metadata?.planId ?? "",
      };
      result.success = true;
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      result.customerId = typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id ?? null;
      result.subscriptionId = typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription?.id ?? null;
      result.metadata = {
        attemptCount: String(invoice.attempt_count),
        amountDue: String(invoice.amount_due),
        currency: invoice.currency,
      };
      result.success = true;
      break;
    }

    default: {
      // Unhandled event type - acknowledge but mark as unprocessed
      result.metadata = { note: `Unhandled event type: ${event.type}` };
      result.success = false;
    }
  }

  return result;
}

/**
 * Retrieves a Stripe subscription by ID.
 *
 * @param subscriptionId - The Stripe subscription ID
 * @returns The full Stripe Subscription object
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancels a subscription at the end of the current billing period.
 * Does not immediately terminate access.
 *
 * @param subscriptionId - The Stripe subscription ID to cancel
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Creates a one-time Checkout session for purchasing a support pack.
 *
 * @param userId - The DiagOptim user ID
 * @param packType - The support pack type (e.g., "coup_de_pouce")
 * @returns The Checkout session URL for redirect
 * @throws Error if the pack type is unknown
 */
export async function createPackPayment(
  userId: string,
  packType: string
): Promise<string> {
  const priceId = PACK_PRICE_IDS[packType];
  if (!priceId) {
    throw new Error(`Unknown pack type: ${packType}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: userId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/pack-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
    metadata: {
      userId,
      packType,
      type: "support_pack",
    },
    invoice_creation: {
      enabled: true,
      invoice_data: {
        metadata: {
          userId,
          packType,
        },
      },
    },
  });

  if (!session.url) {
    throw new Error("Failed to create pack payment session URL");
  }

  return session.url;
}
