'use client';
import { useApp } from '@/context/AppContext';
import ProductCard from './ProductCard';

export default function ProductGrid() {
  const { products, activeCategory, searchQuery, modeFilter, setModeFilter, levelFilter, setLevelFilter, setActiveCategory, setSearchQuery } = useApp();

  const filtered = products.filter(p => {
    const q = searchQuery.trim().toLowerCase();
    const bq = !q || [p.title, p.owner, p.category, p.wants, p.location].join(' ').toLowerCase().includes(q);
    const bc = activeCategory === 'all' || p.category === activeCategory;
    const bm = modeFilter === 'all' || (modeFilter === 'barter' && p.barter) || (modeFilter === 'buy' && p.buy) || (modeFilter === 'mixed' && p.mixed);
    const bl = levelFilter === 'all' || p.level === levelFilter;
    return bq && bc && bm && bl;
  });

  function clearFilters() { setActiveCategory('all'); setSearchQuery(''); setModeFilter('all'); setLevelFilter('all'); }

  return (
    <section className="sec" id="vitrina">
      <div className="sh">
        <h3>Publicaciones</h3>
        <div className="tl">
          <select className="fs" value={modeFilter} onChange={e => setModeFilter(e.target.value)}>
            <option value="all">Todos los acuerdos</option>
            <option value="barter">Trueque</option>
            <option value="buy">Compra directa</option>
            <option value="mixed">Acuerdo mixto</option>
          </select>
          <select className="fs" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="all">Todos los niveles</option>
            <option value="Nuevo">Nuevo</option>
            <option value="Verificado">Verificado</option>
            <option value="Confiable">Confiable</option>
          </select>
        </div>
      </div>
      <div className="pg">
        {products.length === 0 ? (
          <div className="es"><span className="ei">🔄</span><p>Cargando...</p><div className="sp sp2" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="es"><span className="ei">🔍</span><p>Sin resultados.</p><button className="btn bv bsm" onClick={clearFilters}>Ver todas</button></div>
        ) : (
          <>
            {filtered.slice(0, 50).map(p => <ProductCard key={p.id} product={p} />)}
            {filtered.length > 50 && <div className="es" style={{ gridColumn: '1/-1' }}><p>Mostrando 50 de {filtered.length}. Usa los filtros para buscar.</p></div>}
          </>
        )}
      </div>
    </section>
  );
}
