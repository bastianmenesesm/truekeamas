/** @type {import('next').NextConfig} */

const CSP = [
  "default-src 'self'",
  // Next.js requiere unsafe-inline/unsafe-eval para su runtime
  // google.com y recaptcha.google.com necesarios para reCAPTCHA v3 (App Check)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com https://www.google.com https://recaptcha.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Imágenes: Cloudinary, avatares de Google, Firebase Storage
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.googleusercontent.com https://firebasestorage.googleapis.com https://www.gstatic.com",
  "font-src 'self' https://fonts.gstatic.com",
  // Conexiones: Firebase Auth, Firestore, Realtime DB (wss), Cloudinary upload
  "connect-src 'self' https://*.googleapis.com https://*.google.com wss://*.firebaseio.com https://*.firebaseio.com https://res.cloudinary.com https://api.cloudinary.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com",
  // Frames: Google Sign-in popup, Firebase Auth redirect y reCAPTCHA
  "frame-src https://*.firebaseapp.com https://accounts.google.com https://www.google.com https://recaptcha.google.com",
  "object-src 'none'",   // bloquea Flash y plugins
  "base-uri 'self'",     // evita inyección de <base>
  "form-action 'self'",  // formularios solo a mismo origen
].join('; ');

const securityHeaders = [
  // Fuerza HTTPS durante 2 años, incluye subdominios
  { key: 'Strict-Transport-Security',  value: 'max-age=63072000; includeSubDomains; preload' },
  // Evita clickjacking (la página no puede cargarse en un iframe externo)
  { key: 'X-Frame-Options',            value: 'SAMEORIGIN' },
  // Evita MIME-sniffing (el navegador respeta el Content-Type declarado)
  { key: 'X-Content-Type-Options',     value: 'nosniff' },
  // Controla qué información de referencia se envía
  { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
  // Deshabilita APIs del navegador que no usamos
  { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // Content Security Policy: define fuentes permitidas de scripts, estilos, imágenes, etc.
  { key: 'Content-Security-Policy',    value: CSP },
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
};

export default nextConfig;
