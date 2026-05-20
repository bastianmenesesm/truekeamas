import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: "AIzaSyDH4TQbvRym1fkIIFwPpssU5qBENCM-GSk",
  authDomain: "truekeamas.firebaseapp.com",
  projectId: "truekeamas",
  storageBucket: "truekeamas.firebasestorage.app",
  messagingSenderId: "873643507138",
  appId: "1:873643507138:web:7eacc2a7972639b196aa5b"
};

export const app  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ── App Check ────────────────────────────────────────────────────────
// Solo en el navegador (Next.js también ejecuta código en el servidor)
if (typeof window !== 'undefined') {
  // Token de debug para desarrollo local — nunca exponer en producción
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN) {
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN;
  }
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''),
      isTokenAutoRefreshEnabled: true, // renueva el token automáticamente
    });
  } catch {
    // Ya inicializado (hot-reload en desarrollo — ignorar)
  }
}

/**
 * Optimiza una URL de Cloudinary agregando transformaciones automáticas.
 * f_auto → formato óptimo (WebP en Chrome, AVIF donde se soporte)
 * q_auto → calidad automática (reduce tamaño ~60-80%)
 * w_{width} → ancho máximo para evitar imágenes enormes
 */
export function optimizeCloudinaryUrl(url, width = 600) {
  if (!url || !url.includes('cloudinary.com')) return url;
  // Insertar transformaciones antes de "/upload/"
  return url.replace('/upload/', `/upload/f_auto,q_auto:good,w_${width},c_limit/`);
}

export async function uploadToCloudinary(file) {
  // Obtiene token del usuario activo — el API secret nunca sale del servidor (CRIT-1)
  if (!auth.currentUser) throw new Error('Debes iniciar sesión para subir imágenes');
  const idToken = await auth.currentUser.getIdToken();

  // Pide firma al servidor; el servidor usa CLOUDINARY_API_SECRET para generarla
  const sigRes = await fetch('/api/cloudinary-signature', {
    method: 'POST',
    headers: { authorization: `Bearer ${idToken}` },
  });
  if (!sigRes.ok) {
    const e = await sigRes.json().catch(() => ({}));
    throw new Error(e.error || 'Error al preparar la subida de imagen');
  }
  const { signature, timestamp, apiKey, cloudName, folder, allowedFormats } = await sigRes.json();

  const fd = new FormData();
  fd.append('file',            file);
  fd.append('api_key',         apiKey);
  fd.append('timestamp',       String(timestamp));
  fd.append('signature',       signature);
  fd.append('folder',          folder);
  fd.append('allowed_formats', allowedFormats);

  const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: fd,
  });
  const d = await r.json();
  if (d.secure_url) return d.secure_url;
  throw new Error(d.error?.message || 'Upload fallido');
}
