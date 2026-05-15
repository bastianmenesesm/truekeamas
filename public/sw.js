/**
 * Truekeamas Service Worker
 * Estrategias de caché profesionales para PWA
 */

const CACHE_VERSION    = 'v1';
const STATIC_CACHE     = `truekeamas-static-${CACHE_VERSION}`;
const IMAGE_CACHE      = `truekeamas-images-${CACHE_VERSION}`;
const PAGES_CACHE      = `truekeamas-pages-${CACHE_VERSION}`;
const ALL_CACHES       = [STATIC_CACHE, IMAGE_CACHE, PAGES_CACHE];

// URLs a pre-cachear al instalar (app shell mínimo)
const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.json',
  '/logo-icon.svg',
];

// ── Dominios/rutas que NUNCA se cachean ──────────────────────────
const SKIP_CACHE_PATTERNS = [
  /firestore\.googleapis\.com/,
  /identitytoolkit\.googleapis\.com/,
  /securetoken\.googleapis\.com/,
  /firebaseio\.com/,
  /firebase\.googleapis\.com/,
  /googleapis\.com\/identitytoolkit/,
  /\/api\//,
  /chrome-extension/,
];

// ── Utilidades ───────────────────────────────────────────────────
function shouldSkip(url) {
  return SKIP_CACHE_PATTERNS.some(p => p.test(url));
}

function isStaticAsset(url) {
  return url.includes('/_next/static/') ||
         url.includes('/fonts/') ||
         /\.(ico|svg|woff2?|ttf|eot)(\?.*)?$/.test(url);
}

function isImage(url) {
  return url.includes('cloudinary.com') ||
         url.includes('googleusercontent.com') ||
         /\.(png|jpg|jpeg|gif|webp|avif)(\?.*)?$/.test(url);
}

function isNavigation(request) {
  return request.mode === 'navigate';
}

// ── INSTALL: pre-cachear app shell ───────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: limpiar cachés obsoletos ───────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => !ALL_CACHES.includes(key))
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH: estrategias por tipo de recurso ───────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = request.url;

  // Solo interceptar GET
  if (request.method !== 'GET') return;

  // Nunca cachear Firebase, API routes, etc.
  if (shouldSkip(url)) return;

  // Activos estáticos de Next.js → Cache First (son inmutables con hash)
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Imágenes → Stale While Revalidate (Cloudinary + avatares)
  if (isImage(url)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // Navegación de páginas → Network First con fallback offline
  if (isNavigation(request)) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Todo lo demás → Network First
  event.respondWith(networkFirst(request, STATIC_CACHE));
});

// ── Estrategia: Cache First ──────────────────────────────────────
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
    return new Response('', { status: 408, statusText: 'Network error' });
  }
}

// ── Estrategia: Network First ────────────────────────────────────
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('', { status: 503, statusText: 'Service unavailable' });
  }
}

// ── Estrategia: Stale While Revalidate ──────────────────────────
async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fetch en paralelo (no await) para actualizar el caché
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => {});

  return cached || fetchPromise;
}

// ── Estrategia: Network First + Fallback Offline ─────────────────
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGES_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // 1. Intentar desde caché de páginas
    const cachedPage = await caches.match(request);
    if (cachedPage) return cachedPage;

    // 2. Fallback: página offline
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) return offlinePage;

    // 3. Respuesta mínima de emergencia
    return new Response(
      '<html><body><h1>Sin conexión</h1><p>Revisa tu internet e intenta de nuevo.</p></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

// ── Mensajes desde el cliente ────────────────────────────────────
self.addEventListener('message', event => {
  // El cliente solicita activar la nueva versión inmediatamente
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // El cliente solicita limpiar el caché de imágenes
  if (event.data?.type === 'CLEAR_IMAGE_CACHE') {
    caches.delete(IMAGE_CACHE);
  }
});
