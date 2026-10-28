const CACHE_NAME = "album-rater-v6";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css?v=6",
  "./js/state.js",
  "./js/dom.js",
  "./js/scoring.js",
  "./js/storage.js",
  "./js/edit.js",
  "./js/views.js",
  "./js/backup.js",
  "./js/app.js",
  "./manifest.webmanifest"
];

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request, {
          cache: "no-store"
        });

        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());

        return response;
      }
      catch (error) {
        const cachedResponse = await caches.match(event.request);

        if (cachedResponse) {
          return cachedResponse;
        }

        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }

        throw error;
      }
    })()
  );
});
