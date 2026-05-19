'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

/* ─── Pasos del tour ──────────────────────────────────────────────────────── */
const STEPS = [
  {
    selector: '[data-tour="publish"]',
    emoji:    '📦',
    title:    '¡Publica tu primer trueque!',
    message:  'Presiona aquí para publicar lo que quieres intercambiar. Sube fotos, describe el objeto y dile a la comunidad qué buscas a cambio.',
  },
  {
    selector: '[data-tour="search"]',
    emoji:    '🔍',
    title:    'Busca lo que necesitas',
    message:  'Escribe lo que estás buscando — zapatillas, libros, tecnología... Filtra por región, categoría y condición para encontrarlo más rápido.',
  },
  {
    selector: '[data-tour="match"]',
    emoji:    '🤝',
    title:    'Haz Match con lo que te gusta',
    message:  'En cada publicación verás el botón Match. Al presionarlo se abre un chat directo con el dueño para coordinar el intercambio.',
  },
  {
    selector: '[data-tour="chats"]',
    emoji:    '💬',
    title:    'Tus conversaciones',
    message:  'Aquí están todos tus chats activos. Habla directamente con la otra persona para coordinar el trueque de forma segura y rápida.',
  },
  {
    selector: '[data-tour="agreements"]',
    emoji:    '📋',
    title:    'Formaliza el trato con un Acuerdo',
    message:  'Cuando lleguen a un trato, crea un Acuerdo. Ambas partes deben confirmarlo — así queda todo registrado y con respaldo.',
  },
  {
    selector: '[data-tour="notifications"]',
    emoji:    '🔔',
    title:    'Notificaciones en tiempo real',
    message:  '¡No te pierdas nada! Te avisamos cuando alguien te haga Match, responda tu chat o confirme un Acuerdo.',
  },
  {
    selector: '[data-tour="truqui"]',
    emoji:    '👋',
    title:    '¡Siempre aquí para ayudarte!',
    message:  'Soy Truqui, tu asistente de trueque. Si tienes dudas, preguntas o necesitas ayuda con algo, ¡solo presióname y estaré aquí!',
  },
];

const PAD    = 14;   // padding alrededor del elemento destacado
const CARD_W = 320;  // ancho de la tarjeta

