'use client';
import { useState } from 'react';
import { useApp, CATS } from '@/context/AppContext';
import { REGIONES_CHILE } from '@/lib/regions';
import ProductCard, { ProductCardSkeleton } from './ProductCard';

const CONDITIONS = ['Nuevo', 'Como nuevo', 'Buen estado', 'Usado', 'Para reparar'];

export default function ProductGrid() {
  const {
    products, userData, activeCategory, searchQuery,
    modeFilter,      setModeFilter,
    levelFilter,     setLevelFilter,
    conditionFilter, setConditionFilter,
    regionFilter,    setRegionFilter,
    communeFilter,   setCommuneFilter,
    priceFilter,     setPriceFilter,
    minPrice,        setMinPrice,
    maxPrice,        setMaxPrice,
    setActiveCategory, setSearchQuery,
    sortBy, setSortBy,
    openSidebarDrawer,
    productsLoading,
    hasMoreProducts, loadingMore, loadMoreProducts,
  } = useApp();

  const [showPriceRange, setShowPriceRange] = useState(false);

  const blockedUsers = userData?.blockedUsers || [];

  const filtered = products.filter(p => {
    if (p.status === 'blocked' || p.status === 'sold') return false;
    if (blockedUsers.includes(p.ownerId)) return false;

    // Texto
    const q = searchQuery.trim().toLowerCase();
    const bq = !q || (p.tags || []).some(t => t.includes(q))
      || [p.title, p.description, p.category, p.subcategory, p.wants, p.region, p.commune].join(' ').toLowerCase().includes(q);

    // Categoría
    const bc = activeCategory === 'all' || p.category === activeCategory;

    // Tipo de transacción
    const bm = modeFilter === 'all'
      || (modeFilter === 'barter' && p.barter)
      || (modeFilter === 'buy'    && p.buy)
      || (modeFilter === 'donate' && p.donate)
      || (modeFilter === 'mixed'  && p.mixed);

    // Nivel del publicador
    const bl = levelFilter === 'all' || (p.level || 'Nuevo') === levelFilter;

    // Condición del producto
    const bcon = conditionFilter === 'all' || (p.condition || '').startsWith(conditionFilter);

    // Región y comuna
    const br   = !regionFilter  || regionFilter  === 'all' || p.region  === regionFilter;
    const bcom = !communeFilter || communeFilter === 'all' || p.commune === communeFilter;

    // Precio (tiene precio)
    const bp = !priceFilter || (p.price && p.price > 0);

    // Rango de precio
    const min = minPrice !== '' ? Number(minPrice) : null;
    const max = maxPrice !== '' ? Number(maxPrice) : null;
    const bpr = (min === null || (p.price || 0) >= min) &&
                (max === null || (p.price || 0) <= max);

    return bq && bc && bm && bl && bcon && br && bcom && bp && bpr;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'likes')      return (b.likes || 0) - (a.likes || 0);
    if (sortBy === 'newest')     return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    if (sortBy === 'price_asc')  return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
    if (sortBy === 'rating')     return (b.ownerRatingAvg || 0) - (a.ownerRatingAvg || 0);
    return 0;
  });

  // Comunas disponibles según región seleccionada
  const availableCommunes = [...new Set(
    products
      .filter(p => {
        if (!p.commune || p.status === 'deleted') return false;
        if (regionFilter && regionFilter !== 'all') return p.region === regionFilter;
        return true;
      })
      .map(p => p.commune)
  )].sort();

  function clearFilters() {
    setActiveCategory('all');
    setSearchQuery('');
    setModeFilter('all');
    setLevelFilter('all');
    setConditionFilter('all');
    setRegionFilter('all');
    setCommuneFilter('all');
    setPriceFilter(false);
    setMinPrice('');
    setMaxPrice('');
    setShowPriceRange(false);
  }

  const activeCount = [
    activeCategory !== 'all',
    modeFilter !== 'all',
    levelFilter !== 'all',
    conditionFilter !== 'all',
    regionFilter && regionFilter !== 'all',
    communeFilter && communeFilter !== 'all',
    priceFilter,
    minPrice !== '' || maxPrice !== '',
  ].filter(Boolean).length;

  return (
    <section className="sec" id="vitrina">
      {/* Botón filtros — solo visible en móvil */}
      <button className="pg-filter-mob" onClick={openSidebarDrawer}>
        🎛️ Filtros
        {activeCount > 0 && <span className="pg-count">{activeCount}</span>}
      </button>

      <div className="pg-header">
        <div className="pg-title-row">
          <h3>Publicaciones</h3>
          {sorted.length > 0 && <span className="pg-count">{sorted.length}</span>}
          {activeCount > 0 && (
            <button className="pg-clear-btn" onClick={clearFilters}>Limpiar filtros</button>
          )}
        </div>

        <div className="pg-filters">
          {/* 1. Tipo */}
          <select className="fs" value={modeFilter} onChange={e => setModeFilter(e.target.value)}>
            <option value="all">Tipo</option>
            <option value="barter">🔄 Trueque</option>
            <option value="buy">💰 Venta</option>
            <option value="donate">🎁 Donación</option>
            <option value="mixed">⚡ Mixto</option>
          </select>

          {/* 2. Condición */}
          <select className="fs" value={conditionFilter} onChange={e => setConditionFilter(e.target.value)}>
            <option value="all">Condición</option>
            {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* 3. Región */}
          <select className="fs" value={regionFilter || 'all'} onChange={e => setRegionFilter(e.target.value)}>
            <option value="all">Región</option>
            {REGIONES_CHILE.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {/* 4. Comuna */}
          {availableCommunes.length > 0 && (
            <select className="fs" value={communeFilter} onChange={e => setCommuneFilter(e.target.value)}>
              <option value="all">Comuna</option>
              {availableCommunes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          {/* 5. Categoría */}
          <select className="fs" value={activeCategory} onChange={e => setActiveCategory(e.target.value)}>
            <option value="all">Categoría</option>
            {CATS.map(c => <option key={c.n} value={c.n}>{c.e} {c.n}</option>)}
          </select>

          {/* 6. Nivel del vendedor */}
          <select className="fs" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="all">Nivel</option>
            <option value="Confiable">⭐ Confiable</option>
            <option value="Verificado">✓ Verificado</option>
            <option value="Nuevo">🌱 Nuevo</option>
          </select>

          {/* 7. Precio — toggle rango */}
          <button
            className={`fs pg-price-btn${showPriceRange ? ' active' : ''}`}
            onClick={() => { setShowPriceRange(p => !p); if (showPriceRange) { setMinPrice(''); setMaxPrice(''); } }}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            💰 Precio {(minPrice !== '' || maxPrice !== '') && <span className="pg-count" style={{ marginLeft: 2 }}>•</span>}
          </button>

          {/* 8. Ordenar */}
          <select className="fs" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="none">Ordenar</option>
            <option value="likes">❤️ Más populares</option>
            <option value="newest">🕐 Más recientes</option>
            <option value="rating">⭐ Mejor calificados</option>
            <option value="price_asc">💰 Precio ↑</option>
            <option value="price_desc">💰 Precio ↓</option>
          </select>
        </div>

        {/* Rango de precio — se despliega al hacer click */}
        {showPriceRange && (
          <div className="pg-price-range">
            <span className="pg-price-label">Rango de precio (CLP)</span>
            <div className="pg-price-inputs">
              <input
                type="number"
                className="fs pg-price-input"
                placeholder="Mínimo"
                min="0"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
              />
              <span style={{ color: 'var(--mu)', fontSize: 13 }}>—</span>
              <input
                type="number"
                className="fs pg-price-input"
                placeholder="Máximo"
                min="0"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
              />
              {(minPrice !== '' || maxPrice !== '') && (
                <button className="pg-clear-btn" onClick={() => { setMinPrice(''); setMaxPrice(''); }}>
                  Limpiar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="pg">
        {productsLoading ? (
          Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
        ) : sorted.length === 0 ? (
          <div className="es">
            <span className="ei">🔍</span>
            <p>Sin resultados.</p>
            <button className="btn bv bsm" onClick={clearFilters}>Ver todas</button>
          </div>
        ) : (
          sorted.map(p => <ProductCard key={p.id} product={p} />)
        )}
      </div>

      {/* Cargar más */}
      {hasMoreProducts && !productsLoading && (
        <div className="pg-load-more-wrap">
          <button className="pg-load-more-btn" onClick={loadMoreProducts} disabled={loadingMore}>
            {loadingMore
              ? <><div className="sp" style={{ width: 16, height: 16, borderWidth: 2 }} />Cargando...</>
              : '⬇ Cargar más publicaciones'
            }
          </button>
        </div>
      )}
    </section>
  );
}
