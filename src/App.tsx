import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  ShieldCheck, 
  Calendar, 
  BrainCircuit, 
  Settings,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  Clock,
  Award,
  Moon,
  Sun,
  PenTool,
  Save,
  LogIn,
  LogOut,
  Sparkles,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { cn } from './lib/utils';
import { CONTESTS } from './data/contests';
import { Contest, Subject } from './types';
import { motion, AnimatePresence } from 'motion/react';
import Subjects from './pages/Subjects';
import Microlearning from './pages/Microlearning';
import Configuracoes from './pages/Configuracoes';
import Cronograma from './pages/Cronograma';
import Comunidade from './pages/Comunidade';
import Landing from './pages/Landing';
import { useAuth } from './contexts/AuthContext';
import { db } from './lib/firebase';
import { collection, query, onSnapshot, doc, setDoc, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { Users, Heart } from 'lucide-react';

// Dashboard Component
const Dashboard = ({ contest, onUpdate }: { contest: Contest, onUpdate: (contest: Contest) => void }) => {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState<{ hours: number | '', questions: number | '' }>({ hours: '', questions: '' });

  useEffect(() => {
    const updateTimer = () => {
      if (!contest?.examDate) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const target = new Date(contest.examDate).getTime();
      const now = Date.now();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [contest?.examDate]);

  const prioritySubjects = [...(contest?.subjects || [])].sort((a, b) => {
    const weights = { 'Muito Alta': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };
    return weights[b.incidence] - weights[a.incidence];
  }).slice(0, 4);

  const generalSubjects = (contest?.subjects || []).filter(s => s.category === 'Gerais');
  const specificSubjects = (contest?.subjects || []).filter(s => s.category === 'Específicos');

  const calculateProgress = (subs: Subject[]) => {
    const total = subs.reduce((acc, s) => acc + s.totalTopics, 0);
    const completed = subs.reduce((acc, s) => acc + (s.topics?.filter(t => t.completed).length || 0), 0);
    const revisions = subs.reduce((acc, s) => acc + (s.topics?.filter(t => t.revision).length || 0), 0);
    const questions = subs.reduce((acc, s) => acc + (s.topics?.filter(t => t.questions).length || 0), 0);
    return { 
      total, 
      completed, 
      revisions,
      questions,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      revPercent: total > 0 ? Math.round((revisions / total) * 100) : 0,
      quesPercent: total > 0 ? Math.round((questions / total) * 100) : 0
    };
  };

  const generalProgress = calculateProgress(generalSubjects);
  const specificProgress = calculateProgress(specificSubjects);

  const todayTask = contest?.schedule?.find(day => !day.completed);
  
  // Calculate Debt from previous completed days
  const debt = (contest?.schedule || [])
    .filter(day => day.completed)
    .reduce((acc, day) => {
      const hGoal = contest?.dailyGoalHours || 2;
      const qGoal = day.questionGoal || 0;
      const hActual = day.actualHours || 0;
      const qActual = day.actualQuestions || 0;
      
      return {
        hours: acc.hours + Math.max(0, hGoal - hActual),
        questions: acc.questions + Math.max(0, (qGoal as number) - qActual)
      };
    }, { hours: 0, questions: 0 });

  const handleSavePerformance = () => {
    if (!todayTask || !contest) return;
    
    const newSchedule = contest.schedule?.map(day => {
      if (day.id === todayTask.id) {
        return {
          ...day,
          completed: true,
          actualHours: logForm.hours,
          actualQuestions: logForm.questions
        };
      }
      return day;
    });
    
    onUpdate({ ...contest, schedule: newSchedule });
    setShowLogModal(false);
    setLogForm({ hours: 0, questions: 0 });
  };

  const isDefaultContest = !contest || !contest.ownerId;
  const hasNoSchedule = !contest?.schedule || contest.schedule.length === 0;

  // Calculate global progress
  const globalProgress = calculateProgress(contest?.subjects || []);
  const streak = (contest?.schedule || []).filter(d => d.completed).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-text-main tracking-tight">Olá, {user?.displayName?.split(' ')[0] || 'Guerreiro'}!</h1>
          <p className="text-text-sub text-sm font-medium">Seja bem-vindo ao seu painel de controle de estudos.</p>
          <div className="text-xs font-bold text-primary uppercase tracking-widest pt-2">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        {!isDefaultContest && (
          <button 
            onClick={() => setShowLogModal(true)}
            className="bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Registrar Estudos de Hoje
          </button>
        )}
      </header>

      {/* Main Stats Grid */}
      {!isDefaultContest && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Circular Progress & Streak */}
          <div className="lg:col-span-1 bg-white dark:bg-card-bg border border-border rounded-[40px] p-8 flex flex-col items-center justify-center space-y-6 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
            
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-bg" />
                <circle 
                  cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  strokeDasharray={364.4}
                  strokeDashoffset={364.4 - (364.4 * globalProgress.percent) / 100}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-1000 ease-out" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-text-main leading-none">{globalProgress.percent}%</span>
                <span className="text-[10px] font-bold text-text-sub uppercase tracking-wider">Completo</span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-accent font-black">
                <TrendingUp className="w-4 h-4" />
                <span>{streak} dias de luta</span>
              </div>
              <p className="text-[10px] text-text-sub font-bold uppercase tracking-widest leading-none">Sua constância atual</p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-card-bg border border-border rounded-[32px] p-6 space-y-4 shadow-sm hover:border-secondary/30 transition-all">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-text-main">{globalProgress.completed}/{globalProgress.total}</div>
                <div className="text-[10px] font-bold text-text-sub uppercase tracking-widest">Tópicos Vencidos</div>
              </div>
              <div className="w-full bg-bg h-1.5 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${globalProgress.percent}%` }} />
              </div>
            </div>

            <div className="bg-white dark:bg-card-bg border border-border rounded-[32px] p-6 space-y-4 shadow-sm hover:border-accent/30 transition-all">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-text-main">{globalProgress.questions}/{globalProgress.total}</div>
                <div className="text-[10px] font-bold text-text-sub uppercase tracking-widest">Tópicos com Questões</div>
              </div>
              <div className="w-full bg-bg h-1.5 rounded-full overflow-hidden">
                <div className="bg-accent h-full rounded-full transition-all duration-500" style={{ width: `${globalProgress.quesPercent}%` }} />
              </div>
            </div>

            <div className="bg-white dark:bg-card-bg border border-border rounded-[32px] p-6 space-y-4 shadow-sm hover:border-primary/30 transition-all">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-text-main">{globalProgress.revisions}/{globalProgress.total}</div>
                <div className="text-[10px] font-bold text-text-sub uppercase tracking-widest">Tópicos Revisados</div>
              </div>
              <div className="w-full bg-bg h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${globalProgress.revPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-gradient-to-br from-indigo-500 to-primary rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl shadow-primary/20 lg:col-span-4">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-20 translate-x-20"></div>
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                Dica de Mestre
              </div>
              <h3 className="text-xl font-black leading-tight">A constância vence o talento quando o talento não é constante.</h3>
              <p className="text-xs text-indigo-100 font-medium leading-relaxed max-w-lg">
                Foque em bater suas metas diárias, mesmo que pequenas. O acúmulo de conhecimento é exponencial. Não pare!
              </p>
              <div className="pt-2">
                <Link 
                  to="/microaprendizado"
                  className="bg-white text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all inline-block shadow-lg"
                >
                  Ver Flashcards
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Log Modal */}
      <AnimatePresence>
        {showLogModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-card-bg border border-border w-full max-w-md rounded-3xl p-8 space-y-6">
              <h3 className="text-xl font-black text-text-main">Como foram seus estudos hoje?</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-sub uppercase mb-2">Horas Estudadas Realizadas</label>
                  <input 
                    type="number" 
                    inputMode="decimal"
                    className="w-full bg-bg border border-border rounded-xl p-3 text-sm focus:ring-2 ring-primary/20 outline-none" 
                    value={logForm.hours} 
                    onChange={(e) => setLogForm({...logForm, hours: e.target.value === '' ? '' : Number(e.target.value)})} 
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sub uppercase mb-2">Questões Resolvidas Realizadas</label>
                  <input 
                    type="number" 
                    inputMode="numeric"
                    className="w-full bg-bg border border-border rounded-xl p-3 text-sm focus:ring-2 ring-primary/20 outline-none" 
                    value={logForm.questions} 
                    onChange={(e) => setLogForm({...logForm, questions: e.target.value === '' ? '' : Number(e.target.value)})} 
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowLogModal(false)} className="flex-1 py-3 text-sm font-bold text-text-sub hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                  <button 
                    onClick={handleSavePerformance}
                    className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20"
                  >
                    Salvar Desempenho
                  </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isDefaultContest && (
        <section className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-3xl p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
            <Sparkles className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-text-main italic">Inicie sua Jornada</h2>
            <p className="text-text-sub max-w-md mx-auto text-sm">
              Você ainda não configurou seu plano de estudos pessoal. Importe um edital para que a IA gere seu cronograma personalizado e checklist.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Link to="/configuracoes" className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all">
              Configurar Meu Edital
            </Link>
          </div>
        </section>
      )}

      {/* Countdown Timer */}
      {!isDefaultContest && (
        <section className="bg-white border border-border rounded-3xl p-8 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
            <Calendar className="w-32 h-32" />
          </div>
          <div className="relative z-10 space-y-6">
            <h2 className="text-sm font-bold text-text-sub uppercase tracking-widest text-center md:text-left">Faltam apenas para a prova {contest?.name}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8">
              {[
                { label: 'Dias', value: timeLeft.days },
                { label: 'Horas', value: timeLeft.hours },
                { label: 'Min', value: timeLeft.minutes },
                { label: 'Seg', value: timeLeft.seconds },
              ].filter((item, idx, arr) => {
                // Keep minutes and seconds always. Hide Days/Hours if they are 0 and there's nothing larger.
                if (idx < 2 && item.value === 0) {
                   // Only hide if all preceding items are also 0
                   const precedingNonZero = arr.slice(0, idx).some(i => i.value > 0);
                   return precedingNonZero;
                }
                return true;
              }).map((item) => (
                <div key={item.label} className="flex flex-col items-center">
                  <span className="text-4xl md:text-5xl font-black text-text-main tabular-nums">{item.value}</span>
                  <span className="text-[10px] font-bold text-text-sub uppercase tracking-wider mt-1">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Today's Schedule (Cronograma de Hoje) */}
      {todayTask && (
        <section className="bg-white border border-border rounded-[32px] overflow-hidden shadow-sm relative group transition-all hover:shadow-xl hover:shadow-primary/5">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
            <BrainCircuit className="w-48 h-48 text-primary" />
          </div>
          
          <div className="flex flex-col lg:flex-row min-h-[220px]">
            {/* Left Rail: Day Indicator */}
            <div className="bg-primary text-white p-8 flex flex-col justify-between items-center lg:w-32 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Dia</span>
              <span className="text-5xl font-black tabular-nums leading-none mb-2">{todayTask.dayNumber}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 space-y-8 relative">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary p-2 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-text-main tracking-tight leading-tight">Sua Missão Hoje</h3>
                  <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest">Seu Plano de Guerra Personalizado</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div className="space-y-2 group/item">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                    <span className="text-[10px] font-bold text-text-sub uppercase tracking-wider">Conhecimentos Gerais</span>
                  </div>
                  <div className="text-sm font-medium text-text-main leading-relaxed pl-3.5 border-l border-border group-hover/item:border-primary transition-colors">
                    {(() => {
                      const topic = todayTask.generalTopic;
                      if (!topic) return "Nenhum tópico definido";
                      const parts = topic.split(':');
                      if (parts.length > 1) {
                        return <><span className="font-black text-primary/80">{parts[0]}:</span> {parts.slice(1).join(':')}</>;
                      }
                      return topic;
                    })()}
                  </div>
                </div>

                <div className="space-y-2 group/item">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary/40"></div>
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Conhecimentos Específicos</span>
                  </div>
                  <div className="text-sm font-medium text-text-main leading-relaxed pl-3.5 border-l border-border group-hover/item:border-secondary transition-colors">
                    {(() => {
                      const topic = todayTask.specificTopic;
                      if (!topic) return "Nenhum tópico definido";
                      const parts = topic.split(':');
                      if (parts.length > 1) {
                        return <><span className="font-black text-secondary">{parts[0]}:</span> {parts.slice(1).join(':')}</>;
                      }
                      return topic;
                    })()}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-bg p-2.5 rounded-xl text-text-sub">
                      <PenTool className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[8px] font-bold text-text-sub uppercase tracking-[0.1em]">Questões</div>
                      <div className="text-xs font-black text-text-main">{todayTask.questionGoal} itens</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-bg p-2.5 rounded-xl text-text-sub">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[8px] font-bold text-text-sub uppercase tracking-[0.1em]">Revisão Ativa</div>
                      <div className="text-xs font-black text-text-main line-clamp-1">{todayTask.revisionTask}</div>
                    </div>
                  </div>
                </div>

                <Link 
                  to="/cronograma"
                  className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 whitespace-nowrap"
                >
                  Continuar Plano
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {!isDefaultContest && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Geral Card */}
          <div className="bg-white border border-border rounded-3xl p-6 space-y-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-text-main">Geral</h3>
                <p className="text-[10px] font-bold text-text-sub uppercase tracking-wider">Conhecimentos Gerais</p>
              </div>
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-text-sub line-clamp-1">{generalSubjects.map(s => s.name).join(', ')}</p>
            
            <div className="space-y-4 pt-1">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] font-bold text-text-sub uppercase tracking-wider mb-1">Progresso Total</div>
                  <div className="text-2xl font-black text-primary">{generalProgress.percent}%</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-text-sub uppercase tracking-wider mb-1">Concluídos</div>
                  <div className="text-sm font-bold text-text-main">{generalProgress.completed}/{generalProgress.total}</div>
                </div>
              </div>
              <div className="progress-bar h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${generalProgress.percent}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-text-sub uppercase tracking-wider pt-1">
                <span>Revisões: {generalProgress.revPercent}%</span>
                <span>Questões: {generalProgress.quesPercent}%</span>
              </div>
            </div>
          </div>

          {/* Técnico Card */}
          <div className="bg-dark-panel rounded-3xl p-6 space-y-5 shadow-xl text-white">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-white">Técnico</h3>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Conhecimentos Específicos</p>
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-white/60 line-clamp-1">{specificSubjects.map(s => s.name).join(', ')}</p>
            
            <div className="space-y-4 pt-1">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Progresso Total</div>
                  <div className="text-2xl font-black text-accent">{specificProgress.percent}%</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Concluídos</div>
                  <div className="text-sm font-bold text-white">{specificProgress.completed}/{specificProgress.total}</div>
                </div>
              </div>
              <div className="progress-bar h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${specificProgress.percent}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-wider pt-1">
                <span>Revisões: {specificProgress.revPercent}%</span>
                <span>Questões: {specificProgress.quesPercent}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-border p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="text-xs font-bold text-text-sub uppercase tracking-wider">Meta Tempo Estudado</div>
          <div className="text-3xl font-bold text-text-main flex items-baseline gap-2">
            {contest.dailyGoalHours || 2}h
            {debt.hours > 0 && <span className="text-xs text-red-500 font-black">+{debt.hours}h ATRASO</span>}
          </div>
          <p className="text-[11px] text-text-sub">Planejado para hoje</p>
        </div>

        <div className="bg-white border border-border p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="text-xs font-bold text-text-sub uppercase tracking-wider">Meta Questões</div>
          <div className="text-3xl font-bold text-text-main flex items-baseline gap-2">
            {todayTask?.questionGoal || contest.dailyGoalQuestions || 20}
            {debt.questions > 0 && <span className="text-xs text-red-500 font-black">+{debt.questions} ATRASO</span>}
          </div>
          <p className="text-[11px] text-text-sub">Foco em resolução</p>
        </div>

        <div className="bg-white border border-border p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="text-xs font-bold text-text-sub uppercase tracking-wider">Streak Atual</div>
          <div className="text-3xl font-bold text-primary flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            0 Dias
          </div>
          <p className="text-[11px] text-text-sub">Sua constância é a chave</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-card-bg border border-border rounded-2xl overflow-hidden shadow-sm lg:col-span-2">
          <div className="p-6 border-b border-border flex justify-between items-center bg-gray-50/50">
            <h2 className="font-bold text-text-main text-base uppercase tracking-tight">Matérias com maior peso</h2>
            <span className="bg-accent-bg text-primary px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest">IA Insight</span>
          </div>
          <div className="divide-y divide-border">
            {prioritySubjects.map((sub) => (
              <div key={sub.id} className="p-4 hover:bg-bg-accent/30 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    sub.category === 'Gerais' ? "bg-primary" : "bg-text-sub"
                  )}></div>
                  <h4 className="font-medium text-text-main text-sm">{sub.name}</h4>
                </div>
                <div className="flex items-center gap-6">
                   <span className={cn(
                    "text-[9px] px-2 py-0.5 rounded font-bold uppercase",
                    sub.incidence === 'Muito Alta' ? "bg-red-500 text-white" : 
                    sub.incidence === 'Alta' ? "bg-orange-500 text-white" :
                    "bg-accent text-white"
                   )}>
                    {sub.incidence}
                   </span>
                   <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-dark-panel p-6 rounded-2xl text-white flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Award className="w-20 h-20" />
          </div>
          <div className="relative z-10">
            <h4 className="text-lg font-bold mb-2">Treinamento com IA</h4>
            <p className="text-sm opacity-70 leading-relaxed">
              Gere simulados personalizados focados apenas nos tópicos que você ainda não dominou.
            </p>
          </div>
          <div className="mt-8 relative z-10">
            <Link 
              to="/microaprendizado" 
              className="w-full bg-white text-dark-panel py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-all border-none"
            >
              Praticar Agora
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

const SidebarItem = ({ to, icon: Icon, label, active, collapsed }: { to: string, icon: any, label: string, active?: boolean, collapsed?: boolean }) => (
  <Link 
    to={to} 
    className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative text-sm font-medium",
      active ? "bg-accent-bg text-primary" : "text-text-sub hover:bg-gray-100 hover:text-text-main"
    )}
  >
    <Icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-text-sub group-hover:text-text-main")} />
    {!collapsed && <span>{label}</span>}
  </Link>
);

// App Component
export default function App() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [contests, setContests] = useState<Contest[]>(CONTESTS);
  const [currentContest, setCurrentContest] = useState<Contest | null>(CONTESTS[0] || null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [migrated, setMigrated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Restore currentContest from profile
  useEffect(() => {
    if (profile?.currentContestId && contests.length > 0) {
      const saved = contests.find(c => c.id === profile.currentContestId);
      if (saved) {
        setCurrentContest(saved);
      }
    }
  }, [profile, contests]);

  // Firestore Sync & Migration
  useEffect(() => {
    if (!user) return;

    const contestsRef = collection(db, 'users', user.uid, 'contests');
    const q = query(contestsRef);
    
    // One-time migration from LocalStorage to Firestore
    const migrateData = async () => {
      if (migrated) return;
      const saved = localStorage.getItem('dynamicContests');
      if (saved) {
        try {
          const localContests = JSON.parse(saved) as Contest[];
          const remaining: Contest[] = [];
          
          for (const c of localContests) {
            try {
              const docRef = doc(db, 'users', user.uid, 'contests', c.id);
              // Ensure we don't send string dates to timestamp fields
              const contestData = { ...c };
              delete (contestData as any).createdAt;
              delete (contestData as any).updatedAt;

              await setDoc(docRef, { 
                ...contestData, 
                ownerId: user.uid, 
                createdAt: serverTimestamp(), 
                updatedAt: serverTimestamp() 
              }, { merge: true });
            } catch (itemError) {
              console.error("Failed to migrate item:", c.id, itemError);
              remaining.push(c);
            }
          }
          
          if (remaining.length === 0) {
            localStorage.removeItem('dynamicContests');
          } else {
            localStorage.setItem('dynamicContests', JSON.stringify(remaining));
          }
        } catch (e) {
          console.error("Migration error:", e);
        }
      }
      setMigrated(true);
    };
    migrateData();

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbContests = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          subjects: data.subjects || [],
          schedule: data.schedule || []
        } as Contest;
      });
      const allContests = [...CONTESTS];
      
      dbContests.forEach(dbC => {
        const index = allContests.findIndex(c => c.id === dbC.id);
        if (index > -1) {
          allContests[index] = dbC;
        } else {
          allContests.push(dbC);
        }
      });

      setContests(allContests);
      
      // Auto-set current contest if not set or if current one was updated
      if (currentContest) {
        const updated = allContests.find(c => c.id === currentContest.id);
        if (updated) {
          setCurrentContest(updated);
        } else {
          // Current contest was deleted, switch to first available or null
          const next = allContests.length > 0 ? allContests[0] : null;
          setCurrentContest(next);
          if (user) {
            const userRef = doc(db, 'users', user.uid);
            updateDoc(userRef, { currentContestId: next?.id || null }).catch(console.error);
          }
        }
      } else if (allContests.length > 0) {
        // No current contest set but we have contests, set the first one
        setCurrentContest(allContests[0]);
      }
    });

    return () => unsubscribe();
  }, [user, migrated]);

  const handleImportEdital = async (newContest: Contest) => {
    if (!user) return;
    try {
      const contestId = `dynamic-${Date.now()}`;
      const docRef = doc(db, 'users', user.uid, 'contests', contestId);
      const contestToSave = { 
        ...newContest, 
        id: contestId, 
        ownerId: user.uid, 
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp() 
      };
      await setDoc(docRef, contestToSave);
      
      // Update local state immediately to ensure UI refresh
      setContests(prev => {
        const index = prev.findIndex(c => c.id === contestId);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = contestToSave;
          return updated;
        }
        return [...prev, contestToSave];
      });
      setCurrentContest(contestToSave);
      
      // Update profile with last selected contest
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { currentContestId: contestId });
    } catch (err) {
      console.error("Erro ao salvar edital:", err);
    }
  };

  const handleUpdateContest = async (updatedContest: Contest) => {
    if (!user) return;
    
    try {
      const docRef = doc(db, 'users', user.uid, 'contests', updatedContest.id);
      
      const payload: any = { 
        ...updatedContest, 
        ownerId: user.uid,
        updatedAt: serverTimestamp(),
      };

      if (!updatedContest.createdAt) {
        payload.createdAt = serverTimestamp();
      }

      await setDoc(docRef, payload, { merge: true });

      // Ensure profile knows this is the current one
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { currentContestId: updatedContest.id });

    } catch (err) {
      console.error("Erro ao atualizar progresso:", err);
    }
  };

  const handleDeleteContest = async (id: string) => {
    if (!user) return;
    try {
      // Optimistic update
      setContests(prev => prev.filter(c => c.id !== id));
      if (currentContest?.id === id) {
        setCurrentContest(null);
      }

      const docRef = doc(db, 'users', user.uid, 'contests', id);
      await deleteDoc(docRef);
      
      // Also clean up from local storage if it's still there (prevents ghost items)
      const saved = localStorage.getItem('dynamicContests');
      if (saved) {
        const localContests = JSON.parse(saved) as Contest[];
        const filtered = localContests.filter(c => c.id !== id);
        if (filtered.length === 0) {
          localStorage.removeItem('dynamicContests');
        } else {
          localStorage.setItem('dynamicContests', JSON.stringify(filtered));
        }
      }
      
      alert("Cargo removido com sucesso!");
    } catch (err) {
      console.error("Erro ao deletar cargo:", err);
      // Revert optimism if needed (onSnapshot will actually handle this anyway)
      alert("Erro ao remover cargo. Verifique sua conexão ou permissões.");
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg dark:bg-bg gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div className="text-[10px] font-black text-text-sub uppercase tracking-widest animate-pulse">Sincronizando com a Nuvem...</div>
      </div>
    );
  }

  if (!user) return <Landing />;

  return (
    <div className="flex min-h-screen bg-bg font-sans overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className={cn(
        "bg-sidebar border-r border-border transition-all duration-300 z-50 fixed md:relative h-full flex flex-col shrink-0",
        isSidebarOpen ? "w-60 px-6 py-8" : "w-16 px-2 py-8"
      )}>
        <div className="mb-12">
          {isSidebarOpen ? (
            <div className="text-primary font-extrabold text-lg tracking-tighter">CONCURSEIRO.PRO</div>
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg mx-auto flex items-center justify-center text-white font-black">C</div>
          )}
        </div>

        <div className="space-y-8 flex-grow">
          <div>
            {isSidebarOpen && <span className="block text-[10px] font-bold text-text-sub uppercase tracking-wider mb-4">Estudos</span>}
            <nav className="space-y-1">
              <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} collapsed={!isSidebarOpen} />
              <SidebarItem to="/materias" icon={BookOpen} label="Matérias" active={location.pathname === '/materias'} collapsed={!isSidebarOpen} />
              <SidebarItem to="/cronograma" icon={Calendar} label="Cronograma" active={location.pathname === '/cronograma'} collapsed={!isSidebarOpen} />
              <SidebarItem to="/comunidade" icon={Users} label="Comunidade" active={location.pathname === '/comunidade'} collapsed={!isSidebarOpen} />
              <SidebarItem to="/microaprendizado" icon={BrainCircuit} label="Microaprendizado" active={location.pathname === '/microaprendizado'} collapsed={!isSidebarOpen} />
            </nav>
          </div>

          <div>
            {isSidebarOpen && <span className="block text-[10px] font-bold text-text-sub uppercase tracking-wider mb-4">Configuração</span>}
            <nav className="space-y-1">
              <SidebarItem to="/configuracoes" icon={Settings} label="Importar Edital" active={location.pathname === '/configuracoes'} collapsed={!isSidebarOpen} />
            </nav>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-border">
          <button 
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2 text-text-sub hover:text-red-500 transition-colors text-sm font-medium w-full"
          >
            <LogOut className="w-4 h-4" />
            {isSidebarOpen && <span>Sair da conta</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto bg-bg">
        <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md px-10 py-6 flex items-center justify-between border-b border-border/50">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-text-sub"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-card-bg rounded-lg transition-colors text-text-sub"
              title="Alternar Tema"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-4">
              {user.photoURL && (
                <img src={user.photoURL} className="w-8 h-8 rounded-full border border-border" referrerPolicy="no-referrer" alt="Profile" />
              )}
              <div className="hidden sm:block">
                <div className="text-[10px] text-text-sub font-bold uppercase tracking-widest leading-none mb-1">Bem-vindo,</div>
                <div className="text-xs font-bold text-text-main leading-none">{user.displayName || user.email}</div>
              </div>
              <div className="flex items-center gap-2 pl-4 border-l border-border">
                <div className="text-[10px] text-text-sub font-bold uppercase tracking-widest">Cargo:</div>
                <select 
                  value={currentContest?.id || ''}
                  onChange={(e) => {
                    const contest = contests.find(c => c.id === e.target.value);
                    if (contest) setCurrentContest(contest);
                  }}
                  className="bg-white dark:bg-card-bg border border-border rounded-lg px-3 py-1.5 text-[11px] font-bold focus:ring-2 ring-primary/20 transition-all outline-none text-text-main cursor-pointer hover:border-primary/50 shadow-sm"
                >
                  {contests.length === 0 && <option value="">Nenhum cargo</option>}
                  {contests.map(c => (
                    <option key={c.id} value={c.id}>{c.role}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <Routes location={location}>
              <Route path="/" element={<Dashboard contest={currentContest || { id: 'empty', name: '', role: '', examDate: '', subjects: [] }} onUpdate={handleUpdateContest} />} />
              <Route path="/materias" element={currentContest ? <Subjects contest={currentContest} onUpdate={handleUpdateContest} /> : <div className="p-20 text-center text-text-sub">Importe um edital primeiro</div>} />
              <Route path="/microaprendizado" element={currentContest ? <Microlearning contest={currentContest} /> : <div className="p-20 text-center text-text-sub">Importe um edital primeiro</div>} />
              <Route path="/configuracoes" element={<Configuracoes onImport={handleImportEdital} currentContest={currentContest} contests={contests} onDelete={handleDeleteContest} />} />
              <Route path="/cronograma" element={currentContest ? <Cronograma contest={currentContest} onUpdate={handleUpdateContest} /> : <div className="p-20 text-center text-text-sub">Importe um edital primeiro</div>} />
              <Route path="/comunidade" element={<Comunidade onImport={handleImportEdital} />} />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
