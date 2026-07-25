/**
 * PostHog analytics — 100% conditional on NEXT_PUBLIC_POSTHOG_KEY.
 *
 * posthog-js is loaded via dynamic import() only when the key exists.
 * When it's missing, nothing is imported, no network request fires.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ph: any = null;
let initCalled = false;

export function initPostHog(): void {
  if (initCalled) return;
  initCalled = true;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  // Skip if no key, placeholder value, or not in browser
  if (!key || typeof window === "undefined" || key.endsWith("...") || key.length < 10) return;

  // Dynamic import keeps posthog-js out of the initial bundle.
  // The import only executes when this function is actually called at runtime.
  import("posthog-js").then((mod) => {
    const posthog = mod.default;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
    });
    ph = posthog;
  });
}

// Typed event tracking
export type DiagOptimEvent =
  | "diagnostic_started"
  | "diagnostic_completed"
  | "document_uploaded"
  | "report_downloaded"
  | "subscription_created"
  | "subscription_cancelled"
  | "support_pack_purchased";

export function trackEvent(event: DiagOptimEvent, properties?: Record<string, unknown>): void {
  ph?.capture(event, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  ph?.identify(userId, traits);
}

export function resetUser(): void {
  ph?.reset();
}
