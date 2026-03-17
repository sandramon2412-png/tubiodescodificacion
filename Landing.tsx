import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, CheckCircle } from 'lucide-react';
import { analyzeSymptom } from './services/geminiService';
import { COLORS, TESTIMONIALS, FAQS, STACK_ITEMS, CONTENT } from './constants';
import { FAQItem, StackItem, Testimonial } from './types';

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
  { id: 1, pregunta: "¿Dónde sentís más tensión o dolor frecuente?", opciones: [{ texto: "Cuello y hombros", emocion: "carga" }, { texto: "Estómago o digestión", emocion: "control" }, { texto: "Cabeza o migrañas", emocion: "vision" }, { texto: "Espalda baja o rodillas", emocion: "miedo" }] },
  { id: 2, pregunta: "¿En qué momentos te sentís peor?", opciones: [{ texto: "Cuando tengo conflictos con alguien", emocion: "carga" }, { texto: "Cuando siento que pierdo el control", emocion: "control" }, { texto: "Cuando ignoro lo que realmente quiero", emocion: "vision" }, { texto: "Cuando enfrento cambios o decisiones grandes", emocion: "miedo" }] },
  { id: 3, pregunta: "¿Cuál de estas frases te representa más?", opciones: [{ texto: "Siempre termino cargando con todo sola", emocion: "carga" }, { texto: "Me cuesta soltar y dejar ir las cosas", emocion: "control" }, { texto: "Hay cosas que nunca pude decir o expresar", emocion: "vision" }, { texto: "Le tengo miedo a avanzar o cambiar", emocion: "miedo" }] },
  { id: 4, pregunta: "¿Cómo reaccionás bajo mucha presión?", opciones: [{ texto: "Me duele el cuerpo físicamente", emocion: "carga" }, { texto: "Me trabo, me bloqueo, no puedo dormir", emocion: "control" }, { texto: "Me quedo callada aunque quiera hablar", emocion: "vision" }, { texto: "Me paralizo y no sé qué hacer", emocion: "miedo" }] },
];

