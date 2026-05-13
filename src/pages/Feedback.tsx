import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Feedback() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState('');
  const [type, setType] = useState('sugestao');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-text-main uppercase tracking-tight flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-primary" />
          Feedback
        </h1>
        <p className="text-xs font-bold text-text-sub uppercase tracking-wider">
          Ajude-nos a melhorar. Envie sua sugestão ou reporte um erro.
        </p>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-8">
          {success ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center text-center py-10 space-y-4"
            >
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-main mb-2">Feedback Enviado!</h3>
                <p className="text-sm text-text-sub">Muito obrigado por contribuir com nossa plataforma.</p>
              </div>
              <button 
                onClick={() => setSuccess(false)}
                className="mt-4 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-text-main font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
              >
                Enviar Outro
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Tipo de Feedback</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-50 border border-border rounded-2xl py-4 px-4 text-sm text-text-main font-medium focus:bg-white focus:border-primary/50 outline-none transition-all appearance-none"
                >
                  <option value="sugestao">Ideia / Sugestão</option>
                  <option value="erro">Reportar Erro (Bug)</option>
                  <option value="elogio">Elogio</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Sua Mensagem</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  required
                  placeholder="Escreva aqui..."
                  className="w-full h-40 bg-slate-50 border border-border rounded-2xl py-4 px-4 text-sm text-text-main focus:bg-white focus:border-primary/50 outline-none transition-all resize-none placeholder:text-text-sub/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !feedback.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest py-4 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Enviando...' : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar Feedback
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}
