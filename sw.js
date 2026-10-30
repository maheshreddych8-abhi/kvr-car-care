// KVR Car Care - Progressive Web App Service Worker
const CACHE_NAME = 'kvr-car-care-v13';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'customer.html',
  'owner.html',
  'demo.html',
  'css/style.css',
  'js/audio.js',
  'js/pwa.js',
  'js/owner-access.js?v=otp-entry-4',
  'js/email-auth.js?v=otp-channel-2',
  'js/supabase-config.js',
  'js/touch-bubbles.js',
  'js/db.js',
  'js/customer.js?v=otp-channel-2',
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
  'festival-offer.svg',
  'supabase-staff-schema.sql'
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
  const requestUrl = new URL(e.request.url);
  if (e.request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;

  // Keep auth and other third-party requests out of the offline cache.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        }
        return res;
      })
      .catch(async (error) => {
        const cached = await caches.match(e.request);
        if (cached) return cached;
        throw error;
      })
  );
});
