import { getAdminDb } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://truekeamas.cl';

/* ── Metadata dinámica (OG + Twitter cards) ───────────────────── */
export async function generateMetadata({ params }) {
  try {
    const { id } = await params;   // Next.js 15+ params es Promise
    const db   = getAdminDb();
    const snap = await db.collection('products').doc(id).get();
    if (!snap.exists) return { title: 'Publicación no encontrada | Truekeamas' };

    const p = snap.data();
    const locationParts = [p.commune, p.region].filter(Boolean);
    const location      = locationParts.join(', ');

    const description = [
      p.description ? p.description.slice(0, 130).trim() : null,
      location      ? `📍 ${location}`                    : null,
    ].filter(Boolean).join(' — ') || 'Publicación en Truekeamas';

    const image = p.photos?.[0] || null;
    const url   = `${BASE_URL}/p/${id}`;

    return {
      title:      p.title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title:       `${p.title} | Truekeamas`,
        description,
        url,
        type:        'website',
        siteName:    'Truekeamas',
        locale:      'es_CL',
        images:      image ? [{ url: image, width: 800, height: 600, alt: p.title }] : [],
      },
      twitter: {
        card:        image ? 'summary_large_image' : 'summary',
        title:       p.title,
        description,
        images:      image ? [image] : [],
      },
    };
  } catch {
    return { title: 'Truekeamas' };
  }
}

/* ── Página ───────────────────────────────────────────────────── */
export default async function ProductPage({ params }) {
  const { id } = await params;   // Next.js 15+ params es Promise
  let p = null;
  try {
    const db   = getAdminDb();
    const snap = await db.collection('products').doc(id).get();
    if (!snap.exists) notFound();
    const data = snap.data();
    if (data?.status === 'deleted' || data?.status === 'blocked') notFound();

    // Extraer solo campos serializables (Firestore Timestamps rompen RSC)
    p = {
      id:             snap.id,
      title:          data.title          || '',
      description:    data.description    || '',
      category:       data.category       || '',
      subcategory:    data.subcategory    || '',
      action:         data.action         || '',
      price:          typeof data.price === 'number' ? data.price : (Number(data.price) || 0),
      region:         data.region         || '',
      commune:        data.commune        || '',
      wants:          data.wants          || '',
      photos:         Array.isArray(data.photos) ? data.photos : [],
      ownerName:      data.ownerName      || data.owner || '',
      ownerAvatarUrl: data.ownerAvatarUrl || null,
      ownerRatingAvg: typeof data.ownerRatingAvg === 'number' ? data.ownerRatingAvg : 0,
      status:         data.status         || 'active',
    };
  } catch (err) {
    console.error('[ProductPage] Error fetching product:', err);
    notFound();
  }

  const ACTION_LABEL = {
    vender:  '💰 Venta',
    cambiar: '🔄 Trueque',
    mixto:   '⚡ Mixto',
    donar:   '🎁 Donación',
  };
  const actionLabel = ACTION_LABEL[p.action] || '🔄 Trueque';
  const location    = [p.commune, p.region].filter(Boolean).join(', ');
  const initial     = (p.ownerName || 'U').charAt(0).toUpperCase();
  const pageUrl     = `${BASE_URL}/p/${p.id}`;

  // ── JSON-LD (Schema.org Product) ─────────────────────────────────
  const availability = p.status === 'active'
    ? 'https://schema.org/InStock'
    : 'https://schema.org/SoldOut';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type':    'Product',
    name:        p.title,
    description: p.description || `${p.title} disponible en Truekeamas`,
    image:       p.photos.length > 0 ? p.photos : undefined,
    url:         pageUrl,
    ...(p.category    && { category: p.category }),
    ...(p.ownerName   && {
      brand: { '@type': 'Brand', name: p.ownerName },
    }),
    offers: {
      '@type':        'Offer',
      url:            pageUrl,
      priceCurrency:  'CLP',
      price:          p.price > 0 ? p.price : 0,
      availability,
      itemCondition:  'https://schema.org/UsedCondition',
      seller: {
        '@type': 'Person',
        name:    p.ownerName || 'Usuario Truekeamas',
      },
      ...(location && { areaServed: location }),
    },
  };

  return (
    <div className="pp-root">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Nav */}
      <nav className="pp-nav">
        <Link href="/" className="pp-nav-brand">Truekeamas</Link>
        <Link href={`/?open=${p.id}`} className="pp-nav-cta">Ver en marketplace →</Link>
      </nav>

      {/* Card */}
      <main className="pp-main">
        <div className="pp-card">
          {/* Imagen */}
          {p.photos?.[0] && (
            <div className="pp-img-wrap">
              <img src={p.photos[0]} alt={p.title} className="pp-img" />
              {p.photos.length > 1 && (
                <div className="pp-img-count">+{p.photos.length - 1} fotos</div>
              )}
            </div>
          )}

          {/* Cuerpo */}
          <div className="pp-body">
            <div className="pp-badges-row">
              <span className="pp-badge pp-badge--action">{actionLabel}</span>
              {p.category && <span className="pp-badge pp-badge--cat">{p.category}</span>}
              {p.subcategory && <span className="pp-badge pp-badge--sub">{p.subcategory}</span>}
            </div>

            <h1 className="pp-title">{p.title}</h1>

            {location && (
              <p className="pp-location">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {location}
              </p>
            )}

            {p.price > 0 && (
              <p className="pp-price">${Number(p.price).toLocaleString('es-CL')}</p>
            )}

            {p.description && (
              <p className="pp-desc">{p.description}</p>
            )}

            {p.wants && (
              <div className="pp-wants">
                <span className="pp-wants-label">🔄 Busca a cambio</span>
                <span>{p.wants}</span>
              </div>
            )}

            {/* Dueño */}
            <div className="pp-owner">
              <div className="pp-owner-av">
                {p.ownerAvatarUrl
                  ? <img src={p.ownerAvatarUrl} alt={p.ownerName} />
                  : initial
                }
              </div>
              <div className="pp-owner-info">
                <span className="pp-owner-name">{p.ownerName || 'Usuario'}</span>
                {p.ownerRatingAvg > 0 && (
                  <span className="pp-owner-rating">⭐ {Number(p.ownerRatingAvg).toFixed(1)}</span>
                )}
              </div>
            </div>

            {/* CTA */}
            <Link href={`/?open=${p.id}`} className="pp-cta">
              Ver en Truekeamas para hacer match
            </Link>
          </div>
        </div>
      </main>

      <footer className="pp-footer">
        <p>© {new Date().getFullYear()} Truekeamas · Plataforma de trueque digital en Chile</p>
      </footer>
    </div>
  );
}
