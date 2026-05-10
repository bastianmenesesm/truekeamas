'use client';
import { useState } from 'react';
import { useApp, CATS } from '@/context/AppContext';
import { uploadToCloudinary } from '@/lib/firebase';
import { SUBCATS } from '@/lib/subcategories';
import { REGIONES_CHILE } from '@/lib/regions';

export default function PublishModal() {
  const { currentUser, publishProduct, closeModal, showToast, openModal } = useApp();
  const [photos, setPhotos] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedCat, setSelectedCat] = useState(CATS[0].n);
  const [tags, setTags] = useState('');

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

  function parseTags(raw) {
    return raw.split(/[,\s#]+/).map(t => t.replace(/^#/, '').trim().toLowerCase()).filter(Boolean);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const price = fd.get('price') ? Number(fd.get('price')) : null;
    if (!price || price <= 0) { showToast('Ingresa un valor referencial para ayudar al algoritmo de matches.'); return; }
    setLoading(true); setProgress(10);
    try {
      const urls = [];
      for (let i = 0; i < photos.length; i++) {
        urls.push(await uploadToCloudinary(photos[i].file));
        setProgress(10 + ((i + 1) / photos.length) * 80);
      }
      await publishProduct({
        title: fd.get('title'),
        category: fd.get('category'),
        subcategory: fd.get('subcategory') || '',
        tags: parseTags(tags),
        price,
        region: fd.get('region') || '',
        wants: fd.get('wants'),
        description: fd.get('description') || '',
        emoji: '📦',
        buy: fd.get('buy') === 'on',
        mixed: fd.get('mixed') === 'on',
      }, urls);
      setProgress(100);
      showToast('¡Publicación creada! 🎉');
      closeModal();
    } catch (err) { showToast('Error: ' + err.message); }
    finally { setLoading(false); setProgress(0); }
  }

  const subcats = SUBCATS[selectedCat] || [];

  return (
    <form onSubmit={handleSubmit} className="fg">
      <label className="fd">Título<input required name="title" placeholder="Ej: Monitor 24 pulgadas" /></label>

      <label className="fd">Categoría
        <select name="category" value={selectedCat} onChange={e => setSelectedCat(e.target.value)}>
          {CATS.map(c => <option key={c.n}>{c.n}</option>)}
          <option>Servicios</option>
        </select>
      </label>

      <label className="fd">Subcategoría
        <select name="subcategory">
          <option value="">-- Sin subcategoría --</option>
          {subcats.map(s => <option key={s}>{s}</option>)}
        </select>
      </label>

      <label className="fd">
        Valor referencial (CLP) <span style={{ color: 'var(--dg)', fontWeight: 900 }}>*</span>
        <input name="price" type="number" min="1" required placeholder="Ej: 15000 — ayuda al algoritmo de matches" />
      </label>

      <label className="fd">Región
        <select name="region" defaultValue="">
          <option value="">-- Selecciona región --</option>
          {REGIONES_CHILE.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>

      <label className="fd fl">¿Qué buscas a cambio?<textarea required name="wants" placeholder="Ej: teclado mecánico, silla o dinero" /></label>
      <label className="fd fl">Estado del producto<textarea name="description" placeholder="Nuevo, usado, detalles importantes..." /></label>

      <label className="fd fl">
        Hashtags <span style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 400 }}>separa con comas o espacios, ej: gaming, rgb, monitor</span>
        <input
          type="text"
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="#tecnología, gaming, rgb..."
        />
        {tags && (
          <div className="tags-preview">
            {parseTags(tags).map((t, i) => <span key={i} className="tag-chip">#{t}</span>)}
          </div>
        )}
      </label>

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
