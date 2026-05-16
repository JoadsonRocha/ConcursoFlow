import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, CheckCircle2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export default function ProModal({ isOpen, onClose, featureName }: ProModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const features = [
    'Múltiplos editais simultâneos',
    'Importação automática via PDF',
    'Mesclar disciplinas entre editais',
    'Geração ilimitada de cronogramas'
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm" 
            onClick={onClose}
          />
            <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }} 
            className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col"
          >
            {/* Top Half: Gradient */}
            <div className="bg-gradient-to-br from-indigo-700 to-indigo-500 p-8 sm:p-10 text-white relative">
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-20"
              >
                <X size={16} />
              </button>

              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-white" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white leading-tight mb-3">
                Desbloqueie o PRO
              </h2>
              <p className="text-indigo-100 text-sm sm:text-base font-medium leading-relaxed">
                {featureName ? (
                  <>A funcionalidade <strong className="text-white font-bold">{featureName}</strong> é exclusiva do plano PRO.</>
                ) : (
                  <>Ative o plano PRO para ter acesso a funcionalidades avançadas e exclusivas.</>
                )}
              </p>
            </div>

            {/* Bottom Half: Content */}
            <div className="p-8 sm:p-10 bg-white flex flex-col items-center">
              <div className="space-y-4 w-full mb-8">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="text-indigo-600 w-5 h-5 shrink-0" />
                    <span className="text-sm sm:text-base font-bold text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => {
                  onClose();
                  navigate('/planos');
                }}
                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-wider transition-colors shadow-lg shadow-indigo-600/30"
              >
                Conhecer Planos
              </button>

              <p className="mt-6 text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] text-slate-400 text-center">
                Ative o PRO na aba &lt;PREFERÊNCIAS&gt; para testar.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
