import React, { useState, useEffect, useRef } from 'react';
import { analyzeSymptom } from './services/geminiService';
import { COLORS, TESTIMONIALS, FAQS, STACK_ITEMS, CONTENT } from './constants';

const App: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [symptomInput, setSymptomInput] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const analysisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setShowStickyCta(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToOffer = () => document.getElementById('offer')?.scrollIntoView({ behavior: 'smooth' });

  const handleAnalyze = async () => {
    if (!symptomInput.trim()) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    const result = await analyzeSymptom(symptomInput);
    setAnalysis(result);
    setIsAnalyzing(false);
    setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const totalValue = STACK_ITEMS.reduce((acc, item) => acc + item.value, 0);
  const mainItems = STACK_ITEMS.filter(item => !item.isBonus);
  const bonusItems = STACK_ITEMS.filter(item => item.isBonus);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden font-sans">
      {/* 1. Header Alert Cream - AJUSTADO */}
      <div className="bg-[#E0C4C3] text-[#581C87] text-center py-2.5 px-4 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] animate-pulse border-b border-purple-200">
        {CONTENT.hero.upperAlert}
      </div>

      {/* 2. Hero Section - TÍTULO PRO */}
      <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-br from-purple-900 via-[#8B4B9C] to-purple-800 text-white">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left animate-fade-in">
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              Descubre el <span className="text-[#E0C4C3]">Mensaje Oculto</span> que tu Cuerpo te envía y <span className="italic text-[#E0C4C3]">Reconecta con tu Esencia</span>
            </h1>
            <p className="text-lg lg:text-xl opacity-90 font-light max-w-2xl mx-auto lg:mx-0">{CONTENT.hero.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button onClick={scrollToOffer} className="bg-[#E0C4C3] hover:bg-white text-[#581C87] px-10 py-5 rounded-full font-black text-xl shadow-2xl transition transform hover:scale-105 active:scale-95 uppercase">
                {CONTENT.hero.cta}
              </button>
            </div>
            <p className="text-xs sm:text-sm italic opacity-75">{CONTENT.hero.footer}</p>
          </div>
          <div className="relative group max-w-md mx-auto lg:max-w-none">
            <div className="absolute -inset-4 bg-white/10 rounded-2xl blur-2xl group-hover:bg-white/20 transition duration-500"></div>
            <img src={CONTENT.hero.heroImage} className="relative rounded-3xl shadow-2xl w-full aspect-square object-cover border-4 border-white/20" />
          </div>
        </div>
      </section>

      {/* 3. Pain Section - Marca de Agua */}
      <section className="py-20 bg-gray-50 bg-watermark text-center px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">{CONTENT.pain.question}</h2>
          <p className="text-xl text-gray-600 italic leading-relaxed">"{CONTENT.pain.quote}"</p>
          <div className="h-1.5 w-24 bg-[#8B4B9C] mx-auto rounded-full"></div>
          <p className="text-2xl font-bold text-gray-900 leading-snug">{CONTENT.pain.statement}</p>
          <p className="text-gray-700 leading-relaxed text-lg">{CONTENT.pain.description}</p>
        </div>
      </section>

      {/* 4. Analyzer Tool */}
      <section id="analyzer" className="py-16 bg-purple-50 px-4">
        <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-xl border border-purple-100 max-w-4xl mx-auto text-center">
          <span className="bg-purple-100 text-[#8B4B9C] px-4 py-1 rounded-full text-xs font-bold uppercase mb-4 inline-block tracking-widest">Herramienta Gratuita</span>
          <h2 className="text-3xl font-bold mb-6">{CONTENT.analyzer.title}</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" value={symptomInput} onChange={(e) => setSymptomInput(e.target.value)} placeholder={CONTENT.analyzer.placeholder} className="flex-1 px-8 py-5 rounded-full border-2 border-purple-50 focus:border-[#8B4B9C] outline-none text-lg shadow-inner" />
            <button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-[#8B4B9C] text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-purple-800 shadow-lg active:scale-95 transition-all">
              {isAnalyzing ? "Analizando..." : "Consultar"}
            </button>
          </div>
          {analysis && <div ref={analysisRef} className="mt-8 p-8 bg-purple-50 rounded-3xl border-l-8 border-[#8B4B9C] italic text-left text-gray-800 text-lg shadow-sm animate-fade-in">"{analysis}"</div>}
        </div>
      </section>

      {/* 5. Benefits Section */}
      <section className="py-20 bg-[#8B4B9C] text-white px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-5xl font-bold">{CONTENT.benefits.title}</h2>
            <div className="h-1 w-24 bg-[#E0C4C3] mx-auto"></div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {CONTENT.benefits.items.map((benefit, idx) => (
              <div key={idx} className="bg-white/10 p-8 rounded-3xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition group">
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">{benefit.icon}</div>
                <h3 className="text-2xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-purple-100 leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* 6. Testimonials - Marca de agua */}
      <section className="py-24 bg-white bg-watermark px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16 text-gray-900 px-4">Miles de mujeres ya han transformado sus vidas</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="bg-gray-50/90 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full">
                <div className="text-[#E0C4C3] text-xl mb-4">★★★★★</div>
                <p className="text-gray-700 italic mb-8 text-lg flex-1 leading-relaxed">"{t.text}"</p>
                <div className="font-bold text-[#8B4B9C] text-lg mt-auto">{t.name}, {t.age} años</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Objeciones SÍ/NO */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
            <div className="bg-white p-8 rounded-[2rem] border-t-8 border-red-400 shadow-xl">
              <h3 className="text-xl font-black text-red-500 mb-6 uppercase tracking-tighter">❌ Este sistema NO es para ti si...</h3>
              <ul className="space-y-4 text-gray-600 font-medium">
                <li>• Buscas soluciones mágicas sin compromiso</li>
                <li>• No estás dispuesta a dedicar 15-20 min diarios</li>
                <li>• Prefieres quedarte en tu zona de confort</li>
                <li>• No tienes apertura al autoconocimiento</li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border-t-8 border-green-400 shadow-xl">
              <h3 className="text-xl font-black text-green-500 mb-6 uppercase tracking-tighter">✅ Este sistema SÍ es para ti si:</h3>
              <ul className="space-y-4 text-gray-600 font-medium">
                <li>• Estás lista para sanar desde la raíz</li>
                <li>• Quieres reconectar con tu esencia femenina</li>
                <li>• Buscas transformación real y duradera</li>
                <li>• Deseas entender el lenguaje de tu cuerpo</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Offer Stack - LIBROS PRO Y BONOS RECUPERADOS */}
      <section id="offer" className="py-24 bg-white px-4">
        <div className="bg-purple-50 p-8 sm:p-16 rounded-[3rem] sm:rounded-[4rem] shadow-2xl border-2 border-purple-100 max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-[#8B4B9C] font-black uppercase tracking-[0.3em] mb-4 text-sm">Oferta de Lanzamiento</p>
            <h2 className="text-4xl sm:text-6xl font-bold text-gray-900">{CONTENT.stack.title}</h2>
          </div>
          
          <div className="space-y-24">
            {/* PARTE 1: Entregables Principales */}
            <div className="space-y-12">
              <h3 className="text-3xl font-bold text-[#8B4B9C] text-center border-b-4 border-[#E0C4C3] inline-block relative left-1/2 -translate-x-1/2 pb-2 uppercase tracking-tight">EL SISTEMA COMPLETO</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {mainItems.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-purple-100 flex flex-col group hover:-translate-y-2 transition-all duration-300">
                    <div className="relative aspect-[4/3] flex items-center justify-center p-8 bg-transparent">
                      <img src={item.image} className="w-full h-full object-contain" style={{ mixBlendMode: 'multiply', maskImage: 'radial-gradient(circle, black 40%, transparent 95%)', WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 95%)' }} />
                      <div className="absolute top-4 right-4 bg-[#8B4B9C] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-sm">Incluido</div>
                    </div>
                    <div className="p-6 border-t border-gray-50 flex-1 text-center bg-white">
                      <h4 className="font-bold text-gray-800 text-lg leading-tight">📖 {item.title}</h4>
                      <div className="mt-4 flex justify-between items-center opacity-60">
                        <span className="text-xs line-through font-bold">VALOR: ${item.value}</span>
                        <span className="text-xs font-black text-[#8B4B9C]">HOY: $0.00</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PARTE 2: Bonos Gratuitos */}
            <div className="space-y-12">
              <h3 className="text-3xl font-bold text-[#8B4B9C] text-center border-b-4 border-yellow-400 inline-block relative left-1/2 -translate-x-1/2 pb-2 uppercase tracking-tight">Regalos Exclusivos (Bonos)</h3>
              <div className="grid sm:grid-cols-2 gap-10 max-w-4xl mx-auto">
                {bonusItems.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-[2rem] overflow-hidden shadow-lg border-2 border-yellow-100 flex flex-col group hover:-translate-y-2 transition-all duration-300">
                    <div className="relative aspect-[4/3] flex items-center justify-center p-10 bg-transparent">
                      <img src={item.image} className="w-full h-full object-contain" style={{ mixBlendMode: 'multiply', maskImage: 'radial-gradient(circle, black 40%, transparent 95%)', WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 95%)' }} />
                      <div className="absolute top-4 right-4 bg-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-sm">¡Regalo!</div>
                    </div>
                    <div className="p-6 border-t border-gray-50 flex-1 text-center bg-white">
                      <h4 className="font-bold text-purple-700 text-lg leading-tight">🎁 {item.title}</h4>
                      <p className="text-green-600 font-black text-sm mt-3 uppercase tracking-widest italic">VALOR: ${item.value} USD - REGALO</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Precio y Garantía */}
          <div className="mt-28 text-center space-y-12">
            <div className="space-y-2">
              <p className="text-gray-400 line-through text-2xl font-medium tracking-tight">Valor Total: ${totalValue}+ USD</p>
              <div className="text-8xl font-black text-[#8B4B9C] animate-pulse tracking-tighter flex items-center justify-center">
                <span className="text-4xl mr-1">$</span>6.97<span className="text-2xl ml-2 uppercase">USD</span>
              </div>
              <p className="text-[#8B4B9C] font-black tracking-[0.2em] text-sm mt-4 uppercase">Precio de lanzamiento por tiempo limitado</p>
            </div>
            <button onClick={scrollToOffer} className="w-full max-w-2xl mx-auto bg-[#8B4B9C] hover:bg-purple-800 text-white py-8 px-10 rounded-[2.5rem] font-black text-2xl sm:text-4xl shadow-2xl transition transform hover:scale-105 active:scale-95 uppercase leading-none flex items-center justify-center gap-4">
              <span>🔥</span> ¡RECLAMAR TODO AHORA! <span>🔥</span>
            </button>
            <div className="bg-white border-2 border-purple-100 rounded-[2.5rem] p-8 sm:p-12 max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-10 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-6 py-1 rotate-45 translate-x-6 translate-y-4 font-bold uppercase">Garantizado</div>
              <div className="bg-green-50 p-6 rounded-full border-2 border-green-100 flex-shrink-0">
                <svg className="w-14 h-14 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div className="text-center sm:text-left">
                <h4 className="text-2xl font-black text-gray-900 uppercase mb-2">Garantía de Transformación 7 Días</h4>
                <p className="text-gray-600 leading-relaxed italic text-lg">"Si en 7 días no sientes que este sistema es para ti, te devuelvo el 100% de tu dinero de inmediato. Sin preguntas."</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-10 opacity-40 grayscale py-10">
              <img src="https://i.imgur.com/y6PSzBu.jpeg" className="h-14 object-contain mix-blend-multiply" alt="Visa" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-10 object-contain" alt="Mastercard" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-8 object-contain" alt="Paypal" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg" className="h-10 object-contain" alt="Apple Pay" />
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ & Closing - Marca de agua */}
      <section className="py-24 bg-gray-50 bg-watermark px-6">
        <div className="max-w-4xl mx-auto space-y-28">
          <div className="space-y-12">
            <h2 className="text-3xl font-black text-center uppercase tracking-tighter">❓ Preguntas Frecuentes</h2>
            <div className="space-y-4 max-w-3xl mx-auto">
              {FAQS.map((faq, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:border-purple-200 transition">
                  <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full text-left p-7 flex justify-between items-center hover:bg-gray-50 transition">
                    <span className="font-bold text-gray-800 text-lg leading-tight pr-4">{faq.question}</span>
                    <span className={`text-[#8B4B9C] text-3xl transition-transform duration-300 ${openFaq === idx ? 'rotate-45' : ''}`}>+</span>
                  </button>
                  <div className={`transition-all duration-300 ${openFaq === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                    <div className="p-7 pt-0 text-gray-600 text-lg leading-relaxed border-t border-gray-50">{faq.answer}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center space-y-12">
            <h2 className="text-4xl sm:text-5xl font-display italic text-gray-800 leading-tight">"Imagínate dentro de 30 días..."</h2>
            <div className="grid gap-8 text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              <p>Despertarte sintiéndote en paz contigo misma, sabiendo que tu cuerpo ya no es un misterio.</p>
              <p>Entendiendo cada señal que te envía, transformando el dolor en sabiduría pura.</p>
              <p className="font-bold text-[#8B4B9C] text-2xl mt-4">Esto no es un sueño. Es tu nueva realidad esperándote.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Final Call & Footer */}
      <section className="py-32 bg-gradient-to-t from-purple-900 to-[#8B4B9C] text-white text-center px-6">
        <h2 className="text-5xl sm:text-8xl font-black uppercase mb-10 tracking-tighter leading-none">EL MOMENTO ES HOY</h2>
        <p className="text-2xl italic opacity-80 mb-16 max-w-3xl mx-auto leading-relaxed">"Tu alma te ha guiado hasta aquí por algo. No dejes pasar la señal que tu cuerpo lleva años intentando darte."</p>
        <button onClick={scrollToOffer} className="bg-[#E0C4C3] hover:bg-white text-[#581C87] px-12 py-8 rounded-full font-black text-2xl sm:text-4xl shadow-2xl transition transform hover:scale-105 active:scale-95 uppercase tracking-tighter">¡SÍ, QUIERO EMPEZAR YA! 🔥</button>
        <div className="mt-32 space-y-8 pt-16 border-t border-white/10 opacity-50">
           <p className="font-bold text-2xl italic opacity-80">Con amor y luz, Tu Mentora</p>
           <p className="text-sm">© {new Date().getFullYear()} El Código Secreto de tu Cuerpo. Todos los derechos reservados.</p>
           <p className="text-[10px] max-w-md mx-auto leading-relaxed">Este sitio no es parte del sitio web de Facebook o Facebook Inc. Además, este sitio NO está respaldado por Facebook de ninguna manera. FACEBOOK es una marca registrada de FACEBOOK, Inc.</p>
        </div>
      </section>

      {/* 11. Cápsula Flotante (Sticky CTA) */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-4 transition-all duration-500 transform ${showStickyCta ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="container mx-auto max-w-3xl">
          <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-[1.8rem] p-3.5 flex items-center justify-between border-2 border-[#E0C4C3]">
            <div className="hidden sm:block ml-4 text-left">
              <p className="text-[10px] font-black text-[#8B4B9C] uppercase tracking-widest leading-none mb-1">Oferta Exclusiva</p>
              <p className="text-sm font-black text-gray-800 leading-none">El Código Secreto de Tu Cuerpo</p>
            </div>
            <div className="flex items-center gap-5 flex-1 sm:justify-end px-2 justify-between">
              <div className="text-left sm:text-right leading-none">
                <p className="text-[10px] text-gray-400 line-through mb-1 font-bold tracking-tighter">$47 USD</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-[#8B4B9C]">$</span>
                  <span className="text-2xl font-black text-[#8B4B9C]">6.97</span>
                </div>
              </div>
              <button onClick={scrollToOffer} className="bg-[#8B4B9C] text-white px-7 py-4 rounded-[1rem] font-black text-xs uppercase tracking-tighter shadow-lg hover:bg-purple-800 transition-all active:scale-95 animate-pulse-subtle">¡ACCESO YA! 🚀</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-subtle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pulse-subtle { animation: pulse-subtle 2s infinite ease-in-out; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
};

export default App;