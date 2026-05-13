import React, { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ChevronRight, ChevronLeft, RefreshCw, CheckCircle2, ChevronDown, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subjectName: string;
  interval: number;
  ease: number;
  nextReview: any;
}

interface FlashcardDeckProps {
  cards: Flashcard[];
  onFinish: () => void;
}

export default function FlashcardDeck({ cards, onFinish }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [finishMode, setFinishMode] = useState(false);

  const currentCard = cards[currentIndex];

  const handleRate = async (quality: number) => {
    // Simple SRS logic
    // quality: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
    if (!auth.currentUser) return;

    let newInterval = currentCard.interval || 0;
    let newEase = currentCard.ease || 2.5;

    if (quality < 3) {
      newInterval = 0; // Restart
    } else {
      if (newInterval === 0) newInterval = 1;
      else if (newInterval === 1) newInterval = 3;
      else newInterval = Math.round(newInterval * newEase);
    }

    if (quality === 4) newEase += 0.15;
    if (quality === 2) newEase -= 0.15;
    if (newEase < 1.3) newEase = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    try {
      const cardRef = doc(db, 'users', auth.currentUser.uid, 'flashcards', currentCard.id);
      await updateDoc(cardRef, {
        interval: newInterval,
        ease: newEase,
        nextReview: nextReviewDate,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
    }

    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(c => c + 1);
    } else {
      setFinishMode(true);
    }
  };

  if (finishMode) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 animate-in zoom-in-95 duration-500">
        <div className="bg-white p-8 md:p-12 text-center space-y-8 w-full max-w-md rounded-3xl border border-border shadow-2xl">
          <div className="w-20 h-20 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-accent" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold text-text-main">Meta Batida!</h2>
            <p className="text-sm text-text-sub font-medium">Sua memória de longo prazo agradece. Continue com a constância.</p>
          </div>
          <button 
            onClick={onFinish}
            className="w-full bg-accent text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent/20"
          >
            Concluir Protocolo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-500 px-4">
      <header className="flex justify-between items-center bg-white p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center font-display text-lg font-bold">
            {currentIndex + 1}
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] font-bold text-text-sub uppercase tracking-widest leading-none">Flashcard</div>
            <div className="text-[10px] font-bold text-accent uppercase tracking-widest leading-none">Restam {cards.length - currentIndex - 1}</div>
          </div>
        </div>
        <div className="text-[10px] font-bold text-text-sub bg-slate-50 border border-border px-3 py-1.5 rounded-full uppercase tracking-widest">
            {currentCard.subjectName}
        </div>
      </header>

      <div className="relative h-80 md:h-96 group" style={{ perspective: 1000 }}>
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
          className="w-full h-full relative cursor-pointer"
          style={{ transformStyle: 'preserve-3d' }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front */}
          <div 
            className="absolute inset-0 w-full h-full bg-white border-2 border-border p-8 md:p-12 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-sm"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-30">
               <RefreshCw className="w-3 h-3 text-text-sub" />
               <span className="text-[8px] font-bold text-text-sub uppercase tracking-[0.2em]">Toque para virar</span>
            </div>
            <h3 className="text-xl md:text-2xl font-display text-text-main font-bold leading-relaxed italic pr-2">
              {currentCard.front}
            </h3>
          </div>

          {/* Back */}
          <div 
            className="absolute inset-0 w-full h-full bg-white border-2 border-accent/20 p-8 md:p-12 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-inner"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-50">
               <span className="text-[8px] font-bold text-accent uppercase tracking-[0.2em]">Resposta</span>
            </div>
            <div className="text-base md:text-lg text-text-main font-medium leading-relaxed italic overflow-y-auto max-h-full no-scrollbar">
              {currentCard.back}
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {!isFlipped ? (
           <motion.div 
             key="hint"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             className="text-center"
           >
             <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest animate-pulse">Toque no cartão para ver a resposta</p>
           </motion.div>
        ) : (
          <motion.div 
            key="actions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3"
          >
            {[
              { label: 'De novo', value: 1, color: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' },
              { label: 'Difícil', value: 2, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20' },
              { label: 'Bom', value: 3, color: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' },
              { label: 'Fácil', value: 4, color: 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20' }
            ].map(btn => (
              <button
                key={btn.value}
                onClick={() => handleRate(btn.value)}
                className={cn(
                  "py-3 md:py-4 border rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all",
                  btn.color
                )}
              >
                {btn.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
