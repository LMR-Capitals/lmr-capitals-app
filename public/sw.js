// LMR Capitals — public asset cache only. v14 removes previously cached API/HTML responses.

const CACHE = 'lmr-v14';
const STATIC = [
  './chart.umd.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    // Delete ALL old caches (clears v8, v9 stale HTML)
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Only cache the explicitly public offline assets. Never persist authenticated
// API responses or HTML in a device-wide cache shared between signed-in users.
const PUBLIC_ASSETS = new Set(STATIC.map(path => new URL(path, self.location.href).href));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || e.request.headers.has('Authorization') ||
      !PUBLIC_ASSETS.has(e.request.url)) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(async response => {
      const policy = response.headers.get('Cache-Control') || '';
      if (response.ok && !/no-store|private/i.test(policy)) {
        const cache = await caches.open(CACHE);
        await cache.put(e.request, response.clone());
      }
      return response;
    }))
  );
});
