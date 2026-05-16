'use client';
/**
 * Analytics.jsx
 *
 * Carga Google Analytics 4 (GA4) solo si NEXT_PUBLIC_GA_ID está definido.
 * - No bloquea el render (script async + strategy afterInteractive)
 * - Compatible con el CSP del proyecto (agrega 'googletagmanager.com' dinámicamente)
 * - Respeta "Do Not Track" del navegador
 */

import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function Analytics() {
  // No cargamos nada si no hay ID configurado o si el usuario tiene DNT activo
  if (!GA_ID) return null;
  if (typeof window !== 'undefined' && window.navigator.doNotTrack === '1') return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
          });
        `}
      </Script>
    </>
  );
}
