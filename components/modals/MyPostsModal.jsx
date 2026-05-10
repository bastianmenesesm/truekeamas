'use client';
import { useApp } from '@/context/AppContext';

export default function MyPostsModal() {
  const { currentUser, products, deleteProduct, showToast } = useApp();
  if (!currentUser) return <div className="nb nbd">No has iniciado sesión.</div>;
  const myPosts = products.filter(p => p.ownerId === currentUser.uid);
  if (!myPosts.length) return <div className="nb">No tienes publicaciones activas.</div>;
  return (
    <div className="mpl">
      {myPosts.map(p => (
        <div key={p.id} className="mpk">
          <div className="mpi">{p.photos?.[0] ? <img src={p.photos[0]} alt={p.title} /> : (p.emoji || '📦')}</div>
          <div className="mpif"><div className="t">{p.title}</div><div className="s">{p.category} · {p.location || 'Sin ubicación'}</div></div>
          <button className="btn bd2 bsm" onClick={async () => { try { await deleteProduct(p.id); showToast('Eliminada.'); } catch { showToast('Error.'); } }}>🗑️</button>
        </div>
      ))}
    </div>
  );
}
