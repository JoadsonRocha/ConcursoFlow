import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, CheckCircle2, Heart, Smile } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface FeedbackModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function FeedbackModal({ isOpen: manualIsOpen, onClose }: FeedbackModalProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [type, setType] = useState('sugestao');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Auto trigger on login/load if not disabled
  useEffect(() => {
    if (manualIsOpen !== undefined) {
      setIsOpen(manualIsOpen);
      return;
    }

    if (user) {
      const hideModal = localStorage.getItem('hide_feedback_modal');
      if (hideModal !== 'true') {
        // Show after a short delay so the user sees the dashboard first
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setIsOpen(false);
    }
  }, [user, manualIsOpen]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hide_feedback_modal', 'true');
    }
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || !user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'feedbacks'), {
        userId: user.uid,
        userEmail: user.email,
        type,
        message: feedback,
        createdAt: serverTimestamp()
      });
      setSuccess(true);
      setFeedback('');
      
      // If submitted, let's auto-hide the modal in the future
      localStorage.setItem('hide_feedback_modal', 'true');
      
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        if (onClose) onClose();
      }, 3000);
    } catch (err) {
      console.error('Error sending feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-lg bg-white border border-border rounded-3xl overflow-hidden shadow-2xl z-10 p-6 md:p-8"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-text-sub hover:text-text-main transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {success ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center text-center py-8 space-y-4"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-text-main uppercase tracking-tight">Feedback Recebido!</h3>
                  <p className="text-sm text-text-sub leading-relaxed max-w-xs mx-auto">
                    Muito obrigado! Seu feedback nos ajuda diretamente a tornar o Stratis Planner ainda melhor para você.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-primary font-bold uppercase tracking-wider bg-primary/5 px-4 py-2 rounded-full animate-pulse">
                  <Smile className="w-4 h-4" />
                  <span>Fechando janela...</span>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4 pr-10">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg md:text-xl font-black text-text-main uppercase tracking-tight leading-tight">
                      Sua opinião importa! 🌟
                    </h2>
                    <p className="text-[10px] md:text-xs font-bold text-text-sub uppercase tracking-wider leading-relaxed">
                      Como está sendo sua experiência? Conte para nós!
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Type Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-sub uppercase tracking-widest ml-1">Tipo de Feedback</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'sugestao', label: '💡 Ideia / Sugestão' },
                        { id: 'erro', label: '🐛 Reportar Erro' },
                        { id: 'elogio', label: '❤️ Elogio' },
                        { id: 'outro', label: '✨ Outro' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setType(item.id)}
                          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border text-left ${
                            type === item.id
                              ? 'bg-primary/5 border-primary text-primary shadow-sm shadow-primary/5'
                              : 'bg-slate-50 hover:bg-slate-100 border-border text-text-main'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Message */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-sub uppercase tracking-widest ml-1">Sua mensagem</label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      required
                      placeholder="Diga-nos o que você gostou, o que podemos melhorar ou reporte algum problema..."
                      className="w-full h-32 bg-slate-50 border border-border rounded-2xl py-3 px-4 text-sm text-text-main focus:bg-white focus:border-primary/50 outline-none transition-all resize-none placeholder:text-text-sub/50 font-medium"
                    />
                  </div>

                  {/* Settings / Footer option */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={dontShowAgain}
                          onChange={(e) => setDontShowAgain(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          dontShowAgain 
                            ? 'bg-primary border-primary text-white shadow-sm' 
                            : 'border-border bg-slate-50 group-hover:border-primary/50'
                        }`}>
                          {dontShowAgain && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-text-sub uppercase tracking-wider select-none">
                        Não mostrar novamente
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !feedback.trim()}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Enviando...' : (
                      <>
                        <Send className="w-4 h-4" />
                        Enviar Feedback
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
