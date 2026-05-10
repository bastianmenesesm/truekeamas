export default function HelpModal() {
  const items = [
    { q: '¿Qué es el trueque?', a: 'Intercambias tu producto por otro de valor similar sin usar dinero. Puedes acordar trueque puro, compra directa o acuerdo mixto.' },
    { q: '¿Cómo publico mi producto?', a: 'Regístrate, haz clic en "Publicar ahora", sube hasta 2 fotos y completa el formulario.' },
    { q: '¿Qué es el Match?', a: 'Al hacer clic en 🤝 Match se crea un chat privado en tiempo real para coordinar el trueque.' },
    { q: '¿Cómo funciona la seguridad?', a: 'No compartas datos bancarios. Prefiere entregas en lugares públicos. Usa "Reportar" ante conductas sospechosas.' },
    { q: '¿Qué son los niveles?', a: 'Nuevo: recién registrado. Verificado: identidad validada. Confiable: múltiples trueques exitosos.' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {items.map(({ q, a }) => (
        <div key={q} className="nb"><strong style={{ display: 'block', marginBottom: 6 }}>{q}</strong>{a}</div>
      ))}
    </div>
  );
}
