import React, { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, Save, Share2, AlertCircle, Zap, Wand2, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateFlashcards, GeneratedFlashcard } from '../services/geminiService';

interface FlashcardCreatorProps {
  onClose: () => void;
  subjects: { id: string, name: string }[];
}

export default function FlashcardCreator({ onClose, subjects }: FlashcardCreatorProps) {
  const [mode, setMode] = useState<'manual' | 'ai'>('ai');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [description, setDescription] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [generatedCards, setGeneratedCards] = useState<GeneratedFlashcard[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleManualSave = async () => {
    if (!front || !back || !auth.currentUser) return;
    setLoading(true);
    try {
      const cardData = {
        front,
        back,
        description,
        ownerId: auth.currentUser.uid,
        ownerName: auth.currentUser.displayName || 'Estudante',
        isPublic,
        nextReview: serverTimestamp(),
        interval: 0,
        ease: 2.5,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'users', auth.currentUser.uid, 'flashcards'), cardData);
      if (isPublic) {
        await addDoc(collection(db, 'shared_flashcards'), cardData);
      }

      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error("Erro ao salvar card:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiTopic) return;
    setLoading(true);
    try {
      const cards = await generateFlashcards(aiTopic);
      setGeneratedCards(cards);
    } catch (error) {
      console.error("Erro na IA:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllGenerated = async () => {
    if (!auth.currentUser || generatedCards.length === 0) return;
    setLoading(true);
    try {
      const batch = generatedCards.map(card => {
        const data = {
          ...card,
          description,
          ownerId: auth.currentUser!.uid,
          ownerName: auth.currentUser!.displayName || 'Estudante',
          isPublic,
          nextReview: serverTimestamp(),
          interval: 0,
          ease: 2.5,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        return addDoc(collection(db, 'users', auth.currentUser!.uid, 'flashcards'), data);
      });

      if (isPublic) {
        const deckData = {
          title: aiTopic || description || 'Lote de Flashcards',
          description,
          cards: generatedCards,
          ownerId: auth.currentUser!.uid,
          ownerName: auth.currentUser!.displayName || 'Estudante',
          isPublic,
          likesCount: 0,
          clonesCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        batch.push(addDoc(collection(db, 'shared_decks'), deckData));
      }

      await Promise.all(batch);
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error("Erro ao salvar lote:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-border"
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="space-y-3">
            <h2 className="text-xl font-display font-bold text-text-main">Criar Flashcards</h2>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-border w-fit">
               <button 
                onClick={() => setMode('ai')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'ai' ? 'bg-white text-primary shadow-sm' : 'text-text-sub hover:text-text-main'}`}
               >
                 <Zap className="w-3 h-3" />
                 Gerar com IA
                 <span className="bg-primary/10 text-primary text-[8px] px-1.5 py-0.5 rounded-full ml-1">Recomendado</span>
               </button>
               <button 
                onClick={() => setMode('manual')}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'manual' ? 'bg-white text-primary shadow-sm' : 'text-text-sub hover:text-text-main'}`}
               >
                 Manual
               </button>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-text-sub" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {mode === 'manual' ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest ml-1">Frente</label>
                <textarea 
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="Ex: Qual o protocolo da camada de transporte que garante a entrega?"
                  className="w-full bg-slate-50 border border-border rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none h-24"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest ml-1">Verso</label>
                <textarea 
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="Ex: TCP (Transmission Control Protocol)"
                  className="w-full bg-slate-50 border border-border rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none h-24"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest ml-1">Descrição (Opcional)</label>
                <input 
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Artigo 5º da CF, Atos Administrativos..."
                  className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {!generatedCards.length ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest ml-1">Sobre o que vamos estudar?</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder="Ex: Noções de Direito Administrativo: Atos"
                        className="flex-1 bg-slate-50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                      <button 
                        onClick={handleAiGenerate}
                        disabled={loading || !aiTopic}
                        className="p-3 bg-primary text-white rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest ml-1">Descrição do Lote (Opcional)</label>
                    <input 
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ex: Revisão Final, Concurso X..."
                      className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3">
                     <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                     <p className="text-[10px] text-primary/80 font-medium leading-relaxed">
                        A IA criará uma sequência de cartões otimizada para concursos com base no tema escolhido.
                     </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] font-bold text-text-sub uppercase tracking-widest">Cards Sugeridos</span>
                    <button onClick={() => setGeneratedCards([])} className="text-[9px] font-bold text-primary uppercase tracking-widest">Refazer</button>
                  </div>
                  {generatedCards.map((card, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-border rounded-xl space-y-1">
                      <div className="text-[10px] font-bold text-text-main leading-tight">{card.front}</div>
                      <div className="text-[10px] text-text-sub italic">{card.back}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <div className="w-1/2">
              <button 
                onClick={() => setIsPublic(!isPublic)}
                className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all ${isPublic ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 border-border text-text-sub '}`}
              >
                <Share2 className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">{isPublic ? 'Público' : 'Privado'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 flex gap-3">
          <button 
            disabled={loading}
            onClick={onClose}
            className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-text-sub hover:text-text-main transition-colors"
          >
            Cancelar
          </button>
          <button 
            disabled={loading || success || (mode === 'manual' && (!front || !back)) || (mode === 'ai' && generatedCards.length === 0)}
            onClick={mode === 'manual' ? handleManualSave : handleSaveAllGenerated}
            className="flex-[2] bg-primary text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {success ? 'Concluído!' : mode === 'ai' ? 'Adicionar Tudo' : 'Criar Agora'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
