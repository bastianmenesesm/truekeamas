'use client';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { uploadToCloudinary, optimizeCloudinaryUrl } from '@/lib/firebase';

/* ── Determina qué opciones mostrar según el tipo de publicación ── */
function getAvailableOfferTypes(product) {
  const action = product.action;

  // Donación: no requiere oferta, solo mensaje
  if (action === 'donar' || product.donate) return ['request'];

  // Solo venta
  if (action === 'vender' || (product.buy && !product.barter)) return ['money'];

  // Mixto: trueque + dinero
  if (action === 'mixto' || product.mixed) return ['product', 'money', 'mixed'];

  // Por defecto: solo trueque (cambiar o publicaciones antiguas con barter=true)
  return ['product'];
}

const OFFER_OPTIONS = {
  product: { icon: '📦', label: 'Un producto',          desc: 'Ofreces algo a cambio' },
  money:   { icon: '💵', label: 'Dinero',               desc: 'Pagas el precio pedido' },
  mixed:   { icon: '🔀', label: 'Producto + dinero',    desc: 'Combinas ambos' },
  request: { icon: '🙏', label: 'Solicitar donación',   desc: 'Pide el artículo gratuitamente' },
};

function fmtCLP(v) { return v ? '$' + Number(v).toLocaleString('es-CL') : null; }

