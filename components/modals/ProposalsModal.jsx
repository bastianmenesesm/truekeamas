'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

const STATUS_LABEL = { pending: 'Pendiente', accepted: 'Aceptada', declined: 'Declinada' };
const STATUS_COLOR = { pending: 'var(--am)', accepted: 'var(--lm)', declined: 'var(--dg)' };

const OFFER_LABEL = { product: '📦 Producto', money: '💵 Dinero', mixed: '🔀 Producto + Dinero' };

function fmtCLP(v) { return '$' + Number(v).toLocaleString('es-CL'); }
function fmtDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ProposalCard({ prop, mode, onAccept, onDecline, onOpenChat, loading }) {
  const [expanded, setExpanded] = useState(false);
  const isPending  = prop.status === 'pending';
  const isAccepted = prop.status === 'accepted';

  return (
    <div className={`proposal-card${prop.status === 'declined' ? ' proposal-card--declined' : ''}`}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div className="proposal-prod-img">
          {prop.productPhoto
            ? <img src={prop.productPhoto} alt={prop.productTitle} />
            : <span>📦</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 2 }}>{prop.productTitle}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, background: 'rgba(27,111,202,.08)', color: 'var(--v)', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
              {OFFER_LABEL[prop.offerType] || prop.offerType}
            </span>
            <span style={{ fontSize: 11.5, color: STATUS_COLOR[prop.status], fontWeight: 700 }}>
              ● {STATUS_LABEL[prop.status]}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--mu)', marginTop: 3 }}>{fmtDate(prop.createdAt)}</div>
        </div>
        <button
          onClick={() => setExpanded(x => !x)}
          style={{ fontSize: 12, color: 'var(--v)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
        >
          {expanded ? 'Cerrar ▲' : 'Ver detalle ▼'}
        </button>
      </div>

      {/* Detalle expandible */}
      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--ln)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'received' && (
            <div style={{ fontSize: 13, color: 'var(--mu)' }}>
              De: <strong style={{ color: 'var(--is)' }}>{prop.proposerName || 'Usuario'}</strong>
            </div>
          )}

          {(prop.offerType === 'product' || prop.offerType === 'mixed') && prop.offerDescription && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--mu)', marginBottom: 4 }}>Producto ofrecido:</div>
              <div style={{ fontSize: 13.5, color: 'var(--is)', background: 'var(--sf)', padding: '10px 14px', borderRadius: 10, lineHeight: 1.65 }}>
                {prop.offerDescription}
              </div>
            </div>
          )}

          {prop.offerPhotos?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--mu)', marginBottom: 6 }}>Fotos del producto:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {prop.offerPhotos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--ln)' }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {(prop.offerType === 'money' || prop.offerType === 'mixed') && prop.offerAmount && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--mu)', marginBottom: 4 }}>
                {prop.offerType === 'mixed' ? 'Dinero adicional:' : 'Monto ofrecido:'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'Syne,sans-serif', color: 'var(--v)' }}>
                {fmtCLP(prop.offerAmount)}
              </div>
            </div>
          )}

          {prop.message && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--mu)', marginBottom: 4 }}>Mensaje:</div>
              <div style={{ fontSize: 13.5, color: 'var(--is)', background: 'var(--sf)', padding: '10px 14px', borderRadius: 10, lineHeight: 1.65, fontStyle: 'italic' }}>
                "{prop.message}"
              </div>
            </div>
          )}
        </div>
      )}

      {/* Acciones */}
      {mode === 'received' && isPending && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="btn bv bsm" style={{ flex: 1 }} disabled={loading} onClick={() => onAccept(prop.id)}>
            {loading ? '…' : '✅ Aceptar propuesta'}
          </button>
          <button className="btn bd2 bsm" style={{ flex: 1 }} disabled={loading} onClick={() => onDecline(prop.id)}>
            {loading ? '…' : '✕ Declinar'}
          </button>
        </div>
      )}

      {isAccepted && prop.matchId && (
        <button className="btn bv bsm btn-full" style={{ marginTop: 12 }} onClick={() => onOpenChat(prop.matchId, prop)}>
          💬 Abrir chat
        </button>
      )}
    </div>
  );
}

export default function ProposalsModal() {
  const { receivedProposals, sentProposals, acceptProposal, declineProposal, openModal, showToast, products } = useApp();
  const [tab, setTab]     = useState('received');
  const [loading, setLoading] = useState(false);

  async function handleAccept(proposalId) {
    setLoading(true);
    try {
      const matchId = await acceptProposal(proposalId);
      showToast('¡Propuesta aceptada! Ahora pueden chatear 🎉');
      const prop = receivedProposals.find(p => p.id === proposalId);
      if (matchId && prop) {
        openModal({ type: 'chat', mid: matchId, prod: { title: prop.productTitle, owner: prop.proposerName } });
      }
    } catch (err) {
      showToast(err.message || 'Error al aceptar propuesta.');
    } finally { setLoading(false); }
  }

  async function handleDecline(proposalId) {
    if (!confirm('¿Seguro que deseas declinar esta propuesta?')) return;
    setLoading(true);
    try {
      await declineProposal(proposalId);
      showToast('Propuesta declinada.');
    } catch (err) {
      showToast(err.message || 'Error.');
    } finally { setLoading(false); }
  }

  function handleOpenChat(matchId, prop) {
    openModal({ type: 'chat', mid: matchId, prod: { title: prop.productTitle, owner: prop.proposerName } });
  }

  const pending  = receivedProposals.filter(p => p.status === 'pending').length;
  const list     = tab === 'received' ? receivedProposals : sentProposals;

  return (
    <div>
      {/* Tabs */}
      <div className="at" style={{ marginBottom: 20 }}>
        <button className={`atb${tab === 'received' ? ' active' : ''}`} onClick={() => setTab('received')}>
          Recibidas {pending > 0 && <span className="bd" style={{ marginLeft: 6 }}>{pending}</span>}
        </button>
        <button className={`atb${tab === 'sent' ? ' active' : ''}`} onClick={() => setTab('sent')}>
          Enviadas {sentProposals.filter(p=>p.status==='pending').length > 0 && <span className="bd" style={{ marginLeft: 6 }}>{sentProposals.filter(p=>p.status==='pending').length}</span>}
        </button>
      </div>

      {list.length === 0 ? (
        <div className="es" style={{ border: '2px dashed var(--ln)', borderRadius: 14 }}>
          <span className="ei">{tab === 'received' ? '📬' : '📤'}</span>
          <p style={{ marginTop: 8 }}>
            {tab === 'received' ? 'Aún no has recibido propuestas.' : 'Aún no has enviado propuestas.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map(prop => (
            <ProposalCard
              key={prop.id}
              prop={prop}
              mode={tab}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onOpenChat={handleOpenChat}
              loading={loading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
