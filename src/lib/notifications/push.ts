/**
 * PWA push notification service.
 *
 * Manages Web Push API subscriptions and sends push notifications
 * to registered service workers. Requires VAPID keys configured
 * via environment variables.
 *
 * @module notifications/push
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Web Push subscription data stored per user. */
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime: number | null;
}

/** Push notification payload. */
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, string>;
}

/** Result of a push notification send attempt. */
export interface PushSendResult {
  success: boolean;
  statusCode: number | null;
  error: string | null;
}

/** VAPID configuration for Web Push. */
interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

// ---------------------------------------------------------------------------
// In-memory subscription store (replace with database in production)
// ---------------------------------------------------------------------------

const subscriptionStore = new Map<string, PushSubscriptionData>();

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

function getVapidConfig(): VapidConfig {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:contact@diagoptim.com";

  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables must be set for push notifications",
    );
  }

  return { publicKey, privateKey, subject };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sends a push notification to a registered user.
 *
 * If the user has no registered subscription, the call is a no-op and
 * returns a result with `success: false`.
 *
 * @param userId - The user ID whose subscription to target.
 * @param title  - Notification title.
 * @param body   - Notification body text.
 * @param url    - Optional URL to open when the notification is clicked.
 * @returns The result of the send attempt.
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  url?: string,
): Promise<PushSendResult> {
  const subscription = subscriptionStore.get(userId);

  if (!subscription) {
    return {
      success: false,
      statusCode: null,
      error: `No push subscription registered for user ${userId}`,
    };
  }

  const vapid = getVapidConfig();
  const payload: PushNotificationPayload = {
    title,
    body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    url: url ?? "/dashboard",
    tag: `diagoptim-${Date.now()}`,
  };

  try {
    // Dynamic import to avoid bundling web-push in client builds
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const webPush = (await import(/* webpackIgnore: true */ "web-push" as string)) as {
      setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
      sendNotification: (
        sub: { endpoint: string; keys: { p256dh: string; auth: string } },
        payload: string,
        options?: { TTL?: number },
      ) => Promise<{ statusCode: number }>;
    };

    webPush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    };

    const result = await webPush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      { TTL: 60 * 60 }, // 1 hour TTL
    );

    return {
      success: true,
      statusCode: result.statusCode,
      error: null,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown push notification error";

    // If subscription is expired or invalid, remove it
    if (errorMessage.includes("410") || errorMessage.includes("404")) {
      subscriptionStore.delete(userId);
    }

    return {
      success: false,
      statusCode: null,
      error: errorMessage,
    };
  }
}

/**
 * Registers a push subscription for a user.
 *
 * Stores the subscription data so that future push notifications
 * can be delivered to the user's browser/device.
 *
 * @param userId       - The user ID to associate with the subscription.
 * @param subscription - The PushSubscription object from the browser's Push API.
 */
export async function registerSubscription(
  userId: string,
  subscription: PushSubscriptionData,
): Promise<void> {
  // Validate subscription data
  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    throw new Error("Invalid push subscription: endpoint and keys (p256dh, auth) are required");
  }

  // In production, persist to database
  subscriptionStore.set(userId, {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    expirationTime: subscription.expirationTime,
  });
}

/**
 * Unregisters (removes) a push subscription for a user.
 *
 * @param userId - The user ID whose subscription to remove.
 */
export async function unregisterSubscription(userId: string): Promise<void> {
  subscriptionStore.delete(userId);
}

/**
 * Checks whether a user has an active push subscription.
 *
 * @param userId - The user ID to check.
 * @returns `true` if the user has a registered subscription.
 */
export function hasSubscription(userId: string): boolean {
  return subscriptionStore.has(userId);
}

/**
 * Returns the VAPID public key for client-side subscription registration.
 *
 * @returns The VAPID public key string.
 */
export function getVapidPublicKey(): string {
  const vapid = getVapidConfig();
  return vapid.publicKey;
}
