'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function AdminModal() {
  const { products, isAdmin, blockProduct, unblockProduct, showToast, currentUser } = useApp();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  if (!isAdmin) {
    return <div className="nb nbd">Acceso restringido. Solo administradores.</div>;
  }

  const visible = products.filter(p => {
    if (p.status === 'deleted') return false;
    if (filter === 'active') return p.status === 'active';
    if (filter === 'blocked') return p.status === 'blocked';
    const q = search.toLowerCase();
    if (q) return [p.title, p.owner, p.category].join(' ').toLowerCase().includes(q);
    return true;
  });

  const blocked = products.filter(p => p.status === 'blocked').length;
  const active = products.filter(p => p.status === 'active').length;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <div className="admin-stat">
          <strong>{active}</strong><span>Publicaciones activas</span>
        </div>
        <div className="admin-stat admin-stat--blocked">
          <strong>{blocked}</strong><span>Bloqueadas</span>
        </div>
        <div className="admin-stat">
          <strong>{products.length}</strong><span>Total</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          className="admin-search"
          type="text"
          placeholder="Buscar por título, usuario, categoría..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="fs" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">Todas</option>
          <option value="active">Activas</option>
          <option value="blocked">Bloqueadas</option>
        </select>
      </div>

      <div className="admin-list">
        {visible.length === 0 && (
          <div className="es"><span className="ei">📭</span><p>Sin publicaciones en esta vista.</p></div>
        )}
        {visible.map(p => (
          <div key={p.id} className={`admin-row${p.status === 'blocked' ? ' admin-row--blocked' : ''}`}>
            <div className="admin-row-img">
              {p.photos?.[0] ? <img src={p.photos[0]} alt={p.title} /> : <span>{p.emoji || '📦'}</span>}
            </div>
            <div className="admin-row-info">
              <div className="admin-row-title">{p.title}</div>
              <div className="admin-row-meta">
                <span className="cv" style={{ padding: '2px 7px', borderRadius: 5, fontSize: 11 }}>{p.category}</span>
                {p.subcategory && <span style={{ color: 'var(--mu)', fontSize: 11 }}>{p.subcategory}</span>}
                · por <strong>{p.owner}</strong> · {p.region || 'Sin región'}
              </div>
              {p.status === 'blocked' && (
                <div style={{ fontSize: 11, color: 'var(--dg)', marginTop: 3 }}>🚫 Bloqueada</div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
              {p.status === 'blocked' ? (
                <button className="btn bv bsm" onClick={() => unblockProduct(p.id)}>✅ Restaurar</button>
              ) : (
                <button className="btn bd2 bsm" onClick={() => {
                  if (confirm(`¿Bloquear "${p.title}"? No será visible para otros usuarios.`)) {
                    blockProduct(p.id);
                  }
                }}>🚫 Bloquear</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
