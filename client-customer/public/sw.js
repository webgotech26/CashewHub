/**
 * sw.js — Petrichor Naturals Service Worker
 *
 * Strategy:
 *   • Static assets (JS, CSS, images, fonts) → Cache-First
 *   • API calls (/api/*) → Network-First (never serve stale order/product data)
 *   • Navigation (HTML) → Network-First with offline fallback
 *
 * Cache names use a version suffix. Bump CACHE_VERSION on each deploy
 * to instantly invalidate old caches.
 */

const CACHE_VERSION   = 'v1';
const STATIC_CACHE    = `petrichor-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE   = `petrichor-dynamic-${CACHE_VERSION}`;

/* Assets to pre-cache on install */
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/logoo.png',
  '/assets/cashewlogo.png',
];

/* ── Install: pre-cache shell assets ─────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  /* Activate immediately — don't wait for old SW to die */
  self.skipWaiting();
});

/* ── Activate: clean up old caches ──────────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  /* Take control of all open tabs immediately */
  self.clients.claim();
});

/* ── Fetch: route-based caching strategy ────────────────────── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* 1. Skip non-GET and non-http(s) requests */
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  /* 2. API calls → Network-First (fresh data always preferred) */
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  /* 3. Google Fonts → Cache-First (rarely changes) */
  if (url.hostname.includes('fonts.g') || url.hostname.includes('fonts.googleapis')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  /* 4. Static assets (JS/CSS/images/fonts) → Cache-First */
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?|ttf|ico)$/)
  ) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  /* 5. HTML navigation → Network-First with offline fallback */
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  /* 6. Everything else → Network only */
  event.respondWith(fetch(request));
});

/* ── Strategy helpers ────────────────────────────────────────── */

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline — asset not cached.', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(
      JSON.stringify({ success: false, message: 'You are offline.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function networkFirstWithFallback(request) {
  try {
    return await fetch(request);
  } catch {
    /* Return the cached shell — React Router will handle the route client-side */
    const cached = await caches.match('/index.html');
    return cached || new Response('<h1>You are offline</h1>', {
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
