importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE_NAME = "exploreph-cache-v1";

// Offline fallback page (make sure this file exists in your project)
const offlineFallbackPage = "offline.html";

// Listen for a SKIP_WAITING message from your app to immediately activate the new service worker
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// During installation, cache the offline fallback page and key assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Add all assets you want available offline. Adjust paths as necessary.
        return cache.addAll([
          offlineFallbackPage,
          "index.html",
          "css/styles.css",
          "js/app.js",
          "data/listings.json"
        ]);
      })
  );
});

// Enable navigation preload if supported
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Handle fetch events
self.addEventListener('fetch', (event) => {
  // For navigation requests, try network first, then fallback to offline page if necessary.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Use preload response if available
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }
          // Try to fetch the request from the network
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          // If network fetch fails, return the offline fallback page from the cache.
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(offlineFallbackPage);
          return cachedResponse;
        }
      })()
    );
  } else {
    // For non-navigation requests, attempt to return a cached response, falling back to the network.
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          return cachedResponse || fetch(event.request);
        })
    );
  }
});
