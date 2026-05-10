import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Correo inválido.' }, { status: 400 });
    }

    // Verify the user exists in Firebase Auth
    let userRecord;
    try {
      userRecord = await getAdminAuth().getUserByEmail(email);
    } catch {
      // Return success even if user not found to prevent email enumeration
      return NextResponse.json({ ok: true });
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes

    // Save token to Firestore
    const db = getAdminDb();
    await db.collection('passwordResets').doc(token).set({
      uid: userRecord.uid,
      email,
      expiresAt,
      used: false,
      createdAt: Date.now(),
    });

    // Send email via Brevo REST API
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;
    const emailBody = {
      sender: {
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@truekeamas.cl',
        name: process.env.BREVO_SENDER_NAME || 'Truekeamas',
      },
      to: [{ email, name: userRecord.displayName || email }],
      subject: 'Restablecer contraseña — Truekeamas',
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f9f9f9;">
          <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <h1 style="font-size:24px;color:#4B1FA7;margin:0 0 8px;">🔐 Restablecer contraseña</h1>
            <p style="color:#666;font-size:15px;margin:0 0 24px;">Hola${userRecord.displayName ? ' ' + userRecord.displayName : ''},<br>recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Truekeamas</strong>.</p>
            <a href="${resetUrl}" style="display:inline-block;background:#4B1FA7;color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700;font-size:15px;">Restablecer contraseña</a>
            <p style="color:#999;font-size:13px;margin:24px 0 0;">Este enlace expira en <strong>30 minutos</strong>. Si no solicitaste este cambio, ignora este correo.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
            <p style="color:#bbb;font-size:11px;margin:0;">O copia este enlace en tu navegador:<br><span style="color:#4B1FA7;word-break:break-all;">${resetUrl}</span></p>
          </div>
        </div>
      `,
    };

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(emailBody),
    });

    if (!brevoRes.ok) {
      const errData = await brevoRes.text();
      console.error('Brevo error:', errData);
      return NextResponse.json({ error: 'Error al enviar el correo. Intenta de nuevo.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('reset-request error:', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