const resultadosQuiz: Record<string, { titulo: string; descripcion: string; sintomas: string }> = {
  carga: { titulo: "Tu cuerpo carga lo que tu corazón no pudo soltar", descripcion: "Llevás años poniendo a todos antes que a vos. El peso de esa responsabilidad se acumula en tu cuerpo — especialmente en el cuello, los hombros y la espalda. Tu cuerpo te está pidiendo que empieces a ponerte primero.", sintomas: "Contracturas, cuello tenso, dolores de espalda, cansancio crónico" },
  control: { titulo: "Tu cuerpo guarda lo que no podés soltar", descripcion: "Te cuesta dejar ir — situaciones, personas, emociones. Esa necesidad de control se expresa en tu sistema digestivo y en tu tensión interna. Tu cuerpo te está pidiendo que aprendas a confiar y soltar.", sintomas: "Colon irritable, problemas digestivos, tensión abdominal, insomnio" },
  vision: { titulo: "Tu cuerpo guarda todo lo que nunca pudiste decir", descripcion: "Hay emociones, palabras y verdades que nunca pudiste expresar. Se acumulan en tu garganta, tu tiroides, tu cabeza. Tu cuerpo te está pidiendo que finalmente te des permiso de decir lo que sentís.", sintomas: "Tiroides, migrañas, dolor de garganta frecuente, sinusitis" },
  miedo: { titulo: "Tu cuerpo frena cuando tu mente tiene miedo", descripcion: "Los cambios, las decisiones, el futuro — todo te genera una resistencia profunda que se siente en el cuerpo. Las rodillas, la espalda baja, las piernas. Tu cuerpo te está pidiendo que confíes en vos misma para avanzar.", sintomas: "Dolor de rodillas, problemas en piernas, espalda baja, ciática" },
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
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead');
      }
    } else {
      setPreguntaActual(preguntaActual + 1);
    }
  };

  const reiniciar = () => { setPaso("intro"); setPreguntaActual(0); setRespuestas([]); };
  const resultado = respuestas.length > 0 ? resultadosQuiz[calcularResultado(respuestas)] : null;
  const progreso = (preguntaActual / preguntas.length) * 100;

  return (
    <section className="py-16 px-4" style={{ background: "linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%)" }}>
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {paso === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <div className="text-5xl mb-6">🔮</div>
              <h2 className="text-3xl font-bold text-white mb-4 leading-tight">¿Qué emoción está cargando tu cuerpo?</h2>
              <p className="text-purple-200 text-lg mb-8 leading-relaxed">Respondé 4 preguntas y descubrí el origen emocional de tus síntomas — personalizado para vos.</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={() => setPaso("preguntas")} className="bg-white text-purple-900 font-bold text-lg px-10 py-4 rounded-full cursor-pointer border-0">Descubrir mi emoción →</motion.button>
              <p className="text-purple-400 text-sm mt-4">Solo 4 preguntas — menos de 1 minuto</p>
            </motion.div>
          )}
          {paso === "preguntas" && (
            <motion.div key={`pregunta-${preguntaActual}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div className="mb-6">
                <div className="flex justify-between text-purple-300 text-sm mb-2"><span>Pregunta {preguntaActual + 1} de {preguntas.length}</span><span>{Math.round(progreso)}%</span></div>
                <div className="w-full bg-purple-900 rounded-full h-2"><motion.div className="bg-purple-400 h-2 rounded-full" initial={{ width: 0 }} animate={{ width: `${progreso}%` }} transition={{ duration: 0.4 }} /></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-8 text-center leading-tight">{preguntas[preguntaActual].pregunta}</h3>
              <div className="flex flex-col gap-3">
                {preguntas[preguntaActual].opciones.map((opcion, i) => (
                  <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} onClick={() => responder(opcion.emocion)} className="w-full text-left p-4 rounded-xl border border-purple-500 text-purple-100 hover:bg-purple-800 hover:border-purple-300 transition-all cursor-pointer" style={{ background: "rgba(139,92,246,0.1)" }}>{opcion.texto}</motion.button>
                ))}
              </div>
            </motion.div>
          )}
          {paso === "resultado" && resultado && (
            <motion.div key="resultado" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="text-5xl mb-6">✨</div>
              <p className="text-purple-300 text-sm uppercase tracking-widest mb-3">Tu resultado</p>
              <h3 className="text-2xl font-bold text-white mb-6 leading-tight">{resultado.titulo}</h3>
              <div className="rounded-2xl p-6 mb-6 text-left" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)" }}>
                <p className="text-purple-100 leading-relaxed mb-4">{resultado.descripcion}</p>
                <div className="border-t border-purple-700 pt-4"><p className="text-purple-400 text-sm font-medium mb-1">Síntomas relacionados:</p><p className="text-purple-200 text-sm">{resultado.sintomas}</p></div>
              </div>
              <p className="text-purple-200 mb-6 leading-relaxed">La biodescodificación te muestra exactamente cómo sanar esta emoción — y liberar el síntoma que carga tu cuerpo.</p>
              <motion.a href={paymentUrl} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="block bg-white text-purple-900 font-bold text-lg px-10 py-4 rounded-full mb-3 cursor-pointer">🔥 Quiero entender mi cuerpo completo — $6.97</motion.a>
              <p className="text-purple-400 text-xs mb-4">🔓 Pago único · Sin suscripción · Acceso de por vida</p>
              <button onClick={reiniciar} className="text-purple-400 text-sm underline cursor-pointer bg-transparent border-0">Hacer el quiz de nuevo</button>
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
  const analysisRef = useRef<HTMLDivElement>(null);
  const { m, s } = useCountdown(17);

  useEffect(() => {
    const handleScroll = () => { setShowStickyCta(window.scrollY > 600); };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePurchase = () => { window.open(CONTENT.pricing.paymentUrl, '_blank'); };

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
          <motion.div initial={{ opacity: 0, x: -50, y: 20 }} animate={{ opacity: 1, x: 0, y: 0 }} exit={{ opacity: 0, x: -50, scale: 0.95 }} className="fixed bottom-24 left-4 sm:bottom-8 sm:left-8 z-[60] max-w-[280px] sm:max-w-sm">
            <div className="bg-white/95 backdrop-blur-md border border-purple-100 shadow-2xl rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="bg-green-100 p-2 rounded-full flex-shrink-0"><ShoppingBag className="w-5 h-5 text-green-600" /></div>
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-800 leading-tight"><span className="font-bold text-[#8B4B9C]">{purchases[currentPurchase].name}</span> de {purchases[currentPurchase].city} {purchases[currentPurchase].action}.</p>
                <div className="flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3 text-green-500" /><span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Compra Verificada</span></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-[#E0C4C3] text-purple-900 text-center py-2 px-4 text-xs font-bold animate-pulse uppercase tracking-widest">{CONTENT.hero.upperAlert}</div>

      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-24 lg:pb-32 bg-gradient-to-br from-purple-900 via-[#8B4B9C] to-purple-800 text-white">
        <div className="container mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-7 sm:space-y-9 animate-fade-in text-center lg:text-left">
            {/* SOCIAL PROOF — nuevo */}
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <span className="text-yellow-400 text-base">⭐⭐⭐⭐⭐</span>
              <span className="text-white/80 text-sm font-medium">127 reseñas verificadas · +1.400 mujeres ya accedieron</span>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] animate-fade-in tracking-tight">{CONTENT.hero.title}</h1>
            <p className="text-xl lg:text-2xl opacity-90 font-light max-w-2xl mx-auto lg:mx-0 leading-relaxed">{CONTENT.hero.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button onClick={handlePurchase} className="bg-[#E0C4C3] hover:bg-[#D1B2B1] text-gray-800 px-10 py-5 rounded-full font-black text-xl shadow-xl transition transform hover:scale-105 active:scale-95">{CONTENT.hero.cta}</button>
            </div>
            {/* SIN SUSCRIPCIÓN — lugar 1 */}
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">🔓 Pago único · Sin suscripción · Sin cobros mensuales · Acceso de por vida</p>
            <p className="text-sm sm:text-base italic opacity-75">{CONTENT.hero.footer}</p>
          </div>
          <div className="relative group max-w-sm mx-auto lg:max-w-xs xl:max-w-sm flex flex-col items-center lg:items-end">
            <div className="relative w-full sm:w-3/4 lg:w-full">
              <div className="absolute -inset-4 bg-white/10 rounded-2xl blur-2xl group-hover:bg-white/20 transition duration-500"></div>
              <img src={CONTENT.hero.heroImage} alt="Biodescodificación Femenina" className="relative rounded-2xl shadow-2xl w-full h-auto border-4 border-white/20 z-10" referrerPolicy="no-referrer" />
            </div>
            <div className="relative -mt-16 sm:-mt-24 lg:-mt-32 -mr-8 sm:-mr-12 lg:-mr-16 w-1/2 sm:w-2/5 lg:w-1/2 z-20 animate-bounce-subtle">
              <div className="absolute -inset-2 bg-purple-500/20 rounded-[2rem] blur-xl"></div>
              <img src="https://i.imgur.com/tp3ywRK.png" alt="App Interactiva de Biodescodificación" className="relative rounded-[2rem] shadow-2xl w-full border-4 border-white/30" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10 leading-snug">{CONTENT.identification.title}</h2>
          <div className="space-y-4 mb-10">
            {CONTENT.identification.questions.map((q, idx) => (
              <div key={idx} className="flex items-start gap-4 bg-purple-50 border border-purple-100 rounded-2xl px-6 py-4">
                <span className="text-[#8B4B9C] text-xl font-black flex-shrink-0 mt-0.5">✓</span>
                <p className="text-gray-800 font-medium text-sm sm:text-base leading-relaxed">{q}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#8B4B9C] text-white rounded-2xl px-8 py-6 text-center">
            <p className="text-base sm:text-lg font-bold leading-relaxed">{CONTENT.identification.conclusion}</p>
          </div>
        </div>
      </section>

      <QuizSection paymentUrl={CONTENT.pricing.paymentUrl} />

      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-3xl text-center space-y-6 sm:space-y-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">{CONTENT.pain.question}</h2>
          <p className="text-xl sm:text-2xl text-[#8B4B9C] italic font-semibold leading-relaxed">"{CONTENT.pain.quote}"</p>
          <div className="h-1 w-20 bg-[#8B4B9C] mx-auto"></div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">{CONTENT.pain.statement}</p>
          <p className="text-gray-700 leading-relaxed text-base sm:text-lg">{CONTENT.pain.description}</p>
        </div>
      </section>

      <section id="analyzer" className="py-12 sm:py-16 bg-purple-50">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-lg border border-purple-100">
            <div className="text-center mb-8 flex flex-col items-center">
              <div className="w-fit mx-auto bg-purple-100 text-[#8B4B9C] px-4 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest">{CONTENT.analyzer.tag}</div>
              <h2 className="text-2xl sm:text-3xl font-bold mt-4">{CONTENT.analyzer.title}</h2>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">{CONTENT.analyzer.subtitle}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="text" value={symptomInput} onChange={(e) => setSymptomInput(e.target.value)} placeholder={CONTENT.analyzer.placeholder} className="flex-1 px-6 py-4 rounded-full border-2 border-purple-100 focus:border-[#8B4B9C] outline-none text-sm sm:text-base transition-all" />
              <button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-[#8B4B9C] text-white px-8 py-4 rounded-full font-bold hover:bg-purple-800 transition disabled:opacity-50 whitespace-nowrap shadow-md active:scale-95">{isAnalyzing ? CONTENT.analyzer.loading : CONTENT.analyzer.button}</button>
            </div>
            {analysis && (
              <div ref={analysisRef} className="mt-8 p-6 bg-purple-50 rounded-2xl border-l-4 border-[#8B4B9C] animate-fade-in">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm sm:text-base italic">"{analysis}"</p>
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500 mb-3">¿Querés explorar esto más en profundidad?</p>
                  <button onClick={handlePurchase} className="bg-[#8B4B9C] text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-purple-800 transition shadow-md">Sí, quiero entender mi cuerpo completo →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-[#8B4B9C] text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 sm:mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">{CONTENT.benefits.title}</h2>
            <div className="h-1 w-24 bg-[#E0C4C3] mx-auto"></div>
          </div>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
            {CONTENT.benefits.items.map((benefit, idx) => (
              <div key={idx} className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-2rem)] bg-white/10 p-6 sm:p-8 rounded-2xl hover:bg-white/20 transition backdrop-blur-sm border border-white/10 group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{benefit.icon}</div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-purple-100 text-sm sm:text-base leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 px-4">Mujeres que aprendieron a escuchar su cuerpo</h2>
            <p className="text-gray-500 mt-2 max-w-lg mx-auto italic">"Resultados reales de mujeres reales — con síntomas reales y vidas ocupadas."</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-2rem)] bg-gray-50 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
                <div className="flex text-yellow-400 mb-4 text-sm">{[...Array(t.rating)].map((_, i) => <span key={i}>★</span>)}</div>
                <p className="text-gray-700 italic mb-6 text-sm sm:text-base flex-1">"{t.text}"</p>
                <div className="font-bold text-[#8B4B9C] mt-auto text-sm sm:text-base">{t.name}, {t.age} años</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-purple-50 overflow-hidden">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="w-full lg:w-1/2 relative">
              <div className="absolute -inset-4 bg-purple-200/50 rounded-[3rem] blur-3xl"></div>
              <div className="relative flex justify-center items-center gap-4 sm:gap-6">
                <div className="w-2/3 sm:w-3/5 z-20 transform -rotate-3 hover:rotate-0 transition-transform duration-500"><img src="https://i.imgur.com/tp3ywRK.png" alt="App Código Cuerpo" className="rounded-[2.5rem] shadow-2xl border-4 border-white" referrerPolicy="no-referrer" /></div>
                <div className="w-1/2 sm:w-2/5 absolute -right-4 sm:-right-8 top-1/2 -translate-y-1/2 z-10 transform rotate-6 opacity-80 hover:opacity-100 transition-all duration-500"><img src="https://i.imgur.com/Kel8mP3.png" alt="App Código Cuerpo - Diario" className="rounded-[2rem] shadow-xl border-4 border-white" referrerPolicy="no-referrer" /></div>
              </div>
            </div>
            <div className="w-full lg:w-1/2 space-y-8 text-center lg:text-left">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-purple-100 text-[#8B4B9C] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mx-auto lg:mx-0">📱 Solo en este sistema — nadie más lo tiene</div>
                <h2 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight">La App <span className="text-[#8B4B9C]">"Código Cuerpo"</span></h2>
                <p className="text-xl text-gray-600 font-medium italic">Tu guía emocional siempre en el bolsillo</p>
                <p className="text-gray-600 leading-relaxed text-lg">Mientras otros venden solo un PDF, nosotras creamos una experiencia interactiva que te acompaña en tiempo real.</p>
                {/* SIN SUSCRIPCIÓN — lugar 2, sección app */}
                <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-full text-sm font-bold mx-auto lg:mx-0">
                  🔓 Tu acceso es para siempre — pagas una sola vez, sin suscripciones ni cobros sorpresa
                </div>
              </div>
              <div className="grid gap-6">
                {[
                  { icon: "🗺️", title: "Toca donde te duele", desc: "Mapa corporal femenino interactivo. Registrá tu síntoma en 4 pasos y recibí la interpretación al instante." },
                  { icon: "💬", title: "Tu mensaje en segundos", desc: "Interpretación simbólica del síntoma + reparación en 3 niveles. Inmediato, claro, profundo." },
                  { icon: "📝", title: "Ejercicios del libro en versión digital", desc: "\"Lo que no dije\", \"Mi verdad hoy\", \"Mis dos voces\"... todo interactivo y guardado." },
                  { icon: "🎯", title: "Reto 7 Días guiado", desc: "Ejercicios día a día con checks de progreso y espacio para tus reflexiones personales." },
                  { icon: "🎧", title: "Meditaciones y tapping en audio", desc: "Guiones completos para culpa, miedo, ansiedad y más. Listos para escuchar ahora mismo." },
                  { icon: "📊", title: "Detecta tus patrones emocionales", desc: "La app analiza tu historial y te avisa cuando detecta patrones repetitivos." }
                ].map((feature, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-2xl shadow-sm border border-purple-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">{feature.icon}</div>
                    <div><h4 className="font-bold text-gray-900 mb-1">{feature.title}</h4><p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border-t-4 border-red-400 shadow-sm">
              <h3 className="text-lg sm:text-xl font-bold text-red-500 mb-6 uppercase tracking-tight">❌ Este sistema NO es para vos si...</h3>
              <ul className="space-y-4 text-gray-600 text-sm sm:text-base">
                <li>• Buscás una pastilla mágica que lo resuelva todo sin trabajo interno</li>
                <li>• No estás dispuesta a dedicar 15-20 minutos diarios</li>
                <li>• Querés quedarte en zona de confort por siempre</li>
                <li>• No tenés ninguna apertura al autoconocimiento</li>
              </ul>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-2xl border-t-4 border-green-400 shadow-sm">
              <h3 className="text-lg sm:text-xl font-bold text-green-500 mb-6 uppercase tracking-tight">✅ Este sistema SÍ es para vos si:</h3>
              <ul className="space-y-4 text-gray-600 text-sm sm:text-base">
                <li>• Estás lista para entender lo que tu cuerpo realmente te dice</li>
                <li>• Querés sanar desde la raíz, no solo tapar síntomas</li>
                <li>• Sentís que hay algo emocional detrás de lo que sentís físicamente</li>
                <li>• Buscás una transformación que dure — no un alivio momentáneo</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="offer" className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="bg-purple-50 p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-2xl relative border-2 border-purple-100">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{CONTENT.stack.title}</h2>
              <p className="text-purple-600 font-bold uppercase tracking-widest text-xs sm:text-sm">{CONTENT.stack.subtitle}</p>
            </div>
            <div className="space-y-16 sm:space-y-20">
              <div>
                <div className="text-center mb-8 sm:mb-12"><h3 className="text-2xl sm:text-3xl font-bold text-[#8B4B9C] inline-block border-b-4 border-[#E0C4C3] pb-2">{CONTENT.stack.mainTitle}</h3></div>
                <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
                  {mainItems.map((item, idx) => (
                    <div key={idx} className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-2rem)] bg-white rounded-2xl overflow-hidden flex flex-col group transition transform hover:-translate-y-1 shadow-sm border border-purple-50">
                      <div className="relative aspect-[4/3] w-full flex items-center justify-center">
                        <img src={item.image} alt={item.title} className="w-full h-full object-contain p-10 transition duration-500 group-hover:scale-105" style={{ mixBlendMode: 'multiply' }} />
                        <div className="absolute top-2 right-2 bg-[#8B4B9C] text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-md z-20 uppercase tracking-wider">INCLUIDO</div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h4 className="font-bold text-gray-800 leading-tight mb-2 text-sm sm:text-base">{item.title}</h4>
                        {item.description && <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4">{item.description}</p>}
                        <div className="flex justify-between items-center pt-2 mt-auto border-t border-gray-50">
                          <span className="text-gray-400 text-[10px] font-bold line-through">VALOR: ${item.value} USD</span>
                          <span className="text-[#8B4B9C] text-[10px] font-black uppercase">HOY: $0.00</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-center mb-8 sm:mb-12"><h3 className="text-2xl sm:text-3xl font-bold text-[#8B4B9C] inline-block border-b-4 border-yellow-400 pb-2">{CONTENT.stack.bonusTitle}</h3></div>
                <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
                  {bonusItems.map((item, idx) => (
                    <div key={idx} className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-2rem)] bg-white rounded-2xl overflow-hidden flex flex-col group transition transform hover:-translate-y-1 shadow-sm border border-yellow-50">
                      <div className="relative aspect-[4/3] w-full flex items-center justify-center">
                        <img src={item.image} alt={item.title} className="w-full h-full object-contain p-10 transition duration-500 group-hover:scale-105" style={{ mixBlendMode: 'multiply' }} />
                        <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[9px] font-black px-2 py-1 rounded-full shadow-md z-20 uppercase tracking-wider">BONUS GRATIS</div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h4 className="font-bold text-purple-700 leading-tight mb-2 text-sm sm:text-base">{item.title}</h4>
                        {item.description && <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4">{item.description}</p>}
                        <div className="flex justify-between items-center pt-2 mt-auto border-t border-gray-50">
                          <span className="text-gray-400 text-[10px] font-bold line-through">VALOR: ${item.value} USD</span>
                          <span className="text-green-600 text-[10px] font-black uppercase tracking-widest">REGALO</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-16 sm:mt-24 border-t-2 border-dashed border-purple-200 pt-12 text-center space-y-8">
              <div className="bg-white border-2 border-purple-200 rounded-2xl px-8 py-5 max-w-sm mx-auto shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">⏰ Este precio especial vence en:</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="text-center"><div className="text-4xl font-black text-[#8B4B9C]">{m}</div><div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">min</div></div>
                  <div className="text-3xl font-black text-[#8B4B9C]">:</div>
                  <div className="text-center"><div className="text-4xl font-black text-[#8B4B9C]">{s}</div><div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">seg</div></div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500 font-bold text-sm sm:text-base uppercase tracking-widest mb-2">💰 TU INVERSIÓN HOY</p>
                <p className="text-gray-400 line-through text-lg sm:text-2xl font-medium tracking-tight">Valor Total del Pack: $299 USD</p>
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <span className="text-4xl sm:text-6xl font-black text-[#8B4B9C]">$</span>
                  <span className="text-7xl sm:text-9xl font-black text-[#8B4B9C] tracking-tighter animate-pulse">6.97</span>
                  <span className="text-xl sm:text-2xl font-black text-[#8B4B9C] self-start mt-2 sm:mt-4">USD</span>
                </div>
                <p className="text-[#8B4B9C] font-black text-sm sm:text-lg uppercase tracking-widest px-4 text-center">PRECIO DE LANZAMIENTO DE LA APP — SOLO POR 48 HORAS</p>
              </div>
              {/* SIN SUSCRIPCIÓN — lugar 3, sección pack */}
              <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-4 max-w-lg mx-auto">
                <p className="text-green-700 text-sm font-bold">✅ Todo esto es tuyo para siempre con un único pago de $6.97 USD</p>
                <p className="text-green-600 text-xs mt-1 font-medium">Sin suscripción · Sin cobros mensuales · Sin sorpresas · Acceso de por vida 💜</p>
              </div>
              <div className="max-w-xl mx-auto space-y-4 px-2">
                <button onClick={handlePurchase} className="w-full bg-[#8B4B9C] hover:bg-purple-800 text-white py-5 sm:py-6 px-4 rounded-2xl text-xl sm:text-3xl font-black shadow-xl transition-all transform hover:scale-105 active:scale-95 uppercase tracking-tighter flex items-center justify-center gap-3">
                  <span className="animate-bounce flex-shrink-0">🔥</span><span className="leading-tight">{CONTENT.pricing.cta.replace(/🔥/g, '').trim()}</span><span className="animate-bounce flex-shrink-0">🔥</span>
                </button>
                <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">🛡️ Compra 100% segura · 7 días de garantía total · Acceso inmediato</p>
                <p className="text-[10px] sm:text-xs text-[#8B4B9C] font-bold uppercase tracking-widest flex items-center justify-center gap-2">🔓 Pago único · Sin suscripción · Sin cobros mensuales</p>
              </div>
              <div className="mt-10 sm:mt-16 space-y-10 sm:space-y-12">
                <div className="bg-white border-2 border-purple-200 rounded-3xl p-6 sm:p-10 max-w-2xl mx-auto shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none"><div className="bg-green-500 text-white text-[9px] font-bold py-1.5 w-[150%] absolute top-5 -right-[30%] rotate-45 shadow-lg uppercase tracking-widest text-center">Garantizado</div></div>
                  <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                    <div className="bg-green-50 p-4 rounded-full border-2 border-green-100 shadow-inner flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-14 sm:w-14 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <div className="text-center sm:text-left space-y-2">
                      <h4 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight uppercase tracking-tight">{CONTENT.pricing.guarantee}</h4>
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed max-w-md mx-auto sm:mx-0">Si en los próximos 7 días no sentís ninguna emoción, ninguna claridad, ningún alivio interior... te devolvemos el <strong>100% de tu dinero</strong> de inmediato. <em>Sin preguntas. Sin trámites.</em></p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">🔒 PROCESO DE PAGO 100% SEGURO</p>
                  <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10 px-4 py-4">
                    <img src="https://i.imgur.com/y6PSzBu.jpeg" className="h-12 sm:h-16 object-contain mix-blend-multiply" alt="Visa" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-7 sm:h-10 object-contain" alt="Mastercard" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-5 sm:h-8 object-contain" alt="Paypal" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg" className="h-7 sm:h-10 object-contain" alt="Apple Pay" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-12 uppercase tracking-tight">❓ PREGUNTAS FRECUENTES</h2>
          <div className="space-y-3 sm:space-y-4">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:border-purple-200 transition">
                <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full text-left p-5 flex justify-between items-center hover:bg-gray-50 transition">
                  <span className="font-bold text-gray-800 text-sm sm:text-base pr-4 leading-snug">{faq.question}</span>
                  <span className={`text-[#8B4B9C] text-2xl transition-transform duration-300 ${openFaq === idx ? 'rotate-45' : ''}`}>+</span>
                </button>
                <div className={`transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                  <div className="p-5 pt-0 text-gray-600 border-t border-gray-50 text-sm sm:text-base leading-relaxed">{faq.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 bg-white text-center">
        <div className="container mx-auto px-6 max-w-4xl space-y-8 sm:space-y-10">
          <h2 className="text-3xl sm:text-4xl font-bold italic text-gray-800 leading-tight px-2">{CONTENT.closing.imagine}</h2>
          <div className="space-y-6 text-base sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            {CONTENT.closing.points.map((point, idx) => (<p key={idx} className={idx === CONTENT.closing.points.length - 1 ? "font-bold text-gray-900" : ""}>{point}</p>))}
          </div>
          <div className="h-1 w-24 sm:w-32 bg-[#E0C4C3] mx-auto"></div>
          <p className="text-xl sm:text-2xl font-bold text-[#8B4B9C] px-4 leading-snug">{CONTENT.closing.reality}</p>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-t from-purple-900 to-[#8B4B9C] text-white text-center">
        <div className="container mx-auto px-6 max-w-4xl space-y-8 sm:space-y-10">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none px-4">{CONTENT.closing.finalCall}</h2>
          <p className="text-lg sm:text-xl opacity-90 max-w-2xl mx-auto italic px-4 leading-relaxed">"{CONTENT.closing.finalSub}"</p>
          <div className="flex flex-col items-center gap-4 pt-4">
            <button onClick={handlePurchase} className="bg-[#E0C4C3] hover:bg-[#D1B2B1] text-gray-800 px-8 sm:px-12 py-5 sm:py-6 rounded-full font-black text-xl sm:text-2xl shadow-2xl transition duration-300 uppercase tracking-wide transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 w-fit">
              <span className="animate-bounce flex-shrink-0">🔥</span><span className="leading-tight">SÍ, QUIERO EMPEZAR MI SANACIÓN AHORA</span><span className="animate-bounce flex-shrink-0">🔥</span>
            </button>
            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs text-white/60 font-bold uppercase tracking-widest">Acceso inmediato · Descarga en 2 minutos</p>
              <p className="text-[10px] sm:text-xs text-white/40 font-bold uppercase tracking-widest">🛡️ Compra 100% segura · 7 días de garantía total · 🔓 Pago único sin suscripción</p>
            </div>
          </div>
          <div className="space-y-4 mt-12 sm:mt-16 border-t border-white/10 pt-10">
            <p className="text-purple-200 text-sm uppercase tracking-widest font-bold opacity-60">{CONTENT.closing.signOff}</p>
            <p className="font-bold text-3xl sm:text-4xl italic tracking-tight">{CONTENT.closing.mentorName}</p>
            <p className="text-xs sm:text-sm opacity-40 mt-8 max-w-md mx-auto">{CONTENT.closing.ps}</p>
          </div>
        </div>
      </section>

      <div className={`fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-4 transition-all duration-500 transform ${showStickyCta ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="container mx-auto max-w-3xl">
          <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-2 sm:p-3 flex items-center justify-between border border-purple-100">
            <div className="hidden sm:block ml-4">
              <p className="text-[10px] font-bold text-[#8B4B9C] uppercase tracking-tighter">Oferta de Lanzamiento · Pago único</p>
              <p className="text-sm font-black text-gray-800 truncate max-w-[150px]">Biodescodificación Femenina</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 flex-1 sm:flex-initial justify-between sm:justify-end w-full sm:w-auto px-2">
              <div className="text-left sm:text-right leading-none">
                <p className="text-[10px] text-gray-400 line-through mb-1">$47 USD</p>
                <div className="flex items-baseline gap-1"><span className="text-xs font-bold text-[#8B4B9C]">$</span><span className="text-xl sm:text-2xl font-black text-[#8B4B9C]">6.97</span></div>
                <p className="text-[9px] text-green-600 font-bold">Pago único · Sin suscripción</p>
              </div>
              <button onClick={handlePurchase} className="bg-[#8B4B9C] hover:bg-purple-800 text-white px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition transform hover:scale-105 active:scale-95 animate-pulse-subtle flex-1 sm:flex-initial text-center">¡ACCESO INMEDIATO! 🚀</button>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-12 text-center text-gray-400 text-[10px] sm:text-xs border-t border-gray-100 px-6">
        <div className="container mx-auto max-w-4xl space-y-4">
          <p className="font-bold text-gray-300 uppercase tracking-widest">Biodescodificación Femenina — El Código Secreto de Tu Cuerpo</p>
          <p>© {new Date().getFullYear()} Todos los derechos reservados.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-2 opacity-60">
            <a href="/gracias" className="text-[#8B4B9C] font-bold hover:underline transition">👁️ Ver Página de Gracias</a>
            <a href="#" className="hover:text-purple-600 transition">Políticas de Privacidad</a>
            <a href="#" className="hover:text-purple-600 transition">Términos y Condiciones</a>
            <a href="#" className="hover:text-purple-600 transition">Soporte</a>
          </div>
          <p className="mt-8 opacity-30 max-w-xs mx-auto text-[9px]">Este sitio no es parte del sitio web de Facebook o Facebook Inc.</p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-subtle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pulse-subtle { animation: pulse-subtle 2.5s infinite ease-in-out; }
        .animate-bounce-subtle { animation: bounce-subtle 3s infinite ease-in-out; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
};

export default Landing;
