'use client';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updateProfile, signInWithPopup, GoogleAuthProvider,
  setPersistence, browserSessionPersistence
} from 'firebase/auth';
import {
  collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, onSnapshot, increment,
  arrayUnion, arrayRemove
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

/* ── Chime de notificación (Web Audio API, sin archivos externos) ── */
function playNotifChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[880, 0], [1100, 0.15]].forEach(([freq, delay]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.38);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime  + delay + 0.4);
    });
  } catch { /* silencia errores de autoplay */ }
}

/* ── Notificación nativa del navegador ─────────────────────────── */
function showBrowserNotif({ title = 'Truekeamas', body = '' } = {}) {
  if (typeof window === 'undefined') return;
  if (document.hasFocus())           return; // página activa → no necesario
  if (Notification?.permission === 'granted') {
    try { new Notification(title, { body, icon: '/logo-icon.ico' }); } catch { }
  }
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

  // Sidebar
  const [sidebarPinned, setSidebarPinnedState] = useState(true);
  const [sidebarOpen,   setSidebarOpen]        = useState(true);

  // Floating chat dock
  const [openChats, setOpenChats] = useState([]);

  // Notifications
  const [notifications, setNotifications]         = useState([]);
  // Proposals (received by current user's products)
  const [receivedProposals, setReceivedProposals] = useState([]);
  // Proposals sent by current user
  const [sentProposals, setSentProposals]         = useState([]);

  const toastTimer    = useRef(null);
  const lastLoadRef   = useRef(0);
  const notifInitRef  = useRef(false); // detectar primera carga vs. notif nueva

  const isAdmin      = userData?.role === 'admin';
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const pendingProposals = receivedProposals.filter(p => p.status === 'pending').length;

  /* ── Saved + Sidebar prefs (localStorage) ─── */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('tk_s');
      setSaved(s ? JSON.parse(s) : []);
      // Sidebar pin preference
      const pin = localStorage.getItem('tk_sb_pin');
      if (pin === '0') {
        setSidebarPinnedState(false);
        setSidebarOpen(false);
      }
    }
  }, []);

  /* ── Auth listener ────────────────────────── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        let ud = await loadUserData(user.uid);
        // Auto-create missing user doc (e.g. admin added manually, old accounts)
        if (!ud) {
          try {
            await setDoc(doc(db, 'users', user.uid), {
              displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
              email:       user.email || '',
              phone:       '',
              region:      '',
              level:       'Nuevo',
              role:        'user',
              createdAt:   serverTimestamp(),
            }, { merge: true }); // merge: true preserves any existing fields (e.g. role: 'admin')
            ud = await loadUserData(user.uid);
          } catch (e) { console.warn('[Auth] No se pudo crear doc de usuario:', e); }
        }
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
    notifInitRef.current = false; // reset para este usuario

    // Pedir permiso de notificaciones nativas (solo pregunta una vez)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const q = query(collection(db, 'notifications', currentUser.uid, 'items'));
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      // Solo reproducir sonido para notifs que llegan DESPUÉS de la carga inicial
      if (notifInitRef.current) {
        snap.docChanges().forEach(change => {
          if (change.type === 'added' && !change.doc.data().read) {
            playNotifChime();
            showBrowserNotif(change.doc.data());
          }
        });
      }
      notifInitRef.current = true;
      setNotifications(list);
    }, () => {});
    return unsub;
  }, [currentUser]);

  /* ── Received proposals listener ─────────── */
  useEffect(() => {
    if (!currentUser) { setReceivedProposals([]); return; }
    // Sin orderBy para evitar índice compuesto — ordenamos en cliente
    const q = query(
      collection(db, 'proposals'),
      where('productOwnerUid', '==', currentUser.uid)
    );
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setReceivedProposals(list);
    }, (err) => { console.warn('[proposals recibidas]', err.code, err.message); });
    return unsub;
  }, [currentUser]);

  /* ── Sent proposals listener ──────────────── */
  useEffect(() => {
    if (!currentUser) { setSentProposals([]); return; }
    const q = query(
      collection(db, 'proposals'),
      where('proposerUid', '==', currentUser.uid)
    );
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setSentProposals(list);
    }, (err) => { console.warn('[proposals enviadas]', err.code, err.message); });
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
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.status !== 'deleted');
      setProducts(list);
      setStats(prev => ({ ...prev, products: list.length }));
    } catch { }
  }

  async function loadStats() {
    try {
      const [u, m] = await Promise.all([
        getDocs(query(collection(db, 'users'),   limit(500))),
        getDocs(query(collection(db, 'matches'), limit(500))),
      ]);
      setStats(prev => ({ ...prev, users: u.size, matches: m.size }));
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
    try { rateLimit('prop_' + currentUser.uid, 5, 3600000); } catch (e) { throw e; }

    // Validación server-side vía API (incluye lock de propuesta única por producto)
    const idToken = await currentUser.getIdToken();
    const res = await fetch('/api/submit-proposal', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body:    JSON.stringify({ productId, ...offerData }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al enviar propuesta');
    return data.proposalId;
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

    // Liberar el lock para que el proponente pueda volver a proponer si quiere
    deleteDoc(doc(db, 'proposal_locks', `${proposal.proposerUid}_${proposal.productId}`)).catch(() => {});

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

    // Liberar lock para que pueda volver a proponer
    deleteDoc(doc(db, 'proposal_locks', `${proposal.proposerUid}_${proposal.productId}`)).catch(() => {});

    await createNotif(proposal.proposerUid, {
      type: 'proposal_declined',
      title: 'Propuesta no aceptada',
      body: `Tu propuesta para "${proposal.productTitle}" no fue aceptada esta vez.`,
      proposalId, productId: proposal.productId
    });
  }

  /* ── Auth ─────────────────────────────────── */
  async function loginUser(email, password) {
    await setPersistence(auth, browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function registerUser(email, password, name, phone, region) {
    rateLimit('reg_x', 3, 3600000);
    await setPersistence(auth, browserSessionPersistence);
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

  async function socialLogin(providerName) {
    if (providerName !== 'google') throw new Error('Proveedor no soportado');
    await setPersistence(auth, browserSessionPersistence);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const cred = await signInWithPopup(auth, provider);
    const user = cred.user;

    // Si el usuario es nuevo, crear doc en Firestore
    const userRef = doc(db, 'users', user.uid);
    const snap    = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
        email: user.email || '',
        phone: '',
        region: '',
        level: 'Nuevo',
        role: 'user',
        provider: providerName,
        createdAt: serverTimestamp()
      });
    }
    const ud = await loadUserData(user.uid);
    setUserData(ud);
  }

  async function logoutUser() {
    await signOut(auth);
    setUserData(null);
  }

  async function updateUserProfile(name, phone, region, avatarUrl) {
    if (!currentUser) return;
    await updateProfile(currentUser, { displayName: name });
    const update = { displayName: name, phone, region };
    if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;
    await setDoc(doc(db, 'users', currentUser.uid), update, { merge: true });
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
      ownerName: myN,
      ownerAvatarUrl:   userData?.avatarUrl    || null,
      ownerVerified:    userData?.verified     || false,
      ownerRatingAvg:   userData?.ratingAvg    || 0,
      ownerRatingCount: userData?.ratingCount  || 0,
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
    if (!currentUser) throw new Error('No autenticado');
    const idToken = await currentUser.getIdToken();
    const res = await fetch('/api/delete-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body: JSON.stringify({ productId: id }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Error al eliminar la publicación');
    }
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
    if (!currentUser) throw new Error('No autenticado');
    const idToken = await currentUser.getIdToken();
    const res = await fetch('/api/delete-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body: JSON.stringify({ productId: id }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Error al completar la publicación');
    }
    setProducts(prev => prev.filter(p => p.id !== id));
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

  /* ── Sidebar ─────────────────────────────── */
  function toggleSidebarPin() {
    setSidebarPinnedState(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') localStorage.setItem('tk_sb_pin', next ? '1' : '0');
      setSidebarOpen(next); // pin → open, unpin → close
      return next;
    });
  }

  /* ── Floating chat dock ───────────────────── */
  function openChatWindow(mid, prod) {
    setOpenChats(prev => {
      const exists = prev.find(c => c.mid === mid);
      if (exists) return prev.map(c => c.mid === mid ? { ...c, minimized: false } : c);
      const arr = prev.length >= 3 ? prev.slice(1) : prev;
      return [...arr, { mid, prod, minimized: false }];
    });
  }
  function closeChatWindow(mid)    { setOpenChats(prev => prev.filter(c => c.mid !== mid)); }
  function toggleMinimizeChat(mid) { setOpenChats(prev => prev.map(c => c.mid === mid ? { ...c, minimized: !c.minimized } : c)); }

  /* ── Block / unblock users ───────────────── */
  async function blockUser(targetUid) {
    if (!currentUser) return;
    await updateDoc(doc(db, 'users', currentUser.uid), { blockedUsers: arrayUnion(targetUid) });
    setUserData(prev => ({ ...prev, blockedUsers: [...(prev?.blockedUsers || []), targetUid] }));
    showToast('Usuario bloqueado.');
  }

  async function unblockUser(targetUid) {
    if (!currentUser) return;
    await updateDoc(doc(db, 'users', currentUser.uid), { blockedUsers: arrayRemove(targetUid) });
    setUserData(prev => ({ ...prev, blockedUsers: (prev?.blockedUsers || []).filter(id => id !== targetUid) }));
    showToast('Usuario desbloqueado.');
  }

  function rlMessage() { rateLimit('msg_' + (currentUser?.uid || 'x'), 30, 60000); }

  /* ── Archivar chat (se muestra como "Eliminar" en UI) ─────────── */
  async function archiveChat(matchId) {
    if (!currentUser) return;
    await updateDoc(doc(db, 'matches', matchId), {
      archived:   true,
      archivedAt: serverTimestamp(),
      archivedBy: currentUser.uid,
    });
    // Cerrar la ventana flotante si estaba abierta
    closeChatWindow(matchId);
  }

  /* ── Completar acuerdo ────────────────────────────────────────── */
  async function completeMatch(matchId) {
    if (!currentUser) return;
    const idToken = await currentUser.getIdToken();
    const res = await fetch('/api/complete-match', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body:    JSON.stringify({ matchId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al completar el acuerdo');
    // Solo refrescar el feed si ambos confirmaron y el producto sale del feed
    if (data.status === 'completed') await loadProducts();
    return data;
  }

  /* ── Abrir sidebar en modo cajón (móvil) ─────────────────────── */
  function openSidebarDrawer() {
    if (sidebarPinned) {
      setSidebarPinnedState(false);
      if (typeof window !== 'undefined') localStorage.setItem('tk_sb_pin', '0');
    }
    setSidebarOpen(true);
  }

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
    loginUser, registerUser, socialLogin, logoutUser, updateUserProfile,
    publishProduct, deleteProduct, updateProduct, markProductSold, reactivateProduct,
    blockProduct, unblockProduct, reportProduct,
    blockUser, unblockUser,
    sidebarPinned, sidebarOpen, setSidebarOpen, toggleSidebarPin, openSidebarDrawer,
    openChats, openChatWindow, closeChatWindow, toggleMinimizeChat,
    archiveChat, completeMatch,
    loadProducts, loadStats, rlMessage,
    db, collection, query, where, orderBy, addDoc, updateDoc, serverTimestamp, getDocs, doc, getDoc, onSnapshot
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
