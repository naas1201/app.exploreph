const CACHE_NAME = "exploreph-v2";
const STATIC_ASSETS = [
    "/",
    "/index.html",
    "/css/styles.css",
    "/js/app.js",
    "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js",
    "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js"
];

// Install Service Worker and Cache Static Assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate Service Worker and Remove Old Caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Data (Cache First for Static Files, Network First for Firebase)
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Firebase API Calls - Network First, then Cache
    if (url.origin.includes("firebaseio.com")) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                })
                .catch(() => caches.match(event.request)) // Fallback to cache if offline
        );
        return;
    }

    // Static Files - Cache First
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});
