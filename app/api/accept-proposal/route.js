import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function POST(request) {
  try {
    const { proposalId } = await request.json();
    if (!proposalId) {
      return NextResponse.json({ error: 'proposalId requerido' }, { status: 400 });
    }

    // ── Auth ────────────────────────────────────────────────────────
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    let callerUid;
    try {
      const decoded = await getAdminAuth().verifyIdToken(authHeader.slice(7));
      callerUid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Sesión expirada, vuelve a iniciar sesión' }, { status: 401 });
    }

    const adminDb    = getAdminDb();
    const FieldValue = admin.firestore.FieldValue;

    // ── Leer propuesta ──────────────────────────────────────────────
    const propRef  = adminDb.collection('proposals').doc(proposalId);
    const propSnap = await propRef.get();
    if (!propSnap.exists) {
      return NextResponse.json({ error: 'Propuesta no encontrada' }, { status: 404 });
    }
    const proposal = propSnap.data();

    // ── Validaciones ────────────────────────────────────────────────
    if (proposal.productOwnerUid !== callerUid) {
      return NextResponse.json({ error: 'Sin permiso para aceptar esta propuesta' }, { status: 403 });
    }
    if (proposal.status !== 'pending') {
      return NextResponse.json({ error: 'Esta propuesta ya fue procesada' }, { status: 409 });
    }

    // ── Leer datos del owner para el nombre ─────────────────────────
    const ownerSnap = await adminDb.collection('users').doc(callerUid).get();
    const ownerName = ownerSnap.data()?.displayName || 'Usuario';

    // ── Transacción atómica: crear match + actualizar propuesta ─────
    // Uso runTransaction para garantizar que no se creen matches duplicados
    // si el owner toca "aceptar" dos veces antes de que cargue la UI
    const matchId = await adminDb.runTransaction(async (tx) => {
      // Re-leer propuesta dentro de la transacción para evitar race condition
      const freshSnap = await tx.get(propRef);
      if (freshSnap.data()?.status !== 'pending') {
        throw new Error('ALREADY_PROCESSED');
      }

      const matchRef = adminDb.collection('matches').doc(); // ID nuevo
      tx.set(matchRef, {
        productId:     proposal.productId,
        productTitle:  proposal.productTitle,
        productPhoto:  proposal.productPhoto || null,
        ownerId:       proposal.productOwnerUid,
        ownerName,
        requesterId:   proposal.proposerUid,
        requesterName: proposal.proposerName,
        proposalId,
        status:        'active',
        lastMessage:   '',
        lastMessageAt: FieldValue.serverTimestamp(),
        createdAt:     FieldValue.serverTimestamp(),
      });

      tx.update(propRef, {
        status:    'accepted',
        matchId:   matchRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return matchRef.id;
    });

    // ── Liberar lock (Admin SDK — no está sujeto a las reglas de Firestore) ──
    const lockId  = `${proposal.proposerUid}_${proposal.productId}`;
    await adminDb.collection('proposal_locks').doc(lockId).delete().catch(() => {});

    // ── Notificar al proponente ─────────────────────────────────────
    await adminDb.collection('notifications').doc(proposal.proposerUid)
      .collection('items').add({
        type:      'proposal_accepted',
        title:     '¡Propuesta aceptada! 🎉',
        body:      `Tu propuesta para "${proposal.productTitle}" fue aceptada. ¡Ya pueden chatear!`,
        proposalId,
        productId: proposal.productId,
        chatId:    matchId,
        read:      false,
        createdAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ ok: true, matchId });

  } catch (err) {
    if (err.message === 'ALREADY_PROCESSED') {
      return NextResponse.json({ error: 'Esta propuesta ya fue procesada' }, { status: 409 });
    }
    console.error('[accept-proposal]', err.message);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
