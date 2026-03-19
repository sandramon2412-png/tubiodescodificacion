import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Smartphone, Key, ExternalLink, MessageCircle, ArrowRight } from 'lucide-react';
import { COLORS } from './constants';

const ThankYou: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const appUrl = "https://codigo-cuerpo.vercel.app";
  const accessCode = "BIODESCODIFICA-2025";

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white font-sans selection:bg-[#8B4B9C]/20">
      <header className="py-8 text-center">
        <div className="container mx-auto px-6">
          <h1 className="text-2xl font-black text-[#8B4B9C] uppercase tracking-tighter">
            El Código Secreto de Tu Cuerpo
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-6 max-w-3xl pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-purple-100"
        >
          <div className="bg-[#8B4B9C] py-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
            </div>
            
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              className="relative z-10 inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4"
            >
              <CheckCircle className="w-12 h-12 text-[#8B4B9C]" />
            </motion.div>
            
            <h2 className="relative z-10 text-3xl sm:text-4xl font-black uppercase tracking-tight px-4">
              ¡Bienvenida a tu Transformación!
            </h2>
            <p className="relative z-10 text-purple-50 font-medium mt-2 px-6">
              Tu pago ha sido procesado con éxito. Tu alma te ha traído hasta aquí.
            </p>
          </div>

          <div className="p-4 sm:p-12 space-y-10">
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-[#8B4B9C]">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">PASO 1: Accede a tu App "CÓDIGO CUERPO"</h3>
              </div>
              
              <div className="bg-purple-50 rounded-3xl p-4 sm:p-8 border border-purple-100 space-y-6">
                <p className="text-gray-600 leading-relaxed">
                  La app es tu compañera diaria de sanación. Allí encontrarás el mapa corporal interactivo, el diario emocional y todos los recursos del sistema.
                </p>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-4 sm:p-6 border border-purple-100 flex flex-col items-center text-center gap-6">
                    <div className="w-full">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Key className="w-4 h-4 text-[#8B4B9C]" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Tu Código de Acceso</p>
                      </div>
                      <div className="bg-purple-50/50 rounded-xl py-4 px-2 border border-dashed border-purple-200">
                        <p className="text-[11px] sm:text-xl font-black text-[#8B4B9C] tracking-tighter sm:tracking-widest uppercase break-words">
                          {accessCode}
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        const textArea = document.createElement("textarea");
                        textArea.value = accessCode;
                        document.body.appendChild(textArea);
                        textArea.select();
                        try {
                          document.execCommand('copy');
                          alert("¡Código copiado al portapapeles!");
                        } catch (err) {
                          console.error('Fallback: Oops, unable to copy', err);
                        }
                        document.body.removeChild(textArea);
                      }}
                      className="bg-purple-100 hover:bg-purple-200 text-[#8B4B9C] px-8 py-3 rounded-xl font-bold text-xs transition-all uppercase tracking-widest flex items-center gap-2 active:scale-95"
                    >
                      Copiar Código
                    </button>
                  </div>

                  <a 
                    href={appUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#8B4B9C] hover:bg-purple-800 text-white py-5 rounded-2xl font-black text-lg shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 uppercase tracking-tighter"
                  >
                    Abrir App Ahora
                    <ExternalLink className="w-5 h-5" />
                  </a>
                  
                  {/* Instrucciones de instalación */}
                  <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-4">
                    <p className="text-sm font-black text-[#8B4B9C] text-center uppercase tracking-widest">
                      📲 Cómo instalarla en tu celular
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl p-4 border border-purple-100">
                        <p className="text-xs font-black text-[#8B4B9C] mb-2">🍎 iPhone (Safari)</p>
                        <ol className="text-xs text-gray-600 space-y-1 leading-relaxed">
                          <li>1. Abre el link en <strong>Safari</strong></li>
                          <li>2. Toca el ícono de compartir <strong>⬆️</strong></li>
                          <li>3. Selecciona <strong>"Añadir a pantalla de inicio"</strong></li>
                          <li>4. Toca <strong>"Añadir"</strong> — ¡listo!</li>
                        </ol>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-purple-100">
                        <p className="text-xs font-black text-[#8B4B9C] mb-2">🤖 Android (Chrome)</p>
                        <ol className="text-xs text-gray-600 space-y-1 leading-relaxed">
                          <li>1. Abre el link en <strong>Chrome</strong></li>
                          <li>2. Toca los <strong>tres puntitos ⋮</strong> arriba</li>
                          <li>3. Selecciona <strong>"Añadir a pantalla de inicio"</strong></li>
                          <li>4. Confirma — ¡listo!</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-[#8B4B9C]">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">PASO 2: Únete a la Comunidad</h3>
              </div>
              
              <div className="bg-purple-50 rounded-3xl p-6 sm:p-8 border border-purple-100 flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-1 space-y-2">
                  <p className="text-gray-700 font-bold">Grupo Exclusivo de Mujeres Conscientes</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    No camines sola. Únete a nuestro grupo privado de WhatsApp/Telegram para recibir apoyo, compartir tus procesos y conectar con otras mujeres.
                  </p>
                </div>
                <a
                  href="https://t.me/+VCvHS7JyDYRkYTYx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#8B4B9C] hover:bg-purple-800 text-white px-8 py-4 rounded-2xl font-bold shadow-lg transition transform hover:scale-105 active:scale-95 whitespace-nowrap flex items-center gap-2"
                >
                  Unirme al Grupo
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </section>

            <div className="pt-8 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                ¿Tienes alguna duda con tu acceso? Escríbenos a:
              </p>
              <p className="font-bold text-[#8B4B9C] mt-1">soporte@codigocuerpo.com</p>
              <p className="text-[10px] text-gray-400 mt-6 uppercase tracking-[0.2em]">
                Revisa tu email, te hemos enviado los detalles de tu compra.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="mt-12 text-center">
          <a href="/" className="text-gray-400 hover:text-[#8B4B9C] transition text-sm font-medium">
            Volver a la página principal
          </a>
        </div>
      </main>

      <footer className="py-12 text-center text-gray-400 text-[10px] border-t border-gray-100 px-6">
        <p>© {new Date().getFullYear()} El Código Secreto de Tu Cuerpo. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default ThankYou;
