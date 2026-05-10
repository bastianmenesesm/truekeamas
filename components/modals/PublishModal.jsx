'use client';
import { useState } from 'react';
import { useApp, CATS } from '@/context/AppContext';
import { uploadToCloudinary } from '@/lib/firebase';

export default function PublishModal() {
  const { currentUser, publishProduct, closeModal, showToast, openModal } = useApp();
  const [photos, setPhotos] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!currentUser) return (
    <>
      <div className="nb nbd">Debes iniciar sesión para publicar.</div>
      <div className="ma"><button className="btn bv" onClick={() => openModal('auth')}>Iniciar sesión</button></div>
    </>
  );

  function handlePhotoChange(e) {
    const files = Array.from(e.target.files).slice(0, 2 - photos.length);
    for (const f of files) {
      if (!f.type.startsWith('image/')) { showToast('Solo imágenes.'); continue; }
      if (f.size > 5 * 1024 * 1024) { showToast('Imagen supera 5MB.'); continue; }
      setPhotos(prev => [...prev, { file: f, url: URL.createObjectURL(f) }]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    setLoading(true); setProgress(10);
    try {
      const urls = [];
      for (let i = 0; i < photos.length; i++) {
        urls.push(await uploadToCloudinary(photos[i].file));
        setProgress(10 + ((i + 1) / photos.length) * 80);
      }
      await publishProduct({
        title: fd.get('title'), category: fd.get('category'),
        price: fd.get('price') ? Number(fd.get('price')) : 0,
        location: fd.get('location') || '', wants: fd.get('wants'),
        description: fd.get('description') || '', emoji: '📦',
        buy: fd.get('buy') === 'on', mixed: fd.get('mixed') === 'on',
      }, urls);
      setProgress(100);
      showToast('¡Publicación creada! 🎉');
      closeModal();
    } catch (err) { showToast('Error: ' + err.message); }
    finally { setLoading(false); setProgress(0); }
  }

  return (
    <form onSubmit={handleSubmit} className="fg">
      <label className="fd">Título<input required name="title" placeholder="Ej: Monitor 24 pulgadas" /></label>
      <label className="fd">Categoría<select name="category">{CATS.map(c => <option key={c.n}>{c.n}</option>)}<option>Servicios</option></select></label>
      <label className="fd">Valor referencial (CLP)<input name="price" type="number" min="0" placeholder="0 = solo trueque" /></label>
      <label className="fd">Ubicación<input name="location" placeholder="Ej: Santiago, online..." /></label>
      <label className="fd fl">¿Qué buscas a cambio?<textarea required name="wants" placeholder="Ej: teclado mecánico, silla o dinero" /></label>
      <label className="fd fl">Estado del producto<textarea name="description" placeholder="Nuevo, usado, detalles importantes..." /></label>
      <div className="fl">
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--is)', marginBottom: 10 }}>📷 Fotos del producto (hasta 2)</div>
        <div className="pua">
          <input type="file" accept="image/*" multiple onChange={handlePhotoChange} disabled={photos.length >= 2} />
          <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
          <p><strong>Haz clic o arrastra fotos aquí</strong><br />JPG, PNG, WebP · Máx. 5MB</p>
        </div>
        {photos.length > 0 && (
          <div className="pp2">{photos.map((p, i) => (
            <div key={i} className="ppi"><img src={p.url} alt="" />
              <button type="button" onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}</div>
        )}
        <div className="upr"><div className="upb" style={{ width: progress + '%' }} /></div>
      </div>
      <div className="cg2 fl">
        <div className="cr"><input type="checkbox" checked disabled readOnly /><div className="ct"><strong>✅ Trueque activo (siempre)</strong><span>El corazón de Truekeamas.</span></div></div>
        <label className="cr"><input type="checkbox" name="buy" /><div className="ct"><strong>Permitir compra directa</strong><span>Precio referencial visible.</span></div></label>
        <label className="cr"><input type="checkbox" name="mixed" defaultChecked /><div className="ct"><strong>Permitir acuerdo mixto</strong><span>Producto + dinero u otro beneficio.</span></div></label>
      </div>
      <div className="nb fl">Truekeamas muestra tu publicación como vitrina. Pago y entrega se acuerdan entre usuarios.</div>
      <div className="ma fl">
        <button type="button" className="btn bo" onClick={closeModal}>Cancelar</button>
        <button className="btn bl" type="submit" disabled={loading}>{loading ? 'Publicando...' : '📤 Publicar ahora'}</button>
      </div>
    </form>
  );
}
