import { getAdminDb } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { categoryToSlug } from '@/lib/categories';

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

  // ── JSON-LD (BreadcrumbList) ─────────────────────────────────────
  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
  ];
  if (p.category) {
    breadcrumbItems.push({
      '@type':    'ListItem',
      position:   2,
      name:       p.category,
      item:       `${BASE_URL}/categoria/${categoryToSlug(p.category)}`,
    });
  }
  breadcrumbItems.push({
    '@type':    'ListItem',
    position:   breadcrumbItems.length + 1,
    name:       p.title,
    item:       pageUrl,
  });
  const breadcrumbJsonLd = {
    '@context':       'https://schema.org',
    '@type':          'BreadcrumbList',
    itemListElement:   breadcrumbItems,
  };

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
      {/* JSON-LD: Product */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* JSON-LD: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Nav */}
      <nav className="pp-nav">
        <Link href="/" className="pp-nav-brand">Truekeamas</Link>
        <Link href={`/?open=${p.id}`} className="pp-nav-cta">Ver en marketplace →</Link>
      </nav>

      {/* Breadcrumb visual */}
      <nav className="pp-breadcrumb" aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link>
        <span aria-hidden="true">›</span>
        {p.category && (
          <>
            <Link href={`/categoria/${categoryToSlug(p.category)}`}>{p.category}</Link>
            <span aria-hidden="true">›</span>
          </>
        )}
        <span>{p.title.length > 40 ? p.title.slice(0, 40) + '…' : p.title}</span>
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

            {/* Share buttons */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${p.title} — ${pageUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pp-wa-btn"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.862L.054 23.61a.5.5 0 0 0 .613.613l5.748-1.478A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.9 9.9 0 0 1-5.04-1.376l-.36-.214-3.734.96.99-3.617-.235-.374A9.855 9.855 0 0 1 2.1 12C2.1 6.533 6.533 2.1 12 2.1S21.9 6.533 21.9 12 17.467 21.9 12 21.9z"/>
                </svg>
                Compartir por WhatsApp
              </a>
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
