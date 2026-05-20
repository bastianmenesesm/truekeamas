'use client';
import dynamic            from 'next/dynamic';
import { useApp }         from '@/context/AppContext';

// Lazy load: cada modal se descarga solo cuando el usuario lo abre por primera vez.
// { ssr: false } porque son componentes 100% interactivos que no necesitan pre-renderizado.
const AuthModal          = dynamic(() => import('@/components/modals/AuthModal'),          { ssr: false });
const PublishModal       = dynamic(() => import('@/components/modals/PublishModal'),       { ssr: false });
const CartModal          = dynamic(() => import('@/components/modals/CartModal'),          { ssr: false });
const AgreementsModal    = dynamic(() => import('@/components/modals/AgreementsModal'),    { ssr: false });
const MyPostsModal       = dynamic(() => import('@/components/modals/MyPostsModal'),       { ssr: false });
const ProfileModal       = dynamic(() => import('@/components/modals/ProfileModal'),       { ssr: false });
const HelpModal          = dynamic(() => import('@/components/modals/HelpModal'),          { ssr: false });
const ChatModal          = dynamic(() => import('@/components/modals/ChatModal'),          { ssr: false });
const TermsModal         = dynamic(() => import('@/components/modals/TermsModal'),         { ssr: false });
const MatchProposalModal = dynamic(() => import('@/components/modals/MatchProposalModal'), { ssr: false });
const ProposalsModal     = dynamic(() => import('@/components/modals/ProposalsModal'),     { ssr: false });
const NotificationsModal = dynamic(() => import('@/components/modals/NotificationsModal'), { ssr: false });
const ReportModal        = dynamic(() => import('@/components/modals/ReportModal'),        { ssr: false });
const ProductDetailModal = dynamic(() => import('@/components/modals/ProductDetailModal'), { ssr: false });
const UserProfileModal   = dynamic(() => import('@/components/modals/UserProfileModal'),   { ssr: false });
const RateUserModal      = dynamic(() => import('@/components/modals/RateUserModal'),      { ssr: false });
const ReportUserModal    = dynamic(() => import('@/components/modals/ReportUserModal'),    { ssr: false });
const OnboardingModal    = dynamic(() => import('@/components/modals/OnboardingModal'),    { ssr: false });
const ChatsListModal     = dynamic(() => import('@/components/modals/ChatsListModal'),     { ssr: false });

const TITLES = {
  auth:            'Acceder',
  publish:         '✍️ Publicar',
  cart:            '🤍 Guardados',
  agreements:      '🤝 Mis acuerdos',
  chats_list:      '💬 Chats',
  proposals:       '📬 Propuestas de trueque',
  myposts:         '📦 Mis publicaciones',
  profile:         '👤 Mi perfil',
  help:            '❓ Ayuda',
  chat:            '💬 Chat',
  terms:           '📋 Términos y Privacidad',
  match_proposal:  '🤝 Enviar propuesta de trueque',
  notifications:   '🔔 Notificaciones',
  privacy_reminder:'🔒 Recordatorio de seguridad',
  report:          '🚩 Denunciar publicación',
  product_detail:  '',
  user_profile:    '',
  rate_user:       '⭐ Calificar usuario',
  report_user:     '🚩 Denunciar usuario',
  onboarding:      '👋 ¡Bienvenido/a a Truekeamas!',
};

export default function Modal() {
  const { modal, closeModal } = useApp();
  if (!modal) return null;

  const type      = typeof modal === 'string' ? modal : modal.type;
  const title     = TITLES[type] || '';
  const isChat     = type === 'chat';
  const isReminder = type === 'privacy_reminder';
  const isDetail   = type === 'product_detail';
  const isProfile  = type === 'user_profile';

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
      case 'terms':           return <TermsModal />;
      case 'match_proposal':  return <MatchProposalModal productId={modal.productId} />;
      case 'notifications':   return <NotificationsModal />;
      case 'privacy_reminder':return <PrivacyReminderContent />;
      case 'report':          return <ReportModal productId={modal.productId} />;
      case 'product_detail':  return <ProductDetailModal productId={modal.productId} />;
      case 'user_profile':    return <UserProfileModal userId={modal.userId} />;
      case 'rate_user':       return <RateUserModal matchId={modal.matchId} toUid={modal.toUid} toName={modal.toName} />;
      case 'report_user':     return <ReportUserModal userId={modal.userId} />;
      case 'onboarding':      return <OnboardingModal />;
      case 'chats_list':      return <ChatsListModal />;
      default:                return null;
    }
  }

  const titleId = `modal-title-${type}`;

  return (
    <div
      className="mo open"
      role="presentation"
      onClick={e => { if (e.target === e.currentTarget && !isReminder) closeModal(); }}
    >
      <div
        className={`mb${isChat ? ' cm' : ''}${isDetail || isProfile ? ' wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        {!isDetail && !isProfile && (
          <div className="mh">
            <div>
              <h3 id={titleId}>{title}</h3>
              {isChat && modal.prod && (
                <div className="mhs">{modal.prod.owner ? `con ${modal.prod.owner} · ` : ''}{modal.prod.title}</div>
              )}
            </div>
            {!isReminder && (
              <button className="mc" onClick={closeModal} aria-label="Cerrar">×</button>
            )}
          </div>
        )}
        {(isDetail || isProfile) && (
          <button className="pd-close-btn" onClick={closeModal} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
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
        <a href="/terminos" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--v)' }}>
          Ver términos completos
        </a>
      </div>
    </div>
  );
}
