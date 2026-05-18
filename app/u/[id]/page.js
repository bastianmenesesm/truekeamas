import { getAdminDb } from '@/lib/firebase-admin';
import { notFound }    from 'next/navigation';
import UserProfileClient from './UserProfileClient';

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
    const snap = await db.collection('users').doc(id).get();
    if (!snap.exists) return { title: 'Usuario no encontrado | Truekeamas' };
    const u = snap.data();
    if (u.role === 'banned') return { title: 'Perfil no disponible | Truekeamas' };
    const name = u.displayName || 'Usuario';
    const title = name + ' en Truekeamas';
    const description = 'Perfil de ' + name + ' en Truekeamas. Nivel: ' + (u.level || 'Nuevo') + (u.tradesCompleted ? '. ' + u.tradesCompleted + ' trueques completados.' : '.');
    return {
      title,
      description,
      openGraph: {
        title, description,
        url:    BASE + '/u/' + id,
        images: u.avatarUrl ? [{ url: u.avatarUrl }] : [],
        type:   'profile',
      },
      alternates: { canonical: BASE + '/u/' + id },
    };
  } catch {
    return { title: 'Truekeamas' };
  }
}

export default async function UserProfilePage({ params }) {
  const { id } = await params;
  try {
    const db   = getAdminDb();
    const snap = await db.collection('users').doc(id).get();
    if (!snap.exists) notFound();
    const data = snap.data();
    if (data.role === 'banned') notFound();

    const user = {
      id:              snap.id,
      displayName:     data.displayName     || 'Usuario',
      avatarUrl:       data.avatarUrl       || null,
      level:           data.level           || 'Nuevo',
      ratingAvg:       data.ratingAvg       || 0,
      ratingCount:     data.ratingCount     || 0,
      tradesCompleted: data.tradesCompleted || 0,
      region:          data.region          || null,
      commune:         data.commune         || null,
      role:            data.role            || 'user',
    };

    // Productos activos del usuario (max 24)
    const productsSnap = await db.collection('products')
      .where('ownerId', '==', id)
      .where('status',  '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(24)
      .get();

    const products = productsSnap.docs.map(d => ({ id: d.id, ...serialize(d.data()) }));

    return <UserProfileClient user={user} products={products} />;
  } catch (err) {
    console.error('[UserProfilePage]', err.message);
    notFound();
  }
}
