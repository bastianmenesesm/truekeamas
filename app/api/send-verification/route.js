import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://truekeamas.cl';

export async function POST(request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) return NextResponse.json({ error: 'idToken requerido' }, { status: 400 });

    // Verificar identidad del usuario
    const auth        = getAdminAuth();
    const decoded     = await auth.verifyIdToken(idToken);
    const { email, name, uid } = decoded;

    if (!email) return NextResponse.json({ error: 'El usuario no tiene email' }, { status: 400 });

    // Verificar que no esté ya verificado
    const userRecord = await auth.getUser(uid);
    if (userRecord.emailVerified) {
      return NextResponse.json({ error: 'El email ya está verificado' }, { status: 400 });
    }

    // Generar link de verificación con Firebase Admin
    const link = await auth.generateEmailVerificationLink(email, {
      url:              `${BASE}/?mode=verifyEmail`,
      handleCodeInApp:  true,
    });

    const displayName = name || email.split('@')[0];

    // Enviar email en español via Brevo API
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method:  'POST',
      headers: {
        'api-key':      process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender:      { name: process.env.BREVO_SENDER_NAME || 'Truekeamas', email: process.env.BREVO_SENDER_EMAIL || 'aacb41001@smtp-brevo.com' },
        to:          [{ email, name: displayName }],
        subject:     'Verifica tu correo en Truekeamas',
        htmlContent: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F8FC;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F8FC;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1677FF,#4096FF);padding:32px;text-align:center">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px">
              truekea<span style="color:#a8f0a4">mas</span>
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:13px">
              Plataforma de trueque digital en Chile
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px">
            <h2 style="margin:0 0 16px;color:#0F172A;font-size:20px;font-weight:700">
              Hola, ${displayName} 👋
            </h2>
            <p style="margin:0 0 12px;color:#475569;font-size:15px;line-height:1.6">
              Gracias por registrarte en Truekeamas. Para completar tu cuenta y subir al nivel
              <strong style="color:#1677FF">✉️ Verificado</strong>, confirma tu dirección de correo:
            </p>

            <div style="text-align:center;margin:32px 0">
              <a href="${link}"
                style="display:inline-block;background:#1677FF;color:#ffffff;text-decoration:none;
                       padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;
                       letter-spacing:.2px">
                Verificar mi correo
              </a>
            </div>

            <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;line-height:1.5">
              Si el botón no funciona, copia y pega este enlace en tu navegador:
            </p>
            <p style="margin:0;word-break:break-all">
              <a href="${link}" style="color:#1677FF;font-size:12px">${link}</a>
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 40px"><hr style="border:none;border-top:1px solid #E2E8F0;margin:0"></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center">
            <p style="margin:0 0 6px;color:#94A3B8;font-size:12px">
              Si no creaste una cuenta en Truekeamas, puedes ignorar este correo.
            </p>
            <p style="margin:0;color:#CBD5E1;font-size:11px">
              © ${new Date().getFullYear()} Truekeamas · Chile
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
      }),
    });

    if (!brevoRes.ok) {
      const errBody = await brevoRes.text();
      console.error('[send-verification] Brevo error:', errBody);
      return NextResponse.json({ error: 'Error al enviar el correo' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('[send-verification]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
