import React, { useState, useEffect } from 'react';
import { Shield, X, ArrowRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already given consent
    const consent = localStorage.getItem('stratis_cookie_consent');
    if (!consent) {
      // Show banner after a tiny delay for high-end aesthetic feel
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('stratis_cookie_consent', 'true');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('stratis_cookie_consent', 'declined');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-[99999]"
        >
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-100/80 flex flex-col gap-4 relative overflow-hidden">
            {/* Visual background hint */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start gap-3.5 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary">Privacidade & Cookies</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                  Controle de Privacidade
                </h3>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Utilizamos cookies e tecnologias semelhantes para personalizar conteúdo, anúncios, fornecer recursos de mídia social e analisar nosso tráfego de acordo com nossa{' '}
                  <Link to="/privacidade" className="font-bold text-slate-700 hover:text-primary hover:underline inline-flex items-center gap-0.5">
                    Política de Privacidade <ExternalLink className="w-2.5 h-2.5" />
                  </Link>.
                </p>
              </div>
              <button 
                onClick={handleDecline} 
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-50 shrink-0"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2.5 justify-end relative z-10">
              <button
                onClick={handleDecline}
                className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
              >
                Recusar
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-primary/15 flex items-center gap-1.5"
              >
                Aceitar Cookies
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
