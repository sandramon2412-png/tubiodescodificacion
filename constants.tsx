import React from 'react';
import { Testimonial, FAQItem, StackItem } from './types';

export const COLORS = {
  primary: '#8B4B9C',
  accent: '#E0C4C3',
  softPink: '#FDF2F8',
  darkPurple: '#581C87'
};

export const CONTENT = {
  hero: {
    upperAlert: "🚀 LANZAMIENTO OFICIAL DE LA APP — Precio especial de $17.97 solo por tiempo limitado · Después sube a $47",
    title: "¿Tu cuerpo lleva años enviándote señales que nadie supo leer?",
    subtitle: "Descubre el origen emocional de tus síntomas con el único sistema que combina libro + App interactiva para que entiendas — y sanes — lo que tu cuerpo realmente te está diciendo.",
    cta: "🚀 SÍ, QUIERO ENTENDER MI CUERPO AHORA",
    footer: "✅ Acceso inmediato · Descarga en 2 minutos · Garantía 7 días",
    heroImage: "https://i.imgur.com/hD7pK5a.png"
  },
  identification: {
    title: "Antes de seguir, respóndete esto con honestidad:",
    questions: [
      "¿Siempre te duele el mismo lugar cuando estás bajo estrés o presión emocional?",
      "¿Tus síntomas aparecen o empeoran justo cuando algo emocionalmente difícil ocurre?",
      "¿Sentiste que te enfermaste después de una pérdida, una traición o un momento de mucho dolor?",
      "¿Los médicos te dicen que estás 'bien', pero tu cuerpo sigue sintiéndose mal?",
      "¿Hay una parte tuya que siente que hay algo más detrás de lo que sientes físicamente?"
    ],
    conclusion: "Si dijiste que sí a aunque sea una de estas preguntas... tu cuerpo tiene algo que decirte. Y ya es hora de que lo escuches."
  },
  pain: {
    question: "No estás exagerando. No estás loca. Estás ignorando el idioma más importante que existe:",
    quote: "el idioma de tu propio cuerpo.",
    statement: "Cada síntoma es una emoción que no encontró otra salida.",
    description: "La biodescodificación dice que el cuerpo no miente. Que ese dolor de cabeza que te aparece los domingos en la noche, esa contractura que nunca termina de irse, esa ansiedad que no tiene nombre... no son accidentes. Son mensajes. Mensajes que llevan años esperando que los leas. Y hoy, por primera vez, vas a poder hacerlo."
  },
  analyzer: {
    tag: "🔍 Herramienta Gratuita — Impulsada por IA",
    title: "¿Qué te está diciendo tu cuerpo HOY?",
    subtitle: "Escribí el síntoma que más te preocupa y recibí el mensaje emocional que hay detrás.",
    placeholder: "Ej: dolor de espalda baja, migraña, nudo en la garganta...",
    button: "Descubrir el mensaje",
    loading: "Analizando tu síntoma..."
  },
  benefits: {
    title: "Con el Sistema de Biodescodificación Femenina vas a:",
    items: [
      { icon: '🔓', title: 'Entender cada síntoma como un mensaje, no como un castigo', desc: 'El diccionario de 60 señales corporales te explica exactamente qué emoción está detrás de lo que sentís. Sin tecnicismos. Con amor.' },
      { icon: '📱', title: 'Consultar tu cuerpo en tiempo real desde la App', desc: 'Tocás la zona en el mapa corporal, escribís lo que sentís, y en segundos tenés la interpretación + una reparación en 3 niveles. Algo que la competencia no tiene.' },
      { icon: '🧘‍♀️', title: 'Liberar lo que callaste durante años', desc: 'Técnicas de tapping y meditación guiada (en la app y en PDF) diseñadas específicamente para liberar emociones reprimidas que el cuerpo convirtió en dolor.' },
      { icon: '💫', title: 'Crear una práctica diaria que sana de verdad', desc: 'Rituales de 15 minutos que despiertan tu poder sanador interno. Sin complicaciones. Sin excusas.' },
      { icon: '✨', title: 'Reconectar con quién eras antes de cargarlo todo', desc: 'El reto de 30 días te devuelve a tu esencia paso a paso, con ejercicios guiados y espacio para tus reflexiones.' },
      { icon: '💖', title: 'Hablar contigo misma diferente', desc: 'Afirmaciones y decretos que cambian el diálogo interno que más daño te hace: el tuyo propio.' }
    ]
  },
  stack: {
    title: "📚 TODO LO QUE RECIBÍS HOY",
    subtitle: "LANZAMIENTO DE LA APP — VALOR TOTAL: $299 USD",
    mainTitle: "EL SISTEMA COMPLETO DE BIODESCODIFICACIÓN FEMENINA",
    bonusTitle: "🎁 BONOS EXCLUSIVOS — SOLO POR TIEMPO LIMITADO"
  },
  pricing: {
    totalValueLabel: "Valor Total del Pack",
    launchPriceLabel: "PRECIO DE LANZAMIENTO DE LA APP — SOLO POR TIEMPO LIMITADO",
    cta: "🔥 SÍ, QUIERO MI ACCESO AHORA POR $17.97",
    guarantee: "🛡️ GARANTÍA TOTAL DE 7 DÍAS",
    paymentUrl: "https://pay.hotmart.com/U104712118U?checkoutMode=10"
  },
  closing: {
    imagine: "\"Imaginá cómo te vas a sentir en 7 días...\"",
    points: [
      "Ese dolor que te acompaña hace meses ya tiene nombre. Y con nombre, se puede sanar.",
      "Entendés por qué tu cuerpo reacciona así en ciertos momentos — y ya no te da miedo.",
      "La ansiedad sigue siendo parte de vos, pero ya no te controla. Ahora vos la escuchás.",
      "Te despertás con una práctica que te ancla. Que te recuerda quién sos.",
      "Te mirás al espejo y ves a alguien que por fin se está escuchando a sí misma.",
      "Y sabés, con certeza, que el cambio más importante no vino de afuera. Vino de adentro."
    ],
    reality: "Esto no es un sueño lejano. Es lo que pasa cuando una mujer por fin aprende el idioma de su cuerpo.",
    finalCall: "☀️ EL MOMENTO ES AHORA",
    finalSub: "Tu cuerpo lleva años hablándote. Ya es hora de escucharlo. No mañana. Hoy.",
    finalCta: "🔥 ACCEDER AL SISTEMA COMPLETO — $17.97 USD",
    signOff: "Con amor y verdad,",
    mentorName: "Tu guía en este camino",
    ps: "P.D.: Tenés 7 días de garantía total. Si no sentís nada — ninguna emoción, ninguna claridad, ningún alivio — te devuelvo el 100% sin preguntas. El único riesgo real es seguir sin entender lo que tu cuerpo te dice."
  }
};

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Valeria M.",
    age: 37,
    rating: 5,
    text: "Tenía contracturas en el cuello desde hace 3 años. Tres años yendo al kinesiólogo sin resultado real. Con la biodescodificación entendí que era todo lo que estaba cargando sola sin pedirle ayuda a nadie. Empecé a soltar. El dolor bajó a la mitad en dos semanas."
  },
  {
    name: "Daniela R.",
    age: 41,
    rating: 5,
    text: "Me diagnosticaron gastritis crónica a los 35. Los médicos me decían que era el estrés pero nadie me explicaba qué hacer con ese estrés. Este sistema me enseñó que me tragaba todo — literalmente. Hoy mi digestión es otra."
  },
  {
    name: "Luciana P.",
    age: 33,
    rating: 5,
    text: "La app es lo que más me sorprendió. Poder tocar exactamente donde me duele y recibir el mensaje en segundos... es como tener una guía siempre conmigo. Lo uso casi todos los días."
  },
  {
    name: "Marcela G.",
    age: 44,
    rating: 5,
    text: "Mis migrañas de los lunes tenían todo que ver con lo que no decía los domingos en la noche. Cuando entendí eso me cambió todo. Ahora las migrañas casi no aparecen."
  },
  {
    name: "Carolina S.",
    age: 29,
    rating: 5,
    text: "Nunca había escuchado sobre biodescodificación y entré con mucho escepticismo. Pero el libro está escrito de una manera tan clara, tan real... no pude parar de leer. Y lloré varias veces porque me sentí completamente vista."
  }
];

