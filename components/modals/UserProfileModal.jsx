'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import { optimizeCloudinaryUrl } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

function StarDisplay({ value, size = 14 }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <div className="star-display">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} viewBox="0 0 24 24" width={size} height={size}
          fill={s <= rounded ? '#F59E0B' : 'none'}
          stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

export default function UserProfileModal({ userId }) {
  const { currentUser, userData, products, openModal, closeModal, blockUser, unblockUser } = useApp();
  const [user,    setUser]    = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  const isOwn         = currentUser?.uid === userId;
  const blockedUsers  = userData?.blockedUsers || [];
  const isBlocked     = blockedUsers.includes(userId);
  const ownProducts   = products.filter(p => p.ownerId === userId && p.status === 'active');

  useEffect(() => {
    if (!userId) return;
    async function load() {
      try {
        const [userSnap, ratingsSnap] = await Promise.all([
          getDoc(doc(db, 'users', userId)),
          getDocs(query(
            collection(db, 'ratings'),
            where('toUid', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(20)
          )),
        ]);
        setUser(userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null);
        setRatings(ratingsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [userId]);

  if (loading) return <div className="cem"><div className="sp" style={{ margin: '0 auto' }} /></div>;
  if (!user)   return <div className="nb nbd">Usuario no encontrado.</div>;

  const initial = (user.displayName || 'U').charAt(0).toUpperCase();
  const avg     = user.ratingAvg   || 0;
  const count   = user.ratingCount || 0;

  // Determine badges based on level + verified
  const badges = [];
  if (user.verified)             badges.push({ label: '✓ Verificado', cls: 'up-badge--verified' });
  if (user.level === 'Confiable') badges.push({ label: '🏅 Confiable', cls: 'up-badge--trusted' });
  if (user.role === 'admin')     badges.push({ label: '🛡️ Admin',     cls: 'up-badge--admin' });

  function fmtDate(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div className="up-wrap">

      {/* ── Header ───────────────────────────── */}
      <div className="up-header">
        <div className="up-avatar-wrap">
          {user.avatarUrl
            ? <img src={optimizeCloudinaryUrl(user.avatarUrl, 200)} alt={user.displayName} className="up-avatar-img" />
            : <div className="up-avatar-ph">{initial}</div>
          }
        </div>
        <div className="up-header-info">
          <div className="up-name">{user.displayName}</div>
          <div className="up-badges-row">
            <span className="cl" style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
              {user.level || 'Nuevo'}
            </span>
            {badges.map((b, i) => (
              <span key={i} className={`up-badge ${b.cls}`}>{b.label}</span>
            ))}
          </div>
          {count > 0 && (
            <div className="up-rating-row">
              <StarDisplay value={avg} />
              <span className="up-rating-num">{avg.toFixed(1)}</span>
              <span className="up-rating-count">({count})</span>
            </div>
          )}
          {user.region && <div className="up-region">📍 {user.region}</div>}
        </div>
      </div>

      {/* ── Stats ────────────────────────────── */}
      <div className="up-stats">
        <div className="up-stat-item">
          <strong>{ownProducts.length}</strong>
          <span>Publicaciones</span>
        </div>
        <div className="up-stat-item">
          <strong>{user.tradesCompleted || 0}</strong>
          <span>Trueques</span>
        </div>
        <div className="up-stat-item">
          <strong>{count > 0 ? avg.toFixed(1) + '★' : '—'}</strong>
          <span>Reputación</span>
        </div>
      </div>

      {/* ── Acciones (perfil ajeno) ───────────── */}
      {!isOwn && currentUser && (
        <div className="up-actions">
          <button
            className={`btn bsm${isBlocked ? ' bv' : ' bo'}`}
            style={{ flex: 1 }}
            onClick={async () => {
              if (isBlocked) await unblockUser(userId);
              else           await blockUser(userId);
            }}
          >
            {isBlocked ? '🔓 Desbloquear' : '🔒 Bloquear'}
          </button>
          <button
            className="btn bo bsm"
            style={{ flex: 1 }}
            onClick={() => { closeModal(); setTimeout(() => openModal({ type: 'report_user', userId }), 200); }}
          >
            🚩 Denunciar
          </button>
        </div>
      )}

      {/* ── Calificaciones ───────────────────── */}
      {ratings.length > 0 && (
        <div className="up-section">
          <h4 className="up-section-title">Calificaciones</h4>
          <div className="up-ratings-list">
            {ratings.map(r => (
              <div key={r.id} className="up-rating-item">
                <div className="up-rating-top">
                  <div className="up-rater-avatar">
                    {r.fromAvatarUrl
                      ? <img src={optimizeCloudinaryUrl(r.fromAvatarUrl, 80)} alt={r.fromName} />
                      : <span>{(r.fromName || 'U').charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="up-rater-name">{r.fromName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StarDisplay value={r.stars} size={12} />
                      <span style={{ fontSize: 11, color: 'var(--mu)' }}>{fmtDate(r.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {r.comment && (
                  <p className="up-rating-comment">"{r.comment}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Publicaciones ────────────────────── */}
      {ownProducts.length > 0 && (
        <div className="up-section">
          <h4 className="up-section-title">
            Publicaciones activas
            <span className="pg-count" style={{ marginLeft: 8 }}>{ownProducts.length}</span>
          </h4>
          <div className="up-products-grid">
            {ownProducts.slice(0, 6).map(p => (
              <button
                key={p.id}
                className="up-product-thumb"
                onClick={() => { closeModal(); setTimeout(() => openModal({ type: 'product_detail', productId: p.id }), 200); }}
              >
                {p.photos?.[0]
                  ? <img src={optimizeCloudinaryUrl(p.photos[0], 200)} alt={p.title} />
                  : <span className="up-product-emoji">{p.emoji || '📦'}</span>
                }
                <div className="up-product-title">{p.title}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {ratings.length === 0 && ownProducts.length === 0 && (
        <div className="nb" style={{ marginTop: 8 }}>Este usuario aún no tiene actividad registrada.</div>
      )}
    </div>
  );
}
