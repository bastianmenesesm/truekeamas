import { NextResponse }                               from 'next/server';
import { getAdminAuth, getAdminDb }                   from '@/lib/firebase-admin';
import { firestoreRateLimit, rateLimitResponse }       from '@/lib/rateLimit';
import admin                                          from 'firebase-admin';

export async function POST(request) {
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 }); }

  const { matchId } = body;
  if (!matchId) return NextResponse.json({ error: 'matchId requerido' }, { status: 400 });

  // ── Auth ────────────────────────────────────────────────────────────
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

  // ── Rate limit distribuido ──────────────────────────────────────────
  const adminDb = getAdminDb();
  const rl = await firestoreRateLimit(adminDb, `complete:${fromUid}`, 20, 60 * 60 * 1000);
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfter, 'Demasiadas confirmaciones seguidas. Espera un momento.');
  }

  try {
    const FieldValue = admin.firestore.FieldValue;
    const matchRef   = adminDb.collection('matches').doc(matchId);

    // ── Transacción atómica: leer-verificar-escribir (HIGH-2) ──────────
    // Sin la transacción, dos peticiones simultáneas (owner y requester)
    // pueden leer ambas confirmed=[] y ninguna detectar "ambos confirmaron".
    // runTransaction reintenta en conflicto — garantiza que solo una
    // petición lleva el match a 'completed'.
    let txResult;
    try {
      txResult = await adminDb.runTransaction(async (tx) => {
        const snap  = await tx.get(matchRef);
        if (!snap.exists) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });

        const match = snap.data();

        if (match.ownerId !== fromUid && match.requesterId !== fromUid) {
          throw Object.assign(new Error('FORBIDDEN'), { code: 'FORBIDDEN' });
        }
        if (match.status === 'completed') {
          throw Object.assign(new Error('ALREADY_COMPLETED'), { code: 'ALREADY_COMPLETED' });
        }

        const confirmed = match.completionConfirmedBy || [];
        if (confirmed.includes(fromUid)) {
          throw Object.assign(new Error('ALREADY_CONFIRMED'), { code: 'ALREADY_CONFIRMED' });
        }

        const newConfirmed  = [...confirmed, fromUid];
        const bothConfirmed = newConfirmed.includes(match.ownerId) &&
                              newConfirmed.includes(match.requesterId);
        const otherUid      = match.ownerId === fromUid ? match.requesterId : match.ownerId;

        if (bothConfirmed) {
          // Ambos confirmaron: marcar como completado dentro de la transacción
          tx.update(matchRef, {
            completionConfirmedBy: newConfirmed,
            status:                'completed',
            completedAt:           FieldValue.serverTimestamp(),
          });
        } else {
          // Solo uno confirmó por ahora
          tx.update(matchRef, { completionConfirmedBy: newConfirmed });
        }

        return { bothConfirmed, match, otherUid };
      });
    } catch (txErr) {
      // Errores de lógica de negocio detectados dentro de la transacción
      const code = txErr.code;
      if (code === 'NOT_FOUND')        return NextResponse.json({ error: 'Acuerdo no encontrado' }, { status: 404 });
      if (code === 'FORBIDDEN')        return NextResponse.json({ error: 'No eres parte de este acuerdo' }, { status: 403 });
      if (code === 'ALREADY_COMPLETED') return NextResponse.json({ error: 'Este acuerdo ya fue completado' }, { status: 409 });
      if (code === 'ALREADY_CONFIRMED') return NextResponse.json(
        { error: 'Ya confirmaste el trueque. Esperando que el otro usuario también confirme.' },
        { status: 409 }
      );
      throw txErr; // error inesperado → al catch externo
    }

    const { bothConfirmed, match, otherUid } = txResult;

    // ── Post-transacción: notificaciones e incrementos ──────────────────
    // (Fuera de la transacción para no bloquearla — son idempotentes o
    //  solo las ejecuta la petición que ganó la transacción.)
    if (!bothConfirmed) {
      await adminDb.collection('notifications').doc(otherUid).collection('items').add({
        type:      'completion_requested',
        title:     '¡Tu contraparte confirmó el trueque! 🤝',
        body:      `Confirma también para cerrar el acuerdo por "${match.productTitle}" y calificarse mutuamente.`,
        matchId,
        read:      false,
        createdAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ ok: true, status: 'pending' });
    }

    // ── Ambos confirmaron: acciones post-completación ───────────────────

    // Marcar producto como intercambiado
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

    // Notificar a ambos
    const notifData = {
      type:      'trade_completed',
      title:     '¡Trueque completado! 🎉',
      body:      `El acuerdo por "${match.productTitle}" fue completado. ¡No olvides calificar!`,
      matchId,
      read:      false,
      createdAt: FieldValue.serverTimestamp(),
    };
    await Promise.allSettled([
      adminDb.collection('notifications').doc(match.ownerId).collection('items').add(notifData),
      adminDb.collection('notifications').doc(match.requesterId).collection('items').add(notifData),
    ]);

    return NextResponse.json({ ok: true, status: 'completed' });

  } catch (err) {
    console.error('[complete-match]', err.code, err.message);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
