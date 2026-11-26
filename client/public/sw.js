const CACHE_NAME = "ymca-match-v2";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/favicon.svg",
  "/pwa-192.png",
  "/pwa-512.png",
  "/manifest.json",
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Never cache dynamic API requests, socket.io, or mutations
  if (
    url.includes("/socket.io/") ||
    url.includes("/api/") ||
    url.includes("/user/") ||
    url.includes("/request/") ||
    url.includes("/profile/") ||
    url.includes("/chat/") ||
    url.includes("/message/") ||
    url.includes("/auth/") ||
    url.includes("/uploads/") ||
    event.request.method !== "GET"
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) return cachedResponse;
      if (event.request.mode === "navigate") {
        const indexHtml = await caches.match("/index.html");
        if (indexHtml) return indexHtml;
      }
      return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
    })
  );
});
