// LMR Capitals — Service Worker v9
// Network-first for HTML (always get latest), cache-first for static assets

const CACHE = 'lmr-v9';
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
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Skip non-GET and browser-extension requests
  if (e.request.method !== 'GET' || !url.startsWith('http')) return;

  // ── index.html & root → NETWORK FIRST (always get latest) ──
  if (url.endsWith('/') || url.includes('index.html') || url.includes('localhost:3000') || url.includes('netlify.app')) {
    if (!url.includes('.') || url.endsWith('/') || url.includes('index.html')) {
      e.respondWith(
        fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        }).catch(() => caches.match(e.request))
      );
      return;
    }
  }

  // ── notion-images → network only ──
  if (url.includes('notion-images/')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 404 })));
    return;
  }

  // ── Supabase / CDN / external → network only ──
  if (!url.includes(self.location.origin)) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // ── Static assets (JS, CSS, icons) → cache first ──
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
