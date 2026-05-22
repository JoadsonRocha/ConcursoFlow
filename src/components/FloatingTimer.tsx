import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface FloatingTimerProps {
  timeLeft: number;
  isActive: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function FloatingTimer({ timeLeft, isActive, onToggle, onClose }: FloatingTimerProps) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 right-4 z-[1000] bg-white border border-border rounded-2xl shadow-lg p-3 flex items-center gap-4"
    >
      <div className="flex items-center gap-2">
        <Timer className="w-4 h-4 text-primary" />
        <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
      </div>
      <button 
        onClick={onToggle}
        className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-bold uppercase tracking-wider"
      >
        {isActive ? 'Pausa' : 'Play'}
      </button>
      <button onClick={onClose} className="p-1 text-text-sub hover:text-red-500">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
