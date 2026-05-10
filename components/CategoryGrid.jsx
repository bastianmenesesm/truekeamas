'use client';
import { useApp, CATS } from '@/context/AppContext';

export default function CategoryGrid() {
  const { activeCategory, setActiveCategory, setSearchQuery, setModeFilter, setLevelFilter } = useApp();
  function clearFilters() { setActiveCategory('all'); setSearchQuery(''); setModeFilter('all'); setLevelFilter('all'); }
  return (
    <section className="sec" id="categorias">
      <div className="sh">
        <h3>Categorías populares</h3>
        <button className="lk" onClick={clearFilters}>Ver todas</button>
      </div>
      <div className="cg">
        {CATS.map(c => (
          <button key={c.n} className={`ci${activeCategory === c.n ? ' active' : ''}`}
            onClick={() => setActiveCategory(activeCategory === c.n ? 'all' : c.n)}>
            <div className="ce">{c.e}</div>{c.n}
          </button>
        ))}
      </div>
    </section>
  );
}
