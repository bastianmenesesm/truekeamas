'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

const REASONS = [
  {
    group: '⚠️ Violencia',
    items: [
      { id: 'violence',  label: 'Violencia y comportamiento delictivo', desc: 'Incita a la violencia, promueve actividades delictivas o coordina actos de daño real.' },
      { id: 'self_harm', label: 'Seguridad y bienestar personal',       desc: 'Relacionado con suicidio, autolesiones o trastornos de conducta alimentaria.' },
    ],
  },
  {
    group: '🚫 Contenido objetable',
    items: [
      { id: 'hate_speech',    label: 'Lenguaje que incita al odio',       desc: 'Ataques basados en raza, religión, orientación sexual, género o discapacidad.' },
      { id: 'graphic',        label: 'Contenido gráfico y violento',       desc: 'Imágenes o videos con crueldad excesiva o violencia explícita.' },
      { id: 'sexual_content', label: 'Desnudos y actividad sexual',        desc: 'Contenido sexualmente explícito o explotación sexual.' },
      { id: 'harassment',     label: 'Acoso y bullying',                   desc: 'Publicaciones destinadas a humillar, amenazar o intimidar a una persona.' },
    ],
  },
  {
    group: '🛡️ Integridad y autenticidad',
    items: [
      { id: 'spam',           label: 'Spam',                              desc: 'Contenido publicitario no deseado o repetitivo y engañoso.' },
      { id: 'misinformation', label: 'Información falsa',                  desc: 'Desinformación que puede causar daño o influir en procesos civiles.' },
      { id: 'impersonation',  label: 'Suplantación de identidad',          desc: 'Cuenta o publicación que pretende ser otra persona.' },
      { id: 'regulated',      label: 'Bienes regulados',                   desc: 'Venta de armas, drogas, tabaco o productos farmacéuticos no autorizados.' },
    ],
  },
];

export default function ReportModal({ productId }) {
  const { products, reportProduct, closeModal, showToast, currentUser, openModal } = useApp();
  const product = products.find(p => p.id === productId);

  const [reason,      setReason]      = useState('');
  const [description, setDescription] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [done,        setDone]        = useState(false);

  if (!currentUser) {
    return (
      <>
        <div className="nb nbd">Debes iniciar sesión para reportar una publicación.</div>
        <div className="ma">
          <button className="btn bv" onClick={() => openModal('auth')}>Iniciar sesión</button>
        </div>
      </>
    );
  }

  if (!product) return <div className="nb nbd">Publicación no encontrada.</div>;

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
        <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 900, marginBottom: 10 }}>Denuncia enviada</h3>
        <p style={{ color: 'var(--mu)', fontSize: 14, lineHeight: 1.65, maxWidth: 340, margin: '0 auto 24px' }}>
          Gracias por ayudarnos a mantener la comunidad segura. Nuestro equipo revisará la publicación a la brevedad.
        </p>
        <button className="btn bv btn-full" onClick={closeModal}>Cerrar</button>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason) { showToast('Selecciona una causal de denuncia.'); return; }
    setLoading(true);
    try {
      await reportProduct(productId, reason, description.trim());
      setDone(true);
    } catch (err) {
      showToast(err.message || 'Error al enviar la denuncia.');
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Producto denunciado */}
      <div className="proposal-target" style={{ marginBottom: 20 }}>
        <div className="proposal-target-img">
          {product.photos?.[0]
            ? <img src={product.photos[0]} alt={product.title} />
            : <span>{product.emoji || '📦'}</span>}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{product.title}</div>
          <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>{product.category} · {product.region || 'Chile'}</div>
        </div>
      </div>

      {/* Selección de causal */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 600, fontSize: 13, color: 'var(--is)', display: 'block', marginBottom: 12 }}>
          ¿Por qué denuncias esta publicación? <span style={{ color: 'var(--dg)' }}>*</span>
        </label>

        {REASONS.map(group => (
          <div key={group.group} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mu)', letterSpacing: '.3px', textTransform: 'uppercase', marginBottom: 8 }}>
              {group.group}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {group.items.map(item => (
                <label
                  key={item.id}
                  className={`report-reason-row${reason === item.id ? ' selected' : ''}`}
                  onClick={() => setReason(item.id)}
                >
                  <div className="report-reason-radio">
                    {reason === item.id && <div className="report-reason-dot" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: reason === item.id ? 'var(--v)' : 'var(--ink)' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2, lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detalle opcional */}
      <label className="fd" style={{ marginBottom: 16 }}>
        Información adicional (opcional)
        <textarea
          placeholder="Cuéntanos con más detalle qué está pasando con esta publicación..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{ minHeight: 80 }}
          maxLength={500}
        />
        <span style={{ fontSize: 11, color: 'var(--mu)', textAlign: 'right' }}>{description.length}/500</span>
      </label>

      <div className="nb" style={{ fontSize: 12.5, marginBottom: 16 }}>
        🔒 Tu identidad será confidencial. Truekeamas revisará la denuncia y tomará las medidas correspondientes según sus políticas de uso.
      </div>

      <div className="ma">
        <button type="button" className="btn bo" onClick={closeModal}>Cancelar</button>
        <button type="submit" className="btn bd2" disabled={loading || !reason}>
          {loading
            ? <><span className="sp" style={{ width: 15, height: 15, borderWidth: 2 }} /> Enviando...</>
            : '🚩 Enviar denuncia'}
        </button>
      </div>
    </form>
  );
}
