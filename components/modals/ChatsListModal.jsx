'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

function fmtTime(ts) {
  if (!ts?.seconds) return '';
  const d = new Date(ts.seconds * 1000);
  const now = new Date();
  const diff = now - d;
  if (diff < 60 * 1000)        return 'ahora';
  if (diff < 60 * 60 * 1000)  return `${Math.floor(diff / 60000)}m`;
  if (diff < 24 * 60 * 60 * 1000) return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
}

export default function ChatsListModal() {
  const { currentUser, notifications, openChatWindow, closeModal } = useApp();
  const [matches,  setMatches]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }

    const map  = new Map();
    const done = { a: false, b: false };

    function flush() {
      if (!done.a || !done.b) return;
      const sorted = Array.from(map.values())
        .filter(m => m.lastMessage && !m.archived)
        .sort((a, b) => (b.lastMessageAt?.seconds || 0) - (a.lastMessageAt?.seconds || 0));
      setMatches(sorted);
      setLoading(false);
    }

    function applySnap(snap) {
      snap.docChanges().forEach(change => {
        if (change.type === 'removed') map.delete(change.doc.id);
        else map.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
      });
    }

    const onErr = () => setLoading(false);

    const unsub1 = onSnapshot(
      query(collection(db, 'matches'), where('ownerId', '==', currentUser.uid)),
      snap => { applySnap(snap); done.a = true; flush(); }, onErr
    );
    const unsub2 = onSnapshot(
      query(collection(db, 'matches'), where('requesterId', '==', currentUser.uid)),
      snap => { applySnap(snap); done.b = true; flush(); }, onErr
    );

    return () => { unsub1(); unsub2(); };
  }, [currentUser?.uid]);

  // Mensajes no leídos por chat — la notificación guarda el id en `chatId`
  const unreadByChat = {};
  notifications.forEach(n => {
    if (!n.read && n.type === 'new_message' && n.chatId) {
      unreadByChat[n.chatId] = (unreadByChat[n.chatId] || 0) + 1;
    }
  });

  if (!currentUser) {
    return <div className="nb nbd">Inicia sesión para ver tus chats.</div>;
  }

  if (loading) {
    return (
      <div className="cem">
        <div className="sp" style={{ margin: '0 auto 12px' }} />
        Cargando chats...
      </div>
    );
  }

  if (!matches.length) {
    return (
      <div className="nb">
        💬 Aún no tienes mensajes activos.<br />
        <span style={{ fontSize: 13, opacity: .8 }}>
          Los chats aparecen cuando tienes un acuerdo activo y empiezas a conversar.
        </span>
      </div>
    );
  }

  return (
    <div className="cl-list">
      {matches.map(m => {
        const isOwner   = m.ownerId === currentUser.uid;
        const otherName = isOwner ? m.requesterName : m.ownerName;
        const unread    = unreadByChat[m.id] || 0;

        return (
          <div
            key={m.id}
            className={`cl-item${unread ? ' cl-item--unread' : ''}`}
            onClick={() => {
              closeModal();
              openChatWindow(m.id, {
                title:       m.productTitle,
                owner:       otherName,
                photos:      m.productPhoto ? [m.productPhoto] : [],
                emoji:       m.productEmoji,
                ownerId:     m.ownerId,
                requesterId: m.requesterId,
                matchStatus: m.status,
              });
            }}
          >
            {/* Foto del producto */}
            <div className="cl-thumb">
              {m.productPhoto
                ? <img src={m.productPhoto} alt={m.productTitle} />
                : <span>{m.productEmoji || '📦'}</span>
              }
              {unread > 0 && <span className="cl-dot" />}
            </div>

            {/* Contenido */}
            <div className="cl-body">
              <div className="cl-header">
                <span className="cl-name">{otherName}</span>
                <span className={`cl-time${unread ? ' cl-time--unread' : ''}`}>
                  {fmtTime(m.lastMessageAt)}
                </span>
              </div>
              <div className="cl-product">{m.productTitle}</div>
              <div className={`cl-preview${unread ? ' cl-preview--bold' : ''}`}>
                {unread > 0 && <span className="cl-new-tag">{unread} nuevo{unread > 1 ? 's' : ''}</span>}
                {m.lastMessage}
              </div>
            </div>

            {/* Badge de no leídos */}
            {unread > 0 && (
              <div className="cl-badge">{unread}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
