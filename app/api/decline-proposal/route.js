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
      return NextResponse.json({ error: 'Sin permiso para rechazar esta propuesta' }, { status: 403 });
    }
    if (proposal.status !== 'pending') {
      return NextResponse.json({ error: 'Esta propuesta ya fue procesada' }, { status: 409 });
    }

    // ── Actualizar propuesta ────────────────────────────────────────
    await propRef.update({
      status:    'declined',
      updatedAt: FieldValue.serverTimestamp(),
    });

    // ── Liberar lock para que el proponente pueda volver a proponer ─
    // (Admin SDK bypassa las reglas — el cliente no podía hacer esto)
    const lockId = `${proposal.proposerUid}_${proposal.productId}`;
    await adminDb.collection('proposal_locks').doc(lockId).delete().catch(() => {});

    // ── Notificar al proponente ─────────────────────────────────────
    await adminDb.collection('notifications').doc(proposal.proposerUid)
      .collection('items').add({
        type:      'proposal_declined',
        title:     'Propuesta rechazada',
        body:      `Tu propuesta para "${proposal.productTitle}" no fue aceptada esta vez.`,
        proposalId,
        productId: proposal.productId,
        read:      false,
        createdAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('[decline-proposal]', err.message);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
