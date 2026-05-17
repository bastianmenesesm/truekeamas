/**
 * middleware.js — Next.js Edge Middleware
 *
 * Corre en el Edge Runtime de Vercel (antes de que llegue a las funciones).
 * Aplica dos capas de protección sin necesidad de Redis:
 *
 * 1. Security headers en todas las respuestas
 * 2. Bloqueo de bots/scrapers maliciosos en /p/[id] y /api/*
 */

import { NextResponse } from 'next/server';

// ── User-agents bloqueados (scrapers, spam bots conocidos) ──────────────────
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

// Los security headers principales (HSTS, CSP, X-Frame-Options, etc.)
// los gestiona next.config.mjs para TODAS las rutas.
// El middleware solo añade headers específicos para rutas dinámicas que
// next.config.mjs no puede alcanzar (Edge responses).
const EDGE_ONLY_HEADERS = {
  'X-Robots-Tag': 'noai, noimageai', // bloquea crawlers de IA en rutas de API
};

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const ua           = request.headers.get('user-agent') || '';

  // ── 1. Bloquear bots maliciosos en rutas sensibles ──────────────────────
  const isSensitivePath = pathname.startsWith('/api/') || pathname.startsWith('/p/');

  if (isSensitivePath) {
    const isBlocked = BLOCKED_UA_PATTERNS.some(re => re.test(ua));
    if (isBlocked) {
      return new NextResponse(
        JSON.stringify({ error: 'Acceso denegado' }),
        {
          status:  403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // ── 2. Bloquear /api/* sin Origin ni Referer (peticiones directas fuera del browser) ──
  // Excepción: rutas de reset-password pueden venir de clientes de correo
  if (
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/reset-')
  ) {
    const origin  = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host    = request.headers.get('host');

    // Si hay origin, debe ser nuestro propio dominio
    if (origin && host && !origin.includes(host)) {
      return new NextResponse(
        JSON.stringify({ error: 'Origen no permitido' }),
        {
          status:  403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // ── 3. Añadir headers edge-only a la respuesta ─────────────────────────
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(EDGE_ONLY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

// Solo aplicar middleware en estas rutas (evita correr en _next/static, fonts, etc.)
export const config = {
  matcher: [
    '/api/:path*',
    '/p/:id*',
    '/u/:id*',
  ],
};
