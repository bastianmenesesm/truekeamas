'use client';
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useApp } from '@/context/AppContext';

const STEPS = [
  {
    icon:   '👤',
    title:  'Completa tu perfil',
    desc:   'Agrega una foto de perfil y tu región para generar confianza con otros usuarios.',
    cta:    'Ir a mi perfil',
    modal:  'profile',
  },
  {
    icon:   '📸',
    title:  'Publica tu primer artículo',
    desc:   'Sube fotos y describe lo que quieres intercambiar, vender o donar. ¡Es gratis!',
    cta:    'Publicar ahora',
    modal:  'publish',
  },
  {
    icon:   '🔍',
    title:  '¡Explora el marketplace!',
    desc:   'Encuentra productos que te interesen y envía propuestas de trueque a otros usuarios.',
    cta:    '¡Empezar a explorar!',
    modal:  null,
  },
];

export default function OnboardingModal() {
  const { currentUser, closeModal, openModal } = useApp();
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  async function markDone() {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { onboardingDone: true });
    } catch {}
  }

  async function handleCta() {
    await markDone();
    closeModal();
    if (s.modal) setTimeout(() => openModal(s.modal), 200);
  }

  function handleNext() {
    if (isLast) { handleCta(); return; }
    setLeaving(true);
    setTimeout(() => { setStep(i => i + 1); setLeaving(false); }, 200);
  }

  async function handleSkip() {
    await markDone();
    closeModal();
  }

  return (
    <div className={`ob-wrap${leaving ? ' ob-leaving' : ''}`}>
      {/* Progress dots */}
      <div className="ob-dots">
        {STEPS.map((_, i) => (
          <span key={i} className={`ob-dot${i === step ? ' ob-dot--active' : i < step ? ' ob-dot--done' : ''}`} />
        ))}
      </div>

      {/* Content */}
      <div className="ob-icon">{s.icon}</div>
      <h2 className="ob-title">{s.title}</h2>
      <p className="ob-desc">{s.desc}</p>

      {/* Step indicator */}
      <p className="ob-step-num">Paso {step + 1} de {STEPS.length}</p>

      {/* Actions */}
      <button className="btn bv btn-full ob-cta" onClick={handleNext}>
        {s.cta} {!isLast && '→'}
      </button>

      {!isLast && (
        <button className="ob-skip" onClick={handleSkip}>
          Omitir configuración
        </button>
      )}
    </div>
  );
}
