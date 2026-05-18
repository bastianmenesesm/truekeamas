'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CATEGORIES } from '@/lib/categories';
import { uploadToCloudinary } from '@/lib/firebase';
import { FIELD_GROUPS, DEFAULT_FIELDS, CATEGORY_DEFAULT_FIELDS, CONDITIONS, NO_CONDITION_CATEGORIES, NO_CONDITION_SUBCATEGORIES } from '@/lib/productFields';
import { REGIONES_CHILE } from '@/lib/regions';
import { COMUNAS_POR_REGION } from '@/lib/communes';

const ACTIONS = [
  { id: 'cambiar', icon: '🔄', label: 'Trueque',  desc: 'Intercambia por otro producto o servicio' },
  { id: 'vender',  icon: '💰', label: 'Vender',   desc: 'Vende a precio fijo o negociable' },
  { id: 'mixto',   icon: '⚡', label: 'Mixto',    desc: 'Trueque + dinero o ambos' },
  { id: 'donar',   icon: '🎁', label: 'Donar',    desc: 'Regala a quien más lo necesita' },
];

/* ── Placeholders de título según categoría / subcategoría / acción ── */
const TITLE_EXAMPLES = {
  'Tecnología': {
    'Celulares y smartphones':    'Ej: iPhone 14 Pro 128GB negro, batería al 91%',
    'Computadores y laptops':     'Ej: MacBook Air M2 8GB/256GB, excelente estado',
    'Tablets e iPads':            'Ej: iPad Air 5ta gen 64GB WiFi + Smart Folio',
    'Audífonos y parlantes':      'Ej: Sony WH-1000XM5 negro, sin cable, caja original',
    'Consolas de videojuegos':    'Ej: PlayStation 5 con 2 controles y 5 juegos',
    'Videojuegos':                'Ej: The Last of Us Part II PS5, como nuevo',
    'Smartwatches y wearables':   'Ej: Apple Watch Series 8 GPS 45mm aluminio',
    'Cámaras y fotografía':       'Ej: Canon EOS R50 + lente 18-55mm, 500 disparos',
    'TV y proyectores':           'Ej: Smart TV Samsung 55" QLED 4K 2023',
    _default:                     'Ej: Router TP-Link AX3000, sin uso, caja cerrada',
  },
  'Moda y Vestuario': {
    'Ropa mujer':       'Ej: Vestido floral Zara talla S, nunca usado con etiqueta',
    'Ropa hombre':      'Ej: Chaqueta de cuero café talla L, muy buen estado',
    'Ropa niños/as':    'Ej: Set ropa invierno niño 4 años, 5 prendas H&M',
    'Calzado mujer':    'Ej: Botines cuero negro N°38, poco uso, como nuevos',
    'Calzado hombre':   'Ej: Zapatillas Nike Air Force 1 N°42, originales nuevas',
    'Bolsos y carteras':'Ej: Bolso cuero camel mediano, impecable',
    'Joyería y relojes':'Ej: Reloj Casio vintage dorado, funcionando perfecto',
    _default:           'Ej: Parka impermeable azul talla M, 1 temporada de uso',
  },
  'Hogar': {
    'Muebles y living':              'Ej: Sofá esquinero gris 3 cuerpos, buen estado',
    'Electrodomésticos grandes':     'Ej: Lavadora LG 9kg inverter, funcionando perfecto',
    'Electrodomésticos pequeños':    'Ej: Cafetera Nespresso Vertuo Plus + 20 cápsulas',
    'Cocina y vajilla':              'Ej: Juego de ollas Tramontina 7 piezas, acero inox',
    'Ropa de cama y baño':           'Ej: Juego sábanas 2 plazas algodón egipcio, nuevo',
    'Decoración y adornos':          'Ej: Cuadro abstracto enmarcado 60x80cm',
    'Herramientas y materiales':     'Ej: Taladro inalámbrico Bosch 18V + 2 baterías',
    'Jardín y terraza':              'Ej: Parrilla acero inox 60x40cm con tapa y ruedas',
    _default:                        'Ej: Escritorio esquinero blanco 120x120cm',
  },
  'Deportes': {
    'Fitness y gym':            'Ej: Bicicleta estática spinning magnética, poco uso',
    'Ciclismo':                 'Ej: Bicicleta MTB aro 27.5" talla M, frenos hidráulicos',
    'Fútbol y deportes de equipo': 'Ej: Pelota de fútbol Adidas Tango N°5, casi nueva',
    'Running y atletismo':      'Ej: Zapatillas Brooks Ghost 14 N°41, 3 salidas',
    'Senderismo y outdoor':     'Ej: Mochila trekking 50L Deuter, incluye funda lluvia',
    _default:                   'Ej: Set raquetas pádel Bullpadel + 2 paleteros',
  },
  'Vehículos y Movilidad': {
    'Bicicletas':                   'Ej: Bicicleta urbana aro 28" 7 velocidades, eje central',
    'Scooters eléctricos y patinetes': 'Ej: Scooter eléctrico Xiaomi Pro 2, batería 45km',
    'Patines y skates':             'Ej: Patines en línea K2 N°38, ruedas nuevas',
    _default:                       'Ej: Porta-bicicletas para auto, 2 espacios, aluminio',
  },
  'Libros y Educación': {
    'Novelas y ficción':            'Ej: Trilogía El Señor de los Anillos Tolkien, pasta dura',
    'Libros técnicos y académicos': 'Ej: Cálculo Larson 9ª edición + solucionario',
    'Libros infantiles y juveniles':'Ej: Colección Harry Potter 7 tomos, excelente estado',
    'Material escolar y papelería': 'Ej: Set útiles universitarios completo semestre 2024',
    _default:                       'Ej: Pack 5 novelas best-seller, varios géneros',
  },
  'Arte y Coleccionismo': {
    'Arte original (pinturas, esculturas)': 'Ej: Cuadro acrílico original 50x70cm "Paisaje Patagonia"',
    'Antigüedades y objetos vintage':       'Ej: Radio vintage Philips años 60, funcionando',
    'Figuras y coleccionables':             'Ej: Funko Pop Mandalorian #345, caja en perfecto estado',
    _default:                               'Ej: Colección monedas chilenas conmemorativas, 12 piezas',
  },
  'Bebé e Infancia': {
    'Cochecitos y sillas de auto':  'Ej: Coche Infanti Travel System, base isofix incluida',
    'Mobiliario infantil':          'Ej: Cuna convertible Kiddy 3 en 1 blanca, colchón incluido',
    'Juguetes niños (3-12 años)':   'Ej: Lego City set #60281 Helicóptero, completo con caja',
    _default:                       'Ej: Set ropa bebé 3-6 meses 10 piezas, impecable',
  },
  'Belleza y Salud': {
    'Maquillaje y cosmética':  'Ej: Paleta Urban Decay Naked 3, 80% de uso',
    'Cuidado de la piel':      'Ej: Pack rutina skincare Korean Glass Skin, sin abrir',
    'Perfumes y colonias':     'Ej: Perfume Chanel N°5 EDP 100ml, 70% restante',
    _default:                  'Ej: Secador de cabello Dyson Supersonic plateado',
  },
  'Jardín y Plantas': {
    'Plantas de interior':  'Ej: Monstera deliciosa 80cm, maceta blanca incluida',
    'Plantas de exterior':  'Ej: Rosal trepador rojo, macetón grande, florando',
    'Cactus y suculentas':  'Ej: Pack 6 suculentas variadas en macetas de barro',
    _default:               'Ej: Semillas tomate cherry orgánico, 3 sobres',
  },
  'Entretenimiento': {
    'Juegos de mesa y cartas':  'Ej: Catan + Expansión Marítima, completo perfecto estado',
    'Instrumentos musicales':   'Ej: Guitarra acústica Yamaha F310 con funda y afinador',
    'Puzles y pasatiempos':     'Ej: Puzle 1000 piezas Ravensburger "Van Gogh", armado 1 vez',
    _default:                   'Ej: Set Cluedo + Monopoly + Scrabble, todos completos',
  },
  'Oficina y Negocio': {
    'Muebles de oficina':   'Ej: Silla ergonómica Steelcase Leap V2 negra, ajuste lumbar',
    'Material de oficina':  'Ej: Impresora multifuncional HP LaserJet Pro, tóner nuevo',
    _default:               'Ej: Escritorio pie de ángel roble 160x70cm, sin rayones',
  },
  'Servicios': {
    'Clases y tutorías':    'Ej: Clases de matemáticas PSU, 1 hora online o presencial',
    'Diseño y tecnología':  'Ej: Diseño de logo + manual de marca, entrega 3 días',
    'Fotografía y video':   'Ej: Sesión fotográfica retrato 1 hora, edición incluida',
    _default:               'Ej: Servicio de gasfitería, presupuesto sin costo',
  },
  'Otros': {
    _default: 'Ej: Caja mixta de artículos de cocina, varios utensilios',
  },
};

