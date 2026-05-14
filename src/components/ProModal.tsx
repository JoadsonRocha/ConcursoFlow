import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, CheckCircle2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
}

export default function ProModal({ isOpen, onClose, featureName }: ProModalProps) {
  const { profile } = useAuth();
  
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm" 
            onClick={onClose}
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }} 
            className="w-full max-w-md bg-white border border-border rounded-2xl shadow-2xl relative z-10 overflow-hidden"
          >
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-black/5 rounded-full transition-colors z-20"
            >
              <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
            </button>
            
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-white/20">
                  <Zap className="w-6 h-6 text-indigo-100" />
                </div>
                <h3 className="font-display text-2xl font-bold tracking-tight mb-2">
                  Desbloqueie o PRO
                </h3>
                <p className="text-indigo-100/90 text-sm font-medium leading-relaxed">
                  A funcionalidade <strong className="text-white">{featureName}</strong> é exclusiva do plano PRO.
                </p>
              </div>
            </div>
            
            <div className="p-6 md:p-8 bg-white">
              <div className="space-y-4 mb-8">
                {[
                  'Múltiplos editais simultâneos',
                  'Importação automática via PDF',
                  'Mesclar disciplinas entre editais',
                  'Geração ilimitada de cronogramas'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span className="text-sm font-bold text-slate-600">{feature}</span>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={onClose}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5 active:translate-y-0"
              >
                Conhecer Planos
              </button>
              <p className="text-center text-[10px] font-bold text-text-sub uppercase tracking-wider mt-4">
                Ative o PRO na aba {`<Preferências>`} para testar.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
