import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Share, PlusSquare, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [installed, setInstalled] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if already running as standalone app (PWA)
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (navigator as any).standalone === true;
      return isStandaloneMedia || isIOSStandalone;
    };

    if (checkStandalone()) {
      setIsStandalone(true);
    }

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // 3. Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 4. Listen for appinstalled
    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setTimeout(() => {
        setIsStandalone(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Do not show if already running inside standalone app
  if (isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setInstalled(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.warn("PWA prompt error:", err);
        setShowGuideModal(true);
      }
    } else {
      // If no native prompt event (e.g. iOS or manual install required), show step-by-step modal guide
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {/* Floating Action Button / Banner */}
      <AnimatePresence>
        {!isDismissed ? (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-[1000] flex items-center gap-3 bg-slate-900/95 backdrop-blur-md text-white p-3 pr-4 rounded-2xl shadow-2xl border border-slate-700/60 max-w-[340px] sm:max-w-md group"
          >
            {/* App Icon / Logo */}
            <div className="relative shrink-0 w-11 h-11 bg-gradient-to-br from-indigo-500 to-primary rounded-xl flex items-center justify-center overflow-hidden border border-white/20 shadow-inner">
              <img 
                src="/logo_pwa.png" 
                alt="Stratis Logo" 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLElement).style.display = 'none';
                }} 
              />
              <Smartphone className="w-5 h-5 text-white absolute inset-0 m-auto hidden group-has-[img[style*='display: none']]:block" />
            </div>

            {/* Label & Description */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-tight text-white uppercase">
                  Stratis App
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase border border-emerald-500/30">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium truncate leading-tight mt-0.5">
                {installed ? "Aplicativo instalado!" : "Instale para acesso rápido e offline"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {installed ? (
                <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/40">
                  <Check className="w-3.5 h-3.5" />
                  <span>Pronto</span>
                </div>
              ) : (
                <button
                  onClick={handleInstallClick}
                  className="bg-primary hover:bg-primary/90 active:scale-95 text-white text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-primary/30 transition-all border border-white/10 shrink-0"
                >
                  <Download className="w-3.5 h-3.5 animate-bounce" />
                  <span>Instalar</span>
                </button>
              )}

              {/* Close / Minimize Button */}
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Minimizar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          /* Minimized Floating Trigger Button */
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setIsDismissed(false)}
            className="fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-[1000] w-12 h-12 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700/80 flex items-center justify-center hover:scale-105 active:scale-95 transition-all group"
            title="Instalar Stratis App"
          >
            <div className="relative">
              <Download className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Manual Install Instruction Modal (iOS & Browser Fallback) */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 text-slate-800 relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
                    <Smartphone className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-base">
                      Instalar Stratis Planner
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Adicione à sua tela inicial sem utilizar lojas de apps
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Instructions body */}
              {isIOS ? (
                <div className="space-y-3 text-xs text-slate-600">
                  <p className="font-bold text-slate-800">
                    No iPhone ou iPad (Safari):
                  </p>
                  <ol className="space-y-2.5 pl-1">
                    <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-black bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Toque no botão <strong>Compartilhar</strong> <Share className="w-3.5 h-3.5 inline text-indigo-600 mx-0.5" /> na barra inferior do navegador Safari.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-black bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Role a lista para baixo e selecione <strong>"Adicionar à Tela de Início"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-indigo-600 mx-0.5" />.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-black bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Toque em <strong>Adicionar</strong> no canto superior direito para confirmar.
                      </span>
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-slate-600">
                  <p className="font-bold text-slate-800">
                    No Chrome, Edge ou Android:
                  </p>
                  <ol className="space-y-2.5 pl-1">
                    <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-black bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Clique no ícone de menu (três pontos <strong>⋮</strong>) no canto superior do navegador.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-black bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Selecione a opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                      </span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Benefits badge */}
              <div className="bg-indigo-50/80 border border-indigo-100 p-3 rounded-2xl flex items-center gap-2.5 text-indigo-900 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Funciona em tela cheia como app nativo e com carregamento instantâneo.</span>
              </div>

              {/* Footer action */}
              <div className="pt-2">
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-md"
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
