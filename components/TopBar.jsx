'use client';
import { useApp } from '@/context/AppContext';

export default function TopBar() {
  const { currentUser, userData, saved, searchQuery, setSearchQuery, openModal, unreadNotifs, pendingProposals } = useApp();
  const name    = userData?.displayName || currentUser?.displayName || 'Entrar';
  const initial = (userData?.displayName || currentUser?.displayName || '?').charAt(0).toUpperCase();

  return (
    <header className="topbar">
      <div className="sw">
        <input type="search" placeholder="Buscar productos, servicios..." autoComplete="off" maxLength={100}
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        <button className="sb"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg></button>
      </div>
      <div className="ta">
        {/* Propuestas */}
        {currentUser && (
          <button className="tb" onClick={() => openModal('proposals')} title="Propuestas de trueque">
            <svg viewBox="0 0 24 24"><path d="M12 2 L15 8 L22 9 L17 14 L18 21 L12 18 L6 21 L7 14 L2 9 L9 8 Z" /></svg>
            Propuestas
            {pendingProposals > 0 && <span className="bd">{pendingProposals}</span>}
          </button>
        )}
        {/* Notificaciones */}
        {currentUser && (
          <button className="tb" onClick={() => openModal('notifications')} title="Notificaciones">
            <svg viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadNotifs > 0 && <span className="bd">{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>}
          </button>
        )}
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
