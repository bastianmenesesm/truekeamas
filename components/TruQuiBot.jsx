'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';

const BOT_NAME = 'Truqui';

const RESPONSES = [
  { keys: ['hola', 'hey', 'buenas', 'saludos'], reply: '¡Hola! 👋 Soy Truqui, tu asistente de trueque. ¿En qué puedo ayudarte?' },
  { keys: ['trueque', 'intercambio', 'cómo funciona', 'como funciona'], reply: 'El trueque es simple: publicas lo que tienes, encuentras lo que necesitas y coordinan el intercambio directamente. ¡Sin dinero de por medio! 🔄' },
  { keys: ['publicar', 'publico', 'subir producto'], reply: 'Para publicar: inicia sesión → clic en "Publicar ahora" → sube hasta 2 fotos y completa el formulario. ¡Listo en segundos! ✍️' },
  { keys: ['match', 'acordar', 'contactar'], reply: 'Haz clic en 🤝 Match en cualquier publicación para abrir un chat privado y coordinar el trueque.' },
  { keys: ['seguridad', 'seguro', 'confianza', 'estafa'], reply: 'Consejos: 🔒 No compartas datos bancarios. 📍 Prefiere lugares públicos. 🚩 Usa "Reportar" ante conductas sospechosas.' },
  { keys: ['nivel', 'verificado', 'confiable', 'nuevo'], reply: 'Niveles: 🆕 Nuevo → ✅ Verificado (identidad validada) → ⭐ Confiable (múltiples trueques exitosos).' },
  { keys: ['foto', 'imagen', 'fotos'], reply: 'Puedes subir hasta 2 fotos por publicación. ¡Usa fotos claras para tener más éxito! 📸' },
  { keys: ['categoria', 'categoría', 'tipo'], reply: 'Categorías: 📱 Tecnología, 🛋️ Hogar, ⚽ Deportes, 👕 Moda, 📘 Libros y 🧸 Juguetes.' },
  { keys: ['gracias', 'ok', 'entendido', 'perfecto'], reply: '¡De nada! 😊 ¡Feliz trueque! 🎉' },
  { keys: ['adios', 'adiós', 'chao', 'bye'], reply: '¡Hasta pronto! 👋' },
  {
    keys: ['admin', 'administrador', 'soporte', 'ayuda humana', 'hablar con', 'humano', 'persona real', 'equipo', 'problema', 'denuncia', 'queja'],
    reply: '__CONTACT_ADMIN__',
  },
];

const DEFAULT_REPLY = 'Hmm, no estoy seguro. 🤔 Pregúntame sobre publicar, hacer match, niveles o seguridad. Si necesitas más ayuda puedo conectarte con un administrador.';

function getBotReply(text) {
  const lower = text.toLowerCase();
  for (const { keys, reply } of RESPONSES) {
    if (keys.some(k => lower.includes(k))) return reply;
  }
  return DEFAULT_REPLY;
}

