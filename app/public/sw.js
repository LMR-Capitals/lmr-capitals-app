// LMR Capitals — Service Worker v10
// Fixes: lmrcapitals.com now always network-first (was cache-first — served old code)

const CACHE = 'lmr-v10';
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

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (e.request.method !== 'GET') return;

  // ── HTML PAGE NAVIGATIONS → always NETWORK FIRST ──────────────────────────
  // mode==='navigate' covers ALL of: lmrcapitals.com, lmrcapitals.com/,
  // lmrcapitals.com/index.html, netlify preview URLs — no URL pattern needed
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // ── External (CDN, Supabase, fonts) → network only ─────────────────────────
  if (!url.startsWith(self.location.origin)) {
    e.respondWith(
      fetch(e.request).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  // ── Static assets (chart.js, icons) → cache first ──────────────────────────
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => new Response('Offline', { status: 503 }));
    })
  );
});
