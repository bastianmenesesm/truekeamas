export const CATEGORIES = [
  {
    n: 'Tecnología', e: '📱',
    subs: [
      'Celulares y smartphones', 'Computadores y laptops', 'Tablets e iPads',
      'Audífonos y parlantes', 'Cámaras y fotografía', 'Consolas de videojuegos',
      'Videojuegos', 'Smartwatches y wearables', 'TV y proyectores',
      'Drones y accesorios', 'Impresoras y escáneres', 'Accesorios tech', 'Otro',
    ],
  },
  {
    n: 'Moda y Vestuario', e: '👗',
    subs: [
      'Ropa mujer', 'Ropa hombre', 'Ropa niños/as', 'Ropa unisex',
      'Calzado mujer', 'Calzado hombre', 'Calzado niños/as',
      'Bolsos y carteras', 'Accesorios (cinturones, gorras, etc.)',
      'Joyería y relojes', 'Lentes y anteojos', 'Ropa deportiva',
      'Ropa formal y de trabajo', 'Uniformes y disfraces', 'Otro',
    ],
  },
  {
    n: 'Hogar', e: '🛋️',
    subs: [
      'Muebles y living', 'Electrodomésticos grandes', 'Electrodomésticos pequeños',
      'Cocina y vajilla', 'Ropa de cama y baño', 'Decoración y adornos',
      'Iluminación', 'Herramientas y materiales', 'Jardín y terraza',
      'Organización y almacenaje', 'Cuadros y arte decorativo', 'Otro',
    ],
  },
  {
    n: 'Deportes', e: '⚽',
    subs: [
      'Fitness y gym', 'Ciclismo', 'Fútbol y deportes de equipo',
      'Natación y agua', 'Running y atletismo', 'Senderismo y outdoor',
      'Artes marciales y boxeo', 'Raqueta y pádel',
      'Ski y deportes de invierno', 'Surf y deportes acuáticos',
      'Golf', 'Escalada y boulder', 'Otro',
    ],
  },
  {
    n: 'Vehículos y Movilidad', e: '🚲',
    subs: [
      'Bicicletas', 'Scooters eléctricos y patinetes',
      'Patines y skates', 'Accesorios para automóvil',
      'Herramientas mecánicas', 'Repuestos y partes', 'Otro',
    ],
  },
  {
    n: 'Libros y Educación', e: '📚',
    subs: [
      'Novelas y ficción', 'Libros de no-ficción', 'Libros técnicos y académicos',
      'Libros infantiles y juveniles', 'Revistas y cómics',
      'Material escolar y papelería', 'Cursos e idiomas', 'Otro',
    ],
  },
  {
    n: 'Arte y Coleccionismo', e: '🎨',
    subs: [
      'Arte original (pinturas, esculturas)', 'Fotografía artística',
      'Antigüedades y objetos vintage', 'Monedas y billetes',
      'Figuras y coleccionables', 'Música (vinilos, CDs, casetes)',
      'Manualidades y materiales', 'Otro',
    ],
  },
  {
    n: 'Bebé e Infancia', e: '🍼',
    subs: [
      'Ropa bebé (0-2 años)', 'Ropa niños/as (3-12 años)',
      'Juguetes bebé (0-3 años)', 'Juguetes niños (3-12 años)',
      'Cochecitos y sillas de auto', 'Mobiliario infantil',
      'Alimentación bebé', 'Libros y artículos escolares', 'Otro',
    ],
  },
  {
    n: 'Belleza y Salud', e: '💄',
    subs: [
      'Maquillaje y cosmética', 'Cuidado de la piel', 'Cuidado del cabello',
      'Perfumes y colonias', 'Bienestar y relajación',
      'Equipo médico y ortopédico', 'Suplementos y vitaminas',
      'Higiene personal', 'Otro',
    ],
  },
  {
    n: 'Jardín y Plantas', e: '🌿',
    subs: [
      'Plantas de interior', 'Plantas de exterior', 'Cactus y suculentas',
      'Macetas y jardineras', 'Herramientas de jardín',
      'Semillas y bulbos', 'Abonos y sustratos', 'Otro',
    ],
  },
  {
    n: 'Entretenimiento', e: '🎲',
    subs: [
      'Juegos de mesa y cartas', 'Instrumentos musicales',
      'Películas y series (DVD/Blu-ray)', 'Puzles y pasatiempos',
      'Material para fiestas', 'Escape rooms y juegos colectivos', 'Otro',
    ],
  },
  {
    n: 'Oficina y Negocio', e: '💼',
    subs: [
      'Muebles de oficina', 'Material de oficina', 'Equipamiento comercial',
      'Herramientas de negocio', 'Publicidad y señalética', 'Otro',
    ],
  },
  {
    n: 'Servicios', e: '🔧',
    subs: [
      'Clases y tutorías', 'Diseño y tecnología', 'Gastronomía y cocina',
      'Bienestar y masajes', 'Oficios (plomería, electricidad, etc.)',
      'Limpieza y orden', 'Transporte y mudanzas',
      'Fotografía y video', 'Música y entretenimiento', 'Otro',
    ],
  },
  {
    n: 'Otros', e: '📦',
    subs: [
      'Objetos variados', 'Artículos de regalo', 'Sin categoría específica',
    ],
  },
];

// Para backwards compatibility con AppContext
export const CATS = CATEGORIES.map(({ n, e }) => ({ n, e }));

/**
 * Convierte el nombre de una categoría en un slug URL-amigable.
 * Ej: "Moda y Vestuario" → "moda-y-vestuario"
 * Ej: "Bebé e Infancia"  → "bebe-e-infancia"
 */
export function categoryToSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // quitar tildes
    .replace(/[^a-z0-9\s-]/g, '')      // quitar caracteres especiales
    .trim()
    .replace(/\s+/g, '-');             // espacios → guiones
}

/**
 * Devuelve el objeto de categoría que corresponde a un slug.
 * Retorna undefined si no encuentra coincidencia.
 */
export function slugToCategory(slug) {
  return CATEGORIES.find(c => categoryToSlug(c.n) === slug);
}
