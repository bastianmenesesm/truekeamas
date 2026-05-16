import Link from 'next/link';

export const metadata = {
  title: 'Página no encontrada | Truekeamas',
};

export default function NotFound() {
  return (
    <div className="nf-root">
      <div className="nf-card">
        <div className="nf-emoji">🔍</div>
        <h1 className="nf-title">404</h1>
        <p className="nf-sub">Esta página no existe o fue eliminada.</p>

        <div className="nf-suggestions">
          <p className="nf-sugg-label">¿Qué quieres hacer?</p>
          <div className="nf-sugg-list">
            <Link href="/" className="nf-sugg-item">
              <span>🏠</span> Volver al inicio
            </Link>
            <Link href="/?action=publish" className="nf-sugg-item">
              <span>📸</span> Publicar un artículo
            </Link>
            <Link href="/?category=Tecnología" className="nf-sugg-item">
              <span>💻</span> Explorar Tecnología
            </Link>
            <Link href="/?category=Moda y Vestuario" className="nf-sugg-item">
              <span>👗</span> Explorar Moda
            </Link>
          </div>
        </div>

        <Link href="/" className="btn bv" style={{ marginTop: 8, display: 'inline-block', padding: '12px 32px' }}>
          Ir al marketplace →
        </Link>
      </div>

      <footer style={{ marginTop: 32, color: 'var(--mu)', fontSize: 12 }}>
        © {new Date().getFullYear()} Truekeamas · Plataforma de trueque en Chile
      </footer>
    </div>
  );
}
