'use client';
export default function TermsModal() {
  return (
    <div style={{ fontSize: 13.5, color: 'var(--is)', lineHeight: 1.75 }}>

      <div className="nb" style={{ marginBottom: 20 }}>
        📋 Versión resumida — <a href="/privacidad" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--v)', fontWeight: 600 }}>ver documento completo</a>
      </div>

      <TS title="1. ¿Qué es Truekeamas?">
        Plataforma digital que conecta personas para intercambiar, comprar y vender bienes y servicios en Chile. Actuamos solo como intermediario tecnológico.
      </TS>

      <TS title="2. Exención de responsabilidad">
        Truekeamas <strong>no es parte de ninguna transacción</strong> entre usuarios. No nos responsabilizamos por fraudes, incumplimientos, calidad de artículos, ni por daños derivados de intercambios. Cada usuario asume plena responsabilidad por sus acuerdos.
      </TS>

      <TS title="3. Tus obligaciones">
        <ul style={{ paddingLeft: 18, margin: '6px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <li>Publicar solo artículos verídicos y legales.</li>
          <li>No compartir datos bancarios ni contraseñas en el chat.</li>
          <li>Tratar con respeto a otros usuarios.</li>
          <li>No realizar actividades fraudulentas o ilegales.</li>
        </ul>
      </TS>

      <TS title="4. Privacidad de tus datos">
        Recopilamos tu nombre, correo, teléfono y región para operar la Plataforma. No vendemos tus datos. Puedes solicitar su eliminación en contacto@truekeamas.cl. Cumplimos con la Ley 19.628 (Chile).
      </TS>

      <TS title="5. Seguridad">
        <strong>No compartas RUT, datos bancarios ni contraseñas</strong> en los chats de la Plataforma. Truekeamas nunca te pedirá esa información.
      </TS>

      <TS title="6. Legislación">
        Estos términos se rigen por las leyes de la República de Chile. Ante conflictos, se aplican los tribunales de Santiago.
      </TS>

      <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(224,51,88,.05)', border: '1px solid rgba(224,51,88,.18)', borderRadius: 10, fontSize: 13, color: 'var(--dg)', fontWeight: 500 }}>
        ⚠️ Al aceptar, reconoces que Truekeamas no garantiza el resultado de los intercambios y que actúas bajo tu propia responsabilidad.
      </div>
    </div>
  );
}

function TS({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13.5, color: 'var(--v)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: 'var(--is)' }}>{children}</div>
    </div>
  );
}
