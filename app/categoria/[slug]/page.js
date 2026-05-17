import { getAdminDb }                  from '@/lib/firebase-admin';
import { CATEGORIES, slugToCategory, categoryToSlug } from '@/lib/categories';
import { notFound }                     from 'next/navigation';
import Link                             from 'next/link';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://truekeamas.cl';

const ACTION_LABEL = { vender: 'Venta', cambiar: 'Trueque', mixto: 'Mixto', donar: 'Donación' };
const ACTION_COLOR = { vender: '#F59E0B', cambiar: '#1677FF', mixto: '#8B5CF6', donar: '#22C55E' };

/* ── Pre-render estático para todas las categorías ───────────────── */
export async function generateStaticParams() {
  return CATEGORIES.map(c => ({ slug: categoryToSlug(c.n) }));
}

/* ── Metadata dinámica ───────────────────────────────────────────── */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cat = slugToCategory(slug);
  if (!cat) return { title: 'Categoría no encontrada | Truekeamas' };
  const desc = cat.desc ||
    `Encuentra artículos de ${cat.n} en Truekeamas. Intercambia, compra o dona con personas de todo Chile.`;
  return {
    title:       `${cat.e} ${cat.n} en Chile | Truekeamas`,
    description: desc,
    alternates:  { canonical: `${BASE_URL}/categoria/${slug}` },
    openGraph: {
      title:       `${cat.e} ${cat.n} | Truekeamas`,
      description: desc,
      url:         `${BASE_URL}/categoria/${slug}`,
      type:        'website',
      siteName:    'Truekeamas',
    },
  };
}

/* ── Página ──────────────────────────────────────────────────────── */
export default async function CategoriaPage({ params }) {
  const { slug } = await params;
  const cat = slugToCategory(slug);
  if (!cat) notFound();

  let products = [];
  try {
    const db      = getAdminDb();
    const snap    = await db.collection('products')
      .where('category', '==', cat.n)
      .where('status',   '==', 'active')
      .limit(24)
      .get();

    products = snap.docs.map(doc => {
      const p = doc.data();
      return {
        id:      doc.id,
        title:   p.title   || '',
        action:  p.action  || 'cambiar',
        price:   typeof p.price === 'number' ? p.price : 0,
        region:  p.region  || '',
        commune: p.commune || '',
        photos:  Array.isArray(p.photos) ? p.photos.slice(0, 1) : [],
      };
    });
  } catch (err) {
    console.error('[CategoriaPage]', err.message);
    // Seguir aunque falle Firestore — mostramos la página vacía
  }

  /* ── JSON-LD BreadcrumbList ─────────────────────────────────── */
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio',    item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: cat.n,       item: `${BASE_URL}/categoria/${slug}` },
    ],
  };

  /* ── JSON-LD ItemList ───────────────────────────────────────── */
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type':    'ItemList',
    name:        `${cat.n} en Truekeamas`,
    url:         `${BASE_URL}/categoria/${slug}`,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type':    'ListItem',
      position:    i + 1,
      url:         `${BASE_URL}/p/${p.id}`,
      name:        p.title,
    })),
  };

  return (
    <div className="pp-root">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      {/* Nav */}
      <nav className="pp-nav">
        <Link href="/" className="pp-nav-brand">Truekeamas</Link>
        <Link href="/" className="pp-nav-cta">Ver marketplace →</Link>
      </nav>

      {/* Breadcrumb visual */}
      <nav className="pp-breadcrumb" aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link>
        <span aria-hidden="true">›</span>
        <span>{cat.n}</span>
      </nav>

      {/* Hero de categoría */}
      <header className="cat-hero">
        <div className="cat-hero-emoji">{cat.e}</div>
        <h1 className="cat-hero-title">{cat.n} en Chile</h1>
        {cat.desc && <p className="cat-hero-desc">{cat.desc}</p>}
        <p className="cat-hero-sub">
          {products.length > 0
            ? `${products.length} publicación${products.length !== 1 ? 'es' : ''} activa${products.length !== 1 ? 's' : ''} en esta categoría`
            : 'Aún no hay publicaciones en esta categoría. ¡Sé el primero!'
          }
        </p>
        <a href="/" className="cat-hero-cta">
          Publicar en {cat.n} →
        </a>
      </header>

      {/* Grid */}
      <main className="cat-main">
        {products.length > 0 ? (
          <div className="up-grid">
            {products.map(p => (
              <Link key={p.id} href={`/p/${p.id}`} className="up-product-card">
                <div className="up-product-img">
                  {p.photos[0]
                    ? <img src={p.photos[0]} alt={p.title} loading="lazy" />
                    : <span>📦</span>
                  }
                  <span
                    className="up-product-badge"
                    style={{ background: ACTION_COLOR[p.action] || '#1677FF' }}
                  >
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
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#5B7D9E' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>{cat.e}</div>
            <p style={{ fontSize: 15 }}>Aún no hay publicaciones en {cat.n}.</p>
          </div>
        )}

        {/* Otras categorías */}
        <section className="cat-others">
          <h2 className="cat-others-title">Explorar otras categorías</h2>
          <div className="cat-others-grid">
            {CATEGORIES.filter(c => c.n !== cat.n).slice(0, 8).map(c => (
              <Link key={c.n} href={`/categoria/${categoryToSlug(c.n)}`} className="cat-chip">
                {c.e} {c.n}
              </Link>
            ))}
          </div>
        </section>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
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
