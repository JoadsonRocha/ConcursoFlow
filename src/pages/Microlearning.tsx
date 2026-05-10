import { useState } from 'react';
import { Contest } from '../types';
import { 
  BrainCircuit, 
  Gamepad2, 
  Lightbulb, 
  ChevronRight, 
  CheckCircle2, 
  XCircle,
  Play,
  ArrowRight,
  Award
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { generateQuizQuestions } from '../services/gemini';

export default function Microlearning({ contest }: { contest: Contest }) {
  const [activeTab, setActiveTab] = useState<'selection' | 'quiz' | 'flashcards'>('selection');
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const startQuiz = async (subject: string) => {
    setLoading(true);
    setActiveTab('quiz');
    try {
      const data = await generateQuizQuestions(subject, "tópicos gerais");
      setQuizData(data);
      setCurrentQuestion(0);
      setScore(0);
      setShowResult(false);
    } catch (err) {
      alert("Erro ao carregar quiz. Tente novamente.");
      setActiveTab('selection');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (idx === quizData[currentQuestion].correctAnswerIndex) {
      setScore(s => s + 1);
    }
    setTimeout(() => {
      if (currentQuestion < quizData.length - 1) {
        setCurrentQuestion(c => c + 1);
        setSelectedOption(null);
      } else {
        setShowResult(true);
      }
    }, 2000);
  };

  if (activeTab === 'selection') {
    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em] leading-none mb-2">Treinamento Cognitivo</div>
          <h1 className="text-4xl md:text-6xl font-display leading-[0.9] text-text-main tracking-tighter">
            Estudo <span className="italic text-primary">Avançado</span> IA.
          </h1>
          <p className="text-text-sub text-sm font-medium pt-2">Ferramentas de fixação e recuperação ativa de conteúdo.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 border border-border p-8 rounded-[3rem] space-y-8 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:bg-primary/10 transition-colors"></div>
            <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center text-primary shadow-inner">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-2xl font-display text-text-main">Simulador Dinâmico</h3>
              <p className="text-text-sub text-sm leading-relaxed font-medium">A IA gera questões inéditas focadas estrategicamente nos temas de maior incidência.</p>
            </div>
            <div className="space-y-3 relative z-10 pt-4">
              <div className="text-[10px] font-black text-text-sub uppercase tracking-widest mb-4">Selecione uma disciplina</div>
              {contest.subjects.slice(0, 4).map(sub => (
                <button 
                  key={sub.id}
                  onClick={() => startQuiz(sub.name)}
                  className="w-full text-left p-4.5 bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-white border border-border dark:border-slate-700 rounded-2xl transition-all flex justify-between items-center group/item shadow-sm"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">{sub.name}</span>
                  <Play className="w-4 h-4 opacity-50 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-border p-8 rounded-[3rem] space-y-8 shadow-sm hover:shadow-2xl hover:shadow-secondary/5 transition-all relative overflow-hidden group flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:bg-secondary/10 transition-colors"></div>
            <div className="space-y-8 relative z-10">
              <div className="bg-secondary/10 w-16 h-16 rounded-2xl flex items-center justify-center text-secondary shadow-inner">
                <Lightbulb className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-display text-text-main">Flashcards Ativos</h3>
                <p className="text-text-sub text-sm leading-relaxed font-medium">Maximize o efeito da "Recuperação Ativa" com cartões inteligentes de conceitos fundamentais.</p>
              </div>
            </div>
            <button className="relative z-10 w-full bg-text-main text-bg py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-text-main/10 mt-10">
              Iniciar Sessão IA
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in duration-700">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <BrainCircuit className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
            <h2 className="text-2xl font-display text-text-main tracking-tight">Construindo Desafios...</h2>
            <p className="text-text-sub text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Integrando Base de Dados da Banca</p>
        </div>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in-95 duration-500">
        <div className="bg-white dark:bg-slate-900 border border-border p-12 rounded-[3rem] text-center space-y-10 shadow-2xl w-full max-w-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/5 to-transparent"></div>
          
          <div className="space-y-4 relative z-10">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Award className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-display text-text-main">Resultados da Sessão</h2>
            <div className="flex items-center justify-center gap-2">
              <span className="text-primary text-7xl font-display leading-none">{score}</span>
              <span className="text-text-sub text-3xl font-display opacity-30 mt-4">/ {quizData.length}</span>
            </div>
            <p className="text-text-sub text-sm font-medium pt-2">Aproveitamento Cirúrgico: <span className="text-text-main font-bold">{Math.round((score/quizData.length)*100)}%</span></p>
          </div>

          <button 
            onClick={() => setActiveTab('selection')}
            className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 relative z-10"
          >
            Finalizar Treinamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-700 pb-20">
        <header className="flex justify-between items-center px-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-display font-black">
                {currentQuestion + 1}
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] font-black text-text-sub uppercase tracking-widest leading-none">Questão Atual</div>
                <div className="text-xs font-bold text-text-main">Meta: {quizData.length} itens</div>
              </div>
            </div>
            <div className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-full leading-none">Banca IA Monitor</div>
        </header>

        <div className="bg-white dark:bg-slate-900 border border-border rounded-[3rem] p-8 md:p-12 space-y-10 shadow-xl shadow-primary/[0.02]">
            <h2 className="text-xl md:text-2xl font-display leading-[1.3] text-text-main">
                {quizData[currentQuestion]?.question}
            </h2>

            <div className="space-y-4">
                {quizData[currentQuestion]?.options.map((opt: string, idx: number) => {
                    const isCorrect = selectedOption !== null && idx === quizData[currentQuestion].correctAnswerIndex;
                    const isWrong = selectedOption === idx && idx !== quizData[currentQuestion].correctAnswerIndex;
                    
                    return (
                        <button
                            key={idx}
                            disabled={selectedOption !== null}
                            onClick={() => handleAnswer(idx)}
                            className={cn(
                                "w-full text-left p-6 rounded-[2rem] border-2 transition-all flex justify-between items-center group relative overflow-hidden",
                                selectedOption === null 
                                  ? "bg-white dark:bg-slate-900 border-border hover:border-primary/50 hover:bg-slate-50 text-text-main" 
                                  : isCorrect 
                                    ? "bg-accent/10 border-accent text-accent font-bold shadow-lg shadow-accent/5" 
                                    : isWrong 
                                      ? "bg-red-50 border-red-500 text-red-500 font-bold" 
                                      : "bg-slate-50 border-transparent opacity-30 grayscale"
                            )}
                        >
                            <span className="text-base font-medium pr-8">{opt}</span>
                            <div className="shrink-0">
                              {isCorrect && <CheckCircle2 className="w-6 h-6 animate-in zoom-in duration-300" />}
                              {isWrong && <XCircle className="w-6 h-6 animate-in zoom-in duration-300" />}
                              {!selectedOption && <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary" />}
                            </div>
                        </button>
                    );
                })}
            </div>

            <AnimatePresence>
                {selectedOption !== null && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-border"
                    >
                        <div className="flex items-center gap-2 mb-4">
                          <BrainCircuit className="w-5 h-5 text-primary" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-text-sub">Fundamentação Estratégica</span>
                        </div>
                        <p className="text-sm text-text-main leading-relaxed font-medium italic opacity-80">{quizData[currentQuestion]?.explanation}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
}

