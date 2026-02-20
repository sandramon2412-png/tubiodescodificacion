import React from 'react';
import { Testimonial, FAQItem, StackItem } from './types';

export const COLORS = {
  primary: '#8B4B9C', // Púrpura principal
  accent: '#E0C4C3',  // Color solicitado
  softPink: '#FDF2F8',
  darkPurple: '#581C87'
};

export const CONTENT = {
  hero: {
    upperAlert: "🔔 ESTA OFERTA ES LIMITADA: El precio de $6.97 USD puede regresar a $47 en cualquier momento",
    title: "Descubre El Mensaje Oculto Que Tu Cuerpo Te Envía Cada Día, Sana Desde La Raíz y Reconecta Con Tu Esencia en Solo 30 Días",
    subtitle: "El Sistema de Biodescodificación Femenina que conecta tus síntomas físicos con emociones bloqueadas para una sanación completa.",
    cta: "🚀 \"SÍ, QUIERO TRANSFORMAR MI VIDA\"",
    footer: "Acceso inmediato - Descarga en 2 minutos",
    heroImage: "https://i.imgur.com/vx9jsY9.jpeg"
  },
  pain: {
    question: "¿Alguna vez has sentido que tu cuerpo te está enviando señales que no logras entender?",
    quote: "Esos dolores inexplicables, esa ansiedad constante, esa sensación de estar desconECTAda de tu propósito...",
    statement: "Tu cuerpo está tratando de hablarte.",
    description: "Cada síntoma, cada malestar, cada emoción bloqueada tiene un mensaje profundo esperando ser decodificado. Como mujer consciente, sabes que hay algo más allá de lo que ves en la superficie. Sabes que mereces vivir en plenitud, conectada con tu esencia y tu poder interior."
  },
  analyzer: {
    tag: "Herramienta Gratuita",
    title: "¿Qué te está diciendo tu síntoma hoy?",
    subtitle: "Escribe un síntoma que sientas (ej: dolor de espalda, migraña, acné) y obtén un breve mensaje de consciencia.",
    placeholder: "Escribe tu síntoma aquí...",
    button: "Consultar",
    loading: "Analizando..."
  },
  benefits: {
    title: "Con el Sistema de Biodescodificación Femenina vas a:",
    items: [
      { icon: '🔓', title: 'Decodificar el lenguaje secreto', desc: 'Cada síntoma físico que llevas cargando tiene un mensaje emocional específico.' },
      { icon: '💫', title: 'Elevar tu autosanación', desc: 'Rituales diarios que te ayudarán a despertar tu poder sanador interno.' },
      { icon: '🧘‍♀️', title: 'Liberar la ansiedad de raíz', desc: 'Técnicas profundas de tapping y meditación que funcionan en minutos.' },
      { icon: '✨', title: 'Encontrar tu propósito', desc: '30 días estructurados para despertar tu esencia más auténtica.' },
      { icon: '🔄', title: 'Reconectar con tu intuición', desc: 'Despertar esa sabiduría interior que siempre has tenido.' },
      { icon: '💖', title: 'Crear abundancia emocional', desc: 'Dominar decretos y afirmaciones que transforman tu vibración.' }
    ]
  },
  stack: {
    title: "📚 PROBANDO CAMBIOS 123",
    subtitle: "OFERTA DE LANZAMIENTO",
    mainTitle: "EL SISTEMA COMPLETO",
    bonusTitle: "REGALOS EXCLUSIVOS (BONUS)"
  },
  pricing: {
    totalValueLabel: "Valor Total Estimado",
    launchPriceLabel: "PRECIO DE LANZAMIENTO POR TIEMPO LIMITADO",
    cta: "🔥 \"SÍ, QUIERO TRANSFORMAR MI VIDA HOY\"",
    guarantee: "🛡️ GARANTÍA DE TRANSFORMACIÓN 7 DÍAS"
  },
  closing: {
    imagine: "\"Imagínate dentro de 30 días...\"",
    points: [
      "Despertarte sintiéndote en paz contigo misma.",
      "Tu cuerpo ya no es un misterio: entiendes cada señal, cada mensaje que te envía.",
      "La ansiedad que antes te paralizaba ahora es solo un recuerdo lejano.",
      "Te conectas con tu intuición como si fuera tu mejor amiga, guiándote en cada decisión.",
      "Te miras al espejo y sientes amor genuino por quien eres.",
      "Vives alineada con tu propósito, sabiendo exactamente cuál es tu misión en esta vida."
    ],
    reality: "Esto no es un sueño. Es tu nueva realidad esperándote.",
    finalCall: "☀️ EL MOMENTO ES AHORA",
    finalSub: "Tu alma te ha guiado hasta aquí por algo. No es casualidad que estés leyendo esto HOY. Tu transformación está a un clic de distancia.",
    finalCta: "🔥 RECLAMA TU TRANSFORMACIÓN - $6.97 USD",
    signOff: "Con amor y luz,",
    mentorName: "Tu Mentora",
    ps: "P.S. Recuerda: tienes 7 días de garantía total. El único riesgo es quedarte donde estás..."
  }
};

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Ana",
    age: 34,
    rating: 5,
    text: "Siento que por fin entendí lo que mi cuerpo me está diciendo, la ansiedad que me acompañó por años está desapareciendo. Es increíble como cambió mi perspectiva en tan poco tiempo."
  },
  {
    name: "María",
    age: 42,
    rating: 5,
    text: "Llevo 15 días y ya siento una conexión profunda conmigo misma que no había experimentado nunca. Los rituales son sencillos pero muy poderosos."
  },
  {
    name: "Carmen",
    age: 38,
    rating: 5,
    text: "Mis migrañas constantes tenían que ver con el estrés emocional que cargaba desde la infancia. Después de aplicar la biodescodificación y los rituales diarios, me siento más liviana y en paz."
  },
  {
    name: "Laura",
    age: 29,
    rating: 5,
    text: "Esto cambió mi vida completamente. Entender por qué mi cuerpo reaccionaba de ciertas maneras me ayudó a sanar heridas que tenía desde hace años."
  },
  {
    name: "Sofía",
    age: 45,
    rating: 5,
    text: "Mi gastritis crónica estaba conectada con mi tendencia a 'tragarme' todo. Ahora tengo herramientas para expresarme sanamente y mi digestión mejoró increíblemente."
  }
];

