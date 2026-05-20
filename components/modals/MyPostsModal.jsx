'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CONDITIONS } from '@/lib/productFields';
import { REGIONES_CHILE } from '@/lib/regions';
import { optimizeCloudinaryUrl } from '@/lib/firebase';

const STATUS_INFO = {
  active:  { label: 'Activa',     color: 'var(--lm)',  dot: '🟢' },
  sold:    { label: 'Completada', color: 'var(--v)',   dot: '✅' },
  blocked: { label: 'Bloqueada',  color: 'var(--dg)',  dot: '🚫' },
  expired: { label: 'Caducada',   color: '#EF4444',    dot: '⏰' },
};

const ACTION_LABEL = {
  cambiar: '🔄 Trueque',
  vender:  '💰 Venta',
  mixto:   '⚡ Mixto',
  donar:   '🎁 Donación',
};

function fmtP(v) { return v ? '$' + Number(v).toLocaleString('es-CL') : '—'; }

function EditForm({ product, onSave, onCancel, loading }) {
  const [title,       setTitle]       = useState(product.title || '');
  const [price,       setPrice]       = useState(product.price || '');
  const [condition,   setCondition]   = useState(product.condition || '');
  const [region,      setRegion]      = useState(product.region || '');
  const [wants,       setWants]       = useState(product.wants || '');
  const [description, setDescription] = useState(product.description || '');

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      price: price ? Number(price) : null,
      condition,
      region,
      wants: wants.trim(),
      description: description.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mpost-edit-form">
      <label className="fd">
        Título <span style={{ color: 'var(--dg)' }}>*</span>
        <input value={title} onChange={e => setTitle(e.target.value)} required />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label className="fd">
          Condición
          <select value={condition} onChange={e => setCondition(e.target.value)}>
            <option value="">— Sin especificar —</option>
            {CONDITIONS.map(c => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="fd">
          Precio (CLP)
          <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="Opcional" />
        </label>
      </div>

      <label className="fd">
        Región
        <select value={region} onChange={e => setRegion(e.target.value)}>
          <option value="">— Sin especificar —</option>
          {REGIONES_CHILE.map(r => <option key={r}>{r}</option>)}
        </select>
      </label>

      {(product.action === 'cambiar' || product.action === 'mixto' || product.barter) && (
        <label className="fd fl">
          ¿Qué buscas a cambio?
          <textarea rows={2} value={wants} onChange={e => setWants(e.target.value)} placeholder="Ej: teclado, silla, etc." />
        </label>
      )}

      <label className="fd fl">
        Descripción adicional
        <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Estado, accesorios, detalles importantes…" />
      </label>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <button type="button" className="btn bo bsm" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn bv bsm" disabled={loading}>
          {loading ? 'Guardando…' : '💾 Guardar cambios'}
        </button>
      </div>
    </form>
  );
}

function PostCard({ product: p, onEdit, onSold, onReactivate, onDelete, onRenew }) {
  const [expanded, setExpanded] = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  const status = STATUS_INFO[p.status] || STATUS_INFO.active;

  async function handleSave(data) {
    setLoading(true);
    try { await onEdit(p.id, data); setEditing(false); }
    catch { }
    finally { setLoading(false); }
  }

  async function handleSold() {
    if (!confirm(`¿Marcar "${p.title}" como completada/vendida?`)) return;
    setLoading(true);
    try { await onSold(p.id); }
    catch { }
    finally { setLoading(false); }
  }

  async function handleReactivate() {
    setLoading(true);
    try { await onReactivate(p.id); }
    catch { }
    finally { setLoading(false); }
  }

  async function handleRenew() {
    setLoading(true);
    try { await onRenew(p.id); }
    catch { }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${p.title}"? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    try { await onDelete(p.id); }
    catch { }
    finally { setLoading(false); }
  }

  return (
    <div className={`mpost-card mpost-card--${p.status || 'active'}`}>
      {/* Fila principal */}
      <div className="mpost-row">
        <div className="mpost-img">
          {p.photos?.[0]
            ? <img src={optimizeCloudinaryUrl(p.photos[0], 120)} alt={p.title} />
            : <span>{p.emoji || '📦'}</span>}
        </div>

        <div className="mpost-info">
          <div className="mpost-title">{p.title}</div>
          <div className="mpost-meta">
            {ACTION_LABEL[p.action] || '🔄 Trueque'} · {p.category}
            {p.region && ` · ${p.region}`}
          </div>
          {/* Aviso de caducidad próxima (notificado pero aún no caducado) */}
          {p.status === 'active' && p.expiryNotifiedAt && (
            <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600, marginTop: 2 }}>
              ⏰ Caduca en menos de 7 días
            </div>
          )}
          <div className="mpost-bottom">
            <span className="mpost-price">{fmtP(p.price)}</span>
            <span className="mpost-status" style={{ color: status.color }}>
              {status.dot} {status.label}
            </span>
            {(p.likes || 0) > 0 && (
              <span style={{ fontSize: 11.5, color: 'var(--mu)' }}>❤️ {p.likes}</span>
            )}
          </div>
        </div>

        <button className="mpost-expand" onClick={() => { setExpanded(x => !x); setEditing(false); }}>
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Panel expandido */}
      {expanded && (
        <div className="mpost-panel">
          {editing ? (
            <EditForm product={p} onSave={handleSave} onCancel={() => setEditing(false)} loading={loading} />
          ) : (
            <div className="mpost-actions">
              {/* Editar */}
              {p.status !== 'blocked' && (
                <button className="btn bo bsm mpost-btn" onClick={() => setEditing(true)} disabled={loading}>
                  ✏️ Editar
                </button>
              )}

              {/* Marcar completada / Reactivar / Renovar */}
              {p.status === 'active' && (
                <>
                  <button className="btn bsm mpost-btn mpost-btn--sold" onClick={handleSold} disabled={loading}>
                    ✅ Marcar completada
                  </button>
                  {/* Botón renovar si está próxima a caducar */}
                  {p.expiryNotifiedAt && (
                    <button className="btn bv bsm mpost-btn" onClick={handleRenew} disabled={loading}>
                      🔄 Renovar 30 días
                    </button>
                  )}
                </>
              )}
              {p.status === 'sold' && (
                <button className="btn bv bsm mpost-btn" onClick={handleReactivate} disabled={loading}>
                  🔄 Reactivar
                </button>
              )}
              {p.status === 'expired' && (
                <button className="btn bv bsm mpost-btn" onClick={handleRenew} disabled={loading}>
                  🔄 Renovar publicación
                </button>
              )}

              {/* Eliminar */}
              {p.status !== 'blocked' && (
                <button className="btn bd2 bsm mpost-btn" onClick={handleDelete} disabled={loading}>
                  🗑️ Eliminar
                </button>
              )}

              {p.status === 'blocked' && (
                <div className="nb nbd" style={{ margin: 0, fontSize: 12.5 }}>
                  🚫 Esta publicación fue bloqueada por moderación.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyPostsModal() {
  const { currentUser, products, updateProduct, markProductSold, reactivateProduct, renewProduct, deleteProduct, showToast } = useApp();

  if (!currentUser) return <div className="nb nbd">No has iniciado sesión.</div>;

  const myPosts = products
    .filter(p => p.ownerId === currentUser.uid && p.status !== 'deleted')
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  if (!myPosts.length) return (
    <div className="es" style={{ border: '2px dashed var(--ln)', borderRadius: 14 }}>
      <span className="ei">📦</span>
      <p>Aún no has publicado nada.</p>
    </div>
  );

  const active    = myPosts.filter(p => p.status === 'active').length;
  const completed = myPosts.filter(p => p.status === 'sold').length;
  const expired   = myPosts.filter(p => p.status === 'expired').length;

  async function handleEdit(id, data) {
    try { await updateProduct(id, data); showToast('✅ Publicación actualizada.'); }
    catch (err) { showToast('Error: ' + err.message); throw err; }
  }

  async function handleSold(id) {
    try { await markProductSold(id); showToast('✅ Marcada como completada.'); }
    catch { showToast('Error al actualizar.'); }
  }

  async function handleReactivate(id) {
    try { await reactivateProduct(id); showToast('🔄 Publicación reactivada.'); }
    catch { showToast('Error al actualizar.'); }
  }

  async function handleDelete(id) {
    try { await deleteProduct(id); showToast('🗑️ Publicación eliminada.'); }
    catch { showToast('Error al eliminar.'); }
  }

  async function handleRenew(id) {
    try { await renewProduct(id); }
    catch { showToast('Error al renovar.'); }
  }

  return (
    <div>
      {/* Resumen */}
      <div className="mpost-stats">
        <div className="mpost-stat"><strong>{myPosts.length}</strong><span>Total</span></div>
        <div className="mpost-stat mpost-stat--active"><strong>{active}</strong><span>Activas</span></div>
        <div className="mpost-stat mpost-stat--sold"><strong>{completed}</strong><span>Completadas</span></div>
        {expired > 0 && (
          <div className="mpost-stat" style={{ color: '#EF4444' }}>
            <strong>{expired}</strong><span>Caducadas</span>
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="mpost-list">
        {myPosts.map(p => (
          <PostCard
            key={p.id}
            product={p}
            onEdit={handleEdit}
            onSold={handleSold}
            onReactivate={handleReactivate}
            onRenew={handleRenew}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
