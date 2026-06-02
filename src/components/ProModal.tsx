import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, CheckCircle2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export default function ProModal({ isOpen, onClose, featureName }: ProModalProps) {
  const navigate = useNavigate();
  const { planType } = useAuth();

  if (!isOpen) return null;

  const features = [
    'Edital Verticalizado Inteligente',
    'Análise de Pareto (Recorrência)',
    'AI Flashcards Ilimitados',
    'Mapas Mentais Dinâmicos',
    'Mentor Stratis (AI Coach 24/7)',
    'Grade de Similaridades',
    'Estatísticas Detalhadas',
    'Resumos & Microlearning',
    'Cronogramas até 12 Semanas',
    'Exportações completas em PDF'
  ];

  const getTargetPlan = () => {
    return 'PRO';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 select-none">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={onClose}
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 15 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 15 }} 
            className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-xl relative z-10 overflow-hidden flex flex-col"
          >
            {/* Top Half: Gradient Banner */}
            <div className="bg-gradient-to-br from-indigo-700 to-indigo-500 p-4 sm:p-5 text-white relative">
              <button 
                onClick={onClose} 
                className="absolute top-3 right-3 p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-20 cursor-pointer"
              >
                <X size={12} />
              </button>
              
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5 text-white fill-current" />
                </div>
                <h2 className="text-sm font-display font-black text-white leading-tight uppercase tracking-wide">
                  Potencial {getTargetPlan()}
                </h2>
              </div>

              <p className="text-indigo-100 text-[10px] font-semibold leading-normal">
                {featureName ? (
                  <>A funcionalidade <strong className="text-white font-black">{featureName}</strong> exige uma conta Premium {getTargetPlan()}.</>
                ) : (
                  <>Ative o plano {getTargetPlan()} para desbloquear ferramentas analíticas e IA avançada.</>
                )}
              </p>
            </div>

            {/* Bottom Half: Features & Actions */}
            <div className="p-4 sm:p-5 bg-white flex flex-col items-center">
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 w-full mb-4">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 className="text-emerald-500 w-3 h-3 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-700 leading-tight truncate">{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => {
                  onClose();
                  navigate('/planos');
                }}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider transition-colors shadow-sm cursor-pointer hover:scale-[1.01] active:scale-[0.99] mb-2"
              >
                Quero ser PRO
              </button>

              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-400 text-center">
                GARANTIA DE REEMBOLSO DE 7 DIAS • CANCELAMENTO EXPEDITO
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
