import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function POST(request) {
  // ── 1. Parse body ─────────────────────────────────────────────
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 }); }

  const { matchId, toUid, stars, comment } = body;

  if (!matchId || !toUid || !stars || stars < 1 || stars > 5) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  // ── 2. Verify auth token ───────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let fromUid;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    fromUid = decoded.uid;
  } catch (err) {
    console.error('[rate-user] Token inválido:', err.message);
    return NextResponse.json({ error: 'Sesión expirada, vuelve a iniciar sesión' }, { status: 401 });
  }

  if (fromUid === toUid) {
    return NextResponse.json({ error: 'No puedes calificarte a ti mismo' }, { status: 400 });
  }

  // ── 3. Business logic ─────────────────────────────────────────
  try {
    const adminDb    = getAdminDb();
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
      return NextResponse.json({ error: 'El destinatario no es parte de este acuerdo' }, { status: 400 });
    }

    // Verificar duplicado usando ID determinístico — evita necesitar índice compuesto
    // El ID único por (quién califica × acuerdo) previene duplicados de forma atómica
    const ratingId  = `${fromUid}_${matchId}`;
    const ratingRef = adminDb.collection('ratings').doc(ratingId);
    const existing  = await ratingRef.get();
    if (existing.exists) {
      return NextResponse.json({ error: 'Ya calificaste este acuerdo' }, { status: 409 });
    }

    // Datos del usuario que califica
    const fromSnap = await adminDb.collection('users').doc(fromUid).get();
    const fromUser = fromSnap.data() || {};

    // Crear rating con ID determinístico (set, no add)
    await ratingRef.set({
      fromUid,
      toUid,
      matchId,
      stars:         Number(stars),
      comment:       comment?.trim() || '',
      fromName:      fromUser.displayName  || 'Usuario',
      fromAvatarUrl: fromUser.avatarUrl    || null,
      createdAt:     FieldValue.serverTimestamp(),
    });

    // Actualizar stats del usuario calificado (incremento atómico)
    await adminDb.collection('users').doc(toUid).update({
      ratingSum:   FieldValue.increment(Number(stars)),
      ratingCount: FieldValue.increment(1),
    });

    // Leer DESPUÉS del incremento — los valores ya son los definitivos
    const toSnap   = await adminDb.collection('users').doc(toUid).get();
    const toUser   = toSnap.data() || {};
    const newSum   = toUser.ratingSum   || 0;
    const newCount = toUser.ratingCount || 0;
    const newAvg   = newCount > 0 ? Math.round((newSum / newCount) * 10) / 10 : 0;

    // Nivel automático — no pisamos si el admin ya lo configuró manualmente
    let newLevel = toUser.level || 'Nuevo';
    if (newCount >= 10 && newAvg >= 4.5) {
      newLevel = 'Confiable';
    } else if (newCount >= 5 && newAvg >= 4.0 && newLevel === 'Nuevo') {
      newLevel = 'Activo';
    }

    await adminDb.collection('users').doc(toUid).update({
      ratingAvg: newAvg,
      level:     newLevel,
    });

    return NextResponse.json({ ok: true, newAvg, newCount });

  } catch (err) {
    console.error('[rate-user]', err.code, err.message);
    // Devolver el mensaje real para facilitar el diagnóstico
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
