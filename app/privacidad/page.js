export const metadata = {
  title: 'Política de Privacidad | Truekeamas',
  description: 'Política de privacidad y protección de datos personales de Truekeamas.',
  alternates: { canonical: 'https://truekeamas.cl/privacidad' },
};

export default function PrivacidadPage() {
  return (
    <main style={{ maxWidth: 780, margin: '0 auto', padding: '48px 24px 80px', fontFamily: 'Inter, sans-serif', color: '#0A1929', lineHeight: 1.75 }}>
      <div style={{ marginBottom: 40 }}>
        <a href="/" style={{ color: '#1B6FCA', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>← Volver a Truekeamas</a>
      </div>

      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, marginBottom: 8, color: '#0A1929' }}>
        Política de Privacidad
      </h1>
      <p style={{ color: '#5B7D9E', fontSize: 14, marginBottom: 48 }}>Última actualización: enero 2025 · Truekeamas SpA · Chile</p>

      <Section title="1. Protección de Datos Personales">
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

      <Section title="2. Seguridad de la Información">
        <p>Truekeamas implementa medidas técnicas y organizativas razonables para proteger los datos personales. Sin embargo, ningún sistema de transmisión de datos por internet es completamente seguro.</p>
        <p><strong>Te recomendamos no compartir información personal sensible (RUT, datos bancarios, contraseñas) a través del chat de la Plataforma.</strong></p>
      </Section>

      <Section title="3. Cookies y Tecnologías de Seguimiento">
        <p>Truekeamas puede utilizar cookies y tecnologías similares para mejorar la experiencia de usuario, recordar preferencias y analizar el uso de la Plataforma. Puedes configurar tu navegador para rechazar cookies, aunque esto puede afectar algunas funcionalidades.</p>
      </Section>

      <Section title="4. Retención de Datos">
        <p>Los datos personales se conservan mientras la cuenta del usuario esté activa o mientras sean necesarios para los fines descritos en esta política. Puedes solicitar la eliminación de tu cuenta y datos personales escribiendo a contacto@truekeamas.cl.</p>
      </Section>

      <Section title="5. Contacto">
        <p>Para ejercer tus derechos sobre datos personales o consultas sobre privacidad:</p>
        <p><strong>Truekeamas SpA</strong><br />
        Correo: contacto@truekeamas.cl<br />
        País: Chile</p>
      </Section>

      <div style={{ marginTop: 32, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <a href="/terminos" style={{ color: '#1B6FCA', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
          Ver Términos de Uso →
        </a>
      </div>

      <div style={{ marginTop: 32, padding: '20px 24px', background: '#F2F8FF', borderRadius: 14, border: '1px solid #D0E3F5', fontSize: 13, color: '#5B7D9E' }}>
        Al crear una cuenta o utilizar Truekeamas aceptas nuestra Política de Privacidad. Si tienes dudas, escríbenos antes de registrarte.
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
