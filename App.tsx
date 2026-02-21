
import React, { useState, useEffect, useRef } from 'react';
import { analyzeSymptom } from './services/geminiService';
import { COLORS, TESTIMONIALS, FAQS, STACK_ITEMS, CONTENT } from './constants';
import { FAQItem, StackItem, Testimonial } from './types';

const App: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [symptomInput, setSymptomInput] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const analysisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA after scrolling down 600px (past hero)
      if (window.scrollY > 600) {
        setShowStickyCta(true);
      } else {
        setShowStickyCta(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToOffer = () => {
    document.getElementById('offer')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAnalyze = async () => {
    if (!symptomInput.trim()) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    const result = await analyzeSymptom(symptomInput);
    setAnalysis(result);
    setIsAnalyzing(false);
    
    setTimeout(() => {
      analysisRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const totalValue = STACK_ITEMS.reduce((acc, item) => acc + item.value, 0);
  const mainItems = STACK_ITEMS.filter(item => !item.isBonus);
  const bonusItems = STACK_ITEMS.filter(item => item.isBonus);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header Alert */}
      <div className="bg-red-600 text-white text-center py-2 px-4 text-xs sm:text-sm font-bold animate-pulse uppercase tracking-wide">
        {CONTENT.hero.upperAlert}
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-24 lg:pb-32 bg-gradient-to-br from-purple-900 via-[#8B4B9C] to-purple-800 text-white">
        <div className="container mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 sm:space-y-8 animate-fade-in text-center lg:text-left">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight animate-fade-in">
  Descubre el <span className="text-[#E0C4C3]">Mensaje Oculto</span> que tu Cuerpo te envía, Sana desde la Raíz y <span className="italic text-[#E0C4C3]">Reconecta con tu Esencia</span>
</h1>
            <p className="text-lg lg:text-xl opacity-90 font-light max-w-2xl mx-auto lg:mx-0">
              {CONTENT.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button 
                onClick={scrollToOffer}
                className="bg-[#E0C4C3] hover:bg-[#D1B2B1] text-gray-800 px-8 py-4 rounded-full font-bold text-lg shadow-xl transition transform hover:scale-105 active:scale-95"
              >
                {CONTENT.hero.cta}
              </button>
            </div>
            <p className="text-xs sm:text-sm italic opacity-75">{CONTENT.hero.footer}</p>
          </div>
          <div className="relative group max-w-md mx-auto lg:max-w-none">
            <div className="absolute -inset-4 bg-white/10 rounded-2xl blur-2xl group-hover:bg-white/20 transition duration-500"></div>
            <img 
              src={CONTENT.hero.heroImage} 
              alt="Tu Cuerpo Tiene Algo Que Decirte" 
              className="relative rounded-2xl shadow-2xl w-full object-cover aspect-square border-4 border-white/20"
            />
          </div>
        </div>
      </section>

      {/* Pain Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-3xl text-center space-y-6 sm:space-y-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
            {CONTENT.pain.question}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 italic leading-relaxed">
            "{CONTENT.pain.quote}"
          </p>
          <div className="h-1 w-20 bg-[#8B4B9C] mx-auto"></div>
          <p className="text-xl sm:text-2xl font-semibold text-gray-900 leading-snug">
            {CONTENT.pain.statement}
          </p>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
            {CONTENT.pain.description}
          </p>
        </div>
      </section>

      {/* Interactive Symptom Tool (Gemini Powered) */}
      <section id="analyzer" className="py-12 sm:py-16 bg-purple-50">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-lg border border-purple-100">
            <div className="text-center mb-8 flex flex-col items-center">
              <div className="w-fit mx-auto bg-purple-100 text-[#8B4B9C] px-4 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                {CONTENT.analyzer.tag}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mt-4">{CONTENT.analyzer.title}</h2>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">{CONTENT.analyzer.subtitle}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                placeholder={CONTENT.analyzer.placeholder}
                className="flex-1 px-6 py-4 rounded-full border-2 border-purple-100 focus:border-[#8B4B9C] outline-none text-sm sm:text-base transition-all"
              />
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="bg-[#8B4B9C] text-white px-8 py-4 rounded-full font-bold hover:bg-purple-800 transition disabled:opacity-50 whitespace-nowrap shadow-md active:scale-95"
              >
                {isAnalyzing ? CONTENT.analyzer.loading : CONTENT.analyzer.button}
              </button>
            </div>
            
            {analysis && (
              <div ref={analysisRef} className="mt-8 p-6 bg-purple-50 rounded-2xl border-l-4 border-[#8B4B9C] animate-fade-in">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm sm:text-base italic">"{analysis}"</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 bg-[#8B4B9C] text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 sm:mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">{CONTENT.benefits.title}</h2>
            <div className="h-1 w-24 bg-[#E0C4C3] mx-auto"></div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {CONTENT.benefits.items.map((benefit, idx) => (
              <div key={idx} className="bg-white/10 p-6 sm:p-8 rounded-2xl hover:bg-white/20 transition backdrop-blur-sm border border-white/10 group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{benefit.icon}</div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-purple-100 text-sm sm:text-base leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 px-4">Miles de mujeres ya han transformado sus vidas</h2>
            <p className="text-gray-500 mt-2 max-w-lg mx-auto italic">"Únete a la comunidad de mujeres conscientes que están sanando desde adentro hacia afuera."</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-2rem)] bg-gray-50 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
                <div className="flex text-[#E0C4C3] mb-4 text-sm">
                  {[...Array(t.rating)].map((_, i) => <span key={i}>★</span>)}
                </div>
                <p className="text-gray-700 italic mb-6 text-sm sm:text-base flex-1">"{t.text}"</p>
                <div className="font-bold text-[#8B4B9C] mt-auto text-sm sm:text-base">{t.name}, {t.age} años</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Objections */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border-t-4 border-red-400 shadow-sm">
              <h3 className="text-lg sm:text-xl font-bold text-red-500 mb-6 flex items-center gap-2 uppercase tracking-tight">
                ❌ Este sistema NO es para ti si...
              </h3>
              <ul className="space-y-4 text-gray-600 text-sm sm:text-base">
                <li>• Buscas soluciones mágicas sin compromiso personal</li>
                <li>• No estás dispuesta a dedicar 15-20 minutos diarios</li>
                <li>• Prefieres quedarte en zona de confort</li>
                <li>• No tienes apertura al autoconocimiento</li>
              </ul>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-2xl border-t-4 border-green-400 shadow-sm">
              <h3 className="text-lg sm:text-xl font-bold text-green-500 mb-6 flex items-center gap-2 uppercase tracking-tight">
                ✅ Este sistema SÍ es para ti si:
              </h3>
              <ul className="space-y-4 text-gray-600 text-sm sm:text-base">
                <li>• Estás lista para sanar desde la raíz</li>
                <li>• Quieres reconectar con tu esencia femenina</li>
                <li>• Buscas transformación real y duradera</li>
                <li>• Deseas entender el lenguaje de tu cuerpo</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Offer Stack - Grid of Product Cards */}
      <section id="offer" className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="bg-purple-50 p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-2xl relative border-2 border-purple-100">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{CONTENT.stack.title}</h2>
              <p className="text-purple-600 font-bold uppercase tracking-widest text-xs sm:text-sm">{CONTENT.stack.subtitle}</p>
            </div>
            
            <div className="space-y-16 sm:space-y-20">
              {/* Part 1: Main Product Deliverables */}
              <div>
                <div className="text-center mb-8 sm:mb-12">
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#8B4B9C] inline-block border-b-4 border-[#E0C4C3] pb-2">
                    {CONTENT.stack.mainTitle}
                  </h3>
                </div>
                <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
                  {mainItems.map((item, idx) => (
                    <div key={idx} className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-2rem)] bg-white rounded-2xl overflow-hidden flex flex-col group transition transform hover:-translate-y-1">
                      <div className="relative aspect-[4/3] w-full flex items-center justify-center bg-transparent!">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-full h-full object-contain p-10 transition duration-500 group-hover:scale-105"
                          style={{ mixBlendMode: 'multiply', maskImage: 'radial-gradient(circle, black 20%, transparent 75%)', WebkitMaskImage: 'radial-gradient(circle, black 20%, transparent 75%)' }}
                        />
                        <div className="absolute top-2 right-2 bg-[#8B4B9C] text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-md z-20 uppercase">INCLUIDO</div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <h4 className="font-bold text-gray-800 leading-tight mb-2 text-sm sm:text-base">📖 {item.title}</h4>
                        <div className="flex justify-between items-center pt-2 mt-auto border-t border-gray-50">
                          <span className="text-gray-400 text-[10px] font-bold line-through">VALOR: ${item.value} USD</span>
                          <span className="text-[#8B4B9C] text-[10px] font-black uppercase">HOY: $0.00</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Part 2: Bonus Deliverables */}
              <div>
                <div className="text-center mb-8 sm:mb-12">
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#8B4B9C] inline-block border-b-4 border-yellow-400 pb-2">
                    {CONTENT.stack.bonusTitle}
                  </h3>
                </div>
                <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
                  {bonusItems.map((item, idx) => (
                    <div key={idx} className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-2rem)] bg-white rounded-2xl overflow-hidden flex flex-col group transition transform hover:-translate-y-1">
                      <div className="relative aspect-[4/3] w-full flex items-center justify-center bg-transparent!">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-full h-full object-contain p-10 transition duration-500 group-hover:scale-105"
                          style={{ mixBlendMode: 'multiply', maskImage: 'radial-gradient(circle, black 20%, transparent 75%)', WebkitMaskImage: 'radial-gradient(circle, black 20%, transparent 75%)' }}
                        />
                        <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[9px] font-black px-2 py-1 rounded-full shadow-md z-20 uppercase">BONUS GRATIS</div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <h4 className="font-bold text-purple-700 leading-tight mb-2 text-sm sm:text-base">🎁 {item.title}</h4>
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

            {/* Final Pricing Block - MOBILE OPTIMIZED */}
            <div className="mt-16 sm:mt-24 border-t-2 border-dashed border-purple-200 pt-12 text-center space-y-8">
              <div className="space-y-1">
                <p className="text-gray-400 line-through text-lg sm:text-2xl font-medium tracking-tight">Valor Total: ${totalValue}+ USD</p>
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                   <span className="text-4xl sm:text-6xl font-black text-[#8B4B9C]">$</span>
                   <span className="text-7xl sm:text-9xl font-black text-[#8B4B9C] tracking-tighter animate-pulse">6.97</span>
                   <span className="text-xl sm:text-2xl font-black text-[#8B4B9C] self-start mt-2 sm:mt-4">USD</span>
                </div>
                <div className="w-fit mx-auto">
                  <p className="text-[#8B4B9C] font-black text-sm sm:text-lg uppercase tracking-widest px-4 text-center">{CONTENT.pricing.launchPriceLabel}</p>
                </div>
              </div>

              <div className="max-w-xl mx-auto space-y-6 px-2">
                <button 
                  onClick={scrollToOffer}
                  className="w-full bg-[#8B4B9C] hover:bg-purple-800 text-white py-5 sm:py-6 px-4 rounded-2xl text-xl sm:text-3xl font-black shadow-xl transition-all transform hover:scale-105 active:scale-95 uppercase tracking-tighter flex items-center justify-center text-center gap-3"
                >
                  <span className="animate-bounce flex-shrink-0">🔥</span>
                  <span className="leading-tight">{CONTENT.pricing.cta.replace(/🔥/g, '').replace(/"/g, '')}</span>
                  <span className="animate-bounce flex-shrink-0">🔥</span>
                </button>
                
                {/* Visual nudge specifically reorganized for mobile */}
                <div className="flex justify-center">
                  <div className="w-fit mx-auto bg-purple-100/80 backdrop-blur-sm border border-purple-200 px-6 py-3 rounded-2xl">
                      <p className="text-[#8B4B9C] font-bold italic text-xs sm:text-sm leading-tight text-center">
                          ☕ ¡Recibe todo el pack por menos de lo que cuesta un café!
                      </p>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Guarantee and Payment Trust Block - MOBILE OPTIMIZED */}
              <div className="mt-10 sm:mt-16 space-y-10 sm:space-y-12">
                {/* Visual Guarantee Badge - Better spacing for mobile */}
                <div className="bg-white sm:bg-white/60 backdrop-blur-sm border-2 border-purple-200 rounded-3xl p-6 sm:p-10 max-w-2xl mx-auto shadow-md relative overflow-hidden transition-all hover:border-[#8B4B9C]">
                  {/* Improved Ribbon for better visibility */}
                  <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none">
                    <div className="bg-green-500 text-white text-[9px] font-bold py-1.5 w-[150%] absolute top-5 -right-[30%] rotate-45 shadow-lg uppercase tracking-widest text-center">
                      Garantizado
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                    <div className="bg-green-50 p-4 rounded-full border-2 border-green-100 shadow-inner flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-14 sm:w-14 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="text-center sm:text-left space-y-2">
                      <h4 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight uppercase tracking-tight">{CONTENT.pricing.guarantee}</h4>
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed max-w-md mx-auto sm:mx-0">
                        Si en los próximos 7 días sientes que no es para ti, 
                        te devolvemos el <strong>100% de tu dinero</strong> de inmediato. 
                        <em> Sin preguntas y sin trámites. Tu paz mental es lo primero.</em>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Secure Payment Icons - Clean layout */}
                <div className="space-y-6">
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    PROCESO DE PAGO 100% SEGURO
                  </p>
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

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-12 uppercase tracking-tight">❓ PREGUNTAS FRECUENTES</h2>
          <div className="space-y-3 sm:space-y-4">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group transition hover:border-purple-200">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full text-left p-5 flex justify-between items-center hover:bg-gray-50 transition active:bg-gray-100"
                >
                  <span className="font-bold text-gray-800 text-sm sm:text-base pr-4 leading-snug">{faq.question}</span>
                  <span className={`text-[#8B4B9C] text-2xl transition-transform duration-300 ${openFaq === idx ? 'rotate-45' : ''}`}>+</span>
                </button>
                <div className={`transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                  <div className="p-5 pt-0 text-gray-600 border-t border-gray-50 text-sm sm:text-base leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing Emotional Section */}
      <section className="py-20 sm:py-24 bg-white text-center">
        <div className="container mx-auto px-6 max-w-4xl space-y-8 sm:space-y-10">
          <h2 className="text-3xl sm:text-4xl font-bold italic text-gray-800 leading-tight px-2">{CONTENT.closing.imagine}</h2>
          <div className="space-y-6 text-base sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            {CONTENT.closing.points.map((point, idx) => (
              <p key={idx} className={idx === CONTENT.closing.points.length - 1 ? "font-bold text-gray-900" : ""}>
                {point}
              </p>
            ))}
          </div>
          <div className="h-1 w-24 sm:w-32 bg-[#E0C4C3] mx-auto"></div>
          <p className="text-xl sm:text-2xl font-bold text-[#8B4B9C] px-4 leading-snug">{CONTENT.closing.reality}</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-t from-purple-900 to-[#8B4B9C] text-white text-center">
        <div className="container mx-auto px-6 max-w-4xl space-y-8 sm:space-y-10">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none px-4">{CONTENT.closing.finalCall}</h2>
          <p className="text-lg sm:text-xl opacity-90 max-w-2xl mx-auto italic px-4 leading-relaxed">
            "{CONTENT.closing.finalSub}"
          </p>
          <button 
            onClick={scrollToOffer}
            className="bg-[#E0C4C3] hover:bg-[#D1B2B1] text-gray-800 px-8 sm:px-12 py-5 sm:py-6 rounded-full font-black text-xl sm:text-2xl shadow-2xl transition duration-300 uppercase tracking-wide transform hover:scale-105 active:scale-95 flex items-center justify-center text-center gap-3 mx-auto"
          >
            <span className="animate-bounce flex-shrink-0">🔥</span>
            <span className="leading-tight">{CONTENT.closing.finalCta.replace(/🔥/g, '').trim()}</span>
            <span className="animate-bounce flex-shrink-0">🔥</span>
          </button>
          <div className="space-y-4 mt-12 sm:mt-16 border-t border-white/10 pt-10">
            <p className="text-purple-200 text-sm uppercase tracking-widest font-bold opacity-60">{CONTENT.closing.signOff}</p>
            <p className="font-bold text-3xl sm:text-4xl italic tracking-tight">{CONTENT.closing.mentorName}</p>
            <p className="text-xs sm:text-sm opacity-40 mt-8 max-w-md mx-auto">{CONTENT.closing.ps}</p>
          </div>
        </div>
      </section>

      {/* Floating Sticky CTA Bar - REFINED FOR MOBILE */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-4 transition-all duration-500 transform ${
          showStickyCta ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="container mx-auto max-w-3xl">
          <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-2 sm:p-3 flex items-center justify-between border border-purple-100">
            <div className="hidden sm:block ml-4">
              <p className="text-[10px] font-bold text-[#8B4B9C] uppercase tracking-tighter">Oferta de Lanzamiento</p>
              <p className="text-sm font-black text-gray-800 truncate max-w-[150px]">El Secreto de Tu Cuerpo</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 flex-1 sm:flex-initial justify-between sm:justify-end w-full sm:w-auto px-2">
              <div className="text-left sm:text-right leading-none">
                <p className="text-[10px] text-gray-400 line-through mb-1">$47 USD</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-xs font-bold text-[#8B4B9C]">$</span>
                    <span className="text-xl sm:text-2xl font-black text-[#8B4B9C]">6.97</span>
                </div>
              </div>
              <button 
                onClick={scrollToOffer}
                className="bg-[#8B4B9C] hover:bg-purple-800 text-white px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition transform hover:scale-105 active:scale-95 animate-pulse-subtle flex-1 sm:flex-initial text-center"
              >
                ¡ACCESO INMEDIATO! 🚀
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 text-center text-gray-400 text-[10px] sm:text-xs border-t border-gray-100 px-6">
        <div className="container mx-auto max-w-4xl space-y-4">
            <p className="font-bold text-gray-300 uppercase tracking-widest">El Código Secreto de Tu Cuerpo</p>
            <p>© {new Date().getFullYear()} Todos los derechos reservados.</p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-2 opacity-60">
              <a href="#" className="hover:text-purple-600 transition">Políticas de Privacidad</a>
              <a href="#" className="hover:text-purple-600 transition">Términos y Condiciones</a>
              <a href="#" className="hover:text-purple-600 transition">Soporte</a>
            </div>
            <p className="mt-8 opacity-30 max-w-xs mx-auto text-[9px]">Este sitio no es parte del sitio web de Facebook o Facebook Inc. Además, este sitio NO está respaldado por Facebook de ninguna manera. FACEBOOK es una marca registrada de FACEBOOK, Inc.</p>
        </div>
      </footer>

      {/* CSS Utilities */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2.5s infinite ease-in-out;
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
};
export default App;


