'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useApp, CATS } from '@/context/AppContext';
import { optimizeCloudinaryUrl } from '@/lib/firebase';

/* ── Helpers ─────────────────────────────────────────────── */
function fmtP(v) { return v ? '$' + Number(v).toLocaleString('es-CL') : null; }
function fmtNum(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K';
  return n.toString();
}

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

/* ── LandingCard ─────────────────────────────────────────── */
function LandingCard({ p, onLoginGate, onDetail }) {
  const photos = p.photos || [];
  const badge  = getActionBadge(p);
  const price  = fmtP(p.price);

  return (
    <article className="lp-card" onClick={onDetail || onLoginGate}>
      <div className="lp-card-img">
        {photos[0]
          ? <Image
              src={optimizeCloudinaryUrl(photos[0], 400)}
              alt={p.title} fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="lp-card-img-fill"
              unoptimized
            />
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

/* ── Main component ──────────────────────────────────────── */
export default function LandingPage() {
  const {
    products, stats, searchQuery, setSearchQuery,
    openModal, activeCategory, setActiveCategory,
  } = useApp();

  const [sortBy,    setSortBy]    = useState('likes');
  const [menuOpen,  setMenuOpen]  = useState(false);

  const activeProducts    = products.filter(p => p.status === 'active');
  const allCount          = activeProducts.length;
  const totalLikes        = activeProducts.reduce((s, p) => s + (p.likes || 0), 0);

  // Estadísticas reales
  const userCount         = typeof stats.users === 'number' ? stats.users : null;
  const completedMatches  = stats.completedMatches || 0;
  const itemsRescued      = completedMatches * 2;
  const co2Saved          = completedMatches * 3; // kg

  // Categorías rápidas para filtrar (Láminas primero)
  const QUICK_CATS = [
    { n: 'all',              e: '🔄', label: 'Todo' },
    { n: 'Láminas',          e: '⚽', label: 'Láminas', seasonal: true },
    { n: 'Tecnología',       e: '📱', label: 'Tecnología' },
    { n: 'Moda y Vestuario', e: '👗', label: 'Moda' },
    { n: 'Hogar',            e: '🛋️', label: 'Hogar' },
    { n: 'Deportes',         e: '⚽', label: 'Deportes' },
    { n: 'Libros y Educación', e: '📚', label: 'Libros' },
    { n: 'Arte y Coleccionismo', e: '🎨', label: 'Arte' },
    { n: 'Entretenimiento',  e: '🎲', label: 'Entrete...' },
    { n: 'Servicios',        e: '🔧', label: 'Servicios' },
  ];

  const sorted = [...products]
    .filter(p => p.status === 'active')
    .filter(p => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return [p.title, p.category, p.subcategory, p.wants, p.region]
        .join(' ').toLowerCase().includes(q);
    })
    .filter(p => activeCategory === 'all' || p.category === activeCategory)
    .sort((a, b) => {
      if (sortBy === 'likes')  return (b.likes || 0) - (a.likes || 0);
      if (sortBy === 'newest') return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      return 0;
    })
    .slice(0, 24);

  function loginGate() { openModal('auth'); }

  return (
    <div className="landing">

      {/* ══════════════════════════════════════
          HEADER
      ══════════════════════════════════════ */}
      <header className="lh">
        <a className="lh-brand" href="#">
          <Image src="/favicon-96x96.png" alt="Truekeamas" width={38} height={38} style={{ objectFit: 'contain' }} />
          <span className="lh-name">truekea<span>mas</span></span>
        </a>
        <nav className={`lh-nav${menuOpen ? ' open' : ''}`}>
          <a href="#como-funciona" className="lh-link" onClick={() => setMenuOpen(false)}>¿Cómo funciona?</a>
          <a href="#vitrina"       className="lh-link" onClick={() => setMenuOpen(false)}>Explorar</a>
          <a href="/privacidad"    className="lh-link" onClick={() => setMenuOpen(false)}>Privacidad</a>
          <button className="btn bo bsm" onClick={() => { setMenuOpen(false); openModal('auth'); }}>Iniciar sesión</button>
          <button className="btn bv bsm" onClick={() => { setMenuOpen(false); openModal('auth'); }}>Registrarse</button>
        </nav>
        <button className="lh-burger" onClick={() => setMenuOpen(o => !o)} aria-label="Menú">
          <span /><span /><span />
        </button>
      </header>

      {/* ══════════════════════════════════════
          HERO — dark navy + Truki ciudad
      ══════════════════════════════════════ */}
      <section className="l-hero" id="inicio">

        {/* Truki ocupa toda la mitad derecha, como fondo */}
        <div className="l-hero-truki" aria-hidden="true">
          <Image
            src="/truki-ciudad.webp"
            alt=""
            fill
            priority
            sizes="60vw"
            className="l-hero-truki-img"
          />
        </div>

        {/* Gradiente que protege legibilidad del texto */}
        <div className="l-hero-overlay" />

        {/* Texto encima */}
        <div className="l-hero-content">
          <div className="l-hero-pill">La comunidad de trueque digital de Chile</div>

          <h1 className="l-hero-title">
            Truekea<span className="l-hero-title-green">mas</span>
          </h1>
          <p className="l-hero-tagline">Plataforma de trueque digital en Chile</p>

          <p className="l-hero-sub">
            Intercambia lo que tienes por lo que quieres.<br />
            Sin intermediarios, sin comisiones.
          </p>

          {/* Buscador */}
          <div className="l-hero-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              width="18" height="18" style={{ flexShrink: 0, color: 'rgba(255,255,255,.5)' }}>
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="text"
              placeholder="Busca láminas, celulares, ropa…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => document.getElementById('vitrina')?.scrollIntoView({ behavior: 'smooth' })}
            />
            {searchQuery && (
              <button className="l-search-clear" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          {/* CTAs */}
          <div className="l-hero-ctas">
            <button
              className="btn bv"
              style={{ fontSize: 15, padding: '13px 28px' }}
              onClick={loginGate}
            >
              Publicar gratis
            </button>
            <button
              className="btn"
              style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,.3)', fontSize: 15, padding: '13px 28px' }}
              onClick={loginGate}
            >
              Explorar vitrina →
            </button>
          </div>

          {/* Stats — plataforma + sostenibilidad */}
          <div className="l-hero-stats">
            {/* Grupo: plataforma */}
            <div className="l-stat">
              <strong>{userCount !== null ? `${fmtNum(userCount)}+` : '…'}</strong>
              <span>Usuarios</span>
            </div>
            <div className="l-stat">
              <strong>{fmtNum(allCount)}</strong>
              <span>Publicaciones</span>
            </div>
            <div className="l-stat">
              <strong>{fmtNum(completedMatches)}</strong>
              <span>Trueques</span>
            </div>

            {/* Separador visual */}
            <div className="l-stats-sep" />

            {/* Grupo: sostenibilidad */}
            <div className="l-stat l-stat--eco">
              <strong>♻️ {fmtNum(itemsRescued)}</strong>
              <span>Obj. rescatados</span>
            </div>
            <div className="l-stat l-stat--eco">
              <strong>🌱 {fmtNum(co2Saved)}kg</strong>
              <span>CO₂ ahorrado</span>
            </div>
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════
          MODO MUNDIALERO — sección festiva
      ══════════════════════════════════════ */}
      <section className="l-mundialero" id="mundialero">
        <div className="l-mundialero-glow" />
        <div className="l-container l-mundialero-inner">

          {/* Truki mundialero */}
          <div className="l-mundialero-img-wrap">
            <Image
              src="/truki-mundialero.webp"
              alt="Truki Mundialero"
              width={320}
              height={380}
              className="l-mundialero-img"
            />
          </div>

          {/* Texto */}
          <div className="l-mundialero-content">
            <div className="l-mundialero-badge">⚽ MODO MUNDIALERO ACTIVADO</div>
            <h2 className="l-mundialero-title">
              ¿Te faltan láminas<br />para el álbum?
            </h2>
            <p className="l-mundialero-sub">
              Intercambia tus repetidas, consigue las que te faltan y completa tu álbum
              antes que nadie. La comunidad Truekeamas ya está en modo mundialero. 🏆
            </p>
            <div className="l-mundialero-ctas">
              <button
                className="btn l-mundialero-btn-primary"
                onClick={() => {
                  setActiveCategory('Láminas');
                  document.getElementById('vitrina')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                ⚽ Ver láminas disponibles
              </button>
              <button
                className="btn l-mundialero-btn-secondary"
                onClick={loginGate}
              >
                Publicar mis repetidas
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════
          CATEGORÍAS — filtros rápidos
      ══════════════════════════════════════ */}
      <div className="l-cats-bar" id="vitrina">
        <div className="l-container">
          <div className="l-cats-scroll">
            {QUICK_CATS.map(c => (
              <button
                key={c.n}
                className={`l-cat-pill${activeCategory === c.n ? ' active' : ''}${c.seasonal ? ' seasonal' : ''}`}
                onClick={() => setActiveCategory(c.n)}
              >
                <span className="l-cat-pill-emoji">{c.e}</span>
                {c.label}
                {c.seasonal && <span className="l-cat-pill-new">NUEVO</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          PRODUCTS GRID
      ══════════════════════════════════════ */}
      <section className="l-products-section">
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
              <button
                className={`l-sort-btn${sortBy === 'likes'  ? ' active' : ''}`}
                onClick={() => setSortBy('likes')}
              >❤️ Populares</button>
              <button
                className={`l-sort-btn${sortBy === 'newest' ? ' active' : ''}`}
                onClick={() => setSortBy('newest')}
              >🆕 Recientes</button>
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
                <button
                  className="btn bv bsm"
                  onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                >Ver todas</button>
              </div>
            ) : sorted.map(p => (
              <LandingCard
                key={p.id}
                p={p}
                onLoginGate={loginGate}
                onDetail={() => openModal({ type: 'product_detail', productId: p.id })}
              />
            ))}
          </div>

          {allCount > 24 && (
            <div className="l-grid-more">
              <button
                className="btn bv"
                style={{ padding: '12px 36px' }}
                onClick={loginGate}
              >
                Ver las {allCount} publicaciones →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════
          ¿QUÉ PUEDES HACER?
      ══════════════════════════════════════ */}
      <section className="l-actions" id="como-funciona">
        <div className="l-container">
          <h2 className="l-actions-title">
            ¿Qué puedes hacer en <span>Truekeamas</span>? 🌿
          </h2>

          <div className="l-action-grid">

            {/* INTERCAMBIA */}
            <div className="l-action-card l-action-card--swap">
              <Image src="/card-intercambia.webp" alt="Intercambia productos" fill className="l-action-img" sizes="(max-width:768px) 90vw, 25vw" />
              <div className="l-action-overlay l-action-overlay--swap" />
              <div className="l-action-content">
                <div className="l-action-card-top">
                  <div className="l-action-icon l-action-icon--swap">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 16s0-6 6-6h16"/><path d="m19 13 4 3-4 3"/><path d="M23 8S23 2 17 2H1"/><path d="m5 5-4 3 4 3"/>
                    </svg>
                  </div>
                  <div>
                    <div className="l-action-label">INTERCAMBIA</div>
                    <div className="l-action-sublabel">Trueques que conectan</div>
                  </div>
                </div>
                <div className="l-action-bottom">
                  <p className="l-action-desc">Intercambia lo que ya no usas por lo que necesitas. Fácil, justo y sustentable.</p>
                  <button className="l-action-btn l-action-btn--swap" onClick={loginGate}>Quiero intercambiar</button>
                </div>
              </div>
            </div>

            {/* VENDE */}
            <div className="l-action-card l-action-card--sell">
              <Image src="/card-vende.webp" alt="Vende tus productos" fill className="l-action-img" sizes="(max-width:768px) 90vw, 25vw" />
              <div className="l-action-overlay l-action-overlay--sell" />
              <div className="l-action-content">
                <div className="l-action-card-top">
                  <div className="l-action-icon l-action-icon--sell">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                  </div>
                  <div>
                    <div className="l-action-label">VENDE</div>
                    <div className="l-action-sublabel">Convierte en oportunidad</div>
                  </div>
                </div>
                <div className="l-action-bottom">
                  <p className="l-action-desc">Vende rápido y seguro a personas cerca de ti y gana dinero extra.</p>
                  <button className="l-action-btn l-action-btn--sell" onClick={loginGate}>Quiero vender</button>
                </div>
              </div>
            </div>

            {/* DONA */}
            <div className="l-action-card l-action-card--donate">
              <Image src="/card-dona.webp" alt="Dona artículos" fill className="l-action-img" sizes="(max-width:768px) 90vw, 25vw" />
              <div className="l-action-overlay l-action-overlay--donate" />
              <div className="l-action-content">
                <div className="l-action-card-top">
                  <div className="l-action-icon l-action-icon--donate">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="l-action-label">DONA</div>
                    <div className="l-action-sublabel">Dale una segunda vida</div>
                  </div>
                </div>
                <div className="l-action-bottom">
                  <p className="l-action-desc">Dona a quienes más lo necesitan y sé parte del cambio.</p>
                  <button className="l-action-btn l-action-btn--donate" onClick={loginGate}>Quiero donar</button>
                </div>
              </div>
            </div>

            {/* IMPACTA */}
            <div className="l-action-card l-action-card--impact">
              <Image src="/card-impacta.webp" alt="Impacto ambiental" fill className="l-action-img" sizes="(max-width:768px) 90vw, 25vw" />
              <div className="l-action-overlay l-action-overlay--impact" />
              <div className="l-action-content">
                <div className="l-action-card-top">
                  <div className="l-action-icon l-action-icon--impact">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22V12"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><path d="M8 6a4 4 0 0 1 8 0c0 4-4 6-4 6S8 10 8 6z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="l-action-label">IMPACTA</div>
                    <div className="l-action-sublabel">Juntos por el planeta</div>
                  </div>
                </div>
                <div className="l-action-bottom">
                  <p className="l-action-desc">Cada acción en <strong>Truekeamas</strong> reduce residuos, ahorra recursos y disminuye CO₂.</p>
                  <button className="l-action-btn l-action-btn--impact" onClick={loginGate}>Ver mi impacto</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════ */}
      <section className="l-cta">
        <div className="l-container">
          <div className="l-cta-inner">
            <div>
              <h2>Empieza hoy gratis</h2>
              <p>Únete a miles de chilenos que ya intercambian en Truekeamas</p>
            </div>
            <button
              className="btn"
              style={{ background: '#fff', color: 'var(--v)', fontWeight: 800, fontSize: 15, padding: '14px 32px', borderRadius: 12, whiteSpace: 'nowrap' }}
              onClick={loginGate}
            >
              Crear cuenta gratis →
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
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
              <a href="#vitrina"  onClick={loginGate}>Explorar publicaciones</a>
              <a href="#como-funciona">¿Cómo funciona?</a>
              <a href="#" onClick={e => { e.preventDefault(); loginGate(); }}>Publicar gratis</a>
              <a href="#" onClick={e => { e.preventDefault(); loginGate(); }}>Mis favoritos</a>
            </div>

            <div className="l-footer-col">
              <h5>Empresa</h5>
              <a href="#como-funciona">¿Cómo funciona?</a>
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
  );
}
