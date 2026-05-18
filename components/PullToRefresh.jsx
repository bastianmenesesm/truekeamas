'use client';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';

const THRESHOLD   = 72;  // px necesarios para disparar el refresh
const MAX_PULL    = 110; // px máximos que puede tirar el usuario
const RESIST      = 0.4; // factor de resistencia al arrastrar

export default function PullToRefresh() {
  const { loadProducts } = useApp();

  const startYRef    = useRef(0);
  const pullDistRef  = useRef(0);
  const isPullingRef = useRef(false);
  const refreshedRef = useRef(false);

  const [pullDist,   setPullDist]   = useState(0);   // px actuales
  const [state,      setState]      = useState('idle'); // idle | pulling | releasing | done

  useEffect(() => {
    function canPull() {
      // Solo activar si el scroll está al tope
      return window.scrollY === 0 || document.documentElement.scrollTop === 0;
    }

    function onTouchStart(e) {
      if (!canPull()) return;
      startYRef.current   = e.touches[0].clientY;
      isPullingRef.current = false;
      refreshedRef.current = false;
    }

    function onTouchMove(e) {
      if (!canPull() && !isPullingRef.current) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy <= 0) {
        // Scrolling hacia arriba → no hacer nada
        isPullingRef.current = false;
        pullDistRef.current  = 0;
        setPullDist(0);
        setState('idle');
        return;
      }

      // Primer movimiento hacia abajo
      if (!isPullingRef.current) {
        isPullingRef.current = true;
      }

      // Aplicar resistencia para sensación nativa
      const dist = Math.min(dy * RESIST, MAX_PULL);
      pullDistRef.current = dist;
      setPullDist(dist);
      setState(dist >= THRESHOLD ? 'releasing' : 'pulling');

      // Prevenir el scroll nativo mientras tiramos
      if (dy > 0) {
        e.preventDefault();
      }
    }

    function onTouchEnd() {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;

      if (pullDistRef.current >= THRESHOLD && !refreshedRef.current) {
        refreshedRef.current = true;
        setState('done');
        // Breve pausa visual antes de recargar
        setTimeout(async () => {
          await loadProducts();
          setPullDist(0);
          setState('idle');
          refreshedRef.current = false;
        }, 600);
      } else {
        // No llegó al umbral → volver al estado inicial
        setPullDist(0);
        setState('idle');
      }
      pullDistRef.current = 0;
    }

    document.addEventListener('touchstart',  onTouchStart, { passive: true });
    document.addEventListener('touchmove',   onTouchMove,  { passive: false });
    document.addEventListener('touchend',    onTouchEnd,   { passive: true });
    document.addEventListener('touchcancel', onTouchEnd,   { passive: true });

    return () => {
      document.removeEventListener('touchstart',  onTouchStart);
      document.removeEventListener('touchmove',   onTouchMove);
      document.removeEventListener('touchend',    onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [loadProducts]);

  // Nada que mostrar en estado idle y sin pull
  if (state === 'idle' && pullDist === 0) return null;

  const progress = Math.min(pullDist / THRESHOLD, 1); // 0 → 1
  const isDone   = state === 'done';
  const isReady  = state === 'releasing' || isDone;

  return (
    <div
      className="ptr-wrap"
      style={{
        position:          'fixed',
        top:               0,
        left:              0,
        right:             0,
        zIndex:            9999,
        display:           'flex',
        justifyContent:    'center',
        alignItems:        'flex-end',
        height:            isDone ? 64 : Math.max(pullDist, 0),
        transition:        state !== 'pulling' ? 'height .3s cubic-bezier(.4,0,.2,1)' : 'none',
        pointerEvents:     'none',
        paddingBottom:     10,
      }}
    >
      <div
        style={{
          width:            42,
          height:           42,
          borderRadius:     '50%',
          background:       'var(--cd)',
          boxShadow:        '0 2px 12px rgba(0,0,0,.18)',
          display:          'flex',
          alignItems:       'center',
          justifyContent:   'center',
          opacity:          Math.max(progress * 1.5, isDone ? 1 : 0),
          transform:        `scale(${0.5 + progress * 0.5})`,
          transition:       state !== 'pulling' ? 'transform .3s, opacity .3s' : 'none',
        }}
      >
        {isDone ? (
          /* Spinner girando cuando está recargando */
          <div
            style={{
              width:         22,
              height:        22,
              border:        '2.5px solid var(--ln)',
              borderTop:     '2.5px solid var(--v)',
              borderRadius:  '50%',
              animation:     'ptr-spin .7s linear infinite',
            }}
          />
        ) : (
          /* Flecha que rota según el progreso */
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke={isReady ? 'var(--v)' : 'var(--mu)'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform:  `rotate(${isReady ? 180 : progress * 180}deg)`,
              transition: 'transform .2s, stroke .2s',
            }}
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        )}
      </div>
    </div>
  );
}
