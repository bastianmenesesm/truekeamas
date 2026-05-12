'use client';
import { useApp } from '@/context/AppContext';
import { REGIONES_CHILE } from '@/lib/regions';
import ProductCard from './ProductCard';

export default function ProductGrid() {
  const {
    products, activeCategory, searchQuery,
    modeFilter, setModeFilter,
    levelFilter, setLevelFilter,
    regionFilter, setRegionFilter,
    setActiveCategory, setSearchQuery,
    sortBy, setSortBy,
  } = useApp();

  const filtered = products.filter(p => {
    if (p.status === 'blocked') return false;
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

  return (
    <section className="sec" id="vitrina">
      <div className="sh">
        <h3>Publicaciones</h3>
        <div className="tl">
          <select className="fs" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="likes">Más populares</option>
            <option value="newest">Más recientes</option>
            <option value="price_asc">Precio ↑</option>
            <option value="price_desc">Precio ↓</option>
          </select>
          <select className="fs" value={modeFilter} onChange={e => setModeFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="barter">Trueque</option>
            <option value="buy">Venta</option>
            <option value="donate">Donación</option>
            <option value="mixed">Mixto</option>
          </select>
          <select className="fs" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="all">Todos los niveles</option>
            <option value="Nuevo">Nuevo</option>
            <option value="Verificado">Verificado</option>
            <option value="Confiable">Confiable</option>
          </select>
          <select className="fs" value={regionFilter || 'all'} onChange={e => setRegionFilter && setRegionFilter(e.target.value)}>
            <option value="all">Todas las regiones</option>
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
