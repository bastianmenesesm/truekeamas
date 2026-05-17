import { getAdminDb } from '@/lib/firebase-admin';
import { notFound }    from 'next/navigation';
import Link            from 'next/link';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://truekeamas.cl';

const ACTION_LABEL = { vender: 'Venta', cambiar: 'Trueque', mixto: 'Mixto', donar: 'Donación' };
const ACTION_COLOR = { vender: '#F59E0B', cambiar: '#1677FF', mixto: '#8B5CF6', donar: '#22C55E' };

/* ── Metadata dinámica ───────────────────────────────────────────── */
export async function generateMetadata({ params }) {
  try {
    const { id } = await params;
    const db      = getAdminDb();
    const snap    = await db.collection('users').doc(id).get();
    if (!snap.exists) return { title: 'Usuario no encontrado | Truekeamas' };
    const u = snap.data();
    return {
      title:       `${u.displayName || 'Usuario'} en Truekeamas`,
      description: `Perfil de ${u.displayName || 'usuario'} en Truekeamas. Nivel: ${u.level || 'Nuevo'}. ${u.region ? `Ubicación: ${u.region}.` : ''}`,
      alternates:  { canonical: `${BASE_URL}/u/${id}` },
      openGraph: {
        title:    `${u.displayName || 'Usuario'} | Truekeamas`,
        url:      `${BASE_URL}/u/${id}`,
        type:     'profile',
        siteName: 'Truekeamas',
      },
    };
  } catch {
    return { title: 'Truekeamas' };
  }
}

/* ── Página ──────────────────────────────────────────────────────── */
export default async function UserProfilePage({ params }) {
  const { id } = await params;

  let user, products;
  try {
    const db       = getAdminDb();
    const userSnap = await db.collection('users').doc(id).get();
    if (!userSnap.exists) notFound();

    const data = userSnap.data();
    if (data.role === 'banned') notFound();

    user = {
      id,
      displayName:    data.displayName    || 'Usuario',
      avatarUrl:      data.avatarUrl      || null,
      region:         data.region         || '',
      level:          data.level          || 'Nuevo',
      ratingAvg:      data.ratingAvg      || 0,
      ratingCount:    data.ratingCount    || 0,
      tradesCompleted:data.tradesCompleted|| 0,
    };

    // Publicaciones activas del usuario (máx 12)
    const prodSnap = await db.collection('products')
      .where('ownerId', '==', id)
      .where('status',  '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(12)
      .get();

    products = prodSnap.docs.map(doc => {
      const p = doc.data();
      return {
        id:       doc.id,
        title:    p.title    || '',
        action:   p.action   || 'cambiar',
        price:    typeof p.price === 'number' ? p.price : 0,
        region:   p.region   || '',
        commune:  p.commune  || '',
        photos:   Array.isArray(p.photos) ? p.photos.slice(0, 1) : [],
        category: p.category || '',
      };
    });
  } catch (err) {
    console.error('[UserProfilePage]', err.message);
    notFound();
  }

  const initial    = user.displayName.charAt(0).toUpperCase();
  const levelColor = { Confiable: '#22C55E', Verificado: '#1677FF', Activo: '#F59E0B', Nuevo: '#94A3B8' };

  return (
    <div className="up-root">
      {/* Nav */}
      <nav className="pp-nav">
        <Link href="/" className="pp-nav-brand">Truekeamas</Link>
        <Link href="/" className="pp-nav-cta">Ver marketplace →</Link>
      </nav>

      <main className="up-main">
        {/* Profile card */}
        <div className="up-card">
          <div className="up-avatar">
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt={user.displayName} />
              : <span>{initial}</span>
            }
          </div>

          <div className="up-info">
            <h1 className="up-name">{user.displayName}</h1>

            <div className="up-badges">
              <span className="up-level" style={{ background: levelColor[user.level] || '#94A3B8' }}>
                {user.level}
              </span>
              {user.region && (
                <span className="up-location">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {user.region}
                </span>
              )}
            </div>

            <div className="up-stats">
              {user.ratingAvg > 0 && (
                <div className="up-stat">
                  <strong>⭐ {Number(user.ratingAvg).toFixed(1)}</strong>
                  <span>{user.ratingCount} {user.ratingCount === 1 ? 'calificación' : 'calificaciones'}</span>
                </div>
              )}
              {user.tradesCompleted > 0 && (
                <div className="up-stat">
                  <strong>{user.tradesCompleted}</strong>
                  <span>{user.tradesCompleted === 1 ? 'trueque' : 'trueques'} completados</span>
                </div>
              )}
              <div className="up-stat">
                <strong>{products.length}</strong>
                <span>publicaciones activas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        {products.length > 0 && (
          <section className="up-products">
            <h2 className="up-products-title">Publicaciones activas</h2>
            <div className="up-grid">
              {products.map(p => (
                <Link key={p.id} href={`/p/${p.id}`} className="up-product-card">
                  <div className="up-product-img">
                    {p.photos[0]
                      ? <img src={p.photos[0]} alt={p.title} loading="lazy" />
                      : <span>📦</span>
                    }
                    <span className="up-product-badge" style={{ background: ACTION_COLOR[p.action] || '#1677FF' }}>
                      {ACTION_LABEL[p.action] || 'Trueque'}
                    </span>
                  </div>
                  <div className="up-product-body">
                    <p className="up-product-title">{p.title}</p>
                    {p.price > 0 && (
                      <p className="up-product-price">${Number(p.price).toLocaleString('es-CL')}</p>
                    )}
                    {(p.commune || p.region) && (
                      <p className="up-product-loc">{p.commune || p.region}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link href="/" className="pp-nav-cta" style={{ display: 'inline-block' }}>
            Ver todo en el marketplace →
          </Link>
        </div>
      </main>

      <footer className="pp-footer">
        <p>© {new Date().getFullYear()} Truekeamas · Plataforma de trueque digital en Chile</p>
      </footer>
    </div>
  );
}
