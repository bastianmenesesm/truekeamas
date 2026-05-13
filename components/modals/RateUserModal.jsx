'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

const LABELS = ['', 'Muy malo 😞', 'Malo 😕', 'Regular 😐', 'Bueno 😊', 'Excelente 🤩'];

export default function RateUserModal({ matchId, toUid, toName }) {
  const { currentUser, closeModal, showToast } = useApp();
  const [stars,   setStars]   = useState(0);
  const [hover,   setHover]   = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!stars) { showToast('Selecciona una calificación'); return; }
    if (!currentUser) return;
    setLoading(true);
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/rate-user', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body:    JSON.stringify({ matchId, toUid, stars, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al calificar');
      showToast('¡Calificación enviada! ⭐');
      closeModal();
    } catch (err) {
      showToast(err.message);
    } finally { setLoading(false); }
  }

  const active = hover || stars;

  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
      <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
        Calificar a {toName}
      </h3>
      <p style={{ color: 'var(--mu)', fontSize: 13.5, marginBottom: 24 }}>
        ¿Cómo fue tu experiencia con este usuario?
      </p>

      {/* Estrellas */}
      <div className="star-picker">
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s} type="button"
            className={`star-btn${active >= s ? ' active' : ''}`}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setStars(s)}
          >
            <svg viewBox="0 0 24 24" width="40" height="40"
              fill={active >= s ? '#F59E0B' : 'none'}
              stroke={active >= s ? '#F59E0B' : '#CBD5E1'}
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: 'all .15s' }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
        ))}
      </div>

      <div className="star-label" style={{ minHeight: 24 }}>
        {active > 0 ? LABELS[active] : ''}
      </div>

      <div className="fg" style={{ marginTop: 20, textAlign: 'left' }}>
        <label className="fd fl">Comentario <span style={{ color: 'var(--mu)', fontWeight: 400 }}>(opcional)</span>
          <textarea
            rows={3}
            placeholder="Cuéntale a otros sobre tu experiencia..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={300}
            style={{ resize: 'none' }}
          />
          <div style={{ fontSize: 11, color: 'var(--mu)', textAlign: 'right', marginTop: 4 }}>{comment.length}/300</div>
        </label>
      </div>

      <div className="ma">
        <button className="btn bo bsm" onClick={closeModal}>Cancelar</button>
        <button className="btn bv" onClick={handleSubmit} disabled={loading || !stars}>
          {loading ? <><span className="sp" style={{ width: 15, height: 15, borderWidth: 2, marginRight: 6 }} />Enviando...</> : '⭐ Enviar calificación'}
        </button>
      </div>
    </div>
  );
}
