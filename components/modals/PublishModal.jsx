'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CATEGORIES } from '@/lib/categories';
import { uploadToCloudinary } from '@/lib/firebase';
import { FIELD_GROUPS, DEFAULT_FIELDS, CONDITIONS } from '@/lib/productFields';
import { REGIONES_CHILE } from '@/lib/regions';

const ACTIONS = [
  { id: 'cambiar', icon: '🔄', label: 'Trueque',  desc: 'Intercambia por otro producto o servicio' },
  { id: 'vender',  icon: '💰', label: 'Vender',   desc: 'Vende a precio fijo o negociable' },
  { id: 'mixto',   icon: '⚡', label: 'Mixto',    desc: 'Trueque + dinero o ambos' },
  { id: 'donar',   icon: '🎁', label: 'Donar',    desc: 'Regala a quien más lo necesita' },
];

export default function PublishModal() {
  const { currentUser, publishProduct, closeModal, showToast, openModal } = useApp();

  const [step, setStep]           = useState(1);
  const [action, setAction]       = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedSub, setSelectedSub] = useState('');
  const [photos, setPhotos]       = useState([]);
  const [progress, setProgress]   = useState(0);
  const [loading, setLoading]     = useState(false);
  const [extraFields, setExtraFields] = useState({});

  if (!currentUser) return (
    <>
      <div className="nb nbd">Debes iniciar sesión para publicar.</div>
      <div className="ma"><button className="btn bv" onClick={() => openModal('auth')}>Iniciar sesión</button></div>
    </>
  );

  /* ── Helpers ───────────────────────────────── */
  const catObj   = CATEGORIES.find(c => c.n === selectedCat);
  const subList  = catObj?.subs || [];
  const dynFields = selectedSub ? (FIELD_GROUPS[selectedSub] || DEFAULT_FIELDS) : DEFAULT_FIELDS;

  function handlePhotoChange(e) {
    const files = Array.from(e.target.files).slice(0, 5 - photos.length);
    for (const f of files) {
      if (!f.type.startsWith('image/')) { showToast('Solo imágenes.'); continue; }
      if (f.size > 8 * 1024 * 1024) { showToast('Imagen supera 8MB.'); continue; }
      setPhotos(prev => [...prev, { file: f, url: URL.createObjectURL(f) }]);
    }
  }

  function removePhoto(i) { setPhotos(prev => prev.filter((_, j) => j !== i)); }

  function handleExtra(id, val) { setExtraFields(prev => ({ ...prev, [id]: val })); }

  function canGoStep2() { return !!action; }
  function canGoStep3() { return !!selectedCat; }

  /* ── Submit ────────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);

    const title = fd.get('title')?.trim();
    if (!title) { showToast('Agrega un título.'); return; }
    if (!selectedCat) { showToast('Elige una categoría.'); return; }

    const price = fd.get('price') ? Number(fd.get('price')) : null;
    if ((action === 'vender' || action === 'mixto') && (!price || price <= 0)) {
      showToast('Ingresa un precio para este tipo de publicación.'); return;
    }

    setLoading(true); setProgress(10);
    try {
      const urls = [];
      for (let i = 0; i < photos.length; i++) {
        urls.push(await uploadToCloudinary(photos[i].file));
        setProgress(10 + ((i + 1) / Math.max(photos.length, 1)) * 80);
      }

      await publishProduct({
        action,
        title,
        category: selectedCat,
        subcategory: selectedSub || '',
        condition: fd.get('condition') || '',
        price: price || null,
        region: fd.get('region') || '',
        wants: fd.get('wants') || '',
        description: fd.get('description') || '',
        emoji: catObj?.e || '📦',
        ...extraFields,
      }, urls);

      setProgress(100);
      showToast('¡Publicación creada! 🎉');
      closeModal();
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      setLoading(false); setProgress(0);
    }
  }

  /* ── Render ──────────────────────────────────── */
  return (
    <div className="pub-wrap">

      {/* Step indicator */}
      <div className="pub-steps">
        {[1, 2, 3].map(n => (
          <div key={n} className={`pub-step-dot${step >= n ? ' done' : ''}${step === n ? ' current' : ''}`}>
            <span>{n}</span>
          </div>
        ))}
        <div className="pub-steps-line" style={{ width: `${((step - 1) / 2) * 100}%` }} />
      </div>

      {/* ─────── STEP 1: Tipo de acción ─────── */}
      {step === 1 && (
        <div>
          <h3 className="pub-step-title">¿Qué quieres hacer?</h3>
          <div className="pub-action-grid">
            {ACTIONS.map(a => (
              <button
                key={a.id}
                type="button"
                className={`pub-action-btn${action === a.id ? ' selected' : ''}`}
                onClick={() => setAction(a.id)}
              >
                <span className="pub-action-icon">{a.icon}</span>
                <strong>{a.label}</strong>
                <span className="pub-action-desc">{a.desc}</span>
              </button>
            ))}
          </div>
          <div className="pub-nav">
            <button type="button" className="btn bo" onClick={closeModal}>Cancelar</button>
            <button type="button" className="btn bv" onClick={() => canGoStep2() && setStep(2)} disabled={!canGoStep2()}>
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* ─────── STEP 2: Categoría ──────────── */}
      {step === 2 && (
        <div>
          <h3 className="pub-step-title">¿Qué categoría?</h3>
          <div className="pub-cat-grid">
            {CATEGORIES.map(c => (
              <button
                key={c.n}
                type="button"
                className={`pub-cat-btn${selectedCat === c.n ? ' selected' : ''}`}
                onClick={() => { setSelectedCat(c.n); setSelectedSub(''); }}
              >
                <span className="pub-cat-emoji">{c.e}</span>
                <span className="pub-cat-label">{c.n}</span>
              </button>
            ))}
          </div>

          {selectedCat && subList.length > 0 && (
            <div className="pub-subcat">
              <label className="fd" style={{ marginBottom: 0 }}>
                Subcategoría <span style={{ color: 'var(--mu)', fontWeight: 400 }}>(opcional)</span>
                <select value={selectedSub} onChange={e => setSelectedSub(e.target.value)} className="fs" style={{ marginTop: 8 }}>
                  <option value="">— Sin especificar —</option>
                  {subList.map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>
          )}

          <div className="pub-nav">
            <button type="button" className="btn bo" onClick={() => setStep(1)}>← Atrás</button>
            <button type="button" className="btn bv" onClick={() => canGoStep3() && setStep(3)} disabled={!canGoStep3()}>
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* ─────── STEP 3: Detalles ───────────── */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="fg">

          {/* Título */}
          <label className="fd">
            Título <span style={{ color: 'var(--dg)' }}>*</span>
            <input required name="title" placeholder={`Ej: ${selectedSub || selectedCat} en buen estado`} />
          </label>

          {/* Condición */}
          {action !== 'donar' && (
            <label className="fd">
              Condición <span style={{ color: 'var(--dg)' }}>*</span>
              <select name="condition" required defaultValue="">
                <option value="" disabled>— Selecciona condición —</option>
                {CONDITIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
          )}

          {/* Campos dinámicos por subcategoría */}
          {dynFields.length > 0 && (
            <div className="pub-dyn-fields">
              <div className="pub-dyn-label">Detalles de {selectedSub || selectedCat}</div>
              {dynFields.map(f => (
                <label key={f.id} className="fd">
                  {f.label} {f.required && <span style={{ color: 'var(--dg)' }}>*</span>}
                  {f.type === 'select' ? (
                    <select
                      value={extraFields[f.id] || ''}
                      onChange={e => handleExtra(f.id, e.target.value)}
                      required={f.required}
                      defaultValue=""
                    >
                      <option value="">— Selecciona —</option>
                      {f.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={extraFields[f.id] || ''}
                      onChange={e => handleExtra(f.id, e.target.value)}
                      placeholder={f.placeholder || ''}
                      required={f.required}
                    />
                  )}
                </label>
              ))}
            </div>
          )}

          {/* Precio */}
          {action !== 'donar' && (
            <label className="fd">
              Precio referencial (CLP)
              {(action === 'vender' || action === 'mixto') && <span style={{ color: 'var(--dg)' }}> *</span>}
              <input
                name="price"
                type="number"
                min="1"
                required={action === 'vender' || action === 'mixto'}
                placeholder={action === 'cambiar' ? 'Opcional — ayuda en el match' : 'Ej: 15.000'}
              />
            </label>
          )}

          {/* Qué busca (solo si no es venta ni donación) */}
          {(action === 'cambiar' || action === 'mixto') && (
            <label className="fd fl">
              ¿Qué buscas a cambio? <span style={{ color: 'var(--dg)' }}>*</span>
              <textarea required name="wants" placeholder="Ej: teclado mecánico, silla ergonómica, o efectivo" rows={2} />
            </label>
          )}

          {/* Región */}
          <label className="fd">
            Región
            <select name="region" defaultValue="">
              <option value="">— Selecciona región —</option>
              {REGIONES_CHILE.map(r => <option key={r}>{r}</option>)}
            </select>
          </label>

          {/* Descripción libre */}
          <label className="fd fl">
            Descripción adicional <span style={{ color: 'var(--mu)', fontWeight: 400 }}>(opcional)</span>
            <textarea name="description" placeholder="Detalles sobre el estado, accesorios incluidos, condiciones del intercambio…" rows={3} />
          </label>

          {/* Fotos */}
          <div className="pub-photos-section">
            <div className="pub-photos-label">
              📷 Fotos <span style={{ color: 'var(--mu)', fontWeight: 400 }}>(hasta 5)</span>
            </div>
            <div className="pub-photos-row">
              {photos.map((ph, i) => (
                <div key={i} className="pub-photo-thumb">
                  <img src={ph.url} alt="" />
                  <button type="button" className="pub-photo-rm" onClick={() => removePhoto(i)}>✕</button>
                  {i === 0 && <span className="pub-photo-main">Principal</span>}
                </div>
              ))}
              {photos.length < 5 && (
                <label className="pub-photo-add">
                  <input type="file" accept="image/*" multiple onChange={handlePhotoChange} style={{ display: 'none' }} />
                  <span>+</span>
                  <span style={{ fontSize: 11 }}>Foto</span>
                </label>
              )}
            </div>
            <div className="upr"><div className="upb" style={{ width: progress + '%' }} /></div>
          </div>

          <div className="nb fl">Truekeamas es un escaparate. El pago y la entrega se coordinan entre usuarios.</div>

          <div className="pub-nav fl">
            <button type="button" className="btn bo" onClick={() => setStep(2)}>← Atrás</button>
            <button type="submit" className="btn bl" disabled={loading}>
              {loading ? 'Publicando…' : '📤 Publicar ahora'}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