export const FAQS: FAQItem[] = [
  {
    question: "¿Cuánto tiempo necesito dedicar diariamente?",
    answer: "Solo necesitas de 15 a 20 minutos al día para realizar las lecturas y los rituales propuestos. El sistema está diseñado para mujeres con agendas ocupadas."
  },
  {
    question: "¿Funciona si nunca he hecho biodescodificación?",
    answer: "¡Absolutamente! El libro guía paso a paso desde los conceptos básicos hasta las aplicaciones más profundas. No necesitas conocimientos previos."
  },
  {
    question: "¿Cuándo puedo ver resultados?",
    answer: "Muchas mujeres reportan una sensación de alivio y claridad mental desde el primer día. Los cambios físicos y emocionales más profundos suelen consolidarse a lo largo de los 30 días del sistema."
  },
  {
    question: "¿Es compatible con otras terapias?",
    answer: "Sí, este sistema es un complemento excelente para cualquier tratamiento médico o psicológico que estés llevando actualmente. Ayuda a acelerar los procesos de consciencia."
  },
  {
    question: "¿Qué pasa si no me funciona?",
    answer: "Contamos con una garantía de 7 días. Si sientes que no es para ti, te devolvemos tu dinero sin preguntas."
  },
  {
    question: "¿Necesito experiencia previa en meditación?",
    answer: "No. Las guías de meditación incluidas son de 5 minutos y están diseñadas para ser seguidas fácilmente por cualquier principiante."
  }
];

export const STACK_ITEMS: StackItem[] = [
  { 
    title: "Libro Principal: Tu Cuerpo Tiene Algo Que Decirte", 
    value: 47, 
    image: "https://i.imgur.com/vx9jsY9.jpeg" 
  },
  { 
    title: "Guía de Meditación en 5 minutos", 
    value: 27, 
    image: "https://i.imgur.com/GXkXaw3.png" 
  },
  { 
    title: "Guía de Tapping para liberar emociones", 
    value: 27, 
    image: "https://i.imgur.com/Yv5JmBh.jpeg" 
  },
  { 
    title: "5 rituales diarios para reconectar", 
    value: 27, 
    image: "https://i.imgur.com/kOjImtH.png" 
  },
  { 
    title: "50 afirmaciones de alta vibración", 
    value: 17, 
    image: "https://i.imgur.com/qf8oUcJ.png" 
  },
  { 
    title: "BONUS 1: Volver a Mí (Amor propio)", 
    value: 37, 
    image: "https://i.imgur.com/1hDDUH5.png",
    isBonus: true 
  },
  { 
    title: "BONUS 2: Despierta tu Luz (Reto 30 días)", 
    value: 47, 
    image: "https://i.imgur.com/EKsngIC.png",
    isBonus: true 
  },
  { 
    title: "BONUS 3: Cuando Amar Duele (Relaciones)", 
    value: 37, 
    image: "https://i.imgur.com/xSbkW9P.png",
    isBonus: true 
  },
  { 
    title: "BONUS 4: Plantillas de Gratitud diarias", 
    value: 17, 
    image: "https://i.imgur.com/ZvuT6H6.jpeg",
    isBonus: true 
  }
];