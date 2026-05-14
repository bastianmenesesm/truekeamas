export default function ProcessSection() {
  const steps = [
    { n: '01', label: 'Publica lo que tienes' },
    { n: '02', label: 'Recibe propuestas' },
    { n: '03', label: 'Acuerda por chat' },
    { n: '04', label: 'Confirma y califica' },
  ];

  const badges = [
    { icon: '🔒', label: 'Confirmación bilateral' },
    { icon: '⭐', label: 'Reputación verificada' },
    { icon: '🚩', label: 'Reportes y bloqueos' },
    { icon: '🤝', label: 'Sin comisiones' },
  ];

  return (
    <div className="ps-compact">
      {/* Pasos */}
      <div className="ps-steps">
        {steps.map((s, i) => (
          <div key={s.n} className="ps-step-wrap">
            <div className="ps-step">
              <span className="ps-step-n">{s.n}</span>
              <span className="ps-step-label">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <svg className="ps-arrow" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="ps-divider" />

      {/* Badges de confianza */}
      <div className="ps-badges">
        {badges.map(b => (
          <span key={b.label} className="ps-badge">
            {b.icon} {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
