'use client';
import { useApp } from '@/context/AppContext';

export default function CartModal() {
  const { products, saved, toggleSave, doMatch, openModal } = useApp();

  const savedProducts = products.filter(p => saved.includes(p.id));

  if (savedProducts.length === 0) {
    return (
      <div className="nb">
        <strong>Sin guardados</strong><br />
        Guarda publicaciones con el botón 🤍 para verlas aquí.
      </div>
    );
  }

  return (
    <div className="ml">
      {savedProducts.map(p => (
        <div key={p.id} className="mk">
          <div className="mke">
            {p.photos?.[0] ? <img src={p.photos[0]} alt={p.title} /> : (p.emoji || '📦')}
          </div>
          <div className="mki">
            <div className="mkt">{p.title}</div>
            <div className="mks">por {p.owner || 'Usuario'} · {p.location || ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button className="btn bo bsm" onClick={() => toggleSave(p.id)}>🗑️</button>
            <button className="btn bv bsm" onClick={() => doMatch(p.id, (mid, prod) => openModal({ type: 'chat', mid, prod }))}>🤝 Match</button>
          </div>
        </div>
      ))}
    </div>
  );
}
