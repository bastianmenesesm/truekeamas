'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { collection, query, where, or, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AgreementsModal() {
  const { currentUser, openModal } = useApp();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    async function load() {
      try {
        const [asOwner, asReq] = await Promise.all([
          getDocs(query(collection(db, 'matches'), where('ownerId', '==', currentUser.uid))),
          getDocs(query(collection(db, 'matches'), where('requesterId', '==', currentUser.uid)))
        ]);
        const all = [...asOwner.docs, ...asReq.docs].map(d => ({ id: d.id, ...d.data() }));
        const unique = Array.from(new Map(all.map(m => [m.id, m])).values());
        setMatches(unique.sort((a, b) => (b.lastMessageAt?.seconds || 0) - (a.lastMessageAt?.seconds || 0)));
      } catch { }
      finally { setLoading(false); }
    }
    load();
  }, [currentUser]);

  if (!currentUser) return <div className="nb nbd">Inicia sesión para ver tus acuerdos.</div>;
  if (loading) return <div className="cem"><div className="sp" style={{ margin: '0 auto 12px' }} />Cargando...</div>;
  if (matches.length === 0) return <div className="nb">No tienes acuerdos aún. Haz click en 🤝 Match para iniciar uno.</div>;

  return (
    <div className="ml">
      {matches.map(m => {
        const isOwner = m.ownerId === currentUser.uid;
        const otherName = isOwner ? m.requesterName : m.ownerName;
        return (
          <div key={m.id} className="mk" onClick={() => openModal({ type: 'chat', mid: m.id, prod: { title: m.productTitle, owner: otherName, photos: m.productPhoto ? [m.productPhoto] : [], emoji: m.productEmoji } })}>
            <div className="mke">
              {m.productPhoto ? <img src={m.productPhoto} alt={m.productTitle} /> : (m.productEmoji || '📦')}
            </div>
            <div className="mki">
              <div className="mkt">{m.productTitle}</div>
              <div className="mks">Con: {otherName} · {m.lastMessage || 'Sin mensajes'}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
