'use client';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { REGIONES_CHILE } from '@/lib/regions';
import { uploadToCloudinary, optimizeCloudinaryUrl } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

function StarDisplay({ value, size = 13 }) {
  return (
    <div className="star-display">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} viewBox="0 0 24 24" width={size} height={size}
          fill={s <= Math.round(value) ? '#F59E0B' : 'none'}
          stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

export default function ProfileModal() {
  const { currentUser, userData, updateUserProfile, logoutUser, closeModal, showToast } = useApp();
  const [loading,       setLoading]       = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [ratings,       setRatings]       = useState([]);
  const fileRef = useRef(null);

  const name    = userData?.displayName || currentUser?.displayName || 'Usuario';
  const avg     = userData?.ratingAvg   || 0;
  const count   = userData?.ratingCount || 0;

  useEffect(() => {
    if (!currentUser) return;
    getDocs(query(
      collection(db, 'ratings'),
      where('toUid', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    )).then(snap => setRatings(snap.docs.map(d => ({ id: d.id, ...d.data() })))).catch(() => {});
  }, [currentUser]);

  if (!currentUser) return <div className="nb nbd">No has iniciado sesión.</div>;

  /* ── Completitud del perfil ─────────────────────────── */
  const profileFields = [
    { label: 'Nombre',          done: !!(userData?.displayName) },
    { label: 'Teléfono',        done: !!(userData?.phone)       },
    { label: 'Región',          done: !!(userData?.region)      },
    { label: 'Foto de perfil',  done: !!(userData?.avatarUrl)   },
    { label: 'Email verificado',done: !!currentUser.emailVerified },
  ];
  const doneCount  = profileFields.filter(f => f.done).length;
  const pct        = Math.round((doneCount / profileFields.length) * 100);
  const pctColor   = pct === 100 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444';

  async function handleSave(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    setLoading(true);
    try {
      await updateUserProfile(fd.get('name'), fd.get('phone') || '', fd.get('region') || '');
      showToast('Perfil actualizado ✅');
    } catch (err) { showToast('Error: ' + err.message); }
    finally { setLoading(false); }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('La imagen no puede superar 5 MB'); return; }
    setAvatarLoading(true);
    try {
      const url = await uploadToCloudinary(file);
      await updateUserProfile(name, userData?.phone || '', userData?.region || '', url);
      showToast('Foto de perfil actualizada ✅');
    } catch (err) { showToast('Error al subir imagen: ' + err.message); }
    finally { setAvatarLoading(false); }
  }

  async function handleLogout() { await logoutUser(); showToast('Sesión cerrada.'); closeModal(); }

  return (
    <div>
      {/* ── Completitud del perfil ───────────── */}
      {pct < 100 && (
        <div className="pc-wrap">
          <div className="pc-header">
            <span className="pc-label">Perfil {pct}% completo</span>
            <span className="pc-pct" style={{ color: pctColor }}>{doneCount}/{profileFields.length}</span>
          </div>
          <div className="pc-bar-bg">
            <div className="pc-bar-fill" style={{ width: `${pct}%`, background: pctColor }} />
          </div>
          <div className="pc-items">
            {profileFields.map(f => (
              <span key={f.label} className={`pc-item${f.done ? ' pc-item--done' : ''}`}>
                {f.done ? '✓' : '○'} {f.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Header con avatar ─────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 20, background: 'var(--sf)', borderRadius: 14, border: '1.5px solid var(--ln)' }}>
        {/* Avatar clickeable */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div className="profile-avatar-wrap" onClick={() => fileRef.current?.click()} title="Cambiar foto">
            {userData?.avatarUrl
              ? <img src={optimizeCloudinaryUrl(userData.avatarUrl, 120)} alt={name} className="profile-avatar-img" />
              : <div className="profile-avatar-ph">{name.charAt(0).toUpperCase()}</div>
            }
            {avatarLoading
              ? <div className="profile-avatar-overlay"><span className="sp" style={{ width: 20, height: 20, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' }} /></div>
              : <div className="profile-avatar-overlay">📷</div>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 18, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--mu)', marginBottom: 6 }}>{currentUser.email}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="cl" style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{userData?.level || 'Nuevo'}</span>
            {userData?.role === 'admin' && (
              <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(224,51,88,.1)', color: 'var(--dg)' }}>Admin</span>
            )}
            {count > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <StarDisplay value={avg} size={12} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{avg.toFixed(1)}</span>
                <span style={{ fontSize: 11, color: 'var(--mu)' }}>({count})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Calificaciones recibidas ─────────── */}
      {ratings.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontFamily: 'Playfair Display,serif', fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--ink)' }}>
            Mis calificaciones
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ratings.map(r => (
              <div key={r.id} style={{ background: 'var(--sf)', border: '1.5px solid var(--ln)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: r.comment ? 6 : 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--v)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {(r.fromName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{r.fromName}</span>
                  <StarDisplay value={r.stars} size={12} />
                </div>
                {r.comment && <p style={{ fontSize: 12.5, color: 'var(--mu)', fontStyle: 'italic', margin: 0 }}>"{r.comment}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Formulario ──────────────────────── */}
      <form onSubmit={handleSave}>
        <div className="fg">
          <label className="fd fl">Nombre visible<input name="name" defaultValue={name} /></label>
          <label className="fd">Teléfono<input name="phone" defaultValue={userData?.phone || ''} placeholder="+56 9..." /></label>
          <label className="fd">Región
            <select name="region" defaultValue={userData?.region || ''}>
              <option value="">Sin especificar</option>
              {REGIONES_CHILE.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
        </div>
        <div className="ma">
          <button type="button" className="btn bd2 bsm" onClick={handleLogout}>Cerrar sesión</button>
          <button className="btn bv" type="submit" disabled={loading}>{loading ? 'Guardando...' : '💾 Guardar'}</button>
        </div>
      </form>
    </div>
  );
}
