// ── Opciones reutilizables ──────────────────────────────────────────
export const CONDITIONS = [
  'Nuevo (en caja, sin uso)',
  'Como nuevo (sin uso visible)',
  'Buen estado (uso leve)',
  'Uso visible (buen funcionamiento)',
  'Para reparar o piezas',
];

const COLORS = ['Negro', 'Blanco', 'Gris', 'Plateado', 'Dorado', 'Azul', 'Celeste', 'Rojo', 'Verde', 'Amarillo', 'Naranja', 'Rosa', 'Morado', 'Café', 'Beige', 'Multicolor', 'Otro'];
const COLORS_CLOTHING = ['Negro', 'Blanco', 'Gris', 'Azul marino', 'Celeste', 'Rojo', 'Verde', 'Amarillo', 'Naranja', 'Rosa', 'Morado', 'Café', 'Beige', 'Estampado', 'Multicolor', 'Otro'];

const BRANDS_TECH    = ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Motorola', 'LG', 'Sony', 'Nokia', 'OPPO', 'OnePlus', 'Google', 'Otro'];
const BRANDS_LAPTOP  = ['Apple', 'Lenovo', 'HP', 'Dell', 'ASUS', 'Acer', 'MSI', 'Samsung', 'Microsoft', 'Huawei', 'Otro'];
const BRANDS_AUDIO   = ['Sony', 'JBL', 'Bose', 'Samsung', 'Apple', 'Xiaomi', 'Jabra', 'Sennheiser', 'Beats', 'Anker', 'Otro'];
const BRANDS_CAMERA  = ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic', 'Olympus', 'GoPro', 'DJI', 'Otro'];
const BRANDS_CONSOLE = ['Sony (PlayStation)', 'Microsoft (Xbox)', 'Nintendo', 'Sega', 'Otro'];
const BRANDS_TV      = ['Samsung', 'LG', 'Sony', 'Hisense', 'TCL', 'Philips', 'Panasonic', 'Xiaomi', 'Otro'];
const BRANDS_FASHION = ['Zara', 'H&M', 'Mango', 'Pull&Bear', 'Nike', 'Adidas', 'Puma', 'Levi\'s', 'Tommy Hilfiger', 'Calvin Klein', 'Falabella', 'Ripley', 'Sin marca', 'Otro'];
const BRANDS_SHOE    = ['Nike', 'Adidas', 'Puma', 'New Balance', 'Converse', 'Vans', 'Reebok', 'Skechers', 'Timberland', 'Dr. Martens', 'Sin marca', 'Otro'];
const BRANDS_BIKE    = ['Trek', 'Giant', 'Specialized', 'Scott', 'Merida', 'Bianchi', 'GT', 'Cannondale', 'Otro'];

const SIZES_W   = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '34', '36', '38', '40', '42', '44', '46', '48+'];
const SIZES_M   = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const SIZES_K   = ['0-3 meses', '3-6 meses', '6-9 meses', '9-12 meses', '1-2 años', '2-3 años', '3-4 años', '4-5 años', '5-6 años', '6-7 años', '8-9 años', '10-11 años', '11-12 años'];
const SIZES_SHOE_A = ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47+'];
const SIZES_SHOE_K = ['18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34'];
const STORAGES  = ['16 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB'];
const RAMS      = ['2 GB', '4 GB', '6 GB', '8 GB', '12 GB', '16 GB', '32 GB', '64 GB'];
const MATERIALS_CLOTH = ['Algodón', 'Lino', 'Seda', 'Lana', 'Poliéster', 'Nylon', 'Denim', 'Cuero', 'Cuero sintético', 'Mezcla', 'Otro'];

