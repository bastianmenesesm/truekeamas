/** @type {import('next').NextConfig} */

// ── Security headers estáticos ────────────────────────────────────────────────
// La Content-Security-Policy (CSP) NO está aquí — se genera dinámicamente en
// middleware.js con un nonce único por petición ('strict-dynamic' + nonce, MED-4).
// Aquí solo van los headers que no necesitan ser por-request.
const securityHeaders = [
  // Fuerza HTTPS durante 2 años, incluye subdominios
  { key: 'Strict-Transport-Security',  value: 'max-age=63072000; includeSubDomains; preload' },
  // Evita clickjacking
  { key: 'X-Frame-Options',            value: 'SAMEORIGIN' },
  // El navegador respeta el Content-Type declarado (evita MIME-sniffing)
  { key: 'X-Content-Type-Options',     value: 'nosniff' },
  // Información de referencia mínima
  { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
  // Deshabilita APIs del navegador que no usamos
  { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  images: {
    // Dominios externos permitidos para next/image
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
    ],
    // Cloudinary ya optimiza las imágenes — evitamos doble optimización
    // Para imágenes locales Next.js optimiza normalmente
    formats: ['image/avif', 'image/webp'],
    // Caché de imágenes optimizadas: 30 días
    minimumCacheTTL: 2592000,
  },

  // Compresión gzip/brotli para todos los assets
  compress: true,

  // Eliminar headers innecesarios que revelan la tecnología
  poweredByHeader: false,

};

export default nextConfig;
