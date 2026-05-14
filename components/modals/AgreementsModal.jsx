'use client';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';

export default function AgreementsModal() {
  const { currentUser, openModal, closeModal, openChatWindow, archiveChat } = useApp();
  const [matches,   setMatches]   = useState([]);
  const [ratedIds,  setRatedIds]  = useState(new Set());
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }

    // Keep a merged map of both queries so we can combine them in real time
    const map  = new Map();
    const done = { a: false, b: false };

    function flush() {
      if (!done.a || !done.b) return;
      const sorted = Array.from(map.values())
        .filter(m => !m.archived) // ocultar archivados
        .sort((x, y) => (y.lastMessageAt?.seconds || 0) - (x.lastMessageAt?.seconds || 0));
      setMatches(sorted);
      setLoading(false);
    }

    function applySnap(snap) {
      snap.docChanges().forEach(change => {
        if (change.type === 'removed') {
          map.delete(change.doc.id);
        } else {
          map.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
        }
      });
    }

    const onErr = (err) => {
      console.error('[AgreementsModal]', err);
      setError('No se pudieron cargar los acuerdos. Intenta cerrar y abrir de nuevo.');
      setLoading(false);
    };

    const unsub1 = onSnapshot(
      query(collection(db, 'matches'), where('ownerId', '==', currentUser.uid)),
      snap => { applySnap(snap); done.a = true; flush(); },
      onErr
    );

    const unsub2 = onSnapshot(
      query(collection(db, 'matches'), where('requesterId', '==', currentUser.uid)),
      snap => { applySnap(snap); done.b = true; flush(); },
      onErr
    );

    // Load rated match IDs (one-time is fine here)
    getDocs(query(collection(db, 'ratings'), where('fromUid', '==', currentUser.uid)))
      .then(snap => setRatedIds(new Set(snap.docs.map(d => d.data().matchId))))
      .catch(() => {});

    return () => { unsub1(); unsub2(); };
  }, [currentUser?.uid]);

  if (!currentUser) {
    return <div className="nb nbd">Inicia sesión para ver tus acuerdos.</div>;
  }

  if (loading) {
    return (
      <div className="cem">
        <div className="sp" style={{ margin: '0 auto 12px' }} />
        Cargando acuerdos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="nb" style={{ color: 'var(--dg)', borderColor: 'var(--dg)' }}>
        ⚠️ {error}
      </div>
    );
  }

  if (!matches.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="nb">
          🤝 Aún no tienes acuerdos activos.<br />
          <span style={{ fontSize: 13, opacity: .8 }}>
            Un acuerdo se crea cuando otra persona <strong>acepta tu propuesta</strong> de trueque,
            o cuando tú aceptas la de alguien más.
          </span>
        </div>
        <button
          className="btn bv btn-full"
          onClick={() => { closeModal(); setTimeout(() => openModal('proposals'), 80); }}
        >
          📬 Ver mis propuestas
        </button>
      </div>
    );
  }

  return (
    <div className="ml">
      {matches.map(m => {
        const isOwner   = m.ownerId === currentUser.uid;
        const otherName = isOwner ? m.requesterName : m.ownerName;
        const otherUid  = isOwner ? m.requesterId   : m.ownerId;
        const alreadyRated = ratedIds.has(m.id);

        const isCompleted   = m.status === 'completed';
        const confirmedBy   = m.completionConfirmedBy || [];
        const isPending     = !isCompleted && confirmedBy.length > 0;
        const iConfirmed    = confirmedBy.includes(currentUser.uid);

        return (
          <div key={m.id} className={`mk${isCompleted ? ' mk--done' : ''}`}>
            {/* Fila principal → abre chat flotante */}
            <div
              className="mk-main"
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
              <div className="mke">
                {m.productPhoto
                  ? <img src={m.productPhoto} alt={m.productTitle} />
                  : (m.productEmoji || '📦')}
              </div>
              <div className="mki">
                <div className="mkt">
                  {m.productTitle}
                  {isCompleted && (
                    <span style={{ marginLeft: 8, fontSize: 11, background: 'rgba(16,185,129,.12)', color: '#059669', borderRadius: 6, padding: '1px 7px', fontWeight: 700 }}>
                      ✅ Completado
                    </span>
                  )}
                  {isPending && (
                    <span style={{ marginLeft: 8, fontSize: 11, background: 'rgba(245,158,11,.12)', color: '#92400e', borderRadius: 6, padding: '1px 7px', fontWeight: 700 }}>
                      {iConfirmed ? '⏳ Esperando confirmación' : '🤝 Pendiente tu confirmación'}
                    </span>
                  )}
                </div>
                <div className="mks">Con: {otherName} · {m.lastMessage || 'Sin mensajes aún'}</div>
              </div>
            </div>

            {/* Acciones */}
            <div className="mk-actions">
              <button
                className="btn bv bsm"
                style={{ fontSize: 12 }}
                onClick={e => {
                  e.stopPropagation();
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
                💬 Chat
              </button>
              <button
                className="btn bo bsm"
                style={{ fontSize: 12 }}
                onClick={e => {
                  e.stopPropagation();
                  openModal({ type: 'user_profile', userId: otherUid });
                }}
              >
                👤 Ver perfil
              </button>
              {alreadyRated ? (
                <span className="mk-rated-tag">⭐ Ya calificado</span>
              ) : (
                <button
                  className="btn bv bsm"
                  style={{ fontSize: 12 }}
                  onClick={e => {
                    e.stopPropagation();
                    openModal({ type: 'rate_user', matchId: m.id, toUid: otherUid, toName: otherName });
                  }}
                >
                  ⭐ Calificar
                </button>
              )}
              <button
                className="btn bd2 bsm"
                style={{ fontSize: 12 }}
                onClick={async e => {
                  e.stopPropagation();
                  if (!confirm('¿Eliminar este chat? Quedará archivado y no aparecerá más en tu lista.')) return;
                  await archiveChat(m.id);
                }}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
