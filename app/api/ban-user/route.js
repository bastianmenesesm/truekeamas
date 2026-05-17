import { NextResponse }  from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    const { targetUid, action } = await request.json(); // action: 'ban' | 'unban'
    if (!targetUid || !action) {
      return NextResponse.json({ error: 'targetUid y action requeridos' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded  = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    const adminDb  = getAdminDb();

    // Verificar que el requester es admin
    const requesterSnap = await adminDb.collection('users').doc(decoded.uid).get();
    if (requesterSnap.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Sin permisos de administrador' }, { status: 403 });
    }

    // No banear a otro admin ni a sí mismo
    if (targetUid === decoded.uid) {
      return NextResponse.json({ error: 'No puedes banearte a ti mismo' }, { status: 400 });
    }

    const targetSnap = await adminDb.collection('users').doc(targetUid).get();
    if (!targetSnap.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    if (targetSnap.data()?.role === 'admin') {
      return NextResponse.json({ error: 'No se puede banear a otro administrador' }, { status: 403 });
    }

    const newRole = action === 'ban' ? 'banned' : 'user';
    await adminDb.collection('users').doc(targetUid).update({
      role:     newRole,
      ...(action === 'ban'
        ? { bannedAt: new Date(), bannedBy: decoded.uid }
        : { bannedAt: null,      bannedBy: null }),
    });

    return NextResponse.json({ ok: true, role: newRole });
  } catch (err) {
    console.error('[ban-user]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
