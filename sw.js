// KVR Car Care - Progressive Web App Service Worker
const CACHE_NAME = 'kvr-car-care-v45-clean-slides';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'customer.html',
  'owner.html',
  '404.html',
  'demo.html',
  'css/style.css',
  'js/audio.js',
  'js/pwa.js',
  'js/email-auth.js',
  'js/supabase-config.js',
  'js/touch-bubbles.js',
  'js/db.js',
  'js/customer.js',
  'js/owner.js',
  'js/pdf-export.js',
  'slide-workshop-bays.svg',
  'slide-ac-bay.svg',
  'slide-diagnostics.svg',
  'slide-detailing.svg',
  'icon-192.png',
  'icon-512.png',
  'icon-customer-192.png',
  'icon-customer-512.png',
  'icon-owner-192.png',
  'icon-owner-512.png',
  'manifest.json',
  'manifest-customer.json',
  'manifest-owner.json'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) {
            return caches.delete(k);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const requestUrl = new URL(e.request.url);
  if (e.request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;

  // Never cache Supabase auth requests or external APIs
  if (requestUrl.pathname.includes('/auth/') || requestUrl.hash.includes('access_token')) {
    return;
  }

  // Network first for HTML, Cache fallback for offline
  if (e.request.mode === 'navigate' || requestUrl.pathname.endsWith('.html') || requestUrl.pathname === '/') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then((res) => res || caches.match('./index.html')))
    );
    return;
  }

  // Stale-while-revalidate for assets
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse.ok) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
