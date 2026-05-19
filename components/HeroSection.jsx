'use client';
import { useApp } from '@/context/AppContext';

export default function HeroSection() {
  const { products, openModal, searchQuery, setSearchQuery } = useApp();
  const visibleProducts = products.filter(p => p.status !== 'blocked' && p.status !== 'sold');
  const totalLikes = visibleProducts.reduce((sum, p) => sum + (p.likes || 0), 0);

  return (
    <section className="hero-compact">
      {/* Search bar */}
      <div className="hc-search-wrap">
        <div className="hc-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" style={{ flexShrink: 0, color: 'var(--mu)' }}>
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="text"
            placeholder="Busca celulares, ropa, libros, plantas…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => document.getElementById('vitrina')?.scrollIntoView({ behavior: 'smooth' })}
          />
          {searchQuery && (
            <button style={{ color: 'var(--mu)', padding: '2px 6px', borderRadius: 6 }} onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>
        <button className="btn bv" data-tour="publish" style={{ padding: '10px 20px', flexShrink: 0 }} onClick={() => openModal('publish')}>
          + Publicar
        </button>
      </div>

      {/* Stats strip */}
      <div className="hc-stats">
        <span>📦 <strong>{visibleProducts.length}</strong> Publicaciones</span>
        <span>❤️ <strong>{totalLikes}</strong> Likes</span>
      </div>
    </section>
  );
}
