'use client';
import { useApp } from '@/context/AppContext';

export default function TopBar() {
  const { currentUser, userData, saved, searchQuery, setSearchQuery, openModal } = useApp();
  const name = userData?.displayName || currentUser?.displayName || 'Entrar';
  const initial = (userData?.displayName || currentUser?.displayName || '?').charAt(0).toUpperCase();

  return (
    <header className="topbar">
      <div className="sw">
        <input type="search" placeholder="Buscar productos, servicios..." autoComplete="off" maxLength={100}
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        <button className="sb"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg></button>
      </div>
      <div className="ta">
        <button className="tb" onClick={() => openModal('agreements')}>
          <svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-8 8H7l-4 3 1.5-5A8 8 0 1 1 21 12Z" /></svg>Mensajes
        </button>
        <button className="tb" onClick={() => openModal('cart')}>
          <svg viewBox="0 0 24 24"><path d="M5 6h16l-2 8H7L5 3H2" /><circle cx="8" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></svg>
          Guardados<span className="bd">{saved.length}</span>
        </button>
        <button className="pb" onClick={() => openModal(currentUser ? 'profile' : 'auth')}>
          <div className="pa">{initial}</div><span>{currentUser ? name : 'Entrar'}</span>
        </button>
      </div>
    </header>
  );
}
