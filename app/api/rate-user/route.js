import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function POST(request) {
  try {
    const { matchId, toUid, stars, comment } = await request.json();

    if (!matchId || !toUid || !stars || stars < 1 || stars > 5) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded  = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    const fromUid  = decoded.uid;
    if (fromUid === toUid) {
      return NextResponse.json({ error: 'No puedes calificarte a ti mismo' }, { status: 400 });
    }

    const adminDb  = getAdminDb();
    const FieldValue = admin.firestore.FieldValue;

    // Verificar que el match existe y ambos UIDs participan
    const matchSnap = await adminDb.collection('matches').doc(matchId).get();
    if (!matchSnap.exists) {
      return NextResponse.json({ error: 'Acuerdo no encontrado' }, { status: 404 });
    }
    const match = matchSnap.data();
    if (match.ownerId !== fromUid && match.requesterId !== fromUid) {
      return NextResponse.json({ error: 'No eres parte de este acuerdo' }, { status: 403 });
    }
    if (match.ownerId !== toUid && match.requesterId !== toUid) {
      return NextResponse.json({ error: 'El usuario no es parte de este acuerdo' }, { status: 400 });
    }

    // Verificar calificación duplicada (mismo fromUid + matchId)
    const dup = await adminDb.collection('ratings')
      .where('fromUid', '==', fromUid)
      .where('matchId', '==', matchId)
      .get();
    if (!dup.empty) {
      return NextResponse.json({ error: 'Ya calificaste este acuerdo' }, { status: 409 });
    }

    // Datos del usuario que califica
    const fromSnap = await adminDb.collection('users').doc(fromUid).get();
    const fromUser = fromSnap.data() || {};

    // Crear rating
    await adminDb.collection('ratings').add({
      fromUid,
      toUid,
      matchId,
      stars:        Number(stars),
      comment:      comment?.trim() || '',
      fromName:     fromUser.displayName || 'Usuario',
      fromAvatarUrl: fromUser.avatarUrl  || null,
      createdAt:    FieldValue.serverTimestamp(),
    });

    // Actualizar stats del usuario calificado (incremento atómico)
    await adminDb.collection('users').doc(toUid).update({
      ratingSum:   FieldValue.increment(Number(stars)),
      ratingCount: FieldValue.increment(1),
    });

    // Recalcular promedio y nivel
    const toSnap   = await adminDb.collection('users').doc(toUid).get();
    const toUser   = toSnap.data() || {};
    const newSum   = (toUser.ratingSum   || 0) + Number(stars);
    const newCount = (toUser.ratingCount || 0) + 1;
    const newAvg   = Math.round((newSum / newCount) * 10) / 10;

    let newLevel = toUser.level || 'Nuevo';
    if      (newCount >= 10 && newAvg >= 4.5) newLevel = 'Confiable';
    else if (newCount >= 3  && newAvg >= 4.0) newLevel = 'Verificado';

    await adminDb.collection('users').doc(toUid).update({
      ratingAvg: newAvg,
      level:     newLevel,
    });

    return NextResponse.json({ ok: true, newAvg, newCount });
  } catch (err) {
    console.error('[rate-user]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
