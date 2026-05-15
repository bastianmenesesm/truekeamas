'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function VerifyEmailBanner() {
  const { currentUser } = useApp();
  const [dismissed, setDismissed] = useState(false);
  const [sent,      setSent]      = useState(false);
  const [sending,   setSending]   = useState(false);

  // No mostrar si: no hay usuario, ya verificó, o cerró el banner
  if (!currentUser || currentUser.emailVerified || dismissed) return null;

  async function handleResend() {
    if (sending || sent) return;
    setSending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setSent(true);
    } catch {
      // Firebase limita el envío — ignorar silenciosamente
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="veb">
      <span className="veb-icon">✉️</span>
      <span className="veb-text">
        {sent
          ? 'Correo enviado. Revisa tu bandeja de entrada (y el spam).'
          : <>Verifica tu email para subir al nivel <strong>✉️ Verificado</strong> y generar más confianza.</>
        }
      </span>
      {!sent && (
        <button className="veb-btn" onClick={handleResend} disabled={sending}>
          {sending ? 'Enviando...' : 'Reenviar correo'}
        </button>
      )}
      <button className="veb-close" onClick={() => setDismissed(true)} aria-label="Cerrar">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}
