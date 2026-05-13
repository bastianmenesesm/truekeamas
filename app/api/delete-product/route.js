import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import crypto from 'crypto';

const CLOUD_NAME = 'dnkvgg0zi';

/**
 * Extrae el public_id de una URL de Cloudinary
 * Maneja transformaciones, versiones y carpetas.
 * Ej: https://res.cloudinary.com/dnkvgg0zi/image/upload/f_auto,q_auto/v1234/truekeamas/abc.jpg
 * → truekeamas/abc
 */
function extractPublicId(url) {
  if (!url || !url.includes('cloudinary.com')) return null;

  const uploadIdx = url.indexOf('/upload/');
  if (uploadIdx === -1) return null;

  // Todo lo que viene después de /upload/
  const path = url.slice(uploadIdx + 8);
  const segments = path.split('/');
  const result = [];

  for (const seg of segments) {
    if (!seg) continue;
    // Saltar versión: v seguido solo de dígitos (ej: v1747123456)
    if (/^v\d+$/.test(seg)) continue;
    // Saltar transformaciones: contienen coma o tienen forma letra_algo (ej: f_auto, q_auto, w_400)
    if (seg.includes(',') || /^[a-z]_/.test(seg)) continue;
    result.push(seg);
  }

  if (result.length === 0) return null;

  // Unir y quitar extensión del último segmento
  const fullPath = result.join('/');
  return fullPath.replace(/\.[a-zA-Z0-9]{2,4}$/, '') || null;
}

async function deleteCloudinaryImage(publicId) {
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiKey || !apiSecret) {
    console.warn('[Cloudinary] API key/secret no configurados');
    return { result: 'skipped' };
  }

  const timestamp = Math.round(Date.now() / 1000);
  const str       = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(str).digest('hex');

  const fd = new FormData();
  fd.append('public_id', publicId);
  fd.append('timestamp',  String(timestamp));
  fd.append('api_key',    apiKey);
  fd.append('signature',  signature);
  fd.append('invalidate', 'true');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
    method: 'POST',
    body: fd,
  });
  return res.json();
}

export async function POST(request) {
  try {
    const { productId } = await request.json();
    if (!productId) return NextResponse.json({ error: 'productId requerido' }, { status: 400 });

    // Verificar token de Firebase Auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(idToken);

    const adminDb   = getAdminDb();
    const productRef = adminDb.collection('products').doc(productId);
    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      return NextResponse.json({ error: 'Publicación no encontrada' }, { status: 404 });
    }

    const product = productSnap.data();

    // Verificar propiedad o rol admin
    const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
    const isAdmin  = userSnap.exists && userSnap.data()?.role === 'admin';
    if (product.ownerId !== decoded.uid && !isAdmin) {
      return NextResponse.json({ error: 'Sin permiso para eliminar esta publicación' }, { status: 403 });
    }

    // 1 — Borrar fotos de Cloudinary
    const photos = product.photos || [];
    if (photos.length > 0) {
      const results = await Promise.allSettled(
        photos.map(url => {
          const publicId = extractPublicId(url);
          console.log('[delete-product] URL:', url, '→ publicId:', publicId);
          if (!publicId) return Promise.resolve({ result: 'skipped_no_id' });
          return deleteCloudinaryImage(publicId);
        })
      );
      console.log('[delete-product] Cloudinary results:', JSON.stringify(results.map(r => r.status === 'fulfilled' ? r.value : r.reason)));
    }

    // 2 — Hard delete del documento en Firestore
    await productRef.delete();

    // 3 — Buscar todos los registros relacionados en paralelo
    const [proposalsSnap, reportsSnap, matchesSnap] = await Promise.all([
      adminDb.collection('proposals').where('productId', '==', productId).get(),
      adminDb.collection('reports').where('productId',   '==', productId).get(),
      adminDb.collection('matches').where('productId',   '==', productId).get(),
    ]);

    // 4 — Borrar mensajes de cada chat (subcolección) y luego el match
    for (const matchDoc of matchesSnap.docs) {
      const messagesSnap = await matchDoc.ref.collection('messages').get();
      if (messagesSnap.size > 0) {
        const msgBatch = adminDb.batch();
        messagesSnap.docs.forEach(m => msgBatch.delete(m.ref));
        await msgBatch.commit();
      }
      await matchDoc.ref.delete();
    }

    // 5 — Borrar proposals y reports en batch
    const batch = adminDb.batch();
    proposalsSnap.docs.forEach(d => batch.delete(d.ref));
    reportsSnap.docs.forEach(d  => batch.delete(d.ref));

    if (proposalsSnap.docs.length + reportsSnap.docs.length > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      ok: true,
      deletedPhotos:    photos.length,
      deletedChats:     matchesSnap.size,
      deletedProposals: proposalsSnap.size,
      deletedReports:   reportsSnap.size,
    });
  } catch (err) {
    console.error('[delete-product] error:', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
