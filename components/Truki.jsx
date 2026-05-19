'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDocs, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

/* ═══════════════════════════════════════════════════════════
   NORMALIZACIÓN Y MATCHING
═══════════════════════════════════════════════════════════ */
function norm(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!.,;:()]/g, '');
}

function bestMatch(input, entries) {
  const ni = norm(input);
  let best = null, top = 0;
  for (const e of entries) {
    let score = 0;
    for (const p of e.pat) { if (ni.includes(norm(p))) score += p.length + 1; }
    if (score > top) { top = score; best = e; }
  }
  return top > 0 ? best : null;
}

/* ═══════════════════════════════════════════════════════════
   KNOWLEDGE BASE — 30 temas
   pat: palabras/frases clave
   text: respuesta (puede ser función si necesita contexto)
   chips: sugerencias rápidas
   action: {label, modal} → abre modal
   flow: nombre del flujo especial a iniciar
═══════════════════════════════════════════════════════════ */
const KB = [
  /* 1 ── SALUDO */
  { id:'greet',
    pat:['hola','wena','wenas','buenas','hey','saludos','buenos dias','buenas tardes','buenas noches','alo','que tal','que onda','como estas'],
    text:(n)=>`¡Wena${n?' '+n.split(' ')[0]:''}! 👋 Soy **Truqui**, el asistente de Truekeamas.\n¿En qué te doy una mano hoy po? 😊`,
    chips:['🗺️ Tour de la plataforma','🔄 ¿Cómo funciona?','📤 ¿Cómo publico?','🤝 ¿Cómo hago un match?','👮 Hablar con admin'],
  },
  /* 2 ── DESPEDIDA */
  { id:'bye',
    pat:['chao','adios','bye','hasta luego','nos vemos','cuidate','hasta pronto','me voy'],
    text:()=>'¡Chao po! 👋 Fue un gusto ayudarte. ¡Que te vayan bacán los trueques! 🎉',
    chips:[],
  },
  /* 3 ── AGRADECIMIENTO */
  { id:'thanks',
    pat:['gracias','muchas gracias','te pasaste','eres lo mejor','excelente','bacan','bacán','perfecto','ok gracias','super','me sirvio','me sirvió','listo gracias'],
    text:()=>'¡De nada po! 😊 Para eso estoy. Si necesitas algo más, aquí estoy al tiro.',
    chips:['📤 Publicar ahora','🔄 ¿Qué más puedo hacer?'],
  },
  /* 4 ── QUÉ ES / CÓMO FUNCIONA */
  { id:'how',
    pat:['que es truekeamas','qué es truekeamas','como funciona','cómo funciona','para que sirve','para qué sirve','de que se trata','explicame','explícame','que es esto','es una app'],
    text:()=>`Truekeamas es la plataforma chilena de trueque 🇨🇱\n\n🔄 **Trueca** objetos con otras personas\n💰 **Vende** lo que ya no usas\n🎁 **Dona** a quien lo necesite\n⚡ **Mixto** — combina trueque + plata\n\n¡Es 100% gratis y sin comisión! Publicas, encuentras algo que te guste y coordinan el intercambio directamente po.`,
    chips:['📤 ¿Cómo publico?','🤝 ¿Cómo hago un match?','💸 ¿Es gratis?'],
  },
  /* 5 ── PUBLICAR */
  { id:'publish',
    pat:['publicar','como publico','cómo publico','subir producto','crear publicacion','crear publicación','poner en venta','quiero publicar','agregar producto','nueva publicacion','como vendo'],
    text:()=>`Publicar es facilísimo po 📤\n\n1️⃣ Inicia sesión en tu cuenta\n2️⃣ Clic en **"+ Publicar"**\n3️⃣ Elige: Trueque, Venta, Mixto o Donación\n4️⃣ Selecciona la **categoría** de tu producto\n5️⃣ Completa título, condición, **región y comuna**\n6️⃣ Sube hasta **5 fotos** (¡más fotos = más matches!)\n7️⃣ Clic en **"Publicar ahora"** ¡y listo! 🎉`,
    chips:['📤 Publicar ahora','📷 Tips pa\' las fotos','❓ ¿Qué puedo publicar?'],
    action:{ label:'📤 Publicar ahora', modal:'publish' },
  },
  /* 6 ── FOTOS */
  { id:'photos',
    pat:['fotos','foto','imagenes','imágenes','subir fotos','cuantas fotos','cuántas fotos','tips fotos','foto publicacion'],
    text:()=>`¡Las fotos son la clave po! 📸 Puedes subir hasta **5 fotos**:\n\n✅ Usa luz natural si puedes\n✅ Fondo limpio o neutro\n✅ Muestra todos los ángulos\n✅ Si tiene defectos, muéstralos — genera más confianza\n✅ La primera foto es la portada, ponle la mejor\n\n*Las publis con fotos reciben hasta 3x más matches.*`,
    chips:['📤 Publicar ahora','🔄 ¿Cómo hacer un match?'],
  },
  /* 7 ── MATCH / PROPUESTA */
  { id:'match',
    pat:['match','como hago match','cómo hago match','enviar propuesta','contactar vendedor','me interesa producto','quiero ese producto','propuesta','proponer trueque','hacer oferta','como propongo'],
    text:()=>`Pa' hacer un match 🤝:\n\n1️⃣ Encuentra el producto que te interesa\n2️⃣ Clic en el botón **"🤝 Match"** de la tarjeta\n3️⃣ Describe tu oferta: ¿qué ofreces tú a cambio?\n4️⃣ El dueño revisa tu propuesta\n5️⃣ Si acepta → ¡se abre un **chat privado** para coordinar!\n\n*Pro tip: sé específico en tu oferta, mejora las chances po 😉*`,
    chips:['📬 Ver mis propuestas','💬 ¿Cómo funciona el chat?','📩 Me enviaron una propuesta'],
    action:{ label:'📬 Mis propuestas', modal:'proposals' },
  },
  /* 8 ── PROPUESTAS RECIBIDAS */
  { id:'recv_proposals',
    pat:['propuestas recibidas','me enviaron propuesta','alguien quiere mi producto','aceptar propuesta','rechazar propuesta','revisar propuestas','tengo propuestas pendientes'],
    text:()=>`Si alguien quiere lo tuyo, te llega una **notificación** 🔔\n\nVe a **"Propuestas"** para:\n✅ **Aceptar** → se abre el chat y ¡a trukear!\n❌ **Rechazar** → el usuario recibe un aviso\n\n*Pro tip: responde rápido po — la gente anda siempre comparando ofertas 😄*`,
    chips:['📬 Ver mis propuestas','💬 ¿Cómo funciona el chat?'],
    action:{ label:'📬 Mis propuestas', modal:'proposals' },
  },
  /* 9 ── CHAT */
  { id:'chat',
    pat:['chat','como chateo','cómo chateo','mensajes','hablar con otro usuario','no puedo chatear','chat no funciona','no me llegan mensajes','como me comunico'],
    text:()=>`El chat se activa cuando **aceptan tu propuesta** 💬\n\nUna vez aceptada:\n📌 Aparece en **"Mis acuerdos"**\n📎 Pueden enviarse texto y fotos\n⚡ Los mensajes llegan en tiempo real\n\n⚠️ **Ojo**: nunca compartas datos bancarios, contraseñas ni tu dirección en el chat po.`,
    chips:['🤝 Ver mis acuerdos','🔒 Consejos de seguridad'],
    action:{ label:'🤝 Mis acuerdos', modal:'agreements' },
  },
  /* 10 ── ACUERDOS */
  { id:'agreements',
    pat:['acuerdos','mis acuerdos','trueques activos','ver acuerdos','completar trueque','trueque en curso','donde estan mis chats'],
    text:()=>`En **"Mis acuerdos"** están todos tus trueques activos 🤝\n\n💬 Chatear con la otra persona\n👤 Ver su perfil\n⭐ Calificarla después del trueque\n✅ Marcar como completado cuando todo salga bien\n\n*¡Recuerda calificar al otro usuario po — eso ayuda a toda la comunidad!*`,
    chips:['🤝 Ver mis acuerdos','⭐ ¿Cómo califico?'],
    action:{ label:'🤝 Mis acuerdos', modal:'agreements' },
  },
  /* 11 ── SEGURIDAD */
  { id:'security',
    pat:['seguridad','seguro','confianza','estafa','timo','fraude','engano','engaño','como evitar estafas','me estafaron','consejos seguridad','es confiable'],
    text:()=>`¡Ojo con esto po! 🔒 Consejos de seguridad:\n\n🚫 **Nunca** compartas RUT, claves bancarias ni contraseñas\n📍 Coordina en **lugares públicos** (metro, mall, cafetería)\n👀 Desconfía si te piden pagar antes de ver el producto\n📸 Si tienes dudas, pide más fotos del producto\n🚩 Ante conductas sospechosas, **denuncia al tiro**\n📧 Equipo: **contacto@truekeamas.cl**`,
    chips:['🚩 ¿Cómo denuncio?','👮 Hablar con admin','❗ ¿Qué info no debo compartir?'],
  },
  /* 12 ── QUÉ NO COMPARTIR */
  { id:'dont_share',
    pat:['que no compartir','qué no compartir','datos personales','informacion privada','información privada','contrasena','contraseña','clave bancaria','datos bancarios','que no dar'],
    text:()=>`¡Esto nunca po! ❌ En el chat **jamás** compartas:\n\n🔴 RUT o número de cédula\n🔴 Contraseñas de cualquier cuenta\n🔴 Datos bancarios (N° cuenta, clave transferencia)\n🔴 Tu dirección de casa antes de conocer a la persona\n🔴 Datos de tarjetas de crédito o débito\n\n✅ Sí puedes: acordar lugar público, horario y fotos del producto.`,
    chips:['🔒 Más consejos de seguridad','🚩 ¿Cómo denuncio?'],
  },
  /* 13 ── DENUNCIAR */
  { id:'report',
    pat:['denunciar','reportar','publicacion sospechosa','publicación sospechosa','usuario sospechoso','contenido inapropiado','como denuncio','cómo denuncio','quiero denunciar'],
    text:()=>`Pa' denunciar 🚩:\n\n**Publicación:**\n→ En la tarjeta del producto, clic en **"Denunciar"** (abajo)\n→ Elige el motivo y envía\n\n**Usuario:**\n→ Entra al perfil del usuario → clic en **"🚩 Denunciar"**\n\n*Tu denuncia es anónima po. El equipo la revisa y actúa rápido.*`,
    chips:['👮 Hablar con admin','🔒 Consejos de seguridad'],
  },
  /* 14 ── QUÉ SE PUEDE PUBLICAR */
  { id:'what_publish',
    pat:['que puedo publicar','qué puedo publicar','que se puede','qué se puede','esta permitido','está permitido','puedo publicar','categorias disponibles','que categorias hay'],
    text:()=>`¡Casi cualquier cosa legal po! ✅\n\n📱 Tecnología · 👗 Moda · 🛋️ Hogar · ⚽ Deportes\n📚 Libros · 🎨 Arte · 🌿 Plantas · 🔧 Servicios\n¡Y muchas más! Hay **14 categorías** disponibles.\n\n**Está prohibido publicar:**\n❌ Armas o elementos peligrosos\n❌ Drogas o sustancias ilegales\n❌ Productos robados o falsificados\n❌ Cualquier cosa ilegal en Chile`,
    chips:['📤 Publicar ahora','🚩 ¿Cómo denuncio algo ilegal?'],
    action:{ label:'📤 Publicar ahora', modal:'publish' },
  },
  /* 15 ── LO ILEGAL */
  { id:'illegal',
    pat:['drogas','armas','ilegal','ilegales','que no puedo publicar','qué no puedo publicar','prohibido','contrabando','robado','falsificado','que esta prohibido'],
    text:()=>`¡Ojo po! 🚫 Está **totalmente prohibido** publicar:\n\n❌ Drogas o cualquier sustancia ilegal\n❌ Armas de fuego o blancas sin autorización\n❌ Productos robados o de dudosa procedencia\n❌ Artículos falsificados o con infracción de copyright\n❌ Contenido adulto o para mayores de edad\n❌ Cualquier cosa cuya venta sea ilegal en Chile\n\nSi ves algo así, ¡denuncia al tiro! El equipo actúa rápido po.`,
    chips:['🚩 ¿Cómo denuncio?','👮 Hablar con admin'],
  },
  /* 16 ── NIVELES */
  { id:'levels',
    pat:['nivel','niveles','verificado','confiable','nuevo usuario','subir nivel','como subo de nivel','cómo subo','insignia','badge','medalla','como me verifico'],
    text:()=>`Los niveles en Truekeamas 🏅:\n\n🆕 **Nuevo** → todos parten aquí al registrarse\n✅ **Verificado** → el equipo valida tu cuenta manualmente\n⭐ **Confiable** → automático: **10+ calificaciones de 4.5★ o más**\n\n*Entre mejor reputación, más confianza genera tu perfil y más fácil hacer trueques po.*`,
    chips:['⭐ ¿Cómo califico?','👤 Ver mi perfil'],
    action:{ label:'👤 Mi perfil', modal:'profile' },
  },
  /* 17 ── CALIFICACIONES */
  { id:'ratings',
    pat:['calificar','calificacion','calificación','estrellas','rating','como califico','cómo califico','puntaje','reputacion','reputación','opiniones','como dejo resena','como dejo reseña'],
    text:()=>`Las calificaciones construyen tu reputación ⭐\n\n**¿Cómo calificar?**\n1️⃣ Ve a **"Mis acuerdos"**\n2️⃣ Clic en **"⭐ Calificar"** en el trueque completado\n3️⃣ Elige de 1 a 5 estrellas\n4️⃣ Agrega un comentario (opcional pero muy útil)\n\n*Ambas personas pueden calificarse entre sí po. ¡Sé justo y honesto!*`,
    chips:['🤝 Ver mis acuerdos','🏅 Sobre los niveles'],
    action:{ label:'🤝 Mis acuerdos', modal:'agreements' },
  },
  /* 18 ── PERFIL */
  { id:'profile',
    pat:['perfil','mi perfil','editar perfil','cambiar nombre','foto de perfil','actualizar datos','mi cuenta','cambiar datos','cambiar foto'],
    text:()=>`En tu perfil puedes hacer harto po ✏️:\n\n👤 Cambiar nombre y teléfono\n📍 Actualizar tu región\n🖼️ Subir o cambiar **foto de perfil**\n⭐ Ver tus calificaciones y comentarios recibidos\n📊 Revisar tus estadísticas\n\n*Para entrar: clic en tu nombre arriba a la derecha.*`,
    chips:['👤 Ir a mi perfil'],
    action:{ label:'👤 Mi perfil', modal:'profile' },
  },
  /* 19 ── MIS PUBLICACIONES */
  { id:'my_posts',
    pat:['mis publicaciones','mis productos','ver mis publicaciones','editar publicacion','editar publicación','eliminar publicacion','borrar publicacion','mis publis','gestionar publicaciones'],
    text:()=>`Gestiona tus publicaciones fácil 📦:\n\n1️⃣ Ve a **"Mis publicaciones"** en el menú\n2️⃣ Verás todas tus publis activas\n3️⃣ Puedes **editar** ✏️ o **marcar como completada** ✅\n\n⚠️ Al completar o eliminar, todo se borra definitivamente (fotos incluidas) ¡ojo po!`,
    chips:['📦 Ver mis publicaciones','📤 Publicar algo nuevo'],
    action:{ label:'📦 Mis publicaciones', modal:'myposts' },
  },
  /* 20 ── GUARDADOS / LIKES */
  { id:'saved',
    pat:['guardados','favoritos','me gusta','likes','guardar publicacion','lista deseos','corazon','corazón','publis guardadas'],
    text:()=>`¡Los likes sirven pa' dos cosas! ❤️\n\n1️⃣ **Guardar** publicaciones pa' verlas después\n2️⃣ **Mostrar popularidad** — más likes = más visible en la plataforma\n\nVe tus guardados: clic en el ❤️ del menú o topbar.`,
    chips:['🔄 ¿Cómo hacer un match?'],
  },
  /* 21 ── NOTIFICACIONES */
  { id:'notifs',
    pat:['notificaciones','notificacion','notificación','avisos','alertas','campana','no me llegan notificaciones'],
    text:()=>`Las notificaciones 🔔 te avisan cuando:\n\n📬 Alguien te envía una propuesta\n✅ Aceptan o rechazan tu propuesta\n💬 Recibes un mensaje nuevo en el chat\n\nVe a la 🔔 del topbar pa' verlas todas.`,
    chips:['📬 Mis propuestas','💬 Mis acuerdos'],
  },
  /* 22 ── PROBLEMAS LOGIN */
  { id:'login_issue',
    pat:['no puedo entrar','no puedo iniciar sesion','no puedo logearme','olvide contrasena','olvide contraseña','olvidé contraseña','no recuerdo clave','contrasena incorrecta','error al entrar','no me deja entrar'],
    text:()=>`¡No te preocupes po! 🔑 Intenta esto:\n\n**Con correo:**\n→ Clic en **"¿Olvidaste tu contraseña?"** en el login\n→ Te llega un correo pa' resetearla al tiro\n\n**Con Google:**\n→ Asegúrate de usar el mismo Gmail con que te registraste\n\n¿Sigue el problema? Escríbenos a **contacto@truekeamas.cl** con tu correo registrado.`,
    chips:['👮 Hablar con admin'],
  },
  /* 23 ── CREAR CUENTA */
  { id:'register',
    pat:['registrarme','crear cuenta','como me registro','cómo me registro','nueva cuenta','unirme','inscribirme','no tengo cuenta'],
    text:()=>`¡Registrarse es gratis y rapidísimo po! 🎉\n\n**Opción 1 — Google** *(recomendado)*\n→ Clic en "Entrar" → botón de Google → ¡listo!\n\n**Opción 2 — Correo**\n→ Clic en "Entrar" → "Crear cuenta"\n→ Completa nombre, correo y contraseña\n\n*¡En menos de 1 minuto ya estás publicando!*`,
    chips:['📤 ¿Cómo publico?','🔄 ¿Cómo funciona?'],
  },
  /* 24 ── GRATIS */
  { id:'free',
    pat:['es gratis','tiene costo','cobran','comision','comisión','cuanto cuesta','cuánto cuesta','pago','precio truekeamas','cuanto vale usar'],
    text:()=>`¡Truekeamas es **100% gratis** po! 🎉\n\n✅ Publicar: gratis\n✅ Hacer match: gratis\n✅ Chatear: gratis\n✅ Ver publicaciones: gratis\n\nNo cobramos comisión. Si hay dinero involucrado en el intercambio, lo coordinan directamente los usuarios.`,
    chips:['📤 Publicar ahora','🔄 ¿Cómo funciona?'],
  },
  /* 25 ── REGIONES / COMUNAS */
  { id:'location',
    pat:['region','región','comuna','ubicacion','ubicación','donde','dónde','cerca de mi','santiago','valparaiso','concepcion','antofagasta'],
    text:()=>`Truekeamas tiene usuarios en **todo Chile** 🇨🇱\n\nAl publicar, puedes indicar:\n📍 Tu **región** (las 16 regiones)\n🏘️ Tu **comuna** (aparece sola según la región elegida)\n\nEl filtro de **"Región"** en la vitrina te ayuda a encontrar productos cerca tuyo po.`,
    chips:['📤 Publicar ahora'],
  },
  /* 26 ── BLOQUEAR */
  { id:'block',
    pat:['bloquear','bloqueo','bloquear usuario','no quiero ver','ignorar usuario','como bloqueo'],
    text:()=>`Pa' bloquear a alguien 🔒:\n\n1️⃣ Ve al perfil del usuario\n2️⃣ Clic en **"🔒 Bloquear"**\n3️⃣ ¡Listo! Sus publicaciones ya no te aparecerán\n\n*Puedes desbloquear en cualquier momento entrando a su perfil po.*`,
    chips:['🚩 ¿Cómo denuncio?','🔒 Consejos de seguridad'],
  },
  /* 27 ── BUG / ERROR TÉCNICO */
  { id:'tech',
    pat:['bug','error','falla','problema tecnico','problema técnico','no carga','no funciona','pantalla blanca','se cayó la pagina','error 500','error 404'],
    text:()=>`¡Uff, eso no debería pasar po! 🛠️ Prueba esto:\n\n1️⃣ **Recarga la página** (F5 o Ctrl+R)\n2️⃣ **Limpia la caché** del navegador\n3️⃣ Prueba en modo incógnito\n4️⃣ Intenta con otro navegador (Chrome funciona muy bien)\n\n¿Sigue igual? Escríbenos a **contacto@truekeamas.cl** con captura del error.`,
    chips:['👮 Hablar con admin'],
  },
  /* 28 ── TIPS TRUEQUE EXITOSO */
  { id:'tips',
    pat:['consejos','tips','como hacer buen trueque','trucos','primer trueque','que pasa despues del match','que hago despues'],
    text:()=>`¡Tips pa' un trueque exitoso po! 🌟\n\n📸 **Buenas fotos** — llaman más la atención\n📝 **Título descriptivo** — marca, modelo, estado\n🏘️ **Indica tu comuna** — facilita la coordinación\n💬 **Responde rápido** las propuestas y mensajes\n🤝 **Sé honesto** sobre el estado del producto\n📍 **Lugar público** siempre para el intercambio\n⭐ **Califica** al otro usuario — ¡ayudas a la comunidad!`,
    chips:['📤 Publicar ahora','🔒 Consejos de seguridad'],
  },
  /* 29 ── QUÉ MÁS PUEDO HACER */
  { id:'features',
    pat:['que mas puedo hacer','qué más puedo hacer','otras funciones','que tiene la plataforma','funcionalidades','que tiene truekeamas'],
    text:()=>`¡Truekeamas tiene hartas funciones po! 🚀\n\n📤 Publicar con hasta 5 fotos\n🤝 Match y chat en tiempo real\n❤️ Guardar publicaciones favoritas\n🔔 Notificaciones instantáneas\n👤 Perfil con reputación y calificaciones\n🏅 Niveles: Nuevo → Verificado → Confiable\n🔒 Bloquear usuarios molestos\n🚩 Denunciar contenido o usuarios\n🔍 Filtros por región, categoría, tipo y más`,
    chips:['📤 Publicar ahora','🔄 ¿Cómo funciona?','👮 Hablar con admin'],
  },
  /* 30 ── HABLAR CON ADMIN (inicia flujo) */
  { id:'admin',
    pat:['hablar con admin','contactar admin','soporte','ayuda humana','hablar con persona','hablar con alguien','equipo truekeamas','reportar problema grave','necesito ayuda urgente','contacto truekeamas','escribir al equipo','hablar con moderador','quiero hablar con alguien','derivar','hablar humano'],
    text:()=>`¡Claro po! Te conecto con el equipo de Truekeamas 👮‍♂️\n\nCuéntame: **¿cuál es tu consulta o problema?**\n\n*(Escribe tu mensaje aquí y lo envío al tiro 📨)*`,
    chips:[],
    flow:'admin_1',
  },
];

