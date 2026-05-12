'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { optimizeCloudinaryUrl } from '@/lib/firebase';

function fmtP(v) { return v ? '$' + Number(v).toLocaleString('es-CL') : null; }

const ACTION_BADGE = {
  vender:  { label: 'Venta',    cls: 'cv' },
  cambiar: { label: 'Trueque',  cls: 'cl' },
  mixto:   { label: 'Mixto',    cls: 'ca' },
  donar:   { label: 'Donación', cls: 'cd-badge' },
};

function getActionBadge(p) {
  if (p.action) return ACTION_BADGE[p.action] || ACTION_BADGE.cambiar;
  if (p.donate) return ACTION_BADGE.donar;
  if (p.buy && p.barter) return ACTION_BADGE.mixto;
  if (p.buy) return ACTION_BADGE.vender;
  return ACTION_BADGE.cambiar;
}

export default function ProductCard({ product: p }) {
  const { currentUser, saved, toggleLike, openModal } = useApp();
  const [imgIdx, setImgIdx] = useState(0);
  const own    = currentUser && p.ownerId === currentUser.uid;
  const photos = p.photos || [];
  const liked  = saved.includes(p.id);
  const badge  = getActionBadge(p);
  const price  = fmtP(p.price);

  function handleProposal() {
    if (!currentUser) { openModal('auth'); return; }
    openModal({ type: 'match_proposal', productId: p.id });
  }

  return (
    <article className="pk">
      <div className="pk-img-wrap">
        {photos.length > 0 ? (
          <div className="gal">
            <img className="gm" src={optimizeCloudinaryUrl(photos[imgIdx], 600)} alt={p.title} loading="lazy" />
            {photos.length > 1 && (
              <>
                <button className="gn gp" onClick={() => setImgIdx(i => (i - 1 + photos.length) % photos.length)}>‹</button>
                <button className="gn gx" onClick={() => setImgIdx(i => (i + 1) % photos.length)}>›</button>
                <div className="gd">{photos.map((_, i) => <span key={i} className={`gdt${i === imgIdx ? ' active' : ''}`} onClick={() => setImgIdx(i)} />)}</div>
              </>
            )}
          </div>
        ) : <div className="pi">{p.emoji || '📦'}</div>}

        {/* Like button overlay — top right */}
        {!own && (
          <button
            className={`pk-like-btn${liked ? ' liked' : ''}`}
            onClick={() => toggleLike(p.id)}
            title={liked ? 'Quitar me gusta' : 'Me gusta'}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {(p.likes || 0) > 0 && <span>{p.likes}</span>}
          </button>
        )}
      </div>

      <div className="pb2">
        <div className="ch" style={{ marginBottom: 6 }}>
          <span className={badge.cls}>{badge.label}</span>
          {p.condition && <span style={{ fontSize: 11, color: 'var(--mu)', background: 'var(--sf)', padding: '2px 7px', borderRadius: 5 }}>{p.condition.split(' ')[0]}</span>}
        </div>
        <h4>{p.title}</h4>
        <div className="pm">{p.level || 'Nuevo'} · {p.region || p.location || 'Chile'}</div>
        {price && <div className="pp">{price}</div>}
        {p.wants && <div className="pw">Busca: {p.wants}</div>}

        <div className="pak">
          {own ? (
            <span style={{ fontSize: 11, color: 'var(--mu)', fontStyle: 'italic', gridColumn: '1/-1' }}>✏️ Tu publicación</span>
          ) : (
            <>
              <button className={`btn bsm pk-like-row${liked ? ' liked' : ''}`} onClick={() => toggleLike(p.id)}>
                {liked ? '❤️ Te gusta' : '🤍 Me gusta'}
              </button>
              <button className="btn bv bsm" onClick={handleProposal}>
                🤝 Proponer
              </button>
            </>
          )}
        </div>

        {!own && (
          <div style={{ paddingTop: 8, borderTop: '1px solid var(--ln)', marginTop: 4 }}>
            <button
              className="report-btn"
              onClick={() => openModal({ type: 'report', productId: p.id })}
              title="Denunciar esta publicación"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
              Denunciar
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
