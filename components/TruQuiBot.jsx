'use client';
import { useState, useRef, useEffect } from 'react';

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
];

const DEFAULT_REPLY = 'Hmm, no estoy seguro. 🤔 Pregúntame sobre cómo publicar, hacer match, niveles o seguridad.';

function getBotReply(text) {
  const lower = text.toLowerCase();
  for (const { keys, reply } of RESPONSES) {
    if (keys.some(k => lower.includes(k))) return reply;
  }
  return DEFAULT_REPLY;
}

export default function TruQuiBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ from: 'bot', text: '¡Hola! Soy TruQuiBot 🤖 ¿En qué puedo ayudarte hoy?' }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  function sendMessage(text) {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { from: 'user', text }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'bot', text: getBotReply(text) }]);
      setTyping(false);
    }, 700 + Math.random() * 400);
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