const KB_DEFAULT = {
  id:'default',
  text:()=>`Hmm, no cacé bien eso po 🤔 ¿Me puedes contar con más detalle?\n\nO elige una opción de abajo 👇`,
  chips:['🔄 ¿Cómo funciona?','📤 ¿Cómo publico?','🤝 ¿Cómo hacer match?','👮 Hablar con admin'],
};

/* ═══════════════════════════════════════════════════════════
   RENDER TEXT — soporta **negrita** y \n
═══════════════════════════════════════════════════════════ */
function RenderText({ text }) {
  return (
    <div style={{ lineHeight: 1.55 }}>
      {text.split('\n').map((line, li) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <div key={li} style={{ minHeight: line ? undefined : '6px' }}>
            {parts.map((p, pi) =>
              p.startsWith('**') && p.endsWith('**')
                ? <strong key={pi}>{p.slice(2, -2)}</strong>
                : <span key={pi}>{p}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════ */
export default function Truki() {
  const { currentUser, userData, openModal } = useApp();

  const [open,      setOpen]      = useState(false);
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [typing,    setTyping]    = useState(false);
  const [flow,      setFlow]      = useState(null);   // null | 'admin_1' | 'admin_email' | 'support_live'
  const [adminMsg,  setAdminMsg]  = useState('');
  const [inited,    setInited]    = useState(false);
  const [ticketId,  setTicketId]  = useState(null);  // active support ticket

  const bottomRef       = useRef(null);
  const inputRef        = useRef(null);
  const shownAdminMsgs  = useRef(new Set());          // prevent duplicate admin replies
  const sendTimerRef    = useRef(null);               // cleanup del delay de "escritura"

  /* ── Restaurar ticketId desde sessionStorage al montar ── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = sessionStorage.getItem('truqui_ticket_id');
    if (saved) {
      setTicketId(saved);
      setFlow('support_live');
    }
  }, []);

  /* ── Persistir ticketId en sessionStorage cuando cambia ── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (ticketId) {
      sessionStorage.setItem('truqui_ticket_id', ticketId);
    } else {
      sessionStorage.removeItem('truqui_ticket_id');
    }
  }, [ticketId]);

  /* ── Escuchar respuestas del admin en el ticket activo ── */
  useEffect(() => {
    if (!ticketId) return;
    // `isFirst` = true en el primer snapshot (carga inicial o restauración tras recarga).
    // En ese caso marcamos los mensajes existentes como "vistos" sin notificar al usuario,
    // ya sea que los vio antes o que los verá al abrir el panel. Solo los mensajes que
    // lleguen en snapshots posteriores (tiempo real) disparan el mensaje en el chat.
    let isFirst = true;
    const q = query(
      collection(db, 'support', ticketId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.from !== 'admin') return;
        if (shownAdminMsgs.current.has(d.id)) return;
        shownAdminMsgs.current.add(d.id);
        if (isFirst) return; // silenciosamente marcado como visto en carga inicial
        addBotMsg(
          `🛡️ **Soporte Truekeamas:**\n${data.text}`,
          ['💬 Responder al equipo', '✅ Gracias, listo'],
        );
        setOpen(true);
      });
      isFirst = false;
    }, () => {});
    return unsub;
  }, [ticketId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Detectar cuando el admin cierra el ticket ── */
  useEffect(() => {
    if (!ticketId) return;
    const unsub = onSnapshot(doc(db, 'support', ticketId), snap => {
      if (snap.exists() && snap.data().status === 'resolved') {
        // Solo actuar si el ticket estaba activo en este flujo
        setFlow(prev => {
          if (prev === 'support_live' || prev === 'admin_1' || prev === 'admin_email') {
            addBotMsg(
              `✅ **Tu consulta fue marcada como resuelta** por el equipo de Truekeamas.\n\n¡Esperamos haberte ayudado! Si tienes más dudas, aquí estoy po 😊`,
              ['🔄 ¿Cómo funciona?', '📤 ¿Cómo publico?', '👮 Nueva consulta'],
            );
            setOpen(true);
            setTicketId(null);
            return null;
          }
          return prev;
        });
      }
    }, () => {});
    return unsub;
  }, [ticketId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Scroll al último mensaje */
  useEffect(() => {
    if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 80);
  }, [messages, typing, open]);

  /* Saludo inicial al abrir por primera vez */
  useEffect(() => {
    if (open && !inited) {
      setInited(true);
      const name = userData?.displayName || currentUser?.displayName;
      const greeting = `¡Wena${name ? ' ' + name.split(' ')[0] : ''}! 👋 Soy **Truqui**, el asistente de Truekeamas.\n\n¿En qué te doy una mano hoy po? 😊`;
      addBotMsg(greeting, ['🗺️ Tour de la plataforma','🔄 ¿Cómo funciona?','📤 ¿Cómo publico?','🤝 ¿Cómo hacer match?','👮 Hablar con admin']);
    }
    if (open && inited) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  /* ── helpers ── */
  function addBotMsg(text, chips = [], action = null) {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), from:'bot', text, chips, action }]);
  }
  function addUserMsg(text) {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), from:'user', text }]);
  }

  /* ── Crear ticket de soporte — devuelve el ticketId ── */
  async function createTicket(message, email) {
    try {
      const senderName = userData?.displayName || currentUser?.displayName || 'Anónimo';
      const ref = await addDoc(collection(db, 'support'), {
        uid:       currentUser?.uid || null,
        name:      senderName,
        email,
        message,
        status:    'pending',
        createdAt: serverTimestamp(),
      });
      // Añadir el primer mensaje a la subcollección para el chat bidireccional
      await addDoc(collection(db, 'support', ref.id, 'messages'), {
        text:       message,
        from:       'user',
        senderName,
        createdAt:  serverTimestamp(),
      });
      // Notificar a todos los admins
      const adminsSnap = await getDocs(query(collection(db,'users'), where('role','==','admin')));
      await Promise.all(adminsSnap.docs.map(d =>
        addDoc(collection(db,'notifications', d.id,'items'), {
          type:  'support_ticket',
          title: '📨 Nueva consulta de soporte — Truqui',
          body:  message.length > 65 ? message.slice(0,62)+'...' : message,
          read:  false, createdAt: serverTimestamp(),
        }).catch(() => {})
      ));
      return ref.id;
    } catch (e) {
      console.error('Truki ticket error:', e);
      return null;
    }
  }

  /* ── Flujos especiales ── */
  async function handleFlow(userText) {
    if (flow === 'admin_1') {
      setAdminMsg(userText);
      if (currentUser?.email || userData?.email) {
        const email = currentUser?.email || userData?.email;
        const newId = await createTicket(userText, email);
        if (newId) {
          setTicketId(newId);
          addBotMsg(
            `¡Mensaje enviado po! 💬 El equipo de Truekeamas ya lo recibió.\n\n**Responderemos aquí mismo** en cuanto podamos. También puedes escribirnos a **contacto@truekeamas.cl** 📧\n\n¿Quieres agregar algo más?`,
            [],
          );
          setFlow('support_live');
        } else {
          addBotMsg('Hubo un error al enviar tu consulta 😕 Escríbenos a **contacto@truekeamas.cl** 📧', ['🔄 Intentar de nuevo']);
          setFlow(null);
        }
      } else {
        addBotMsg('¿Me das tu **correo electrónico** pa\' que el equipo pueda responderte? 📧', []);
        setFlow('admin_email');
      }
      return true;
    }

    if (flow === 'admin_email') {
      const emailRgx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRgx.test(userText.trim())) {
        addBotMsg('Hmm, ese correo no parece válido po 🤔 ¿Me lo escribes de nuevo?', []);
        return true;
      }
      const newId = await createTicket(adminMsg, userText.trim());
      if (newId) {
        setTicketId(newId);
        addBotMsg(
          `¡Bacán! 💬 El equipo ya lo recibió. Te responderemos aquí mismo.\n\nTambién puedes escribirnos a **contacto@truekeamas.cl** 📧`,
          [],
        );
        setFlow('support_live');
      } else {
        addBotMsg('Hubo un error al enviar 😕 Escríbenos a **contacto@truekeamas.cl** 📧', []);
        setFlow(null);
      }
      return true;
    }

    if (flow === 'support_live') {
      // El usuario responde en la conversación de soporte activa
      if (!ticketId) { setFlow(null); return false; }
      try {
        const senderName = userData?.displayName || currentUser?.displayName || 'Anónimo';
        await addDoc(collection(db, 'support', ticketId, 'messages'), {
          text:       userText,
          from:       'user',
          senderName,
          createdAt:  serverTimestamp(),
        });
        addBotMsg('✓ Mensaje enviado al equipo 📨', []);
      } catch {
        addBotMsg('No pude enviar tu mensaje. Intenta de nuevo po 🙁', []);
      }
      return true;
    }

    return false;
  }

  /* Cancelar el timer de "escritura" al desmontar el componente */
  useEffect(() => () => clearTimeout(sendTimerRef.current), []);

  /* ── Enviar mensaje ── */
  async function send(text) {
    const t = text.trim();
    if (!t || typing) return;
    addUserMsg(t);
    setInput('');

    // Delay de "escritura" proporcional al largo de la respuesta
    setTyping(true);
    const delay = Math.min(600 + t.length * 6, 1400);

    // Guardar el ID para poder cancelarlo si el componente se desmonta
    sendTimerRef.current = setTimeout(async () => {
      const handled = await handleFlow(t);
      if (!handled) {
        // Detectar chips de acción especial primero
        const chipAction = detectChipAction(t);
        if (chipAction) {
          addBotMsg(chipAction.text, chipAction.chips || [], chipAction.action || null);
          if (chipAction.flow) setFlow(chipAction.flow);
        } else {
          const entry = bestMatch(t, KB) || KB_DEFAULT;
          const name = userData?.displayName || currentUser?.displayName;
          addBotMsg(
            typeof entry.text === 'function' ? entry.text(name) : entry.text,
            entry.chips || [],
            entry.action || null,
          );
          if (entry.flow) setFlow(entry.flow);
        }
      }
      setTyping(false);
    }, delay);
  }

  /* Mapeo de chips especiales a respuestas directas */
  function detectChipAction(t) {
    const chipMap = {
      '🔄 ¿en qué más te ayudo?': { text:'¡Dale po! ¿Sobre qué quieres saber?', chips:['📤 ¿Cómo publico?','🤝 ¿Cómo hacer match?','🔒 Seguridad','👮 Hablar con admin'] },
      '📤 publicar ahora': null,   // manejado por action button
      '🔄 ¿qué más puedo hacer?': KB.find(e=>e.id==='features'),
    };
    const ni = norm(t);
    for (const [k, v] of Object.entries(chipMap)) {
      if (ni.includes(norm(k)) && v) return v;
    }
    return null;
  }

  /* ── Chip clicked ── */
  function chipClick(chip) {
    // Chips del chat de soporte activo
    const nc = norm(chip);
    if (nc.includes('responder al equipo')) {
      addUserMsg(chip);
      setTyping(true);
      setTimeout(() => {
        addBotMsg('¡Claro po! Escribe tu respuesta y la envío al tiro 👇', []);
        setTyping(false);
        setFlow('support_live');
      }, 400);
      return;
    }
    if (nc.includes('gracias') && nc.includes('listo')) {
      addUserMsg(chip);
      setTyping(true);
      setTimeout(() => {
        addBotMsg('¡Genial po! 🎉 Me alegra que se haya resuelto. Si necesitas algo más, aquí estoy.', ['🔄 ¿Cómo funciona?','📤 ¿Cómo publico?']);
        setTyping(false);
        setFlow(null);
        setTicketId(null);
      }, 400);
      return;
    }
    if (nc.includes('nueva consulta')) {
      send('👮 Hablar con admin');
      return;
    }
    // Tour
    if (norm(chip).includes('tour') || norm(chip).includes('recorrido')) {
      addUserMsg(chip);
      setTyping(true);
      setTimeout(() => {
        addBotMsg('¡Perfecto po! Te muestro todo paso a paso 🗺️ Iniciando el tour...', []);
        setTyping(false);
        setTimeout(() => {
          setOpen(false);
          window.dispatchEvent(new CustomEvent('start-truqui-tour'));
        }, 900);
      }, 500);
      return;
    }
    // Chips de acción directa
    const directActions = { '📤 publicar ahora': 'publish', '📦 ver mis publicaciones': 'myposts', '📬 ver mis propuestas': 'proposals', '🤝 ver mis acuerdos': 'agreements', '👤 ir a mi perfil': 'profile', '🤝 mis acuerdos': 'agreements', '📬 mis propuestas': 'proposals', '👤 mi perfil': 'profile', '📦 mis publicaciones': 'myposts' };
    const key = norm(chip);
    for (const [k, modal] of Object.entries(directActions)) {
      if (norm(k) === key || key.includes(norm(k))) {
        openModal(modal);
        addUserMsg(chip);
        setTyping(true);
        setTimeout(() => {
          addBotMsg('¡Al tiro po! Abrí la sección para ti 🚀', ['🔄 ¿Qué más necesitas?','👮 Hablar con admin']);
          setTyping(false);
        }, 400);
        return;
      }
    }
    send(chip);
  }

  return (
    <>
      {/* ── FAB ── */}
      <button
        className={`truki-fab${open ? ' truki-fab--open' : ''}`}
        data-tour="truqui"
        onClick={() => setOpen(o => !o)}
        title="Truqui — Asistente Truekeamas"
        aria-label="Abrir asistente Truqui"
      >
        {open
          ? <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <Image src="/truqui.png" alt="Truqui" width={46} height={46} style={{ objectFit: 'contain', display: 'block' }} priority />
        }
      </button>

      {/* ── Panel ── */}
      <div className={`truki-panel${open ? ' open' : ''}`}>

        {/* Header */}
        <div className="truki-header">
          <div className="truki-header-avatar">
            <Image src="/truqui.png" alt="Truqui" width={28} height={28} style={{ objectFit: 'contain' }} />
          </div>
          <div className="truki-header-info">
            <div className="truki-header-name">Truqui</div>
            <div className="truki-header-status">
              <span className="truki-dot" />
              Asistente Truekeamas · Siempre disponible
            </div>
          </div>
          <button className="truki-close" onClick={() => setOpen(false)} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Messages */}
        <div className="truki-body">
          {messages.map(m => (
            <div key={m.id} className={`truki-row truki-row--${m.from}`}>
              {m.from === 'bot' && (
                <div className="truki-bot-avatar">
                  <Image src="/truqui.png" alt="Truqui" width={18} height={18} style={{ objectFit: 'contain' }} />
                </div>
              )}
              <div className="truki-bubble-wrap">
                <div className={`truki-bubble truki-bubble--${m.from}`}>
                  <RenderText text={m.text} />
                </div>
                {/* Chips */}
                {m.from === 'bot' && m.chips?.length > 0 && (
                  <div className="truki-chips">
                    {m.chips.map(c => (
                      <button key={c} className="truki-chip" onClick={() => chipClick(c)}>{c}</button>
                    ))}
                  </div>
                )}
                {/* Action button */}
                {m.from === 'bot' && m.action && (
                  <button
                    className="truki-action-btn"
                    onClick={() => { openModal(m.action.modal); setOpen(false); }}
                  >
                    {m.action.label}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className="truki-row truki-row--bot">
              <div className="truki-bot-avatar">
                <Image src="/truqui.png" alt="Truqui" width={18} height={18} style={{ objectFit: 'contain' }} />
              </div>
              <div className="truki-bubble truki-bubble--bot truki-typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Live-support banner */}
        {flow === 'support_live' && (
          <div style={{ background: 'var(--v)', color: '#fff', fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '5px 12px', letterSpacing: '.3px' }}>
            🛡️ Chat en vivo con Soporte Truekeamas
          </div>
        )}

        {/* Input */}
        <div className="truki-footer">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder={flow === 'support_live' ? 'Escribe tu mensaje al equipo…' : 'Escribe tu pregunta po…'}
            autoComplete="off"
            maxLength={300}
          />
          <button
            className="truki-send"
            onClick={() => send(input)}
            disabled={!input.trim() || typing}
            aria-label="Enviar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4 20-7Z"/>
              <path d="M22 2 11 13"/>
            </svg>
          </button>
        </div>

      </div>
    </>
  );
}
