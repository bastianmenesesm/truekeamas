import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function POST(request) {
  try {
    const { reportedUid, reason, description } = await request.json();
    if (!reportedUid || !reason) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded     = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    const reporterUid = decoded.uid;
    if (reporterUid === reportedUid) {
      return NextResponse.json({ error: 'No puedes denunciarte a ti mismo' }, { status: 400 });
    }

    const adminDb    = getAdminDb();
    const FieldValue = admin.firestore.FieldValue;

    // Evitar denuncia duplicada
    const dup = await adminDb.collection('userReports')
      .where('reporterUid', '==', reporterUid)
      .where('reportedUid', '==', reportedUid)
      .get();
    if (!dup.empty) {
      return NextResponse.json({ error: 'Ya denunciaste a este usuario anteriormente' }, { status: 409 });
    }

    const reportedSnap = await adminDb.collection('users').doc(reportedUid).get();
    const reportedUser = reportedSnap.data() || {};

    await adminDb.collection('userReports').add({
      reporterUid,
      reportedUid,
      reportedName: reportedUser.displayName || 'Usuario',
      reason,
      description:  description?.trim() || '',
      status:       'pending',
      createdAt:    FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[report-user]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
