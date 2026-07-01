import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, CheckCircle } from 'lucide-react';
import { analyzeSymptom } from './services/geminiService';
import { COLORS, TESTIMONIALS, FAQS, STACK_ITEMS, CONTENT } from './constants';
import { FAQItem, StackItem, Testimonial } from './types';

// Genera un ID único para deduplicación de eventos Meta
function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper para disparar eventos fbq con eventID
function trackFbEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    const eventId = generateEventId();
    (window as any).fbq('track', eventName, params || {}, { eventID: eventId });
  }
}

function useCountdown(minutes: number) {
  const [seconds, setSeconds] = useState(minutes * 60);
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return { m, s, expired: seconds === 0 };
}

const preguntas = [
  { id: 1, pregunta: "¿Dónde sentís más tensión o dolor frecuente?", opciones: [{ texto: "Cuello y hombros", emocion: "carga" }, { texto: "Estómago o digestión", emocion: "control" }, { texto: "Cabeza o migrañas", emocion: "vision" }, { texto: "Pecho o corazón", emocion: "miedo" }] },
  { id: 2, pregunta: "¿En qué momentos te sentís peor?", opciones: [{ texto: "Cuando tengo conflictos con alguien", emocion: "carga" }, { texto: "Cuando siento que pierdo el control", emocion: "control" }, { texto: "Cuando no puedo expresarme", emocion: "vision" }, { texto: "Ante cambios o incertidumbre", emocion: "miedo" }] },
  { id: 3, pregunta: "¿Cuál de estas frases te representa más?", opciones: [{ texto: "Siempre termino cargando con todo sola", emocion: "carga" }, { texto: "Me cuesta soltar y dejar ir las cosas", emocion: "control" }, { texto: "Hay cosas que nunca pude decir", emocion: "vision" }, { texto: "El futuro me asusta", emocion: "miedo" }] },
  { id: 4, pregunta: "¿Cómo reaccionás bajo mucha presión?", opciones: [{ texto: "Me duele el cuerpo físicamente", emocion: "carga" }, { texto: "Me trabo, me bloqueo, no puedo dormir", emocion: "control" }, { texto: "Me cuesta comunicar lo que siento", emocion: "vision" }, { texto: "Siento pánico o ansiedad", emocion: "miedo" }] }
];

const resultadosQuiz: Record<string, { titulo: string; descripcion: string; sintomas: string }> = {
  carga: { titulo: "Tu cuerpo carga lo que tu corazón no pudo soltar", descripcion: "Llevás años poniendo a todos antes que a vos. El peso de esa responsabilidad se acumula en tu cuerpo — especialmente en cuello, hombros y espalda.", sintomas: "Contracturas, dolor de cuello, tensión en hombros, fatiga crónica" },
  control: { titulo: "Tu cuerpo guarda lo que no podés soltar", descripcion: "Te cuesta dejar ir — situaciones, personas, emociones. Esa necesidad de control se expresa en tu sistema digestivo y tu nerviosismo.", sintomas: "Gastritis, problemas digestivos, ansiedad, insomnio" },
  vision: { titulo: "Tu cuerpo guarda todo lo que nunca pudiste decir", descripcion: "Hay emociones, palabras y verdades que nunca pudiste expresar. Se acumulan en tu garganta, tu tiroides, tu cabeza.", sintomas: "Problemas de tiroides, migrañas, dolor de garganta, nudo emocional" },
  miedo: { titulo: "Tu cuerpo frena cuando tu mente tiene miedo", descripcion: "Los cambios, las decisiones, el futuro — todo te genera una resistencia profunda que se siente en el cuerpo. Las resistencias se convierten en síntomas.", sintomas: "Pánico, bloqueos, parálisis, presión en el pecho, vértigos" }
};

