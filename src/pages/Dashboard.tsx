import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  ShieldCheck, 
  Calendar, 
  ChevronRight, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Target,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Contest, Subject } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface DashboardProps {
  contest: Contest;
  onUpdate: (contest: Contest) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ contest, onUpdate }) => {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showLogModal, setShowLogModal ] = useState(false);
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

  const calculateProgress = (subs: Subject[]) => {
    const total = subs.reduce((acc, s) => acc + s.totalTopics, 0);
    const completed = subs.reduce((acc, s) => acc + (s.topics?.filter(t => t.completed).length || 0), 0);
    return { 
      total, 
      completed, 
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };

  const prioritySubjects = [...(contest?.subjects || [])]
    .sort((a, b) => {
      const weights = { 'Muito Alta': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };
      return weights[b.incidence] - weights[a.incidence];
    })
    .slice(0, 3);

  const calculateDetailedProgress = (subs: Subject[]) => {
    const total = subs.reduce((acc, s) => acc + s.totalTopics, 0);
    const completed = subs.reduce((acc, s) => acc + (s.topics?.filter(t => t.completed).length || 0), 0);
    return { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const generalProgress = calculateDetailedProgress(contest?.subjects?.filter(s => s.incidence === 'Média' || s.incidence === 'Baixa') || []);
  const technicalProgress = calculateDetailedProgress(contest?.subjects?.filter(s => s.incidence === 'Muito Alta' || s.incidence === 'Alta') || []);
  const totalProgress = calculateDetailedProgress(contest?.subjects || []);

  // Quick Metrics Calculations
  const totalHours = contest?.dailyHistory?.reduce((acc, curr) => acc + curr.hours, 0) || 0;
  const totalQuestions = contest?.dailyHistory?.reduce((acc, curr) => acc + curr.questions, 0) || 0;
  const calculateStreak = () => {
    if (!contest?.dailyHistory || contest.dailyHistory.length === 0) return 0;
    const history = [...contest.dailyHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let streak = 0;
    const todayDate = new Date();
    const today = todayDate.toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];
    let currentCheckDate = new Date(todayDate);
    
    const hasToday = history.find(h => h.date === today && (h.hours > 0 || h.questions > 0));
    if (!hasToday) {
       const hasYesterday = history.find(h => h.date === yesterday && (h.hours > 0 || h.questions > 0));
       if (!hasYesterday) return 0;
       currentCheckDate = new Date(yesterdayDate);
    }
    
    for (let i = 0; i < 365; i++) {
       const dateStr = currentCheckDate.toISOString().split('T')[0];
       const entry = history.find(h => h.date === dateStr);
       if (entry && (entry.hours > 0 || entry.questions > 0)) {
          streak++;
          currentCheckDate.setDate(currentCheckDate.getDate() - 1);
       } else {
          break;
       }
    }
    return streak;
  };
  const streakDays = calculateStreak();

  const todayTask = contest?.schedule?.find(day => !day.completed);
  const isDefaultContest = !contest || !contest.ownerId;
  const todayHistory = contest?.dailyHistory?.find(h => h.date === new Date().toISOString().split('T')[0]);

  const handleSavePerformance = () => {
    if (!contest) return;

    let newSchedule = contest.schedule;
    if (todayTask) {
      newSchedule = contest.schedule?.map(day => {
        if (day.id === todayTask.id) {
          return {
            ...day,
            completed: true,
            actualHours: typeof logForm.hours === 'number' ? logForm.hours : 0,
            actualQuestions: typeof logForm.questions === 'number' ? logForm.questions : 0
          };
        }
        return day;
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const newHistoryEntry = { 
      date: today, 
      hours: typeof logForm.hours === 'number' ? logForm.hours : 0, 
      questions: typeof logForm.questions === 'number' ? logForm.questions : 0 
    };

    let newHistory = contest.dailyHistory ? [...contest.dailyHistory] : [];
    const existingIndex = newHistory.findIndex(h => h.date === today);
    
    if (existingIndex >= 0) {
      newHistory[existingIndex] = {
         ...newHistory[existingIndex],
         hours: newHistory[existingIndex].hours + newHistoryEntry.hours,
         questions: newHistory[existingIndex].questions + newHistoryEntry.questions,
      };
    } else {
      newHistory.push(newHistoryEntry);
    }

    onUpdate({ 
      ...contest, 
      schedule: newSchedule,
      dailyHistory: newHistory 
    });
    
    setShowLogModal(false);
    setLogForm({ hours: '', questions: '' });
  };

  if (isDefaultContest) {
    return (
      <section className="rise-card p-10 md:p-20 text-center space-y-10 border border-border bg-white flex flex-col items-center shadow-sm">
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center text-primary shadow-xl"
        >
          <Sparkles className="w-12 h-12" />
        </motion.div>
        <div className="space-y-6">
          <h2 className="text-3xl md:text-5xl font-display text-text-main tracking-tight font-bold italic">
             Ativar <span className="text-primary">Planejamento</span>
          </h2>
          <p className="text-text-sub max-w-lg mx-auto text-sm md:text-base font-medium leading-relaxed">
            Importe seu edital para começar sua jornada de aprovação. Nossa tecnologia estruturará tudo para você.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-md">
          <Link to="/configuracoes" className="flex-1 bg-primary text-white py-4 rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-lg">
            IMPORTAR EDITAL
          </Link>
          <Link to="/comunidade" className="flex-1 bg-white border border-border text-text-main px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-all">
            COMUNIDADE
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <header className="space-y-0.5">
        <div className="flex items-center gap-2 mb-0.5">
           <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]"></div>
           <span className="text-[10px] font-bold uppercase tracking-widest text-text-sub">Resumo de Estudos</span>
        </div>
        <h2 className="text-xl md:text-2xl font-display text-text-main tracking-tight font-bold">
          Olá, <span className="text-primary">{user?.displayName?.split(' ')[0] || 'Estudante'}</span>
        </h2>
        <div className="flex justify-between items-end mt-2">
          <div className="space-y-1">
            <p className="text-text-sub text-xs font-medium">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {todayHistory && (todayHistory.hours > 0 || todayHistory.questions > 0) && (
              <div className="flex gap-3 text-xs font-bold text-text-sub">
                {todayHistory.hours > 0 && <span><Clock className="w-3.5 h-3.5 inline mr-1 text-primary"/>{todayHistory.hours}h</span>}
                {todayHistory.questions > 0 && <span><Target className="w-3.5 h-3.5 inline mr-1 text-secondary"/>{todayHistory.questions}q</span>}
              </div>
            )}
          </div>
          <button 
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:underline hover:bg-primary/5 px-2 py-1.5 rounded-lg transition-all"
          >
            <Sparkles className="w-4 h-4" /> Registrar Hoje
          </button>
        </div>
      </header>


      {/* Main Countdown Card */}
      <div className="rise-card bg-primary text-white p-6 md:p-8 relative overflow-hidden shadow-lg border-none rounded-3xl group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary/90 transition-transform duration-700 group-hover:scale-105"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 blur-3xl rounded-full"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/20 blur-3xl rounded-full"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
          <div className="text-center md:text-left space-y-1 md:flex-1 w-full">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white mb-2">
              <Calendar className="w-3 h-3" />
              Data da Prova
            </div>
            <h2 className="text-xl md:text-2xl font-display tracking-tight font-bold text-white shadow-sm">{contest.name}</h2>
          </div>
          
          <div className="flex justify-center items-center gap-4 md:gap-6 bg-black/10 p-4 md:p-5 rounded-2xl border border-white/10 backdrop-blur-sm w-full md:w-auto">
            {[
              { label: 'DIAS', value: timeLeft.days },
              { label: 'HORAS', value: timeLeft.hours },
              { label: 'MIN', value: timeLeft.minutes },
              { label: 'SEG', value: timeLeft.seconds }
            ].map((unit, i) => (
              <div key={i} className="text-center min-w-[3.5rem] md:min-w-[4rem]">
                <div className="text-3xl md:text-4xl font-display tracking-tighter font-black text-white">{unit.value}</div>
                <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/60 mt-1">{unit.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        {[
          { label: 'Evolução', value: `${totalProgress.percent}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
          { label: 'Sequência', value: `${streakDays} dias`, icon: Target, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
          { label: 'Horas', value: `${totalHours}h`, icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
          { label: 'Questões', value: totalQuestions, icon: CheckCircle2, color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' }
        ].map((metric, i) => (
          <div key={i} className="rise-card p-2 md:p-3 flex items-center gap-2 md:gap-3 border border-border bg-white shadow-sm hover:border-primary/30 transition-all">
            <div className={cn("w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 border", metric.color, metric.bg, metric.border)}>
              <metric.icon className="w-3.5 h-3.5 md:w-5 md:h-5" />
            </div>
            <div className="overflow-hidden">
               <div className="text-[9px] md:text-[10px] font-bold text-text-sub uppercase tracking-widest">{metric.label}</div>
               <div className="text-xs md:text-base font-display font-bold text-text-main leading-tight">{metric.value}</div>
            </div>
          </div>
        ))}
      </div>


      {/* Progress Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
           <h3 className="text-xs font-display text-text-main uppercase font-bold tracking-wider flex items-center gap-2">
              <div className="w-1 h-3 bg-primary rounded-full"></div>
              Progresso
           </h3>
           <Link to="/materias" className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1 hover:underline">
             Detalhes <ChevronRight className="w-3 h-3" />
           </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link to="/materias" className="rise-card p-4 space-y-3 relative border border-border hover:border-primary/30 transition-all group">
            <div className="flex items-center justify-between">
                <div className="w-8 h-8 bg-slate-50 dark:bg-white/5 rounded-lg flex items-center justify-center text-primary border border-border">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/5 px-2 py-1 rounded-full border border-primary/10">Base</div>
            </div>
            <div className="space-y-2">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-display font-bold text-text-main">Básicas</h4>
                  <p className="text-[10px] font-medium text-text-sub">Matérias base do edital.</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-text-sub uppercase">Progresso</span>
                    <span className="text-base font-display text-text-main font-bold">{generalProgress.percent}%</span>
                  </div>
                  <div className="w-full h-1 bg-white rounded-full overflow-hidden border border-border">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${generalProgress.percent}%` }} className="h-full bg-primary rounded-full" />
                  </div>
                </div>
            </div>
          </Link>

          <Link to="/materias" className="rise-card p-4 space-y-3 relative border border-border hover:border-secondary/30 transition-all group">
            <div className="flex items-center justify-between">
                <div className="w-8 h-8 bg-slate-50 dark:bg-white/5 rounded-lg flex items-center justify-center text-secondary border border-border">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-secondary uppercase tracking-wider bg-secondary/5 px-2 py-1 rounded-full border border-secondary/10">Foco</div>
            </div>
            <div className="space-y-2">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-display font-bold text-text-main">Específicas</h4>
                  <p className="text-[10px] font-medium text-text-sub">Peso maior na nota final.</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-text-sub uppercase">Progresso</span>
                    <span className="text-base font-display text-text-main font-bold">{technicalProgress.percent}%</span>
                  </div>
                  <div className="w-full h-1 bg-white rounded-full overflow-hidden border border-border">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${technicalProgress.percent}%` }} className="h-full bg-secondary rounded-full" />
                  </div>
                </div>
            </div>
          </Link>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Today's Task */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-text-sub uppercase tracking-widest px-1 flex items-center gap-2">
             <div className="w-1 h-3 bg-primary rounded-full"></div>
             Meta de Hoje
          </h3>
          <div className="rise-card p-4 md:p-6 flex flex-col items-center text-center space-y-5 bg-gradient-to-b from-white to-slate-50 border border-border shadow-sm">
            {todayTask ? (
              <div className="space-y-4 w-full">
                <div className="space-y-3 w-full">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-text-sub">Planejamento para agora</p>
                  
                  <div className="space-y-2 text-left w-full">
                    {todayTask.generalTopic && (
                      <div className="p-3 bg-white rounded-xl border border-border/60 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-colors">
                         <span className="text-[8px] font-bold uppercase text-text-sub tracking-widest flex items-center gap-1.5 mb-1 opacity-70">
                            <div className="w-1 h-1 bg-slate-400 rounded-full" /> Geral
                         </span>
                         <div className="text-[11px] font-bold text-text-main leading-tight line-clamp-2">{todayTask.generalTopic}</div>
                      </div>
                    )}

                    {todayTask.specificTopic && (
                      <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 shadow-sm relative overflow-hidden group hover:bg-primary/10 transition-colors">
                         <span className="text-[8px] font-bold uppercase text-primary tracking-widest flex items-center gap-1.5 mb-1">
                            <div className="w-1 h-1 bg-primary rounded-full" /> Específico
                         </span>
                         <div className="text-xs font-bold text-text-main leading-tight italic line-clamp-2">{todayTask.specificTopic}</div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Link to="/cronograma" className="flex-1 bg-white border border-border text-text-main py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-all text-center flex items-center justify-center gap-2 shadow-sm">
                    Ver Ciclos <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button 
                    onClick={() => setShowLogModal(true)}
                    className="flex-1 bg-primary text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Registrar
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 space-y-5 flex flex-col items-center w-full">
                <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent mx-auto">
                   <Target className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-text-main tracking-tight">Missão Cumprida!</p>
                  <p className="text-sm text-text-sub italic">Você finalizou todos os objetivos previstos.</p>
                </div>
                <div className="flex gap-2 w-full max-w-[200px] mt-4">
                  <button onClick={() => setShowLogModal(true)} className="flex-1 bg-primary text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-sm flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5"/> Registrar
                  </button>
                  <Link to="/cronograma" className="flex-1 bg-slate-100 text-text-main py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-all text-center flex items-center justify-center">
                    Ver Ciclos
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Priority Subjects (Metrics) */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-text-sub uppercase tracking-widest px-1 flex items-center gap-2">
             <div className="w-1 h-3 bg-secondary rounded-full"></div>
             Focar Mais
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {prioritySubjects.map((sub, idx) => {
              const progress = calculateDetailedProgress([sub]);
              return (
                <Link key={idx} to="/materias" className="rise-card p-3 flex items-center justify-between border border-border bg-white hover:border-secondary/30 transition-all">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-border",
                      sub.incidence === 'Muito Alta' ? "bg-red-500/10 text-red-500" : "bg-secondary/10 text-secondary"
                    )}>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-text-sub uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        {sub.incidence} <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span> {sub.category}
                      </div>
                      <div className="text-xs font-bold text-text-main whitespace-normal break-words tracking-tight">{sub.name}</div>
                    </div>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <div className="text-sm md:text-base font-display font-bold text-text-main leading-none">{progress.percent}%</div>
                    <div className="text-[10px] font-bold text-text-sub uppercase tracking-widest mt-0.5">Domínio</div>
                  </div>
                </Link>
              );
            })}
             
              <div className="grid grid-cols-2 gap-2 mt-1">
                 <Link to="/microaprendizado" className="rise-card p-2 text-center border-border/60 hover:border-primary/40 transition-all flex flex-col items-center gap-1">
                   <Sparkles className="w-3 h-3 text-primary" />
                   <span className="text-[10px] font-bold text-text-main uppercase tracking-widest">Revisão</span>
                 </Link>
                 <Link to="/comunidade" className="rise-card p-2 text-center border-border/60 hover:border-accent/40 transition-all flex flex-col items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-accent" />
                    <span className="text-[10px] font-bold text-text-main uppercase tracking-widest">Comunidade</span>
                 </Link>
              </div>
          </div>
        </div>

      </div>

      {/* Log Modal */}
      <AnimatePresence>
        {showLogModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="rise-card w-full max-w-sm p-8 bg-white dark:bg-zinc-900 border border-border space-y-8"
            >
              <div className="text-center space-y-2">
                 <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto text-primary mb-2">
                    <TrendingUp className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-display font-bold text-text-main">Registrar Evolução</h3>
                 <p className="text-xs text-text-sub">Insira os dados da sua sessão de estudos.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Carga Horária (h)</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-border rounded-xl py-3 px-4 text-sm font-bold text-text-main outline-none focus:ring-2 ring-primary/20" 
                    value={logForm.hours} 
                    onChange={(e) => setLogForm({...logForm, hours: e.target.value === '' ? '' : Number(e.target.value)})} 
                    placeholder="Ex: 2.5"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Questões Resolvidas</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-border rounded-xl py-3 px-4 text-sm font-bold text-text-main outline-none focus:ring-2 ring-primary/20" 
                    value={logForm.questions} 
                    onChange={(e) => setLogForm({...logForm, questions: e.target.value === '' ? '' : Number(e.target.value)})} 
                    placeholder="Ex: 30"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                  <button 
                    onClick={handleSavePerformance}
                    className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110"
                  >
                    Confirmar Registro
                  </button>
                  <button onClick={() => setShowLogModal(false)} className="w-full py-2 text-xs font-bold uppercase text-text-sub hover:text-text-main transition-colors">Cancelar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
