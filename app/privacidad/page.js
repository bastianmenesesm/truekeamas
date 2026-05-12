export const metadata = {
  title: 'Términos y Política de Privacidad | Truekeamas',
  description: 'Conoce los términos de uso y política de privacidad de Truekeamas.',
};

export default function PrivacidadPage() {
  return (
    <main style={{ maxWidth: 780, margin: '0 auto', padding: '48px 24px 80px', fontFamily: 'Inter, sans-serif', color: '#0A1929', lineHeight: 1.75 }}>
      <div style={{ marginBottom: 40 }}>
        <a href="/" style={{ color: '#1B6FCA', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>← Volver a Truekeamas</a>
      </div>

      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, marginBottom: 8, color: '#0A1929' }}>
        Términos de Uso y Política de Privacidad
      </h1>
      <p style={{ color: '#5B7D9E', fontSize: 14, marginBottom: 48 }}>Última actualización: enero 2025 · Truekeamas SpA · Chile</p>

      <Section title="1. Aceptación de los Términos">
        <p>Al registrarte, acceder o utilizar la plataforma Truekeamas (en adelante "la Plataforma"), declaras haber leído, comprendido y aceptado en su totalidad los presentes Términos de Uso y la Política de Privacidad. Si no estás de acuerdo con alguna de estas condiciones, debes abstenerte de utilizar la Plataforma.</p>
        <p>Truekeamas se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán comunicados mediante la publicación de una versión actualizada en esta página.</p>
      </Section>

      <Section title="2. Descripción del Servicio">
        <p>Truekeamas es una plataforma digital de intermediación que conecta a usuarios que desean intercambiar, vender o adquirir bienes y/o servicios entre sí (en adelante "Trueques"). Truekeamas actúa exclusivamente como intermediario tecnológico y no es parte de ninguna transacción realizada entre usuarios.</p>
      </Section>

      <Section title="3. Exención de Responsabilidad">
        <p><strong>Truekeamas no es responsable, en ningún caso, de:</strong></p>
        <ul>
          <li>La veracidad, exactitud, calidad o legalidad de los bienes o servicios publicados por los usuarios.</li>
          <li>El cumplimiento de los acuerdos pactados entre usuarios fuera o dentro de la Plataforma.</li>
          <li>Daños, perjuicios, pérdidas económicas o de cualquier otra naturaleza que pudieran derivarse de intercambios realizados entre usuarios.</li>
          <li>Fraudes, estafas, engaños o cualquier conducta ilícita perpetrada por usuarios de la Plataforma.</li>
          <li>La idoneidad, seguridad o estado de los artículos intercambiados.</li>
          <li>Conflictos entre usuarios derivados de acuerdos no cumplidos.</li>
          <li>El uso indebido de la información personal que los usuarios compartan voluntariamente con terceros a través del chat u otros medios de comunicación de la Plataforma.</li>
        </ul>
        <p>Los usuarios asumen plena y exclusiva responsabilidad por todas las transacciones e intercambios que realicen a través de la Plataforma, así como por las consecuencias derivadas de los mismos.</p>
      </Section>

      <Section title="4. Obligaciones del Usuario">
        <p>Al utilizar Truekeamas, el usuario se compromete a:</p>
        <ul>
          <li>Proporcionar información veraz y actualizada en su perfil y publicaciones.</li>
          <li>No publicar artículos ilegales, falsificados, peligrosos o que infrinjan derechos de terceros.</li>
          <li>No utilizar la Plataforma para actividades fraudulentas, engañosas o ilegales.</li>
          <li>Tratar con respeto a los demás usuarios y no incurrir en conductas de acoso, discriminación o amenazas.</li>
          <li>No compartir datos personales sensibles (número de cuenta bancaria, RUT, contraseñas, etc.) a través del chat de la Plataforma.</li>
          <li>No intentar vulnerar la seguridad de la Plataforma ni acceder a cuentas de otros usuarios.</li>
          <li>Cumplir con la legislación chilena vigente en materia de comercio, protección al consumidor y privacidad de datos.</li>
        </ul>
      </Section>

      <Section title="5. Política de Privacidad y Protección de Datos">
        <p>Truekeamas recopila y trata datos personales de conformidad con la Ley N° 19.628 sobre Protección de la Vida Privada de Chile.</p>
        <p><strong>Datos que recopilamos:</strong></p>
        <ul>
          <li>Nombre y apellido, correo electrónico, número de teléfono y región de residencia, proporcionados al registrarse.</li>
          <li>Información de publicaciones: fotografías, descripciones y precios de artículos.</li>
          <li>Datos de uso: interacciones dentro de la Plataforma (matches, propuestas, mensajes, guardados).</li>
        </ul>
        <p><strong>Finalidad del tratamiento:</strong></p>
        <ul>
          <li>Operar y mejorar la Plataforma.</li>
          <li>Facilitar la conexión entre usuarios.</li>
          <li>Enviar comunicaciones transaccionales (restablecimiento de contraseña, notificaciones de la Plataforma).</li>
          <li>Cumplir con obligaciones legales.</li>
        </ul>
        <p><strong>Compartición de datos:</strong> Truekeamas no vende ni cede datos personales a terceros con fines comerciales. Los datos únicamente podrán ser compartidos con proveedores de servicios tecnológicos (Firebase de Google, Cloudinary, Brevo) estrictamente necesarios para el funcionamiento de la Plataforma, sujetos a sus propias políticas de privacidad.</p>
        <p><strong>Derechos del titular:</strong> Tienes derecho a acceder, rectificar, cancelar u oponerte al tratamiento de tus datos personales escribiéndonos a contacto@truekeamas.cl.</p>
      </Section>

      <Section title="6. Seguridad de la Información">
        <p>Truekeamas implementa medidas técnicas y organizativas razonables para proteger los datos personales. Sin embargo, ningún sistema de transmisión de datos por internet es completamente seguro. <strong>Te recomendamos no compartir información personal sensible (RUT, datos bancarios, contraseñas) a través del chat de la Plataforma.</strong></p>
      </Section>

      <Section title="7. Contenido de los Usuarios">
        <p>El usuario conserva los derechos sobre el contenido que publica (fotos, descripciones). Al subir contenido a Truekeamas, otorga a la Plataforma una licencia no exclusiva, gratuita y mundial para mostrar dicho contenido únicamente con el fin de operar el servicio.</p>
        <p>Truekeamas se reserva el derecho de eliminar o bloquear publicaciones que incumplan estos Términos, sin necesidad de notificación previa.</p>
      </Section>

      <Section title="8. Suspensión y Cancelación de Cuentas">
        <p>Truekeamas podrá suspender o cancelar cuentas de usuario que incumplan estos Términos, sin que ello genere derecho a indemnización alguna. El usuario puede solicitar la eliminación de su cuenta escribiendo a contacto@truekeamas.cl.</p>
      </Section>

      <Section title="9. Legislación Aplicable">
        <p>Estos Términos se rigen por las leyes de la República de Chile. Cualquier controversia derivada de su interpretación o cumplimiento se someterá a los tribunales ordinarios de justicia de la ciudad de Santiago de Chile.</p>
      </Section>

      <Section title="10. Contacto">
        <p>Para consultas, reclamos o ejercicio de derechos sobre datos personales:</p>
        <p><strong>Truekeamas SpA</strong><br />
        Correo: contacto@truekeamas.cl<br />
        País: Chile</p>
      </Section>

      <div style={{ marginTop: 48, padding: '20px 24px', background: '#F2F8FF', borderRadius: 14, border: '1px solid #D0E3F5', fontSize: 13, color: '#5B7D9E' }}>
        Al crear una cuenta o utilizar Truekeamas aceptas íntegramente estos Términos. Si tienes dudas, escríbenos antes de registrarte.
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#1B6FCA', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #D0E3F5' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14.5, color: '#1A3558' }}>
        {children}
      </div>
    </section>
  );
}
