'use client';
import { useState, useRef } from 'react';

const TQA = {
  trueque: 'El trueque es el corazón de Truekeamas. Publicas tu producto con 2 fotos, otro usuario hace clic en "🤝 Match" y se abre un chat en tiempo real donde coordinan el intercambio.',
  publicar: 'Para publicar: 1) Inicia sesión. 2) Clic en "Publicar ahora". 3) Sube 2 fotos de tu producto. 4) Completa título, categoría, valor referencial y qué buscas. 5) ¡Publicar!',
  match: 'Para hacer match: ve a una publicación y haz clic en "🤝 Match". Se crea un chat privado en tiempo real. Pueden enviarse mensajes e imágenes.',
  seguridad: 'Seguridad: No compartas datos bancarios. Prefiere entregas presenciales en lugares públicos. Usa "Reportar" ante cualquier sospecha.',
  fallback: 'Puedo ayudarte con: trueque, cómo publicar con fotos, cómo hacer match, seguridad o niveles de usuario.',
};

export default function TruQuiBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ type: 'bot', text: 'Hola, soy Truqui. ¿En qué puedo ayudarte?' }]);
  const inputRef = useRef(null);

  function addMsg(type, text) {
    setMessages(prev => [...prev, { type, text }]);
  }

  function handleQ(key) {
    addMsg('user', { trueque: '¿Cómo funciona el trueque?', publicar: '¿Cómo publico con fotos?', match: '¿Cómo hago match?', seguridad: '¿Cómo es la seguridad?' }[key] || key);
    setTimeout(() => addMsg('bot', TQA[key] || TQA.fallback), 300);
  }

  function sendMsg() {
    const txt = inputRef.current?.value.trim();
    if (!txt) return;
    addMsg('user', txt);
    if (inputRef.current) inputRef.current.value = '';
    const key = Object.keys(TQA).find(k => txt.toLowerCase().includes(k)) || 'fallback';
    setTimeout(() => addMsg('bot', TQA[key]), 300);
  }

  return (
    <>
      <button className="tfab" onClick={() => setOpen(o => !o)}>🤖</button>

      <div className={`tp${open ? ' open' : ''}`}>
        <div className="tph">
          <div style={{ fontSize: 24 }}>🤖</div>
          <div style={{ flex: 1 }}><h4>Truqui</h4><p>● Asistente virtual</p></div>
          <button className="tx" onClick={() => setOpen(false)}>×</button>
        </div>

        <div className="tpb">
          <div className="ti2"><b>👋 ¡Hola! Soy Truqui</b>Pregúntame sobre trueques, publicaciones, match o seguridad.</div>
          <div className="qg">
            <button className="qb" onClick={() => handleQ('trueque')}>↻ ¿Cómo funciona el trueque?</button>
            <button className="qb" onClick={() => handleQ('publicar')}>📷 Cómo publicar con fotos</button>
            <button className="qb" onClick={() => handleQ('match')}>🤝 Cómo hacer match</button>
            <button className="qb" onClick={() => handleQ('seguridad')}>🔐 Seguridad</button>
          </div>
          <div className="tc">
            {messages.map((m, i) => (
              <div key={i} className={`tcm ${m.type === 'bot' ? 'bot' : 'user'}`}>{m.text}</div>
            ))}
          </div>
        </div>

        <div className="tir">
          <input ref={inputRef} placeholder="Escribe tu pregunta..." onKeyDown={e => { if (e.key === 'Enter') sendMsg(); }} />
          <button className="ts" onClick={sendMsg}>
            <svg viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="M22 2 11 13" /></svg>
          </button>
        </div>
      </div>
    </>
  );
}
