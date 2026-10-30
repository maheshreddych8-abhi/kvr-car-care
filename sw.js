// KVR Car Care - Progressive Web App Service Worker
const CACHE_NAME = 'kvr-car-care-v3';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'customer.html',
  'owner.html',
  'demo.html',
  'css/style.css',
  'js/audio.js',
  'js/pwa.js',
  'js/owner-access.js',
  'js/db.js',
  'js/customer.js',
  'js/owner.js',
  'js/pdf-export.js',
  'kvr-banner.png',
  'icon-customer-192.png',
  'icon-customer-512.png',
  'icon-owner-192.png',
  'icon-owner-512.png',
  'manifest-customer.json',
  'manifest-owner.json',
  'manifest.json',
  'festival-offer.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
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
  // Network first, falling back to cache
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, resClone);
        });
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
