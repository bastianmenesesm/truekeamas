import { NextResponse }             from 'next/server';
import { getAdminAuth, getAdminDb }  from '@/lib/firebase-admin';
import { requireAdmin }              from '@/lib/adminGuard';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    const adminDb = getAdminDb();

    if (!(await requireAdmin(decoded, adminDb))) {
      return NextResponse.json({ error: 'Sin permisos de administrador' }, { status: 403 });
    }

    const { productId, featured } = await request.json();
    if (!productId) return NextResponse.json({ error: 'productId requerido' }, { status: 400 });

    // Si vamos a destacar este producto, primero quitamos el destacado anterior
    if (featured) {
      const prev = await adminDb.collection('products')
        .where('featured', '==', true)
        .limit(5)
        .get();

      const batch = adminDb.batch();
      prev.docs.forEach(d => {
        if (d.id !== productId) batch.update(d.ref, { featured: false, featuredAt: null });
      });
      if (!prev.empty) await batch.commit();
    }

    await adminDb.collection('products').doc(productId).update({
      featured:   featured ?? true,
      featuredAt: featured ? new Date() : null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[toggle-featured]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
