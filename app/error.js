'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log en producción — reemplazar con Sentry si se agrega luego
    console.error('[App Error]', error);
  }, [error]);

  return (
    <div className="nf-root">
      <div className="nf-card">
        <div className="nf-emoji">⚠️</div>
        <h2 className="nf-title" style={{ fontSize: 32 }}>Algo salió mal</h2>
        <p className="nf-sub">
          Ocurrió un error inesperado. Puedes intentar recargar la página.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          <button
            className="btn bv"
            style={{ padding: '12px 28px' }}
            onClick={reset}
          >
            🔄 Intentar de nuevo
          </button>
          <a href="/" className="btn bo" style={{ padding: '12px 28px' }}>
            🏠 Volver al inicio
          </a>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details style={{ marginTop: 24, textAlign: 'left', fontSize: 12, color: 'var(--mu)' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Ver detalle del error</summary>
            <pre style={{ marginTop: 8, padding: 12, background: 'var(--sf)', borderRadius: 8, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
              {error?.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
