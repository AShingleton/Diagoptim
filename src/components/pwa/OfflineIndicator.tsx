"use client";

import { useCallback, useEffect, useState } from "react";

type Status = "online" | "offline" | "syncing";

export default function OfflineIndicator() {
  const [status, setStatus] = useState<Status>("online");
  const [syncInfo, setSyncInfo] = useState<string | null>(null);

  const handleOnline = useCallback(() => {
    setStatus("syncing");
    setSyncInfo("Synchronisation en cours...");

    // Auto-clear after sync result or timeout
    const timeout = setTimeout(() => {
      setStatus("online");
      setSyncInfo(null);
    }, 5000);

    const onSyncResult = (e: Event) => {
      const detail = (e as CustomEvent<{ synced: number; failed: number }>).detail;
      clearTimeout(timeout);

      if (detail.failed > 0) {
        setSyncInfo(
          `${detail.synced} synchronise(s), ${detail.failed} en erreur`
        );
        setTimeout(() => {
          setStatus("online");
          setSyncInfo(null);
        }, 4000);
      } else if (detail.synced > 0) {
        setSyncInfo(`${detail.synced} element(s) synchronise(s)`);
        setTimeout(() => {
          setStatus("online");
          setSyncInfo(null);
        }, 3000);
      } else {
        setStatus("online");
        setSyncInfo(null);
      }
    };

    window.addEventListener("diagoptim:sync-result", onSyncResult, {
      once: true,
    });

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("diagoptim:sync-result", onSyncResult);
    };
  }, []);

  const handleOffline = useCallback(() => {
    setStatus("offline");
    setSyncInfo(null);
  }, []);

  useEffect(() => {
    // Set initial status
    if (!navigator.onLine) {
      setStatus("offline");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for sync-complete from service worker
    const onSyncComplete = () => {
      setStatus("online");
      setSyncInfo(null);
    };
    window.addEventListener("diagoptim:sync-complete", onSyncComplete);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("diagoptim:sync-complete", onSyncComplete);
    };
  }, [handleOnline, handleOffline]);

  if (status === "online") return null;

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-[100]
        transition-all duration-300 ease-in-out
        ${status === "offline" || status === "syncing" ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}
      `}
      role="status"
      aria-live="polite"
    >
      <div
        className={`
          flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium
          ${
            status === "offline"
              ? "bg-amber-500 text-amber-950"
              : "bg-blue-500 text-white"
          }
        `}
      >
        {status === "offline" && (
          <>
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4m0 4h.01"
              />
            </svg>
            <span>Mode hors ligne - Les donnees seront synchronisees</span>
          </>
        )}
        {status === "syncing" && (
          <>
            <svg
              className="h-4 w-4 shrink-0 animate-spin"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{syncInfo ?? "Synchronisation..."}</span>
          </>
        )}
      </div>
    </div>
  );
}
