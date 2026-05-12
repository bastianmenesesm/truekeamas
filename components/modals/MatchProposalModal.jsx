'use client';
import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { uploadToCloudinary } from '@/lib/firebase';

export default function MatchProposalModal({ productId }) {
  const { products, submitProposal, closeModal, showToast, openModal, currentUser } = useApp();
  const product = products.find(p => p.id === productId);

  const [offerType, setOfferType]     = useState('product'); // 'product' | 'money' | 'mixed'
  const [description, setDescription] = useState('');
  const [amount, setAmount]           = useState('');
  const [message, setMessage]         = useState('');
  const [photos, setPhotos]           = useState([]);
  const [uploading, setUploading]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const fileRef                       = useRef(null);

  if (!currentUser) {
    return (
      <>
        <div className="nb nbd">Debes iniciar sesión para enviar una propuesta.</div>
        <div className="ma"><button className="btn bv" onClick={() => openModal('auth')}>Iniciar sesión</button></div>
      </>
    );
  }

  if (!product) return <div className="nb nbd">Publicación no encontrada.</div>;

  const needsProduct = offerType === 'product' || offerType === 'mixed';
  const needsMoney   = offerType === 'money'   || offerType === 'mixed';

  async function handlePhotoChange(e) {
    const files = Array.from(e.target.files).slice(0, 3 - photos.length);
    for (const f of files) {
      if (!f.type.startsWith('image/')) { showToast('Solo imágenes.'); continue; }
      if (f.size > 5 * 1024 * 1024) { showToast('Imagen supera 5MB.'); continue; }
      setPhotos(prev => [...prev, { file: f, preview: URL.createObjectURL(f) }]);
    }
    e.target.value = '';
  }

  function removePhoto(i) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (needsProduct && !description.trim()) { showToast('Describe el producto que ofreces.'); return; }
    if (needsMoney && (!amount || Number(amount) <= 0)) { showToast('Ingresa un monto válido.'); return; }

    setLoading(true);
    try {
      let uploadedPhotos = [];
      if (needsProduct && photos.length > 0) {
        setUploading(true);
        uploadedPhotos = await Promise.all(photos.map(p => uploadToCloudinary(p.file)));
        setUploading(false);
      }

      await submitProposal(productId, {
        offerType,
        offerDescription: needsProduct ? description.trim() : '',
        offerPhotos: uploadedPhotos,
        offerAmount: needsMoney ? Number(amount) : null,
        message: message.trim()
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

  return (
    <form onSubmit={handleSubmit}>
      {/* Producto al que se propone */}
      <div className="proposal-target">
        <div className="proposal-target-img">
          {product.photos?.[0]
            ? <img src={product.photos[0]} alt={product.title} />
            : <span>{product.emoji || '📦'}</span>}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{product.title}</div>
          <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>
            {product.category} · {product.region || product.location || 'Chile'}
          </div>
          {product.price && (
            <div style={{ fontSize: 13, color: 'var(--v)', fontWeight: 700, marginTop: 2 }}>
              Valor ref: ${Number(product.price).toLocaleString('es-CL')}
            </div>
          )}
        </div>
      </div>

      {/* Tipo de oferta */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: 600, fontSize: 13, color: 'var(--is)', display: 'block', marginBottom: 10 }}>
          ¿Qué quieres ofrecer?
        </label>
        <div className="offer-type-grid">
          {[
            { v: 'product', icon: '📦', label: 'Un producto' },
            { v: 'money',   icon: '💵', label: 'Dinero' },
            { v: 'mixed',   icon: '🔀', label: 'Producto + Dinero' },
          ].map(opt => (
            <button
              key={opt.v} type="button"
              className={`offer-type-btn${offerType === opt.v ? ' active' : ''}`}
              onClick={() => setOfferType(opt.v)}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Descripción del producto */}
      {needsProduct && (
        <div style={{ marginBottom: 16 }}>
          <label className="fd">
            {offerType === 'mixed' ? 'Producto que ofreces' : 'Describe lo que ofreces'}
            <textarea
              placeholder="Ej: Ofrezco mi guitarra acústica Yamaha, 2 años de uso, en perfecto estado..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ minHeight: 88 }}
              required
            />
          </label>

          {/* Fotos del producto */}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--mu)', marginBottom: 8 }}>
              Fotos del producto que ofreces (máx. 3)
            </div>
            {photos.length < 3 && (
              <div className="pua" style={{ padding: '16px 20px' }} onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoChange} />
                <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
                <div style={{ fontSize: 13, color: 'var(--mu)' }}>Subir fotos (opcional)</div>
              </div>
            )}
            {photos.length > 0 && (
              <div className="pp2" style={{ marginTop: 10 }}>
                {photos.map((ph, i) => (
                  <div key={i} className="ppi">
                    <img src={ph.preview} alt="" />
                    <button type="button" onClick={() => removePhoto(i)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Monto */}
      {needsMoney && (
        <label className="fd" style={{ marginBottom: 16 }}>
          {offerType === 'mixed' ? 'Dinero adicional (CLP)' : 'Monto en pesos (CLP)'}
          <input
            type="number" min="1" step="1"
            placeholder="Ej: 15000"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />
        </label>
      )}

      {/* Mensaje personal */}
      <label className="fd" style={{ marginBottom: 8 }}>
        Mensaje para el publicador (opcional)
        <textarea
          placeholder="Ej: Hola! Me interesa mucho tu publicación, creo que podemos llegar a un buen acuerdo..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          style={{ minHeight: 72 }}
        />
      </label>

      <div className="nb" style={{ marginBottom: 16, fontSize: 12.5 }}>
        🔒 Tu nombre no será visible públicamente. El publicador solo verá tu propuesta y podrá aceptarla o declinarla.
      </div>

      <div className="ma">
        <button type="button" className="btn bo" onClick={closeModal}>Cancelar</button>
        <button type="submit" className="btn bv" disabled={loading}>
          {uploading ? '⬆️ Subiendo fotos...' : loading ? <><span className="sp" style={{ width: 15, height: 15, borderWidth: 2 }} /> Enviando...</> : '🤝 Enviar propuesta'}
        </button>
      </div>
    </form>
  );
}
