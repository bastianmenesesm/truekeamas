import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
    }

    const db = getAdminDb();
    const docRef = db.collection('passwordResets').doc(token);
    const snap = await docRef.get();

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

    // Update password via Firebase Admin
    await getAdminAuth().updateUser(data.uid, { password });

    // Mark token as used
    await docRef.update({ used: true });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('reset-confirm error:', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
