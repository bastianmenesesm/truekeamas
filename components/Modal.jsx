'use client';
import { useApp } from '@/context/AppContext';
import AuthModal          from '@/components/modals/AuthModal';
import PublishModal       from '@/components/modals/PublishModal';
import CartModal          from '@/components/modals/CartModal';
import AgreementsModal    from '@/components/modals/AgreementsModal';
import MyPostsModal       from '@/components/modals/MyPostsModal';
import ProfileModal       from '@/components/modals/ProfileModal';
import HelpModal          from '@/components/modals/HelpModal';
import ChatModal          from '@/components/modals/ChatModal';
import AdminModal         from '@/components/modals/AdminModal';
import TermsModal         from '@/components/modals/TermsModal';
import MatchProposalModal from '@/components/modals/MatchProposalModal';
import ProposalsModal     from '@/components/modals/ProposalsModal';
import NotificationsModal from '@/components/modals/NotificationsModal';

const TITLES = {
  auth:            'Acceder',
  publish:         '✍️ Publicar',
  cart:            '🤍 Guardados',
  agreements:      '🤝 Mis acuerdos',
  proposals:       '📬 Propuestas de trueque',
  myposts:         '📦 Mis publicaciones',
  profile:         '👤 Mi perfil',
  help:            '❓ Ayuda',
  chat:            '💬 Chat',
  admin:           '🛡️ Panel de moderación',
  terms:           '📋 Términos y Privacidad',
  match_proposal:  '🤝 Enviar propuesta de trueque',
  notifications:   '🔔 Notificaciones',
  privacy_reminder:'🔒 Recordatorio de seguridad',
};

export default function Modal() {
  const { modal, closeModal } = useApp();
  if (!modal) return null;

  const type  = typeof modal === 'string' ? modal : modal.type;
  const title = TITLES[type] || '';
  const isChat      = type === 'chat';
  const isReminder  = type === 'privacy_reminder';

  function renderContent() {
    switch (type) {
      case 'auth':            return <AuthModal />;
      case 'publish':         return <PublishModal />;
      case 'cart':            return <CartModal />;
      case 'agreements':      return <AgreementsModal />;
      case 'proposals':       return <ProposalsModal />;
      case 'myposts':         return <MyPostsModal />;
      case 'profile':         return <ProfileModal />;
      case 'help':            return <HelpModal />;
      case 'chat':            return <ChatModal mid={modal.mid} prod={modal.prod} />;
      case 'admin':           return <AdminModal />;
      case 'terms':           return <TermsModal />;
      case 'match_proposal':  return <MatchProposalModal productId={modal.productId} />;
      case 'notifications':   return <NotificationsModal />;
      case 'privacy_reminder':return <PrivacyReminderContent />;
      default:                return null;
    }
  }

  return (
    <div className="mo open" onClick={e => { if (e.target === e.currentTarget && !isReminder) closeModal(); }}>
      <div className={`mb${isChat ? ' cm' : ''}${type === 'admin' ? ' wide' : ''}`}>
        <div className="mh">
          <div>
            <h3>{title}</h3>
            {isChat && modal.prod && (
              <div className="mhs">{modal.prod.owner ? `con ${modal.prod.owner} · ` : ''}{modal.prod.title}</div>
            )}
          </div>
          {!isReminder && <button className="mc" onClick={closeModal}>×</button>}
        </div>
        <div className="mbd">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

function PrivacyReminderContent() {
  const { closeModal } = useApp();
  return (
    <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
      <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 900, marginBottom: 12, color: 'var(--ink)' }}>
        Tu seguridad es prioridad
      </h3>
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {[
          { icon: '🚫', text: 'Nunca compartas tu RUT, datos bancarios ni contraseñas en el chat.' },
          { icon: '⚠️', text: 'Truekeamas no garantiza ni media en los intercambios. Cada acuerdo es responsabilidad de los usuarios.' },
          { icon: '🤝', text: 'Coordina las entregas en lugares seguros y públicos.' },
          { icon: '🛡️', text: 'Ante conductas sospechosas, usa el botón de reporte o escríbenos a contacto@truekeamas.cl.' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--sf)', borderRadius: 10, padding: '10px 14px' }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
            <span style={{ fontSize: 13.5, color: 'var(--is)', lineHeight: 1.55 }}>{item.text}</span>
          </div>
        ))}
      </div>
      <button className="btn bv btn-full" onClick={closeModal}>
        Entendido, ¡a intercambiar! 🚀
      </button>
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--mu)' }}>
        Este recordatorio aparece en cada sesión.{' '}
        <a href="/privacidad" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--v)' }}>
          Ver términos completos
        </a>
      </div>
    </div>
  );
}
