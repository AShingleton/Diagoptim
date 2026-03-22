"use client";

// ---------------------------------------------------------------------------
// IndexedDB schema for offline cache
// ---------------------------------------------------------------------------

const DB_NAME = "diagoptim-offline";
const DB_VERSION = 1;

const STORES = {
  "diagnostic-progress": "Diagnostic en cours (derniere question, reponses)",
  "roadmap-actions": "Actions de la feuille de route avec statuts",
  "memory-sheets": "Fiches memo telechargees (PDF blob)",
  "dashboard-snapshot": "Dernier snapshot du dashboard",
  "company-profile": "Profil entreprise (toujours dispo)",
  "pending-sync": "Actions en attente de synchronisation",
} as const;

type StoreName = keyof typeof STORES;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SyncAction {
  id: string;
  url: string;
  method: string;
  body: string;
  createdAt: number;
}

interface SyncResult {
  id: string;
  success: boolean;
  error?: string;
}

interface OfflineRecord {
  id: string;
  _updatedAt?: number;
}

// ---------------------------------------------------------------------------
// Database access
// ---------------------------------------------------------------------------

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const storeName of Object.keys(STORES)) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: "id" });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

export async function saveOffline(
  store: StoreName,
  key: string,
  data: unknown,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const record: OfflineRecord & Record<string, unknown> = {
      id: key,
      data,
      _updatedAt: Date.now(),
    };
    tx.objectStore(store).put(record);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getOffline(
  store: StoreName,
  key: string,
): Promise<unknown> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const request = tx.objectStore(store).get(key);
    request.onsuccess = () => {
      db.close();
      const result = request.result;
      resolve(result ? result.data : null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function getAllOffline(store: StoreName): Promise<unknown[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const request = tx.objectStore(store).getAll();
    request.onsuccess = () => {
      db.close();
      resolve(request.result ?? []);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function deleteOffline(
  store: StoreName,
  key: string,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function clearStore(store: StoreName): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).clear();
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

// ---------------------------------------------------------------------------
// Pending sync queue
// ---------------------------------------------------------------------------

export async function queueForSync(action: Omit<SyncAction, "id" | "createdAt">): Promise<void> {
  const db = await openDB();
  const syncAction: SyncAction = {
    ...action,
    id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending-sync", "readwrite");
    tx.objectStore("pending-sync").put(syncAction);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });

  // Request background sync if available
  // This runs after the put completes via the promise chain above
}

/**
 * Registers a background sync with the service worker.
 * Should be called after queueForSync.
 */
export async function requestBackgroundSync(tag = "sync-diagnostic-answers"): Promise<void> {
  if (
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("SyncManager" in window)
  ) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  await (
    registration as ServiceWorkerRegistration & {
      sync: { register: (tag: string) => Promise<void> };
    }
  ).sync.register(tag);
}

/**
 * Processes all pending sync actions by replaying them against the API.
 * Called when connectivity is restored.
 */
export async function processSyncQueue(): Promise<SyncResult[]> {
  const db = await openDB();

  const actions = await new Promise<SyncAction[]>((resolve, reject) => {
    const tx = db.transaction("pending-sync", "readonly");
    const request = tx.objectStore("pending-sync").getAll();
    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = () => reject(request.error);
  });

  // Sort by creation time to maintain order
  actions.sort((a, b) => a.createdAt - b.createdAt);

  const results: SyncResult[] = [];

  for (const action of actions) {
    try {
      const response = await fetch(action.url, {
        method: action.method,
        headers: { "Content-Type": "application/json" },
        body: action.method !== "GET" ? action.body : undefined,
      });

      if (response.ok) {
        // Remove successfully synced action
        const deleteTx = db.transaction("pending-sync", "readwrite");
        deleteTx.objectStore("pending-sync").delete(action.id);
        await new Promise<void>((resolve) => {
          deleteTx.oncomplete = () => resolve();
        });
        results.push({ id: action.id, success: true });
      } else {
        results.push({
          id: action.id,
          success: false,
          error: `HTTP ${response.status}`,
        });
      }
    } catch (err) {
      results.push({
        id: action.id,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  db.close();
  return results;
}

// ---------------------------------------------------------------------------
// Storage usage
// ---------------------------------------------------------------------------

export async function getStorageUsage(): Promise<{ used: number; quota: number }> {
  if (typeof navigator !== "undefined" && "storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage ?? 0,
      quota: estimate.quota ?? 0,
    };
  }
  return { used: 0, quota: 0 };
}

// ---------------------------------------------------------------------------
// Online/offline event listeners
// ---------------------------------------------------------------------------

let syncInProgress = false;

export function initOfflineSync(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("online", async () => {
    if (syncInProgress) return;
    syncInProgress = true;
    try {
      const results = await processSyncQueue();
      const synced = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      window.dispatchEvent(
        new CustomEvent("diagoptim:sync-result", {
          detail: { synced, failed },
        })
      );
    } finally {
      syncInProgress = false;
    }
  });

  // Listen for sync complete messages from service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
      if (event.data?.type === "SYNC_COMPLETE" || event.data?.type === "SYNC_DIAGNOSTIC_COMPLETE") {
        window.dispatchEvent(
          new CustomEvent("diagoptim:sync-complete", {
            detail: event.data,
          })
        );
      }
    });
  }
}

/**
 * Returns whether the browser is currently online.
 */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}
