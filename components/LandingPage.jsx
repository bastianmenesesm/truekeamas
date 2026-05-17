'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useApp, CATS } from '@/context/AppContext';
import { optimizeCloudinaryUrl } from '@/lib/firebase';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';

function fmtP(v) { return v ? '$' + Number(v).toLocaleString('es-CL') : null; }

const ACTION_COLOR = {
  donar:   { label: 'Donación', cls: 'cd-badge' },
  vender:  { label: 'Venta',    cls: 'cv' },
  mixto:   { label: 'Mixto',    cls: 'ca' },
  cambiar: { label: 'Trueque',  cls: 'cl' },
};

function getActionBadge(p) {
  if (p.action) return ACTION_COLOR[p.action] || ACTION_COLOR.cambiar;
  if (p.donate) return ACTION_COLOR.donar;
  if (p.buy && p.barter) return ACTION_COLOR.mixto;
  if (p.buy) return ACTION_COLOR.vender;
  return ACTION_COLOR.cambiar;
}

function LandingCard({ p, onLoginGate, onDetail }) {
  const photos = p.photos || [];
  const badge  = getActionBadge(p);
  const price  = fmtP(p.price);

  return (
    <article className="lp-card" onClick={onDetail || onLoginGate}>
      <div className="lp-card-img">
        {photos[0]
          ? <Image src={optimizeCloudinaryUrl(photos[0], 400)} alt={p.title} fill sizes="(max-width: 640px) 50vw, 25vw" className="lp-card-img-fill" unoptimized />
          : <span className="lp-card-emoji">{p.emoji || '📦'}</span>
        }
        {(p.likes || 0) > 0 && (
          <div className="lp-card-likes">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" stroke="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {p.likes}
          </div>
        )}
        <span className={`lp-card-badge ${badge.cls}`}>{badge.label}</span>
      </div>
      <div className="lp-card-body">
        <h4 className="lp-card-title">{p.title}</h4>
        {p.condition && <div className="lp-card-cond">{p.condition.split('(')[0].trim()}</div>}
        <div className="lp-card-meta">{p.region || 'Chile'}</div>
        {price
          ? <div className="lp-card-price">{price}</div>
          : <div className="lp-card-price lp-card-price--free">Gratis / Trueque</div>
        }
      </div>
    </article>
  );
}

