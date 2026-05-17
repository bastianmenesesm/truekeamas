import { getAdminDb } from '@/lib/firebase-admin';

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://truekeamas.cl';

export default async function sitemap() {
  const now = new Date().toISOString();

  // ── Páginas estáticas ────────────────────────────────────────────
  const staticPages = [
    { url: BASE,                  lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/privacidad`,  lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/terminos`,    lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  // ── Páginas dinámicas de productos activos ───────────────────────
  try {
    const db   = getAdminDb();
    const snap = await db.collection('products')
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(5000)               // límite de seguridad; Google acepta hasta 50 000 por archivo
      .select('createdAt', 'updatedAt')  // trae solo lo necesario, sin fotos ni descripciones
      .get();

    const productPages = snap.docs.map(doc => {
      const data    = doc.data();
      const updated = data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date();
      return {
        url:             `${BASE}/p/${doc.id}`,
        lastModified:    updated.toISOString(),
        changeFrequency: 'weekly',
        priority:        0.8,
      };
    });

    // ── Perfiles públicos de usuarios ─────────────────────────────
    const usersSnap = await db.collection('users')
      .select('updatedAt', 'createdAt', 'role')
      .limit(2000)
      .get();

    const userPages = usersSnap.docs
      .filter(doc => doc.data().role !== 'banned')
      .map(doc => {
        const data    = doc.data();
        const updated = data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date();
        return {
          url:             `${BASE}/u/${doc.id}`,
          lastModified:    updated.toISOString(),
          changeFrequency: 'weekly',
          priority:        0.5,
        };
      });

    return [...staticPages, ...productPages, ...userPages];
  } catch (err) {
    console.error('[sitemap] Error fetching products:', err.message);
    return staticPages;   // fallback: al menos las páginas estáticas
  }
}
