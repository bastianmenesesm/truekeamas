import './globals.css';
import { AppProvider } from '@/context/AppContext';

export const metadata = {
  title: 'Truekeamas | Conecta · Intercambia · Crece',
  description: 'Plataforma de trueque digital en Chile. Conecta personas, intercambia productos y crece en comunidad.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
