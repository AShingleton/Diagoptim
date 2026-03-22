import posthog from "posthog-js";

export const POSTHOG_ENABLED =
  typeof window !== "undefined" &&
  !!process.env.NEXT_PUBLIC_POSTHOG_KEY &&
  process.env.NEXT_PUBLIC_POSTHOG_KEY !== "";

export function initPostHog(): void {
  if (!POSTHOG_ENABLED) return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") {
        ph.debug();
      }
    },
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
  if (!POSTHOG_ENABLED) return;
  posthog.capture(event, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (!POSTHOG_ENABLED) return;
  posthog.identify(userId, traits);
}

export function resetUser(): void {
  if (!POSTHOG_ENABLED) return;
  posthog.reset();
}

export { posthog };
