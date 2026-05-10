'use client';
import { useApp } from '@/context/AppContext';
import AuthModal from './modals/AuthModal';
import PublishModal from './modals/PublishModal';
import ProfileModal from './modals/ProfileModal';
import ChatModal from './modals/ChatModal';
import CartModal from './modals/CartModal';
import MyPostsModal from './modals/MyPostsModal';
import AgreementsModal from './modals/AgreementsModal';
import HelpModal from './modals/HelpModal';

const TITLES = {
  auth: 'Acceder a Truekeamas',
  publish: 'Publicar producto o servicio',
  profile: 'Mi perfil',
  cart: 'Guardados',
  agreements: 'Mis acuerdos / Mensajes',
  myPosts: 'Mis publicaciones',
  help: 'Ayuda',
};

export default function Modal() {
  const { modal, closeModal } = useApp();

  if (!modal) return null;

  const type = typeof modal === 'string' ? modal : modal.type;
  const title = type === 'chat' ? (modal.prod?.title || 'Chat') : (TITLES[type] || 'Truekeamas');
  const subtitle = type === 'chat' ? ('Chat con ' + (modal.prod?.owner || 'Usuario')) : '';
  const isWide = type === 'admin';
  const isChat = type === 'chat';

  function renderContent() {
    switch (type) {
      case 'auth': return <AuthModal />;
      case 'publish': return <PublishModal />;
      case 'profile': return <ProfileModal />;
      case 'cart': return <CartModal />;
      case 'agreements': return <AgreementsModal />;
      case 'myPosts': return <MyPostsModal />;
      case 'help': return <HelpModal />;
      case 'chat': return <ChatModal mid={modal.mid} prod={modal.prod} />;
      default: return <div className="nb nbl"><strong>En desarrollo</strong><br />Esta sección estará disponible pronto.</div>;
    }
  }

  return (
    <div className="mo open" id="modal" onClick={e => { if (e.target.id === 'modal') closeModal(); }}>
      <div className={`mb${isWide ? ' wide' : ''}${isChat ? ' cm' : ''}`}>
        <div className="mh">
          <div>
            <h3>{title}</h3>
            {subtitle && <div className="mhs">{subtitle}</div>}
          </div>
          <button className="mc" onClick={closeModal}>×</button>
        </div>
        <div className="mbd">{renderContent()}</div>
      </div>
    </div>
  );
}
