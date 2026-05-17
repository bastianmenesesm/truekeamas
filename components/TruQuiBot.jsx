'use client';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const BOT_NAME = 'TruQuiBot';

const RESPONSES = [
  { keys: ['hola', 'hey', 'buenas', 'saludos'], reply: '¡Hola! 👋 Soy TruQuiBot, tu asistente de trueque. ¿En qué puedo ayudarte?' },
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

const DEFAULT_REPLY = 'Hmm, no estoy seguro. 🤔 Pregúntame sobre cómo publicar, hacer match, niveles o seguridad. Si necesitas ayuda adicional, puedo conectarte con un administrador.';

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
  const [messages, setMessages] = useState([{ from: 'bot', text: '¡Hola! Soy TruQuiBot 🤖 ¿En qué puedo ayudarte hoy?' }]);
  const [input,   setInput]   = useState('');
  const [typing,  setTyping]  = useState(false);

  // Contact-admin form state
  const [showForm,     setShowForm]     = useState(false);
  const [contactMsg,   setContactMsg]   = useState('');
  const [contactName,  setContactName]  = useState('');
  const [sending,      setSending]      = useState(false);
  const [sent,         setSent]         = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, showForm]);

  // Pre-fill name from user data
  useEffect(() => {
    if (currentUser) setContactName(userData?.displayName || currentUser.displayName || '');
  }, [currentUser, userData]);

  function sendMessage(text) {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { from: 'user', text }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const reply = getBotReply(text);
      if (reply === '__CONTACT_ADMIN__') {
        setMessages(prev => [...prev, {
          from: 'bot',
          text: 'Entendido. Puedo enviarte un mensaje directo a nuestro equipo de administración. ¿Quieres dejarles tu consulta? 📩',
        }]);
        setShowForm(true);
        setSent(false);
      } else {
        setMessages(prev => [...prev, { from: 'bot', text: reply }]);
      }
      setTyping(false);
    }, 700 + Math.random() * 400);
  }

  async function handleSendToAdmin(e) {
    e.preventDefault();
    if (!contactMsg.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'support'), {
        name:      contactName.trim() || 'Anónimo',
        email:     currentUser?.email || '',
        uid:       currentUser?.uid   || null,
        message:   contactMsg.trim(),
        source:    'truquibot',
        status:    'pending',
        createdAt: serverTimestamp(),
      });
      setSent(true);
      setShowForm(false);
      setContactMsg('');
      setMessages(prev => [...prev, {
        from: 'bot',
        text: '✅ ¡Mensaje enviado! Un administrador revisará tu consulta pronto. ¿Hay algo más en lo que pueda ayudarte?',
      }]);
    } catch {
      setMessages(prev => [...prev, {
        from: 'bot',
        text: '❌ Hubo un error al enviar. Por favor intenta nuevamente.',
      }]);
    } finally { setSending(false); }
  }

  return (
    <>
      <button className="tfab" onClick={() => setOpen(o => !o)} title={BOT_NAME}>
        {open ? '×' : '🤖'}
      </button>
      <div className={`tp${open ? ' open' : ''}`}>
        <div className="tph">
          <div>
            <h4>🤖 {BOT_NAME}</h4>
            <p>Asistente de trueque</p>
          </div>
          <button className="tx" onClick={() => setOpen(false)}>×</button>
        </div>
        <div className="tpb">
          {messages.map((m, i) => (
            <div key={i} className={`tcm ${m.from === 'user' ? 'user' : 'bot'}`}>{m.text}</div>
          ))}
          {typing && <div className="tcm bot">●●●</div>}

          {/* Formulario de contacto admin */}
          {showForm && !sent && (
            <div style={{
              margin: '8px 4px',
              background: 'var(--sf)',
              border: '1.5px solid var(--v)',
              borderRadius: 12,
              padding: '14px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--v)', marginBottom: 10 }}>
                📩 Mensaje al equipo de administración
              </div>
              <form onSubmit={handleSendToAdmin} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {!currentUser && (
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    style={{ fontSize: 12, padding: '6px 10px', border: '1.5px solid var(--ln)', borderRadius: 8, background: 'var(--bg)', color: 'var(--ink)' }}
                  />
                )}
                <textarea
                  placeholder="Describe tu consulta o problema…"
                  value={contactMsg}
                  onChange={e => setContactMsg(e.target.value)}
                  required
                  rows={3}
                  style={{ fontSize: 12, padding: '6px 10px', border: '1.5px solid var(--ln)', borderRadius: 8, background: 'var(--bg)', color: 'var(--ink)', resize: 'none', fontFamily: 'inherit' }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="submit"
                    disabled={sending || !contactMsg.trim()}
                    style={{ flex: 1, fontSize: 12, padding: '7px', background: 'var(--v)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}
                  >
                    {sending ? 'Enviando…' : '📨 Enviar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{ fontSize: 12, padding: '7px 12px', background: 'var(--sf)', border: '1.5px solid var(--ln)', borderRadius: 8, cursor: 'pointer', color: 'var(--mu)' }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
        <div className="tir">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendMessage(input); }}
            placeholder="Escribe tu pregunta..."
            autoComplete="off"
          />
          <button className="ts" onClick={() => sendMessage(input)}>
            <svg viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="M22 2 11 13" /></svg>
          </button>
        </div>
      </div>
    </>
  );
}
