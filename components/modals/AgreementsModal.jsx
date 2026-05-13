'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function AgreementsModal() {
  const { currentUser, openModal, closeModal, openChatWindow } = useApp();
  const [matches,     setMatches]     = useState([]);
  const [ratedIds,    setRatedIds]    = useState(new Set()); // matchIds ya calificados
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    async function load() {
      try {
        const [a, b, rSnap] = await Promise.all([
          getDocs(query(collection(db, 'matches'),  where('ownerId',     '==', currentUser.uid))),
          getDocs(query(collection(db, 'matches'),  where('requesterId', '==', currentUser.uid))),
          getDocs(query(collection(db, 'ratings'),  where('fromUid',     '==', currentUser.uid))),
        ]);
        const all    = [...a.docs, ...b.docs].map(d => ({ id: d.id, ...d.data() }));
        const unique = Array.from(new Map(all.map(m => [m.id, m])).values());
        setMatches(unique.sort((x, y) => (y.lastMessageAt?.seconds || 0) - (x.lastMessageAt?.seconds || 0)));
        setRatedIds(new Set(rSnap.docs.map(d => d.data().matchId)));
      } catch { }
      finally { setLoading(false); }
    }
    load();
  }, [currentUser]);

  if (!currentUser) return <div className="nb nbd">Inicia sesión para ver tus acuerdos.</div>;
  if (loading)      return <div className="cem"><div className="sp" style={{ margin: '0 auto 12px' }} />Cargando...</div>;
  if (!matches.length) return <div className="nb">No tienes acuerdos aún. Haz 🤝 Match en una publicación.</div>;

  return (
    <div className="ml">
      {matches.map(m => {
        const isOwner   = m.ownerId === currentUser.uid;
        const otherName = isOwner ? m.requesterName : m.ownerName;
        const otherUid  = isOwner ? m.requesterId   : m.ownerId;
        const alreadyRated = ratedIds.has(m.id);

        return (
          <div key={m.id} className="mk">
            {/* Fila principal → abre chat flotante */}
            <div className="mk-main"
              onClick={() => {
                closeModal();
                openChatWindow(m.id, {
                  title: m.productTitle,
                  owner: otherName,
                  photos: m.productPhoto ? [m.productPhoto] : [],
                  emoji: m.productEmoji,
                  ownerId: m.ownerId,
                  requesterId: m.requesterId,
                });
              }}>
              <div className="mke">
                {m.productPhoto
                  ? <img src={m.productPhoto} alt={m.productTitle} />
                  : (m.productEmoji || '📦')}
              </div>
              <div className="mki">
                <div className="mkt">{m.productTitle}</div>
                <div className="mks">Con: {otherName} · {m.lastMessage || 'Sin mensajes'}</div>
              </div>
            </div>

            {/* Acciones */}
            <div className="mk-actions">
              <button
                className="btn bo bsm"
                style={{ fontSize: 12 }}
                onClick={e => { e.stopPropagation(); openModal({ type: 'user_profile', userId: otherUid }); }}
              >
                👤 Ver perfil
              </button>
              {alreadyRated ? (
                <span className="mk-rated-tag">⭐ Calificado</span>
              ) : (
                <button
                  className="btn bv bsm"
                  style={{ fontSize: 12 }}
                  onClick={e => { e.stopPropagation(); openModal({ type: 'rate_user', matchId: m.id, toUid: otherUid, toName: otherName }); }}
                >
                  ⭐ Calificar
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
