import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Contest } from '../types';
import { 
  BrainCircuit, 
  Lightbulb, 
  Play,
  Award,
  Plus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { generateQuizQuestions } from '../services/gemini';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, getDocs, limit } from 'firebase/firestore';
import FlashcardCreator from '../components/FlashcardCreator';
import FlashcardDeck from '../components/FlashcardDeck';

export default function Microlearning({ contest }: { contest: Contest }) {
  const [activeTab, setActiveTab] = useState<'selection' | 'quiz' | 'flashcards'>('selection');
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  const [showCreator, setShowCreator] = useState(false);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [dueCards, setDueCards] = useState<any[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'users', auth.currentUser.uid, 'flashcards'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFlashcards(cards);
      
      // Filter cards due for review (nextReview <= now)
      const now = new Date();
      const due = cards.filter((card: any) => {
        if (!card.nextReview) return true;
        const reviewDate = card.nextReview.toDate();
        return reviewDate <= now;
      });
      setDueCards(due);
    });

    return () => unsubscribe();
  }, []);

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

  if (activeTab === 'flashcards') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        <header className="flex items-center justify-between gap-4">
          <button 
            onClick={() => setActiveTab('selection')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-text-sub"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-display font-bold text-text-main italic">Sessão de Flashcards</h2>
            <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest">{dueCards.length} cartões pendentes</p>
          </div>
          <div className="w-10" />
        </header>

        {dueCards.length > 0 ? (
          <FlashcardDeck cards={dueCards} onFinish={() => setActiveTab('selection')} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center shadow-sm">
               <CheckCircle2 className="w-10 h-10 text-accent" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-display font-bold text-text-main">Tudo Limpo!</h3>
              <p className="text-sm text-text-sub max-w-xs mx-auto">Você não tem cards para revisar no momento. Que tal criar novos?</p>
            </div>
            <button 
              onClick={() => setShowCreator(true)}
              className="px-8 py-3 bg-accent text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-accent/20"
            >
              Criar Novo Card
            </button>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'selection') {
    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
        {showCreator && <FlashcardCreator onClose={() => setShowCreator(false)} subjects={contest.subjects || []} />}

        <header className="space-y-4">
          <div className="flex items-center gap-3 text-primary font-bold text-[10px] uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-sm"></div>
            Treinamento e Prática
          </div>
          <h1 className="text-3xl md:text-5xl font-display text-text-main tracking-tight font-bold italic">
            Revisão <span className="text-primary italic">&</span> Performance
          </h1>
          <p className="text-text-sub text-[11px] md:text-base max-w-2xl border-l-2 border-primary/30 pl-4 leading-relaxed font-medium">
            Ferramentas para consolidar o edital e acelerar sua retenção através de questões e repetição espaçada.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
          {/* Questions Sector */}
          <div className="rise-card p-6 md:p-10 group relative overflow-hidden flex flex-col justify-between min-h-[400px] bg-white border border-border shadow-sm">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
               <BrainCircuit className="w-32 h-32" />
            </div>
            
            <div className="space-y-6 relative z-10">
              <div className="bg-primary/10 border border-primary/20 w-12 h-12 rounded-xl flex items-center justify-center text-primary shadow-sm">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-display text-text-main italic font-bold">Questões Dinâmicas</h3>
                <p className="text-text-sub text-[11px] md:text-sm leading-relaxed font-medium italic pr-12">Desafios rápidos por matéria para testar seus reflexos.</p>
              </div>
            </div>

            <div className="space-y-2 relative z-10 pt-8">
              <div className="text-[10px] font-bold text-text-sub uppercase tracking-widest mb-2 border-b border-border pb-2 opacity-50">Práticas Sugeridas</div>
              {contest.subjects.slice(0, 3).map(sub => (
                <button 
                  key={sub.id}
                  onClick={() => startQuiz(sub.name)}
                  className="w-full text-left p-3.5 bg-slate-50 hover:bg-primary border border-border rounded-xl transition-all flex justify-between items-center group/item"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-sub group-hover/item:text-white truncate pr-4">{sub.name}</span>
                  <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center group-hover/item:bg-white transition-all shadow-sm">
                    <Play className="w-3.5 h-3.5 text-text-main group-hover/item:text-primary transition-all fill-current" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Flashcards Sector */}
          <div className="rise-card p-6 md:p-10 group relative overflow-hidden flex flex-col justify-between min-h-[400px] bg-white border border-border shadow-sm">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
               <Lightbulb className="w-32 h-32 text-accent" />
            </div>
            
            <div className="space-y-6 relative z-10">
              <div className="bg-accent/10 border border-accent/20 w-12 h-12 rounded-xl flex items-center justify-center text-accent shadow-sm">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-display text-text-main italic font-bold">Resumo & Flashcards</h3>
                <p className="text-text-sub text-[11px] md:text-sm leading-relaxed font-medium italic pr-12">Memorize conceitos complexos com cartões de estudo interativos.</p>
              </div>
            </div>

            <div className="space-y-4 pt-8 relative z-10">
               <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 border border-border rounded-xl text-center">
                    <div className="text-lg font-display font-bold text-text-main">{flashcards.length}</div>
                    <div className="text-[9px] font-bold text-text-sub uppercase tracking-widest">Totais</div>
                  </div>
                  <div className="p-4 bg-accent/5 border border-accent/10 rounded-xl text-center">
                    <div className="text-lg font-display font-bold text-accent">{dueCards.length}</div>
                    <div className="text-[9px] font-bold text-accent uppercase tracking-widest">Para Hoje</div>
                  </div>
               </div>

               <div className="flex gap-2">
                 <button 
                  onClick={() => setShowCreator(true)}
                  className="flex-1 bg-slate-100 text-text-main py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                   <Plus className="w-4 h-4" />
                   Criar
                 </button>
                 <button 
                  onClick={() => setActiveTab('flashcards')}
                  disabled={dueCards.length === 0}
                  className="flex-[2] bg-accent text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 disabled:shadow-none"
                 >
                  Iniciar Revisão
                 </button>
               </div>
            </div>
          </div>
        </div>

        {/* Improved Recommendations & Community */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
             <div className="flex items-center gap-2 px-1">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="text-[10px] font-bold text-text-sub uppercase tracking-widest">Indicações Estratégicas</h3>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-white border border-border rounded-2xl space-y-3 shadow-sm hover:border-primary/30 transition-all cursor-default">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                         <TrendingUp className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-text-main uppercase tracking-tight">Curva de Esquecimento</span>
                   </div>
                   <p className="text-[10px] text-text-sub leading-relaxed font-medium">
                      O sistema detectou que você costuma esquecer conceitos de <span className="text-primary font-bold italic">Redes</span> em 3 dias. Revise hoje para consolidar.
                   </p>
                </div>

                <div className="p-5 bg-white border border-border rounded-2xl space-y-3 shadow-sm hover:border-accent/30 transition-all cursor-default">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                         <MessageSquare className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-text-main uppercase tracking-tight">Feedback da Comunidade</span>
                   </div>
                   <p className="text-[10px] text-text-sub leading-relaxed font-medium">
                      Os flashcards de <span className="text-accent font-bold italic">Processo Penal</span> foram os mais baixados hoje. Acesse o acervo para conferir.
                   </p>
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-2 px-1">
                <Search className="w-4 h-4 text-text-sub" />
                <h3 className="text-[10px] font-bold text-text-sub uppercase tracking-widest">Acervo Coletivo</h3>
             </div>
             <div className="p-6 bg-gradient-to-br from-indigo-600 to-primary rounded-2xl text-white space-y-5 shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                   <Award className="w-32 h-32" />
                </div>
                <div className="space-y-2 relative z-10">
                   <h4 className="font-display font-bold text-lg leading-tight uppercase italic">Flashcards Públicos</h4>
                   <p className="text-[10px] text-white/70 font-medium leading-relaxed">
                      Explore decks criados por outros aprovados e economize tempo de produção.
                   </p>
                </div>
                <Link to="/comunidade" className="flex items-center justify-between bg-white text-primary px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all relative z-10 shadow-xl">
                   Explorar Acervo
                   <ChevronRight className="w-4 h-4" />
                </Link>
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
        <div className="text-center space-y-2 md:space-y-4">
            <h2 className="text-xl md:text-3xl font-display text-text-main tracking-wider uppercase italic font-bold">Preparando questões...</h2>
            <p className="text-text-sub text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">Carregando...</p>
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
                             <BrainCircuit className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Explicação</span>
                        </div>
                        <p className="text-sm md:text-base text-text-sub leading-relaxed italic relative z-10 font-medium">"{quizData[currentQuestion]?.explanation}"</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
}

