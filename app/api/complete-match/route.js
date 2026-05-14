import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function POST(request) {
  // ── Parse body ─────────────────────────────────────────────────
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 }); }

  const { matchId } = body;
  if (!matchId) return NextResponse.json({ error: 'matchId requerido' }, { status: 400 });

  // ── Auth ────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let fromUid;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    fromUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Sesión expirada, vuelve a iniciar sesión' }, { status: 401 });
  }

  try {
    const adminDb    = getAdminDb();
    const FieldValue = admin.firestore.FieldValue;

    // ── Validar match ───────────────────────────────────────────
    const matchSnap = await adminDb.collection('matches').doc(matchId).get();
    if (!matchSnap.exists) {
      return NextResponse.json({ error: 'Acuerdo no encontrado' }, { status: 404 });
    }
    const match = matchSnap.data();

    if (match.ownerId !== fromUid && match.requesterId !== fromUid) {
      return NextResponse.json({ error: 'No eres parte de este acuerdo' }, { status: 403 });
    }
    if (match.status === 'completed') {
      return NextResponse.json({ error: 'Este acuerdo ya fue completado' }, { status: 409 });
    }

    const otherUid = match.ownerId === fromUid ? match.requesterId : match.ownerId;

    // ── Actualizar match ────────────────────────────────────────
    await adminDb.collection('matches').doc(matchId).update({
      status:      'completed',
      completedAt: FieldValue.serverTimestamp(),
      completedBy: fromUid,
    });

    // ── Marcar producto como vendido/intercambiado ──────────────
    if (match.productId) {
      await adminDb.collection('products').doc(match.productId).update({
        status: 'sold',
        soldAt: FieldValue.serverTimestamp(),
      }).catch(() => {}); // si el producto ya no existe, ignorar
    }

    // ── Incrementar tradesCompleted en ambos usuarios ───────────
    await Promise.allSettled([
      adminDb.collection('users').doc(match.ownerId).update({
        tradesCompleted: FieldValue.increment(1),
      }),
      adminDb.collection('users').doc(match.requesterId).update({
        tradesCompleted: FieldValue.increment(1),
      }),
    ]);

    // ── Notificar a ambos participantes ─────────────────────────
    const notifData = {
      type:    'trade_completed',
      title:   '¡Trueque completado! 🎉',
      body:    `El acuerdo por "${match.productTitle}" fue completado. ¡No olvides calificar a tu contraparte!`,
      matchId,
      read:    false,
      createdAt: FieldValue.serverTimestamp(),
    };

    await Promise.allSettled([
      adminDb.collection('notifications').doc(match.ownerId).collection('items').add(notifData),
      adminDb.collection('notifications').doc(match.requesterId).collection('items').add(notifData),
    ]);

    return NextResponse.json({ ok: true, otherUid });

  } catch (err) {
    console.error('[complete-match]', err.code, err.message);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
