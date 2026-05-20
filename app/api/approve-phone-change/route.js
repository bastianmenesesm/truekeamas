import { NextResponse }           from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin }             from '@/lib/adminGuard';

export async function POST(request) {
  try {
    const { requestId, action } = await request.json(); // action: 'approve' | 'reject'
    if (!requestId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded  = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    const adminDb  = getAdminDb();

    // ── Solo admins (fast path: JWT claim; slow path: Firestore + auto-provisiona claim) ─
    if (!(await requireAdmin(decoded, adminDb))) {
      return NextResponse.json({ error: 'Sin permisos de administrador' }, { status: 403 });
    }

    // Obtener la solicitud
    const reqSnap = await adminDb.collection('phoneChangeRequests').doc(requestId).get();
    if (!reqSnap.exists) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }
    const reqData = reqSnap.data();
    if (reqData.status !== 'pending') {
      return NextResponse.json({ error: 'La solicitud ya fue procesada' }, { status: 400 });
    }

    if (action === 'approve') {
      await adminDb.collection('users').doc(reqData.uid).update({ phone: reqData.newPhone });
      await adminDb.collection('phoneChangeRequests').doc(requestId).update({
        status:     'approved',
        resolvedAt: new Date(),
        resolvedBy: decoded.uid,
      });
      return NextResponse.json({ ok: true, status: 'approved' });
    } else {
      await adminDb.collection('phoneChangeRequests').doc(requestId).update({
        status:     'rejected',
        resolvedAt: new Date(),
        resolvedBy: decoded.uid,
      });
      return NextResponse.json({ ok: true, status: 'rejected' });
    }
  } catch (err) {
    console.error('[approve-phone-change]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
