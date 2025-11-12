const CACHE_NAME = 'bank-sampah-v1';
const urlsToCache = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/offline.html'
];

// Install event - cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // IMPORTANT: Never cache API calls or dynamic data
  // This ensures fresh data on every app open
  if (
    url.pathname.startsWith('/api/') ||
    request.method !== 'GET' ||
    url.pathname.includes('_next/data')
  ) {
    // Always fetch from network for API calls
    event.respondWith(fetch(request));
    return;
  }

  // For static assets, use cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(request).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Only cache GET requests for static assets
            if (request.method === 'GET') {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }

            return response;
          }
        ).catch(() => {
          // If both cache and network fail, show offline page
          return caches.match('/offline.html');
        });
      })
  );
});
