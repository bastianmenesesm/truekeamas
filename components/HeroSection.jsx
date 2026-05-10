'use client';
import { useApp } from '@/context/AppContext';

export default function HeroSection() {
  const { stats, openModal } = useApp();

  return (
    <section className="hero" id="inicio">
      <div className="hc">
        <div className="hl">✦ Plataforma de Trueque Digital</div>
        <h2>Intercambia lo que tienes por lo que <em>necesitas</em></h2>
        <p>Truekeamas conecta personas para hacer trueques, compras secundarias o acuerdos mixtos.</p>
        <div className="ha">
          <button className="btn bl" onClick={() => document.getElementById('vitrina')?.scrollIntoView({ behavior: 'smooth' })}>
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            Explorar productos
          </button>
          <button className="btn bg2" onClick={() => openModal('publish')}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>
            Publicar ahora
          </button>
        </div>
        <div className="hs">
          <div className="sc2"><strong>{stats.products}</strong><span>Publicaciones activas</span></div>
          <div className="sc2"><strong>{stats.users}</strong><span>Usuarios registrados</span></div>
          <div className="sc2"><strong>{stats.matches}</strong><span>Matches realizados</span></div>
        </div>
      </div>

      <div className="hv">
        <div className="pc">
          <div className="sr">
            <div className="si"><span className="se">📱</span><div className="sl">Tú ofreces</div><div className="sv">Tu producto</div></div>
            <div className="sa">⇄</div>
            <div className="si"><span className="se">💻</span><div className="sl">Recibes</div><div className="sv">Lo que buscas</div></div>
          </div>
          <div className="mb2">
            <div className="md" />
            <div><div className="mt2">¡Match en tiempo real!</div><div className="ms">Chat interno protegido</div></div>
          </div>
        </div>
      </div>
    </section>
  );
}
