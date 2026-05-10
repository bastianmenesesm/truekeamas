'use client';
import { useApp } from '@/context/AppContext';

export default function BottomNav() {
  const { currentUser, openModal } = useApp();

  function handleNav(id) {
    if (['inicio', 'vitrina'].includes(id)) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      openModal(id);
    }
  }

  return (
    <nav className="bn" id="bnav">
      <button className="bnb" onClick={() => handleNav('inicio')}>
        <svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>
        Inicio
      </button>
      <button className="bnb" onClick={() => handleNav('vitrina')}>
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        Explorar
      </button>
      <button className="bnb" onClick={() => openModal('publish')}>
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>
        Publicar
      </button>
      <button className="bnb" onClick={() => openModal('agreements')}>
        <svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-8 8H7l-4 3 1.5-5A8 8 0 1 1 21 12Z" /></svg>
        Mensajes
      </button>
      <button className="bnb" onClick={() => openModal(currentUser ? 'profile' : 'auth')}>
        <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
        Perfil
      </button>
    </nav>
  );
}
