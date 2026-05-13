'use client';
import { useApp } from '@/context/AppContext';

export default function BottomNav() {
  const { currentUser, openModal, pendingProposals, unreadNotifs } = useApp();

  return (
    <nav className="bn">
      {/* Inicio */}
      <button className="bnb" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <svg viewBox="0 0 24 24">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        Inicio
      </button>

      {/* Explorar */}
      <button className="bnb" onClick={() => document.getElementById('vitrina')?.scrollIntoView({ behavior: 'smooth' })}>
        <svg viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        Explorar
      </button>

      {/* Publicar — center, prominent */}
      <button className="bnb-publish" onClick={() => openModal(currentUser ? 'publish' : 'auth')}>
        <div className="bnb-publish-icon">
          <svg viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
        <span className="bnb-publish-label">Publicar</span>
      </button>

      {/* Chats / Propuestas */}
      <button
        className="bnb"
        onClick={() => openModal(currentUser ? 'proposals' : 'auth')}
        style={{ position: 'relative' }}
      >
        <svg viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Chats
        {(pendingProposals + (unreadNotifs || 0)) > 0 && (
          <span style={{
            position: 'absolute', top: 6, right: '50%', transform: 'translateX(12px)',
            minWidth: 16, height: 16, borderRadius: 8, background: 'var(--dg)',
            color: '#fff', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', padding: '0 3px'
          }}>
            {pendingProposals + (unreadNotifs || 0)}
          </span>
        )}
      </button>

      {/* Perfil */}
      <button className="bnb" onClick={() => openModal(currentUser ? 'profile' : 'auth')}>
        <svg viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        {currentUser ? 'Perfil' : 'Entrar'}
      </button>
    </nav>
  );
}
