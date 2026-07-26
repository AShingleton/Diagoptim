"use client";

import { useEffect } from "react";

/**
 * PostHog analytics provider.
 * Only loads posthog-js when NEXT_PUBLIC_POSTHOG_KEY is set.
 * When the key is missing, this is a zero-cost passthrough — no imports, no fetches.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || key.endsWith("...") || key.length < 10) return;

    // Only import the analytics module (which itself dynamically imports posthog-js)
    // when we actually have a key configured.
    import("@/lib/analytics/posthog").then((mod) => {
      mod.initPostHog();
    });
  }, []);

  return <>{children}</>;
}
