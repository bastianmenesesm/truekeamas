'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

export default function TopBar() {
  const {
    currentUser, userData, saved, searchQuery, setSearchQuery,
    openModal, unreadNotifs, unreadMessages, pendingProposals,
    sidebarPinned, sidebarOpen, setSidebarOpen,
  } = useApp();

  // Debounce: input local → setSearchQuery con 300 ms de retraso
  const [inputValue, setInputValue] = useState(searchQuery);

  // Sincronizar si searchQuery se limpia externamente (ej: "Limpiar filtros")
  useEffect(() => { setInputValue(searchQuery); }, [searchQuery]);

  // Aplicar búsqueda después de 300 ms sin escribir
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(inputValue.trim()), 300);
    return () => clearTimeout(t);
  }, [inputValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const name      = userData?.displayName || currentUser?.displayName || 'Entrar';
  const initial   = (userData?.displayName || currentUser?.displayName || '?').charAt(0).toUpperCase();
  const firstName = name.split(' ')[0];

  return (
    <header className="topbar">
      {/* Hamburger — visible only when sidebar is in drawer mode */}
      {!sidebarPinned && (
        <button
          className="tb tb-hamburger"
          onClick={() => setSidebarOpen(v => !v)}
          title={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-label="Menú"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            {sidebarOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6"  x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      )}

      {/* Search bar */}
      <div className="sw" data-tour="search">
        <input
          type="search"
          placeholder="Buscar productos, servicios..."
          autoComplete="off"
          maxLength={100}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
        />
        {inputValue ? (
          <button className="sb sb-clear" onClick={() => { setInputValue(''); setSearchQuery(''); }} aria-label="Limpiar búsqueda">
            <svg viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        ) : (
          <button className="sb" aria-label="Buscar">
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7"/>
              <path d="m20 20-3.5-3.5"/>
            </svg>
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="ta">
        {/* Propuestas */}
        {currentUser && (
          <button className="tb" onClick={() => openModal('proposals')} title="Propuestas de trueque">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 L15 8 L22 9 L17 14 L18 21 L12 18 L6 21 L7 14 L2 9 L9 8 Z"/>
            </svg>
            Propuestas
            {pendingProposals > 0 && <span className="bd">{pendingProposals}</span>}
          </button>
        )}

        {/* Chats (mensajes) */}
        {currentUser && (
          <button className="tb" onClick={() => openModal('chats_list')} title="Chats">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Chats
            {unreadMessages > 0 && <span key={unreadMessages} className="bd bd-new">{unreadMessages > 9 ? '9+' : unreadMessages}</span>}
          </button>
        )}

        {/* Acuerdos */}
        {currentUser && (
          <button className="tb" data-tour="agreements" onClick={() => openModal('agreements')} title="Mis acuerdos">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 11h1a2 2 0 0 1 0 4h-1"/><path d="M9 12H7a2 2 0 0 0 0 4h2"/>
              <path d="M12 7v10"/><rect x="5" y="3" width="14" height="18" rx="2"/>
            </svg>
            Acuerdos
          </button>
        )}

        {/* Notificaciones */}
        {currentUser && (
          <button className="tb" data-tour="notifications" onClick={() => openModal('notifications')} title="Notificaciones">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
        )}

        {/* Guardados */}
        <button className="tb" onClick={() => openModal('cart')} title="Guardados">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {saved.length > 0 && <span className="bd">{saved.length}</span>}
        </button>

        {/* Profile / Login */}
        <button className="pb" onClick={() => openModal(currentUser ? 'profile' : 'auth')}>
          <div className="pa">{initial}</div>
          <span>{currentUser ? firstName : 'Entrar'}</span>
        </button>
      </div>
    </header>
  );
}
