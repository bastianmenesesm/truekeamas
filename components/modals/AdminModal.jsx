'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDocs, where, limit } from 'firebase/firestore';
import { optimizeCloudinaryUrl } from '@/lib/firebase';

const REASON_LABEL = {
  violence:        'Violencia / comportamiento delictivo',
  self_harm:       'Seguridad y bienestar personal',
  hate_speech:     'Lenguaje que incita al odio',
  graphic:         'Contenido gráfico y violento',
  sexual_content:  'Desnudos / actividad sexual',
  harassment:      'Acoso y bullying',
  spam:            'Spam',
  misinformation:  'Información falsa',
  impersonation:   'Suplantación de identidad',
  regulated:       'Bienes regulados',
};

const USER_REPORT_REASON = {
  scam:            'Estafa / fraude',
  harassment:      'Acoso',
  fake_profile:    'Perfil falso',
  spam:            'Spam',
  inappropriate:   'Conducta inapropiada',
  other:           'Otro',
};

function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StarMini({ value }) {
  return (
    <span style={{ color: '#F59E0B', fontSize: 12 }}>
      {'★'.repeat(Math.round(value || 0))}{'☆'.repeat(5 - Math.round(value || 0))}
    </span>
  );
}

export default function AdminModal() {
  const {
    currentUser, products, isAdmin, blockProduct, unblockProduct, deleteProduct, showToast,
  } = useApp();

  const [tab,        setTab]        = useState('products');
  const [filter,     setFilter]     = useState('all');
  const [search,     setSearch]     = useState('');
  const [reports,    setReports]    = useState([]);
  const [repFilter,  setRepFilter]  = useState('pending');
  const [repSearch,  setRepSearch]  = useState('');
  const [users,      setUsers]      = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userReports, setUserReports] = useState([]);
  const [urFilter,   setUrFilter]   = useState('pending');
  const [loading,    setLoading]    = useState(false);

  // Reports listener
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, [isAdmin]);

  // Users listener
  useEffect(() => {
    if (!isAdmin || tab !== 'users') return;
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(200));
    const unsub = onSnapshot(q, snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, [isAdmin, tab]);

  // User reports listener
  useEffect(() => {
    if (!isAdmin || tab !== 'users') return;
    const q = query(collection(db, 'userReports'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setUserReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, [isAdmin, tab]);

  if (!isAdmin) {
    return <div className="nb nbd">Acceso restringido. Solo administradores.</div>;
  }

  /* ── Publicaciones ───────────────────────── */
  const visible = products.filter(p => {
    if (p.status === 'deleted') return false;
    if (filter === 'active')  return p.status === 'active';
    if (filter === 'blocked') return p.status === 'blocked';
    const q = search.toLowerCase();
    if (q) return [p.title, p.owner, p.category].join(' ').toLowerCase().includes(q);
    return true;
  });

  const blocked = products.filter(p => p.status === 'blocked').length;
  const active  = products.filter(p => p.status === 'active').length;

  /* ── Denuncias de publicaciones ──────────── */
  const visibleReports = reports.filter(r => {
    if (repFilter !== 'all' && r.status !== repFilter) return false;
    const q = repSearch.toLowerCase();
    if (q) return [r.productTitle, REASON_LABEL[r.reason] || r.reason, r.description].join(' ').toLowerCase().includes(q);
    return true;
  });

  const pendingReports  = reports.filter(r => r.status === 'pending').length;
  const reviewedReports = reports.filter(r => r.status === 'reviewed').length;

  /* ── Usuarios ────────────────────────────── */
  const visibleUsers = users.filter(u => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return [u.displayName, u.email, u.region].join(' ').toLowerCase().includes(q);
  });

  const pendingUserReports = userReports.filter(r => r.status === 'pending').length;

  /* ── Actions ─────────────────────────────── */
  async function markReviewed(reportId) {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status: 'reviewed' });
      showToast('Denuncia marcada como revisada.');
    } catch { showToast('Error al actualizar.'); }
  }

  async function resolveReport(reportId) {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
      showToast('Denuncia resuelta.');
    } catch { showToast('Error al actualizar.'); }
  }

  async function blockFromReport(report) {
    setLoading(true);
    try {
      await blockProduct(report.productId);
      await updateDoc(doc(db, 'reports', report.id), { status: 'resolved' });
    } finally { setLoading(false); }
  }

  async function handleDeleteProduct(p) {
    if (!confirm(`¿Eliminar permanentemente "${p.title}"?\nEsto borrará las fotos de Cloudinary y todos los registros asociados. Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    try {
      await deleteProduct(p.id);
      showToast('Publicación eliminada permanentemente.');
    } catch (err) {
      showToast(err.message || 'Error al eliminar.');
    } finally { setLoading(false); }
  }

  async function deleteFromReport(report) {
    if (!confirm(`¿Eliminar permanentemente "${report.productTitle}"?`)) return;
    setLoading(true);
    try {
      await deleteProduct(report.productId);
      showToast('Publicación eliminada permanentemente.');
    } catch (err) {
      showToast(err.message || 'Error al eliminar.');
    } finally { setLoading(false); }
  }

  async function toggleVerify(u) {
    setLoading(true);
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/toggle-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ targetUid: u.id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error');
      }
      const { verified } = await res.json();
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, verified } : x));
      showToast(verified ? `${u.displayName} verificado ✓` : `Verificación retirada de ${u.displayName}`);
    } catch (err) {
      showToast(err.message || 'Error al verificar.');
    } finally { setLoading(false); }
  }

  async function resolveUserReport(reportId) {
    try {
      await updateDoc(doc(db, 'userReports', reportId), { status: 'resolved' });
      showToast('Denuncia de usuario resuelta.');
    } catch { showToast('Error.'); }
  }

  /* ── Render ──────────────────────────────── */
  return (
    <div>
      {/* Tabs principales */}
      <div className="at" style={{ marginBottom: 20 }}>
        <button className={`atb${tab === 'products' ? ' active' : ''}`} onClick={() => setTab('products')}>
          Publicaciones
        </button>
        <button className={`atb${tab === 'reports' ? ' active' : ''}`} onClick={() => setTab('reports')}>
          Denuncias {pendingReports > 0 && <span className="bd" style={{ marginLeft: 6 }}>{pendingReports}</span>}
        </button>
        <button className={`atb${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>
          Usuarios {pendingUserReports > 0 && <span className="bd" style={{ marginLeft: 6 }}>{pendingUserReports}</span>}
        </button>
      </div>

      {/* ── Tab Publicaciones ─────────────── */}
      {tab === 'products' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
            <div className="admin-stat"><strong>{active}</strong><span>Activas</span></div>
            <div className="admin-stat admin-stat--blocked"><strong>{blocked}</strong><span>Bloqueadas</span></div>
            <div className="admin-stat"><strong>{products.length}</strong><span>Total</span></div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input className="admin-search" type="text" placeholder="Buscar por título, usuario, categoría..."
              value={search} onChange={e => setSearch(e.target.value)} />
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
                    · {p.region || 'Sin región'}
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
                      if (confirm(`¿Bloquear "${p.title}"?`)) blockProduct(p.id);
                    }}>🚫 Bloquear</button>
                  )}
                  <button
                    className="btn bsm"
                    style={{ background: '#FEE2E2', color: '#DC2626', border: '1.5px solid #FECACA' }}
                    disabled={loading}
                    onClick={() => handleDeleteProduct(p)}
                  >
                    🗑 Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Tab Denuncias ─────────────────── */}
      {tab === 'reports' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
            <div className="admin-stat admin-stat--blocked"><strong>{pendingReports}</strong><span>Pendientes</span></div>
            <div className="admin-stat"><strong>{reviewedReports}</strong><span>Revisadas</span></div>
            <div className="admin-stat"><strong>{reports.length}</strong><span>Total</span></div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input className="admin-search" type="text" placeholder="Buscar por publicación, causal..."
              value={repSearch} onChange={e => setRepSearch(e.target.value)} />
            <select className="fs" value={repFilter} onChange={e => setRepFilter(e.target.value)}>
              <option value="all">Todas</option>
              <option value="pending">Pendientes</option>
              <option value="reviewed">Revisadas</option>
              <option value="resolved">Resueltas</option>
            </select>
          </div>

          <div className="admin-list">
            {visibleReports.length === 0 && (
              <div className="es"><span className="ei">🚩</span><p>Sin denuncias en esta vista.</p></div>
            )}
            {visibleReports.map(r => {
              const prod = products.find(p => p.id === r.productId);
              return (
                <div key={r.id} className={`admin-row report-row--${r.status}`}>
                  <div className="admin-row-img">
                    {prod?.photos?.[0]
                      ? <img src={prod.photos[0]} alt={r.productTitle} />
                      : <span>🚩</span>}
                  </div>
                  <div className="admin-row-info" style={{ flex: 1 }}>
                    <div className="admin-row-title">{r.productTitle || '(publicación eliminada)'}</div>
                    <div className="admin-row-meta" style={{ gap: 6 }}>
                      <span className="report-tag">{REASON_LABEL[r.reason] || r.reason}</span>
                      <span style={{ fontSize: 11, color: 'var(--mu)' }}>{fmtDate(r.createdAt)}</span>
                    </div>
                    {r.description && (
                      <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 5, lineHeight: 1.5, fontStyle: 'italic' }}>
                        "{r.description}"
                      </div>
                    )}
                    <div style={{ marginTop: 4 }}>
                      <span className={`report-status report-status--${r.status}`}>
                        {r.status === 'pending' ? '● Pendiente' : r.status === 'reviewed' ? '● Revisada' : '● Resuelta'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    {r.status !== 'resolved' && prod && prod.status !== 'blocked' && (
                      <button className="btn bd2 bsm" disabled={loading}
                        onClick={() => { if (confirm(`¿Bloquear "${r.productTitle}"?`)) blockFromReport(r); }}>
                        🚫 Bloquear
                      </button>
                    )}
                    {r.status !== 'resolved' && r.status === 'pending' && (
                      <button className="btn bo bsm" onClick={() => markReviewed(r.id)}>
                        👁 Revisar
                      </button>
                    )}
                    {r.status !== 'resolved' && (
                      <button className="btn bo bsm" style={{ fontSize: 11 }} onClick={() => resolveReport(r.id)}>
                        ✓ Resolver
                      </button>
                    )}
                    {prod && (
                      <button
                        className="btn bsm"
                        style={{ background: '#FEE2E2', color: '#DC2626', border: '1.5px solid #FECACA', fontSize: 11 }}
                        disabled={loading}
                        onClick={() => deleteFromReport(r)}
                      >
                        🗑 Eliminar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Tab Usuarios ──────────────────── */}
      {tab === 'users' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
            <div className="admin-stat"><strong>{users.length}</strong><span>Usuarios</span></div>
            <div className="admin-stat admin-stat--verified"><strong>{users.filter(u => u.verified).length}</strong><span>Verificados</span></div>
            <div className="admin-stat admin-stat--blocked"><strong>{pendingUserReports}</strong><span>Denuncias</span></div>
          </div>

          <input className="admin-search" type="text" placeholder="Buscar por nombre, email, región..."
            style={{ marginBottom: 16, width: '100%' }}
            value={userSearch} onChange={e => setUserSearch(e.target.value)} />

          <div className="admin-list">
            {visibleUsers.length === 0 && (
              <div className="es"><span className="ei">👥</span><p>Sin usuarios.</p></div>
            )}
            {visibleUsers.map(u => {
              const initial = (u.displayName || 'U').charAt(0).toUpperCase();
              const userPendingReports = userReports.filter(r => r.reportedUid === u.id && r.status === 'pending').length;
              return (
                <div key={u.id} className="admin-row">
                  <div className="admin-row-img admin-row-img--round">
                    {u.avatarUrl
                      ? <img src={optimizeCloudinaryUrl(u.avatarUrl, 80)} alt={u.displayName} style={{ borderRadius: '50%', width: 40, height: 40, objectFit: 'cover' }} />
                      : <div className="admin-user-avatar">{initial}</div>
                    }
                  </div>
                  <div className="admin-row-info" style={{ flex: 1 }}>
                    <div className="admin-row-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {u.displayName || '—'}
                      {u.verified && <span className="up-badge up-badge--verified" style={{ fontSize: 10 }}>✓ Verificado</span>}
                      {u.role === 'admin' && <span className="up-badge up-badge--admin" style={{ fontSize: 10 }}>Admin</span>}
                      {userPendingReports > 0 && (
                        <span className="bd" title={`${userPendingReports} denuncia(s) pendiente(s)`}>{userPendingReports}</span>
                      )}
                    </div>
                    <div className="admin-row-meta">
                      <span className="cl" style={{ padding: '2px 7px', borderRadius: 5, fontSize: 11, fontWeight: 700 }}>{u.level || 'Nuevo'}</span>
                      {u.region && <span style={{ color: 'var(--mu)', fontSize: 11 }}>📍 {u.region}</span>}
                      {u.ratingCount > 0 && (
                        <span><StarMini value={u.ratingAvg} /> {u.ratingAvg?.toFixed(1)} ({u.ratingCount})</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--mu)' }}>{u.email}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <button
                      className={`btn bsm ${u.verified ? 'bo' : 'bv'}`}
                      disabled={loading}
                      onClick={() => toggleVerify(u)}
                    >
                      {u.verified ? '✓ Quitar' : '✓ Verificar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Denuncias de usuarios */}
          {userReports.length > 0 && (
            <>
              <h4 style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 800, margin: '24px 0 12px', color: 'var(--ink)' }}>
                Denuncias de usuarios
              </h4>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {['pending','resolved'].map(f => (
                  <button key={f} className={`atb${urFilter === f ? ' active' : ''}`} onClick={() => setUrFilter(f)}>
                    {f === 'pending' ? 'Pendientes' : 'Resueltas'}
                    {f === 'pending' && pendingUserReports > 0 && <span className="bd" style={{ marginLeft: 5 }}>{pendingUserReports}</span>}
                  </button>
                ))}
              </div>
              <div className="admin-list">
                {userReports.filter(r => r.status === urFilter).map(r => (
                  <div key={r.id} className="admin-row">
                    <div className="admin-row-img"><span>🚩</span></div>
                    <div className="admin-row-info" style={{ flex: 1 }}>
                      <div className="admin-row-title">{users.find(u => u.id === r.reportedUid)?.displayName || r.reportedUid}</div>
                      <div className="admin-row-meta">
                        <span className="report-tag">{USER_REPORT_REASON[r.reason] || r.reason}</span>
                        <span style={{ fontSize: 11, color: 'var(--mu)' }}>{fmtDate(r.createdAt)}</span>
                      </div>
                      {r.description && (
                        <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 4, fontStyle: 'italic' }}>"{r.description}"</div>
                      )}
                    </div>
                    {r.status === 'pending' && (
                      <button className="btn bo bsm" style={{ flexShrink: 0 }} onClick={() => resolveUserReport(r.id)}>
                        ✓ Resolver
                      </button>
                    )}
                  </div>
                ))}
                {userReports.filter(r => r.status === urFilter).length === 0 && (
                  <div className="es"><span className="ei">🚩</span><p>Sin denuncias en esta vista.</p></div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
