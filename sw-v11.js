const CACHE_NAME = "album-rater-v21";

const FILES_TO_CACHE = [
  "./index.html",
  "./style-v11.css?v=21",
  "./js/state.js?v=21",
  "./js/dom.js?v=21",
  "./js/scoring.js?v=21",
  "./js/storage.js?v=21",
  "./js/edit.js?v=21",
  "./js/views.js?v=21",
  "./js/backup.js?v=21",
  "./js/app.js?v=21",
  "./manifest.webmanifest",
  "./assets/cards/diamond.png",
  "./assets/cards/purple.png",
  "./assets/cards/gold.png",
  "./assets/cards/silver.png",
  "./assets/cards/bronze.png"
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
