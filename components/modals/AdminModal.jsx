'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

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

function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminModal() {
  const {
    products, isAdmin, blockProduct, unblockProduct, showToast,
    db, collection, query, orderBy, getDocs, updateDoc, doc, where, onSnapshot
  } = useApp();

  const [tab,     setTab]     = useState('products');
  const [filter,  setFilter]  = useState('all');
  const [search,  setSearch]  = useState('');
  const [reports, setReports] = useState([]);
  const [repFilter, setRepFilter] = useState('pending');
  const [repSearch, setRepSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, [isAdmin]);

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

  /* ── Denuncias ───────────────────────────── */
  const visibleReports = reports.filter(r => {
    if (repFilter !== 'all' && r.status !== repFilter) return false;
    const q = repSearch.toLowerCase();
    if (q) return [r.productTitle, REASON_LABEL[r.reason] || r.reason, r.description].join(' ').toLowerCase().includes(q);
    return true;
  });

  const pendingReports   = reports.filter(r => r.status === 'pending').length;
  const reviewedReports  = reports.filter(r => r.status === 'reviewed').length;

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
                  {r.status !== 'resolved' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      {prod && prod.status !== 'blocked' && (
                        <button className="btn bd2 bsm" disabled={loading}
                          onClick={() => { if (confirm(`¿Bloquear "${r.productTitle}"?`)) blockFromReport(r); }}>
                          🚫 Bloquear
                        </button>
                      )}
                      {r.status === 'pending' && (
                        <button className="btn bo bsm" onClick={() => markReviewed(r.id)}>
                          👁 Revisar
                        </button>
                      )}
                      <button className="btn bo bsm" style={{ fontSize: 11 }} onClick={() => resolveReport(r.id)}>
                        ✓ Resolver
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
