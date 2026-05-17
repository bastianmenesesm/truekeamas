import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { inMemoryRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { isValidUid, isValidString, isOptionalString, sanitizeText } from '@/lib/validate';
import admin from 'firebase-admin';

export async function POST(request) {
  try {
    let body;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 }); }

    const { reportedUid, reason, description } = body;

    // ── Validación de inputs ────────────────────────────────────────
    if (!isValidUid(reportedUid)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }
    if (!isValidString(reason, 100)) {
      return NextResponse.json({ error: 'El motivo es obligatorio (máx. 100 caracteres)' }, { status: 400 });
    }
    if (!isOptionalString(description, 1000)) {
      return NextResponse.json({ error: 'La descripción no puede superar 1000 caracteres' }, { status: 400 });
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

    // ── Rate limit: 5 denuncias por usuario por 24 horas ─────────
    const rl = inMemoryRateLimit(`report:${reporterUid}`, 5, 24 * 60 * 60 * 1000);
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfter,
        'Alcanzaste el límite de denuncias por hoy. Podrás enviar más mañana.');
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
      reason:       sanitizeText(reason, 100),
      description:  sanitizeText(description, 1000),
      status:       'pending',
      createdAt:    FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[report-user]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