function getTitlePlaceholder(cat, sub, action) {
  const catMap = TITLE_EXAMPLES[cat];
  if (!catMap) {
    if (action === 'donar')  return 'Ej: Ropa de invierno talla M, buen estado, regalo';
    if (action === 'vender') return 'Ej: Bicicleta urbana azul aro 28", casi nueva';
    return 'Ej: Celular Samsung Galaxy A54 128GB negro';
  }
  return catMap[sub] || catMap['_default'] || 'Ej: Producto en buen estado';
}

export default function PublishModal() {
  const { currentUser, userData, publishProduct, closeModal, showToast, openModal } = useApp();

  const [step, setStep]           = useState(1);
  const [action, setAction]       = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedSub, setSelectedSub] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(() => userData?.region || '');
  const [selectedCommune, setSelectedCommune] = useState(() => userData?.commune || '');
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
  const catObj    = CATEGORIES.find(c => c.n === selectedCat);
  const subList   = catObj?.subs || [];
  // Campos dinámicos: prioridad subcategoría → default de categoría → default global
  const catDefault = CATEGORY_DEFAULT_FIELDS[selectedCat] ?? DEFAULT_FIELDS;
  const dynFields  = selectedSub
    ? (FIELD_GROUPS[selectedSub] ?? catDefault)
    : catDefault;
  const communes  = selectedRegion ? (COMUNAS_POR_REGION[selectedRegion] || []) : [];

  // ¿La categoría/subcategoría actual necesita campo "Condición"?
  const needsCondition = !NO_CONDITION_CATEGORIES.has(selectedCat)
                      && !NO_CONDITION_SUBCATEGORIES.has(selectedSub);

  function handlePhotoChange(e) {
    const files = Array.from(e.target.files).slice(0, 5 - photos.length);
    for (const f of files) {
      if (!f.type.startsWith('image/')) { showToast('Solo imágenes.'); continue; }
      if (f.size > 8 * 1024 * 1024)    { showToast('Imagen supera 8MB.'); continue; }
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

    if (photos.length === 0) { showToast('Agrega al menos una foto de tu publicación.'); return; }
    if (!selectedRegion)    { showToast('La región es obligatoria.'); return; }
    if (!selectedCommune)   { showToast('La comuna es obligatoria.'); return; }

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
        category:    selectedCat,
        subcategory: selectedSub || '',
        condition:   fd.get('condition') || '',
        price:       price || null,
        region:      selectedRegion,
        commune:     selectedCommune,
        wants:       fd.get('wants') || '',
        description: fd.get('description') || '',
        emoji:       catObj?.e || '📦',
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
            <input
              required
              name="title"
              maxLength={120}
              placeholder={getTitlePlaceholder(selectedCat, selectedSub, action)}
            />
          </label>

          {/* Condición — solo para productos físicos con desgaste */}
          {action !== 'donar' && needsCondition && (
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
                placeholder={action === 'cambiar' ? 'Opcional — ayuda en el match' : 'Ej: 15000'}
              />
            </label>
          )}

          {/* Qué busca (solo trueque o mixto) */}
          {(action === 'cambiar' || action === 'mixto') && (
            <label className="fd fl">
              ¿Qué buscas a cambio? <span style={{ color: 'var(--dg)' }}>*</span>
              <textarea required name="wants" maxLength={300} placeholder="Ej: teclado mecánico, silla ergonómica, o efectivo" rows={2} />
            </label>
          )}

          {/* Región + Comuna en la misma fila */}
          <div className="pub-location-row">
            <label className="fd" style={{ flex: 1 }}>
              Región <span style={{ color: 'var(--dg)' }}>*</span>
              <select
                name="region"
                value={selectedRegion}
                onChange={e => { setSelectedRegion(e.target.value); setSelectedCommune(''); }}
              >
                <option value="">— Selecciona región —</option>
                {REGIONES_CHILE.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>

            <label className="fd" style={{ flex: 1 }}>
              Comuna <span style={{ color: 'var(--dg)' }}>*</span>
              <select
                name="commune"
                value={selectedCommune}
                onChange={e => setSelectedCommune(e.target.value)}
                disabled={!selectedRegion}
              >
                <option value="">{selectedRegion ? '— Selecciona comuna —' : '— Primero elige región —'}</option>
                {communes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>

          {/* Descripción libre */}
          <label className="fd fl">
            Descripción adicional <span style={{ color: 'var(--mu)', fontWeight: 400 }}>(opcional)</span>
            <textarea name="description" maxLength={800} placeholder="Detalles sobre el estado, accesorios incluidos, condiciones del intercambio…" rows={3} />
          </label>

          {/* Fotos */}
          <div className="pub-photos-section">
            <div className="pub-photos-label">
              📷 Fotos <span style={{ color: 'var(--dg)', fontWeight: 700 }}>*</span>
              <span style={{ color: 'var(--mu)', fontWeight: 400, fontSize: 12 }}> (mínimo 1, hasta 5)</span>
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
