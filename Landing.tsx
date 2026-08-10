import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BadgeCheck, Sparkles, Moon, Sun, Gem, Star, Leaf, Brain, Activity, Heart, CalendarDays, Link2, ClipboardList, UsersRound, BookOpen, Smartphone, PenTool, MessageCircleHeart } from 'lucide-react';
import { analyzeSymptom } from './services/geminiService';
import { COLORS, TESTIMONIALS, FAQS, STACK_ITEMS, CONTENT } from './constants';
import { FAQItem, StackItem, Testimonial } from './types';

function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const CHECKOUT_CTA = "SÍ, QUIERO MI ACCESO COMPLETO POR $17.97 →";
const CHECKOUT_SUBTEXT = "Pago único · Acceso de por vida · Te lleva a Hotmart de forma 100% segura · 7 días de garantía total";

type HeroCopy = { title: string; subtitle: string };

const SYMPTOM_HERO_COPY: Record<string, HeroCopy> = {
  vientre: {
    title: "Tu vientre inflamado no es por lo que comes. Está guardando lo que no dijiste.",
    subtitle: "Tu centro creativo se inflama cuando te callas por miedo a ser juzgada. Descubre cómo liberarlo en 5 min al día."
  },
  tiroides: {
    title: "Tu garganta y tu ritmo interior podrían estar pidiéndote voz y pausa.",
    subtitle: "Desde una mirada emocional, esta zona puede hablar de tiempo, presión y palabras guardadas. Escúchala con claridad y sin juicio."
  },
  garganta: {
    title: "Ese nudo en tu garganta es todo lo que no te atreviste a decir.",
    subtitle: "Tu voz se quedó atrapada. Tu cuerpo retiene lo que tu boca no dijo."
  },
  lumbar: {
    title: "Tu dolor lumbar no es solo postura. Es de sostenerlo todo sola.",
    subtitle: "Tu espalda baja guarda el miedo a no tener apoyo y a no poder avanzar."
  },
  cabeza: {
    title: "Tu dolor de cabeza no es estrés. Es sobreexigencia por controlarlo todo.",
    subtitle: "Pensamientos que no paran porque sientes que si no controlas, algo malo pasa."
  },
  ansiedad: {
    title: "Ese pecho apretado no es ansiedad. Es culpa por ponerte siempre al último.",
    subtitle: "Aprendiste a ser fuerte para todos, menos para ti. Tu cuerpo te pide volver a ti."
  },
  ovarios: {
    title: "Tu ciclo y tu centro femenino podrían estar pidiendo escucha emocional.",
    subtitle: "Desde una mirada de autoconocimiento, esta zona puede guardar creatividad, feminidad, linaje y emociones que esperan espacio."
  },
  espalda_alta: {
    title: "Ese peso en hombros y espalda alta es todo lo que cargas que no es tuyo.",
    subtitle: "Cargas responsabilidades, culpas y expectativas que no te corresponden. Tu cuerpo te invita a soltar."
  },
  rodillas: {
    title: "Tus rodillas podrían estar hablando de miedo a ceder y avanzar.",
    subtitle: "Las rodillas guardan el conflicto entre sostenerte, pedir ayuda y cambiar de dirección."
  },
  ciatica: {
    title: "Tu cadera y tu camino hacia adelante podrían estar tensos por miedo al futuro.",
    subtitle: "Tu cuerpo se tensa cuando siente que avanzar no es seguro. Empieza escuchando el mensaje con calma."
  }
};

SYMPTOM_HERO_COPY['espalda-alta'] = SYMPTOM_HERO_COPY.espalda_alta;
SYMPTOM_HERO_COPY['ciática'] = SYMPTOM_HERO_COPY.ciatica;
SYMPTOM_HERO_COPY['cadera'] = SYMPTOM_HERO_COPY.ciatica;
function getHeroCopy(): HeroCopy {
  if (typeof window === 'undefined') {
    return { title: CONTENT.hero.title, subtitle: CONTENT.hero.subtitle };
  }

  const params = new URLSearchParams(window.location.search);
  const sintoma = params.get('sintoma')?.trim().toLowerCase() || '';
  return SYMPTOM_HERO_COPY[sintoma] || { title: CONTENT.hero.title, subtitle: CONTENT.hero.subtitle };
}

function trackFbEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    const eventId = generateEventId();
    (window as any).fbq('track', eventName, params || {}, { eventID: eventId });
  }
}



const Landing: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [symptomInput, setSymptomInput] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const analysisRef = useRef<HTMLDivElement>(null);
  const heroCopy = getHeroCopy();

  useEffect(() => {
    const handleScroll = () => { setShowStickyCta(window.scrollY > 600); };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePurchase = () => {
    trackFbEvent('InitiateCheckout', { value: 17.97, currency: 'USD' });
    window.open(CONTENT.pricing.paymentUrl, '_blank', 'noopener,noreferrer');
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

  return (
    <div className="min-h-screen bg-gradient-dark-premium overflow-x-hidden">
      {/* TOP ALERT */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white text-center py-3 px-4 text-xs font-bold uppercase tracking-widest shadow-glow">
        {CONTENT.hero.upperAlert}
      </div>

      {/* HERO SECTION WITH VIDEO BACKGROUND */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-32 lg:pb-40">
        {/* Video Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#2d1b4e] to-[#1a0a2e]">
          {/* Video Element */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          >
            <source src="/video-hero.mp4" type="video/mp4" />
            Su navegador no soporta videos HTML5
          </video>

          {/* Gradient Overlay para mejorar legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e]/88 via-[#2d1b4e]/70 to-[#1a0a2e]/88"></div>

          {/* Floating Orbs */}
          <motion.div 
            className="absolute w-96 h-96 rounded-full bg-purple-600/20 blur-3xl"
            animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
            transition={{ duration: 20, repeat: Infinity }}
            style={{ top: -100, right: -100 }}
          />
          <motion.div 
            className="absolute w-80 h-80 rounded-full bg-pink-600/15 blur-3xl"
            animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
            transition={{ duration: 25, repeat: Infinity }}
            style={{ bottom: -100, left: -100 }}
          />
        </div>

        <div className="container mx-auto px-5 sm:px-6 lg:px-12 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center relative z-10">
          <motion.div 
            className="space-y-6 sm:space-y-8 animate-fade-in text-center lg:text-left"
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-white/12 backdrop-blur-md border border-white/25 px-4 sm:px-5 py-3 w-fit mx-auto lg:mx-0 rounded-full shadow-soft">
              <span className="inline-flex items-center gap-0.5 text-yellow-300">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-300" strokeWidth={1.8} />)}</span><span className="text-white/90 text-sm font-semibold ml-3">+1.400 mujeres ya escuchan su cuerpo</span>
            </div>

            <h1 className="font-display text-[2.35rem] sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-white drop-shadow-2xl max-w-3xl mx-auto lg:mx-0">
              {heroCopy.title}
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-purple-100 font-light max-w-2xl mx-auto lg:mx-0 leading-relaxed drop-shadow">
              {heroCopy.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <motion.button 
                onClick={handlePurchase} 
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.96 }}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-pink-400/60 text-white px-8 sm:px-12 py-5 rounded-full font-black text-base sm:text-lg hover-lift transition leading-tight"
              >
                {CHECKOUT_CTA}
              </motion.button>
            </div>

            <motion.div 
              className="glass-intense p-8 rounded-2xl max-w-xl mx-auto lg:mx-0 text-left border-l-4 border-pink-500"
              whileHover={{ y: -4 }}
            >
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-4">Creado desde la experiencia real</p>
              <p className="text-white/90 text-sm leading-relaxed italic">"Me guardé todo por años, hasta que mi cuerpo me obligó a parar. Estaba agotada, con la garganta cerrada, sin energía. Hoy enseño a otras mujeres a escucharse antes de llegar a ese límite."</p>
              <p className="text-white/60 text-xs font-bold mt-4">— Sandra, tu amiga, creadora</p>
            </motion.div>

            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Pago único · Acceso de por vida · Te lleva a Hotmart de forma 100% segura · 7 días de garantía total</p>
          </motion.div>

          {/* HERO IMAGE */}
          <motion.div
            className="relative flex justify-end max-w-md mx-auto lg:ml-auto lg:-mr-20"
            initial={{ opacity: 0, x: 60, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ marginTop: '-100px' }}
          >
            <motion.div
              className="relative w-full"
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            >
              <img 
                src={CONTENT.hero.heroImage} 
                alt="Biodescodificación Femenina" 
                className="relative rounded-3xl shadow-elevated w-full h-auto border-2 border-white/20 z-10 object-cover hover-scale"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* IDENTIFICATION SECTION */}
      <section className="py-20 px-4 relative overflow-hidden gradient-dark-premium">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute w-96 h-96 rounded-full bg-purple-600/20 blur-3xl animate-orb"
            style={{ top: -100, right: -100 }}
          />
        </div>

        <div className="container mx-auto px-6 max-w-3xl relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-14 leading-snug">Antes de seguir, respóndete con honestidad:</h2>
          <div className="space-y-5 mb-12">
            {CONTENT.identification.questions.map((q, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-purple p-6 rounded-2xl border-l-4 border-pink-500 interactive-card"
              >
                <div className="flex items-start gap-4">
                  <motion.span 
                    className="text-pink-400 text-2xl flex-shrink-0 mt-1"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ delay: idx * 0.1, duration: 2 }}
                  >
                    ✓
                  </motion.span>
                  <p className="text-white font-medium text-sm sm:text-base leading-relaxed">{q}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div 
            className="gradient-premium text-white rounded-2xl px-10 py-8 text-center shadow-glow hover-lift"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-base sm:text-lg font-bold leading-relaxed">{CONTENT.identification.conclusion}</p>
          </motion.div>
        </div>
      </section>

      {/* PAIN SECTION */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute w-96 h-96 rounded-full bg-pink-600/15 blur-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
            style={{ bottom: -100, left: -100 }}
          />
        </div>

        <div className="container mx-auto px-6 max-w-3xl text-center space-y-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">No estás exagerando. No estás loca.</h2>
          <p className="text-2xl text-pink-400 italic font-semibold">Estás ignorando el idioma más importante que existe.</p>
          <div className="h-1 w-24 bg-gradient-to-r from-pink-500 to-purple-500 mx-auto"></div>
          <p className="text-2xl font-bold text-white">Cada síntoma es una emoción que no encontró otra salida.</p>
          <p className="text-purple-200 leading-relaxed text-lg">La biodescodificación dice que el cuerpo no miente. Ese dolor que aparece, esa contractura que nunca termina de irse...</p>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section className="py-20 px-4 gradient-premium text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute w-96 h-96 rounded-full bg-white/10 blur-3xl"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
            style={{ bottom: -100, right: -100 }}
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold">Con el Sistema vas a:</h2>
            <div className="h-1 w-24 bg-pink-300 mx-auto"></div>
          </div>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
            {CONTENT.benefits.items.map((benefit, idx) => {              const iconMap: Record<string, React.ReactNode> = {
                '📖': <BookOpen className="w-8 h-8" />,
                '📱': <Smartphone className="w-8 h-8" />,
                '🧘‍♀️': <Moon className="w-8 h-8" />,
                '💫': <Star className="w-8 h-8" />,
                '✨': <PenTool className="w-8 h-8" />,
                '💖': <MessageCircleHeart className="w-8 h-8" />,
              };              return (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-2rem)] glass-dark p-8 rounded-2xl hover-lift group border border-white/20 interactive-card"
                >
                  <motion.div 
                    className="text-5xl mb-5 group-hover:scale-110 transition-transform duration-300 text-pink-400"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ delay: idx * 0.2, duration: 2, repeat: Infinity }}
                  >
                    {iconMap[benefit.icon] || benefit.icon}
                  </motion.div>
                  <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                  <p className="text-purple-100 text-sm leading-relaxed">{benefit.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <motion.div 
            className="absolute w-96 h-96 rounded-full bg-purple-600/30 blur-3xl"
            animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
            transition={{ duration: 25, repeat: Infinity }}
            style={{ top: -100, left: -100 }}
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white px-4">Mujeres que aprendieron a escuchar su cuerpo</h2>
            <p className="text-purple-300 mt-3 max-w-lg mx-auto italic">"Resultados reales de mujeres reales"</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-2rem)] glass p-8 rounded-2xl shadow-soft hover-lift flex flex-col h-full border-t-4 border-pink-500 interactive-card"
              >
                <div className="flex text-yellow-400 mb-5 gap-1">{[...Array(t.rating)].map((_, i) => <motion.span key={i} animate={{ scale: [1, 1.15, 1] }} transition={{ delay: i * 0.08, duration: 1.2, repeat: Infinity }}><Star className="w-4 h-4 fill-yellow-400" strokeWidth={1.8} /></motion.span>)}</div>
                <p className="text-purple-100 italic mb-8 text-sm sm:text-base flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-glow">{t.name.charAt(0)}</div>
                  <div className="font-bold text-pink-400 text-sm">{t.name}, {t.age} años</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* APP SECTION */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <motion.div 
              className="w-full lg:w-1/2 relative"
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <motion.div 
                className="absolute -inset-10 rounded-3xl bg-gradient-to-r from-purple-600/30 to-pink-600/30 blur-3xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <div className="relative flex justify-center items-center gap-6">
                <motion.div 
                  className="w-2/3 z-20 hover-scale"
                  animate={{ y: [0, -25, 0] }}
                  transition={{ duration: 6, repeat: Infinity }}
                >
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full rounded-2xl shadow-elevated border-4 border-white/30 object-contain"
                  >
                    <source src="/video-app.mp4" type="video/mp4" />
                  </video>
                </motion.div>
              </div>
            </motion.div>

            <motion.div 
              className="w-full lg:w-1/2 space-y-10 text-center lg:text-left"
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 glass-intense px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mx-auto lg:mx-0"><Gem className="w-4 h-4" />App Interactiva</div>
                <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight text-gradient-white">La App <span className="text-pink-400">"Código Cuerpo"</span></h2>
                <p className="text-xl text-purple-200 font-medium italic">Tu guía emocional siempre en el bolsillo</p>
              </div>

              <div className="grid gap-6">
                {[
                  { Icon: Activity, title: "Mapa corporal interactivo", desc: "Toca donde te duele y recibe la interpretación al instante" },
                  { Icon: Sparkles, title: "Interpretación en segundos", desc: "Mensaje simbólico + reparación emocional" },
                  { Icon: Leaf, title: "Ejercicios digitales", desc: "Interactivos y guardados en la app" },
                  { Icon: Sun, title: "Reto 7 Días guiado", desc: "Con checks de progreso y reflexiones" },
                  { Icon: Moon, title: "Meditaciones en audio", desc: "Para culpa, miedo, ansiedad — listos para escuchar" },
                  { Icon: Brain, title: "Detecta patrones", desc: "La app analiza tu historial de síntomas" }
                ].map((feature, i) => (
                  <motion.div 
                    key={i} 
                    className="flex gap-4 group"
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex-shrink-0 w-12 h-12 glass-intense rounded-2xl shadow-soft border border-purple-500/40 flex items-center justify-center text-pink-400 group-hover:scale-110 transition">
                      <feature.Icon className="w-6 h-6" />
                    </div>
                    <div><h4 className="font-bold text-white mb-1">{feature.title}</h4><p className="text-purple-200 text-sm leading-relaxed">{feature.desc}</p></div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* OFFER SECTION */}
      <section id="offer" className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute w-96 h-96 rounded-full bg-pink-600/20 blur-3xl"
            animate={{ x: [0, 100, -100, 0], y: [0, 50, -50, 0] }}
            transition={{ duration: 20, repeat: Infinity }}
            style={{ top: -100, right: -100 }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
          <div className="glass-intense p-10 sm:p-16 rounded-3xl shadow-elevated">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 text-gradient-white">TODO LO QUE RECIBES HOY</h2>
              <p className="text-purple-300 font-bold uppercase tracking-widest text-sm">Valor total: $299 USD</p>
            </div>

            <div className="space-y-20">
              {/* MAIN ITEMS */}
              <div>
                <div className="text-center mb-12">
                  <h3 className="text-3xl font-bold text-white inline-block border-b-4 border-purple-500 pb-3">EL SISTEMA COMPLETO</h3>
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                  {mainItems.map((item, idx) => {
                    const mainIcons = [BookOpen, Smartphone, ClipboardList];
                    const MainIcon = mainIcons[idx] || Gem;

                    return (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ y: -12 }}
                        className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)] glass-dark rounded-2xl overflow-hidden flex flex-col group hover-lift interactive-card"
                      >
                        <div className="relative w-full h-48 bg-gradient-to-br from-purple-600/30 to-pink-600/30 overflow-hidden flex items-center justify-center">
                          <img src={item.image} alt={item.title} className="w-full h-full object-contain p-4 transition duration-500 group-hover:scale-110" />
                          <div className="absolute top-3 right-3 bg-purple-600 text-white text-[9px] font-bold px-3 py-1 rounded-full shadow-glow uppercase tracking-wider">INCLUIDO</div>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-shrink-0 w-9 h-9 rounded-xl glass-purple border border-purple-500/50 flex items-center justify-center text-purple-100 shadow-soft group-hover:scale-110 transition-transform duration-300">
                              <MainIcon className="w-5 h-5" strokeWidth={2.2} />
                            </div>
                            <h4 className="font-bold text-white leading-tight text-sm pt-0.5">{item.title}</h4>
                          </div>
                          {item.description && <p className="text-purple-200 text-xs leading-relaxed mb-4 flex-1">{item.description}</p>}
                          <div className="flex justify-between items-center pt-4 mt-auto border-t border-purple-700">
                            <span className="text-gray-400 text-[10px] font-bold line-through">VALOR: ${item.value}</span>
                            <span className="text-pink-400 text-[10px] font-black">HOY: $0.00</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* BONUS ITEMS */}
              <div>
                <div className="text-center mb-12">
                  <h3 className="text-3xl font-bold text-white inline-block border-b-4 border-yellow-500 pb-3">BONOS EXCLUSIVOS</h3>
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                  {bonusItems.map((item, idx) => {
                    const bonusIcons = [Heart, CalendarDays, Link2, ClipboardList, UsersRound];
                    const BonusIcon = bonusIcons[idx] || Sparkles;

                    return (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ y: -12 }}
                        className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)] glass-dark rounded-2xl overflow-hidden flex flex-col group hover-lift interactive-card"
                      >
                        <div className="relative w-full h-48 bg-gradient-to-br from-yellow-600/30 to-orange-600/30 overflow-hidden flex items-center justify-center">
                          <img src={item.image} alt={item.title} className="w-full h-full object-contain p-4 transition duration-500 group-hover:scale-110" />
                          <div className="absolute top-3 right-3 bg-yellow-500 text-black text-[9px] font-black px-3 py-1 rounded-full shadow-glow uppercase">REGALO</div>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-shrink-0 w-9 h-9 rounded-xl glass-purple border border-pink-400/60 flex items-center justify-center text-pink-300 shadow-soft group-hover:scale-110 transition-transform duration-300">
                              <BonusIcon className="w-5 h-5" strokeWidth={2.2} />
                            </div>
                            <h4 className="font-bold text-pink-400 leading-tight text-sm pt-0.5">{item.title}</h4>
                          </div>
                          {item.description && <p className="text-purple-200 text-xs leading-relaxed mb-4 flex-1">{item.description}</p>}
                          <div className="flex justify-between items-center pt-4 mt-auto border-t border-purple-700">
                            <span className="text-gray-400 text-[10px] font-bold line-through">VALOR: ${item.value}</span>
                            <span className="text-green-400 text-[10px] font-black">REGALO</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* PRICE SECTION */}
            <div className="mt-20 border-t-2 border-dashed border-purple-600 pt-16 text-center space-y-10">
              <div className="glass-dark border-2 border-purple-500 rounded-2xl px-10 py-6 max-w-lg mx-auto shadow-soft">
                <p className="text-sm font-bold text-white uppercase tracking-widest">⚡ Precio especial de lanzamiento de la App</p>
                <p className="text-purple-300 text-xs mt-2 font-medium">Cuando termine el lanzamiento, el precio sube a $47 USD — sin excepciones.</p>
              </div>

              <div className="space-y-4">
                <p className="text-purple-300 font-bold text-sm uppercase tracking-widest">TU INVERSIÓN HOY</p>
                <p className="text-gray-500 line-through text-xl font-semibold">Valor Total: $299 USD</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-5xl font-black text-pink-500">$</span>
                  <motion.span
                    className="text-7xl font-black text-pink-500 animate-glow"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    17.97
                  </motion.span>
                  <span className="text-2xl font-black text-pink-500 self-start mt-4">USD</span>
                </div>
                <p className="text-white font-black text-lg uppercase tracking-widest">Precio de lanzamiento — Después sube a $47</p>
              </div>

              <div className="glass-purple rounded-2xl px-8 py-5 max-w-lg mx-auto border-2 border-pink-500">
                <p className="text-white text-sm font-bold">Pago único, acceso de por vida</p>
                <p className="text-purple-200 text-xs mt-2 font-medium">Sin suscripción · Sin cobros mensuales · Sin sorpresas</p>
              </div>

              <div className="max-w-xl mx-auto space-y-4">
                <motion.button 
                  onClick={handlePurchase}
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.96 }}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white py-6 sm:py-7 px-5 sm:px-6 rounded-2xl text-lg sm:text-2xl font-black leading-tight shadow-glow hover-lift transition"
                >
                  {CHECKOUT_CTA}
                </motion.button>
                <p className="text-xs text-purple-300 font-bold uppercase tracking-widest">Pago único · Acceso de por vida · Te lleva a Hotmart de forma 100% segura · 7 días de garantía total</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ANALYZER SECTION */}
      <section id="analyzer" className="py-16 sm:py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-96 h-96 rounded-full bg-purple-600/20 blur-3xl animate-orb"
            style={{ top: -100, right: -100 }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 max-w-4xl relative z-10">
          <div className="glass-intense p-8 sm:p-12 rounded-3xl shadow-elevated">
            <div className="text-center mb-10 flex flex-col items-center">
              <motion.div
                className="glass-dark px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="inline-block w-4 h-4 mr-2" />¿Todavía lo dudas? Pruébalo gratis
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white text-gradient-white">¿Qué te está diciendo tu cuerpo?</h2>
              <p className="text-purple-200 mt-3 text-sm sm:text-base">Escribe tu síntoma y recibe el mensaje emocional</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <input
                type="text"
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                placeholder="Ej: dolor de espalda, migraña, nudo en la garganta..."
                className="flex-1 px-6 py-4 rounded-full border-2 border-purple-500/50 focus:border-pink-500 focus:outline-none glass text-white placeholder-purple-300/50 transition"
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <motion.button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-10 py-4 rounded-full font-black hover:shadow-glow transition disabled:opacity-50 btn-premium whitespace-nowrap"
              >
                {isAnalyzing ? (
                  <>â³ Analizando...</>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" /> Descubrir
                  </>
                )}
              </motion.button>
            </div>

            {analysis && (
              <motion.div
                ref={analysisRef}
                className="mt-10 p-8 glass-purple rounded-2xl border-l-4 border-pink-500 animate-fade-in-up shadow-soft"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-white leading-relaxed whitespace-pre-wrap text-sm sm:text-base italic">"{analysis}"</p>
                <div className="mt-8 text-center">
                  <p className="text-purple-200 text-sm mb-4">Esto es solo una muestra. El sistema completo va mucho más profundo:</p>
                  <motion.button
                    onClick={handlePurchase}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 sm:px-10 py-3 rounded-full font-bold text-xs sm:text-sm leading-tight hover:shadow-glow transition"
                  >
                    {CHECKOUT_CTA}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-4xl font-bold text-center mb-14 uppercase tracking-tight text-white">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-dark rounded-2xl overflow-hidden shadow-soft border-2 border-purple-500/40 hover-lift"
              >
                <motion.button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full text-left p-6 flex justify-between items-center hover:bg-purple-600/20 transition"
                  whileHover={{ x: 4 }}
                >
                  <span className="font-bold text-white text-base leading-snug pr-4">{faq.question}</span>
                  <motion.span 
                    className="text-pink-400 text-2xl transition-transform duration-300 flex-shrink-0"
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
                  <div className="p-6 pt-0 text-purple-200 border-t border-purple-600/40 text-sm leading-relaxed">{faq.answer}</div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING SECTION */}
      <section className="py-24 px-4 relative overflow-hidden gradient-premium">
        <div className="container mx-auto px-6 max-w-3xl text-center relative z-10 space-y-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white italic leading-snug">{CONTENT.closing.imagine}</h2>
          <div className="space-y-4 text-left">
            {CONTENT.closing.points.map((point, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-dark p-5 rounded-2xl border-l-4 border-pink-400 flex items-start gap-3"
              >
                <span className="text-pink-400 text-xl flex-shrink-0">✨</span>
                <p className="text-white/90 text-sm sm:text-base leading-relaxed">{point}</p>
              </motion.div>
            ))}
          </div>
          <p className="text-white text-lg font-semibold leading-relaxed">{CONTENT.closing.reality}</p>
          <div className="space-y-6">
            <p className="text-2xl font-black text-white uppercase tracking-wide">{CONTENT.closing.finalCall}</p>
            <p className="text-purple-100">{CONTENT.closing.finalSub}</p>
            <motion.button
              onClick={handlePurchase}
              whileHover={{ scale: 1.08, y: -4 }}
              whileTap={{ scale: 0.96 }}
              className="w-full max-w-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white py-6 px-8 rounded-2xl text-xl font-black shadow-glow hover-lift transition"
            >
              {CONTENT.closing.finalCta}
            </motion.button>
            <p className="text-xs text-purple-200 font-bold uppercase tracking-widest">🛡️ Pago único · Acceso de por vida · Te lleva a Hotmart de forma 100% segura · 7 días de garantía total</p>
          </div>
          <p className="text-purple-100 text-sm leading-relaxed italic max-w-xl mx-auto">{CONTENT.closing.ps}</p>
        </div>
      </section>

      {/* STICKY CTA */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 transition-all duration-500 transform pointer-events-none ${showStickyCta ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0'}`}>
        <div className="container mx-auto max-w-3xl">
          <motion.div 
            className="glass-intense shadow-elevated rounded-2xl p-4 flex items-center justify-between border-2 border-purple-500"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: showStickyCta ? 0 : 100, opacity: showStickyCta ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <div className="hidden sm:block ml-4">
              <p className="text-xs font-bold text-pink-400 uppercase">Oferta limitada</p>
              <p className="text-sm font-black text-white">Biodescodificación Femenina</p>
            </div>
            <div className="flex items-center gap-4 flex-1 sm:flex-initial justify-between sm:justify-end w-full sm:w-auto px-2">
              <div className="text-left sm:text-right leading-tight">
                <p className="text-xs text-gray-400 line-through mb-1">$47 USD</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-pink-400">$</span>
                  <span className="text-2xl font-black text-pink-400">17.97</span>
                </div>
              </div>
              <motion.button 
                onClick={handlePurchase}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-xl font-black text-xs shadow-glow transition btn-premium"
              >
                Acceder
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="py-12 text-center text-gray-400 text-xs border-t border-purple-900/50 px-6 bg-gradient-dark-premium">
        <div className="container mx-auto max-w-4xl space-y-4">
          <p className="font-bold text-gray-300 uppercase tracking-widest">Biodescodificación Femenina</p>
          <p>© {new Date().getFullYear()} Todos los derechos reservados.</p><p className="text-gray-500 max-w-xl mx-auto leading-relaxed">Este sistema es una herramienta de autoconocimiento emocional y no reemplaza consejo médico profesional.</p>
          <div className="flex flex-wrap justify-center gap-6 opacity-60">
            <a href="/gracias" className="text-pink-500 font-bold hover:underline">Página de Gracias</a>
            <a href="#" className="hover:text-pink-500 transition">Privacidad</a>
            <a href="#" className="hover:text-pink-500 transition">Términos</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;











