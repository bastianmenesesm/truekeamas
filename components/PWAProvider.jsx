'use client';
import { useEffect, useState, useCallback } from 'react';

const DISMISS_KEY  = 'tk_pwa_dismissed';
const INSTALL_KEY  = 'tk_pwa_installed';
const VISITS_KEY   = 'tk_pwa_visits';
const MIN_VISITS   = 2;    // mostrar prompt a partir de la 2ª visita
const MIN_SECONDS  = 20;   // mínimo 20 segundos en la página

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

export default function PWAProvider() {
  const [installPrompt,   setInstallPrompt]   = useState(null);  // BeforeInstallPromptEvent
  const [showBanner,      setShowBanner]      = useState(false); // banner de instalar
  const [showUpdate,      setShowUpdate]      = useState(false); // banner nueva versión
  const [showIOSHint,     setShowIOSHint]     = useState(false); // instrucciones iOS
  const [swRegistration,  setSwRegistration]  = useState(null);
  const [isOnline,        setIsOnline]        = useState(true);

  /* ── Registrar Service Worker ─────────────────────────────── */
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        setSwRegistration(reg);

        // Detectar nueva versión disponible
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setShowUpdate(true);
            }
          });
        });

        // Revisar actualizaciones periódicamente (cada 60 min)
        setInterval(() => reg.update(), 60 * 60 * 1000);
      })
      .catch(err => console.warn('[PWA] SW registration failed:', err));

    // Recargar cuando el nuevo SW tome control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) { refreshing = true; window.location.reload(); }
    });
  }, []);

  /* ── Capturar prompt de instalación (Android/Desktop) ────── */
  useEffect(() => {
    // Ya instalada como PWA → no mostrar nada
    if (isInStandaloneMode()) return;

    // Ya instalada o descartada permanentemente
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    const installed = localStorage.getItem(INSTALL_KEY);
    if (installed || dismissed) return;

    // Incrementar contador de visitas
    const visits = parseInt(localStorage.getItem(VISITS_KEY) || '0', 10) + 1;
    localStorage.setItem(VISITS_KEY, visits);

    const handleInstallPrompt = e => {
      e.preventDefault();
      setInstallPrompt(e);

      // Mostrar banner solo si suficientes visitas Y tiempo en página
      if (visits >= MIN_VISITS) {
        const timer = setTimeout(() => setShowBanner(true), MIN_SECONDS * 1000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  /* ── Instrucciones específicas para iOS ───────────────────── */
  useEffect(() => {
    if (!isIOS() || isInStandaloneMode()) return;

    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    const installed = localStorage.getItem(INSTALL_KEY);
    if (installed || dismissed) return;

    const visits = parseInt(localStorage.getItem(VISITS_KEY) || '0', 10);
    if (visits < MIN_VISITS) return;

    const timer = setTimeout(() => setShowIOSHint(true), MIN_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, []);

  /* ── Estado de conexión ──────────────────────────────────── */
  useEffect(() => {
    const online  = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online',  online);
    window.addEventListener('offline', offline);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, []);

  /* ── Acciones ────────────────────────────────────────────── */
  const handleInstall = useCallback(async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(INSTALL_KEY, '1');
    }
    setInstallPrompt(null);
    setShowBanner(false);
  }, [installPrompt]);

  const handleDismissBanner = useCallback(() => {
    setShowBanner(false);
    setShowIOSHint(false);
    sessionStorage.setItem(DISMISS_KEY, '1');
  }, []);

  const handleUpdate = useCallback(() => {
    swRegistration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    setShowUpdate(false);
  }, [swRegistration]);

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <>
      {/* Banner: nueva versión disponible */}
      {showUpdate && (
        <div className="pwa-update-bar">
          <span className="pwa-update-icon">🔄</span>
          <span className="pwa-update-text">Nueva versión disponible</span>
          <button className="pwa-update-btn" onClick={handleUpdate}>
            Actualizar ahora
          </button>
          <button className="pwa-update-close" onClick={() => setShowUpdate(false)} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Banner offline */}
      {!isOnline && (
        <div className="pwa-offline-bar">
          <span>📡</span>
          <span>Sin conexión — algunos contenidos pueden no estar disponibles</span>
        </div>
      )}

      {/* Banner: instalar en Android/Desktop */}
      {showBanner && installPrompt && (
        <div className="pwa-install-banner">
          <div className="pwa-install-logo">
            <img src="/logo-icon.svg" alt="Truekeamas" width="36" height="36" />
          </div>
          <div className="pwa-install-info">
            <strong>Instalar Truekeamas</strong>
            <span>Accede más rápido · Sin barra del navegador · Funciona sin señal</span>
          </div>
          <button className="pwa-install-cta" onClick={handleInstall}>
            Instalar
          </button>
          <button className="pwa-install-dismiss" onClick={handleDismissBanner} aria-label="No ahora">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Banner: instrucciones iOS (Share → Add to Home Screen) */}
      {showIOSHint && (
        <div className="pwa-ios-hint">
          <button className="pwa-ios-close" onClick={handleDismissBanner} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <p className="pwa-ios-title">📱 Instala Truekeamas en tu iPhone</p>
          <div className="pwa-ios-steps">
            <div className="pwa-ios-step">
              <span className="pwa-ios-num">1</span>
              <span>Toca el botón <strong>Compartir</strong></span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#1677FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </div>
            <div className="pwa-ios-step">
              <span className="pwa-ios-num">2</span>
              <span>Selecciona <strong>"Añadir a pantalla de inicio"</strong></span>
            </div>
            <div className="pwa-ios-step">
              <span className="pwa-ios-num">3</span>
              <span>Toca <strong>Añadir</strong> para confirmar</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
