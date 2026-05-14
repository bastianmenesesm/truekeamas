'use client';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { db, uploadToCloudinary } from '@/lib/firebase';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, updateDoc
} from 'firebase/firestore';

/* ── Single floating chat window ─────────────── */
function ChatWindow({ chatEntry, onClose, onToggleMinimize }) {
  const { currentUser, userData, showToast, rlMessage, notifyMessage, archiveChat, completeMatch } = useApp();
  const { mid, prod, minimized } = chatEntry;

  const [messages,    setMessages]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [sending,     setSending]     = useState(false);
  const [pendImg,     setPendImg]     = useState(null);
  const [pendImgUrl,  setPendImgUrl]  = useState(null);
  const [matchData,   setMatchData]   = useState(null); // estado en tiempo real del match

  const inputRef = useRef(null);
  const msgsRef  = useRef(null);

  /* Real-time match status (para confirmación bilateral) */
  useEffect(() => {
    if (!mid) return;
    const unsub = onSnapshot(doc(db, 'matches', mid), snap => {
      if (snap.exists()) setMatchData(snap.data());
    }, () => {});
    return unsub;
  }, [mid]);

  /* Real-time messages */
  useEffect(() => {
    if (!mid) return;
    const unsub = onSnapshot(
      query(collection(db, 'matches', mid, 'messages'), orderBy('createdAt', 'asc')),
      snap => {
        setLoading(false);
        setMessages(snap.docs.slice(-100).map(d => ({ id: d.id, ...d.data() })));
        setTimeout(() => {
          if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
        }, 50);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [mid]);

  /* Scroll to bottom + focus input on open / unminimize */
  useEffect(() => {
    if (!minimized) {
      setTimeout(() => {
        if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
        if (inputRef.current) inputRef.current.focus();
      }, 80);
    }
  }, [minimized]);

  async function sendMsg() {
    const txt = inputRef.current?.value.trim() || '';
    if (!txt && !pendImg) return;
    if (!currentUser) return;
    try { rlMessage(); } catch (e) { showToast(e.message); return; }
    setSending(true);
    try {
      let imageUrl = null;
      if (pendImg) imageUrl = await uploadToCloudinary(pendImg);
      const myN = userData?.displayName || currentUser.displayName || 'Usuario';
      await addDoc(collection(db, 'matches', mid, 'messages'), {
        text: txt, imageUrl, senderId: currentUser.uid, senderName: myN, createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'matches', mid), {
        lastMessage: txt || '📷 Imagen', lastMessageAt: serverTimestamp()
      });
      const recipientUid = prod?.ownerId === currentUser.uid ? prod?.requesterId : prod?.ownerId;
      if (recipientUid) await notifyMessage(mid, recipientUid, myN, txt || '📷 Imagen');
      if (inputRef.current) inputRef.current.value = '';
      setPendImg(null); setPendImgUrl(null);
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      setSending(false);
    }
  }

  const isTrusted = url =>
    url && (url.startsWith('https://res.cloudinary.com') || url.startsWith('https://firebasestorage.googleapis.com'));

  const title      = prod?.title || 'Chat';
  const person     = prod?.owner || '';

  // Estado de completación en tiempo real desde Firestore
  const isCompleted  = matchData?.status === 'completed';
  const confirmed    = matchData?.completionConfirmedBy || [];
  const iConfirmed   = confirmed.includes(currentUser?.uid);
  const otherConfirmed = confirmed.some(uid => uid !== currentUser?.uid);

  async function handleComplete() {
    if (!confirm('¿Confirmas que el trueque se realizó? El otro usuario también deberá confirmarlo para cerrar el acuerdo.')) return;
    try {
      const result = await completeMatch(mid);
      if (result?.status === 'completed') {
        showToast('¡Trueque completado! 🎉 Ahora pueden calificarse mutuamente.');
        onClose();
      } else {
        showToast('✅ Confirmaste. Esperando que el otro usuario confirme también.');
      }
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleArchive() {
    if (!confirm('¿Eliminar este chat? Quedará archivado y no aparecerá más en tu lista.')) return;
    await archiveChat(mid);
  }

  return (
    <div className={`cw${minimized ? ' cw-min' : ''}`}>

      {/* Header — click to minimize/maximize */}
      <div className="cw-hdr" onClick={onToggleMinimize}>
        <div className="cw-hdr-info">
          <div className="cw-hdr-title">{title}</div>
          {person && <div className="cw-hdr-sub">con {person}</div>}
        </div>
        <div className="cw-hdr-btns" onClick={e => e.stopPropagation()}>
          {/* Eliminar chat */}
          <button className="cw-btn" onClick={handleArchive} title="Eliminar chat">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
          <button
            className="cw-btn"
            onClick={onToggleMinimize}
            title={minimized ? 'Expandir' : 'Minimizar'}
          >
            {minimized
              ? <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
              : <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            }
          </button>
          <button className="cw-btn" onClick={onClose} title="Cerrar chat">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Body — hidden when minimized */}
      {!minimized && (
        <div className="cw-body">

          {/* Banner de confirmación bilateral */}
          {isCompleted ? (
            // Ambos confirmaron
            <div className="cw-done-banner cw-done-banner--done">
              ✅ Trueque completado
            </div>
          ) : iConfirmed ? (
            // Este usuario ya confirmó, esperando al otro
            <div className="cw-done-banner cw-done-banner--waiting">
              ⏳ Confirmaste. Esperando que el otro usuario confirme...
            </div>
          ) : otherConfirmed ? (
            // El otro confirmó, falta este usuario
            <button className="cw-done-banner cw-done-banner--confirm" onClick={handleComplete}>
              🤝 ¡El otro usuario confirmó el trueque! Confirmar también
            </button>
          ) : (
            // Nadie ha confirmado aún
            <button className="cw-done-banner cw-done-banner--btn" onClick={handleComplete}>
              ✅ Marcar trueque como completado
            </button>
          )}

          {/* Messages */}
          <div className="cw-msgs" ref={msgsRef}>
            {loading && (
              <div className="cem" style={{ fontSize: 12, padding: '20px 0' }}>
                <div className="sp" style={{ margin: '0 auto 8px', width: 20, height: 20 }} />
                Cargando...
              </div>
            )}
            {!loading && messages.length === 0 && (
              <div className="cem" style={{ fontSize: 12, padding: '20px 0' }}>
                ✉️ Sé el primero en escribir.
              </div>
            )}
            {messages.map(m => {
              const me = m.senderId === currentUser?.uid;
              const t  = (m.createdAt?.toDate ? m.createdAt.toDate() : new Date())
                .toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={m.id} className={`cb ${me ? 'me' : 'them'}`}>
                  {!me && <div className="cbn">{m.senderName || 'Usuario'}</div>}
                  {isTrusted(m.imageUrl) && (
                    <img className="cbi" src={m.imageUrl} alt=""
                      onClick={() => window.open(m.imageUrl, '_blank')} loading="lazy" />
                  )}
                  {m.text && <div>{m.text}</div>}
                  <div className="cbt">{t}</div>
                </div>
              );
            })}
          </div>

          {/* Input area */}
          <div className="cw-input">
            {pendImgUrl && (
              <div className="cipw" style={{ padding: '6px 8px' }}>
                <div className="cip">
                  <img src={pendImgUrl} alt="preview" />
                  <button onClick={() => { setPendImg(null); setPendImgUrl(null); }}>×</button>
                </div>
              </div>
            )}
            <div className="cir">
              <div className="cib">
                <input
                  type="file" accept="image/*"
                  onChange={e => {
                    const f = e.target.files[0];
                    if (f) { setPendImg(f); setPendImgUrl(URL.createObjectURL(f)); }
                  }}
                />
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="m21 15-5-5L5 21"/>
                </svg>
              </div>
              <input
                ref={inputRef}
                placeholder="Mensaje..."
                autoComplete="off"
                style={{ fontSize: 13 }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
                }}
              />
              <button className="csb" onClick={sendMsg} disabled={sending}>
                <svg viewBox="0 0 24 24">
                  <path d="m22 2-7 20-4-9-9-4 20-7Z"/>
                  <path d="M22 2 11 13"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Chat dock container ──────────────────────── */
export default function ChatDock() {
  const { openChats, closeChatWindow, toggleMinimizeChat } = useApp();
  if (!openChats.length) return null;

  return (
    <div className="chat-dock">
      {openChats.map(c => (
        <ChatWindow
          key={c.mid}
          chatEntry={c}
          onClose={() => closeChatWindow(c.mid)}
          onToggleMinimize={() => toggleMinimizeChat(c.mid)}
        />
      ))}
    </div>
  );
}
