'use client';
import { useApp } from '@/context/AppContext';

export default function CartModal() {
  const { products, saved, toggleLike, openModal } = useApp();
  const savedProducts = products.filter(p => saved.includes(p.id));
  if (!savedProducts.length) return <div className="nb">Dale ❤️ a las publicaciones que te gusten para verlas aquí.</div>;
  return (
    <div className="ml">
      {savedProducts.map(p => (
        <div key={p.id} className="mk">
          <div className="mke">{p.photos?.[0] ? <img src={p.photos[0]} alt={p.title} /> : (p.emoji || '📦')}</div>
          <div className="mki"><div className="mkt">{p.title}</div><div className="mks">{p.region || p.location || 'Chile'}</div></div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button className="btn bo bsm" onClick={() => toggleLike(p.id)} title="Quitar de favoritos">🗑️</button>
            <button className="btn bv bsm" onClick={() => openModal({ type: 'match_proposal', productId: p.id })}>🤝 Proponer</button>
          </div>
        </div>
      ))}
    </div>
  );
}
