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
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
        <header className="space-y-4">
          <div className="flex items-center gap-3 text-primary/80 font-bold text-xs uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(168,85,247,0.8)]"></div>
            Treinamento Tático
          </div>
          <h1 className="text-3xl md:text-6xl font-display text-white tracking-tight font-bold italic">
            Fixação <span className="text-primary italic animate-pulse">Ativa.</span>
          </h1>
          <p className="text-slate-500 text-sm md:text-lg max-w-2xl border-l-2 border-primary/30 pl-6 leading-relaxed font-medium">
            Ferramentas avançadas para consolidar padrões de prova e acelerar sua retenção.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rise-card p-10 md:p-14 group relative overflow-hidden flex flex-col justify-between min-h-[460px] bg-gradient-to-br from-white/5 to-transparent border-none">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
               <BrainCircuit className="w-32 h-32" />
            </div>
            
            <div className="space-y-10 relative z-10">
              <div className="bg-primary/10 border border-primary/20 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-primary shadow-2xl">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-display text-white italic font-bold">Prática de Tópicos</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium italic pr-12">Avalie seus reflexos em tópicos isolados com desafios focados no edital.</p>
              </div>
            </div>

            <div className="space-y-4 relative z-10 pt-10">
              <div className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4 border-b border-white/5 pb-3">Selecione um Setor</div>
              {contest.subjects.slice(0, 4).map(sub => (
                <button 
                  key={sub.id}
                  onClick={() => startQuiz(sub.name)}
                  className="w-full text-left p-5 bg-white/5 hover:bg-primary border border-white/5 rounded-2xl transition-all flex justify-between items-center group/item shadow-xl"
                >
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 group-hover/item:text-white truncate pr-6">{sub.name}</span>
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/item:bg-white group-hover/item:border-white transition-all shadow-lg">
                    <Play className="w-4 h-4 text-slate-700 group-hover/item:text-primary transition-all fill-current" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rise-card p-10 md:p-14 group relative overflow-hidden flex flex-col justify-between min-h-[460px] bg-gradient-to-br from-white/5 to-transparent border-none">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
               <Lightbulb className="w-32 h-32 text-accent" />
            </div>
            
            <div className="space-y-10 relative z-10">
              <div className="bg-accent/10 border border-accent/20 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-accent shadow-2xl">
                <Lightbulb className="w-8 h-8" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-display text-white italic font-bold">Flashcards</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium italic pr-12">Estruture sua memória de longo prazo com o protocolo de repetição espaçada.</p>
              </div>
            </div>

            <div className="space-y-6 pt-10 relative z-10">
               <div className="p-6 bg-accent/5 border border-accent/20 rounded-[2rem] shadow-inner">
                  <div className="flex items-center gap-3 mb-3">
                    <Award className="w-5 h-5 text-accent" />
                    <span className="text-xs font-black text-accent uppercase tracking-wider">Carga de Revisão</span>
                  </div>
                  <p className="text-sm text-slate-400 font-medium">Você possui <span className="text-white font-black italic">14 cartões</span> para o protocolo de hoje.</p>
               </div>
               <button className="w-full bg-accent text-white py-6 rounded-[1.5rem] font-bold text-sm uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-accent/30 border-2 border-accent">
                Iniciar Protocolo
               </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-12 animate-in fade-in duration-1000">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <BrainCircuit className="w-10 h-10 text-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-4">
            <h2 className="text-3xl font-display text-white tracking-wider uppercase italic font-black">Codificando Desafios...</h2>
            <p className="text-slate-600 text-xs font-black uppercase tracking-[0.5em] animate-pulse">Sincronizando bancos de dados recentes</p>
        </div>
      </div>
    );
  }

  if (showResult) {
    const percentage = Math.round((score/quizData.length)*100);
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-in zoom-in-95 duration-700">
        <div className="rise-card p-14 md:p-20 text-center space-y-12 w-full max-w-xl border-primary/20 bg-gradient-to-br from-slate-950 to-transparent">
          <div className="space-y-8 relative z-10">
            <div className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <Award className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-display text-white italic font-black tracking-tight">Sessão Finalizada.</h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed italic">Progresso transmitido com sucesso. Cadência mantida.</p>
            </div>

            <div className="flex items-center justify-center gap-10 py-6">
              <div className="flex flex-col items-center">
                <span className="text-primary text-7xl md:text-8xl font-display leading-none italic font-black">{score}</span>
                <span className="text-xs font-black text-slate-600 uppercase tracking-wider mt-4">Acertos</span>
              </div>
              <div className="h-16 w-px bg-white/10"></div>
              <div className="flex flex-col items-center">
                <span className="text-white text-7xl md:text-8xl font-display leading-none italic font-black">{quizData.length}</span>
                <span className="text-xs font-black text-slate-600 uppercase tracking-wider mt-4">Total</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 py-6 px-12 rounded-2xl inline-block shadow-inner backdrop-blur-md">
               <span className="text-xs font-black text-slate-700 uppercase tracking-wider mr-4">Performance Tática</span>
               <span className="text-2xl font-display text-white italic font-black">{percentage}%</span>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('selection')}
            className="w-full bg-white text-slate-950 py-6 rounded-[1.5rem] font-bold text-sm uppercase tracking-wider hover:scale-105 transition-all shadow-2xl active:scale-95 border-2 border-white"
          >
            Sincronizar e Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-in slide-in-from-right-8 duration-700 pb-20">
        <header className="flex justify-between items-center px-8 border-b border-white/5 pb-8">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-white text-slate-950 border border-white/10 rounded-2xl flex items-center justify-center font-display text-2xl italic font-black shadow-2xl">
                {currentQuestion + 1}
              </div>
              <div className="space-y-1">
                <div className="text-xs font-black text-slate-600 uppercase tracking-wider">Célula Atual</div>
                <div className="text-xs font-black text-white uppercase tracking-wider">{quizData.length} MÓDULOS TOTAIS</div>
              </div>
            </div>
            <div className="text-xs font-black text-primary uppercase tracking-wider bg-primary/10 border border-primary/20 px-6 py-3 rounded-full shadow-2xl animate-pulse">Monitoramento Ativo</div>
        </header>

        <div className="rise-card p-10 md:p-16 space-y-14 border-white/10 bg-gradient-to-br from-slate-950 to-transparent">
            <h2 className="text-xl md:text-3xl font-display leading-[1.4] text-white italic font-bold tracking-tight">
                {quizData[currentQuestion]?.question}
            </h2>

            <div className="grid grid-cols-1 gap-5">
                {quizData[currentQuestion]?.options.map((opt: string, idx: number) => {
                    const isCorrect = selectedOption !== null && idx === quizData[currentQuestion].correctAnswerIndex;
                    const isWrong = selectedOption === idx && idx !== quizData[currentQuestion].correctAnswerIndex;
                    
                    return (
                        <button
                            key={idx}
                            disabled={selectedOption !== null}
                            onClick={() => handleAnswer(idx)}
                            className={cn(
                                "w-full text-left p-7 md:p-10 rounded-[2rem] border-2 transition-all flex justify-between items-center group relative overflow-hidden",
                                selectedOption === null 
                                  ? "bg-white/5 border-white/5 hover:border-primary/50 hover:bg-white/10 text-slate-400" 
                                  : isCorrect 
                                    ? "bg-accent/10 border-accent text-white shadow-[0_0_30px_rgba(34,197,94,0.3)] scale-105 z-10" 
                                    : isWrong 
                                      ? "bg-red-500/10 border-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)] scale-105 z-10" 
                                      : "bg-slate-950/40 border-transparent opacity-20"
                            )}
                        >
                            <span className="text-base font-bold pr-10 leading-relaxed italic">{opt}</span>
                            <div className="shrink-0">
                              {isCorrect && <CheckCircle2 className="w-8 h-8 text-accent animate-in zoom-in duration-500" />}
                              {isWrong && <XCircle className="w-8 h-8 text-red-500 animate-in zoom-in duration-500" />}
                              {!selectedOption && (
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary group-hover:bg-primary transition-all shadow-lg">
                                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-white" />
                                </div>
                              )}
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
                        className="bg-primary/5 p-10 rounded-2xl border-2 border-primary/20 relative overflow-hidden shadow-inner"
                    >
                        <BrainCircuit className="absolute -right-6 -bottom-6 w-32 h-32 text-primary/5 rotate-12" />
                        <div className="flex items-center gap-4 mb-6 relative z-10">
                          <div className="bg-primary/20 p-2.5 rounded-xl text-primary">
                             <BrainCircuit className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-black uppercase tracking-wider text-primary">Análise Médica/Técnica</span>
                        </div>
                        <p className="text-base text-slate-400 leading-relaxed italic relative z-10 font-medium">"{quizData[currentQuestion]?.explanation}"</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
}

