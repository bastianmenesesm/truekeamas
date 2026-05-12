'use client';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updateProfile
} from 'firebase/auth';
import {
  collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc,
  query, where, orderBy, limit, serverTimestamp, onSnapshot, increment,
  getCountFromServer
} from 'firebase/firestore';

export { CATS } from '@/lib/categories';

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
  const [currentUser, setCurrentUser]       = useState(null);
  const [userData, setUserData]             = useState(null);
  const [authLoading, setAuthLoading]       = useState(true);
  const [products, setProducts]             = useState([]);
  const [saved, setSaved]                   = useState([]);
  const [modal, setModal]                   = useState(null);
  const [toast, setToast]                   = useState({ msg: '', visible: false });
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery]       = useState('');
  const [modeFilter, setModeFilter]         = useState('all');
  const [levelFilter, setLevelFilter]       = useState('all');
  const [regionFilter, setRegionFilter]     = useState('all');
  const [stats, setStats]                   = useState({ products: '—', users: '—', matches: '—' });
  const [sortBy, setSortBy]                 = useState('likes');

  // Notifications
  const [notifications, setNotifications]         = useState([]);
  // Proposals (received by current user's products)
  const [receivedProposals, setReceivedProposals] = useState([]);
  // Proposals sent by current user
  const [sentProposals, setSentProposals]         = useState([]);

  const toastTimer  = useRef(null);
  const lastLoadRef = useRef(0);

  const isAdmin      = userData?.role === 'admin';
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const pendingProposals = receivedProposals.filter(p => p.status === 'pending').length;

  /* ── Saved (localStorage) ─────────────────── */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('tk_s');
      setSaved(s ? JSON.parse(s) : []);
    }
  }, []);

  /* ── Auth listener ────────────────────────── */
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

  /* ── Notifications listener ───────────────── */
  useEffect(() => {
    if (!currentUser) { setNotifications([]); return; }
    const q = query(
      collection(db, 'notifications', currentUser.uid, 'items'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, [currentUser]);

  /* ── Received proposals listener ─────────── */
  useEffect(() => {
    if (!currentUser) { setReceivedProposals([]); return; }
    const q = query(
      collection(db, 'proposals'),
      where('productOwnerUid', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setReceivedProposals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, [currentUser]);

  /* ── Sent proposals listener ──────────────── */
  useEffect(() => {
    if (!currentUser) { setSentProposals([]); return; }
    const q = query(
      collection(db, 'proposals'),
      where('proposerUid', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setSentProposals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, [currentUser]);

  /* ── Products (inmediato) + stats (diferido) ─ */
  useEffect(() => {
    loadProducts();
    // Stats no es crítico para el render inicial — cargar después
    const t = setTimeout(() => loadStats(), 1500);
    return () => clearTimeout(t);
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
      const snap = await getDocs(
        query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(80))
      );
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.status !== 'deleted'));
    } catch { }
  }

  async function loadStats() {
    // Usar getCountFromServer — no descarga documentos, solo cuenta
    try {
      const [p, u, m] = await Promise.all([
        getCountFromServer(collection(db, 'products')),
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(collection(db, 'matches')),
      ]);
      setStats({ products: p.data().count, users: u.data().count, matches: m.data().count });
    } catch { }
  }

  /* ── Toast ────────────────────────────────── */
  function showToast(msg) {
    setToast({ msg, visible: true });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ msg: '', visible: false }), 3500);
  }

  /* ── Modal ────────────────────────────────── */
  function openModal(type) { setModal(type); }
  function closeModal()    { setModal(null); }

  /* ── Like (público, reemplaza Save) ──────── */
  async function toggleLike(productId) {
    if (!currentUser) { openModal('auth'); return; }
    const isLiked = saved.includes(productId);
    const next = isLiked ? saved.filter(x => x !== productId) : [...saved, productId];
    setSaved(next);
    localStorage.setItem('tk_s', JSON.stringify(next));
    try {
      await updateDoc(doc(db, 'products', productId), { likes: increment(isLiked ? -1 : 1) });
      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, likes: Math.max(0, (p.likes || 0) + (isLiked ? -1 : 1)) } : p
      ));
    } catch { }
  }

  /* ── Notifications helpers ────────────────── */
  async function createNotif(userId, data) {
    try {
      await addDoc(collection(db, 'notifications', userId, 'items'), {
        ...data, read: false, createdAt: serverTimestamp()
      });
    } catch { }
  }

  async function markNotifRead(notifId) {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'notifications', currentUser.uid, 'items', notifId), { read: true });
    } catch { }
  }

  async function markAllNotifsRead() {
    if (!currentUser) return;
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n =>
      updateDoc(doc(db, 'notifications', currentUser.uid, 'items', n.id), { read: true }).catch(() => {})
    ));
  }

  /* ── Message notification ─────────────────── */
  async function notifyMessage(matchId, recipientUid, senderName, preview) {
    if (!recipientUid || recipientUid === currentUser?.uid) return;
    await createNotif(recipientUid, {
      type: 'new_message',
      title: `Nuevo mensaje de ${senderName}`,
      body: preview.length > 60 ? preview.slice(0, 57) + '…' : preview,
      chatId: matchId,
      read: false
    });
  }

  /* ── Proposals ────────────────────────────── */
  async function submitProposal(productId, offerData) {
    if (!currentUser) { openModal('auth'); return; }
    const prod = products.find(p => p.id === productId);
    if (!prod) throw new Error('Publicación no encontrada');
    if (prod.ownerId === currentUser.uid) throw new Error('No puedes enviar una propuesta a tu propia publicación.');
    try { rateLimit('prop_' + currentUser.uid, 5, 3600000); } catch (e) { throw e; }

    // Chequeo de duplicado en cliente (evita índice compuesto de Firestore)
    const existingPending = sentProposals.find(
      p => p.productId === productId && p.status === 'pending'
    );
    if (existingPending) throw new Error('Ya tienes una propuesta pendiente para esta publicación.');

    const myName = userData?.displayName || currentUser.displayName || 'Usuario';
    const ref = await addDoc(collection(db, 'proposals'), {
      productId,
      productTitle: prod.title,
      productPhoto: prod.photos?.[0] || null,
      productOwnerUid: prod.ownerId,
      proposerUid: currentUser.uid,
      proposerName: myName,
      offerType: offerData.offerType,
      offerDescription: offerData.offerDescription || '',
      offerPhotos: offerData.offerPhotos || [],
      offerAmount: offerData.offerAmount || null,
      message: offerData.message || '',
      status: 'pending',
      matchId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await createNotif(prod.ownerId, {
      type: 'proposal_received',
      title: '¡Nueva propuesta de trueque!',
      body: `Propuesta para "${prod.title}"`,
      proposalId: ref.id,
      productId
    });
    return ref.id;
  }

  async function acceptProposal(proposalId) {
    if (!currentUser) return;
    const propSnap = await getDoc(doc(db, 'proposals', proposalId));
    if (!propSnap.exists()) throw new Error('Propuesta no encontrada');
    const proposal = propSnap.data();
    if (proposal.productOwnerUid !== currentUser.uid) throw new Error('Sin permiso');

    // Create match (chat entry)
    const matchRef = await addDoc(collection(db, 'matches'), {
      productId: proposal.productId,
      productTitle: proposal.productTitle,
      productPhoto: proposal.productPhoto || null,
      ownerId: proposal.productOwnerUid,
      ownerName: userData?.displayName || currentUser.displayName || 'Usuario',
      requesterId: proposal.proposerUid,
      requesterName: proposal.proposerName,
      proposalId,
      status: 'active',
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, 'proposals', proposalId), {
      status: 'accepted', matchId: matchRef.id, updatedAt: serverTimestamp()
    });

    await createNotif(proposal.proposerUid, {
      type: 'proposal_accepted',
      title: '¡Propuesta aceptada! 🎉',
      body: `Tu propuesta para "${proposal.productTitle}" fue aceptada. ¡Ya pueden chatear!`,
      proposalId, productId: proposal.productId, chatId: matchRef.id
    });

    loadStats();
    return matchRef.id;
  }

  async function declineProposal(proposalId) {
    if (!currentUser) return;
    const propSnap = await getDoc(doc(db, 'proposals', proposalId));
    if (!propSnap.exists()) return;
    const proposal = propSnap.data();
    if (proposal.productOwnerUid !== currentUser.uid) throw new Error('Sin permiso');

    await updateDoc(doc(db, 'proposals', proposalId), {
      status: 'declined', updatedAt: serverTimestamp()
    });

    await createNotif(proposal.proposerUid, {
      type: 'proposal_declined',
      title: 'Propuesta no aceptada',
      body: `Tu propuesta para "${proposal.productTitle}" no fue aceptada esta vez.`,
      proposalId, productId: proposal.productId
    });
  }

  /* ── Auth ─────────────────────────────────── */
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
      termsAcceptedAt: serverTimestamp(),
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

  /* ── Products ─────────────────────────────── */
  async function publishProduct(data, photos) {
    if (!currentUser) throw new Error('No autenticado');
    rateLimit('pub_' + currentUser.uid, 5, 3600000);
    const myN = userData?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario';
    const action = data.action || 'cambiar';
    await addDoc(collection(db, 'products'), {
      ...data, photos, ownerId: currentUser.uid, owner: myN,
      level: userData?.level || 'Nuevo',
      barter: action === 'cambiar' || action === 'mixto',
      buy:    action === 'vender'  || action === 'mixto',
      donate: action === 'donar',
      mixed:  action === 'mixto',
      status: 'active',
      likes:  0,
      createdAt: serverTimestamp()
    });
    await loadProducts();
    loadStats();
  }

  async function deleteProduct(id) {
    await updateDoc(doc(db, 'products', id), { status: 'deleted' });
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  async function updateProduct(id, data) {
    if (!currentUser) throw new Error('No autenticado');
    const allowed = ['title', 'description', 'price', 'condition', 'region', 'wants', 'action', 'barter', 'buy', 'donate', 'mixed'];
    const clean = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    await updateDoc(doc(db, 'products', id), { ...clean, updatedAt: serverTimestamp() });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...clean } : p));
  }

  async function markProductSold(id) {
    await updateDoc(doc(db, 'products', id), { status: 'sold', soldAt: serverTimestamp() });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'sold' } : p));
  }

  async function reactivateProduct(id) {
    await updateDoc(doc(db, 'products', id), { status: 'active', soldAt: null });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'active' } : p));
  }

  async function reportProduct(productId, reason, description) {
    if (!currentUser) { openModal('auth'); return; }
    try { rateLimit('rep_' + currentUser.uid, 5, 3600000); } catch (e) { throw e; }

    // Evitar denuncia duplicada del mismo usuario
    const existing = await getDocs(query(
      collection(db, 'reports'),
      where('productId', '==', productId),
      where('reporterUid', '==', currentUser.uid)
    ));
    if (!existing.empty) throw new Error('Ya has denunciado esta publicación anteriormente.');

    const prod = products.find(p => p.id === productId);
    await addDoc(collection(db, 'reports'), {
      productId,
      productTitle: prod?.title || '',
      productOwnerUid: prod?.ownerId || '',
      reporterUid: currentUser.uid,
      reason,
      description: description || '',
      status: 'pending',
      createdAt: serverTimestamp()
    });
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
    // Notifications
    notifications, unreadNotifs, markNotifRead, markAllNotifsRead, notifyMessage,
    // Proposals
    receivedProposals, sentProposals, pendingProposals,
    submitProposal, acceptProposal, declineProposal,
    sortBy, setSortBy,
    showToast, openModal, closeModal,
    toggleLike,
    loginUser, registerUser, logoutUser, updateUserProfile,
    publishProduct, deleteProduct, updateProduct, markProductSold, reactivateProduct,
    blockProduct, unblockProduct, reportProduct,
    loadProducts, loadStats, rlMessage,
    db, collection, query, where, orderBy, addDoc, updateDoc, serverTimestamp, getDocs, doc, getDoc, onSnapshot
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
