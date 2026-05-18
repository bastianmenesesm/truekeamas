'use client';
import { useState }               from 'react';
import Link                       from 'next/link';
import { useApp }                 from '@/context/AppContext';
import { optimizeCloudinaryUrl }  from '@/lib/firebase';
import Modal  from '@/components/Modal';
import Toast  from '@/components/Toast';

const ACTION_BADGE = {
  vender:  { label: 'Venta',    cls: 'cv' },
  cambiar: { label: 'Trueque',  cls: 'cl' },
  mixto:   { label: 'Mixto',    cls: 'ca' },
  donar:   { label: 'Donacion', cls: 'cd-badge' },
};

function fmtP(v) { return v ? '$' + Number(v).toLocaleString('es-CL') : null; }

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7)  return 'hace ' + days + ' dias';
  if (days < 30) return 'hace ' + Math.floor(days / 7) + ' semanas';
  return 'hace ' + Math.floor(days / 30) + ' meses';
}

function StarRow({ value, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} viewBox="0 0 24 24" width={size} height={size}
          fill={s <= Math.round(value) ? '#F59E0B' : 'none'}
          stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

const CHEVRON_L = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
);
const CHEVRON_R = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>
);

export default function ProductDetailClient({ product: p, owner }) {
  const { currentUser, openModal, toggleLike, saved } = useApp();
  const [imgIdx, setImgIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const photos = p.photos || [];
  const badge  = ACTION_BADGE[p.action] || ACTION_BADGE.cambiar;
  const price  = fmtP(p.price);
  const liked  = saved.includes(p.id);
  const isOwn  = currentUser?.uid === p.ownerId;

  function handleMatch() {
    if (!currentUser) { openModal('auth'); return; }
    openModal({ type: 'match_proposal', productId: p.id });
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: p.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  function handleReport() {
    if (!currentUser) { openModal('auth'); return; }
    openModal({ type: 'report', productId: p.id });
  }

  function handleOwnerClick() {
    openModal({ type: 'user_profile', userId: p.ownerId });
  }

  return (
    <>
      <div style={{ minHeight: '100vh', background: 'var(--sf)', paddingBottom: 64 }}>

        {/* Top nav */}
        <nav style={{ background: 'var(--cd)', borderBottom: '1px solid var(--ln)', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--v)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
            </svg>
            Truekeamas
          </Link>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isOwn && (
              <button onClick={() => toggleLike(p.id)} title={liked ? 'Quitar like' : 'Me gusta'}
                style={{ background: liked ? 'rgba(239,68,68,.1)' : 'var(--sf)', border: '1.5px solid var(--ln)', borderRadius: 8, padding: '6px 12px', fontSize: 13, color: liked ? 'var(--dg)' : 'var(--mu)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {(p.likes || 0) > 0 ? p.likes : ''}
              </button>
            )}
            <button onClick={handleShare}
              style={{ background: 'var(--sf)', border: '1.5px solid var(--ln)', borderRadius: 8, padding: '6px 12px', fontSize: 13, color: 'var(--mu)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              {copied ? (
                <><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--lm)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copiado</>
              ) : (
                <><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Compartir</>
              )}
            </button>
          </div>
        </nav>

        <div style={{ maxWidth: 740, margin: '0 auto', padding: '24px 16px' }}>

          {/* Image gallery */}
          {photos.length > 0 ? (
            <div style={{ marginBottom: 24 }}>
              <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: 'var(--ln)', aspectRatio: '4/3' }}>
                <img src={optimizeCloudinaryUrl(photos[imgIdx], 800)} alt={p.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {photos.length > 1 && (
                  <>
                    <button onClick={() => setImgIdx(i => (i - 1 + photos.length) % photos.length)}
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,.45)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                      {CHEVRON_L}
                    </button>
                    <button onClick={() => setImgIdx(i => (i + 1) % photos.length)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,.45)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                      {CHEVRON_R}
                    </button>
                    <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                      {photos.map((_, i) => (
                        <button key={i} onClick={() => setImgIdx(i)}
                          style={{ width: i === imgIdx ? 20 : 8, height: 8, borderRadius: 4, background: i === imgIdx ? '#fff' : 'rgba(255,255,255,.5)', border: 'none', cursor: 'pointer', padding: 0, transition: 'width .2s' }} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {photos.length > 1 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
                  {photos.map((ph, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      style={{ flexShrink: 0, width: 72, height: 56, borderRadius: 10, overflow: 'hidden', border: i === imgIdx ? '2.5px solid var(--v)' : '2.5px solid transparent', cursor: 'pointer', padding: 0 }}>
                      <img src={optimizeCloudinaryUrl(ph, 150)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: 24, borderRadius: 16, background: 'var(--sf2)', border: '1.5px solid var(--ln)', aspectRatio: '4/3', display: 'grid', placeItems: 'center', fontSize: 72 }}>
              {p.emoji || '\u{1F4E6}'}
            </div>
          )}

          {/* Product header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <span className={'pk-badge ' + badge.cls}>{badge.label}</span>
              <span style={{ fontSize: 12, color: 'var(--mu)', background: 'var(--sf)', border: '1px solid var(--ln)', borderRadius: 6, padding: '2px 8px' }}>{p.category}</span>
              {p.subcategory && <span style={{ fontSize: 12, color: 'var(--mu)', background: 'var(--sf)', border: '1px solid var(--ln)', borderRadius: 6, padding: '2px 8px' }}>{p.subcategory}</span>}
              {p.condition  && <span style={{ fontSize: 12, color: 'var(--mu)', background: 'var(--sf)', border: '1px solid var(--ln)', borderRadius: 6, padding: '2px 8px' }}>{p.condition}</span>}
            </div>
            <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3, marginBottom: 10 }}>
              {p.title}
            </h1>
            {price && <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--v)', marginBottom: 10 }}>{price}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--mu)', fontSize: 13, flexWrap: 'wrap' }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {p.commune ? p.commune + ', ' + (p.region || 'Chile') : (p.region || 'Chile')}
              <span style={{ color: 'var(--ln2)' }}> | </span>
              <span>{timeAgo(p.createdAt)}</span>
            </div>
          </div>

          {/* Busca a cambio */}
          {(p.action === 'cambiar' || p.action === 'mixto') && p.wants && (
            <div style={{ marginBottom: 20, padding: '14px 16px', background: 'var(--sf2)', border: '1.5px solid rgba(22,119,255,.2)', borderRadius: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--v)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Busca a cambio</div>
              <p style={{ fontSize: 14, color: 'var(--ink)', margin: 0 }}>{p.wants}</p>
            </div>
          )}

          {/* Descripcion */}
          {p.description && (
            <div style={{ marginBottom: 20, padding: '14px 16px', background: 'var(--cd)', border: '1.5px solid var(--ln)', borderRadius: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mu)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Descripcion</div>
              <p style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{p.description}</p>
            </div>
          )}

          {/* Owner card */}
          {owner && (
            <div style={{ marginBottom: 24, padding: '16px', background: 'var(--cd)', border: '1.5px solid var(--ln)', borderRadius: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mu)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Publicado por</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button onClick={handleOwnerClick} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {owner.avatarUrl
                    ? <img src={optimizeCloudinaryUrl(owner.avatarUrl, 80)} alt={owner.displayName}
                        style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--ln)' }} />
                    : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--v)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 700 }}>
                        {owner.displayName.charAt(0).toUpperCase()}
                      </div>
                  }
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <button onClick={handleOwnerClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>{owner.displayName}</div>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="cl" style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{owner.level}</span>
                    {owner.ratingAvg > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <StarRow value={owner.ratingAvg} size={12} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{Number(owner.ratingAvg).toFixed(1)}</span>
                        <span style={{ fontSize: 11, color: 'var(--mu)' }}>({owner.ratingCount})</span>
                      </div>
                    )}
                    {owner.tradesCompleted > 0 && (
                      <span style={{ fontSize: 12, color: 'var(--mu)' }}>{owner.tradesCompleted} trueques</span>
                    )}
                  </div>
                  {owner.region && (
                    <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 4 }}>
                      {owner.commune ? owner.commune + ', ' + owner.region : owner.region}
                    </div>
                  )}
                </div>
                <Link href={'/u/' + owner.id}
                  style={{ fontSize: 12, fontWeight: 600, color: 'var(--v)', textDecoration: 'none', flexShrink: 0, background: 'var(--sf2)', border: '1.5px solid rgba(22,119,255,.2)', borderRadius: 8, padding: '6px 12px' }}>
                  Ver perfil
                </Link>
              </div>
            </div>
          )}

          {/* CTA */}
          <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
            {isOwn ? (
              <div style={{ padding: '14px 16px', background: 'var(--sf)', border: '1.5px solid var(--ln)', borderRadius: 12, textAlign: 'center', fontSize: 14, color: 'var(--mu)' }}>
                Esta es tu publicacion
              </div>
            ) : (
              <button onClick={handleMatch} className="btn bv"
                style={{ fontSize: 16, padding: '14px', borderRadius: 12, fontWeight: 700 }}>
                Proponer Match
              </button>
            )}
            {!isOwn && (
              <button onClick={handleReport}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mu)', fontSize: 12, padding: '8px 0', textDecoration: 'underline' }}>
                Reportar publicacion
              </button>
            )}
          </div>

        </div>
      </div>

      <Modal />
      <Toast />
    </>
  );
}