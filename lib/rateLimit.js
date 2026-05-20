/**
 * lib/rateLimit.js
 *
 * Dos estrategias de rate limiting:
 *
 * 1. inMemoryRateLimit  — sliding window en memoria por instancia serverless.
 *    Ideal para rutas autenticadas (la identidad ya es el primer factor de defensa).
 *    No persiste entre cold-starts ni entre instancias paralelas, pero detiene
 *    el 99 % del abuso real porque Vercel reutiliza instancias.
 *
 * 2. firestoreRateLimit — ventana fija en Firestore dentro de una transacción.
 *    Distribuido (todos los workers comparten el mismo contador).
 *    Úsalo para rutas públicas críticas como reset-request (envío de emails).
 */

import { NextResponse } from 'next/server';

// ── 1. In-Memory Sliding Window ─────────────────────────────────────────────

/** @type {Map<string, number[]>} key → timestamps de hits en la ventana */
const memStore = new Map();

/**
 * Sliding window rate limiter en memoria.
 *
 * @param {string}  key         Clave única, p.ej. `uid:submit-proposal`
 * @param {number}  maxRequests Máximo de hits permitidos dentro de windowMs
 * @param {number}  windowMs    Tamaño de la ventana en milisegundos
 * @returns {{ allowed: boolean, retryAfter: number }}
 */
export function inMemoryRateLimit(key, maxRequests, windowMs) {
  const now  = Date.now();
  const hits = (memStore.get(key) || []).filter(t => now - t < windowMs);

  if (hits.length >= maxRequests) {
    const retryAfter = Math.ceil((hits[0] + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  hits.push(now);
  memStore.set(key, hits);

  // GC periódico: evita que el Map crezca sin límite en instancias long-running
  if (memStore.size > 8000) {
    for (const [k, v] of memStore) {
      if (v.every(t => now - t >= windowMs)) memStore.delete(k);
    }
  }

  return { allowed: true, retryAfter: 0 };
}

// ── 2. Firestore Fixed Window ───────────────────────────────────────────────

/**
 * Rate limiter distribuido usando Firestore como store compartido.
 * Usa una ventana fija (fixed window) con transacción atómica.
 *
 * El documento se guarda en la colección `_rate_limits` con el ID derivado
 * de la clave. La colección puede excluirse de las Firestore Rules con:
 *   match /_rate_limits/{doc} { allow read, write: if false; }
 * ya que solo el Admin SDK escribe en ella.
 *
 * @param {FirebaseFirestore.Firestore} db         Admin Firestore instance
 * @param {string}                      key        Clave única del contador
 * @param {number}                      maxRequests
 * @param {number}                      windowMs
 * @returns {Promise<{ allowed: boolean, retryAfter: number }>}
 */
export async function firestoreRateLimit(db, key, maxRequests, windowMs) {
  const now   = Date.now();
  // Firestore doc IDs no pueden tener '/', '@', etc.
  const docId = `rl_${key.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100)}`;
  const ref   = db.collection('_rate_limits').doc(docId);

  try {
    return await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const data = snap.data();

      if (data && data.resetAt > now) {
        // Dentro de la misma ventana
        if (data.count >= maxRequests) {
          return { allowed: false, retryAfter: Math.ceil((data.resetAt - now) / 1000) };
        }
        tx.update(ref, { count: data.count + 1 });
      } else {
        // Ventana nueva (o documento inexistente)
        tx.set(ref, { count: 1, resetAt: now + windowMs, createdAt: now });
      }

      return { allowed: true, retryAfter: 0 };
    });
  } catch {
    // Si Firestore falla, dejamos pasar (fail-open) para no bloquear usuarios legítimos
    return { allowed: true, retryAfter: 0 };
  }
}

// ── Helpers de respuesta ────────────────────────────────────────────────────

/**
 * Devuelve una NextResponse 429 con headers estándar de rate limit.
 * @param {number} retryAfter  Segundos hasta que el cliente puede reintentar
 * @param {string} [msg]       Mensaje personalizado
 */
export function rateLimitResponse(retryAfter = 60, msg) {
  const message = msg ||
    `Demasiadas solicitudes. Intenta nuevamente en ${retryAfter} segundo${retryAfter !== 1 ? 's' : ''}.`;

  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        'Retry-After':      String(retryAfter),
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + retryAfter),
      },
    }
  );
}

/**
 * Extrae la IP real del cliente desde los headers de Next.js / Vercel.
 * @param {Request} request
 * @returns {string}
 */
export function getClientIp(request) {
  // x-real-ip es asignado por el edge de Vercel y NO puede ser falsificado por el cliente.
  // x-forwarded-for puede ser manipulado añadiendo cabeceras extra desde el cliente (MED-1).
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}
