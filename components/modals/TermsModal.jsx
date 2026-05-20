'use client';

export default function TermsModal() {
  return (
    <div style={{ fontSize: 13.5, color: 'var(--is)', lineHeight: 1.75 }}>

      <div className="nb" style={{ marginBottom: 20, fontSize: 13 }}>
        Última actualización: mayo 2025 · Al usar Truekeamas aceptas estos términos en su totalidad.
      </div>

      <TS title="1. ¿Qué es Truekeamas?">
        Truekeamas es una plataforma digital que conecta a personas naturales para intercambiar, comprar, vender o donar bienes y servicios en Chile. <strong>Actuamos exclusivamente como intermediario tecnológico</strong> y no somos parte de ninguna transacción, acuerdo ni intercambio que se realice entre usuarios.
      </TS>

      <TS title="2. Requisito de edad — Solo mayores de 18 años">
        <div style={{ background: 'rgba(22,119,255,.07)', border: '1.5px solid rgba(22,119,255,.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
          🔞 <strong>El uso de Truekeamas está estrictamente reservado a personas mayores de 18 años.</strong>
        </div>
        Al registrarte o usar la Plataforma declaras, bajo tu responsabilidad, que tienes 18 años o más. Si Truekeamas detecta o tiene indicios fundados de que un usuario es menor de 18 años, podrá suspender o eliminar la cuenta de forma inmediata y sin previo aviso, sin que esto genere derecho a compensación o indemnización alguna.
      </TS>

      <TS title="3. Exención de responsabilidad de Truekeamas">
        Truekeamas <strong>no participa, no media, no garantiza ni avala</strong> ninguna transacción, intercambio, compraventa o acuerdo entre usuarios. En consecuencia:
        <ul style={{ paddingLeft: 18, margin: '8px 0', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <li>No somos responsables por fraudes, estafas, incumplimientos o conductas dolosas de terceros.</li>
          <li>No garantizamos la calidad, estado, autenticidad, legalidad ni descripción de ningún artículo o servicio publicado.</li>
          <li>No respondemos por daños, pérdidas económicas, perjuicios físicos ni morales derivados de intercambios realizados a través de la Plataforma.</li>
          <li>No intervenimos en disputas entre usuarios ni actuamos como árbitro en conflictos.</li>
          <li>No garantizamos la identidad real, solvencia ni buena fe de los usuarios.</li>
        </ul>
        El uso de la Plataforma es <strong>bajo el exclusivo riesgo y responsabilidad del usuario</strong>.
      </TS>

      <TS title="4. Obligaciones del usuario">
        Al usar Truekeamas te comprometes a:
        <ul style={{ paddingLeft: 18, margin: '8px 0', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <li>Ser mayor de 18 años y proporcionar información veraz al registrarte.</li>
          <li>Publicar únicamente artículos o servicios que sean de tu propiedad o que tengas autorización para ofrecer.</li>
          <li>No publicar artículos ilegales, robados, falsificados, peligrosos, o cuya comercialización esté prohibida por la ley chilena.</li>
          <li>No publicar contenido ofensivo, discriminatorio, pornográfico ni que infrinja derechos de terceros.</li>
          <li>No usar la Plataforma para actividades fraudulentas, lavado de activos o cualquier acto ilícito.</li>
          <li>Tratar con respeto a otros usuarios en los chats y comunicaciones.</li>
          <li>No compartir datos bancarios, contraseñas, RUT completo ni información sensible en los chats.</li>
          <li>No crear cuentas falsas, duplicadas ni suplantar la identidad de terceros.</li>
          <li>No utilizar sistemas automatizados (bots, scrapers) para acceder a la Plataforma.</li>
        </ul>
        El incumplimiento de cualquiera de estas obligaciones podrá resultar en la suspensión o eliminación permanente de la cuenta, sin derecho a reembolso ni compensación.
      </TS>

      <TS title="5. Contenido prohibido">
        Está expresamente prohibido publicar:
        <ul style={{ paddingLeft: 18, margin: '8px 0', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <li>Armas, municiones, explosivos o cualquier artículo bélico.</li>
          <li>Drogas, estupefacientes o sustancias controladas.</li>
          <li>Medicamentos con receta médica o productos farmacéuticos sin autorización.</li>
          <li>Animales silvestres protegidos o productos derivados de fauna silvestre.</li>
          <li>Artículos robados o de procedencia ilícita.</li>
          <li>Material sexual explícito o que involucre menores de edad.</li>
          <li>Datos personales de terceros sin su consentimiento.</li>
          <li>Servicios que impliquen actividades ilegales de cualquier tipo.</li>
        </ul>
        Truekeamas se reserva el derecho de eliminar cualquier publicación que, a su exclusivo criterio, infrinja estos términos o las leyes vigentes.
      </TS>

      <TS title="6. Cuentas y acceso">
        Eres responsable de mantener la confidencialidad de tus credenciales de acceso. Truekeamas no será responsable por accesos no autorizados a tu cuenta derivados de negligencia del usuario. Nos reservamos el derecho de suspender, restringir o eliminar cualquier cuenta que viole estos Términos, presente actividad sospechosa o sea reportada fundadamente por otros usuarios, sin necesidad de aviso previo ni expresión de causa.
      </TS>

      <TS title="7. Propiedad intelectual">
        Todos los elementos de la Plataforma — marca, logotipo, diseño, código, textos y funcionalidades — son propiedad exclusiva de Truekeamas y están protegidos por la ley chilena de propiedad intelectual. Queda prohibida su reproducción, distribución o uso sin autorización escrita. Al publicar contenido en la Plataforma, el usuario otorga a Truekeamas una licencia gratuita, no exclusiva y mundial para mostrar dicho contenido con el fin de operar el servicio.
      </TS>

      <TS title="8. Privacidad y datos personales">
        Recopilamos nombre, correo electrónico, teléfono y región para operar la Plataforma, conforme a la Ley N° 19.628 sobre Protección de la Vida Privada. No vendemos ni cedemos tus datos a terceros con fines comerciales. Puedes solicitar acceso, rectificación o eliminación de tus datos escribiendo a <strong>contacto@truekeamas.cl</strong>.
      </TS>

      <TS title="9. Limitación de responsabilidad">
        En la máxima medida permitida por la ley chilena, Truekeamas no será responsable por daños directos, indirectos, incidentales, especiales, punitivos ni consecuentes que resulten del uso o imposibilidad de uso de la Plataforma, incluyendo pérdida de datos, pérdida de ganancias, interrupciones del servicio o daños derivados de conductas de terceros usuarios. La responsabilidad máxima de Truekeamas, en cualquier caso, no excederá el monto de cero pesos (CLP $0), dado que la Plataforma se ofrece de forma gratuita.
      </TS>

      <TS title="10. Modificaciones">
        Truekeamas podrá modificar estos Términos en cualquier momento. Los cambios se informarán mediante aviso en la Plataforma. El uso continuado después de la publicación de cambios constituye aceptación de los nuevos Términos.
      </TS>

      <TS title="11. Legislación y jurisdicción">
        Estos Términos se rigen por las leyes de la República de Chile. Para cualquier controversia derivada del uso de la Plataforma, las partes se someten a la jurisdicción de los Tribunales Ordinarios de Justicia de la ciudad de Santiago de Chile, renunciando a cualquier otro fuero que pudiera corresponderles.
      </TS>

      <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(224,51,88,.06)', border: '1px solid rgba(224,51,88,.2)', borderRadius: 10, fontSize: 13, color: 'var(--dg)', fontWeight: 500, lineHeight: 1.6 }}>
        ⚠️ <strong>Al registrarte o usar Truekeamas declaras que:</strong> (1) tienes 18 años o más, (2) has leído y aceptas estos Términos en su totalidad, y (3) actúas bajo tu propia responsabilidad en todos los intercambios que realices.
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
