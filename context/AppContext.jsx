'use client';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updateProfile
} from 'firebase/auth';
import {
  collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc,
  query, where, orderBy, serverTimestamp
} from 'firebase/firestore';

export const CATS = [
  { n: 'Tecnología', e: '📱' }, { n: 'Hogar', e: '🛋️' }, { n: 'Deportes', e: '⚽' },
  { n: 'Moda', e: '👕' }, { n: 'Libros', e: '📘' }, { n: 'Juguetes', e: '🧸' }
];

const AppContext = createContext(null);

const _rl = {};
function rateLimit(key, maxCalls, windowMs) {
  const now = Date.now();
  const stored = JSON.parse(typeof window !== 'undefined' ? sessionStorage.getItem('rl_' + key) || '[]' : '[]');
  _rl[key] = stored.filter(t => now - t < windowMs);
  if (_rl[key].length >= maxCalls) {
    const secs = Math.ceil((windowMs - (now - _rl[key][0])) / 1000);
    throw new Error(`Demasiadas acciones. Espera ${secs > 60 ? Math.ceil(secs / 60) + 'min' : secs + 's'}.`);
  }
  _rl[key].push(now);
  try { sessionStorage.setItem('rl_' + key, JSON.stringify(_rl[key])); } catch (e) { }
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [saved, setSaved] = useState([]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState({ msg: '', visible: false });
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [stats, setStats] = useState({ products: '—', users: '—', matches: '—' });
  const toastTimer = useRef(null);
  const lastLoadRef = useRef(0);

  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('tk_s');
      setSaved(s ? JSON.parse(s) : []);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const ud = await loadUserData(user.uid);
        setUserData(ud);
      } else {
        setUserData(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    loadProducts();
    loadStats();
  }, []);

  async function loadUserData(uid) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      return snap.exists() ? snap.data() : null;
    } catch { return null; }
  }

  async function loadProducts() {
    const now = Date.now();
    if (now - lastLoadRef.current < 5000) return;
    lastLoadRef.current = now;
    try {
      const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.status !== 'deleted'));
    } catch { }
  }

  async function loadStats() {
    try {
      const [p, u, m] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'matches'))
      ]);
      setStats({ products: p.size, users: u.size, matches: m.size });
    } catch { }
  }

  function showToast(msg) {
    setToast({ msg, visible: true });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ msg: '', visible: false }), 3500);
  }

  function openModal(type) { setModal(type); }
  function closeModal() { setModal(null); }

  function toggleSave(id) {
    if (!currentUser) { showToast('Inicia sesión para guardar.'); openModal('auth'); return; }
    const next = saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id];
    setSaved(next);
    localStorage.setItem('tk_s', JSON.stringify(next));
    showToast(next.includes(id) ? 'Guardado ❤️' : 'Eliminado de guardados.');
  }

  async function doMatch(productId, onChatOpen) {
    if (!currentUser) { showToast('Inicia sesión para hacer match.'); openModal('auth'); return; }
    try { rateLimit('mat_' + currentUser.uid, 10, 3600000); } catch (e) { showToast(e.message); return; }
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    if (prod.ownerId === currentUser.uid) { showToast('No puedes hacer match con tu propia publicación.'); return; }
    try {
      const q = query(collection(db, 'matches'), where('productId', '==', productId), where('requesterId', '==', currentUser.uid));
      const ex = await getDocs(q);
      let mid;
      if (!ex.empty) { mid = ex.docs[0].id; showToast('Chat ya existe. Abriendo...'); }
      else {
        const myN = userData?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario';
        const r = await addDoc(collection(db, 'matches'), {
          productId, productTitle: prod.title, productEmoji: prod.emoji || '📦',
          productPhoto: (prod.photos && prod.photos[0]) || null,
          ownerId: prod.ownerId, ownerName: prod.owner,
          requesterId: currentUser.uid, requesterName: myN,
          status: 'active', lastMessage: '', lastMessageAt: serverTimestamp(), createdAt: serverTimestamp()
        });
        mid = r.id;
        loadStats();
        showToast('¡Match creado con ' + prod.owner + '! 🎉');
      }
      if (onChatOpen) onChatOpen(mid, prod);
    } catch (e) { showToast('Error: ' + e.message); }
  }

  async function loginUser(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function registerUser(email, password, name, phone, region) {
    rateLimit('reg_x', 3, 3600000);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, 'users', cred.user.uid), {
      displayName: name, email,
      phone: phone || '',
      region: region || '',
      level: 'Nuevo',
      role: 'user',
      createdAt: serverTimestamp()
    });
    const ud = await loadUserData(cred.user.uid);
    setUserData(ud);
  }

  async function logoutUser() {
    await signOut(auth);
    setUserData(null);
  }

  async function updateUserProfile(name, phone, region) {
    if (!currentUser) return;
    await updateProfile(currentUser, { displayName: name });
    await setDoc(doc(db, 'users', currentUser.uid), { displayName: name, phone, region }, { merge: true });
    const ud = await loadUserData(currentUser.uid);
    setUserData(ud);
  }

  async function publishProduct(data, photos) {
    if (!currentUser) throw new Error('No autenticado');
    rateLimit('pub_' + currentUser.uid, 5, 3600000);
    const myN = userData?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario';
    await addDoc(collection(db, 'products'), {
      ...data, photos, ownerId: currentUser.uid, owner: myN,
      level: userData?.level || 'Nuevo', barter: true, status: 'active', createdAt: serverTimestamp()
    });
    await loadProducts();
    loadStats();
  }

  async function deleteProduct(id) {
    await updateDoc(doc(db, 'products', id), { status: 'deleted' });
    await loadProducts();
  }

  async function blockProduct(id) {
    if (!isAdmin) { showToast('Sin permisos de administrador.'); return; }
    await updateDoc(doc(db, 'products', id), { status: 'blocked', blockedAt: serverTimestamp(), blockedBy: currentUser.uid });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'blocked' } : p));
    showToast('Publicación bloqueada.');
  }

  async function unblockProduct(id) {
    if (!isAdmin) { showToast('Sin permisos de administrador.'); return; }
    await updateDoc(doc(db, 'products', id), { status: 'active', blockedAt: null, blockedBy: null });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'active' } : p));
    showToast('Publicación desbloqueada.');
  }

  function rlMessage() { rateLimit('msg_' + (currentUser?.uid || 'x'), 30, 60000); }

  const value = {
    currentUser, userData, authLoading, isAdmin,
    products, saved, modal, toast,
    activeCategory, setActiveCategory,
    searchQuery, setSearchQuery,
    modeFilter, setModeFilter,
    levelFilter, setLevelFilter,
    regionFilter, setRegionFilter,
    stats,
    showToast, openModal, closeModal,
    toggleSave, doMatch,
    loginUser, registerUser, logoutUser, updateUserProfile,
    publishProduct, deleteProduct, blockProduct, unblockProduct,
    loadProducts, loadStats, rlMessage,
    db, collection, query, where, orderBy, addDoc, serverTimestamp, getDocs, doc, getDoc, onSnapshot: null
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
