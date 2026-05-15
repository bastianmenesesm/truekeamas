import './globals.css';
import { AppProvider } from '@/context/AppContext';
import PWAProvider from '@/components/PWAProvider';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://truekeamas.cl';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Truekeamas | Conecta · Intercambia · Crece',
    template: '%s | Truekeamas',
  },
  description: 'Plataforma de trueque digital en Chile. Publica lo que tienes, encuentra lo que necesitas e intercambia con personas de todo el país.',
  keywords: ['trueque', 'intercambio', 'Chile', 'compra venta', 'truekeamas', 'marketplace Chile'],
  authors: [{ name: 'Truekeamas' }],
  creator: 'Truekeamas',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: BASE_URL,
    siteName: 'Truekeamas',
    title: 'Truekeamas | Conecta · Intercambia · Crece',
    description: 'Plataforma de trueque digital en Chile. Publica lo que tienes, encuentra lo que necesitas e intercambia con personas de todo el país.',
  },
  twitter: {
    card: 'summary',
    title: 'Truekeamas | Conecta · Intercambia · Crece',
    description: 'Plataforma de trueque digital en Chile. Publica lo que tienes, encuentra lo que necesitas e intercambia con personas de todo el país.',
  },
  icons: {
    icon: [
      { url: '/favicon.ico',        sizes: 'any' },
      { url: '/favicon-96x96.png',  sizes: '96x96',   type: 'image/png' },
      { url: '/favicon.svg',        type:  'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  alternates: { canonical: BASE_URL },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Truekeamas',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* PWA */}
        <meta name="theme-color" content="#1677FF" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Truekeamas" />
        <meta name="application-name" content="Truekeamas" />
        <meta name="msapplication-TileColor" content="#1677FF" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Apple touch icons */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192.png" />

        {/* Preload hero image para que no bloquee el LCP */}
        <link rel="preload" as="image" href="/hero-bg.jpg" fetchPriority="high" />

        {/* Fuentes con display=swap para no bloquear render */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppProvider>
          {children}
          <PWAProvider />
        </AppProvider>
      </body>
    </html>
  );
}
