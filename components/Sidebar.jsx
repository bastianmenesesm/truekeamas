'use client';
import { useApp } from '@/context/AppContext';

const NAV = [
  { l: 'Inicio',             id: 'inicio',      ic: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>' },
  { l: 'Explorar',           id: 'vitrina',     ic: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>' },
  { l: 'Publicar',           id: 'publish',     ic: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>' },
  { l: 'Propuestas',         id: 'proposals',   ic: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>' },
  { l: 'Mis acuerdos',       id: 'agreements',  ic: '<path d="M21 12a8 8 0 0 1-8 8H7l-4 3 1.5-5A8 8 0 1 1 21 12Z"/>' },
  { l: 'Guardados',          id: 'cart',        ic: '<path d="M5 6h16l-2 8H7L5 3H2"/><circle cx="8" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/>' },
  { l: 'Mis publicaciones',  id: 'myposts',     ic: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>' },
  { l: 'Mi perfil',          id: 'profile',     ic: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>' },
  { l: 'Ayuda',              id: 'help',        ic: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 1 1 4.5 2c-1.1.8-2 1.4-2 3"/><path d="M12 17h.01"/>' },
];

const ADMIN_NAV = {
  l: 'Moderación', id: 'admin',
  ic: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
};

export default function Sidebar() {
  const {
    currentUser, userData, isAdmin, openModal, pendingProposals,
    sidebarPinned, sidebarOpen, setSidebarOpen, toggleSidebarPin,
  } = useApp();

  function handleNav(id) {
    if (['inicio', 'vitrina', 'categorias'].includes(id)) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      openModal(id);
    }
    // Close drawer when navigating (if not pinned)
    if (!sidebarPinned) setSidebarOpen(false);
  }

  const name    = userData?.displayName || currentUser?.displayName || '';
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <aside className={`sidebar${!sidebarPinned ? ' sidebar-drawer' : ''}${!sidebarPinned && sidebarOpen ? ' sidebar-open' : ''}`}>

      {/* ── Pin toggle button ─────────────── */}
      <button
        className={`sb-pin-btn${sidebarPinned ? ' pinned' : ''}`}
        onClick={toggleSidebarPin}
        title={sidebarPinned ? 'Liberar panel (modo cajón)' : 'Fijar panel siempre visible'}
      >
        {/* Pushpin SVG */}
        <svg viewBox="0 0 24 24" width="16" height="16" fill={sidebarPinned ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </button>

      <div className="brand">
        <div className="brand-logo brand-logo-img">
          <img src="/logo-icon.ico" alt="Truekeamas" width={48} height={48} style={{ objectFit: 'contain' }} />
        </div>
        <div className="brand-text">
          <h1>truekea<span style={{ color: 'var(--lm)' }}>mas</span></h1>
          <p>Conecta · Intercambia · Crece</p>
        </div>
      </div>

      <nav className="nav">
        {NAV.map(item => {
          const badge = item.id === 'proposals' ? pendingProposals : 0;
          return (
            <button key={item.id} className="ni" onClick={() => handleNav(item.id)}>
              <div className="nic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round"
                  dangerouslySetInnerHTML={{ __html: item.ic }} />
              </div>
              {item.l}
              {badge > 0 && <span className="bd" style={{ marginLeft: 'auto', fontSize: 10 }}>{badge}</span>}
            </button>
          );
        })}
        {isAdmin && (
          <>
            <div className="nd" />
            <button className="ni ni-admin" onClick={() => handleNav(ADMIN_NAV.id)}>
              <div className="nic nic-admin">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round"
                  dangerouslySetInnerHTML={{ __html: ADMIN_NAV.ic }} />
              </div>
              {ADMIN_NAV.l}
            </button>
          </>
        )}
        <div className="nd" />
      </nav>

      {currentUser && (
        <div className="nu">
          <div className="nuc">
            <div className="nua">{initial}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--is)' }}>{name || '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--mu)' }}>
                {isAdmin ? '🛡️ Admin' : (userData?.level || 'Nuevo')}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