export const FAQS: FAQItem[] = [
  {
    question: "¿La App tiene cobro mensual o es una suscripción?",
    answer: "Para nada. Pagas una sola vez y el acceso es tuyo para siempre. Sin cobros automáticos, sin renovaciones, sin sorpresas. Lo que es tuyo, es tuyo — de por vida. 💜"
  },
  {
    question: "¿Necesito saber algo de biodescodificación para empezar?",
    answer: "No, para nada. El libro está escrito en un lenguaje claro, sin tecnicismos y con mucho amor. Está pensado para mujeres reales que quieren entender su cuerpo, no para especialistas. Si nunca escuchaste esta palabra antes, estás en el lugar correcto."
  },
  {
    question: "¿Cuánto tiempo necesito dedicar cada día?",
    answer: "Con 15 a 20 minutos diarios es suficiente. El sistema está diseñado para mujeres con vida ocupada. No necesitás horas libres ni un espacio especial — solo el deseo de escucharte."
  },
  {
    question: "¿Esto reemplaza a mi médico o terapeuta?",
    answer: "No, y es importante aclararlo. La biodescodificación es un complemento poderoso para cualquier tratamiento médico o psicológico que estés llevando. No reemplaza la medicina — la profundiza."
  },
  {
    question: "¿Cuándo puedo esperar ver resultados?",
    answer: "Muchas mujeres reportan claridad y alivio emocional desde el primer día. Los cambios más profundos — físicos y emocionales — suelen consolidarse a lo largo de los 30 días del sistema. Pero el primer 'ajá' puede llegar hoy mismo."
  },
  {
    question: "¿Cómo funciona la App? ¿Tengo que instalar algo?",
    answer: "La app funciona directamente desde tu navegador — no necesitás descargar nada. Al comprar, recibís un email con el enlace y tu código de acceso. Podés guardarla en la pantalla de inicio de tu celular como si fuera una app nativa. Es tuya para siempre."
  },
  {
    question: "¿Qué pasa si compro y no me sirve?",
    answer: "Tenés 7 días de garantía total. Si en ese tiempo no sentís ninguna emoción, ninguna claridad, ningún alivio... te devolvemos el 100% de tu dinero sin preguntas y sin trámites. Así de simple."
  },
  {
    question: "¿Solo sirve para síntomas físicos?",
    answer: "No. Si bien el punto de entrada son los síntomas del cuerpo, el sistema trabaja con emociones bloqueadas, patrones relacionales, ansiedad, baja autoestima y desconexión con el propósito. El cuerpo es la puerta, pero la transformación es completa."
  }
];

