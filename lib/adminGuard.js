/**
 * lib/adminGuard.js
 *
 * Verifica que el usuario del token JWT sea administrador de Truekeamas.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  Fast path  (sin Firestore, O(1) red)                               │
 * │  Si el JWT ya contiene el custom claim `admin: true`, devuelve      │
 * │  true inmediatamente — cero lecturas a Firestore.                   │
 * │                                                                     │
 * │  Slow path  (1 lectura Firestore — solo la primera vez)             │
 * │  Si el claim aún no existe, verifica en users/{uid}.role.           │
 * │  Si es admin, auto-provisiona el custom claim para que todas        │
 * │  las peticiones futuras usen el fast path.                          │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * En producción: la primera request admin de cada sesión hará una lectura
 * Firestore y set del claim. A partir de ahí — y hasta que el token expire
 * (~1h) — ninguna request admin toca Firestore para verificar el rol.
 *
 * Uso:
 *   import { requireAdmin } from '@/lib/adminGuard';
 *   const isAdmin = await requireAdmin(decoded, adminDb);
 *   if (!isAdmin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
 */

import { getAdminAuth } from '@/lib/firebase-admin';

/**
 * @param {import('firebase-admin').auth.DecodedIdToken} decoded  Token ya verificado
 * @param {import('firebase-admin').firestore.Firestore} adminDb  Admin Firestore instance
 * @returns {Promise<boolean>}  true si el usuario es admin
 */
export async function requireAdmin(decoded, adminDb) {
  // ── Fast path: custom claim en JWT ────────────────────────────────────
  if (decoded.admin === true) return true;

  // ── Slow path: verificar en Firestore (admin sin claim aún) ──────────
  const snap = await adminDb.collection('users').doc(decoded.uid).get();
  if (!snap.exists || snap.data()?.role !== 'admin') return false;

  // ── Auto-provisionar custom claim ─────────────────────────────────────
  // Las siguientes peticiones de este admin usarán el fast path hasta que
  // el token expire (~1h). Los custom claims sobreviven reinicios de sesión.
  try {
    await getAdminAuth().setCustomUserClaims(decoded.uid, { admin: true });
  } catch (e) {
    // No es crítico: el fallback Firestore seguirá funcionando
    console.warn('[adminGuard] setCustomUserClaims falló (no crítico):', e.message);
  }

  return true;
}
