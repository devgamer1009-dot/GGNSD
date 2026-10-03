// CrownFall Service Worker - Offline Caching Strategy
// Version: 1.0.0

const CACHE_VERSION = 'v1';
const CACHE_NAME = `crownfall-${CACHE_VERSION}`;

// Core assets to cache immediately
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/index.css',
  '/assets/index.js'
];

// Assets to cache on first access
const DYNAMIC_ASSETS = [
  '/bench.html',
  '/stress-test.html',
  '/assets/gallery.html'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith('crownfall-') && cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Strategy: Cache First for static assets, Network First for dynamic content
  const isStaticAsset = 
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.json');
  
  if (isStaticAsset) {
    // Cache First - try cache, fallback to network
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((networkResponse) => {
              // Cache the new response
              if (networkResponse.ok) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseToCache);
                  });
              }
              return networkResponse;
            })
            .catch((error) => {
              console.error('[Service Worker] Fetch failed:', error);
              // Return offline fallback for HTML requests
              if (request.headers.get('accept')?.includes('text/html')) {
                return caches.match('/index.html');
              }
              throw error;
            });
        })
    );
  } else {
    // Network First - try network, fallback to cache
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Update cache with fresh data
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
          }
          return networkResponse;
        })
        .catch((error) => {
          console.log('[Service Worker] Network failed, trying cache:', error);
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return offline fallback for HTML requests
              if (request.headers.get('accept')?.includes('text/html')) {
                return caches.match('/index.html');
              }
              throw error;
            });
        })
    );
  }
});

// Message event - handle cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames
              .filter((cacheName) => cacheName.startsWith('crownfall-'))
              .map((cacheName) => caches.delete(cacheName))
          );
        })
        .then(() => {
          console.log('[Service Worker] Cache cleared');
        })
    );
  }
});

// Background sync for save data (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-saves') {
    console.log('[Service Worker] Syncing saves...');
    // Implement save sync logic here
  }
});

// Push notifications (optional)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('[Service Worker] Push received:', data);
    
    const options = {
      body: data.body || 'New update available!',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      vibrate: [200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'CrownFall', options)
    );
  }
});

console.log('[Service Worker] Loaded');
