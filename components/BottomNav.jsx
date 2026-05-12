'use client';
import { useApp } from '@/context/AppContext';

export default function BottomNav() {
  const { currentUser, openModal, pendingProposals } = useApp();

  const items = [
    { icon: '🏠', label: 'Inicio', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { icon: '✍️', label: 'Publicar', action: () => openModal(currentUser ? 'publish' : 'auth'), highlight: true },
    { icon: '🤝', label: 'Propuestas', action: () => openModal(currentUser ? 'proposals' : 'auth'), badge: pendingProposals },
    { icon: '🤍', label: 'Guardados', action: () => openModal('cart') },
    { icon: currentUser ? '👤' : '🔐', label: currentUser ? 'Perfil' : 'Entrar', action: () => openModal(currentUser ? 'profile' : 'auth') },
  ];

  return (
    <nav className="bn">
      {items.map(({ icon, label, action, badge }) => (
        <button key={label} className="bnb" onClick={action} style={{ position: 'relative' }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span>{label}</span>
          {badge > 0 && (
            <span style={{ position: 'absolute', top: 4, right: '50%', transform: 'translateX(10px)', minWidth: 16, height: 16, borderRadius: 8, background: 'var(--dg)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', padding: '0 4px' }}>
              {badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
