'use client';
import { useApp, CATS } from '@/context/AppContext';
import { REGIONES_CHILE } from '@/lib/regions';
import ProductCard from './ProductCard';

export default function ProductGrid() {
  const {
    products, userData, activeCategory, searchQuery,
    modeFilter, setModeFilter,
    levelFilter, setLevelFilter,
    regionFilter, setRegionFilter,
    setActiveCategory, setSearchQuery,
    sortBy, setSortBy,
    openSidebarDrawer,
  } = useApp();

  const blockedUsers = userData?.blockedUsers || [];

  const filtered = products.filter(p => {
    if (p.status === 'blocked' || p.status === 'sold') return false;
    if (blockedUsers.includes(p.ownerId)) return false;
    const q = searchQuery.trim().toLowerCase();
    const tagMatch = !q || (p.tags || []).some(t => t.includes(q));
    const bq = !q || tagMatch || [p.title, p.category, p.subcategory, p.wants, p.region].join(' ').toLowerCase().includes(q);
    const bc = activeCategory === 'all' || p.category === activeCategory;
    const bm = modeFilter === 'all'
      || (modeFilter === 'barter' && p.barter)
      || (modeFilter === 'buy'    && p.buy)
      || (modeFilter === 'donate' && p.donate)
      || (modeFilter === 'mixed'  && p.mixed);
    const bl = levelFilter === 'all' || p.level === levelFilter;
    const br = !regionFilter || regionFilter === 'all' || p.region === regionFilter;
    return bq && bc && bm && bl && br;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'likes')   return (b.likes || 0) - (a.likes || 0);
    if (sortBy === 'newest')  return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    if (sortBy === 'price_asc')  return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
    return 0;
  });

  function clearFilters() {
    setActiveCategory('all'); setSearchQuery('');
    setModeFilter('all'); setLevelFilter('all');
    if (setRegionFilter) setRegionFilter('all');
  }

  const activeCount = [activeCategory !== 'all', modeFilter !== 'all', levelFilter !== 'all', regionFilter && regionFilter !== 'all'].filter(Boolean).length;

  return (
    <section className="sec" id="vitrina">
      {/* Botón filtros — solo visible en móvil (≤900px) */}
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
          <select className="fs" value={activeCategory} onChange={e => setActiveCategory(e.target.value)}>
            <option value="all">Categoría</option>
            {CATS.map(c => <option key={c.n} value={c.n}>{c.e} {c.n}</option>)}
          </select>
          <select className="fs" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="likes">Más populares</option>
            <option value="newest">Más recientes</option>
            <option value="price_asc">Precio ↑</option>
            <option value="price_desc">Precio ↓</option>
          </select>
          <select className="fs" value={modeFilter} onChange={e => setModeFilter(e.target.value)}>
            <option value="all">Tipo</option>
            <option value="barter">Trueque</option>
            <option value="buy">Venta</option>
            <option value="donate">Donación</option>
            <option value="mixed">Mixto</option>
          </select>
          <select className="fs" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="all">Nivel</option>
            <option value="Nuevo">Nuevo</option>
            <option value="Verificado">Verificado</option>
            <option value="Confiable">Confiable</option>
          </select>
          <select className="fs" value={regionFilter || 'all'} onChange={e => setRegionFilter && setRegionFilter(e.target.value)}>
            <option value="all">Región</option>
            {REGIONES_CHILE.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div className="pg">
        {products.length === 0 ? (
          <div className="es"><span className="ei">🔄</span><p>Cargando...</p><div className="sp sp2" style={{ margin: '0 auto' }} /></div>
        ) : sorted.length === 0 ? (
          <div className="es"><span className="ei">🔍</span><p>Sin resultados.</p><button className="btn bv bsm" onClick={clearFilters}>Ver todas</button></div>
        ) : (
          <>
            {sorted.slice(0, 50).map(p => <ProductCard key={p.id} product={p} />)}
            {sorted.length > 50 && <div className="es" style={{ gridColumn: '1/-1' }}><p>Mostrando 50 de {sorted.length}. Usa los filtros para buscar.</p></div>}
          </>
        )}
      </div>
    </section>
  );
}
