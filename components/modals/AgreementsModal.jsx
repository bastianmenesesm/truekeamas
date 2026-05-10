'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function AgreementsModal() {
  const { currentUser, openModal } = useApp();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    async function load() {
      try {
        const [a, b] = await Promise.all([
          getDocs(query(collection(db, 'matches'), where('ownerId', '==', currentUser.uid))),
          getDocs(query(collection(db, 'matches'), where('requesterId', '==', currentUser.uid)))
        ]);
        const all = [...a.docs, ...b.docs].map(d => ({ id: d.id, ...d.data() }));
        const unique = Array.from(new Map(all.map(m => [m.id, m])).values());
        setMatches(unique.sort((x, y) => (y.lastMessageAt?.seconds || 0) - (x.lastMessageAt?.seconds || 0)));
      } catch { }
      finally { setLoading(false); }
    }
    load();
  }, [currentUser]);

  if (!currentUser) return <div className="nb nbd">Inicia sesión para ver tus acuerdos.</div>;
  if (loading) return <div className="cem"><div className="sp" style={{ margin: '0 auto 12px' }} />Cargando...</div>;
  if (!matches.length) return <div className="nb">No tienes acuerdos aún. Haz 🤝 Match en una publicación.</div>;

  return (
    <div className="ml">
      {matches.map(m => {
        const isOwner = m.ownerId === currentUser.uid;
        const other = isOwner ? m.requesterName : m.ownerName;
        return (
          <div key={m.id} className="mk"
            onClick={() => openModal({ type: 'chat', mid: m.id, prod: { title: m.productTitle, owner: other, photos: m.productPhoto ? [m.productPhoto] : [], emoji: m.productEmoji } })}>
            <div className="mke">{m.productPhoto ? <img src={m.productPhoto} alt={m.productTitle} /> : (m.productEmoji || '📦')}</div>
            <div className="mki"><div className="mkt">{m.productTitle}</div><div className="mks">Con: {other} · {m.lastMessage || 'Sin mensajes'}</div></div>
          </div>
        );
      })}
    </div>
  );
}
