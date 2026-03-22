/**
 * Zapier/Make webhook integration.
 *
 * Triggers webhooks for external automation platforms when
 * key events occur in DiagOptim.
 *
 * @module integrations/zapier-webhook
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WebhookEvent =
  | "diagnostic.started"
  | "diagnostic.completed"
  | "roadmap.generated"
  | "roadmap.action.completed"
  | "action.completed"
  | "subscription.created"
  | "subscription.cancelled"
  | "document.uploaded"
  | "document.analyzed"
  | "report.generated"
  | "milestone.reached";

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface WebhookResult {
  success: boolean;
  statusCode: number | null;
  error: string | null;
  duration: number;
}

export interface WebhookRegistration {
  id: string;
  userId: string;
  event: WebhookEvent;
  url: string;
  secret: string;
  active: boolean;
  createdAt: string;
  lastTriggeredAt: string | null;
  failureCount: number;
}

// ---------------------------------------------------------------------------
// In-memory store (replace with Supabase in production)
// ---------------------------------------------------------------------------

const webhookStore = new Map<string, WebhookRegistration>();

// ---------------------------------------------------------------------------
// Registration API
// ---------------------------------------------------------------------------

/**
 * Generates a cryptographically random hex string for HMAC signing.
 */
function generateSecret(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates a unique ID for webhook registrations.
 */
function generateId(): string {
  return `wh_${Date.now().toString(36)}_${generateSecret(8)}`;
}

/**
 * Registers a new webhook for a user.
 *
 * @param userId - The user registering the webhook.
 * @param event  - The event to listen for.
 * @param url    - The destination webhook URL.
 * @returns The webhook registration record.
 */
export async function registerWebhook(
  userId: string,
  event: WebhookEvent,
  url: string,
): Promise<WebhookRegistration> {
  const isValid = await verifyWebhookUrl(url);
  if (!isValid) {
    throw new Error("Webhook URL is unreachable or invalid. Must be HTTPS.");
  }

  const registration: WebhookRegistration = {
    id: generateId(),
    userId,
    event,
    url,
    secret: generateSecret(),
    active: true,
    createdAt: new Date().toISOString(),
    lastTriggeredAt: null,
    failureCount: 0,
  };

  webhookStore.set(registration.id, registration);
  return registration;
}

/**
 * Unregisters (deletes) a webhook by ID.
 *
 * @param webhookId - The webhook registration ID to remove.
 */
export async function unregisterWebhook(webhookId: string): Promise<void> {
  if (!webhookStore.has(webhookId)) {
    throw new Error(`Webhook ${webhookId} not found`);
  }
  webhookStore.delete(webhookId);
}

/**
 * Lists all webhooks registered by a user.
 *
 * @param userId - The user whose webhooks to list.
 * @returns Array of webhook registrations.
 */
export async function listWebhooks(userId: string): Promise<WebhookRegistration[]> {
  const results: WebhookRegistration[] = [];
  for (const registration of webhookStore.values()) {
    if (registration.userId === userId) {
      results.push(registration);
    }
  }
  return results;
}

/**
 * Verifies that a webhook URL is reachable and uses HTTPS.
 *
 * @param url - The URL to verify.
 * @returns True if the URL is valid and reachable.
 */
export async function verifyWebhookUrl(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;

    // Reject private/internal IPs
    const hostname = parsed.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("172.")
    ) {
      return false;
    }

    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5_000),
    });
    // Accept any response (even 404/405) - we just need the server to be reachable
    return response.status < 500;
  } catch {
    return false;
  }
}

/**
 * Creates an HMAC-SHA256 signature for a payload.
 *
 * @param payload - The JSON string payload to sign.
 * @param secret  - The webhook secret key.
 * @returns The hex-encoded HMAC signature.
 */
