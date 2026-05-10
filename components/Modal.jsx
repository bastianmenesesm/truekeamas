'use client';
import { useApp } from '@/context/AppContext';
import AuthModal from '@/components/modals/AuthModal';
import PublishModal from '@/components/modals/PublishModal';
import CartModal from '@/components/modals/CartModal';
import AgreementsModal from '@/components/modals/AgreementsModal';
import MyPostsModal from '@/components/modals/MyPostsModal';
import ProfileModal from '@/components/modals/ProfileModal';
import HelpModal from '@/components/modals/HelpModal';
import ChatModal from '@/components/modals/ChatModal';
import AdminModal from '@/components/modals/AdminModal';

const TITLES = {
  auth: 'Acceder',
  publish: '✍️ Publicar',
  cart: '🤍 Guardados',
  agreements: '🤝 Mis acuerdos',
  myposts: '📦 Mis publicaciones',
  profile: '👤 Mi perfil',
  help: '❓ Ayuda',
  chat: '💬 Chat',
  admin: '🛡️ Panel de moderación',
};

export default function Modal() {
  const { modal, closeModal } = useApp();
  if (!modal) return null;

  const type = typeof modal === 'string' ? modal : modal.type;
  const title = TITLES[type] || '';
  const isChat = type === 'chat';

  function renderContent() {
    switch (type) {
      case 'auth': return <AuthModal />;
      case 'publish': return <PublishModal />;
      case 'cart': return <CartModal />;
      case 'agreements': return <AgreementsModal />;
      case 'myposts': return <MyPostsModal />;
      case 'profile': return <ProfileModal />;
      case 'help': return <HelpModal />;
      case 'chat': return <ChatModal mid={modal.mid} prod={modal.prod} />;
      case 'admin': return <AdminModal />;
      default: return null;
    }
  }

  return (
    <div className="mo open" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
      <div className={`mb${isChat ? ' cm' : ''}${type === 'admin' ? ' wide' : ''}`}>
        <div className="mh">
          <div>
            <h3>{title}</h3>
            {isChat && modal.prod && (
              <div className="mhs">con {modal.prod.owner} · {modal.prod.title}</div>
            )}
          </div>
          <button className="mc" onClick={closeModal}>×</button>
        </div>
        <div className="mbd">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
