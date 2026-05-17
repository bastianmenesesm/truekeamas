'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, limit,
} from 'firebase/firestore';
import { optimizeCloudinaryUrl } from '@/lib/firebase';

/* ── Helpers ──────────────────────────────────────────── */
const REASON_LABEL = {
  violence:       'Violencia / comportamiento delictivo',
  self_harm:      'Seguridad y bienestar personal',
  hate_speech:    'Lenguaje que incita al odio',
  graphic:        'Contenido gráfico y violento',
  sexual_content: 'Desnudos / actividad sexual',
  harassment:     'Acoso y bullying',
  spam:           'Spam',
  misinformation: 'Información falsa',
  impersonation:  'Suplantación de identidad',
  regulated:      'Bienes regulados',
};

const USER_REASON_LABEL = {
  scam:          'Estafa / fraude',
  harassment:    'Acoso',
  fake_profile:  'Perfil falso',
  spam:          'Spam',
  inappropriate: 'Conducta inapropiada',
  other:         'Otro',
};

function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Stat({ label, value, color }) {
  return (
    <div className="admin-stat" style={color ? { borderColor: `${color}40` } : {}}>
      <strong style={color ? { color } : {}}>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function ConfirmButton({ label, confirmLabel, className, disabled, onConfirm, style }) {
  const [asking, setAsking] = useState(false);
  if (asking) {
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        <button className="btn bsm" style={{ background: '#FEE2E2', color: '#DC2626', border: '1.5px solid #FECACA', fontSize: 11 }}
          onClick={() => { setAsking(false); onConfirm(); }}>
          {confirmLabel || '¿Confirmar?'}
        </button>
        <button className="btn bsm bo" style={{ fontSize: 11 }} onClick={() => setAsking(false)}>✕</button>
      </div>
    );
  }
  return (
    <button className={`btn bsm ${className || ''}`} disabled={disabled} style={style} onClick={() => setAsking(true)}>
      {label}
    </button>
  );
}

/* ────────────────────────────────────────────────────── */
export default function AdminPage() {
  const router = useRouter();
  const { currentUser, isAdmin, showToast, deleteProduct } = useApp();

  const [tab,          setTab]          = useState('dashboard');
  const [loading,      setLoading]      = useState(false);

  // Products (own subscription, includes blocked)
  const [products,     setProducts]     = useState([]);
  const [prodFilter,   setProdFilter]   = useState('all');
  const [prodSearch,   setProdSearch]   = useState('');

  // Reports
  const [reports,      setReports]      = useState([]);
  const [repFilter,    setRepFilter]    = useState('pending');
  const [repSearch,    setRepSearch]    = useState('');

  // Users
  const [users,        setUsers]        = useState([]);
  const [userSearch,   setUserSearch]   = useState('');
  const [userFilter,   setUserFilter]   = useState('all'); // all | verified | banned

  // User reports
  const [userReports,  setUserReports]  = useState([]);
  const [urFilter,     setUrFilter]     = useState('pending');

  /* ── Redirect if not admin ─────────────────────────── */
  useEffect(() => {
    if (currentUser === null && !isAdmin) {
      // esperar a que auth resuelva antes de redirigir
      const t = setTimeout(() => router.replace('/'), 2000);
      return () => clearTimeout(t);
    }
  }, [currentUser, isAdmin, router]);

  /* ── Products listener (ALL — including blocked) ────── */
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(500));
    return onSnapshot(q, snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.status !== 'deleted'));
    }, () => {});
  }, [isAdmin]);

  /* ── Reports listener ───────────────────────────────── */
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
  }, [isAdmin]);

  /* ── Users listener ─────────────────────────────────── */
  useEffect(() => {
    if (!isAdmin || tab !== 'users') return;
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(500));
    return onSnapshot(q, snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
  }, [isAdmin, tab]);

  /* ── User reports listener ──────────────────────────── */
  useEffect(() => {
    if (!isAdmin || tab !== 'users') return;
    const q = query(collection(db, 'userReports'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setUserReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
  }, [isAdmin, tab]);

  /* ── Derived counts ─────────────────────────────────── */
  const activeProducts  = products.filter(p => p.status === 'active').length;
  const blockedProducts = products.filter(p => p.status === 'blocked').length;
  const pendingReports  = reports.filter(r => r.status === 'pending').length;
  const totalUsers      = users.length;
  const verifiedUsers   = users.filter(u => u.verified).length;
  const bannedUsers     = users.filter(u => u.role === 'banned').length;
  const pendingUreps    = userReports.filter(r => r.status === 'pending').length;

  /* ── Admin API call helper ──────────────────────────── */
  async function adminFetch(path, body) {
    const idToken = await currentUser.getIdToken();
    const res = await fetch(path, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body:    JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Error');
    return data;
  }

  /* ── Product actions ────────────────────────────────── */
  async function handleBlock(p) {
    setLoading(true);
    try {
      await adminFetch('/api/block-product', { productId: p.id });
      showToast(`"${p.title}" bloqueada.`);
    } catch (err) { showToast(err.message); }
    finally { setLoading(false); }
  }

  async function handleUnblock(p) {
    setLoading(true);
    try {
      await adminFetch('/api/unblock-product', { productId: p.id });
      showToast(`"${p.title}" restaurada.`);
    } catch (err) { showToast(err.message); }
    finally { setLoading(false); }
  }

  async function handleDelete(p) {
    setLoading(true);
    try {
      await deleteProduct(p.id);
      showToast('Publicación eliminada permanentemente.');
    } catch (err) { showToast(err.message || 'Error al eliminar.'); }
    finally { setLoading(false); }
  }

  /* ── Report actions ─────────────────────────────────── */
  async function updateReport(reportId, update) {
    await updateDoc(doc(db, 'reports', reportId), update);
  }

  async function updateUserReport(reportId, update) {
    await updateDoc(doc(db, 'userReports', reportId), update);
  }

  async function blockFromReport(report) {
    setLoading(true);
    try {
      await adminFetch('/api/block-product', { productId: report.productId });
      await updateReport(report.id, { status: 'resolved' });
      showToast('Publicación bloqueada y denuncia resuelta.');
    } catch (err) { showToast(err.message); }
    finally { setLoading(false); }
  }

  /* ── User actions ───────────────────────────────────── */
  async function handleToggleVerify(u) {
    setLoading(true);
    try {
      const { verified } = await adminFetch('/api/toggle-verify', { targetUid: u.id });
      showToast(verified ? `${u.displayName} verificado ✓` : 'Verificación retirada.');
    } catch (err) { showToast(err.message); }
    finally { setLoading(false); }
  }

  async function handleBan(u) {
    setLoading(true);
    try {
      const isBanned = u.role === 'banned';
      await adminFetch('/api/ban-user', { targetUid: u.id, action: isBanned ? 'unban' : 'ban' });
      showToast(isBanned ? `${u.displayName} desbaneado.` : `${u.displayName} baneado.`);
    } catch (err) { showToast(err.message); }
    finally { setLoading(false); }
  }

  /* ── Filtered lists ─────────────────────────────────── */
  const visibleProducts = products.filter(p => {
    if (prodFilter === 'active')  return p.status === 'active';
    if (prodFilter === 'blocked') return p.status === 'blocked';
    const q = prodSearch.toLowerCase();
    if (q) return [p.title, p.owner, p.ownerName, p.category].join(' ').toLowerCase().includes(q);
    return true;
  });

  const visibleReports = reports.filter(r => {
    if (repFilter !== 'all' && r.status !== repFilter) return false;
    const q = repSearch.toLowerCase();
    if (q) return [r.productTitle, REASON_LABEL[r.reason] || r.reason, r.description].join(' ').toLowerCase().includes(q);
    return true;
  });

  const visibleUsers = users.filter(u => {
    if (userFilter === 'verified' && !u.verified) return false;
    if (userFilter === 'banned'   && u.role !== 'banned') return false;
    if (!userSearch) return true;
    return [u.displayName, u.email, u.region].join(' ').toLowerCase().includes(userSearch.toLowerCase());
  });

  /* ── Guard ──────────────────────────────────────────── */
  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Acceso restringido</h2>
          <p style={{ color: 'var(--mu)', marginBottom: 24 }}>Solo administradores pueden ver esta página.</p>
          <button className="btn bv" onClick={() => router.replace('/')}>Volver al inicio</button>
        </div>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Top bar ────────────────────────────────────── */}
      <header style={{ background: 'var(--sf)', borderBottom: '1.5px solid var(--ln)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--mu)', fontSize: 13, fontWeight: 600 }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Marketplace
          </button>
          <span style={{ color: 'var(--ln)', fontSize: 16 }}>|</span>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 15, color: 'var(--ink)' }}>
            🛡️ Panel de moderación
          </span>
        </div>
        {pendingReports + pendingUreps > 0 && (
          <span className="bd" style={{ fontSize: 12 }}>
            {pendingReports + pendingUreps} pendiente{pendingReports + pendingUreps !== 1 ? 's' : ''}
          </span>
        )}
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

        {/* ── Tabs ───────────────────────────────────────── */}
        <div className="at" style={{ marginBottom: 28 }}>
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'products',  label: `📦 Publicaciones${blockedProducts ? ` · ${blockedProducts} bloq.` : ''}` },
            { id: 'reports',   label: `🚩 Denuncias`,  badge: pendingReports },
            { id: 'users',     label: `👥 Usuarios`,   badge: pendingUreps },
          ].map(t => (
            <button key={t.id} className={`atb${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
              {t.badge > 0 && <span className="bd" style={{ marginLeft: 6 }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════
            TAB: DASHBOARD
        ══════════════════════════════════════════════════ */}
        {tab === 'dashboard' && (
          <div>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 900, marginBottom: 20, color: 'var(--ink)' }}>
              Resumen general
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 32 }}>
              <Stat label="Publicaciones activas"  value={activeProducts}  />
              <Stat label="Publicaciones bloqueadas" value={blockedProducts} color="#E03358" />
              <Stat label="Denuncias pendientes"   value={pendingReports}   color={pendingReports > 0 ? '#F59E0B' : undefined} />
              <Stat label="Total usuarios"         value={totalUsers}       />
              <Stat label="Usuarios verificados"   value={verifiedUsers}    color="#22C55E" />
              <Stat label="Usuarios baneados"      value={bannedUsers}      color="#E03358" />
            </div>

            <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 800, marginBottom: 14, color: 'var(--ink)' }}>
              Denuncias recientes
            </h3>
            <div className="admin-list" style={{ maxHeight: 340 }}>
              {reports.filter(r => r.status === 'pending').slice(0, 10).map(r => (
                <div key={r.id} className="admin-row">
                  <div className="admin-row-img"><span>🚩</span></div>
                  <div className="admin-row-info" style={{ flex: 1 }}>
                    <div className="admin-row-title">{r.productTitle || '(publicación eliminada)'}</div>
                    <div className="admin-row-meta">
                      <span className="report-tag">{REASON_LABEL[r.reason] || r.reason}</span>
                      <span style={{ fontSize: 11, color: 'var(--mu)' }}>{fmtDate(r.createdAt)}</span>
                    </div>
                  </div>
                  <button className="btn bo bsm" onClick={() => setTab('reports')}>Ver →</button>
                </div>
              ))}
              {reports.filter(r => r.status === 'pending').length === 0 && (
                <div className="es"><span className="ei">✅</span><p>Sin denuncias pendientes</p></div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: PUBLICACIONES
        ══════════════════════════════════════════════════ */}
        {tab === 'products' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
              <Stat label="Activas"   value={activeProducts}  />
              <Stat label="Bloqueadas" value={blockedProducts} color="#E03358" />
              <Stat label="Total"     value={products.length} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <input className="admin-search" type="text" placeholder="Buscar por título, usuario, categoría…"
                value={prodSearch} onChange={e => { setProdSearch(e.target.value); setProdFilter('all'); }} />
              <select className="fs" value={prodFilter} onChange={e => { setProdFilter(e.target.value); setProdSearch(''); }}>
                <option value="all">Todas</option>
                <option value="active">Activas</option>
                <option value="blocked">Bloqueadas</option>
              </select>
            </div>

            <div className="admin-list" style={{ maxHeight: 'none' }}>
              {visibleProducts.length === 0 && (
                <div className="es"><span className="ei">📭</span><p>Sin publicaciones en esta vista.</p></div>
              )}
              {visibleProducts.map(p => (
                <div key={p.id} className={`admin-row${p.status === 'blocked' ? ' admin-row--blocked' : ''}`}>
                  <div className="admin-row-img">
                    {p.photos?.[0] ? <img src={p.photos[0]} alt={p.title} /> : <span>📦</span>}
                  </div>
                  <div className="admin-row-info" style={{ flex: 1 }}>
                    <div className="admin-row-title">{p.title}</div>
                    <div className="admin-row-meta">
                      <span className="cv" style={{ padding: '2px 7px', borderRadius: 5, fontSize: 11 }}>{p.category}</span>
                      <span style={{ color: 'var(--mu)', fontSize: 11 }}>por {p.ownerName || p.owner || '—'}</span>
                      {p.region && <span style={{ color: 'var(--mu)', fontSize: 11 }}>· {p.region}</span>}
                    </div>
                    {p.status === 'blocked' && (
                      <div style={{ fontSize: 11, color: '#E03358', marginTop: 3 }}>
                        🚫 Bloqueada {p.blockedAt ? `· ${fmtDate(p.blockedAt)}` : ''}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    {p.status === 'blocked' ? (
                      <ConfirmButton label="✅ Restaurar" confirmLabel="¿Restaurar?" className="bv" disabled={loading}
                        onConfirm={() => handleUnblock(p)} />
                    ) : (
                      <ConfirmButton label="🚫 Bloquear" confirmLabel="¿Bloquear?" className="bd2" disabled={loading}
                        onConfirm={() => handleBlock(p)} />
                    )}
                    <ConfirmButton
                      label="🗑 Eliminar" confirmLabel="¿Eliminar?"
                      disabled={loading}
                      style={{ background: '#FEE2E2', color: '#DC2626', border: '1.5px solid #FECACA' }}
                      onConfirm={() => handleDelete(p)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: DENUNCIAS
        ══════════════════════════════════════════════════ */}
        {tab === 'reports' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
              <Stat label="Pendientes" value={reports.filter(r => r.status === 'pending').length}  color="#F59E0B" />
              <Stat label="Revisadas"  value={reports.filter(r => r.status === 'reviewed').length} />
              <Stat label="Total"      value={reports.length} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <input className="admin-search" type="text" placeholder="Buscar por publicación, causal…"
                value={repSearch} onChange={e => setRepSearch(e.target.value)} />
              <select className="fs" value={repFilter} onChange={e => setRepFilter(e.target.value)}>
                <option value="all">Todas</option>
                <option value="pending">Pendientes</option>
                <option value="reviewed">Revisadas</option>
                <option value="resolved">Resueltas</option>
              </select>
            </div>

            <div className="admin-list" style={{ maxHeight: 'none' }}>
              {visibleReports.length === 0 && (
                <div className="es"><span className="ei">🚩</span><p>Sin denuncias en esta vista.</p></div>
              )}
              {visibleReports.map(r => {
                const prod = products.find(p => p.id === r.productId);
                return (
                  <div key={r.id} className={`admin-row report-row--${r.status}`}>
                    <div className="admin-row-img">
                      {prod?.photos?.[0] ? <img src={prod.photos[0]} alt={r.productTitle} /> : <span>🚩</span>}
                    </div>
                    <div className="admin-row-info" style={{ flex: 1 }}>
                      <div className="admin-row-title">{r.productTitle || '(publicación eliminada)'}</div>
                      <div className="admin-row-meta">
                        <span className="report-tag">{REASON_LABEL[r.reason] || r.reason}</span>
                        <span style={{ fontSize: 11, color: 'var(--mu)' }}>{fmtDate(r.createdAt)}</span>
                      </div>
                      {r.description && (
                        <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 5, fontStyle: 'italic' }}>
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
                        <ConfirmButton label="🚫 Bloquear" confirmLabel="¿Bloquear?" className="bd2" disabled={loading}
                          onConfirm={() => blockFromReport(r)} />
                      )}
                      {r.status === 'pending' && (
                        <button className="btn bo bsm" onClick={() => updateReport(r.id, { status: 'reviewed' })}>
                          👁 Revisar
                        </button>
                      )}
                      {r.status !== 'resolved' && (
                        <button className="btn bo bsm" style={{ fontSize: 11 }} onClick={() => updateReport(r.id, { status: 'resolved' })}>
                          ✓ Resolver
                        </button>
                      )}
                      {prod && (
                        <ConfirmButton
                          label="🗑 Eliminar" confirmLabel="¿Eliminar?" disabled={loading}
                          style={{ background: '#FEE2E2', color: '#DC2626', border: '1.5px solid #FECACA', fontSize: 11 }}
                          onConfirm={() => handleDelete(prod)}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: USUARIOS
        ══════════════════════════════════════════════════ */}
        {tab === 'users' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              <Stat label="Total"       value={totalUsers}    />
              <Stat label="Verificados" value={verifiedUsers} color="#22C55E" />
              <Stat label="Baneados"    value={bannedUsers}   color="#E03358" />
              <Stat label="Denuncias"   value={pendingUreps}  color={pendingUreps > 0 ? '#F59E0B' : undefined} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <input className="admin-search" type="text" placeholder="Buscar por nombre, email, región…"
                value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              <select className="fs" value={userFilter} onChange={e => setUserFilter(e.target.value)}>
                <option value="all">Todos</option>
                <option value="verified">Verificados</option>
                <option value="banned">Baneados</option>
              </select>
            </div>

            <div className="admin-list" style={{ maxHeight: 'none' }}>
              {visibleUsers.length === 0 && (
                <div className="es"><span className="ei">👥</span><p>Sin usuarios en esta vista.</p></div>
              )}
              {visibleUsers.map(u => {
                const initial      = (u.displayName || 'U').charAt(0).toUpperCase();
                const isBanned     = u.role === 'banned';
                const pendingCount = userReports.filter(r => r.reportedUid === u.id && r.status === 'pending').length;
                return (
                  <div key={u.id} className={`admin-row${isBanned ? ' admin-row--blocked' : ''}`}>
                    <div className="admin-row-img admin-row-img--round">
                      {u.avatarUrl
                        ? <img src={optimizeCloudinaryUrl(u.avatarUrl, 80)} alt={u.displayName} style={{ borderRadius: '50%', width: 40, height: 40, objectFit: 'cover' }} />
                        : <div className="admin-user-avatar">{initial}</div>}
                    </div>
                    <div className="admin-row-info" style={{ flex: 1 }}>
                      <div className="admin-row-title" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {u.displayName || '—'}
                        {u.verified    && <span className="up-badge up-badge--verified" style={{ fontSize: 10 }}>✓ Verificado</span>}
                        {u.role === 'admin'  && <span className="up-badge up-badge--admin"    style={{ fontSize: 10 }}>Admin</span>}
                        {isBanned            && <span style={{ fontSize: 10, background: '#FEE2E2', color: '#DC2626', borderRadius: 5, padding: '2px 7px', fontWeight: 700 }}>Baneado</span>}
                        {pendingCount > 0    && <span className="bd" title={`${pendingCount} denuncia(s)`}>{pendingCount}</span>}
                      </div>
                      <div className="admin-row-meta">
                        <span className="cl" style={{ padding: '2px 7px', borderRadius: 5, fontSize: 11, fontWeight: 700 }}>{u.level || 'Nuevo'}</span>
                        {u.region && <span style={{ color: 'var(--mu)', fontSize: 11 }}>📍 {u.region}</span>}
                        <span style={{ fontSize: 11, color: 'var(--mu)' }}>desde {fmtDate(u.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--mu)' }}>{u.email}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      {u.role !== 'admin' && (
                        <>
                          <button className={`btn bsm ${u.verified ? 'bo' : 'bv'}`} disabled={loading} onClick={() => handleToggleVerify(u)}>
                            {u.verified ? '✕ Quitar' : '✓ Verificar'}
                          </button>
                          <ConfirmButton
                            label={isBanned ? '↩ Desbanear' : '🚫 Banear'}
                            confirmLabel={isBanned ? '¿Desbanear?' : '¿Banear?'}
                            className={isBanned ? 'bv' : ''}
                            style={isBanned ? {} : { background: '#FEE2E2', color: '#DC2626', border: '1.5px solid #FECACA' }}
                            disabled={loading}
                            onConfirm={() => handleBan(u)}
                          />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Denuncias de usuarios */}
            {userReports.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 800, marginBottom: 12, color: 'var(--ink)' }}>
                  Denuncias de usuarios
                </h3>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {['pending', 'resolved'].map(f => (
                    <button key={f} className={`atb${urFilter === f ? ' active' : ''}`} onClick={() => setUrFilter(f)}>
                      {f === 'pending' ? 'Pendientes' : 'Resueltas'}
                      {f === 'pending' && pendingUreps > 0 && <span className="bd" style={{ marginLeft: 5 }}>{pendingUreps}</span>}
                    </button>
                  ))}
                </div>
                <div className="admin-list" style={{ maxHeight: 'none' }}>
                  {userReports.filter(r => r.status === urFilter).map(r => {
                    const u = users.find(x => x.id === r.reportedUid);
                    return (
                      <div key={r.id} className="admin-row">
                        <div className="admin-row-img"><span>🚩</span></div>
                        <div className="admin-row-info" style={{ flex: 1 }}>
                          <div className="admin-row-title">{u?.displayName || r.reportedUid}</div>
                          <div className="admin-row-meta">
                            <span className="report-tag">{USER_REASON_LABEL[r.reason] || r.reason}</span>
                            <span style={{ fontSize: 11, color: 'var(--mu)' }}>{fmtDate(r.createdAt)}</span>
                          </div>
                          {r.description && (
                            <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 4, fontStyle: 'italic' }}>"{r.description}"</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                          {r.status === 'pending' && (
                            <button className="btn bo bsm" onClick={() => updateUserReport(r.id, { status: 'resolved' })}>
                              ✓ Resolver
                            </button>
                          )}
                          {r.status === 'pending' && u && u.role !== 'banned' && (
                            <ConfirmButton
                              label="🚫 Banear"
                              confirmLabel="¿Banear?"
                              style={{ background: '#FEE2E2', color: '#DC2626', border: '1.5px solid #FECACA' }}
                              disabled={loading}
                              onConfirm={async () => {
                                await handleBan(u);
                                await updateUserReport(r.id, { status: 'resolved' });
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {userReports.filter(r => r.status === urFilter).length === 0 && (
                    <div className="es"><span className="ei">🚩</span><p>Sin denuncias en esta vista.</p></div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
