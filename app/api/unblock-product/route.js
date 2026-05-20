import { NextResponse }           from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin }             from '@/lib/adminGuard';

export async function POST(request) {
  try {
    const { productId } = await request.json();
    if (!productId) return NextResponse.json({ error: 'productId requerido' }, { status: 400 });

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

    const productRef = adminDb.collection('products').doc(productId);
    if (!(await productRef.get()).exists) {
      return NextResponse.json({ error: 'Publicación no encontrada' }, { status: 404 });
    }

    await productRef.update({ status: 'active', blockedAt: null, blockedBy: null });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[unblock-product]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
