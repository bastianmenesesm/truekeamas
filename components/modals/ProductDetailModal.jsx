'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { optimizeCloudinaryUrl, db } from '@/lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://truekeamas.cl';

function fmtP(v) { return v ? '$' + Number(v).toLocaleString('es-CL') : null; }
function fmtDate(ts) {
  if (!ts?.seconds) return null;
  return new Date(ts.seconds * 1000).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ACTION_LABEL = {
  vender:  { label: 'Venta',    cls: 'cv' },
  cambiar: { label: 'Trueque',  cls: 'cl' },
  mixto:   { label: 'Mixto',    cls: 'ca' },
  donar:   { label: 'Donación', cls: 'cd-badge' },
};
function getBadge(p) {
  if (p.action) return ACTION_LABEL[p.action] || ACTION_LABEL.cambiar;
  if (p.donate) return ACTION_LABEL.donar;
  if (p.buy && p.barter) return ACTION_LABEL.mixto;
  if (p.buy) return ACTION_LABEL.vender;
  return ACTION_LABEL.cambiar;
}

export default function ProductDetailModal({ productId }) {
  const { products, currentUser, saved, toggleLike, openModal, closeModal } = useApp();
  const [imgIdx,  setImgIdx]  = useState(0);
  const [copied,  setCopied]  = useState(false);

  const p = products.find(x => x.id === productId);
  if (!p) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--mu)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
      <p>Publicación no encontrada.</p>
    </div>
  );

  // ── Contador de vistas (1 por sesión por producto) ──────────────
  useEffect(() => {
    if (!p?.id) return;
    const key = `tk_viewed_${p.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    updateDoc(doc(db, 'products', p.id), { views: increment(1) }).catch(() => {});
  }, [p?.id]);

  const own    = currentUser && p.ownerId === currentUser.uid;
  const photos = p.photos || [];
  const liked  = saved.includes(p.id);
  const badge  = getBadge(p);
  const price  = fmtP(p.price);
  const date   = fmtDate(p.createdAt);
  const initial = (p.ownerName || p.level || 'U').charAt(0).toUpperCase();

  function handleMatch() {
    if (!currentUser) { closeModal(); setTimeout(() => openModal('auth'), 150); return; }
    closeModal();
    setTimeout(() => openModal({ type: 'match_proposal', productId: p.id }), 150);
  }
  function handleReport() {
    closeModal();
    setTimeout(() => openModal({ type: 'report', productId: p.id }), 150);
  }
  async function handleShare() {
    const url   = `${BASE_URL}/p/${p.id}`;
    const title = p.title || 'Publicación en Truekeamas';
    const text  = [p.description?.slice(0, 80), p.region].filter(Boolean).join(' · ');
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      prompt('Copia el enlace:', url);
    }
  }

  return (
    <div className="pd-wrap">
      <div className="pd-layout">

        {/* ── LEFT: Gallery ── */}
        <div className="pd-gallery">
          <div className="pd-main-img">
            {photos.length > 0 ? (
              <>
                <Image
                  src={optimizeCloudinaryUrl(photos[imgIdx], 800)}
                  alt={p.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="pd-img-fill"
                  unoptimized
                  priority={imgIdx === 0}
                />
                {photos.length > 1 && (
                  <>
                    <button className="pd-nav pd-nav-l" onClick={() => setImgIdx(i => (i - 1 + photos.length) % photos.length)}>‹</button>
                    <button className="pd-nav pd-nav-r" onClick={() => setImgIdx(i => (i + 1) % photos.length)}>›</button>
                  </>
                )}
                {/* Badge on image */}
                <span className={`pd-img-badge ${badge.cls}`}>{badge.label}</span>
              </>
            ) : (
              <div className="pd-main-emoji">{p.emoji || '📦'}</div>
            )}
          </div>

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div className="pd-thumbs">
              {photos.map((ph, i) => (
                <button
                  key={i}
                  className={`pd-thumb${i === imgIdx ? ' active' : ''}`}
                  onClick={() => setImgIdx(i)}
                >
                  <Image src={optimizeCloudinaryUrl(ph, 120)} alt={`foto ${i + 1}`} width={80} height={80} style={{ objectFit: 'cover', width: '100%', height: '100%' }} unoptimized />
                </button>
              ))}
            </div>
          )}

          {/* Meta: date + location */}
          <div className="pd-meta-row">
            {date && (
              <span className="pd-meta-item">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {date}
              </span>
            )}
            {(p.region || p.location) && (
              <span className="pd-meta-item">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {p.region || p.location}
              </span>
            )}
            {p.condition && (
              <span className="pd-condition">{p.condition.split('(')[0].trim()}</span>
            )}
          </div>
        </div>

        {/* ── RIGHT: Info ── */}
        <div className="pd-info">

          {/* Title & price */}
          <div className="pd-header">
            <h2 className="pd-title">{p.title}</h2>
            {price && <div className="pd-price">{price}</div>}
            {!price && p.action === 'donar' && (
              <div className="pd-price-free">Donación gratuita</div>
            )}
          </div>

          {/* "Busca a cambio" */}
          {p.wants && (
            <div className="pd-wants-box">
              <div className="pd-wants-label">🔄 Busca a cambio</div>
              <div className="pd-wants-text">{p.wants}</div>
            </div>
          )}

          {/* Details */}
          <div className="pd-details">
            <div className="pd-details-title">
              Detalles
              <span className="pd-details-line" />
            </div>
            <div className="pd-detail-rows">
              {p.category && (
                <div className="pd-detail-row">
                  <span className="pd-detail-key">Categoría</span>
                  <span className="pd-detail-val">{p.category}</span>
                </div>
              )}
              {p.subcategory && (
                <div className="pd-detail-row">
                  <span className="pd-detail-key">Subcategoría</span>
                  <span className="pd-detail-val">{p.subcategory}</span>
                </div>
              )}
              {p.condition && (
                <div className="pd-detail-row">
                  <span className="pd-detail-key">Estado</span>
                  <span className="pd-detail-val">{p.condition.split('(')[0].trim()}</span>
                </div>
              )}
              {p.brand && (
                <div className="pd-detail-row">
                  <span className="pd-detail-key">Marca</span>
                  <span className="pd-detail-val">{p.brand}</span>
                </div>
              )}
              {p.model && (
                <div className="pd-detail-row">
                  <span className="pd-detail-key">Modelo</span>
                  <span className="pd-detail-val">{p.model}</span>
                </div>
              )}
              {p.size && (
                <div className="pd-detail-row">
                  <span className="pd-detail-key">Talla / Tamaño</span>
                  <span className="pd-detail-val">{p.size}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {p.description && (
            <div className="pd-desc">
              <p>{p.description}</p>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--ln)', margin: '4px 0' }} />

          {/* Seller card */}
          <div className="pd-seller">
            <div className="pd-seller-avatar">{initial}</div>
            <div className="pd-seller-info">
              <div className="pd-seller-name">
                {own ? 'Tu publicación' : 'Publicado por'}
              </div>
              <div className="pd-seller-level">
                <span className={`pd-level-badge pd-level-${(p.level || 'nuevo').toLowerCase().replace(' ', '-')}`}>
                  {p.level || 'Nuevo'}
                </span>
              </div>
            </div>
            <div className="pd-stats-row">
              {(p.likes || 0) > 0 && (
                <span className="pd-stat">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" stroke="none">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  {p.likes}
                </span>
              )}
              {(p.views || 0) > 0 && (
                <span className="pd-stat">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  {p.views} {p.views === 1 ? 'vista' : 'vistas'}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          {!own ? (
            <div className="pd-actions">
              <button className="btn bv btn-full pd-match-btn" onClick={handleMatch}>
                🤝 Hacer Match
              </button>
              <button
                className={`pd-like-btn${liked ? ' liked' : ''}`}
                onClick={() => toggleLike(p.id)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {liked ? 'Guardado' : 'Guardar'}
              </button>
            </div>
          ) : (
            <div className="pd-actions">
              <button className="btn bo btn-full" onClick={() => { closeModal(); setTimeout(() => openModal('myposts'), 150); }}>
                ✏️ Editar publicación
              </button>
            </div>
          )}

          {/* Share + Report row */}
          <div className="pd-bottom-row">
            <button className="pd-share-btn" onClick={handleShare}>
              {copied ? (
                <>
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  ¡Enlace copiado!
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  Compartir
                </>
              )}
            </button>

            {!own && (
              <button className="report-btn" onClick={handleReport}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                  <line x1="4" y1="22" x2="4" y2="15"/>
                </svg>
                Denunciar publicación
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
