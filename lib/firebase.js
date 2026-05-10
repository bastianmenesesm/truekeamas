import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
export const db = getFirestore(app);

export async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', 'truekeamas');
  const r = await fetch('https://api.cloudinary.com/v1_1/dnkvgg0zi/image/upload', { method: 'POST', body: fd });
  const d = await r.json();
  if (d.secure_url) return d.secure_url;
  throw new Error(d.error?.message || 'Upload failed');
}
