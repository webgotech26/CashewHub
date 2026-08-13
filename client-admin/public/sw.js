/* ─────────────────────────────────────────────────────────────────
   Petrichor Naturals Admin — Service Worker
   Strategy: Network-first for API calls, cache-first for assets.
   ───────────────────────────────────────────────────────────────── */

const CACHE_NAME    = 'pn-admin-v1';
const OFFLINE_URL   = '/';

/* Assets to pre-cache on install */
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/assets/cashewlogo.png',
  '/assets/logoo.png',
];

/* ── Install: pre-cache shell assets ─────────────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

/* ── Activate: clear old caches ──────────────────────────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* ── Fetch: network-first for API, cache-first for static ─────── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET and cross-origin requests */
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !url.pathname.startsWith('/api')) return;

  /* API calls — network-first, no caching */
  if (url.pathname.startsWith('/api')) {
    event.respondWith(fetch(request));
    return;
  }

  /* Static assets — cache-first, fallback to network */
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        /* Only cache successful same-origin responses */
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
        return response;
      });
    }).catch(() => caches.match(OFFLINE_URL))
  );
});
