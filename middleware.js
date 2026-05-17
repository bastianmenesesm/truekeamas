/**
 * middleware.js — Next.js Edge Middleware
 *
 * Corre en el Edge Runtime de Vercel (antes de que llegue a las funciones).
 * Aplica dos capas de protección:
 *
 * 1. Bloqueo de bots/scrapers maliciosos en /p/[id] y /api/*
 * 2. Validación de Origin en rutas de API
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

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const ua           = request.headers.get('user-agent') || '';

  const isSensitivePath = pathname.startsWith('/api/') || pathname.startsWith('/p/');

  if (isSensitivePath) {
    const isBlocked = BLOCKED_UA_PATTERNS.some(re => re.test(ua));
    if (isBlocked) {
      return new NextResponse(
        JSON.stringify({ error: 'Acceso denegado' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

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

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(EDGE_ONLY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: ['/api/:path*', '/p/:id*', '/u/:id*'],
};
