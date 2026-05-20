'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { db, optimizeCloudinaryUrl } from '@/lib/firebase';
import {
  doc, getDoc, collection, query, where,
  getDocs, limit,
} from 'firebase/firestore';

/* ── Helpers ─────────────────────────────── */
function StarDisplay({ value, size = 14 }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <div className="star-display">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} viewBox="0 0 24 24" width={size} height={size}
          fill={s <= rounded ? '#F59E0B' : 'none'}
          stroke={s <= rounded ? '#F59E0B' : '#CBD5E1'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

function fmtMemberSince(ts) {
  if (!ts) return null;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const months = Math.floor((now - d) / (1000 * 60 * 60 * 24 * 30));
  if (months < 1)  return 'Menos de un mes';
  if (months < 12) return `${months} mes${months > 1 ? 'es' : ''}`;
  const years = Math.floor(months / 12);
  const rem   = months % 12;
  return `${years} año${years > 1 ? 's' : ''}${rem > 0 ? ` y ${rem} mes${rem > 1 ? 'es' : ''}` : ''}`;
}

function fmtDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
}

/* ── Component ───────────────────────────── */
export default function UserProfileModal({ userId }) {
  const { currentUser, userData, openModal, closeModal, blockUser, unblockUser } = useApp();

  const [user,        setUser]        = useState(null);
  const [ratings,     setRatings]     = useState([]);
  const [ownProducts, setOwnProducts] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [prodLoading, setProdLoading] = useState(true);

  const isOwn        = currentUser?.uid === userId;
  const blockedUsers = userData?.blockedUsers || [];
  const isBlocked    = blockedUsers.includes(userId);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setProdLoading(true);
    setUser(null);
    setRatings([]);

    async function load() {
      let userObj = null;

      /* 1 ─ Try reading the user document */
      try {
        const snap = await getDoc(doc(db, 'users', userId));
        if (snap.exists()) {
          userObj = { id: snap.id, ...snap.data() };
        }
      } catch (e) {
        // permission-denied or network error — we'll fall through to the product fallback
        console.warn('[UserProfile] user doc unavailable:', e?.code || e?.message);
      }

      /* 2 ─ Fallback: build profile from one of their product documents
             (product docs are always readable since they're public)       */
      if (!userObj) {
        try {
          const prodSnap = await getDocs(query(
            collection(db, 'products'),
            where('ownerId', '==', userId),
            limit(1)
          ));
          if (!prodSnap.empty) {
            const p = prodSnap.docs[0].data();
            userObj = {
              id:           userId,
              displayName:  p.ownerName || p.owner || 'Usuario',
              avatarUrl:    p.ownerAvatarUrl || null,
              level:        p.level || 'Nuevo',
              verified:     p.ownerVerified || false,
              region:       p.region || '',
              ratingAvg:    p.ownerRatingAvg    || 0,
              ratingCount:  p.ownerRatingCount  || 0,
              _fromProduct: true, // flag: partial data
            };
          }
        } catch (e) {
          console.warn('[UserProfile] product fallback failed:', e?.code);
        }
      }

      setUser(userObj);
      setLoading(false);

      /* 3 ─ Load ratings (independent — may also fail if rules block it) */
      try {
        // Un solo filtro → no requiere índice compuesto; orden en cliente
        const ratSnap = await getDocs(query(
          collection(db, 'ratings'),
          where('toUid', '==', userId),
          limit(30)
        ));
        const sorted = ratSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          .slice(0, 20);
        setRatings(sorted);
      } catch (e) {
        console.warn('[UserProfile] ratings unavailable:', e?.code);
      }
    }

    async function loadProducts() {
      try {
        // Un solo filtro de igualdad → no requiere índice compuesto
        // El filtro por status y el orden se aplican en el cliente
        const snap = await getDocs(query(
          collection(db, 'products'),
          where('ownerId', '==', userId),
          limit(50)
        ));
        const active = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.status === 'active')
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          .slice(0, 12);
        setOwnProducts(active);
      } catch (e) {
        console.warn('[UserProfile] products list failed:', e?.code);
      } finally {
        setProdLoading(false);
      }
    }

    load();
    loadProducts();
  }, [userId]);

  /* ── Render: loading ─── */
  if (loading) return (
    <div className="cem">
      <div className="sp" style={{ margin: '0 auto 10px' }} />
      Cargando perfil...
    </div>
  );

  /* ── Render: truly not found ─── */
  if (!user) return (
    <div style={{ textAlign: 'center', padding: '32px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
      <p style={{ color: 'var(--mu)', fontSize: 14 }}>
        Este perfil no está disponible o fue eliminado.
      </p>
    </div>
  );

  const initial     = (user.displayName || 'U').charAt(0).toUpperCase();
  const avg         = user.ratingAvg      || 0;
  const count       = user.ratingCount    || 0;
  const trades      = user.tradesCompleted || 0;
  const memberSince = user._fromProduct ? null : fmtMemberSince(user.createdAt);

  // Hito de trueques: muestra un trofeo según cuántos trueques completados tiene el usuario
  const tradeMilestone =
    trades >= 25 ? { icon: '🥇', label: 'Veterano' } :
    trades >= 10 ? { icon: '🥈', label: 'Experto'  } :
    trades >= 5  ? { icon: '🥉', label: 'Activo'   } :
    trades >= 1  ? { icon: '🌱', label: 'Novato'   } :
    null;

  const levelMeta = {
    'Confiable': { label: '🏅 Confiable', cls: 'up-badge--trusted',  title: '3+ trueques completados · Calificación ≥ 4.0' },
    'Verificado': { label: '✉️ Verificado', cls: 'up-badge--verified', title: 'Email verificado' },
  }[user.level] ?? { label: '🆕 Nuevo', cls: 'up-badge--new', title: 'Usuario nuevo' };

  return (
    <div className="up-wrap">

      {/* ── Header ─────────────────────────── */}
      <div className="up-header">
        <div className="up-avatar-wrap">
          {user.avatarUrl
            ? <img
                src={optimizeCloudinaryUrl(user.avatarUrl, 200)}
                alt={user.displayName}
                className="up-avatar-img"
              />
            : <div className="up-avatar-ph">{initial}</div>
          }
        </div>

        <div className="up-header-info">
          <div className="up-name">{user.displayName || 'Usuario'}</div>

          {/* Level + badges */}
          <div className="up-badges-row">
            <span className={`up-badge ${levelMeta.cls}`} title={levelMeta.title}>
              {levelMeta.label}
            </span>
            {user.role === 'admin' && (
              <span className="up-badge up-badge--admin">🛡️ Admin</span>
            )}
          </div>

          {/* Rating stars */}
          {count > 0 ? (
            <div className="up-rating-row">
              <StarDisplay value={avg} />
              <span className="up-rating-num">{avg.toFixed(1)}</span>
              <span className="up-rating-count">({count} calificación{count !== 1 ? 'es' : ''})</span>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>Sin calificaciones aún</div>
          )}

          {/* Location + member since */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 2 }}>
            {user.region && (
              <span className="up-region">
                📍 {user.commune ? `${user.commune}, ${user.region}` : user.region}
              </span>
            )}
            {memberSince && (
              <span className="up-region" title={`Se unió el ${fmtDate(user.createdAt)}`}>
                🗓️ Miembro hace {memberSince}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────── */}
      <div className="up-stats">
        <div className="up-stat-item">
          <strong>{prodLoading ? '…' : ownProducts.length}</strong>
          <span>Publicaciones</span>
        </div>
        <div className="up-stat-item" title={tradeMilestone ? `${tradeMilestone.icon} ${tradeMilestone.label}` : 'Sin trueques aún'}>
          <strong>
            {tradeMilestone && <span style={{ marginRight: 3 }}>{tradeMilestone.icon}</span>}
            {trades}
          </strong>
          <span>Trueques</span>
        </div>
        <div className="up-stat-item">
          <strong>{count > 0 ? avg.toFixed(1) + ' ★' : '—'}</strong>
          <span>Reputación</span>
        </div>
      </div>

      {/* ── Bio ────────────────────────────── */}
      {user.bio && (
        <div className="up-bio">
          <p>"{user.bio}"</p>
        </div>
      )}

      {/* ── Acciones (perfil ajeno) ─────────── */}
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

      {/* ── Publicaciones activas ──────────── */}
      <div className="up-section">
        <h4 className="up-section-title">
          Publicaciones activas
          {!prodLoading && ownProducts.length > 0 && (
            <span className="pg-count" style={{ marginLeft: 8, fontSize: 12 }}>{ownProducts.length}</span>
          )}
        </h4>

        {prodLoading ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="sp" style={{ margin: '0 auto' }} />
          </div>
        ) : ownProducts.length === 0 ? (
          <div className="nb" style={{ fontSize: 13, padding: '12px 16px' }}>
            Este usuario no tiene publicaciones activas.
          </div>
        ) : (
          <div className="up-products-grid">
            {ownProducts.map(p => (
              <button
                key={p.id}
                className="up-product-thumb"
                onClick={() => {
                  closeModal();
                  setTimeout(() => openModal({ type: 'product_detail', productId: p.id }), 200);
                }}
                title={p.title}
              >
                {p.photos?.[0]
                  ? <img src={optimizeCloudinaryUrl(p.photos[0], 200)} alt={p.title} />
                  : <span className="up-product-emoji">{p.emoji || '📦'}</span>
                }
                <div className="up-product-title">{p.title}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Calificaciones ─────────────────── */}
      <div className="up-section">
        <h4 className="up-section-title">
          Opiniones
          {count > 0 && (
            <span className="pg-count" style={{ marginLeft: 8, fontSize: 12 }}>{count}</span>
          )}
        </h4>

        {ratings.length === 0 ? (
          <div className="nb" style={{ fontSize: 13, padding: '12px 16px' }}>
            Aún no tiene calificaciones. ¡Sé el primero en opinar! 🌟
          </div>
        ) : (
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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="up-rater-name">{r.fromName || 'Usuario'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StarDisplay value={r.stars} size={12} />
                      <span style={{ fontSize: 11, color: 'var(--mu)' }}>{fmtDate(r.createdAt)}</span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: 800, color: '#F59E0B',
                    background: 'rgba(245,158,11,.1)', borderRadius: 6,
                    padding: '2px 7px', flexShrink: 0,
                  }}>
                    {r.stars}★
                  </span>
                </div>
                {r.comment && (
                  <p className="up-rating-comment">"{r.comment}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
