/**
 * middleware.js — Next.js Edge Middleware
 *
 * Corre en el Edge Runtime de Vercel antes de que llegue a las funciones.
 * Aplica tres capas de protección:
 *
 * 1. Bloqueo de bots/scrapers maliciosos en /p/[id], /api/* y /admin
 * 2. Validación de Origin en rutas de API
 * 3. CSP dinámico con nonce por petición (MED-4)
 *    - Genera un nonce criptográfico único por request
 *    - Inyecta 'nonce-{nonce}' + 'strict-dynamic' en script-src
 *    - 'strict-dynamic' hace que navegadores modernos ignoren 'unsafe-inline';
 *      browsers antiguos hacen fallback a la política base (incluye 'unsafe-inline')
 *    - El nonce se pasa al layout via header x-nonce para usarlo en <script> tags
 */

import { NextResponse } from 'next/server';

const BLOCKED_UA_PATTERNS = [
  /python-requests/i,
  /go-http-client/i,
  /scrapy/i,
  /curl\//i,
  /wget\//i,
  /zgrab/i,
  /masscan/i,
  /nikto/i,
  /sqlmap/i,
  /nmap/i,
  /dirbuster/i,
  /nuclei/i,
];

const EDGE_ONLY_HEADERS = {
  'X-Robots-Tag': 'noai, noimageai',
};

/**
 * Construye la CSP completa con el nonce de esta petición.
 * 'strict-dynamic' hace que los navegadores modernos ignoren 'unsafe-inline'
 * y solo permitan scripts con el nonce correcto.
 * 'unsafe-inline' queda como fallback para browsers sin soporte de strict-dynamic.
 */
function buildCsp(nonce) {
  return [
    "default-src 'self'",

    // strict-dynamic + nonce: Chrome/Firefox/Safari ignoran 'unsafe-inline'.
    // Browsers antiguos (IE11, etc.) usan 'unsafe-inline' como fallback.
    // 'unsafe-eval' retenido: reCAPTCHA v3 / Firebase App Check lo necesitan internamente.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com https://www.google.com https://recaptcha.google.com https://www.googletagmanager.com`,

    // unsafe-inline en styles es de bajo riesgo y necesario para Google Fonts inline y CSS-in-JS
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

    // Imágenes: Cloudinary, avatares de Google, Firebase Storage
    "img-src 'self' data: blob: https://res.cloudinary.com https://*.googleusercontent.com https://firebasestorage.googleapis.com https://www.gstatic.com",

    "font-src 'self' https://fonts.gstatic.com",

    // Conexiones: Firebase Auth, Firestore, Cloudinary upload, Analytics
    "connect-src 'self' https://*.googleapis.com https://*.google.com wss://*.firebaseio.com https://*.firebaseio.com https://res.cloudinary.com https://api.cloudinary.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://www.google-analytics.com https://analytics.google.com https://vitals.vercel-insights.com",

    // Frames: Google Sign-in, Firebase Auth redirect, reCAPTCHA
    "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://www.google.com https://recaptcha.google.com",

    // Service Worker
    "worker-src 'self' blob:",

    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
  ].join('; ');
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const ua           = request.headers.get('user-agent') || '';

  // ── 1. Bloqueo de bots/scrapers ──────────────────────────────────────
  const isSensitivePath = pathname.startsWith('/api/') ||
                          pathname.startsWith('/p/')   ||
                          pathname.startsWith('/admin');

  if (isSensitivePath) {
    const isBlocked = BLOCKED_UA_PATTERNS.some(re => re.test(ua));
    if (isBlocked) {
      return new NextResponse(
        JSON.stringify({ error: 'Acceso denegado' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // ── 2. Validación de Origin en API ───────────────────────────────────
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/reset-')) {
    const origin = request.headers.get('origin');
    const host   = request.headers.get('host');
    if (origin && host && !origin.includes(host)) {
      return new NextResponse(
        JSON.stringify({ error: 'Origen no permitido' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // ── 3. CSP dinámico con nonce por petición (MED-4) ───────────────────
  // 16 bytes aleatorios → base64 → nonce único e impredecible por request
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = btoa(String.fromCharCode(...nonceBytes));
  const csp   = buildCsp(nonce);

  // Pasar el nonce al layout server component via header de request
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // CSP dinámico en la respuesta (sobreescribe el estático de next.config.mjs)
  response.headers.set('Content-Security-Policy', csp);

  for (const [key, value] of Object.entries(EDGE_ONLY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    // Excluir archivos estáticos de Next.js y assets públicos para no añadir overhead
    '/((?!_next/static|_next/image|favicon|icons/|.*\\.(?:png|jpg|jpeg|svg|ico|webp|woff2?|ttf|otf|css)).*)',
  ],
};
