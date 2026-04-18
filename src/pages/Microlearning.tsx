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
  ArrowRight
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
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Sessões Avançadas de IA</h1>
          <p className="text-text-sub text-sm">Otimize a fixação de conteúdo com ferramentas baseadas em ciência cognitiva.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-border p-8 rounded-2xl space-y-6 shadow-sm">
            <div className="bg-accent-bg p-3 rounded-lg w-fit text-primary">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-text-main">Simulador Dinâmico</h3>
            <p className="text-text-sub text-sm leading-relaxed">A IA gera questões inéditas focadas em tópicos de alta incidência do seu edital.</p>
            <div className="space-y-2 mt-4">
              {contest.subjects.slice(0, 4).map(sub => (
                <button 
                  key={sub.id}
                  onClick={() => startQuiz(sub.name)}
                  className="w-full text-left p-3.5 bg-gray-50 hover:bg-accent-bg border border-border rounded-xl transition-all flex justify-between items-center group"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-text-main">{sub.name}</span>
                  <Play className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-border p-8 rounded-2xl space-y-6 shadow-sm flex flex-col">
            <div className="bg-gray-100 p-3 rounded-lg w-fit text-text-sub">
              <Lightbulb className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-text-main">Flashcards Ativos</h3>
            <p className="text-text-sub text-sm flex-grow leading-relaxed">Pratique o "Active Recall" com cartões gerados para conceitos fundamentais.</p>
            <button className="bg-text-main text-white py-3 rounded-xl font-bold text-sm tracking-tight hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-6">
              Recuperação Ativa
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-6">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-primary rounded-full animate-spin"></div>
        <div className="text-center">
            <h2 className="text-lg font-bold text-text-main tracking-tight">Arquitetando Desafios...</h2>
            <p className="text-text-sub text-xs font-bold uppercase tracking-widest mt-2 animate-pulse">Integrando Base de Dados da Banca</p>
        </div>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in-95 duration-500">
        <div className="bg-white border border-border p-12 rounded-3xl text-center space-y-6 shadow-xl w-full max-w-lg">
          <div className="text-5xl">🏆</div>
          <h2 className="text-2xl font-bold text-text-main">Relatório de Performance</h2>
          <div className="text-primary text-6xl font-black">{score}/{quizData.length}</div>
          <p className="text-text-sub text-sm font-medium">Seu aproveitamento foi de {Math.round((score/quizData.length)*100)}% nesta sessão.</p>
          <button 
            onClick={() => setActiveTab('selection')}
            className="bg-primary text-white w-full py-3.5 rounded-xl font-bold hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
          >
            Finalizar Sessão
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right-4 duration-500">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-text-sub px-1">
            <span>Monitor de Questões: {currentQuestion + 1} / {quizData.length}</span>
            <span className="text-primary">Banca IA Ativa</span>
        </div>

        <div className="bg-white border border-border rounded-2xl p-8 space-y-8 shadow-sm">
            <h2 className="text-xl font-bold leading-tight text-text-main">
                {quizData[currentQuestion]?.question}
            </h2>

            <div className="space-y-3">
                {quizData[currentQuestion]?.options.map((opt: string, idx: number) => {
                    const isCorrect = selectedOption !== null && idx === quizData[currentQuestion].correctAnswerIndex;
                    const isWrong = selectedOption === idx && idx !== quizData[currentQuestion].correctAnswerIndex;
                    
                    return (
                        <button
                            key={idx}
                            disabled={selectedOption !== null}
                            onClick={() => handleAnswer(idx)}
                            className={cn(
                                "w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center group text-sm",
                                selectedOption === null ? "bg-white border-border hover:border-primary hover:bg-accent-bg/30 text-text-main" :
                                isCorrect ? "bg-accent-bg border-primary text-primary font-bold" :
                                isWrong ? "bg-red-50 border-red-500 text-red-500 font-bold" :
                                "bg-gray-50 border-transparent opacity-50"
                            )}
                        >
                            <span>{opt}</span>
                            {isCorrect && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                            {isWrong && <XCircle className="w-4 h-4 shrink-0" />}
                        </button>
                    );
                })}
            </div>

            <AnimatePresence>
                {selectedOption !== null && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 p-6 rounded-xl border border-border"
                    >
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-sub mb-2">Fundamentação:</p>
                        <p className="text-sm text-text-main leading-relaxed italic">{quizData[currentQuestion]?.explanation}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
}
