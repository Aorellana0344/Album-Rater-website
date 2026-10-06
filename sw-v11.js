const CACHE_NAME = "album-rater-v12";

const FILES_TO_CACHE = [
  "./index.html",
  "./style-v11.css?v=12",
  "./js/state.js?v=12",
  "./js/dom.js?v=12",
  "./js/scoring.js?v=12",
  "./js/storage.js?v=12",
  "./js/edit.js?v=12",
  "./js/views.js?v=12",
  "./js/backup.js?v=12",
  "./js/app.js?v=12",
  "./manifest.webmanifest"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.map(name => name === CACHE_NAME ? null : caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(event.request, { cache: "no-store" });
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, fresh.clone());
        return fresh;
      }
      catch (error) {
        const cached = await caches.match(event.request);
        if (cached) return cached;

        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }

        throw error;
      }
    })()
  );
});
