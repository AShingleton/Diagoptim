"use client";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const installCallbacks: Array<() => void> = [];

const VISIT_COUNT_KEY = "diagoptim-visit-count";
const DISMISS_KEY = "diagoptim-install-dismissed";
const MIN_VISITS = 3;
const DISMISS_DAYS = 7;

// ---------------------------------------------------------------------------
// Capture install prompt
// ---------------------------------------------------------------------------

/**
 * Initializes event listeners for install prompt capture.
 * Call once in your root layout or a top-level client component.
 */
export function captureInstallPrompt(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });

  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
    for (const cb of installCallbacks) {
      cb();
    }
  });

  // Check if already installed
  if (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone
  ) {
    installed = true;
  }

  // Track visit count
  const count = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0", 10);
  localStorage.setItem(VISIT_COUNT_KEY, String(count + 1));
}

// ---------------------------------------------------------------------------
// Show install prompt
// ---------------------------------------------------------------------------

/**
 * Triggers the native browser install dialog.
 * @returns The user's choice, or null if prompt is unavailable.
 */
export async function showInstallPrompt(): Promise<"accepted" | "dismissed" | null> {
  if (!deferredPrompt) return null;

  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  deferredPrompt = null;
  return outcome;
}

// ---------------------------------------------------------------------------
// State checks
// ---------------------------------------------------------------------------

/**
 * Returns true if the app is already installed (display-mode: standalone).
 */
export function isInstalled(): boolean {
  if (typeof window === "undefined") return false;

  return (
    installed ||
    window.matchMedia("(display-mode: standalone)").matches ||
    !!(window.navigator as Navigator & { standalone?: boolean }).standalone
  );
}

/**
 * Returns true if the install prompt is available.
 */
export function canInstall(): boolean {
  return deferredPrompt !== null && !installed;
}

// ---------------------------------------------------------------------------
// Install callback
// ---------------------------------------------------------------------------

/**
 * Registers a callback that fires when the app is installed.
 * Returns a cleanup function.
 */
export function onInstalled(callback: () => void): () => void {
  installCallbacks.push(callback);
  return () => {
    const idx = installCallbacks.indexOf(callback);
    if (idx >= 0) installCallbacks.splice(idx, 1);
  };
}

// ---------------------------------------------------------------------------
// Banner display logic
// ---------------------------------------------------------------------------

/**
 * Determines whether the install banner should be shown.
 * Shows after MIN_VISITS visits and not within DISMISS_DAYS of last dismissal.
 */
export function shouldShowBanner(lastDismissed: Date | null): boolean {
  if (typeof window === "undefined") return false;
  if (isInstalled()) return false;
  if (!canInstall()) return false;

  // Check visit count
  const count = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0", 10);
  if (count < MIN_VISITS) return false;

  // Check dismiss cooldown
  if (lastDismissed) {
    const daysSinceDismiss =
      (Date.now() - lastDismissed.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDismiss < DISMISS_DAYS) return false;
  }

  return true;
}

/**
 * Records the timestamp when the user dismissed the install banner.
 */
export function recordDismiss(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DISMISS_KEY, new Date().toISOString());
}

/**
 * Returns the last dismiss date, or null if never dismissed.
 */
export function getLastDismissed(): Date | null {
  if (typeof window === "undefined") return null;
  const val = localStorage.getItem(DISMISS_KEY);
  return val ? new Date(val) : null;
}
