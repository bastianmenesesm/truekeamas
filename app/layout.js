import './globals.css';
import { AppProvider } from '@/context/AppContext';

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
  icons: { icon: '/favicon.ico' },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Preload hero image para que no bloquee el LCP */}
        <link rel="preload" as="image" href="/hero-bg.jpg" fetchPriority="high" />
        {/* Fuentes con display=swap para no bloquear render */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
