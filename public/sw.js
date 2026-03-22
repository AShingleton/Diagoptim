/// <reference lib="webworker" />

const CACHE_VERSION = "diagoptim-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const VIDEO_CACHE = `${CACHE_VERSION}-video`;
const PDF_CACHE = `${CACHE_VERSION}-pdf`;

const STATIC_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
];

// ---------------------------------------------------------------------------
// Install
// ---------------------------------------------------------------------------

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate — clean old caches
// ---------------------------------------------------------------------------

self.addEventListener("activate", (event) => {
  const currentCaches = new Set([STATIC_CACHE, API_CACHE, VIDEO_CACHE, PDF_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("diagoptim-") && !currentCaches.has(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ---------------------------------------------------------------------------
// Fetch strategies
// ---------------------------------------------------------------------------

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith("http")) return;

  // API requests — NetworkFirst
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Training videos — CacheFirst
  if (/\/training\/.*\.(mp4|webm)/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, VIDEO_CACHE));
    return;
  }

  // PDF memory sheets — CacheFirst
  if (/\/memory-sheets\/.*\.pdf/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, PDF_CACHE));
    return;
  }

  // Navigation requests — NetworkFirst with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match("/offline").then((r) =>
            r || new Response("Offline", { status: 503 })
          )
        )
    );
    return;
  }

  // Static assets — StaleWhileRevalidate
  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});

// ---------------------------------------------------------------------------
// Background Sync
// ---------------------------------------------------------------------------

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-diagnostic-answers") {
    event.waitUntil(syncDiagnosticAnswers());
  }
  if (event.tag === "sync-offline-data") {
    event.waitUntil(syncOfflineData());
  }
});

async function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("diagoptim-offline", 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function syncDiagnosticAnswers() {
  try {
    const db = await openSyncDB();
    const tx = db.transaction("pending-actions", "readonly");
    const store = tx.objectStore("pending-actions");

    const actions = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    // Filter for diagnostic answer actions
    const diagnosticActions = actions.filter(
      (a) => a.url && a.url.includes("/diagnostic")
    );

    let syncedCount = 0;

    for (const action of diagnosticActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: { "Content-Type": "application/json" },
          body: action.method !== "GET" ? action.body : undefined,
        });

        if (response.ok) {
          const deleteTx = db.transaction("pending-actions", "readwrite");
          deleteTx.objectStore("pending-actions").delete(action.id);
          await new Promise((resolve) => {
            deleteTx.oncomplete = resolve;
          });
          syncedCount++;
        }
      } catch {
        // Will retry on next sync
      }
    }

    // Notify clients of sync completion
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      client.postMessage({
        type: "SYNC_DIAGNOSTIC_COMPLETE",
        synced: syncedCount,
        remaining: diagnosticActions.length - syncedCount,
      });
    }
  } catch {
    // DB not available yet, will retry
  }
}

async function syncOfflineData() {
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({ type: "SYNC_COMPLETE" });
  }
}

// ---------------------------------------------------------------------------
// Push notifications
// ---------------------------------------------------------------------------

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    return;
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/icon-72.png",
    tag: data.tag || "diagoptim-notification",
    data: { url: data.url || "/dashboard" },
    actions: [
      { action: "open", title: "Ouvrir" },
      { action: "dismiss", title: "Ignorer" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// ---------------------------------------------------------------------------
// Caching strategies
// ---------------------------------------------------------------------------

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: "Offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}
