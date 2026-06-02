'use client';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updateProfile, signInWithPopup, signInWithRedirect, getRedirectResult,
  GoogleAuthProvider, setPersistence, browserSessionPersistence, sendEmailVerification
} from 'firebase/auth';
import {
  collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp, onSnapshot, increment,
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
// AudioContext único reutilizable — los navegadores limitan a ~6 contextos simultáneos.
// Se crea de forma lazy (requiere interacción del usuario previa para no ser bloqueado).
let _sharedAudioCtx = null;
function getSharedAudioCtx() {
  if (!_sharedAudioCtx || _sharedAudioCtx.state === 'closed') {
    _sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _sharedAudioCtx;
}

function playNotifChime() {
  try {
    const ctx = getSharedAudioCtx();
    // Algunos navegadores suspenden el contexto si lleva tiempo inactivo
    if (ctx.state === 'suspended') ctx.resume();
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

/* ── Detectar si debe usar redirect en vez de popup ───────────── */
function shouldUseRedirect() {
  // Siempre popup:
  // - Android (standalone o navegador): abre Chrome Custom Tab → funciona perfecto
  // - Desktop: popup normal
  // - iOS: popup abre nueva pestaña Safari; si falla, el catch muestra mensaje de ayuda
  // signInWithRedirect se descartó porque getRedirectResult() pierde la sesión
  // en Chrome Android cuando el handler cruza a truekeamas.firebaseapp.com
  return false;
}

/* ── Jerarquía de niveles (debe coincidir con /api/rate-user) ──── */
// Nuevo < Activo < Verificado < Confiable
// 'Activo'    → automático: 5+ calificaciones con promedio ≥ 4.0
// 'Verificado'→ manual por admin (prevalece sobre 'Activo')
// 'Confiable' → automático: 10+ calificaciones con promedio ≥ 4.5
const LEVEL_RANK = { Nuevo: 0, Activo: 1, Verificado: 2, Confiable: 3 };

function computeLevel(ud, emailVerified) {
  const rating = ud?.ratingAvg   || 0;
  const count  = ud?.ratingCount || 0;
  if (count >= 10 && rating >= 4.5) return 'Confiable';
  if (emailVerified)                return 'Verificado'; // admin-verified supera 'Activo'
  if (count >= 5  && rating >= 4.0) return 'Activo';
  return 'Nuevo';
}

/* ── Registrar token FCM para push notifications ───────────────── */
async function registerFcmToken(uid) {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) return; // VAPID key no configurada → skip silencioso
  try {
    const { getMessaging, getToken } = await import('firebase/messaging');
    const { app } = await import('@/lib/firebase');
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey });
    if (token) {
      await updateDoc(doc(db, 'users', uid), { fcmToken: token, fcmUpdatedAt: serverTimestamp() });
    }
  } catch {
    // Si el SW de FCM no está listo o el usuario rechazó, ignorar silenciosamente
  }
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser]       = useState(null);
  const [userData, setUserData]             = useState(null);
  const [authLoading, setAuthLoading]       = useState(true);
  const [products, setProducts]             = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [saved, setSaved]                   = useState([]);
  const [modal, setModal]                   = useState(null);
  const [toast, setToast]                   = useState({ msg: '', visible: false });
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery]       = useState('');
  const [modeFilter,      setModeFilter]      = useState('all');
  const [levelFilter,     setLevelFilter]     = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [regionFilter,    setRegionFilter]    = useState('all');
  const [stats,           setStats]           = useState({ products: '—', users: '—', matches: '—' });
  const [sortBy,          setSortBy]          = useState('none');
  const [communeFilter,   setCommuneFilter]   = useState('all');
  const [priceFilter,     setPriceFilter]     = useState(false);
  const [minPrice,        setMinPrice]        = useState('');
  const [maxPrice,        setMaxPrice]        = useState('');

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

  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [loadingMore,     setLoadingMore]     = useState(false);

  const toastTimer    = useRef(null);
  const lastLoadRef   = useRef(0);

  /* ── Cleanup toastTimer al desmontar ─────── */
  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);
  const lastDocRef    = useRef(null); // cursor para paginación
  const notifInitRef  = useRef(false); // detectar primera carga vs. notif nueva

  const PAGE_SIZE = 40;

  const isAdmin      = userData?.role === 'admin';
  const unreadNotifs    = notifications.filter(n => !n.read).length;
  const unreadMessages  = notifications.filter(n => !n.read && n.type === 'new_message').length;
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

  /* ── Manejar resultado de signInWithRedirect (PWA standalone) ── */
  useEffect(() => {
    getRedirectResult(auth).then(async result => {
      if (!result?.user) return;
      const user    = result.user;
      const userRef = doc(db, 'users', user.uid);
      const snap    = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
          email:       user.email || '',
          phone: '', region: '',
          level: 'Nuevo', role: 'user',
          provider: 'google',
          createdAt: serverTimestamp(),
        });
      }
      const ud = await loadUserData(user.uid);
      setUserData(ud);
      showToast('¡Bienvenido/a! 👋');
      closeModal();
    }).catch((err) => {
      if (err?.code && err.code !== 'auth/no-auth-event') {
        console.warn('[Auth] getRedirectResult error:', err.code);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Auth listener ────────────────────────── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        let ud = await loadUserData(user.uid);
        // Auto-create missing user doc (e.g. admin added manually, old accounts)
        // IMPORTANTE: loadUserData puede devolver null por un error de red transitorio
        // aunque el documento exista. Por eso verificamos con getDoc antes de crear,
        // para nunca sobrescribir role:'admin' con role:'user'.
        if (!ud) {
          try {
            const docRef  = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
              // Solo crear si el documento realmente NO existe (usuario genuinamente nuevo).
              // 'role' NO se incluye en el merge — solo se pone en documentos nuevos
              // para evitar sobrescribir role:'admin' ante cualquier error de red.
              await setDoc(docRef, {
                displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
                email:       user.email || '',
                phone:       '',
                region:      '',
                level:       'Nuevo',
                role:        'user',   // seguro: doc confirmado como inexistente
                createdAt:   serverTimestamp(),
              });
            }
            // Si el doc existe pero loadUserData falló (error de red), no tocamos nada.
            // El rol y todos los campos quedan intactos.
            ud = await loadUserData(user.uid);
          } catch (e) { console.warn('[Auth] No se pudo crear doc de usuario:', e); }
        }
        setUserData(ud);
        syncLevel(user, ud); // recalcular nivel en segundo plano

        // Onboarding para usuarios nuevos (solo una vez)
        if (ud && !ud.onboardingDone) {
          setTimeout(() => setModal('onboarding'), 800);
        }
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

    // Pedir permiso + registrar token FCM para push notifications reales
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') registerFcmToken(currentUser.uid);
        }).catch(() => {});
      } else if (Notification.permission === 'granted') {
        registerFcmToken(currentUser.uid);
      }
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
      if (!notifInitRef.current) {
        // Primera carga: limpiar notificaciones huérfanas en segundo plano
        const staleMsg = list.filter(n => !n.read && n.type === 'new_message' && n.chatId);
        if (staleMsg.length) {
          Promise.all(
            staleMsg.map(n =>
              getDoc(doc(db, 'matches', n.chatId))
                .then(snap => ({ n, valid: snap.exists() && !snap.data()?.archived }))
                .catch(() => ({ n, valid: false }))
            )
          ).then(results => {
            results.filter(r => !r.valid).forEach(r =>
              updateDoc(doc(db, 'notifications', currentUser.uid, 'items', r.n.id), { read: true }).catch(() => {})
            );
          });
        }
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

  /* Recalcula y persiste el nivel si cambió (se llama en segundo plano).
     Solo sube de nivel — nunca baja uno asignado por el servidor o el admin. */
  async function syncLevel(user, ud) {
    if (!user || !ud) return;
    const expected    = computeLevel(ud, user.emailVerified);
    const current     = ud.level || 'Nuevo';
    const currentRank = LEVEL_RANK[current]  ?? 0;
    const expectedRank = LEVEL_RANK[expected] ?? 0;
    // No escribir si el nivel es el mismo o si bajaría (p.ej. 'Activo' → 'Verificado' con RANK 2>1)
    if (currentRank >= expectedRank) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { level: expected });
      setUserData(prev => ({ ...prev, level: expected }));
    } catch (e) { console.warn('[syncLevel]', e); }
  }

  async function loadProducts() {
    const now = Date.now();
    if (now - lastLoadRef.current < 5000) return;
    lastLoadRef.current = now;
    try {
      const snap = await getDocs(
        query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE))
      );
      const docs = snap.docs;
      lastDocRef.current = docs[docs.length - 1] || null;
      const list = docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.status !== 'deleted' && p.status !== 'blocked');
      setProducts(list);
      setHasMoreProducts(docs.length === PAGE_SIZE);
      setStats(prev => ({ ...prev, products: list.length }));
      // Limpiar saved: eliminar IDs de productos que ya no existen
      const ids = new Set(list.map(p => p.id));
      setSaved(prev => {
        const clean = prev.filter(id => ids.has(id));
        if (clean.length !== prev.length) {
          localStorage.setItem('tk_s', JSON.stringify(clean));
          return clean;
        }
        return prev;
      });
    } catch { }
    finally { setProductsLoading(false); }
  }

  async function loadMoreProducts() {
    if (!lastDocRef.current || loadingMore) return;
    setLoadingMore(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'products'), orderBy('createdAt', 'desc'), startAfter(lastDocRef.current), limit(PAGE_SIZE))
      );
      const docs = snap.docs;
      lastDocRef.current = docs[docs.length - 1] || null;
      const list = docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.status !== 'deleted' && p.status !== 'blocked');
      setProducts(prev => [...prev, ...list]);
      setHasMoreProducts(docs.length === PAGE_SIZE);
    } catch { }
    finally { setLoadingMore(false); }
  }

  async function loadStats() {
    try {
      const [u, m, settingsSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'),   limit(500))),
        getDocs(query(collection(db, 'matches'), limit(500))),
        getDoc(doc(db, 'settings', 'stats')),
      ]);
      const sd = settingsSnap.exists() ? settingsSnap.data() : {};
      // userCount: preferir el valor manual de Firestore Console (más preciso)
      const userCount = sd.userCount || u.size;
      // completedMatches: para estadísticas ecológicas
      const completedMatches = m.docs.filter(d => d.data().status === 'completed').length;
      setStats(prev => ({
        ...prev,
        users: userCount,
        matches: m.size,
        completedMatches,
      }));
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

  /* ── Limpiar notificaciones huérfanas (chats/propuestas eliminadas) ── */
  async function cleanStaleNotifs() {
    if (!currentUser) return;
    const unread = notifications.filter(n => !n.read);
    if (!unread.length) return;

    // Verificar notificaciones de mensajes: el match debe existir y no estar archivado
    const messageNotifs = unread.filter(n => n.type === 'new_message' && n.chatId);
    if (messageNotifs.length) {
      const checks = await Promise.all(
        messageNotifs.map(n =>
          getDoc(doc(db, 'matches', n.chatId))
            .then(snap => ({ n, exists: snap.exists() && !snap.data()?.archived }))
            .catch(() => ({ n, exists: false }))
        )
      );
      const stale = checks.filter(c => !c.exists).map(c => c.n);
      await Promise.all(stale.map(n =>
        updateDoc(doc(db, 'notifications', currentUser.uid, 'items', n.id), { read: true }).catch(() => {})
      ));
    }
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

  // Helper para llamadas autenticadas a la API
  async function authFetch(path, body) {
    const idToken = await currentUser.getIdToken();
    const res = await fetch(path, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body:    JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Error del servidor');
    return data;
  }

  async function acceptProposal(proposalId) {
    if (!currentUser) return;
    // Validación + creación de match + limpieza de lock via Admin SDK (server-side)
    // Evita race conditions de doble-aceptar y garantiza integridad de datos
    const data = await authFetch('/api/accept-proposal', { proposalId });
    loadStats();
    return data.matchId;
  }

  async function declineProposal(proposalId) {
    if (!currentUser) return;
    // Rechazar via API para que el lock se limpie correctamente con Admin SDK
    // (el cliente no puede borrar proposal_locks por las reglas de Firestore)
    await authFetch('/api/decline-proposal', { proposalId });
  }

  /* ── Auth ─────────────────────────────────── */
  async function loginUser(email, password) {
    await setPersistence(auth, browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function registerUser(email, password, name, phone, region, commune) {
    rateLimit('reg_x', 3, 3600000);
    await setPersistence(auth, browserSessionPersistence);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    sendEmailVerification(cred.user).catch(() => {}); // enviar correo de verificación
    await setDoc(doc(db, 'users', cred.user.uid), {
      displayName: name, email,
      phone:   phone   || '',
      region:  region  || '',
      commune: commune || '',
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
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    if (shouldUseRedirect()) {
      // PWA standalone: redirect flow (sin setPersistence antes del redirect, rompe el flujo)
      await signInWithRedirect(auth, provider);
      return; // la página se redirige, resultado manejado en el useEffect de arriba
    }

    // Navegadores (escritorio y móvil): popup normal
    // Si el popup está bloqueado, caer en redirect como último recurso
    let cred;
    try {
      await setPersistence(auth, browserSessionPersistence);
      cred = await signInWithPopup(auth, provider);
    } catch (popupErr) {
      const code = popupErr?.code || '';
      if (code === 'auth/popup-cancelled-by-user') {
        // Usuario cerró el popup voluntariamente → no hacer nada
        return;
      }
      if (code === 'auth/popup-blocked' ||
          code === 'auth/operation-not-supported-in-this-environment') {
        // iOS Safari standalone bloquea window.open().
        // Pedimos al usuario que abra desde Safari directamente.
        showToast('Abre truekeamas.cl en Safari para iniciar sesión con Google.');
        return;
      }
      throw popupErr;
    }
    const user = cred.user;

    const userRef = doc(db, 'users', user.uid);
    const snap    = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
        email: user.email || '',
        phone: '', region: '',
        level: 'Nuevo', role: 'user',
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

  async function updateUserProfile(name, region, commune, avatarUrl) {
    if (!currentUser) return;
    await updateProfile(currentUser, { displayName: name });
    const update = { displayName: name, region: region || '', commune: commune || '' };
    if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;
    await setDoc(doc(db, 'users', currentUser.uid), update, { merge: true });
    const ud = await loadUserData(currentUser.uid);
    setUserData(ud);
  }

  async function requestPhoneChange(newPhone) {
    if (!currentUser) throw new Error('No autenticado');
    const idToken = await currentUser.getIdToken();
    const res = await fetch('/api/request-phone-change', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body:    JSON.stringify({ newPhone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al enviar solicitud');
    return data;
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
    const snap = await getDoc(doc(db, 'products', id));
    if (!snap.exists()) throw new Error('Publicación no encontrada');
    if (snap.data().ownerId !== currentUser.uid && !isAdmin) throw new Error('Sin permiso');
    // Solo cambia el status — NO borra el documento, fotos ni historial de propuestas/chats
    await updateDoc(doc(db, 'products', id), { status: 'sold', soldAt: serverTimestamp() });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'sold' } : p));
  }

  async function reactivateProduct(id) {
    if (!currentUser) throw new Error('No autenticado');
    const snap = await getDoc(doc(db, 'products', id));
    if (!snap.exists()) throw new Error('Publicación no encontrada');
    if (snap.data().ownerId !== currentUser.uid && !isAdmin) throw new Error('Sin permiso');
    await updateDoc(doc(db, 'products', id), { status: 'active', soldAt: null });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'active' } : p));
  }

  // Renovar publicación: reinicia el reloj de caducidad 30 días más
  async function renewProduct(id) {
    if (!currentUser) throw new Error('No autenticado');
    await updateDoc(doc(db, 'products', id), {
      status:           'active',
      renewedAt:        serverTimestamp(),
      expiryNotifiedAt: null,
    });
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, status: 'active', expiryNotifiedAt: null } : p
    ));
    showToast('✅ Publicación renovada por 30 días.');
  }

  // Destacar / quitar destacado (solo admin) — Trueque del Día
  async function toggleFeatured(productId, featured) {
    if (!currentUser || !isAdmin) { showToast('Sin permisos de administrador.'); return; }
    const idToken = await currentUser.getIdToken();
    const res = await fetch('/api/toggle-featured', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body:    JSON.stringify({ productId, featured }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Error'); }
    // Actualizar estado local: solo un producto puede estar destacado a la vez
    setProducts(prev => prev.map(p => ({
      ...p,
      featured: p.id === productId ? featured : (featured ? false : p.featured),
    })));
    showToast(featured ? '⭐ Trueque del Día activado.' : 'Destacado removido.');
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
    if (!currentUser || !isAdmin) { showToast('Sin permisos de administrador.'); return; }
    const idToken = await currentUser.getIdToken();
    const res = await fetch('/api/block-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ productId: id }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Error al bloquear'); }
    // Quitar del feed público (bloqueado = no visible)
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast('Publicación bloqueada.');
  }

  async function unblockProduct(id) {
    if (!currentUser || !isAdmin) { showToast('Sin permisos de administrador.'); return; }
    const idToken = await currentUser.getIdToken();
    const res = await fetch('/api/unblock-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ productId: id }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Error al desbloquear'); }
    // No volvemos a insertar en el feed local — se refresca en la próxima carga
    showToast('Publicación desbloqueada.');
  }

  async function banUser(targetUid, action) {
    if (!currentUser || !isAdmin) { showToast('Sin permisos de administrador.'); return; }
    const idToken = await currentUser.getIdToken();
    const res = await fetch('/api/ban-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ targetUid, action }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Error al banear usuario');
    showToast(action === 'ban' ? 'Usuario baneado.' : 'Usuario desbaneado.');
    return data.role;
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
    // Marcar como leídas todas las notificaciones de mensajes de este chat
    notifications
      .filter(n => !n.read && n.type === 'new_message' && n.chatId === mid)
      .forEach(n => markNotifRead(n.id));

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
    // Marcar como leídas las notificaciones de ese chat para limpiar el contador
    notifications
      .filter(n => !n.read && n.chatId === matchId)
      .forEach(n => markNotifRead(n.id));
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
    if (data.status === 'completed') {
      await loadProducts();
      // Recargar usuario para recalcular nivel (tradesCompleted subió en el servidor)
      const ud = await loadUserData(currentUser.uid);
      if (ud) { setUserData(ud); syncLevel(currentUser, ud); }
    }
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

  /* Cuando cambia la región, resetear la comuna */
  function setRegionFilterAndReset(val) {
    setRegionFilter(val);
    setCommuneFilter('all');
  }

  const value = {
    currentUser, setCurrentUser, userData, authLoading, isAdmin,
    products, saved, modal, toast,
    activeCategory, setActiveCategory,
    searchQuery, setSearchQuery,
    modeFilter,      setModeFilter,
    levelFilter,     setLevelFilter,
    conditionFilter, setConditionFilter,
    regionFilter,    setRegionFilter: setRegionFilterAndReset,
    communeFilter,   setCommuneFilter,
    priceFilter,     setPriceFilter,
    minPrice,        setMinPrice,
    maxPrice,        setMaxPrice,
    stats,
    // Notifications
    notifications, unreadNotifs, unreadMessages, markNotifRead, markAllNotifsRead, notifyMessage,
    // Proposals
    receivedProposals, sentProposals, pendingProposals,
    submitProposal, acceptProposal, declineProposal,
    sortBy, setSortBy,
    showToast, openModal, closeModal,
    toggleLike,
    loginUser, registerUser, socialLogin, logoutUser, updateUserProfile, requestPhoneChange,
    publishProduct, deleteProduct, updateProduct, markProductSold, reactivateProduct, renewProduct, toggleFeatured,
    blockProduct, unblockProduct, banUser, reportProduct,
    blockUser, unblockUser,
    sidebarPinned, sidebarOpen, setSidebarOpen, toggleSidebarPin, openSidebarDrawer,
    openChats, openChatWindow, closeChatWindow, toggleMinimizeChat,
    archiveChat, completeMatch,
    productsLoading,
    hasMoreProducts, loadingMore, loadMoreProducts,
    loadProducts, loadStats, rlMessage,
    db, collection, query, where, orderBy, addDoc, updateDoc, serverTimestamp, getDocs, doc, getDoc, onSnapshot
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
