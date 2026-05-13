'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

const REASONS = [
  { value: 'scam',           label: 'Estafa o fraude' },
  { value: 'harassment',     label: 'Acoso o bullying' },
  { value: 'fake_profile',   label: 'Perfil falso / suplantación' },
  { value: 'spam',           label: 'Spam o publicidad no deseada' },
  { value: 'inappropriate',  label: 'Comportamiento inapropiado' },
  { value: 'other',          label: 'Otro motivo' },
];

export default function ReportUserModal({ userId }) {
  const { currentUser, closeModal, showToast } = useApp();
  const [reason,      setReason]      = useState('');
  const [description, setDescription] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [sent,        setSent]        = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason) { showToast('Selecciona un motivo'); return; }
    if (!currentUser) { showToast('Debes iniciar sesión'); return; }
    setLoading(true);
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/report-user', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body:    JSON.stringify({ reportedUid: userId, reason, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al denunciar');
      setSent(true);
    } catch (err) {
      showToast(err.message);
    } finally { setLoading(false); }
  }

  if (sent) return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
      <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
        Denuncia enviada
      </h3>
      <p style={{ color: 'var(--mu)', fontSize: 13.5, lineHeight: 1.6, marginBottom: 20 }}>
        Nuestro equipo revisará el caso y tomará las acciones correspondientes.
      </p>
      <button className="btn bv btn-full" onClick={closeModal}>Cerrar</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="fg">
        <label className="fd fl">Motivo de la denuncia
          <select value={reason} onChange={e => setReason(e.target.value)} required>
            <option value="">Selecciona un motivo...</option>
            {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </label>
        <label className="fd fl">Descripción <span style={{ color: 'var(--mu)', fontWeight: 400 }}>(opcional)</span>
          <textarea rows={3} placeholder="Describe brevemente el problema..."
            value={description} onChange={e => setDescription(e.target.value)}
            maxLength={500} style={{ resize: 'none' }} />
        </label>
      </div>
      <div className="ma">
        <button type="button" className="btn bo bsm" onClick={closeModal}>Cancelar</button>
        <button type="submit" className="btn bd2" disabled={loading || !reason}>
          {loading ? 'Enviando...' : '🚩 Denunciar usuario'}
        </button>
      </div>
    </form>
  );
}
