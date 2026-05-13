import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    const { targetUid } = await request.json();
    if (!targetUid) return NextResponse.json({ error: 'targetUid requerido' }, { status: 400 });

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded  = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    const adminDb  = getAdminDb();

    // Solo admins
    const requesterSnap = await adminDb.collection('users').doc(decoded.uid).get();
    if (requesterSnap.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Sin permisos de administrador' }, { status: 403 });
    }

    const targetSnap = await adminDb.collection('users').doc(targetUid).get();
    if (!targetSnap.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const current  = targetSnap.data()?.verified || false;
    await adminDb.collection('users').doc(targetUid).update({ verified: !current });

    return NextResponse.json({ ok: true, verified: !current });
  } catch (err) {
    console.error('[toggle-verify]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
