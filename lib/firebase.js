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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
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
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', 'truekeamas');
  const r = await fetch('https://api.cloudinary.com/v1_1/dnkvgg0zi/image/upload', { method: 'POST', body: fd });
  const d = await r.json();
  if (d.secure_url) return d.secure_url;
  throw new Error(d.error?.message || 'Upload failed');
}
