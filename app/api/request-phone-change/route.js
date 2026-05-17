import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    const { newPhone } = await request.json();
    if (!newPhone?.trim()) {
      return NextResponse.json({ error: 'Teléfono requerido' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded  = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    const adminDb  = getAdminDb();

    // Verificar que no haya una solicitud pendiente del mismo usuario
    const existing = await adminDb.collection('phoneChangeRequests')
      .where('uid',    '==', decoded.uid)
      .where('status', '==', 'pending')
      .get();
    if (!existing.empty) {
      return NextResponse.json({ error: 'Ya tienes una solicitud de cambio pendiente.' }, { status: 400 });
    }

    // Datos actuales del usuario
    const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
    const ud       = userSnap.data() || {};

    await adminDb.collection('phoneChangeRequests').add({
      uid:          decoded.uid,
      displayName:  ud.displayName || '',
      email:        ud.email       || '',
      currentPhone: ud.phone       || '',
      newPhone:     newPhone.trim(),
      status:       'pending',
      createdAt:    new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[request-phone-change]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