export default function MatchProposalModal({ productId }) {
  const { products, submitProposal, closeModal, showToast, openModal, currentUser } = useApp();
  const product = products.find(p => p.id === productId);

  const availableTypes = product ? getAvailableOfferTypes(product) : ['product'];
  const [offerType, setOfferType]     = useState(availableTypes[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount]           = useState('');
  const [message, setMessage]         = useState('');
  const [photos, setPhotos]           = useState([]);
  const [uploading, setUploading]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const fileRef                       = useRef(null);

  // Si cambia la lista de tipos disponibles, resetear
  useEffect(() => { setOfferType(availableTypes[0]); }, [productId]);

  /* ── Guards ─────────────────────────────────────── */
  if (!currentUser) return (
    <>
      <div className="nb nbd">Debes iniciar sesión para enviar una propuesta.</div>
      <div className="ma"><button className="btn bv" onClick={() => openModal('auth')}>Iniciar sesión</button></div>
    </>
  );
  if (!product) return <div className="nb nbd">Publicación no encontrada.</div>;

  const needsProduct = offerType === 'product' || offerType === 'mixed';
  const needsMoney   = offerType === 'money'   || offerType === 'mixed';
  const isRequest    = offerType === 'request';

  /* ── Fotos ───────────────────────────────────────── */
  async function handlePhotoChange(e) {
    const files = Array.from(e.target.files).slice(0, 3 - photos.length);
    for (const f of files) {
      if (!f.type.startsWith('image/')) { showToast('Solo imágenes.'); continue; }
      if (f.size > 5 * 1024 * 1024) { showToast('Imagen supera 5MB.'); continue; }
      setPhotos(prev => [...prev, { file: f, preview: URL.createObjectURL(f) }]);
    }
    e.target.value = '';
  }
  function removePhoto(i) { setPhotos(prev => prev.filter((_, idx) => idx !== i)); }

  /* ── Submit ──────────────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!isRequest) {
      if (needsProduct && !description.trim()) {
        showToast('Describe el producto que ofreces.'); return;
      }
      if (needsMoney && (!amount || Number(amount) <= 0)) {
        showToast('Ingresa un monto válido.'); return;
      }
    }

    setLoading(true);
    try {
      let uploadedPhotos = [];
      if (needsProduct && photos.length > 0) {
        setUploading(true);
        uploadedPhotos = await Promise.all(photos.map(p => uploadToCloudinary(p.file)));
        setUploading(false);
      }

      await submitProposal(productId, {
        offerType:        isRequest ? 'request' : offerType,
        offerDescription: needsProduct ? description.trim() : '',
        offerPhotos:      uploadedPhotos,
        offerAmount:      needsMoney ? Number(amount) : null,
        message:          message.trim(),
      });

      showToast('¡Propuesta enviada! El publicador recibirá tu oferta. 🤝');
      closeModal();
    } catch (err) {
      showToast(err.message || 'Error al enviar propuesta.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  const price = fmtCLP(product.price);

  return (
    <form onSubmit={handleSubmit}>

      {/* ── Resumen del producto al que se propone ── */}
      <div className="prop-target">
        <div className="prop-target-img">
          {product.photos?.[0]
            ? <img src={optimizeCloudinaryUrl(product.photos[0], 120)} alt={product.title} />
            : <span>{product.emoji || '📦'}</span>}
        </div>
        <div className="prop-target-info">
          <div className="prop-target-title">{product.title}</div>
          <div className="prop-target-meta">
            {product.category}
            {product.condition && <> · <span>{product.condition.split('(')[0].trim()}</span></>}
            {product.region && <> · {product.region}</>}
          </div>
          {price && <div className="prop-target-price">{price}</div>}
          {product.wants && (
            <div className="prop-target-wants">
              🔍 Busca: <em>{product.wants}</em>
            </div>
          )}
        </div>
      </div>

      {/* ── Selector de tipo (solo si hay más de 1 opción) ── */}
      {availableTypes.length > 1 && (
        <div className="prop-section">
          <div className="prop-section-label">¿Qué quieres ofrecer?</div>
          <div className="offer-type-grid">
            {availableTypes.map(v => {
              const opt = OFFER_OPTIONS[v];
              return (
                <button
                  key={v} type="button"
                  className={`offer-type-btn${offerType === v ? ' active' : ''}`}
                  onClick={() => setOfferType(v)}
                >
                  <span className="offer-type-icon">{opt.icon}</span>
                  <strong>{opt.label}</strong>
                  <span className="offer-type-desc">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Modo Donación: solo mensaje ── */}
      {isRequest && (
        <div className="prop-section">
          <div className="prop-info-box">
            🎁 Este artículo se dona gratis. Solo necesitas presentarte y explicar por qué lo necesitas.
          </div>
        </div>
      )}

      {/* ── Descripción del producto ofrecido ── */}
      {needsProduct && (
        <div className="prop-section">
          <label className="fd">
            {offerType === 'mixed' ? '📦 ¿Qué producto ofreces?' : '📦 ¿Qué ofreces a cambio?'}
            <textarea
              placeholder={`Ej: ${product.wants ? `El publicador busca: "${product.wants}". Describe lo que tienes…` : 'Marca, modelo, estado, accesorios incluidos…'}`}
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              required
            />
          </label>

          {/* Fotos del producto ofrecido */}
          <div className="prop-photos">
            <div className="prop-photos-label">📷 Fotos de lo que ofreces <span>(opcional, máx. 3)</span></div>
            <div className="prop-photos-row">
              {photos.map((ph, i) => (
                <div key={i} className="pub-photo-thumb">
                  <img src={ph.preview} alt="" />
                  <button type="button" className="pub-photo-rm" onClick={() => removePhoto(i)}>✕</button>
                </div>
              ))}
              {photos.length < 3 && (
                <label className="pub-photo-add">
                  <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoChange} />
                  <span>+</span>
                  <span style={{ fontSize: 11 }}>Foto</span>
                </label>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Monto en dinero ── */}
      {needsMoney && (
        <div className="prop-section">
          <label className="fd">
            {offerType === 'mixed' ? '💵 Dinero adicional (CLP)' : '💵 Monto que ofreces (CLP)'}
            {price && <span className="prop-price-hint">Valor ref: {price}</span>}
            <input
              type="number" min="1" step="1"
              placeholder="Ej: 15.000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </label>
        </div>
      )}

      {/* ── Mensaje personal ── */}
      <div className="prop-section">
        <label className="fd">
          💬 Mensaje personal {isRequest ? <span style={{ color: 'var(--dg)' }}>*</span> : <span className="prop-optional">(opcional)</span>}
          <textarea
            placeholder={isRequest
              ? '¿Por qué te gustaría recibir este artículo?'
              : '¡Hola! Me interesa tu publicación, creo que podemos llegar a un buen acuerdo…'}
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={2}
            required={isRequest}
          />
        </label>
      </div>

      <div className="nb" style={{ fontSize: 12.5, marginBottom: 16 }}>
        🔒 Tu nombre no será visible públicamente. El publicador solo verá tu propuesta y podrá aceptarla o rechazarla.
      </div>

      <div className="ma">
        <button type="button" className="btn bo" onClick={closeModal}>Cancelar</button>
        <button type="submit" className="btn bv" disabled={loading || uploading}>
          {uploading
            ? '⬆️ Subiendo fotos…'
            : loading
              ? <><span className="sp" style={{ width: 15, height: 15, borderWidth: 2 }} /> Enviando…</>
              : isRequest ? '🙏 Solicitar donación' : '🤝 Enviar propuesta'}
        </button>
      </div>
    </form>
  );
}