export default function TruQuiBot() {
  const { currentUser, userData } = useApp();
  const [open,    setOpen]    = useState(false);
  const [mode,    setMode]    = useState('bot');      // 'bot' | 'support'
  const [messages, setMessages] = useState([{ from: 'bot', text: '¡Hola! Soy Truqui 👋 ¿En qué puedo ayudarte hoy?' }]);
  const [input,   setInput]   = useState('');
  const [typing,  setTyping]  = useState(false);

  // Contact-admin form
  const [showForm,    setShowForm]    = useState(false);
  const [contactMsg,  setContactMsg]  = useState('');
  const [contactName, setContactName] = useState('');
  const [sending,     setSending]     = useState(false);

  // Live support chat
  const [ticketId,      setTicketId]      = useState(null);
  const [liveMessages,  setLiveMessages]  = useState([]);
  const [liveInput,     setLiveInput]     = useState('');
  const [liveSending,   setLiveSending]   = useState(false);
  const [unreadAdmin,   setUnreadAdmin]   = useState(0);

  const bottomRef     = useRef(null);
  const liveBottomRef = useRef(null);
  const prevMsgCount  = useRef(0);

  useEffect(() => {
    if (open && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, showForm]);

  useEffect(() => {
    if (open && mode === 'support' && liveBottomRef.current) {
      liveBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveMessages, open, mode]);

  useEffect(() => {
    if (currentUser) setContactName(userData?.displayName || currentUser.displayName || '');
  }, [currentUser, userData]);

  // Suscribirse a mensajes del ticket en tiempo real
  useEffect(() => {
    if (!ticketId) return;
    const q = query(
      collection(db, 'support', ticketId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLiveMessages(msgs);
      // Contar mensajes del admin no leídos si el chat de soporte no está abierto
      if (mode !== 'support' || !open) {
        const adminMsgs = msgs.filter(m => m.from === 'admin').length;
        const prev      = prevMsgCount.current;
        if (adminMsgs > prev) setUnreadAdmin(adminMsgs - prev);
      } else {
        setUnreadAdmin(0);
        prevMsgCount.current = msgs.filter(m => m.from === 'admin').length;
      }
    }, () => {});
  }, [ticketId]); // eslint-disable-line

  function handleOpenSupport() {
    setMode('support');
    setUnreadAdmin(0);
    prevMsgCount.current = liveMessages.filter(m => m.from === 'admin').length;
  }

  // ── Enviar mensaje al bot ───────────────────────────────
  function sendBotMessage(text) {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { from: 'user', text }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const reply = getBotReply(text);
      if (reply === '__CONTACT_ADMIN__') {
        setMessages(prev => [...prev, {
          from: 'bot',
          text: 'Entendido. Puedo conectarte directamente con nuestro equipo de administración. ¿Quieres dejarles tu consulta? 📩',
        }]);
        setShowForm(true);
      } else {
        setMessages(prev => [...prev, { from: 'bot', text: reply }]);
      }
      setTyping(false);
    }, 700 + Math.random() * 400);
  }

  // ── Crear ticket de soporte ─────────────────────────────
  async function handleSendToAdmin(e) {
    e.preventDefault();
    if (!contactMsg.trim()) return;
    setSending(true);
    try {
      const ticketRef = await addDoc(collection(db, 'support'), {
        name:      contactName.trim() || 'Anónimo',
        email:     currentUser?.email || '',
        uid:       currentUser?.uid   || null,
        message:   contactMsg.trim(),
        source:    'truquibot',
        status:    'pending',
        createdAt: serverTimestamp(),
      });
      // Agregar mensaje inicial a la subcolección
      await addDoc(collection(db, 'support', ticketRef.id, 'messages'), {
        text:      contactMsg.trim(),
        from:      'user',
        senderName: contactName.trim() || 'Anónimo',
        createdAt: serverTimestamp(),
      });
      setTicketId(ticketRef.id);
      setContactMsg('');
      setShowForm(false);
      setMessages(prev => [...prev, {
        from: 'bot',
        text: '✅ ¡Mensaje enviado! Un administrador responderá pronto. Puedes seguir la conversación en el chat de soporte.',
      }]);
    } catch {
      setMessages(prev => [...prev, { from: 'bot', text: '❌ Hubo un error al enviar. Intenta nuevamente.' }]);
    } finally { setSending(false); }
  }

  // ── Enviar mensaje en el chat en vivo ───────────────────
  async function handleLiveSend() {
    if (!liveInput.trim() || !ticketId) return;
    setLiveSending(true);
    try {
      await addDoc(collection(db, 'support', ticketId, 'messages'), {
        text:       liveInput.trim(),
        from:       'user',
        senderName: contactName || 'Usuario',
        createdAt:  serverTimestamp(),
      });
      setLiveInput('');
    } catch { /* silencio */ }
    finally { setLiveSending(false); }
  }

  // ── Render ──────────────────────────────────────────────
  return (
    <>
      {/* FAB flotante */}
      <button
        className={`truki-fab${open ? ' truki-fab--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        title={BOT_NAME}
      >
        {open
          ? <span style={{ fontSize: 26, lineHeight: 1, color: '#fff', fontWeight: 700 }}>×</span>
          : <Image src="/truqui.png" alt="Truqui" width={46} height={46} style={{ objectFit: 'contain', display: 'block' }} priority />
        }
        {!open && unreadAdmin > 0 && (
          <span style={{ position: 'absolute', top: 2, right: 2, background: '#E03358', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, fontWeight: 800, display: 'grid', placeItems: 'center' }}>
            {unreadAdmin}
          </span>
        )}
      </button>

      {/* Panel del chat */}
      <div className={`truki-panel${open ? ' open' : ''}`}>

        {/* ── MODO BOT ─────────────────────────────────── */}
        {mode === 'bot' && (
          <>
            <div className="truki-header">
              <div className="truki-header-avatar">
                <Image src="/truqui.png" alt="Truqui" width={34} height={34} style={{ objectFit: 'contain' }} />
              </div>
              <div className="truki-header-info">
                <div className="truki-header-name">{BOT_NAME}</div>
                <div className="truki-header-status">
                  <span className="truki-dot" />
                  Asistente de trueque
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {ticketId && (
                  <button
                    onClick={handleOpenSupport}
                    style={{ position: 'relative', fontSize: 11, fontWeight: 700, padding: '4px 10px', background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: 8, cursor: 'pointer' }}
                  >
                    💬 Soporte
                    {unreadAdmin > 0 && (
                      <span style={{ position: 'absolute', top: -6, right: -6, background: '#E03358', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, fontWeight: 800, display: 'grid', placeItems: 'center' }}>
                        {unreadAdmin}
                      </span>
                    )}
                  </button>
                )}
                <button className="truki-close" onClick={() => setOpen(false)}>×</button>
              </div>
            </div>

            <div className="truki-body">
              {messages.map((m, i) => (
                <div key={i} className={`truki-row truki-row--${m.from === 'user' ? 'user' : 'bot'}`}>
                  {m.from !== 'user' && (
                    <div className="truki-bot-avatar">
                      <Image src="/truqui.png" alt="Truqui" width={18} height={18} style={{ objectFit: 'contain' }} />
                    </div>
                  )}
                  <div className="truki-bubble-wrap">
                    <div className={`truki-bubble truki-bubble--${m.from === 'user' ? 'user' : 'bot'}`}>{m.text}</div>
                  </div>
                </div>
              ))}
              {typing && (
                <div className="truki-row truki-row--bot">
                  <div className="truki-bot-avatar">
                    <Image src="/truqui.png" alt="Truqui" width={18} height={18} style={{ objectFit: 'contain' }} />
                  </div>
                  <div className="truki-typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}

              {showForm && (
                <div style={{ margin: '8px 4px', background: 'var(--sf)', border: '1.5px solid var(--v)', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--v)', marginBottom: 10 }}>
                    📩 Mensaje al equipo de administración
                  </div>
                  <form onSubmit={handleSendToAdmin} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {!currentUser && (
                      <input type="text" placeholder="Tu nombre" value={contactName} onChange={e => setContactName(e.target.value)}
                        style={{ fontSize: 12, padding: '6px 10px', border: '1.5px solid var(--ln)', borderRadius: 8, background: 'var(--bg)', color: 'var(--ink)' }} />
                    )}
                    <textarea placeholder="Describe tu consulta o problema…" value={contactMsg} onChange={e => setContactMsg(e.target.value)}
                      required rows={3}
                      style={{ fontSize: 12, padding: '6px 10px', border: '1.5px solid var(--ln)', borderRadius: 8, background: 'var(--bg)', color: 'var(--ink)', resize: 'none', fontFamily: 'inherit' }} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="submit" disabled={sending || !contactMsg.trim()}
                        style={{ flex: 1, fontSize: 12, padding: 7, background: 'var(--v)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
                        {sending ? 'Enviando…' : '📨 Enviar'}
                      </button>
                      <button type="button" onClick={() => setShowForm(false)}
                        style={{ fontSize: 12, padding: '7px 12px', background: 'var(--sf)', border: '1.5px solid var(--ln)', borderRadius: 8, cursor: 'pointer', color: 'var(--mu)' }}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="truki-footer">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendBotMessage(input); }}
                placeholder="Escribe tu pregunta..." autoComplete="off" />
              <button className="truki-send" onClick={() => sendBotMessage(input)}>
                <svg viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="M22 2 11 13" /></svg>
              </button>
            </div>
          </>
        )}

        {/* ── MODO SOPORTE EN VIVO ──────────────────────── */}
        {mode === 'support' && (
          <>
            <div className="truki-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => setMode('bot')}
                  style={{ background: 'rgba(255,255,255,.2)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 18, lineHeight: 1, padding: '4px 8px', borderRadius: 8 }}>
                  ←
                </button>
                <div className="truki-header-info">
                  <div className="truki-header-name">💬 Chat con soporte</div>
                  <div className="truki-header-status">
                    <span className="truki-dot" />
                    En línea
                  </div>
                </div>
              </div>
              <button className="truki-close" onClick={() => setOpen(false)}>×</button>
            </div>

            <div className="truki-body">
              {liveMessages.length === 0 && (
                <div className="truki-row truki-row--bot">
                  <div className="truki-bubble-wrap">
                    <div className="truki-bubble truki-bubble--bot" style={{ fontStyle: 'italic' }}>
                      Tu mensaje fue recibido. Un administrador responderá en breve ⏳
                    </div>
                  </div>
                </div>
              )}
              {liveMessages.map(m => (
                <div key={m.id} className={`truki-row truki-row--${m.from === 'user' ? 'user' : 'bot'}`}>
                  <div className="truki-bubble-wrap">
                    {m.from === 'admin' && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--mu)', display: 'block', marginBottom: 2 }}>
                        🛡️ Admin
                      </span>
                    )}
                    <div className={`truki-bubble truki-bubble--${m.from === 'user' ? 'user' : 'bot'}`}>
                      {m.text}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={liveBottomRef} />
            </div>

            <div className="truki-footer">
              <input value={liveInput} onChange={e => setLiveInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleLiveSend(); }}
                placeholder="Escribe tu mensaje…" autoComplete="off" />
              <button className="truki-send" onClick={handleLiveSend} disabled={liveSending || !liveInput.trim()}>
                <svg viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="M22 2 11 13" /></svg>
              </button>
            </div>
          </>
        )}

      </div>
    </>
  );
}
