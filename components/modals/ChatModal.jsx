'use client';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { uploadToCloudinary } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

export default function ChatModal({ mid, prod }) {
  const { currentUser, userData, showToast, rlMessage, notifyMessage } = useApp();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendImg, setPendImg] = useState(null);
  const [pendImgUrl, setPendImgUrl] = useState(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const msgsRef = useRef(null);

  useEffect(() => {
    if (!mid) return;
    const unsub = onSnapshot(
      query(collection(db, 'matches', mid, 'messages'), orderBy('createdAt', 'asc')),
      snap => {
        setLoading(false);
        setMessages(snap.docs.slice(-100).map(d => ({ id: d.id, ...d.data() })));
        setTimeout(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight; }, 50);
      },
      err => { setLoading(false); showToast('Error: ' + err.message); }
    );
    return unsub;
  }, [mid]);

  async function sendMsg() {
    const txt = inputRef.current?.value.trim() || '';
    if (!txt && !pendImg) return;
    if (!currentUser) return;
    try { rlMessage(); } catch (e) { showToast(e.message); return; }
    setSending(true);
    try {
      let imageUrl = null;
      if (pendImg) imageUrl = await uploadToCloudinary(pendImg);
      const myN = userData?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario';
      await addDoc(collection(db, 'matches', mid, 'messages'), {
        text: txt, imageUrl, senderId: currentUser.uid, senderName: myN, createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'matches', mid), { lastMessage: txt || '📷 Imagen', lastMessageAt: serverTimestamp() });
      // Notificar al otro usuario
      const recipientUid = prod?.ownerId === currentUser.uid ? prod?.requesterId : prod?.ownerId;
      if (recipientUid) {
        const myN = userData?.displayName || currentUser.displayName || 'Usuario';
        await notifyMessage(mid, recipientUid, myN, txt || '📷 Imagen');
      }
      if (inputRef.current) inputRef.current.value = '';
      setPendImg(null); setPendImgUrl(null);
    } catch (err) { showToast('Error: ' + err.message); }
    finally { setSending(false); }
  }

  const isTrusted = url => url && (url.startsWith('https://res.cloudinary.com') || url.startsWith('https://firebasestorage.googleapis.com'));

  return (
    <>
      <div className="cmsg" ref={msgsRef}>
        {loading && <div className="cem"><div className="sp" style={{ margin: '0 auto 12px' }} />Cargando...</div>}
        {!loading && messages.length === 0 && <div className="cem">✉️ Sé el primero en escribir.</div>}
        {messages.map(m => {
          const me = m.senderId === currentUser?.uid;
          const t = (m.createdAt?.toDate ? m.createdAt.toDate() : new Date()).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={m.id} className={`cb ${me ? 'me' : 'them'}`}>
              {!me && <div className="cbn">{m.senderName || 'Usuario'}</div>}
              {isTrusted(m.imageUrl) && <img className="cbi" src={m.imageUrl} alt="" onClick={() => window.open(m.imageUrl, '_blank')} loading="lazy" />}
              {m.text && <div>{m.text}</div>}
              <div className="cbt">{t}</div>
            </div>
          );
        })}
      </div>
      <div className="cf">
        {pendImgUrl && <div className="cipw"><div className="cip"><img src={pendImgUrl} alt="preview" /><button onClick={() => { setPendImg(null); setPendImgUrl(null); }}>×</button></div></div>}
        <div className="cir">
          <div className="cib">
            <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { setPendImg(f); setPendImgUrl(URL.createObjectURL(f)); } }} />
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
          </div>
          <input ref={inputRef} placeholder="Escribe tu mensaje..." autoComplete="off" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }} />
          <button className="csb" onClick={sendMsg} disabled={sending}>
            <svg viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="M22 2 11 13" /></svg>
          </button>
        </div>
      </div>
    </>
  );
}
