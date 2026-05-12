'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

function fmtP(v) { return v ? '$' + Number(v).toLocaleString('es-CL') : 'Solo trueque'; }

export default function ProductCard({ product: p }) {
  const { currentUser, saved, toggleSave, openModal } = useApp();
  const [imgIdx, setImgIdx] = useState(0);
  const own    = currentUser && p.ownerId === currentUser.uid;
  const photos = p.photos || [];

  function handleProposal() {
    if (!currentUser) { openModal('auth'); return; }
    openModal({ type: 'match_proposal', productId: p.id });
  }

  return (
    <article className="pk">
      {photos.length > 0 ? (
        <div className="gal">
          <img className="gm" src={photos[imgIdx]} alt={p.title} loading="lazy" />
          {photos.length > 1 && (
            <>
              <button className="gn gp" onClick={() => setImgIdx(i => (i - 1 + photos.length) % photos.length)}>‹</button>
              <button className="gn gx" onClick={() => setImgIdx(i => (i + 1) % photos.length)}>›</button>
              <div className="gd">{photos.map((_, i) => <span key={i} className={`gdt${i === imgIdx ? ' active' : ''}`} onClick={() => setImgIdx(i)} />)}</div>
            </>
          )}
        </div>
      ) : <div className="pi">{p.emoji || '📦'}</div>}

      <div className="pb2">
        <div className="ch">
          <span className="cl">Trueque</span>
          {p.buy   && <span className="cv">Compra</span>}
          {p.mixed && <span className="ca">Mixto</span>}
        </div>
        <h4>{p.title}</h4>
        {/* Solo nivel y región, sin nombre por privacidad */}
        <div className="pm">{p.level || 'Nuevo'} · {p.region || p.location || 'Chile'}</div>
        <div className="pp">{fmtP(p.price)}</div>
        <div className="pw">Busca: {p.wants || ''}</div>
        <div className="pak">
          {own ? (
            <span style={{ fontSize: 11, color: 'var(--mu)', fontStyle: 'italic', gridColumn: '1/-1' }}>✏️ Tu publicación</span>
          ) : (
            <>
              <button className="btn bo bsm" onClick={() => toggleSave(p.id)}>
                {saved.includes(p.id) ? '❤️ Guardado' : '🤍 Guardar'}
              </button>
              <button className="btn bv bsm" onClick={handleProposal}>
                🤝 Proponer trueque
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