async function signPayload(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Triggers all registered webhooks for a given event.
 *
 * @param event - The event that occurred.
 * @param data  - The event payload data.
 */
export async function triggerAllWebhooks(
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  const promises: Promise<void>[] = [];

  for (const registration of webhookStore.values()) {
    if (registration.event === event && registration.active) {
      promises.push(
        (async () => {
          const result = await triggerWebhookSigned(event, data, registration.url, registration.secret);
          registration.lastTriggeredAt = new Date().toISOString();
          if (!result.success) {
            registration.failureCount++;
            // Auto-disable after 10 consecutive failures
            if (registration.failureCount >= 10) {
              registration.active = false;
            }
          } else {
            registration.failureCount = 0;
          }
        })(),
      );
    }
  }

  await Promise.allSettled(promises);
}

// ---------------------------------------------------------------------------
// Webhook delivery API
// ---------------------------------------------------------------------------

/**
 * Sends a signed webhook payload to the specified URL.
 *
 * @param event      - The event type identifier.
 * @param data       - The event payload data.
 * @param webhookUrl - The destination webhook URL.
 * @param secret     - The HMAC secret for signing.
 * @returns The result of the webhook delivery attempt.
 */
export async function triggerWebhookSigned(
  event: WebhookEvent,
  data: Record<string, unknown>,
  webhookUrl: string,
  secret: string,
): Promise<WebhookResult> {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const body = JSON.stringify(payload);
  const start = Date.now();

  try {
    const url = new URL(webhookUrl);
    if (!["https:", "http:"].includes(url.protocol)) {
      return {
        success: false,
        statusCode: null,
        error: "Only HTTP(S) webhook URLs are supported",
        duration: Date.now() - start,
      };
    }

    const signature = await signPayload(body, secret);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "DiagOptim-Webhook/1.0",
        "X-DiagOptim-Event": event,
        "X-DiagOptim-Signature": `sha256=${signature}`,
        "X-DiagOptim-Timestamp": payload.timestamp,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    return {
      success: response.ok,
      statusCode: response.status,
      error: response.ok ? null : `HTTP ${response.status} ${response.statusText}`,
      duration: Date.now() - start,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      statusCode: null,
      error: message,
      duration: Date.now() - start,
    };
  }
}

// ---------------------------------------------------------------------------
// Legacy unsigned API (kept for backward compatibility)
// ---------------------------------------------------------------------------

/**
 * Sends a webhook payload to the specified URL (unsigned).
 *
 * @param event      - The event type identifier.
 * @param data       - The event payload data.
 * @param webhookUrl - The destination webhook URL (Zapier/Make/custom).
 * @returns The result of the webhook delivery attempt.
 */
export async function triggerWebhook(
  event: WebhookEvent,
  data: Record<string, unknown>,
  webhookUrl: string,
): Promise<WebhookResult> {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const start = Date.now();

  try {
    // Validate URL to prevent SSRF
    const url = new URL(webhookUrl);
    if (!["https:", "http:"].includes(url.protocol)) {
      return {
        success: false,
        statusCode: null,
        error: "Only HTTP(S) webhook URLs are supported",
        duration: Date.now() - start,
      };
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "DiagOptim-Webhook/1.0",
        "X-DiagOptim-Event": event,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000), // 10s timeout
    });

    return {
      success: response.ok,
      statusCode: response.status,
      error: response.ok ? null : `HTTP ${response.status} ${response.statusText}`,
      duration: Date.now() - start,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      statusCode: null,
      error: message,
      duration: Date.now() - start,
    };
  }
}

/**
 * Sends a webhook with retry logic.
 *
 * @param event      - The event type.
 * @param data       - The event payload.
 * @param webhookUrl - The destination URL.
 * @param maxRetries - Maximum number of retry attempts (default: 3).
 * @returns The result of the last attempt.
 */
export async function triggerWebhookWithRetry(
  event: WebhookEvent,
  data: Record<string, unknown>,
  webhookUrl: string,
  maxRetries: number = 3,
): Promise<WebhookResult> {
  let lastResult: WebhookResult | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 1s, 2s, 4s
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt - 1) * 1000),
      );
    }

    lastResult = await triggerWebhook(event, data, webhookUrl);

    if (lastResult.success) return lastResult;

    // Don't retry on 4xx errors (client error)
    if (lastResult.statusCode && lastResult.statusCode >= 400 && lastResult.statusCode < 500) {
      return lastResult;
    }
  }

  return lastResult!;
}
