'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="es">
      <body>
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#f5f5f5', fontFamily: 'Inter, sans-serif',
        }}>
          <div style={{
            textAlign: 'center', padding: '48px 32px', background: '#fff',
            borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,.08)', maxWidth: 440,
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🛠️</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>
              Error crítico
            </h1>
            <p style={{ fontSize: 15, color: '#666', marginBottom: 28, lineHeight: 1.6 }}>
              La aplicación encontró un error grave. Por favor recarga la página.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{
                  background: '#1677FF', color: '#fff', border: 'none',
                  padding: '12px 28px', borderRadius: 12, fontWeight: 700,
                  fontSize: 15, cursor: 'pointer',
                }}
              >
                🔄 Recargar
              </button>
              <a
                href="/"
                style={{
                  background: '#f0f0f0', color: '#333', textDecoration: 'none',
                  padding: '12px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15,
                }}
              >
                🏠 Inicio
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
