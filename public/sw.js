/**
 * Truekeamas Service Worker v2
 * Estrategia conservadora: solo cachea recursos propios y Cloudinary.
 * Nunca intercepta Firebase, Google APIs ni autenticación.
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE  = `truekeamas-static-${CACHE_VERSION}`;
const IMAGE_CACHE   = `truekeamas-images-${CACHE_VERSION}`;
const PAGES_CACHE   = `truekeamas-pages-${CACHE_VERSION}`;
const ALL_CACHES    = [STATIC_CACHE, IMAGE_CACHE, PAGES_CACHE];

// App shell mínimo a pre-cachear
const PRECACHE_URLS = ['/offline.html', '/manifest.json'];

// ── INSTALL ──────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: limpiar cachés viejos ──────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !ALL_CACHES.includes(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH ────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isOwnDomain  = url.hostname === self.location.hostname;
  const isCloudinary = url.hostname.includes('cloudinary.com');

  // ✅ Solo interceptar nuestro dominio y Cloudinary.
  // Todo lo demás (Firebase, Google, APIs externas) pasa directo sin tocar.
  if (!isOwnDomain && !isCloudinary) return;

  // Nunca cachear rutas de API propias
  if (url.pathname.startsWith('/api/')) return;

  // _next/static → cache-first (archivos inmutables con hash)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Imágenes Cloudinary → stale-while-revalidate
  if (isCloudinary) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // Navegación de páginas → network-first con fallback offline
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Otros assets propios (svg, png, ico, fonts locales) → cache-first
  if (isOwnDomain) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }
});

// ── Cache First ───────────────────────────────────────────────────
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
    return new Response('', { status: 408 });
  }
}

// ── Stale While Revalidate ────────────────────────────────────────
async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(res => {
    if (res.ok) cache.put(request, res.clone());
    return res;
  }).catch(() => {});
  return cached || fetchPromise;
}

// ── Network First + Fallback Offline ─────────────────────────────
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGES_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match('/offline.html');
    return offline || new Response('<h1>Sin conexión</h1>', {
      status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

// ── Mensajes desde el cliente ────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
