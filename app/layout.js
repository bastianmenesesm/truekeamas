import './globals.css';
import { AppProvider } from '@/context/AppContext';

export const metadata = {
  title: 'Truekeamas | Cambia. Ahorra. Conecta.',
  description: 'Plataforma de trueque digital en Chile',
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
