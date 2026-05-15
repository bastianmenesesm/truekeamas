import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function POST(request) {
  // ── Parse body ─────────────────────────────────────────────────
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 }); }

  const { productId, offerType, offerDescription, offerPhotos, offerAmount, message } = body;
  if (!productId || !offerType) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  // ── Validación de longitud (previene payloads abusivos) ────────
  if (typeof productId !== 'string' || productId.length > 128) {
    return NextResponse.json({ error: 'productId inválido' }, { status: 400 });
  }
  if (offerDescription && offerDescription.length > 600) {
    return NextResponse.json({ error: 'La descripción no puede superar 600 caracteres' }, { status: 400 });
  }
  if (message && message.length > 500) {
    return NextResponse.json({ error: 'El mensaje no puede superar 500 caracteres' }, { status: 400 });
  }
  if (offerPhotos && (!Array.isArray(offerPhotos) || offerPhotos.length > 5)) {
    return NextResponse.json({ error: 'Máximo 5 fotos por propuesta' }, { status: 400 });
  }

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

    // ── Validar producto ────────────────────────────────────────
    const prodSnap = await adminDb.collection('products').doc(productId).get();
    if (!prodSnap.exists) {
      return NextResponse.json({ error: 'Publicación no encontrada' }, { status: 404 });
    }
    const prod = prodSnap.data();

    if (prod.ownerId === fromUid) {
      return NextResponse.json({ error: 'No puedes enviar propuesta a tu propia publicación' }, { status: 400 });
    }
    if (prod.status === 'sold' || prod.status === 'blocked') {
      return NextResponse.json({ error: 'Esta publicación ya no está disponible' }, { status: 400 });
    }

    // ── Verificar lock (1 propuesta pendiente por usuario × producto) ──
    // ID determinístico — sin índice compuesto necesario
    const lockId  = `${fromUid}_${productId}`;
    const lockRef = adminDb.collection('proposal_locks').doc(lockId);
    const lockSnap = await lockRef.get();
    if (lockSnap.exists) {
      return NextResponse.json({
        error: 'Ya tienes una propuesta pendiente para esta publicación. Espera a que sea aceptada o rechazada.',
      }, { status: 409 });
    }

    // ── Datos del que propone ───────────────────────────────────
    const fromSnap  = await adminDb.collection('users').doc(fromUid).get();
    const fromUser  = fromSnap.data() || {};
    const proposerName = fromUser.displayName || 'Usuario';

    // ── Crear propuesta ─────────────────────────────────────────
    const propRef = await adminDb.collection('proposals').add({
      productId,
      productTitle:    prod.title,
      productPhoto:    prod.photos?.[0] || null,
      productOwnerUid: prod.ownerId,
      proposerUid:     fromUid,
      proposerName,
      offerType,
      offerDescription: offerDescription || '',
      offerPhotos:      offerPhotos      || [],
      offerAmount:      offerAmount      || null,
      message:          message          || '',
      status:    'pending',
      matchId:   null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // ── Crear lock ──────────────────────────────────────────────
    await lockRef.set({
      proposalId: propRef.id,
      productId,
      proposerUid: fromUid,
      createdAt: FieldValue.serverTimestamp(),
    });

    // ── Notificar al dueño del producto ─────────────────────────
    await adminDb.collection('notifications').doc(prod.ownerId)
      .collection('items').add({
        type:       'proposal_received',
        title:      '¡Nueva propuesta de trueque!',
        body:       `Propuesta para "${prod.title}"`,
        proposalId: propRef.id,
        productId,
        read:       false,
        createdAt:  FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ ok: true, proposalId: propRef.id });

  } catch (err) {
    console.error('[submit-proposal]', err.code, err.message);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
