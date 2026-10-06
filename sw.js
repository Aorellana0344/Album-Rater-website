const CACHE_NAME = "album-rater-v5";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
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


self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches
        .open(CACHE_NAME)
        .then(cache => {

          return cache.addAll(
            FILES_TO_CACHE
          );

        })

    );

  }
);


self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches
        .keys()
        .then(cacheNames => {

          return Promise.all(

            cacheNames.map(
              cacheName => {

                if (
                  cacheName !== CACHE_NAME
                ) {

                  return caches.delete(
                    cacheName
                  );

                }

              }
            )

          );

        })

    );

  }
);


self.addEventListener(
  "fetch",
  event => {

    event.respondWith(

      caches
        .match(event.request)
        .then(response => {

          return (
            response ||
            fetch(event.request)
          );

        })

    );

  }
);