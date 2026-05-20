import { NextResponse }                                          from 'next/server';
import { getAdminAuth, getAdminDb }                             from '@/lib/firebase-admin';
import { firestoreRateLimit, rateLimitResponse, getClientIp }   from '@/lib/rateLimit';

function validatePassword(pwd) {
  if (!pwd || pwd.length < 8)      return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Z]/.test(pwd))          return 'Debe incluir al menos una letra mayúscula.';
  if (!/[0-9]/.test(pwd))          return 'Debe incluir al menos un número.';
  if (!/[^A-Za-z0-9]/.test(pwd))   return 'Debe incluir al menos un carácter especial (!@#$%...).';
  return null;
}

export async function POST(request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 });
    }

    const pwdError = validatePassword(password);
    if (pwdError) {
      return NextResponse.json({ error: pwdError }, { status: 400 });
    }

    const db = getAdminDb();
    const ip = getClientIp(request);

    // ── Rate limit por IP: 10 intentos por 15 minutos (CRIT-3) ─────────
    // Previene que una IP haga fuerza bruta masiva de tokens
    const ipCheck = await firestoreRateLimit(db, `reset_confirm_ip_${ip}`, 10, 15 * 60 * 1000);
    if (!ipCheck.allowed) {
      return rateLimitResponse(
        ipCheck.retryAfter,
        'Demasiados intentos desde tu red. Espera unos minutos antes de reintentar.'
      );
    }

    // ── Rate limit por token: 5 intentos por hora (CRIT-3) ─────────────
    // Si alguien obtiene un token (ej. de logs o URL compartida), solo puede
    // intentar usarlo 5 veces antes de que se bloquee por una hora.
    const tokenKey   = `reset_confirm_tok_${token.slice(0, 32)}`;
    const tokenCheck = await firestoreRateLimit(db, tokenKey, 5, 60 * 60 * 1000);
    if (!tokenCheck.allowed) {
      return rateLimitResponse(
        tokenCheck.retryAfter,
        'Enlace bloqueado por intentos excesivos. Solicita un nuevo enlace de restablecimiento.'
      );
    }

    const docRef = db.collection('passwordResets').doc(token);
    const snap   = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Enlace inválido o expirado.' }, { status: 400 });
    }

    const data = snap.data();

    if (data.used) {
      return NextResponse.json({ error: 'Este enlace ya fue utilizado.' }, { status: 400 });
    }

    if (Date.now() > data.expiresAt) {
      return NextResponse.json({ error: 'El enlace ha expirado. Solicita uno nuevo.' }, { status: 400 });
    }

    // Actualiza la contraseña via Firebase Admin SDK
    await getAdminAuth().updateUser(data.uid, { password });

    // Marca el token como usado (un enlace = un uso)
    await docRef.update({ used: true });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('reset-confirm error:', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
