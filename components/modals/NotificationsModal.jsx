'use client';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const TYPE_META = {
  proposal_received: { icon: '🤝', color: 'var(--v)',  label: 'Nueva propuesta' },
  proposal_accepted: { icon: '🎉', color: 'var(--lm)', label: 'Propuesta aceptada' },
  proposal_declined: { icon: '❌', color: 'var(--dg)', label: 'Propuesta declinada' },
  new_message:       { icon: '💬', color: 'var(--v)',  label: 'Nuevo mensaje' },
  trade_completed:      { icon: '✅', color: '#059669',   label: 'Trueque completado' },
  completion_requested: { icon: '🤝', color: 'var(--v)', label: 'Confirmación pendiente' },
};

function fmtDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60)   return 'Ahora';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
}

export default function NotificationsModal() {
  const { notifications, markNotifRead, markAllNotifsRead, openModal, closeModal, openChatWindow, currentUser, unreadNotifs } = useApp();

  async function handleClick(notif) {
    if (!notif.read) await markNotifRead(notif.id);
    if (notif.chatId) {
      closeModal();
      try {
        const snap = await getDoc(doc(db, 'matches', notif.chatId));
        if (snap.exists()) {
          const m = snap.data();
          const otherName = m.ownerId === currentUser?.uid ? m.requesterName : m.ownerName;
          openChatWindow(notif.chatId, {
            title:       m.productTitle || 'Chat',
            owner:       otherName || '',
            ownerId:     m.ownerId,
            requesterId: m.requesterId,
            matchStatus: m.status,
          });
          return;
        }
      } catch (_) {}
      // Fallback if fetch fails
      openChatWindow(notif.chatId, { title: 'Chat', owner: '' });
    } else if (notif.type === 'proposal_received' || notif.type === 'proposal_accepted' || notif.type === 'proposal_declined') {
      closeModal();
      setTimeout(() => openModal('proposals'), 100);
    }
  }

  return (
    <div>
      {unreadNotifs > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button
            onClick={markAllNotifsRead}
            style={{ fontSize: 12.5, color: 'var(--v)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✓ Marcar todas como leídas
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="es" style={{ border: '2px dashed var(--ln)', borderRadius: 14 }}>
          <span className="ei">🔔</span>
          <p style={{ marginTop: 8 }}>Sin notificaciones por ahora.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map(n => {
            const meta = TYPE_META[n.type] || { icon: '🔔', color: 'var(--mu)', label: '' };
            return (
              <div
                key={n.id}
                className={`notif-row${!n.read ? ' notif-row--unread' : ''}`}
                onClick={() => handleClick(n)}
              >
                <div className="notif-icon" style={{ background: n.read ? 'var(--sf)' : `${meta.color}18` }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: n.read ? 500 : 700, fontSize: 13.5, color: 'var(--ink)', marginBottom: 2 }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--mu)', lineHeight: 1.4 }}>{n.body}</div>
                  <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 4 }}>{fmtDate(n.createdAt)}</div>
                </div>
                {!n.read && <div className="notif-dot" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