export default function LandingPage() {
  const { products, stats, searchQuery, setSearchQuery, openModal, activeCategory, setActiveCategory } = useApp();
  const totalLikes = products.reduce((sum, p) => sum + (p.likes || 0), 0);
  const [sortBy, setSortBy] = useState('likes');
  const [menuOpen, setMenuOpen] = useState(false);

  const sorted = [...products]
    .filter(p => p.status === 'active' && p.status !== 'sold')
    .filter(p => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return [p.title, p.category, p.subcategory, p.wants, p.region].join(' ').toLowerCase().includes(q);
    })
    .filter(p => activeCategory === 'all' || p.category === activeCategory)
    .sort((a, b) => {
      if (sortBy === 'likes')  return (b.likes || 0) - (a.likes || 0);
      if (sortBy === 'newest') return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      return 0;
    })
    .slice(0, 24);

  const allCount  = products.filter(p => p.status === 'active').length;

  function loginGate() { openModal('auth'); }

  return (
    <>
      <div className="landing">

        {/* ── HEADER ───────────────────────────── */}
        <header className="lh">
          <div className="lh-brand">
            <Image src="/favicon-96x96.png" alt="Truekeamas" width={38} height={38} style={{ objectFit: 'contain' }} />
            <span className="lh-name">truekea<span>mas</span></span>
          </div>
          <nav className={`lh-nav${menuOpen ? ' open' : ''}`}>
            <a href="#como-funciona" className="lh-link" onClick={() => setMenuOpen(false)}>¿Cómo funciona?</a>
            <a href="#vitrina" className="lh-link" onClick={() => setMenuOpen(false)}>Explorar</a>
            <a href="/privacidad" className="lh-link" onClick={() => setMenuOpen(false)}>Privacidad</a>
            <button className="btn bo bsm" onClick={() => { setMenuOpen(false); openModal('auth'); }}>Iniciar sesión</button>
            <button className="btn bv bsm" onClick={() => { setMenuOpen(false); openModal('auth'); }}>Registrarse</button>
          </nav>
          <button className="lh-burger" onClick={() => setMenuOpen(o => !o)} aria-label="Menú">
            <span /><span /><span />
          </button>
        </header>

        {/* ── HERO ─────────────────────────────── */}
        <section className="l-hero">
          <div className="l-hero-overlay" />
          <div className="l-hero-content">
            <div className="l-hero-pill">🇨🇱 La comunidad de trueque digital de Chile</div>
            <h1 className="l-hero-title">
              Truekeamas
            </h1>
            <p className="l-hero-tagline">Plataforma de trueque digital en Chile</p>
            <p className="l-hero-sub">
              Truekeamas es la plataforma de trueque digital en Chile para intercambiar
              productos y servicios con personas de todo el país.<br />
              Sin intermediarios, sin comisiones.
            </p>
            <div className="l-hero-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" style={{ flexShrink: 0, color: 'var(--mu)' }}>
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="text"
                placeholder="Busca celulares, ropa, libros…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => document.getElementById('vitrina')?.scrollIntoView({ behavior: 'smooth' })}
              />
              {searchQuery && <button className="l-search-clear" onClick={() => setSearchQuery('')}>✕</button>}
            </div>
            <div className="l-hero-ctas">
              <button className="btn bv" style={{ fontSize: 15, padding: '13px 28px' }} onClick={loginGate}>
                Publicar gratis
              </button>
              <button className="btn" style={{ background: 'rgba(255,255,255,.18)', color: '#fff', border: '1.5px solid rgba(255,255,255,.4)', fontSize: 15, padding: '13px 28px' }} onClick={loginGate}>
                Ver mis favoritos
              </button>
            </div>
            <div className="l-hero-stats">
              <div className="l-stat"><strong>{stats.products}</strong><span>Publicaciones</span></div>
              <div className="l-stat"><strong>{totalLikes}</strong><span>Likes</span></div>
            </div>
          </div>
        </section>


        {/* ── PRODUCTS GRID ────────────────────── */}
        <section className="l-products-section" id="vitrina">
          <div className="l-container">
            <div className="l-grid-header">
              <div className="l-grid-title">
                <h2>
                  {activeCategory === 'all' ? 'Publicaciones' : activeCategory}
                  {allCount > 0 && <span className="l-grid-count">{allCount}</span>}
                </h2>
                {searchQuery && (
                  <span className="l-search-tag">
                    "{searchQuery}"
                    <button onClick={() => setSearchQuery('')}>✕</button>
                  </span>
                )}
              </div>
              <div className="l-grid-sort">
                <button className={`l-sort-btn${sortBy === 'likes'  ? ' active' : ''}`} onClick={() => setSortBy('likes')}>❤️ Populares</button>
                <button className={`l-sort-btn${sortBy === 'newest' ? ' active' : ''}`} onClick={() => setSortBy('newest')}>🆕 Recientes</button>
              </div>
            </div>

            <div className="l-products">
              {products.length === 0 ? (
                <div className="es" style={{ gridColumn: '1/-1' }}>
                  <span className="ei">🔄</span>
                  <p>Cargando publicaciones...</p>
                  <div className="sp sp2" style={{ margin: '0 auto' }} />
                </div>
              ) : sorted.length === 0 ? (
                <div className="es" style={{ gridColumn: '1/-1' }}>
                  <span className="ei">🔍</span>
                  <p>Sin resultados para "<strong>{searchQuery || activeCategory}</strong>"</p>
                  <button className="btn bv bsm" onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}>Ver todas</button>
                </div>
              ) : (
                sorted.map(p => (
                <LandingCard
                  key={p.id}
                  p={p}
                  onLoginGate={loginGate}
                  onDetail={() => openModal({ type: 'product_detail', productId: p.id })}
                />
              ))
              )}
            </div>

            {allCount > 24 && (
              <div className="l-grid-more">
                <button className="btn bv" style={{ padding: '12px 36px' }} onClick={loginGate}>
                  Ver las {allCount} publicaciones →
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ─────────────────────  */}
        <section className="l-how" id="como-funciona">
          <div className="l-container">
            <div className="l-how-header">
              <h2>Así de simple funciona</h2>
              <p>En minutos puedes publicar y empezar a intercambiar</p>
            </div>
            <div className="l-steps">
              {[
                { n: '1', icon: '📸', title: 'Fotografía lo que tienes', desc: 'Sube fotos, elige la categoría y escribe qué buscas a cambio.' },
                { n: '2', icon: '🤝', title: 'Recibe propuestas', desc: 'Otros usuarios te envían propuestas con su oferta. Acepta o declina.' },
                { n: '3', icon: '💬', title: 'Coordina por chat', desc: 'Habla directamente dentro de la app. Sin exponer datos personales.' },
                { n: '4', icon: '✅', title: '¡Acuerdo listo!', desc: 'Registra el intercambio y construye tu reputación en la comunidad.' },
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

        {/* ── CTA BANNER ────────────────────────── */}
        <section className="l-cta">
          <div className="l-container">
            <div className="l-cta-inner">
              <div>
                <h2>Empieza hoy gratis</h2>
                <p>Únete a miles de chilenos que ya intercambian en Truekeamas</p>
              </div>
              <button className="btn" style={{ background: '#fff', color: 'var(--v)', fontWeight: 800, fontSize: 15, padding: '14px 32px', borderRadius: 12, whiteSpace: 'nowrap' }} onClick={loginGate}>
                Crear cuenta gratis →
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────── */}
        <footer className="l-footer">
          <div className="l-container">
            <div className="l-footer-grid">

              <div className="l-footer-brand">
                <div className="l-footer-logo">
                  <Image src="/favicon-96x96.png" alt="Truekeamas" width={36} height={36} style={{ objectFit: 'contain' }} />
                  <span>truekea<strong>mas</strong></span>
                </div>
                <p>Truekeamas es la plataforma de trueque digital en Chile para intercambiar productos y servicios. Sin comisiones, sin intermediarios.</p>
                <a href="https://www.instagram.com/truekeamas" target="_blank" rel="noopener noreferrer" className="l-footer-ig">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  @truekeamas
                </a>
              </div>

              <div className="l-footer-col">
                <h5>Plataforma</h5>
                <a href="#vitrina" onClick={loginGate}>Explorar publicaciones</a>
                <a href="#como-funciona">¿Cómo funciona?</a>
                <a href="#" onClick={e => { e.preventDefault(); loginGate(); }}>Publicar gratis</a>
                <a href="#" onClick={e => { e.preventDefault(); loginGate(); }}>Mis favoritos</a>
              </div>

              <div className="l-footer-col">
                <h5>Empresa</h5>
                <a href="#sobre-nosotros">Sobre nosotros</a>
                <a href="https://www.instagram.com/truekeamas" target="_blank" rel="noopener noreferrer">Contacto</a>
                <a href="/privacidad">Política de privacidad</a>
                <a href="/terminos">Términos de uso</a>
              </div>

            </div>
            <div className="l-footer-bottom">
              <span>© 2026 Truekeamas · Plataforma de trueque digital en Chile</span>
              <span>Hecho con ❤️ en Chile 🇨🇱</span>
            </div>
          </div>
        </footer>

      </div>

      <Modal />
      <Toast />
    </>
  );
}
