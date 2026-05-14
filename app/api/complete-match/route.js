import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function POST(request) {
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

    const otherUid    = match.ownerId === fromUid ? match.requesterId : match.ownerId;
    const confirmed   = match.completionConfirmedBy || [];

    // ── Ya confirmó este usuario ────────────────────────────────
    if (confirmed.includes(fromUid)) {
      return NextResponse.json(
        { error: 'Ya confirmaste el trueque. Esperando que el otro usuario también confirme.' },
        { status: 409 }
      );
    }

    // ── Registrar confirmación de este usuario ──────────────────
    await adminDb.collection('matches').doc(matchId).update({
      completionConfirmedBy: FieldValue.arrayUnion(fromUid),
    });

    const newConfirmed = [...confirmed, fromUid];
    const bothConfirmed = newConfirmed.includes(match.ownerId) &&
                          newConfirmed.includes(match.requesterId);

    if (!bothConfirmed) {
      // ── Solo uno confirmó: notificar al otro ──────────────────
      await adminDb.collection('notifications').doc(otherUid).collection('items').add({
        type:    'completion_requested',
        title:   '¡Tu contraparte confirmó el trueque! 🤝',
        body:    `Confirma también para cerrar el acuerdo por "${match.productTitle}" y calificarse mutuamente.`,
        matchId,
        read:    false,
        createdAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ ok: true, status: 'pending' });
    }

    // ── Ambos confirmaron: completar todo ──────────────────────
    await adminDb.collection('matches').doc(matchId).update({
      status:      'completed',
      completedAt: FieldValue.serverTimestamp(),
    });

    // Marcar producto como vendido/intercambiado
    if (match.productId) {
      await adminDb.collection('products').doc(match.productId).update({
        status: 'sold',
        soldAt: FieldValue.serverTimestamp(),
      }).catch(() => {});
    }

    // Incrementar tradesCompleted en ambos usuarios
    await Promise.allSettled([
      adminDb.collection('users').doc(match.ownerId).update({
        tradesCompleted: FieldValue.increment(1),
      }),
      adminDb.collection('users').doc(match.requesterId).update({
        tradesCompleted: FieldValue.increment(1),
      }),
    ]);

    // Notificar a ambos que el trueque se completó
    const notifData = {
      type:    'trade_completed',
      title:   '¡Trueque completado! 🎉',
      body:    `El acuerdo por "${match.productTitle}" fue completado. ¡No olvides calificar!`,
      matchId,
      read:    false,
      createdAt: FieldValue.serverTimestamp(),
    };
    await Promise.allSettled([
      adminDb.collection('notifications').doc(match.ownerId).collection('items').add(notifData),
      adminDb.collection('notifications').doc(match.requesterId).collection('items').add(notifData),
    ]);

    return NextResponse.json({ ok: true, status: 'completed' });

  } catch (err) {
    console.error('[complete-match]', err.code, err.message);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