// ── Grupos de campos por subcategoría ───────────────────────────────
export const FIELD_GROUPS = {

  // TECNOLOGÍA
  'Celulares y smartphones': [
    { id: 'brand',    label: 'Marca',            type: 'select', options: BRANDS_TECH, required: true },
    { id: 'model',    label: 'Modelo',           type: 'text',   placeholder: 'Ej: iPhone 15 Pro, Galaxy S24', required: true },
    { id: 'storage',  label: 'Almacenamiento',   type: 'select', options: STORAGES },
    { id: 'color',    label: 'Color',            type: 'select', options: COLORS },
    { id: 'carrier',  label: 'Operador / Chip',  type: 'select', options: ['Libre (desbloqueado)', 'Entel', 'Claro', 'Movistar', 'WOM', 'GTD', 'Otro'] },
    { id: 'screen',   label: 'Estado pantalla',  type: 'select', options: ['Sin rayones', 'Rayones leves (no perceptibles en uso)', 'Rayones visibles', 'Pantalla con daños'] },
  ],
  'Computadores y laptops': [
    { id: 'brand',     label: 'Marca',            type: 'select', options: BRANDS_LAPTOP, required: true },
    { id: 'model',     label: 'Modelo',           type: 'text',   placeholder: 'Ej: MacBook Air M2, ThinkPad X1', required: true },
    { id: 'processor', label: 'Procesador',       type: 'select', options: ['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'Apple M1', 'Apple M2', 'Apple M3', 'Otro'] },
    { id: 'ram',       label: 'RAM',              type: 'select', options: RAMS },
    { id: 'storage',   label: 'Almacenamiento',   type: 'select', options: ['256 GB SSD', '512 GB SSD', '1 TB SSD', '2 TB SSD', '500 GB HDD', '1 TB HDD', '2 TB HDD', 'Otro'] },
    { id: 'screen_size', label: 'Tamaño pantalla', type: 'select', options: ['11"', '12"', '13"', '14"', '15"', '15.6"', '16"', '17"', 'Otro'] },
    { id: 'color',     label: 'Color',            type: 'select', options: COLORS },
  ],
  'Tablets e iPads': [
    { id: 'brand',   label: 'Marca',          type: 'select', options: ['Apple (iPad)', 'Samsung', 'Xiaomi', 'Lenovo', 'Huawei', 'Amazon Kindle', 'Otro'], required: true },
    { id: 'model',   label: 'Modelo',         type: 'text',   placeholder: 'Ej: iPad Air 5, Galaxy Tab S9' },
    { id: 'storage', label: 'Almacenamiento', type: 'select', options: STORAGES },
    { id: 'connectivity', label: 'Conectividad', type: 'select', options: ['Solo Wi-Fi', 'Wi-Fi + Cellular'] },
    { id: 'color',   label: 'Color',          type: 'select', options: COLORS },
  ],
  'Audífonos y parlantes': [
    { id: 'brand',        label: 'Marca',             type: 'select', options: BRANDS_AUDIO, required: true },
    { id: 'model',        label: 'Modelo',            type: 'text',   placeholder: 'Ej: WH-1000XM5, AirPods Pro' },
    { id: 'type_audio',   label: 'Tipo',              type: 'select', options: ['Audífonos in-ear', 'Audífonos over-ear', 'Audífonos on-ear', 'Parlante portátil', 'Parlante de escritorio', 'Soundbar', 'Barra de sonido'] },
    { id: 'connectivity', label: 'Conexión',          type: 'select', options: ['Bluetooth', 'Con cable (3.5mm)', 'Con cable (USB)', 'Con cable + Bluetooth', 'Wi-Fi'] },
    { id: 'color',        label: 'Color',             type: 'select', options: COLORS },
    { id: 'noise_cancel', label: 'Cancelación ruido', type: 'select', options: ['Sí, activa (ANC)', 'Sí, pasiva', 'No'] },
  ],
  'Cámaras y fotografía': [
    { id: 'brand',      label: 'Marca',     type: 'select', options: BRANDS_CAMERA, required: true },
    { id: 'model',      label: 'Modelo',    type: 'text',   placeholder: 'Ej: EOS R50, Alpha A7 IV' },
    { id: 'type_camera', label: 'Tipo',     type: 'select', options: ['Cámara DSLR', 'Cámara mirrorless', 'Cámara compacta', 'Cámara de acción (GoPro, etc.)', 'Drone con cámara', 'Objetivo / Lente', 'Flash y accesorios'] },
    { id: 'color',      label: 'Color',     type: 'select', options: ['Negro', 'Plateado', 'Blanco', 'Otro'] },
    { id: 'includes',   label: 'Incluye',   type: 'select', options: ['Solo cuerpo', 'Con lente kit', 'Kit completo (lente + accesorios)', 'Solo lente', 'Otro'] },
  ],
  'Consolas de videojuegos': [
    { id: 'brand',   label: 'Marca / Sistema', type: 'select', options: BRANDS_CONSOLE, required: true },
    { id: 'model',   label: 'Modelo',          type: 'text',   placeholder: 'Ej: PS5, Xbox Series X, Nintendo Switch OLED' },
    { id: 'storage', label: 'Almacenamiento',  type: 'select', options: STORAGES },
    { id: 'color',   label: 'Color',           type: 'select', options: COLORS },
    { id: 'includes', label: 'Incluye',        type: 'select', options: ['Solo consola', 'Con 1 control', 'Con 2 controles', 'Bundle con juegos', 'Pack completo'] },
  ],
  'Videojuegos': [
    { id: 'platform', label: 'Plataforma', type: 'select', options: ['PlayStation 5', 'PlayStation 4', 'PlayStation 3', 'Xbox Series X/S', 'Xbox One', 'Nintendo Switch', 'PC (físico)', 'PC (código digital)', 'Otro'], required: true },
    { id: 'genre',    label: 'Género',     type: 'select', options: ['Acción / Aventura', 'RPG', 'Deportes', 'Carreras', 'Shooter', 'Estrategia', 'Plataformas', 'Terror / Survival', 'Simulación', 'Otros'] },
    { id: 'region',   label: 'Región',     type: 'select', options: ['Zona 1 (América)', 'Zona 2 (Europa)', 'Zona 3 (Asia)', 'Sin región (universal)'] },
    { id: 'edition',  label: 'Edición',    type: 'select', options: ['Estándar', 'Edición de lujo', 'GOTY / Completo', 'Edición de coleccionista', 'Digital'] },
  ],
  'Smartwatches y wearables': [
    { id: 'brand',  label: 'Marca',          type: 'select', options: ['Apple', 'Samsung', 'Xiaomi', 'Garmin', 'Fitbit', 'Huawei', 'Amazfit', 'Otro'], required: true },
    { id: 'model',  label: 'Modelo',         type: 'text',   placeholder: 'Ej: Apple Watch Series 9, Galaxy Watch 6' },
    { id: 'size_watch', label: 'Tamaño',     type: 'select', options: ['38mm', '40mm', '41mm', '42mm', '44mm', '45mm', '46mm', 'Otro'] },
    { id: 'color',  label: 'Color',          type: 'select', options: COLORS },
    { id: 'compatibility', label: 'Compatible con', type: 'select', options: ['iOS (iPhone)', 'Android', 'iOS y Android'] },
  ],
  'TV y proyectores': [
    { id: 'brand',      label: 'Marca',        type: 'select', options: BRANDS_TV, required: true },
    { id: 'screen_size', label: 'Tamaño',      type: 'select', options: ['24"', '32"', '40"', '43"', '50"', '55"', '60"', '65"', '70"', '75"', '80"+', 'Otro'] },
    { id: 'resolution', label: 'Resolución',   type: 'select', options: ['HD (720p)', 'Full HD (1080p)', '4K UHD', '8K', 'Otro'] },
    { id: 'type_tv',    label: 'Tipo',         type: 'select', options: ['Smart TV', 'TV normal', 'Proyector', 'Monitor TV'] },
    { id: 'color',      label: 'Color',        type: 'select', options: ['Negro', 'Blanco', 'Plateado', 'Otro'] },
  ],

  // MODA
  'Ropa mujer': [
    { id: 'type_clothing', label: 'Tipo de prenda', type: 'select', options: ['Polera / Camiseta', 'Blusa / Camisa', 'Vestido', 'Falda', 'Pantalón / Jeans', 'Shorts', 'Chaqueta / Abrigo', 'Polera de frio / Sweatshirt', 'Pijama / Ropa de dormir', 'Traje de baño', 'Ropa de ejercicio', 'Otro'], required: true },
    { id: 'size',  label: 'Talla',    type: 'select', options: SIZES_W, required: true },
    { id: 'color', label: 'Color',    type: 'select', options: COLORS_CLOTHING },
    { id: 'brand', label: 'Marca',    type: 'select', options: BRANDS_FASHION },
    { id: 'material', label: 'Material', type: 'select', options: MATERIALS_CLOTH },
  ],
  'Ropa hombre': [
    { id: 'type_clothing', label: 'Tipo de prenda', type: 'select', options: ['Polera / Camiseta', 'Camisa', 'Pantalón / Jeans', 'Shorts', 'Chaqueta / Abrigo', 'Polera de frio / Sweatshirt', 'Traje / Blazer', 'Pijama', 'Ropa de ejercicio', 'Otro'], required: true },
    { id: 'size',  label: 'Talla',    type: 'select', options: SIZES_M, required: true },
    { id: 'color', label: 'Color',    type: 'select', options: COLORS_CLOTHING },
    { id: 'brand', label: 'Marca',    type: 'select', options: BRANDS_FASHION },
    { id: 'material', label: 'Material', type: 'select', options: MATERIALS_CLOTH },
  ],
  'Ropa niños/as': [
    { id: 'type_clothing', label: 'Tipo de prenda', type: 'select', options: ['Polera', 'Pantalón', 'Vestido / Falda', 'Chaqueta', 'Conjunto', 'Pijama', 'Disfraz', 'Otro'], required: true },
    { id: 'size',   label: 'Talla',  type: 'select', options: SIZES_K, required: true },
    { id: 'gender', label: 'Género', type: 'select', options: ['Niña', 'Niño', 'Unisex'] },
    { id: 'color',  label: 'Color',  type: 'select', options: COLORS_CLOTHING },
    { id: 'brand',  label: 'Marca',  type: 'select', options: [...BRANDS_FASHION, 'Mimo', 'EPK', 'Carter\'s', 'Otro'] },
  ],
  'Ropa unisex': [
    { id: 'type_clothing', label: 'Tipo de prenda', type: 'select', options: ['Polera', 'Pantalón', 'Buzo / Jogger', 'Chaqueta', 'Otro'] },
    { id: 'size',  label: 'Talla', type: 'select', options: SIZES_M },
    { id: 'color', label: 'Color', type: 'select', options: COLORS_CLOTHING },
    { id: 'brand', label: 'Marca', type: 'select', options: BRANDS_FASHION },
  ],
  'Calzado mujer': [
    { id: 'type_shoe', label: 'Tipo de calzado', type: 'select', options: ['Zapatillas deportivas', 'Zapatillas casuales', 'Botines', 'Botas', 'Tacones / Zapatos', 'Sandalias', 'Ballerinas', 'Pantuflas', 'Otro'], required: true },
    { id: 'size', label: 'Talla', type: 'select', options: SIZES_SHOE_A, required: true },
    { id: 'color', label: 'Color', type: 'select', options: COLORS },
    { id: 'brand', label: 'Marca', type: 'select', options: BRANDS_SHOE },
    { id: 'material', label: 'Material', type: 'select', options: ['Cuero', 'Cuero sintético', 'Tela / Textil', 'Goma', 'Otro'] },
  ],
  'Calzado hombre': [
    { id: 'type_shoe', label: 'Tipo de calzado', type: 'select', options: ['Zapatillas deportivas', 'Zapatillas casuales', 'Zapatos formales', 'Botines', 'Botas', 'Sandalias', 'Pantuflas', 'Otro'], required: true },
    { id: 'size', label: 'Talla', type: 'select', options: SIZES_SHOE_A, required: true },
    { id: 'color', label: 'Color', type: 'select', options: COLORS },
    { id: 'brand', label: 'Marca', type: 'select', options: BRANDS_SHOE },
    { id: 'material', label: 'Material', type: 'select', options: ['Cuero', 'Cuero sintético', 'Tela / Textil', 'Goma', 'Otro'] },
  ],
  'Calzado niños/as': [
    { id: 'type_shoe', label: 'Tipo de calzado', type: 'select', options: ['Zapatillas', 'Zapatos escolares', 'Botines', 'Sandalias', 'Botas', 'Otro'], required: true },
    { id: 'size',   label: 'Talla',  type: 'select', options: SIZES_SHOE_K, required: true },
    { id: 'gender', label: 'Género', type: 'select', options: ['Niña', 'Niño', 'Unisex'] },
    { id: 'color',  label: 'Color',  type: 'select', options: COLORS },
    { id: 'brand',  label: 'Marca',  type: 'select', options: BRANDS_SHOE },
  ],
  'Bolsos y carteras': [
    { id: 'type_bag', label: 'Tipo', type: 'select', options: ['Cartera', 'Bolso grande', 'Mochila', 'Bolso de mano (clutch)', 'Riñonera', 'Tote bag', 'Maletín', 'Otro'], required: true },
    { id: 'color',    label: 'Color',    type: 'select', options: COLORS },
    { id: 'brand',    label: 'Marca',    type: 'select', options: ['Louis Vuitton', 'Gucci', 'Prada', 'Michael Kors', 'Coach', 'Zara', 'H&M', 'Sin marca', 'Otro'] },
    { id: 'material', label: 'Material', type: 'select', options: ['Cuero genuino', 'Cuero sintético', 'Tela / Lona', 'Piel de animal', 'Nylon', 'Otro'] },
  ],

  // HOGAR
  'Muebles y living': [
    { id: 'type_furniture', label: 'Tipo de mueble', type: 'select', options: ['Sofá / Sillón', 'Mesa de comedor', 'Silla', 'Cama / Sommier', 'Closet / Armario', 'Escritorio', 'Librero / Estantería', 'Mesa de centro', 'Mueble TV', 'Cajonera', 'Otro'], required: true },
    { id: 'color',    label: 'Color',    type: 'select', options: COLORS },
    { id: 'material', label: 'Material', type: 'select', options: ['Madera sólida', 'MDF / Aglomerado', 'Metal', 'Vidrio', 'Plástico', 'Tapizado', 'Mezcla', 'Otro'] },
    { id: 'assembly', label: 'Requiere armado', type: 'select', options: ['Listo para usar', 'Requiere armado', 'Semi-armado'] },
  ],
  'Electrodomésticos grandes': [
    { id: 'type_app', label: 'Tipo', type: 'select', options: ['Refrigerador / Frigorífico', 'Lavadora', 'Secadora', 'Lavavajillas', 'Cocina / Horno', 'Microondas', 'Calefont', 'Aire acondicionado', 'Otro'], required: true },
    { id: 'brand',    label: 'Marca',  type: 'select', options: ['Samsung', 'LG', 'Whirlpool', 'Mabe', 'Fensa', 'Bosch', 'Electrolux', 'Sindelen', 'Otro'] },
    { id: 'color',    label: 'Color',  type: 'select', options: ['Inox / Acero', 'Blanco', 'Negro', 'Gris', 'Otro'] },
    { id: 'voltage',  label: 'Voltaje', type: 'select', options: ['110V', '220V', 'Universal'] },
  ],

  // DEPORTES
  'Ciclismo': [
    { id: 'type_bike', label: 'Tipo de bicicleta', type: 'select', options: ['Mountain Bike (MTB)', 'Ruta / Carretera', 'Urbana / City', 'BMX', 'Eléctrica', 'Plegable', 'Niño/a', 'Otra'], required: true },
    { id: 'frame_size', label: 'Talla de cuadro', type: 'select', options: ['13"', '15"', '17"', '19"', '21"', 'XS', 'S', 'M', 'L', 'XL', 'No aplica / Niño'] },
    { id: 'wheel_size', label: 'Aro de rueda', type: 'select', options: ['12"', '16"', '20"', '24"', '26"', '27.5" (650b)', '29"', '700c', 'Otro'] },
    { id: 'color',      label: 'Color',         type: 'select', options: COLORS },
    { id: 'brand',      label: 'Marca',         type: 'select', options: BRANDS_BIKE },
    { id: 'gears',      label: 'Velocidades',   type: 'select', options: ['1 velocidad (single speed)', '3', '6', '7', '8', '9', '10', '11', '12', '21', '24', 'Otra'] },
  ],

  // LIBROS
  'Novelas y ficción': [
    { id: 'genre', label: 'Género', type: 'select', options: ['Novela', 'Ciencia ficción', 'Fantasía', 'Thriller / Misterio', 'Romance', 'Terror', 'Histórica', 'Juvenil', 'Otro'], required: true },
    { id: 'language', label: 'Idioma', type: 'select', options: ['Español', 'Inglés', 'Otro'] },
    { id: 'year', label: 'Año de edición', type: 'select', options: ['Antes de 2000', '2000-2010', '2011-2015', '2016-2020', '2021 en adelante'] },
  ],
  'Libros técnicos y académicos': [
    { id: 'subject', label: 'Materia', type: 'select', options: ['Medicina / Salud', 'Derecho', 'Ingeniería', 'Arquitectura', 'Economía / Negocios', 'Informática / Tecnología', 'Ciencias exactas', 'Educación', 'Psicología', 'Otro'], required: true },
    { id: 'language', label: 'Idioma', type: 'select', options: ['Español', 'Inglés', 'Otro'] },
  ],

  // BEBÉ
  'Ropa bebé (0-2 años)': [
    { id: 'size',   label: 'Talla',  type: 'select', options: ['RN (Recién nacido)', '0-3 meses', '3-6 meses', '6-9 meses', '9-12 meses', '12-18 meses', '18-24 meses'], required: true },
    { id: 'gender', label: 'Género', type: 'select', options: ['Bebé niña', 'Bebé niño', 'Unisex'] },
    { id: 'type_clothing', label: 'Tipo', type: 'select', options: ['Body', 'Pelele / Mameluco', 'Conjunto', 'Abriguito / Saco', 'Pijama', 'Otro'] },
    { id: 'color',  label: 'Color',  type: 'select', options: COLORS_CLOTHING },
  ],

  // JARDÍN Y PLANTAS
  'Plantas de interior': [
    { id: 'plant_type', label: 'Tipo / Nombre de la planta', type: 'text', placeholder: 'Ej: Potus, Monstera, Helecho, Ficus…', required: true },
    { id: 'size',     label: 'Tamaño',  type: 'select', options: ['Pequeña (hasta 20 cm)', 'Mediana (20–50 cm)', 'Grande (50 cm+)'] },
    { id: 'light',    label: 'Luz',     type: 'select', options: ['Luz directa (sol)', 'Luz indirecta', 'Poca luz / Sombra'] },
    { id: 'watering', label: 'Riego',   type: 'select', options: ['Frecuente (diario)', 'Moderado (2–3 veces/semana)', 'Escaso (1 vez/semana)', 'Muy escaso (cactus)'] },
    { id: 'with_pot', label: 'Incluye maceta', type: 'select', options: ['Sí, con maceta', 'Solo la planta', 'A convenir'] },
  ],
  'Plantas de exterior': [
    { id: 'plant_type', label: 'Tipo / Nombre de la planta', type: 'text', placeholder: 'Ej: Rosal, Lavanda, Árbol limón…', required: true },
    { id: 'size',      label: 'Tamaño',    type: 'select', options: ['Pequeña (hasta 30 cm)', 'Mediana (30–80 cm)', 'Grande (80 cm+)', 'Árbol / Arbusto'] },
    { id: 'flowering', label: 'Florece',   type: 'select', options: ['Sí', 'No', 'Estacional'] },
    { id: 'with_pot',  label: 'Incluye maceta', type: 'select', options: ['Sí', 'No', 'A convenir'] },
  ],
  'Cactus y suculentas': [
    { id: 'plant_type', label: 'Tipo / Nombre', type: 'text', placeholder: 'Ej: Echeveria, Aloe vera, Haworthia…' },
    { id: 'size',     label: 'Tamaño',  type: 'select', options: ['Mini (hasta 5 cm)', 'Pequeña (5–15 cm)', 'Mediana (15–30 cm)', 'Grande (30 cm+)'] },
    { id: 'with_pot', label: 'Incluye maceta', type: 'select', options: ['Sí, con maceta', 'Solo la planta', 'A convenir'] },
  ],
  'Macetas y jardineras': [
    { id: 'material', label: 'Material', type: 'select', options: ['Barro / Terracota', 'Plástico', 'Cerámica esmaltada', 'Metal', 'Madera', 'Tela / Geotextil', 'Piedra / Cemento', 'Otro'] },
    { id: 'size',  label: 'Tamaño (diámetro)', type: 'select', options: ['Pequeña (hasta 15 cm)', 'Mediana (15–30 cm)', 'Grande (30–50 cm)', 'Muy grande (50 cm+)'] },
    { id: 'color', label: 'Color', type: 'select', options: COLORS },
  ],
  'Herramientas de jardín': [
    { id: 'type_tool', label: 'Tipo de herramienta', type: 'select', options: ['Pala', 'Rastrillo', 'Tijeras de poda', 'Regadera', 'Manguera y accesorios', 'Cortacésped', 'Cultivador / Azada', 'Kit completo', 'Otro'] },
  ],
  'Semillas y bulbos': [
    { id: 'plant_type', label: 'Tipo de planta', type: 'text', placeholder: 'Ej: Tomate, Amapola, Tulipán…', required: true },
    { id: 'quantity', label: 'Cantidad', type: 'select', options: ['1–5 unidades', '6–20 unidades', '21–50 unidades', '50+ unidades', 'Paquete sellado original'] },
    { id: 'season',   label: 'Temporada de siembra', type: 'select', options: ['Primavera', 'Verano', 'Otoño', 'Invierno', 'Todo el año'] },
  ],
  'Abonos y sustratos': [
    { id: 'type_product', label: 'Tipo de producto', type: 'select', options: ['Sustrato universal', 'Sustrato para cactus', 'Abono orgánico sólido', 'Abono líquido', 'Compost', 'Arena gruesa', 'Perlita', 'Humus de lombriz', 'Otro'] },
    { id: 'quantity', label: 'Cantidad', type: 'select', options: ['Menos de 1 kg', '1–5 kg', '5–20 kg', '20 kg+'] },
  ],

  // SERVICIOS
  'Clases y tutorías': [
    { id: 'subject',  label: 'Materia / Área',  type: 'select', options: ['Matemáticas', 'Lenguaje y Comunicación', 'Ciencias', 'Historia', 'Inglés', 'Otro idioma', 'Programación', 'Arte y Música', 'PSU / PAES', 'Universitario', 'Otro'], required: true },
    { id: 'level',    label: 'Nivel',            type: 'select', options: ['Básica (1° a 6°)', 'Media (7° a 4° Medio)', 'Universitario / Técnico', 'Adultos'] },
    { id: 'modality', label: 'Modalidad',        type: 'select', options: ['Presencial', 'Online (videollamada)', 'Presencial u Online (flexible)'] },
  ],
  'Diseño y tecnología': [
    { id: 'type_service', label: 'Tipo de servicio', type: 'select', options: ['Diseño gráfico', 'Diseño web', 'Desarrollo web / app', 'Community manager', 'Fotografía', 'Video y edición', 'Impresión 3D', 'Otro'], required: true },
    { id: 'modality',     label: 'Modalidad',        type: 'select', options: ['Presencial', 'Remoto / Online', 'Ambas'] },
  ],
  'Oficios y reparaciones': [
    { id: 'type_service', label: 'Tipo de servicio', type: 'select', options: ['Plomería / Gasfitería', 'Electricidad', 'Pintura', 'Carpintería', 'Soldadura', 'Cerrajería', 'Computadores y electrónica', 'Electrodomésticos', 'Climatización', 'Otro'], required: true },
    { id: 'modality', label: 'Modalidad', type: 'select', options: ['Presencial (domicilio)', 'En taller', 'Ambas'] },
  ],
  'Oficios (plomería, electricidad, etc.)': [
    { id: 'type_service', label: 'Tipo de oficio', type: 'select', options: ['Gasfitería / Plomería', 'Electricidad', 'Pintura interior/exterior', 'Carpintería', 'Soldadura', 'Cerrajería', 'Reparación electrodomésticos', 'Climatización / Aire acondicionado', 'Otro'], required: true },
    { id: 'modality', label: 'Modalidad', type: 'select', options: ['A domicilio', 'En taller', 'Ambas'] },
  ],
  'Gastronomía y cocina': [
    { id: 'type_service', label: 'Tipo de servicio', type: 'select', options: ['Chef a domicilio', 'Catering para eventos', 'Repostería y pasteles', 'Preparación comida semanal', 'Clases de cocina', 'Comida para llevar', 'Otro'], required: true },
    { id: 'modality', label: 'Modalidad', type: 'select', options: ['A domicilio', 'En local propio', 'Online (clases)', 'Retiro en punto'] },
  ],
  'Bienestar y masajes': [
    { id: 'type_service', label: 'Tipo de servicio', type: 'select', options: ['Masaje relajante', 'Masaje deportivo / descontracturante', 'Masaje prenatal', 'Reflexología', 'Reiki y energías', 'Yoga', 'Meditación y mindfulness', 'Otro'], required: true },
    { id: 'modality',  label: 'Modalidad',         type: 'select', options: ['A domicilio', 'En consulta / estudio', 'Online'] },
    { id: 'duration',  label: 'Duración de sesión', type: 'select', options: ['30 min', '45 min', '60 min', '90 min', '2 horas', 'A convenir'] },
  ],
  'Limpieza y orden': [
    { id: 'type_service', label: 'Tipo de servicio', type: 'select', options: ['Limpieza de hogar', 'Limpieza de oficinas', 'Limpieza post-obra', 'Organización y orden', 'Lavado de alfombras y tapices', 'Lavado de vehículos', 'Desinfección', 'Otro'], required: true },
    { id: 'frequency', label: 'Frecuencia',   type: 'select', options: ['Una vez (servicio puntual)', 'Semanal', 'Quincenal', 'Mensual', 'A convenir'] },
  ],
  'Transporte y mudanzas': [
    { id: 'type_service', label: 'Tipo de servicio', type: 'select', options: ['Mudanza completa', 'Mudanza parcial / flete', 'Transporte de muebles', 'Flete en camioneta', 'Mensajería y encargos', 'Otro'], required: true },
    { id: 'vehicle', label: 'Vehículo disponible', type: 'select', options: ['Auto / Van pequeña', 'Camioneta', 'Camión pequeño (3/4)', 'Camión mediano', 'Moto / A pie'] },
  ],
  'Fotografía y video': [
    { id: 'type_service', label: 'Tipo de servicio', type: 'select', options: ['Fotografía de eventos', 'Fotografía de productos', 'Retrato / Sesión personal', 'Fotografía inmobiliaria', 'Video y edición', 'Drone / Aéreo', 'Video corporativo', 'Otro'], required: true },
    { id: 'modality', label: 'Modalidad', type: 'select', options: ['En estudio propio', 'A domicilio / En terreno', 'Edición remota'] },
  ],
  'Música y entretenimiento': [
    { id: 'type_service', label: 'Tipo de servicio', type: 'select', options: ['Músico en vivo', 'Banda', 'DJ', 'Animación infantil', 'Animación de eventos', 'Mago', 'Humorista / Stand-up', 'Karaoke', 'Otro'], required: true },
    { id: 'event_type', label: 'Tipo de evento',   type: 'select', options: ['Cumpleaños', 'Matrimonio / Boda', 'Evento corporativo', 'Quinceaños', 'Baby shower', 'Fiesta infantil', 'Cualquier evento'] },
    { id: 'duration',   label: 'Duración del show', type: 'select', options: ['1 hora', '2 horas', '3 horas', '4+ horas', 'A convenir'] },
  ],
};

// Campos por defecto si no hay grupo específico para la subcategoría
export const DEFAULT_FIELDS = [
  { id: 'color', label: 'Color', type: 'select', options: COLORS },
  { id: 'brand', label: 'Marca / Fabricante', type: 'text', placeholder: 'Ej: Samsung, Ikea, Genérico...' },
];

// ── Campos por defecto según categoría ──────────────────────────────
// Si una subcategoría no tiene FIELD_GROUPS propio, se usa este mapa.
// Las categorías con [] no muestran campos extra (ej. servicios, plantas).
export const CATEGORY_DEFAULT_FIELDS = {
  'Servicios':        [],   // servicios: sin color/marca
  'Jardín y Plantas': [],   // plantas: subcategorías tienen sus propios campos
};

// ── Lógica de "Condición" ────────────────────────────────────────────
// Categorías completas donde la condición NO aplica (servicios, intangibles)
export const NO_CONDITION_CATEGORIES = new Set([
  'Servicios',
]);

// Subcategorías específicas donde la condición NO aplica (cosas vivas, orgánicas o digitales)
export const NO_CONDITION_SUBCATEGORIES = new Set([
  // Jardín y Plantas — seres vivos / insumos
  'Plantas de interior',
  'Plantas de exterior',
  'Cactus y suculentas',
  'Semillas y bulbos',
  'Abonos y sustratos',
  // Libros y Educación — servicios o contenido digital
  'Cursos e idiomas',
]);
