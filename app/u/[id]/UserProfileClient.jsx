'use client';
import { useState }              from 'react';
import Link                      from 'next/link';
import { useApp }                from '@/context/AppContext';
import { optimizeCloudinaryUrl } from '@/lib/firebase';
import Modal  from '@/components/Modal';
import Toast  from '@/components/Toast';

const ACTION_BADGE = {
  vender:  { label: 'Venta',    cls: 'cv' },
  cambiar: { label: 'Trueque',  cls: 'cl' },
  mixto:   { label: 'Mixto',    cls: 'ca' },
  donar:   { label: 'Donacion', cls: 'cd-badge' },
};

function fmtP(v) { return v ? '$' + Number(v).toLocaleString('es-CL') : null; }

function StarRow({ value, size = 13 }) {
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

function MiniProductCard({ p }) {
  const badge  = ACTION_BADGE[p.action] || ACTION_BADGE.cambiar;
  const price  = fmtP(p.price);
  const photos = p.photos || [];

  return (
    <Link href={'/p/' + p.id} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article style={{ background: 'var(--cd)', border: '1.5px solid var(--ln)', borderRadius: 14, overflow: 'hidden', transition: 'box-shadow .15s', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--sd)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
        <div style={{ position: 'relative', aspectRatio: '4/3', background: 'var(--sf)' }}>
          {photos.length > 0 ? (
            <img src={optimizeCloudinaryUrl(photos[0], 400)} alt={p.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: 36 }}>
              {p.emoji || '\u{1F4E6}'}
            </div>
          )}
          <span className={'pk-badge ' + badge.cls} style={{ position: 'absolute', top: 8, left: 8 }}>{badge.label}</span>
        </div>
        <div style={{ padding: '10px 12px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {p.title}
          </h3>
          {price && <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--v)' }}>{price}</div>}
          {p.commune && <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 4 }}>{p.commune}</div>}
        </div>
      </article>
    </Link>
  );
}

export default function UserProfileClient({ user: u, products }) {
  const { currentUser, openModal } = useApp();
  const isSelf = currentUser?.uid === u.id;

  function handleMessage() {
    if (!currentUser) { openModal('auth'); return; }
    openModal({ type: 'user_profile', userId: u.id });
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
          {isSelf && (
            <button onClick={() => openModal('profile')} className="btn bo bsm" style={{ fontSize: 12 }}>
              Editar perfil
            </button>
          )}
        </nav>

        <div style={{ maxWidth: 740, margin: '0 auto', padding: '24px 16px' }}>

          {/* User header */}
          <div style={{ background: 'var(--cd)', border: '1.5px solid var(--ln)', borderRadius: 16, padding: '24px 20px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <div style={{ flexShrink: 0 }}>
                {u.avatarUrl
                  ? <img src={optimizeCloudinaryUrl(u.avatarUrl, 120)} alt={u.displayName}
                      style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--ln)' }} />
                  : <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,var(--v),var(--vl))', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 32, fontWeight: 700 }}>
                      {u.displayName.charAt(0).toUpperCase()}
                    </div>
                }
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                  <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                    {u.displayName}
                  </h1>
                  {u.role === 'admin' && (
                    <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,.1)', color: 'var(--dg)', borderRadius: 6, padding: '2px 8px' }}>Admin</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span className="cl" style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{u.level}</span>
                  {u.ratingAvg > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <StarRow value={u.ratingAvg} size={13} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{Number(u.ratingAvg).toFixed(1)}</span>
                      <span style={{ fontSize: 12, color: 'var(--mu)' }}>({u.ratingCount})</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {u.tradesCompleted > 0 && (
                    <div style={{ fontSize: 13, color: 'var(--mu)' }}>
                      <strong style={{ color: 'var(--ink)' }}>{u.tradesCompleted}</strong> trueques
                    </div>
                  )}
                  {products.length > 0 && (
                    <div style={{ fontSize: 13, color: 'var(--mu)' }}>
                      <strong style={{ color: 'var(--ink)' }}>{products.length}</strong> publicaciones
                    </div>
                  )}
                  {u.region && (
                    <div style={{ fontSize: 13, color: 'var(--mu)' }}>
                      {u.commune ? u.commune + ', ' + u.region : u.region}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!isSelf && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--ln)' }}>
                <button onClick={handleMessage} className="btn bv"
                  style={{ width: '100%', fontSize: 14, padding: '10px', borderRadius: 10, fontWeight: 700 }}>
                  Ver perfil completo
                </button>
              </div>
            )}
          </div>

          {/* Publicaciones */}
          <div>
            <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>
              Publicaciones activas
              {products.length > 0 && (
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--mu)', marginLeft: 8 }}>({products.length})</span>
              )}
            </h2>

            {products.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--cd)', border: '1.5px solid var(--ln)', borderRadius: 14, color: 'var(--mu)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>-</div>
                <p style={{ fontSize: 14 }}>Este usuario aun no tiene publicaciones activas.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {products.map(p => <MiniProductCard key={p.id} p={p} />)}
              </div>
            )}
          </div>

        </div>
      </div>

      <Modal />
      <Toast />
    </>
  );
}