/* ─── Componente ──────────────────────────────────────────────────────────── */
export default function TruquiTour() {
  const [active, setActive] = useState(false);
  const [step,   setStep]   = useState(0);
  const [spot,   setSpot]   = useState(null);  // rect del spotlight
  const [pos,    setPos]    = useState(null);  // posición de la tarjeta
  const [vis,    setVis]    = useState(false); // listo para fade-in
  const timerRef = useRef(null);

  /* ── Escuchar evento externo (desde TruquiBot) ─────────────────────── */
  useEffect(() => {
    const handler = () => launch(0);
    window.addEventListener('start-truqui-tour', handler);
    return () => window.removeEventListener('start-truqui-tour', handler);
  }, []);

  /* ── Auto-start en primera visita ─────────────────────────────────── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('truqui_tour_v1')) return;
    const t = setTimeout(() => launch(0), 3000);
    return () => clearTimeout(t);
  }, []);

  /* ── Bloquear scroll mientras el tour está activo ─────────────────── */
  useEffect(() => {
    if (active) document.body.style.overflow = 'hidden';
    else        document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [active]);

  /* ── Calcular posiciones al cambiar de paso ────────────────────────── */
  useEffect(() => {
    if (!active) return;
    setVis(false);
    clearTimeout(timerRef.current);

    const { selector } = STEPS[step];
    const el = selector ? document.querySelector(selector) : null;

    if (!el) {
      // Elemento no encontrado → tarjeta centrada, sin spotlight
      setSpot(null);
      const left = Math.max(16, (window.innerWidth  - CARD_W) / 2);
      const top  = Math.max(80, (window.innerHeight - 260)    / 2);
      setPos({ top, left, arrow: null, arrowX: 0 });
      timerRef.current = setTimeout(() => setVis(true), 80);
      return;
    }

    // Scroll suave al elemento
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    timerRef.current = setTimeout(() => {
      const r    = el.getBoundingClientRect();
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      const s = {
        top:    r.top    - PAD,
        left:   r.left   - PAD,
        width:  r.width  + PAD * 2,
        height: r.height + PAD * 2,
      };
      setSpot(s);

      // ── Posición vertical de la tarjeta ─────────────────────────────
      const cardH    = 252;
      const gap      = 18;
      const below    = winH - (s.top + s.height);
      const above    = s.top;
      let cardTop, arrow;

      if (below >= cardH + gap) {
        cardTop = s.top + s.height + gap;
        arrow   = 'top';
      } else if (above >= cardH + gap) {
        cardTop = s.top - cardH - gap;
        arrow   = 'bottom';
      } else {
        cardTop = Math.max(8, (winH - cardH) / 2);
        arrow   = null;
      }

      // ── Posición horizontal de la tarjeta ────────────────────────────
      const spotCX  = s.left + s.width / 2;
      let   cardLeft = spotCX - CARD_W / 2;
      cardLeft = Math.max(12, Math.min(cardLeft, winW - CARD_W - 12));

      // Offset de la flecha dentro de la tarjeta
      const arrowX = Math.max(28, Math.min(spotCX - cardLeft, CARD_W - 28));

      setPos({ top: cardTop, left: cardLeft, arrow, arrowX });
      timerRef.current = setTimeout(() => setVis(true), 80);
    }, 360);

    return () => clearTimeout(timerRef.current);
  }, [step, active]);

  /* ── Recalcular al redimensionar ventana ────────────────────────────── */
  useEffect(() => {
    if (!active) return;
    const onResize = () => { setVis(false); setStep(s => s); }; // re-trigger
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [active]);

  /* ── Helpers ───────────────────────────────────────────────────────── */
  function launch(startStep = 0) {
    setStep(startStep);
    setSpot(null);
    setPos(null);
    setVis(false);
    setActive(true);
  }

  function goNext() {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else finish();
  }
  function goPrev()  { if (step > 0) setStep(s => s - 1); }
  function finish()  { setActive(false); localStorage.setItem('truqui_tour_v1', '1'); }

  /* ── Render ─────────────────────────────────────────────────────────── */
  if (!active || !pos) return null;

  const cur = STEPS[step];

  return (
    <div className="tt-wrap" onPointerDown={e => e.stopPropagation()}>

      {/* Fondo oscuro (solo cuando no hay spotlight) */}
      {!spot && <div className="tt-dim" />}

      {/* Spotlight */}
      {spot && (
        <div
          className={`tt-spot${vis ? ' tt-spot--on' : ''}`}
          style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
        />
      )}

      {/* Tarjeta */}
      <div
        className={`tt-card${vis ? ' tt-card--on' : ''}`}
        style={{ top: pos.top, left: pos.left, width: CARD_W }}
      >
        {/* Flecha arriba */}
        {pos.arrow === 'top' && (
          <div className="tt-arrow tt-arrow--top" style={{ left: pos.arrowX }} />
        )}

        {/* ── Encabezado ─────────────────────────────── */}
        <div className="tt-head">
          <div className="tt-head-img">
            <Image
              src="/truqui.png"
              alt="Truqui"
              width={58}
              height={58}
              style={{ objectFit: 'contain' }}
            />
          </div>
          <div className="tt-head-info">
            <span className="tt-head-name">Truqui te guía</span>
            <span className="tt-head-sub">Tour de la plataforma</span>
          </div>
          <div className="tt-head-badge">
            <span className="tt-badge-n">{step + 1}</span>
            <span className="tt-badge-t">/{STEPS.length}</span>
          </div>
        </div>

        {/* ── Cuerpo ──────────────────────────────────── */}
        <div className="tt-body">
          <p className="tt-title">{cur.emoji} {cur.title}</p>
          <p className="tt-msg">{cur.message}</p>

          {/* Dots de progreso */}
          <div className="tt-dots">
            {STEPS.map((_, i) => (
              <button
                key={i}
                className={`tt-dot${i === step ? ' tt-dot--on' : ''}`}
                onClick={() => setStep(i)}
                aria-label={`Ir al paso ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* ── Pie ─────────────────────────────────────── */}
        <div className="tt-foot">
          <button className="tt-skip" onClick={finish}>Saltar</button>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button className="tt-prev" onClick={goPrev}>← Atrás</button>
            )}
            <button className="tt-next" onClick={goNext}>
              {step === STEPS.length - 1 ? '¡Listo! 🎉' : 'Siguiente →'}
            </button>
          </div>
        </div>

        {/* Flecha abajo */}
        {pos.arrow === 'bottom' && (
          <div className="tt-arrow tt-arrow--bot" style={{ left: pos.arrowX }} />
        )}
      </div>
    </div>
  );
}
