'use client';
import { useApp } from '@/context/AppContext';

export default function BottomNav() {
  const { currentUser, openModal } = useApp();

  const items = [
    { icon: '🏠', label: 'Inicio', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { icon: '🤍', label: 'Guardados', action: () => openModal('cart') },
    { icon: '✍️', label: 'Publicar', action: () => openModal(currentUser ? 'publish' : 'auth'), highlight: true },
    { icon: '🤝', label: 'Acuerdos', action: () => openModal(currentUser ? 'agreements' : 'auth') },
    { icon: currentUser ? '👤' : '🔐', label: currentUser ? 'Perfil' : 'Entrar', action: () => openModal(currentUser ? 'profile' : 'auth') },
  ];

  return (
    <nav className="bn">
      {items.map(({ icon, label, action }) => (
        <button key={label} className="bnb" onClick={action}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
