"use client";

import { useCallback, useEffect, useState } from "react";
import {
  captureInstallPrompt,
  showInstallPrompt,
  shouldShowBanner,
  getLastDismissed,
  recordDismiss,
  isInstalled,
  onInstalled,
} from "@/lib/pwa/install-prompt";

export default function InstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    captureInstallPrompt();

    // Small delay to let the beforeinstallprompt event fire
    const timer = setTimeout(() => {
      const lastDismissed = getLastDismissed();
      if (shouldShowBanner(lastDismissed)) {
        setVisible(true);
      }
    }, 2000);

    const cleanup = onInstalled(() => {
      setVisible(false);
    });

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, []);

  const handleInstall = useCallback(async () => {
    const result = await showInstallPrompt();
    if (result === "accepted") {
      setVisible(false);
    } else if (result === "dismissed") {
      recordDismiss();
      setVisible(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    recordDismiss();
    setVisible(false);
  }, []);

  if (!visible || isInstalled()) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg animate-in slide-in-from-bottom-4 duration-300"
      role="banner"
      aria-label="Installer DiagOptim"
    >
      <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-white p-4 shadow-lg dark:border-blue-800 dark:bg-slate-900">
        {/* App icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600">
          <svg
            className="h-7 w-7 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Installer DiagOptim
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            Acces rapide depuis votre ecran d&apos;accueil
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleDismiss}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fermer"
          >
            Plus tard
          </button>
          <button
            onClick={handleInstall}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Installer
          </button>
        </div>
      </div>
    </div>
  );
}
