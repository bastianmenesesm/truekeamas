'use client';
import { useApp, CATS } from '@/context/AppContext';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';

function fmtP(v) { return v ? '$' + Number(v).toLocaleString('es-CL') : 'Solo trueque'; }

function LandingProductCard({ p }) {
  const { openModal } = useApp();
  const photos = p.photos || [];
  return (
    <article className="lp-card">
      <div className="lp-card-img">
        {photos[0] ? <img src={photos[0]} alt={p.title} loading="lazy" /> : <span>{p.emoji || '📦'}</span>}
      </div>
      <div className="lp-card-body">
        <div className="ch" style={{ marginBottom: 6 }}>
          <span className="cl">Trueque</span>
          {p.buy && <span className="cv">Compra</span>}
          {p.mixed && <span className="ca">Mixto</span>}
        </div>
        <h4 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{p.title}</h4>
        <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 6 }}>
          por <strong>{p.owner}</strong> · {p.region || p.location || ''}
        </div>
        <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 16, color: 'var(--v)', marginBottom: 6 }}>{fmtP(p.price)}</div>
        <button className="btn bv bsm btn-full" onClick={() => openModal('auth')}>
          Iniciar sesión para conectar
        </button>
      </div>
    </article>
  );
}

export default function LandingPage() {
  const { products, stats, searchQuery, setSearchQuery, openModal, activeCategory, setActiveCategory } = useApp();

  const visibleProducts = products
    .filter(p => p.status === 'active')
    .filter(p => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return [p.title, p.category, p.wants, p.region].join(' ').toLowerCase().includes(q);
    })
    .filter(p => activeCategory === 'all' || p.category === activeCategory)
    .slice(0, 8);

  return (
    <>
      <div className="landing">
        {/* ── HEADER ── */}
        <header className="lh">
          <div className="lh-brand">
            <img src="/logo-icon.ico" alt="Truekeamas" width={42} height={42} style={{ objectFit: 'contain' }} />
            <div>
              <span className="lh-name">truekea<span style={{ color: 'var(--lm)' }}>mas</span></span>
              <span className="lh-tagline">Conecta · Intercambia · Crece</span>
            </div>
          </div>
          <nav className="lh-nav">
            <a href="#como-funciona" className="lh-link">¿Cómo funciona?</a>
            <a href="#vitrina-publica" className="lh-link">Ver productos</a>
            <button className="btn bo bsm" onClick={() => openModal('auth')}>Iniciar sesión</button>
            <button className="btn bv bsm" onClick={() => openModal('auth')}>Registrarse gratis</button>
          </nav>
        </header>

        {/* ── HERO ── */}
        <section className="l-hero">
          <div className="l-hero-content">
            <div className="hl" style={{ marginBottom: 20 }}>✦ Conecta · Intercambia · Crece</div>
            <h1 className="l-hero-title">
              Conectamos <em>personas</em>,<br />creamos <span className="l-hero-green">posibilidades.</span>
            </h1>
            <p className="l-hero-sub">Todo lo que necesitas está en nuestra comunidad. Intercambia, ahorra y conecta con personas de toda Chile.</p>

            <div className="l-hero-search">
              <input
                type="text"
                placeholder="¿Qué estás buscando?"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => document.getElementById('vitrina-publica')?.scrollIntoView({ behavior: 'smooth' })}
              />
              <button className="l-search-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
                </svg>
              </button>
            </div>

            <div className="l-hero-stats">
              <div className="l-stat"><strong>{stats.products}</strong><span>Publicaciones</span></div>
              <div className="l-stat"><strong>{stats.users}</strong><span>Usuarios</span></div>
              <div className="l-stat"><strong>{stats.matches}</strong><span>Acuerdos</span></div>
            </div>
          </div>
          <div className="l-hero-visual">
            <div className="l-hero-card">
              <div className="l-hc-row">
                <div className="l-hc-item"><span>📱</span><div>Tú ofreces</div><strong>Tu producto</strong></div>
                <div className="l-hc-arrow">⇄</div>
                <div className="l-hc-item"><span>💻</span><div>Recibes</div><strong>Lo que buscas</strong></div>
              </div>
              <div className="l-hc-match">
                <div className="md" />
                <div><div style={{ fontWeight: 800, fontSize: 13 }}>¡Match en tiempo real!</div><div style={{ fontSize: 11, opacity: .7 }}>Chat interno protegido</div></div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CATEGORÍAS ── */}
        <section className="l-section l-cats-section">
          <div className="l-container">
            <div className="l-section-header">
              <h2>Explora por categoría</h2>
              <p>Encuentra lo que buscas entre miles de publicaciones</p>
            </div>
            <div className="l-cats">
              <button className={`l-cat${activeCategory === 'all' ? ' active' : ''}`} onClick={() => setActiveCategory('all')}>
                <span>🔄</span>Todos
              </button>
              {CATS.map(c => (
                <button key={c.n} className={`l-cat${activeCategory === c.n ? ' active' : ''}`} onClick={() => setActiveCategory(c.n)}>
                  <span>{c.e}</span>{c.n}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRODUCTOS ── */}
        <section className="l-section" id="vitrina-publica">
          <div className="l-container">
            <div className="l-section-header">
              <h2>Publicaciones recientes</h2>
              <p>Ingresa para guardar favoritos, hacer match y chatear</p>
            </div>
            <div className="l-products">
              {products.length === 0 ? (
                <div className="es" style={{ gridColumn: '1/-1' }}>
                  <span className="ei">🔄</span>
                  <p>Cargando publicaciones...</p>
                  <div className="sp sp2" style={{ margin: '0 auto' }} />
                </div>
              ) : visibleProducts.length === 0 ? (
                <div className="es" style={{ gridColumn: '1/-1' }}>
                  <span className="ei">🔍</span><p>Sin resultados para "{searchQuery}"</p>
                  <button className="btn bv bsm" onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}>Ver todas</button>
                </div>
              ) : (
                visibleProducts.map(p => <LandingProductCard key={p.id} p={p} />)
              )}
            </div>
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <button className="btn bv" onClick={() => openModal('auth')}>
                Ver todas las publicaciones →
              </button>
            </div>
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ── */}
        <section className="l-section l-how" id="como-funciona">
          <div className="l-container">
            <div className="l-section-header">
              <h2>Un flujo claro para acordar con confianza</h2>
              <p>Truekeamas facilita el encuentro, el chat en tiempo real y el registro del acuerdo.</p>
            </div>
            <div className="l-steps">
              {[
                { n: '1', icon: '📝', title: 'Publica lo que tienes', desc: 'Crea tu publicación con fotos, precio referencial y lo que buscas a cambio.' },
                { n: '2', icon: '🔍', title: 'Explora y haz Match', desc: 'Encuentra lo que necesitas y conecta haciendo match con el publicador.' },
                { n: '3', icon: '💬', title: 'Chatea en tiempo real', desc: 'Coordina los detalles del trueque de forma segura en el chat interno.' },
                { n: '4', icon: '🤝', title: 'Registra el acuerdo', desc: 'Formaliza el intercambio y construye tu reputación en la comunidad.' },
              ].map(s => (
                <div key={s.n} className="l-step">
                  <div className="l-step-num">{s.n}</div>
                  <div className="l-step-icon">{s.icon}</div>
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="l-cta">
          <div className="l-container" style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: '#fff', marginBottom: 12 }}>
              Únete a la comunidad
            </h2>
            <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 16, marginBottom: 28, maxWidth: 500, margin: '0 auto 28px' }}>
              Crea tu cuenta gratis y empieza a intercambiar hoy mismo.
            </p>
            <button className="btn" style={{ background: '#fff', color: 'var(--v)', fontWeight: 900, fontSize: 16, padding: '14px 36px' }} onClick={() => openModal('auth')}>
              Crear cuenta gratuita →
            </button>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="l-footer">
          <div className="l-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 16 }}>
              <span style={{ color: 'var(--ink)' }}>truekea</span><span style={{ color: 'var(--lm)' }}>mas</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--mu)' }}>© 2025 Truekeamas · Cambia. Ahorra. Conecta.</div>
          </div>
        </footer>
      </div>

      <Modal />
      <Toast />
    </>
  );
}