function QuizSection({ paymentUrl }: { paymentUrl: string }) {
  const [paso, setPaso] = useState<"intro" | "preguntas" | "resultado">("intro");
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState<string[]>([]);

  const calcularResultado = (resp: string[]) => {
    const conteo: Record<string, number> = { carga: 0, control: 0, vision: 0, miedo: 0 };
    resp.forEach((r) => { conteo[r] = (conteo[r] || 0) + 1; });
    return Object.entries(conteo).sort((a, b) => b[1] - a[1])[0][0];
  };

  const responder = (emocion: string) => {
    const nuevasRespuestas = [...respuestas, emocion];
    setRespuestas(nuevasRespuestas);
    if (preguntaActual + 1 >= preguntas.length) {
      setPaso("resultado");
      trackFbEvent('Lead');
    } else {
      setPreguntaActual(preguntaActual + 1);
    }
  };

  const reiniciar = () => { setPaso("intro"); setPreguntaActual(0); setRespuestas([]); };
  const resultado = respuestas.length > 0 ? resultadosQuiz[calcularResultado(respuestas)] : null;
  const progreso = (preguntaActual / preguntas.length) * 100;

  return (
    <section className="py-16 px-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%)" }}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute w-96 h-96 rounded-full bg-purple-500/10 blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          style={{ top: -100, right: -100 }}
        />
        <motion.div 
          className="absolute w-96 h-96 rounded-full bg-pink-500/10 blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
          style={{ bottom: -100, left: -100 }}
        />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {paso === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <motion.div className="text-6xl sm:text-7xl mb-6 animate-float">🔮</motion.div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight text-gradient-white">¿Qué emoción está cargando tu cuerpo?</h2>
              <p className="text-purple-200 text-lg mb-8 leading-relaxed">Respondé 4 preguntas y descubrí el origen emocional de tus síntomas — personalizado para vos.</p>
              <motion.button 
                whileHover={{ scale: 1.08, y: -4 }} 
                whileTap={{ scale: 0.96 }} 
                onClick={() => setPaso("preguntas")} 
                className="bg-gradient-to-r from-white to-purple-50 text-purple-900 font-bold text-lg px-10 py-4 rounded-full shadow-glow hover-lift"
              >
                Empezar Quiz
              </motion.button>
              <p className="text-purple-400 text-sm mt-4 font-medium">⏱️ Solo 4 preguntas — menos de 1 minuto</p>
            </motion.div>
          )}
          {paso === "preguntas" && (
            <motion.div key={`pregunta-${preguntaActual}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div className="mb-8">
                <div className="flex justify-between text-purple-300 text-sm mb-3 font-medium"><span>Pregunta {preguntaActual + 1} de {preguntas.length}</span><span className="text-purple-400">{Math.round(progreso)}%</span></div>
                <div className="w-full bg-purple-900/50 rounded-full h-2 backdrop-blur-sm">
                  <motion.div 
                    className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full shadow-glow" 
                    initial={{ width: 0 }} 
                    animate={{ width: `${progreso}%` }} 
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-8 text-center leading-tight">{preguntas[preguntaActual].pregunta}</h3>
              <div className="flex flex-col gap-4">
                {preguntas[preguntaActual].opciones.map((opcion, i) => (
                  <motion.button 
                    key={i} 
                    whileHover={{ scale: 1.03, x: 10 }} 
                    whileTap={{ scale: 0.98 }} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.1 }} 
                    onClick={() => responder(opcion.emocion)}
                    className="glass-purple p-4 rounded-2xl text-left text-white font-medium hover-lift transition-all border border-purple-400/30 hover:border-purple-400/60"
                  >
                    {opcion.texto}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
          {paso === "resultado" && resultado && (
            <motion.div key="resultado" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center">
              <motion.div className="text-6xl mb-6 animate-float">✨</motion.div>
              <p className="text-purple-300 text-sm uppercase tracking-widest mb-3 font-bold">Tu resultado</p>
              <h3 className="text-2xl font-bold text-white mb-8 leading-tight">{resultado.titulo}</h3>
              <div className="rounded-2xl p-8 mb-8 text-left glass-dark border-l-4 border-pink-400">
                <p className="text-purple-100 leading-relaxed mb-6 text-lg">{resultado.descripcion}</p>
                <div className="border-t border-purple-700 pt-6">
                  <p className="text-purple-300 text-sm font-bold mb-2 uppercase">🔍 Síntomas relacionados:</p>
                  <p className="text-purple-200 text-sm leading-relaxed">{resultado.sintomas}</p>
                </div>
              </div>
              <p className="text-purple-200 mb-8 leading-relaxed text-lg">La biodescodificación te muestra exactamente cómo sanar esta emoción — y liberar el síntoma que carga tu cuerpo.</p>
              <motion.a 
                href={paymentUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                whileHover={{ scale: 1.08, y: -4 }} 
                whileTap={{ scale: 0.96 }} 
                onClick={() => trackFbEvent('InitiateCheckout', { value: 17.97, currency: 'USD' })}
                className="inline-block bg-gradient-to-r from-pink-400 to-pink-300 text-purple-900 font-black px-10 py-4 rounded-full shadow-glow hover-lift mb-4"
              >
                🔥 Acceder ahora por $17.97 USD
              </motion.a>
              <p className="text-purple-400 text-xs mb-6">🔓 Pago único · Sin suscripción · Acceso de por vida</p>
              <motion.button 
                onClick={reiniciar} 
                className="text-purple-300 text-sm underline cursor-pointer bg-transparent border-0 hover:text-purple-100 transition"
              >
                ↻ Hacer el quiz de nuevo
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

const Landing: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [symptomInput, setSymptomInput] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const analysisRef = useRef<HTMLDivElement>(null);
  const { m, s } = useCountdown(17);

  useEffect(() => {
    const handleScroll = () => { setShowStickyCta(window.scrollY > 600); };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handlePurchase = () => {
    trackFbEvent('InitiateCheckout', { value: 17.97, currency: 'USD' });
    window.open(CONTENT.pricing.paymentUrl, '_blank');
  };

  const handleAnalyze = async () => {
    if (!symptomInput.trim()) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    const result = await analyzeSymptom(symptomInput);
    setAnalysis(result);
    setIsAnalyzing(false);
    setTimeout(() => { analysisRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  const mainItems = STACK_ITEMS.filter(item => !item.isBonus);
  const bonusItems = STACK_ITEMS.filter(item => item.isBonus);

  const [currentPurchase, setCurrentPurchase] = useState<number | null>(null);
  const purchases = [
    { name: "Valeria", city: "Buenos Aires", action: "acaba de acceder al pack completo" },
    { name: "Daniela", city: "Ciudad de México", action: "descargó su libro hace 5 minutos" },
    { name: "Luciana", city: "Santiago", action: "activó su acceso a la App" },
    { name: "Marcela", city: "Bogotá", action: "se unió a la comunidad" },
    { name: "Carolina", city: "Lima", action: "adquirió la oferta de lanzamiento" },
    { name: "Fernanda", city: "Madrid", action: "empezó su transformación" },
    { name: "Natalia", city: "Montevideo", action: "ya tiene su acceso activado" }
  ];

  useEffect(() => {
    const showNext = () => { const i = Math.floor(Math.random() * purchases.length); setCurrentPurchase(i); setTimeout(() => setCurrentPurchase(null), 5000); };
    const t = setTimeout(showNext, 12000);
    const interval = setInterval(showNext, Math.random() * 45000 + 45000);
    return () => { clearTimeout(t); clearInterval(interval); };
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <AnimatePresence>
        {currentPurchase !== null && (
          <motion.div 
            initial={{ opacity: 0, x: -50, y: 20 }} 
            animate={{ opacity: 1, x: 0, y: 0 }} 
            exit={{ opacity: 0, x: -50, scale: 0.95 }} 
            className="fixed bottom-24 left-4 sm:bottom-8 sm:left-8 z-40"
          >
            <div className="glass p-4 rounded-2xl flex items-center gap-4 max-w-xs shadow-elevated">
              <div className="bg-green-100 p-2 rounded-full flex-shrink-0"><ShoppingBag className="w-5 h-5 text-green-600" /></div>
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-800 leading-tight"><span className="font-bold text-[#8B4B9C]">{purchases[currentPurchase].name}</span> de {purchases[currentPurchase].city}</p>
                <div className="flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3 text-green-500" /><span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Compra confirmada</span></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-gradient-to-r from-pink-300 to-purple-400 text-purple-900 text-center py-3 px-4 text-xs font-bold uppercase tracking-widest shadow-soft">{CONTENT.hero.upperAlert}</div>

      {/* HERO SECTION WITH VIDEO BACKGROUND */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-24 lg:pb-32 gradient-hero text-white">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute inset-0 opacity-30"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
            }}
            transition={{ duration: 15, repeat: Infinity }}
            style={{
              background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)',
              backgroundSize: '60px 60px'
            }}
          />
        </div>

        <div className="container mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div 
            className="space-y-7 sm:space-y-9 animate-fade-in text-center lg:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center lg:justify-start gap-2 glass px-4 py-2 w-fit mx-auto lg:mx-0 rounded-full">
              <span className="text-yellow-300 text-base">⭐⭐⭐⭐⭐</span>
              <span className="text-white/90 text-sm font-medium">127 reseñas · +1.400 mujeres</span>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight text-gradient-white">{CONTENT.hero.title}</h1>
            <p className="text-xl lg:text-2xl opacity-90 font-light max-w-2xl mx-auto lg:mx-0 leading-relaxed">{CONTENT.hero.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <motion.button 
                onClick={handlePurchase} 
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.96 }}
                className="bg-gradient-to-r from-pink-400 to-pink-300 hover:from-pink-300 hover:to-pink-200 text-gray-800 px-10 py-5 rounded-full font-black text-xl shadow-elevated hover-lift transition"
              >
                🚀 SÍ, QUIERO VOLVER A SENTIRME YO
              </motion.button>
            </div>
            <motion.div 
              className="glass-dark p-6 rounded-2xl max-w-xl mx-auto lg:mx-0 text-left border-l-4 border-pink-400"
              whileHover={{ y: -4 }}
            >
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-3">💜 Creado desde la experiencia real</p>
              <p className="text-white/90 text-sm leading-relaxed italic">"Me enfermé de cáncer de tiroides por guardarme todo lo que nunca pude decir. Hoy sano ese dolor enseñándole a otras mujeres el idioma de sus cuerpos."</p>
              <p className="text-white/60 text-xs font-bold mt-3">— Sandra, tu amiga, creadora del sistema</p>
            </motion.div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">🔓 Pago único · Sin suscripción · Acceso de por vida</p>
          </motion.div>

          <motion.div 
            className="relative group max-w-sm mx-auto lg:max-w-md xl:max-w-lg flex flex-col items-center lg:items-end"
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div 
              className="relative w-full sm:w-3/4 lg:w-full animate-float"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div 
                className="absolute -inset-6 rounded-3xl opacity-30 blur-3xl group-hover:opacity-50 transition duration-500"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,182,193,0.8), rgba(139,75,156,0.8))'
                }}
              />
              <img 
                src={CONTENT.hero.heroImage} 
                alt="Biodescodificación Femenina" 
                className="relative rounded-3xl shadow-elevated w-full h-auto border-4 border-white/30 z-10 object-cover hover-scale" 
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* IDENTIFICATION SECTION */}
      <section className="py-16 sm:py-20 bg-gradient-subtle relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute w-80 h-80 rounded-full bg-purple-200/20 blur-3xl"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 30, repeat: Infinity }}
            style={{ top: -100, right: -100 }}
          />
        </div>

        <div className="container mx-auto px-6 max-w-3xl relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10 leading-snug">Antes de seguir, respóndete esto con honestidad:</h2>
          <div className="space-y-4 mb-10">
            {CONTENT.identification.questions.map((q, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass hover-lift p-6 rounded-2xl border-l-4 border-purple-400"
              >
                <div className="flex items-start gap-4">
                  <motion.span 
                    className="text-[#8B4B9C] text-2xl font-black flex-shrink-0 mt-0.5"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ delay: idx * 0.1, duration: 2 }}
                  >
                    ✓
                  </motion.span>
                  <p className="text-gray-800 font-medium text-sm sm:text-base leading-relaxed">{q}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div 
            className="gradient-premium text-white rounded-2xl px-8 py-6 text-center shadow-glow hover-lift"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-base sm:text-lg font-bold leading-relaxed">{CONTENT.identification.conclusion}</p>
          </motion.div>
        </div>
      </section>

      <QuizSection paymentUrl={CONTENT.pricing.paymentUrl} />

      {/* PAIN SECTION */}
      <section className="py-16 sm:py-20 bg-white relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 opacity-20"
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ duration: 20, repeat: Infinity }}
          style={{
            background: 'radial-gradient(circle at 20% 50%, rgba(139,75,156,0.1), transparent 50%)',
            backgroundSize: '200% 200%'
          }}
        />
        <div className="container mx-auto px-6 max-w-3xl text-center space-y-6 sm:space-y-8 relative z-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">No estás exagerando. No estás loca.</h2>
          <p className="text-xl sm:text-2xl text-[#8B4B9C] italic font-semibold leading-relaxed">Estás ignorando el idioma más importante que existe.</p>
          <div className="h-1 w-20 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto"></div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">Cada síntoma es una emoción que no encontró otra salida.</p>
          <p className="text-gray-700 leading-relaxed text-base sm:text-lg">La biodescodificación dice que el cuerpo no miente. Ese dolor que aparece, esa contractura que nunca termina de irse, esa ansiedad que te despierta en la noche...</p>
        </div>
      </section>

      {/* ANALYZER SECTION */}
      <section id="analyzer" className="py-12 sm:py-16 bg-purple-50 relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 opacity-30"
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(139,75,156,0.15), transparent 70%)',
          }}
        />
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl relative z-10">
          <div className="glass p-6 sm:p-10 rounded-3xl shadow-elevated hover-lift border-2 border-purple-200">
            <div className="text-center mb-8 flex flex-col items-center">
              <motion.div 
                className="w-fit mx-auto bg-gradient-to-r from-purple-100 to-pink-100 text-[#8B4B9C] px-4 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🔍 Herramienta IA Gratuita
              </motion.div>
              <h2 className="text-2xl sm:text-3xl font-bold mt-4 text-gray-900">¿Qué te está diciendo tu cuerpo HOY?</h2>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">Escribí el síntoma que más te preocupa</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input 
                type="text" 
                value={symptomInput} 
                onChange={(e) => setSymptomInput(e.target.value)} 
                placeholder="Ej: dolor de espalda baja, migraña, nudo en la garganta..." 
                className="flex-1 px-6 py-4 rounded-full border-2 border-purple-200 focus:border-purple-400 focus:outline-none glass transition text-gray-800 placeholder-gray-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <motion.button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-full font-bold hover:shadow-glow transition disabled:opacity-50 btn-premium whitespace-nowrap"
              >
                {isAnalyzing ? '⏳ Analizando...' : '✨ Descubrir'}
              </motion.button>
            </div>
            {analysis && (
              <motion.div 
                ref={analysisRef} 
                className="mt-8 p-6 glass-purple rounded-2xl border-l-4 border-[#8B4B9C] animate-fade-in-up shadow-soft"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm sm:text-base italic">"{analysis}"</p>
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 mb-3">¿Querés explorar esto más en profundidad?</p>
                  <motion.button 
                    onClick={handlePurchase}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-full font-bold text-sm hover:shadow-glow transition"
                  >
                    Sí, quiero acceder al sistema completo
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section className="py-16 sm:py-20 gradient-premium text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute w-96 h-96 rounded-full bg-white/5 blur-3xl"
            animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 25, repeat: Infinity }}
            style={{ bottom: -100, right: -100 }}
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-12 sm:mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Con el Sistema de Biodescodificación Femenina vas a:</h2>
            <div className="h-1 w-24 bg-pink-300 mx-auto"></div>
          </div>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
            {CONTENT.benefits.items.map((benefit, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.05, y: -8 }}
                className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-2rem)] glass-dark p-6 sm:p-8 rounded-2xl hover-lift group border border-white/20"
              >
                <motion.div 
                  className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ delay: idx * 0.2, duration: 2, repeat: Infinity }}
                >
                  {benefit.icon}
                </motion.div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-purple-100 text-sm sm:text-base leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="py-16 sm:py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <motion.div 
            className="absolute w-96 h-96 rounded-full bg-purple-200/20 blur-3xl"
            animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
            transition={{ duration: 25, repeat: Infinity }}
            style={{ top: -100, left: -100 }}
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 px-4">Mujeres que aprendieron a escuchar su cuerpo</h2>
            <p className="text-gray-500 mt-2 max-w-lg mx-auto italic">"Resultados reales de mujeres reales"</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
                className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-2rem)] glass p-6 sm:p-8 rounded-2xl shadow-soft hover-lift flex flex-col h-full border-t-4 border-purple-400"
              >
                <div className="flex text-yellow-400 mb-4 text-sm">{[...Array(t.rating)].map((_, i) => <motion.span key={i} animate={{ scale: [1, 1.2, 1] }} transition={{ delay: i * 0.1, duration: 1.5 }}>★</motion.span>)}</div>
                <p className="text-gray-700 italic mb-6 text-sm sm:text-base flex-1">"{t.text}"</p>
                <div className="font-bold text-[#8B4B9C] mt-auto text-sm sm:text-base">{t.name}, {t.age} años</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* APP SECTION */}
      <section className="py-16 sm:py-24 bg-gradient-subtle overflow-hidden relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <motion.div 
              className="w-full lg:w-1/2 relative"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <motion.div 
                className="absolute -inset-8 rounded-[3rem] bg-gradient-to-r from-purple-300/30 to-pink-300/30 blur-3xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <div className="relative flex justify-center items-center gap-4 sm:gap-6">
                <motion.div 
                  className="w-2/3 sm:w-3/5 z-20 hover-scale"
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 6, repeat: Infinity }}
                >
                  <img 
                    src="https://i.imgur.com/tp3ywRK.png" 
                    alt="App Código Cuerpo" 
                    className="w-full rounded-2xl shadow-elevated border-4 border-white/50"
                  />
                </motion.div>
                <motion.div 
                  className="w-1/2 sm:w-2/5 absolute -right-4 sm:-right-8 top-1/2 -translate-y-1/2 z-10 opacity-80 hover:opacity-100 transition hover-scale"
                  animate={{ y: [0, 20, 0] }}
                  transition={{ duration: 6, repeat: Infinity, delay: 0.3 }}
                >
                  <img 
                    src="https://i.imgur.com/LQKLnWY.png" 
                    alt="App Preview" 
                    className="w-full rounded-2xl shadow-elevated border-4 border-white/30"
                  />
                </motion.div>
              </div>
            </motion.div>

            <motion.div 
              className="w-full lg:w-1/2 space-y-8 text-center lg:text-left"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mx-auto lg:mx-0">📱 Solo en este pack</div>
                <h2 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight">La App <span className="text-gradient">"Código Cuerpo"</span></h2>
                <p className="text-xl text-gray-600 font-medium italic">Tu guía emocional siempre en el bolsillo</p>
              </div>

              <div className="grid gap-6">
                {[
                  { icon: "🗺️", title: "Mapa corporal interactivo", desc: "Toca donde te duele y recibí la interpretación al instante" },
                  { icon: "💬", title: "Interpretación en segundos", desc: "Mensaje simbólico del síntoma + reparación emocional" },
                  { icon: "📝", title: "Ejercicios digitales", desc: "Lo que no dije, Mi verdad hoy, interactivos y guardados" },
                  { icon: "🎯", title: "Reto 7 Días guiado", desc: "Día a día con checks de progreso y reflexiones" },
                  { icon: "🎧", title: "Meditaciones en audio", desc: "Para culpa, miedo, ansiedad y más — listos para escuchar" },
                  { icon: "📊", title: "Detecta patrones", desc: "La app analiza tu historial y avisa de repeticiones" }
                ].map((feature, i) => (
                  <motion.div 
                    key={i} 
                    className="flex gap-4 group"
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex-shrink-0 w-12 h-12 glass rounded-2xl shadow-soft border border-purple-200 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                    <div><h4 className="font-bold text-gray-900 mb-1">{feature.title}</h4><p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p></div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* IS/ISN'T SECTION */}
      <section className="py-16 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
            <motion.div 
              className="glass p-6 sm:p-8 rounded-2xl border-t-4 border-red-400 shadow-soft hover-lift"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <h3 className="text-lg sm:text-xl font-bold text-red-500 mb-6 uppercase tracking-tight">❌ Este sistema NO es para vos si...</h3>
              <ul className="space-y-4 text-gray-600 text-sm sm:text-base">
                {["Buscás una pastilla mágica", "No querés dedicar 15-20 minutos diarios", "Querés quedarte en zona de confort", "No tenés apertura al autoconocimiento"].map((item, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start">
                    <span className="mr-3">•</span> {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              className="glass p-6 sm:p-8 rounded-2xl border-t-4 border-green-400 shadow-soft hover-lift"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <h3 className="text-lg sm:text-xl font-bold text-green-500 mb-6 uppercase tracking-tight">✅ Este sistema SÍ es para vos si:</h3>
              <ul className="space-y-4 text-gray-600 text-sm sm:text-base">
                {["Estás lista para entender lo que tu cuerpo dice", "Querés sanar desde la raíz", "Sentís que hay algo emocional", "Buscás transformación real"].map((item, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start">
                    <span className="mr-3">•</span> {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* OFFER SECTION */}
      <section id="offer" className="py-16 sm:py-24 bg-gradient-subtle relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute w-96 h-96 rounded-full bg-purple-400/10 blur-3xl"
            animate={{ x: [0, 100, -100, 0], y: [0, 50, -50, 0] }}
            transition={{ duration: 20, repeat: Infinity }}
            style={{ top: -100, right: -100 }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
          <div className="glass-dark p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-elevated border-2 border-purple-300">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">📚 TODO LO QUE RECIBÍS HOY</h2>
              <p className="text-purple-300 font-bold uppercase tracking-widest text-xs sm:text-sm">Valor total: $299 USD</p>
            </div>

            <div className="space-y-16 sm:space-y-20">
              <div>
                <div className="text-center mb-8 sm:mb-12">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white inline-block border-b-4 border-purple-400 pb-2">EL SISTEMA COMPLETO</h3>
                </div>
                <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
                  {mainItems.map((item, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ y: -8 }}
                      className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-2rem)] glass bg-white rounded-2xl overflow-hidden flex flex-col group hover-lift"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-purple-200 to-pink-200">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                        <div className="absolute top-2 right-2 bg-purple-600 text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-md z-20 uppercase tracking-wider">INCLUIDO</div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h4 className="font-bold text-gray-800 leading-tight mb-2 text-sm sm:text-base">{item.title}</h4>
                        {item.description && <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4">{item.description}</p>}
                        <div className="flex justify-between items-center pt-2 mt-auto border-t border-gray-100">
                          <span className="text-gray-400 text-[10px] font-bold line-through">VALOR: ${item.value} USD</span>
                          <span className="text-purple-600 text-[10px] font-black uppercase">HOY: $0.00</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-center mb-8 sm:mb-12">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white inline-block border-b-4 border-yellow-400 pb-2">🎁 BONOS EXCLUSIVOS</h3>
                </div>
                <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
                  {bonusItems.map((item, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ y: -8 }}
                      className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-2rem)] glass bg-white rounded-2xl overflow-hidden flex flex-col group hover-lift"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-yellow-200 to-orange-200">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                        <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[9px] font-black px-2 py-1 rounded-full shadow-md z-20 uppercase tracking-wider">REGALO</div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h4 className="font-bold text-purple-700 leading-tight mb-2 text-sm sm:text-base">{item.title}</h4>
                        {item.description && <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4">{item.description}</p>}
                        <div className="flex justify-between items-center pt-2 mt-auto border-t border-gray-100">
                          <span className="text-gray-400 text-[10px] font-bold line-through">VALOR: ${item.value} USD</span>
                          <span className="text-green-600 text-[10px] font-black uppercase tracking-widest">REGALO</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-16 sm:mt-24 border-t-2 border-dashed border-purple-400 pt-12 text-center space-y-8">
              <div className="glass bg-white border-2 border-purple-300 rounded-2xl px-8 py-5 max-w-sm mx-auto shadow-soft">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">⏰ PRECIO ESPECIAL VENCE EN:</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="text-center">
                    <div className="text-4xl font-black text-purple-600 animate-glow">{m}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">min</div>
                  </div>
                  <div className="text-3xl font-black text-purple-600">:</div>
                  <div className="text-center">
                    <div className="text-4xl font-black text-purple-600 animate-glow">{s}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">seg</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-gray-400 font-bold text-sm sm:text-base uppercase tracking-widest">💰 TU INVERSIÓN HOY</p>
                <p className="text-gray-500 line-through text-lg sm:text-2xl font-medium">Valor Total: $299 USD</p>
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <span className="text-4xl sm:text-6xl font-black text-purple-400">$</span>
                  <motion.span 
                    className="text-6xl sm:text-8xl font-black text-purple-400 animate-glow"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    17.97
                  </motion.span>
                  <span className="text-xl sm:text-2xl font-black text-purple-400 self-start mt-2 sm:mt-4">USD</span>
                </div>
                <p className="text-white font-black text-sm sm:text-lg uppercase tracking-widest">Precio de lanzamiento — Solo por 48 horas</p>
              </div>

              <div className="glass-purple rounded-2xl px-6 py-4 max-w-lg mx-auto border border-purple-300">
                <p className="text-white text-sm font-bold">✅ Pago único, acceso de por vida</p>
                <p className="text-purple-200 text-xs mt-2 font-medium">Sin suscripción · Sin cobros mensuales · Sin sorpresas</p>
              </div>

              <div className="max-w-xl mx-auto space-y-4 px-2">
                <motion.button 
                  onClick={handlePurchase}
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.96 }}
                  className="w-full bg-gradient-to-r from-pink-400 to-pink-300 hover:from-pink-300 hover:to-pink-200 text-gray-800 py-6 px-4 rounded-2xl text-2xl font-black shadow-elevated hover-lift transition btn-premium"
                >
                  <span className="animate-bounce inline-block mr-2">🔥</span>SÍ, QUIERO MI ACCESO<span className="animate-bounce inline-block ml-2">🔥</span>
                </motion.button>
                <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest">🛡️ 100% segura · 7 días de garantía total</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-16 sm:py-20 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-12 uppercase tracking-tight text-gray-900">❓ Preguntas frecuentes</h2>
          <div className="space-y-3 sm:space-y-4">
            {FAQS.map((faq, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass rounded-2xl overflow-hidden shadow-soft border-2 border-purple-200 hover-lift"
              >
                <motion.button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full text-left p-5 flex justify-between items-center hover:bg-purple-50/50 transition"
                  whileHover={{ x: 4 }}
                >
                  <span className="font-bold text-gray-800 text-sm sm:text-base pr-4 leading-snug">{faq.question}</span>
                  <motion.span 
                    className="text-[#8B4B9C] text-2xl transition-transform duration-300"
                    animate={{ rotate: openFaq === idx ? 45 : 0 }}
                  >
                    +
                  </motion.span>
                </motion.button>
                <motion.div 
                  className="overflow-hidden"
                  initial={false}
                  animate={{ height: openFaq === idx ? 'auto' : 0, opacity: openFaq === idx ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="p-5 pt-0 text-gray-700 border-t border-purple-200 text-sm sm:text-base leading-relaxed">{faq.answer}</div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING SECTION */}
      <section className="py-20 sm:py-24 bg-white text-center relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-4xl space-y-8 sm:space-y-10 relative z-10">
          <motion.h2 
            className="text-3xl sm:text-4xl font-bold italic text-gray-800 leading-tight px-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            "Imaginá cómo te vas a sentir en 7 días..."
          </motion.h2>
          <div className="space-y-6 text-base sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            {CONTENT.closing.points.map((point, idx) => (
              <motion.p 
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={idx === CONTENT.closing.points.length - 1 ? "font-bold text-gray-900" : ""}
              >
                {point}
              </motion.p>
            ))}
          </div>
          <div className="h-1 w-24 sm:w-32 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto"></div>
          <p className="text-xl sm:text-2xl font-bold text-purple-600 px-4 leading-snug">Esto no es un sueño lejano.</p>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-20 bg-gradient-to-t from-purple-900 via-purple-800 to-purple-700 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute inset-0"
            animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
            transition={{ duration: 20, repeat: Infinity }}
            style={{
              background: 'radial-gradient(circle at 20% 50%, rgba(255,182,193,0.1), transparent 50%)',
              backgroundSize: '200% 200%'
            }}
          />
        </div>

        <div className="container mx-auto px-6 max-w-4xl space-y-8 sm:space-y-10 relative z-10">
          <motion.h2 
            className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none px-4"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
          >
            ☀️ El momento es ahora
          </motion.h2>
          <p className="text-lg sm:text-xl opacity-90 max-w-2xl mx-auto italic px-4 leading-relaxed">Tu cuerpo lleva años hablándote. Ya es hora de escucharlo. No mañana. Hoy.</p>
          <div className="flex flex-col items-center gap-4 pt-4">
            <motion.button 
              onClick={handlePurchase}
              whileHover={{ scale: 1.1, y: -4 }}
              whileTap={{ scale: 0.94 }}
              className="bg-gradient-to-r from-pink-400 to-pink-300 hover:from-pink-300 hover:to-pink-200 text-gray-800 px-8 sm:px-12 py-6 sm:py-7 rounded-full font-black text-xl sm:text-2xl shadow-elevated hover-lift transition btn-premium"
            >
              <span className="animate-bounce inline-block mr-2">🔥</span>SÍ, QUIERO EMPEZAR AHORA<span className="animate-bounce inline-block ml-2">🔥</span>
            </motion.button>
            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs text-white/70 font-bold uppercase tracking-widest">Acceso inmediato · Descarga en 2 minutos</p>
              <p className="text-[10px] sm:text-xs text-white/50 font-bold uppercase tracking-widest">🛡️ 100% segura · 7 días de garantía · 🔓 Pago único</p>
            </div>
          </div>
          <div className="space-y-4 mt-12 sm:mt-16 border-t border-white/20 pt-10">
            <p className="text-purple-200 text-sm uppercase tracking-widest font-bold opacity-70">Con amor y verdad,</p>
            <p className="font-bold text-3xl sm:text-4xl italic tracking-tight">Sandra</p>
            <p className="text-xs sm:text-sm opacity-40 max-w-md mx-auto">Tu guía en este camino de sanación</p>
          </div>
        </div>
      </section>

      {/* STICKY CTA */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-4 transition-all duration-500 transform pointer-events-none ${showStickyCta ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0'}`}>
        <div className="container mx-auto max-w-3xl">
          <motion.div 
            className="glass shadow-elevated rounded-2xl p-3 sm:p-4 flex items-center justify-between border-2 border-purple-300"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: showStickyCta ? 0 : 100, opacity: showStickyCta ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <div className="hidden sm:block ml-4">
              <p className="text-[10px] font-bold text-purple-600 uppercase tracking-tighter">Oferta limitada</p>
              <p className="text-sm font-black text-gray-800 truncate max-w-[150px]">Biodescodificación Femenina</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 flex-1 sm:flex-initial justify-between sm:justify-end w-full sm:w-auto px-2">
              <div className="text-left sm:text-right leading-none">
                <p className="text-[10px] text-gray-500 line-through mb-1">$47 USD</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-purple-600">$</span>
                  <span className="text-xl sm:text-2xl font-black text-purple-600">17.97</span>
                </div>
                <p className="text-[9px] text-green-600 font-bold">Pago único</p>
              </div>
              <motion.button 
                onClick={handlePurchase}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-glow transition btn-premium whitespace-nowrap"
              >
                Acceder ahora
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="py-12 text-center text-gray-400 text-[10px] sm:text-xs border-t border-gray-200 px-6 bg-white">
        <div className="container mx-auto max-w-4xl space-y-4">
          <p className="font-bold text-gray-600 uppercase tracking-widest">Biodescodificación Femenina — El Código Secreto de Tu Cuerpo</p>
          <p>© {new Date().getFullYear()} Todos los derechos reservados.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-2 opacity-60">
            <a href="/gracias" className="text-purple-600 font-bold hover:underline transition">👁️ Página de Gracias</a>
            <a href="#" className="hover:text-purple-600 transition">Privacidad</a>
            <a href="#" className="hover:text-purple-600 transition">Términos</a>
            <a href="#" className="hover:text-purple-600 transition">Soporte</a>
          </div>
          <p className="mt-8 opacity-30 max-w-xs mx-auto text-[9px]">Este sitio no es parte de Facebook Inc.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
