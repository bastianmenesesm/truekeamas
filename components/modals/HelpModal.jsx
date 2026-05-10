export default function HelpModal() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[
        { q: '¿Qué es el trueque?', a: 'El trueque es intercambiar tu producto o servicio por otro de valor similar, sin usar dinero. En Truekeamas puedes acordar trueque puro, compra directa o acuerdo mixto.' },
        { q: '¿Cómo publico mi producto?', a: 'Regístrate, haz clic en "Publicar ahora", sube hasta 2 fotos, completa el formulario y publica. Tu publicación aparecerá en la vitrina.' },
        { q: '¿Qué es el Match?', a: 'Al hacer clic en 🤝 Match se crea un chat privado en tiempo real entre tú y el dueño de la publicación para coordinar el trueque.' },
        { q: '¿Cómo funciona la seguridad?', a: 'No compartas datos bancarios. Prefiere entregas en lugares públicos. Usa el botón "Reportar" ante conductas sospechosas.' },
        { q: '¿Qué son los niveles de usuario?', a: 'Nuevo: recién registrado. Verificado: identidad validada. Confiable: múltiples trueques exitosos y calificaciones positivas.' },
      ].map(({ q, a }) => (
        <div key={q} className="nb">
          <strong style={{ display: 'block', marginBottom: 6 }}>{q}</strong>
          {a}
        </div>
      ))}
    </div>
  );
}
