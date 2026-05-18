import { getAdminDb } from '@/lib/firebase-admin';
import { notFound }    from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://truekeamas.cl';

function serialize(data) {
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v.toDate === 'function') {
      out[k] = v.toDate().toISOString();
    } else {
      out[k] = v ?? null;
    }
  }
  return out;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const db   = getAdminDb();
    const snap = await db.collection('products').doc(id).get();
    if (!snap.exists) return { title: 'Producto no encontrado | Truekeamas' };
    const p = snap.data();
    const title = p.title + ' | Truekeamas';
    const description = p.description
      ? p.description.slice(0, 160)
      : p.category + (p.subcategory ? ' - ' + p.subcategory : '') + (p.region ? ' en ' + p.region : '') + ' - Intercambia en Truekeamas.';
    const image = p.photos?.[0] || null;
    return {
      title,
      description,
      openGraph: {
        title, description,
        url:    BASE + '/p/' + id,
        images: image ? [{ url: image, width: 800, height: 600 }] : [],
        type:   'website',
      },
      twitter: { card: 'summary_large_image', title, description },
      alternates: { canonical: BASE + '/p/' + id },
    };
  } catch {
    return { title: 'Truekeamas' };
  }
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  try {
    const db   = getAdminDb();
    const snap = await db.collection('products').doc(id).get();
    if (!snap.exists) notFound();
    const data = snap.data();
    if (data.status !== 'active') notFound();

    const product = { id: snap.id, ...serialize(data) };

    let owner = null;
    if (product.ownerId) {
      const ownerSnap = await db.collection('users').doc(product.ownerId).get();
      if (ownerSnap.exists) {
        const od = ownerSnap.data();
        owner = {
          id:              ownerSnap.id,
          displayName:     od.displayName     || 'Usuario',
          avatarUrl:       od.avatarUrl       || null,
          level:           od.level           || 'Nuevo',
          ratingAvg:       od.ratingAvg       || 0,
          ratingCount:     od.ratingCount     || 0,
          tradesCompleted: od.tradesCompleted || 0,
          region:          od.region          || null,
          commune:         od.commune         || null,
        };
      }
    }

    return <ProductDetailClient product={product} owner={owner} />;
  } catch (err) {
    console.error('[ProductDetailPage]', err.message);
    notFound();
  }
}

