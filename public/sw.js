// JQMS Enterprise — Offline-First Service Worker
const CACHE_NAME = "jqms-cache-v2";
const OFFLINE_URL = "/";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/jqms-icon.png",
  "/jqms-logo.png",
  "/favicon.png"
];

// 1. Install Event: Cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up legacy caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event: Network-First for navigation & API, Cache-First for static assets
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Only handle same-origin requests; ignore third-party CDNs, Cloudinary, Firebase
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Ignore serverless APIs
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/.netlify/")) return;

  // Navigation requests (HTML pages): Network first, fallback to cached index.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(OFFLINE_URL).then((cached) => {
            return cached || fetch(request);
          });
        })
    );
    return;
  }

  // Static assets (images, fonts, scripts): Stale-While-Revalidate with Content-Type verification
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const contentType = networkResponse.headers.get("content-type") || "";
            // Never cache HTML responses for JS/CSS assets (prevents bricking when router serves index.html for missing 404 chunks)
            const isAsset = url.pathname.startsWith("/assets/") || url.pathname.endsWith(".js") || url.pathname.endsWith(".css");
            if (isAsset && contentType.includes("text/html")) {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and not in cache, return error response for subresources so caller fails cleanly
          return cachedResponse || Response.error();
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Push Notification Support
self.addEventListener("push", (event) => {
  let data = { title: "JQMS Notification", body: "New update in JQMS Quality Management System." };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/"
    }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 5. Notification Click Handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