export const STACK_ITEMS: StackItem[] = [
  { 
    title: "📖 Libro Principal: \"Biodescodificación Femenina — El Código Secreto de Tu Cuerpo\" (130 págs.)", 
    value: 27, 
    image: "https://i.imgur.com/hD7pK5a.png",
    description: "El método RE-CONECT completo. Diccionario de 60 señales corporales con su mensaje emocional. Casos guiados, ejercicios prácticos y frases sanadoras. La base de todo tu proceso."
  },
  { 
    title: "📱 App Interactiva \"Código Cuerpo\" — Acceso Exclusivo de por vida", 
    value: 47, 
    image: "https://i.imgur.com/tp3ywRK.png",
    description: "Lo que ningún libro puede darte: una guía interactiva en tiempo real. Mapa corporal femenino, interpretación instantánea de síntomas, diario emocional, reto de 7 días, meditaciones y tapping en audio, y seguimiento de tus patrones. Siempre en tu bolsillo. ✅ Pago único — sin suscripción, sin cobros mensuales."
  },
  { 
    title: "📚 5 Guías Prácticas en PDF (descargables e imprimibles)", 
    value: 49, 
    image: "https://i.imgur.com/PVXfooh.png",
    description: "Guía de Meditación · Guía de Tapping · 5 Rituales Diarios · 50 Afirmaciones de Alta Vibración · Plantillas de Gratitud. Todo listo para usar desde hoy."
  },
  { 
    title: "🎁 BONUS 1: \"Volver a Mí — Amor propio en tiempos de ansiedad\"", 
    value: 27, 
    image: "https://i.imgur.com/1hDDUH5.png",
    isBonus: true,
    description: "Cuando la ansiedad intenta convencerte de que no sos suficiente. Ejercicios prácticos para reconectar con tu valor cuando más difícil se siente."
  },
  { 
    title: "🎁 BONUS 2: \"Despierta Tu Luz — Reto espiritual de 30 días\"", 
    value: 37, 
    image: "https://i.imgur.com/EKsngIC.png",
    isBonus: true,
    description: "Un día a la vez, una práctica a la vez. Reflexión + ejercicio + afirmación para cada uno de los 30 días. Tu esencia más auténtica te espera al final."
  },
  { 
    title: "🎁 BONUS 3: \"Cuando amar duele — Ansiedad en las relaciones\"", 
    value: 27, 
    image: "https://i.imgur.com/xSbkW9P.png",
    isBonus: true,
    description: "¿Por qué repetís los mismos patrones? ¿Por qué ciertas personas te generan ansiedad? Este libro te da las respuestas y las herramientas para vincularte desde la paz."
  },
  { 
    title: "🎁 BONUS 4: Plantillas de Gratitud Diarias (PDF imprimible)", 
    value: 17, 
    image: "https://i.imgur.com/ZvuT6H6.jpeg",
    isBonus: true,
    description: "Diseño hermoso para imprimir o usar en digital. Cada día: tu afirmación, tu logro y tu intención. El hábito más simple que más cambia."
  },
  { 
    title: "🎁 BONUS 5: Comunidad Privada de Mujeres Conscientes", 
    value: 97, 
    image: "https://i.imgur.com/WheJ70c.jpeg",
    isBonus: true,
    description: "Un espacio real donde compartir tu proceso, recibir apoyo y saber que no estás sola en este camino. Otras mujeres que entienden exactamente lo que estás viviendo."
  }
];
