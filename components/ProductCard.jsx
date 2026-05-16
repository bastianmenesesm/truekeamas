'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { optimizeCloudinaryUrl } from '@/lib/firebase';

function ShareButton({ productId, title }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/p/${productId}`
    : `/p/${productId}`;

  function handleShare(e) {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <button className="share-btn" onClick={handleShare} title="Compartir publicación">
      {copied
        ? <><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copiado</>
        : <><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Compartir</>
      }
    </button>
  );
}

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

/* ── Skeleton loader ──────────────────────── */
export function ProductCardSkeleton() {
  return (
    <article className="pk pk-sk">
      <div className="pk-img-wrap">
        <div className="sk sk-block" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="pk-body">
        <div className="sk sk-block" style={{ height: 17, width: '78%', marginBottom: 10 }} />
        <div className="sk sk-block" style={{ height: 12, width: '45%', marginBottom: 8 }} />
        <div className="sk sk-block" style={{ height: 12, width: '62%', marginBottom: 18 }} />
        <div className="pk-footer" style={{ pointerEvents: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="sk sk-block" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
            <div className="sk sk-block" style={{ height: 12, width: 72 }} />
          </div>
          <div className="sk sk-block" style={{ height: 30, width: 76, borderRadius: 8 }} />
        </div>
      </div>
    </article>
  );
}

export default function ProductCard({ product: p }) {
  const { currentUser, saved, toggleLike, openModal } = useApp();
  const [imgIdx, setImgIdx] = useState(0);
  const own    = currentUser && p.ownerId === currentUser.uid;
  const photos = p.photos || [];
  const liked  = saved.includes(p.id);
  const badge  = getActionBadge(p);
  const price  = fmtP(p.price);
  const initial = (p.ownerName || p.level || 'U').charAt(0).toUpperCase();

  function handleProposal(e) {
    e.stopPropagation();
    if (!currentUser) { openModal('auth'); return; }
    openModal({ type: 'match_proposal', productId: p.id });
  }

  function handleDetail() {
    openModal({ type: 'product_detail', productId: p.id });
  }

  const wantsText = p.wants
    ? (p.wants.length > 32 ? p.wants.slice(0, 32) + '…' : p.wants)
    : null;

  return (
    <article className="pk">
      {/* ── Image (clickable → detail) ── */}
      <div className="pk-img-wrap" onClick={handleDetail} style={{ cursor: 'pointer' }}>
        {photos.length > 0 ? (
          <>
            <Image
              src={optimizeCloudinaryUrl(photos[imgIdx], 400)}
              alt={p.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="pk-img-fill"
              unoptimized
            />
            {photos.length > 1 && (
              <>
                <button
                  className="gn gp"
                  onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + photos.length) % photos.length); }}
                >‹</button>
                <button
                  className="gn gx"
                  onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % photos.length); }}
                >›</button>
                <div className="gd">
                  {photos.map((_, i) => (
                    <span key={i} className={`gdt${i === imgIdx ? ' active' : ''}`} onClick={() => setImgIdx(i)} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="pi">{p.emoji || '📦'}</div>
        )}

        {/* Action badge — top left */}
        <span className={`pk-badge ${badge.cls}`}>{badge.label}</span>

        {/* Like / save — top right */}
        {!own && (
          <button
            className={`pk-like-btn${liked ? ' liked' : ''}`}
            onClick={e => { e.stopPropagation(); toggleLike(p.id); }}
            title={liked ? 'Quitar me gusta' : 'Me gusta'}
          >
            <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {(p.likes || 0) > 0 && <span className="pk-like-count">{p.likes}</span>}
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div className="pk-body">
        <h4 className="pk-title" onClick={handleDetail} style={{ cursor: 'pointer' }}>{p.title}</h4>

        <div className="pk-location">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {p.commune ? `${p.commune}, ${p.region || 'Chile'}` : (p.region || p.location || 'Chile')}
        </div>

        {wantsText && (
          <div className="pk-wants">🔄 {wantsText}</div>
        )}

        {price && <div className="pk-price">{price}</div>}

        {/* ── Footer: user + CTA ── */}
        <div className="pk-footer">
          <button
            className="pk-user"
            onClick={e => { e.stopPropagation(); openModal({ type: 'user_profile', userId: p.ownerId }); }}
            title={`Ver perfil de ${p.ownerName || p.owner || 'usuario'}`}
          >
            <div className="pk-avatar-wrap">
              {p.ownerAvatarUrl
                ? <Image src={p.ownerAvatarUrl} alt={p.ownerName || 'Avatar'} width={32} height={32} className="pk-avatar pk-avatar--img" unoptimized />
                : <div className="pk-avatar">{initial}</div>
              }
              {p.ownerVerified && (
                <span className="pk-verified-dot" title="Usuario verificado">✓</span>
              )}
            </div>
            <div className="pk-user-info">
              <span className="pk-level">{p.ownerName || p.owner || 'Usuario'}</span>
              {p.ownerRatingAvg > 0 && (
                <span className="pk-rating-mini">
                  ⭐ {Number(p.ownerRatingAvg).toFixed(1)}
                </span>
              )}
            </div>
          </button>

          {own ? (
            <span className="pk-own-tag">✏️ Tuya</span>
          ) : (
            <button className="pk-match-btn" onClick={handleProposal}>
              🤝 Match
            </button>
          )}
        </div>

        {/* Share + Report */}
        <div className="pk-bottom-row">
          <ShareButton productId={p.id} title={p.title} />
          {!own && (
            <button
              className="report-btn"
              onClick={e => { e.stopPropagation(); openModal({ type: 'report', productId: p.id }); }}
              title="Denunciar publicación"
            >
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
              Denunciar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
