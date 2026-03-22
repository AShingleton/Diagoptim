"use client";

import { useEffect } from "react";
import { initPostHog, POSTHOG_ENABLED } from "@/lib/analytics/posthog";

/**
 * PostHog analytics provider.
 * Only initializes if NEXT_PUBLIC_POSTHOG_KEY is set.
 * Include this component once in the root layout.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  if (!POSTHOG_ENABLED) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
