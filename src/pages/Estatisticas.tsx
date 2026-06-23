import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  Trophy, 
  Clock, 
  Target, 
  CheckCircle2, 
  TrendingUp, 
  BookOpen, 
  Flame, 
  Brain, 
  Layers, 
  ArrowRight,
  BookOpenCheck,
  Zap,
  AlertCircle,
  Sparkles,
  Award,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Contest } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useContestStats } from '../hooks/useContestStats';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import StudyCalendar from '../components/StudyCalendar';

interface EstatisticasProps {
  contest: Contest;
}

type TabType = 'geral' | 'mepp';

export default function Estatisticas({ contest }: EstatisticasProps) {
  const stats = useContestStats(contest);
  const { user } = useAuth();
  const { 
    overallProgress, 
    totalTopics, 
    completedTopics, 
    totalHours, 
    totalQuestions, 
    streak, 
    last7Days, 
    subjectProgress,
    meppReviews,
    totalMeppReviews,
    completedMeppReviews,
    pendingMeppReviews,
    scheduledMeppReviews,
    reviews24h,
    reviews7d,
    reviews30d,
    meppComplianceRate,
    mostProductiveDay,
    projectedCompletionDate,
    daysRemainingForCompletion,
    weeklyAverageHours,
    weeklyAverageQuestions,
    goalComplianceRate,
    totalStudiedDays
  } = stats;

  const [activeTab, setActiveTab] = useState<TabType>('geral');
  const [flashcardCount, setFlashcardCount] = useState<number>(0);
  const [dueFlashcardCount, setDueFlashcardCount] = useState<number>(0);
  const [mindmapCount, setMindmapCount] = useState<number>(0);
  const [loadingFirestoreStats, setLoadingFirestoreStats] = useState<boolean>(true);

  // Load real-time stats from firestore for flashcards and mindmaps
  useEffect(() => {
    if (!user) {
      setLoadingFirestoreStats(false);
      return;
    }

    const qCards = query(collection(db, 'users', user.uid, 'flashcards'));
    const unsubscribeCards = onSnapshot(qCards, (snapshot) => {
      const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFlashcardCount(cards.length);

      const now = new Date();
      const due = cards.filter((card: any) => {
        if (!card.nextReview) return true;
        let reviewDate;
        if (typeof card.nextReview.toDate === 'function') {
          reviewDate = card.nextReview.toDate();
        } else {
          reviewDate = new Date(card.nextReview);
        }
        return reviewDate <= now;
      });
      setDueFlashcardCount(due.length);
      setLoadingFirestoreStats(false);
    }, (err) => {
      console.error("Error loading flashcard stats:", err);
      setLoadingFirestoreStats(false);
    });

    const qMaps = query(collection(db, 'mindmaps'), where('ownerId', '==', user.uid));
    const unsubscribeMaps = onSnapshot(qMaps, (snapshot) => {
      setMindmapCount(snapshot.docs.length);
    }, (err) => {
      console.error("Error loading mindmap stats:", err);
    });

    return () => {
      unsubscribeCards();
      unsubscribeMaps();
    };
  }, [user]);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-16 overflow-x-hidden animate-fade-in px-4 sm:px-6">
      
      {/* HEADER SECTION WITH MODERN LEADERSHIP ARCHITECTURE */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 mt-4 lg:mt-6"
      >
        <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-[0.2em]">
          <Sparkles className="w-3.5 h-3.5" /> Estatísticas estratégicas
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-text-main tracking-tight uppercase">
              DESEMPENHO GLOBAL
            </h1>
            <p className="text-xs sm:text-sm font-medium text-text-sub mt-1 max-w-2xl leading-relaxed">
              Monitore sua evolução acumulada no edital, horas líquidas registradas, resolução de simulados e o controle preditivo da curva de esquecimento.
            </p>
          </div>
          
          {/* REFINED TAB CONTROL BAR FOR ALL DEVICES */}
          <div className="flex bg-slate-100 p-1 rounded-xl sm:rounded-2xl border border-slate-200/80 self-start sm:self-center shrink-0 shadow-inner">
            <button
              onClick={() => setActiveTab('geral')}
              className={cn(
                "px-4 py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-200 flex items-center gap-2",
                activeTab === 'geral' 
                  ? "bg-white text-text-main shadow-sm border border-slate-200/40" 
                  : "text-text-sub hover:text-text-main"
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Teoria & Exercícios
            </button>
            <button
              onClick={() => setActiveTab('mepp')}
              className={cn(
                "px-4 py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-200 flex items-center gap-2",
                activeTab === 'mepp' 
                  ? "bg-white text-text-main shadow-sm border border-slate-200/40" 
                  : "text-text-sub hover:text-text-main"
              )}
            >
              <Brain className="w-3.5 h-3.5 text-indigo-500" /> Revisões & MEPP
            </button>
          </div>
        </div>
      </motion.div>

      {/* CORE STATISTIC CARDS (KPI BOXES) OVERHAULED FOR MOBILE SCALABILITY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
        <KPIBox 
          icon={Target} 
          label="Progresso Edital" 
          value={`${overallProgress}%`} 
          subtext={`${completedTopics}/${totalTopics} concluintes`}
          color="primary"
        />
        <KPIBox 
          icon={Clock} 
          label="Estudo Líquido" 
          value={`${totalHours.toFixed(1)}h`} 
          subtext="Histórico em foco"
          color="emerald"
        />
        <KPIBox 
          icon={CheckCircle2} 
          label="Exercícios Feitos" 
          value={totalQuestions} 
          subtext="Simulados & questões"
          color="blue"
        />
        <KPIBox 
          icon={Flame} 
          label="Ofensiva ativa" 
          value={`${streak}d`} 
          subtext={`Estudou ${totalStudiedDays} dias no total`}
          color="amber"
        />
      </div>

      {/* CORE STATS RENDER BASED ON ACTIVE PILL WITH FADE ANIMATION */}
      <AnimatePresence mode="wait">
        {activeTab === 'geral' ? (
          <motion.div
            key="geral"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 lg:space-y-8"
          >
            {/* ROADMAP ESTILO GITHUB (MAPA DE CONSISTÊNCIA) */}
            <StudyCalendar dailyHistory={contest.dailyHistory || []} streak={streak} />

            {/* BENTO GRID DE INSIGHTS E MÉTRICAS DE ESPECIALISTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
              
              {/* Projeção de Edital */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-900/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/10">
                    Projeção IA
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] font-black uppercase tracking-wider text-indigo-200">Previsão Conclusão</span>
                  <span className="text-sm font-black tracking-tight block mt-1 leading-none">{projectedCompletionDate}</span>
                  {daysRemainingForCompletion > 0 && (
                    <span className="block text-[8px] text-indigo-300/80 font-semibold mt-1">Faltam aprox. {daysRemainingForCompletion} dias de estudo</span>
                  )}
                </div>
              </div>

              {/* Dia de Alta Performance */}
              <div className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-amber-50 text-amber-500 rounded-lg border border-amber-100">
                    <Award className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                    Ritmo
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] font-black uppercase tracking-wider text-text-sub">Dia Mais Produtivo</span>
                  <span className="text-base font-black text-text-main mt-1 block leading-none">{mostProductiveDay}</span>
                  <span className="block text-[8px] text-text-sub/80 font-semibold mt-1">Maior acúmulo de horas focadas</span>
                </div>
              </div>

              {/* Frequência de Metas */}
              <div className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-blue-50 text-blue-500 rounded-lg border border-blue-100">
                    <Target className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    Meta
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] font-black uppercase tracking-wider text-text-sub">Aderência à Meta</span>
                  <span className="text-base font-black text-text-main mt-1 block leading-none">{goalComplianceRate}% de sucesso</span>
                  <span className="block text-[8px] text-text-sub/80 font-semibold mt-1">Dias com foco ≥ meta diária</span>
                </div>
              </div>

              {/* Médias Semanais */}
              <div className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg border border-emerald-100">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    Médias
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] font-black uppercase tracking-wider text-text-sub">Média Semanal</span>
                  <span className="text-base font-black text-text-main mt-1 block leading-none">{weeklyAverageHours}h e {weeklyAverageQuestions}q</span>
                  <span className="block text-[8px] text-text-sub/80 font-semibold mt-1">Média líquida diária recente</span>
                </div>
              </div>

            </div>

            {/* STUDY & RETENTION GRAPHS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Evolution area chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-slate-50 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-text-main uppercase tracking-wider">
                        Investimento em Tempo de Foco
                      </h3>
                      <p className="text-[10px] text-text-sub font-semibold uppercase tracking-wider mt-0.5">
                        Horas líquidas de estudo nos últimos 7 dias
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] font-black text-emerald-600 px-2 py-1 bg-emerald-50 rounded-lg uppercase tracking-wider self-start sm:self-center">
                    Múltiplos ciclos
                  </div>
                </div>

                <div className="w-full h-[200px] sm:h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={last7Days} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorHoras" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} 
                        dy={8} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 9, fill: '#94a3b8' }} 
                        dx={-8} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: '1px solid #e2e8f0', 
                          boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.05)',
                          fontSize: '11px',
                          fontFamily: 'sans-serif'
                        }}
                        labelStyle={{ fontWeight: 'bold', color: '#334155' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="horas" 
                        name="Horas" 
                        stroke="#10b981" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#colorHoras)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Subjects progress box */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                <div className="flex items-center gap-2.5 mb-6 border-b border-slate-50 pb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-text-main uppercase tracking-wider">
                      Mapeamento de Retenção
                    </h3>
                    <p className="text-[10px] text-text-sub font-semibold uppercase tracking-wider mt-0.5">
                      Progresso por disciplinas do Edital
                    </p>
                  </div>
                </div>

                {subjectProgress.length > 0 ? (
                  <div className="w-full space-y-3.5 flex-1 flex flex-col justify-center">
                    {subjectProgress.slice(0, 4).map((subj, idx) => (
                      <div key={idx} className="w-full space-y-1">
                        <div className="flex justify-between items-center text-[10px] sm:text-xs">
                          <span className="text-text-main font-bold line-clamp-1 max-w-[70%]">{subj.name}</span>
                          <span className="text-primary font-black">{subj.percentage}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${subj.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {subjectProgress.length > 4 && (
                      <div className="text-center pt-3 border-t border-slate-100 mt-2 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-text-sub">
                        + {subjectProgress.length - 4} disciplinas cadastradas no total
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 w-full text-center py-10 text-text-sub text-xs flex flex-col items-center justify-center">
                    <BookOpen className="w-8 h-8 opacity-20 mb-3" />
                    Nenhuma disciplina registrada no momento.
                  </div>
                )}
              </div>
            </div>

            {/* BAR CHART FOR RESOLVED QUESTIONS */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
              <div className="flex items-center gap-2.5 mb-6 border-b border-slate-50 pb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-text-main uppercase tracking-wider">
                    Ritmo de Resolução de Exercícios
                  </h3>
                  <p className="text-[10px] text-text-sub font-semibold uppercase tracking-wider mt-0.5">
                    Questões fixadas por dia nos últimos 7 dias
                  </p>
                </div>
              </div>

              <div className="w-full h-[180px] sm:h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7Days} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} 
                      dy={8} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#94a3b8' }} 
                      dx={-8} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0', 
                        boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.05)',
                        fontSize: '11px'
                      }}
                      labelStyle={{ fontWeight: 'bold', color: '#334155' }}
                    />
                    <Bar dataKey="questoes" name="Questões" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="mepp"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* OVERHAULED METRIC METRICS BLOCK */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 text-white border border-indigo-950/40 relative overflow-hidden shadow-xl">
              
              {/* Absolutes and visual decoration */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                
                {/* Header card inside MEPP section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-indigo-800 rounded-xl flex items-center justify-center text-indigo-300 shadow-md">
                      <Brain className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider font-display">
                        MÉTODO MEPP & ATIVOS PREVENTIVOS
                      </h3>
                      <p className="text-[10px] text-indigo-200/80 uppercase font-semibold tracking-wider mt-0.5">
                        Blindando a memória antes do dia de sua prova
                      </p>
                    </div>
                  </div>
                  
                  {/* Action groups focused on navigation */}
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Link
                      to="/mepp"
                      className="flex-1 sm:flex-none text-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      Painel MEPP <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to="/microaprendizado"
                      className="flex-1 sm:flex-none text-center px-3.5 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-slate-100 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      Microlearning <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  
                  {/* Visual Radial Compliance section styled elegantly */}
                  <div className="md:col-span-5 flex items-center gap-5 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="38"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="7"
                          fill="transparent"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="38"
                          stroke="#818cf8"
                          strokeWidth="7"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 38}
                          strokeDashoffset={2 * Math.PI * 38 * (1 - meppComplianceRate / 100)}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-lg sm:text-xl font-black font-display text-white">{meppComplianceRate}%</span>
                        <span className="block text-[7px] font-black uppercase text-indigo-200/60 tracking-wider">Aderência</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">Retenção de Longo Prazo</h4>
                      <p className="text-[10px] text-indigo-200/70 font-semibold mt-1 leading-relaxed">
                        Taxa de tópicos cadastrados que evoluíram até a revisão consolidada de 30 dias.
                      </p>
                    </div>
                  </div>

                  {/* MEPP Numbers grid designed precisely */}
                  <div className="md:col-span-7 grid grid-cols-3 gap-2.5 sm:gap-4">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center sm:text-left">
                      <span className="block text-[8px] font-black uppercase text-indigo-300 tracking-wider">Concluídas</span>
                      <div className="text-lg sm:text-2xl font-black font-display text-emerald-400 mt-1">{completedMeppReviews}</div>
                      <span className="block text-[8px] text-slate-400 font-medium mt-0.5">Tópicos retidos</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center sm:text-left">
                      <span className="block text-[8px] font-black uppercase text-red-300 tracking-wider">Vence Hoje</span>
                      <div className="text-lg sm:text-2xl font-black font-display text-red-400 mt-1">{pendingMeppReviews}</div>
                      <span className="block text-[8px] text-slate-400 font-medium mt-0.5">Fazer agora</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center sm:text-left">
                      <span className="block text-[8px] font-black uppercase text-indigo-300 tracking-wider">Pendentes</span>
                      <div className="text-lg sm:text-2xl font-black font-display text-indigo-300 mt-1">{scheduledMeppReviews}</div>
                      <span className="block text-[8px] text-slate-400 font-medium mt-0.5">Próximos dias</span>
                    </div>
                  </div>

                </div>

                {/* Tracking active alert status flow */}
                <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-3">
                  <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center justify-between">
                    <span>Fluxo Ativo MEPP por Intervalo de Alerta</span>
                    <span className="text-[9px] text-indigo-400/90 font-bold">{totalMeppReviews} tópicos agendados</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <span className="block text-[8px] font-bold uppercase text-slate-400">1º Alerta (24H)</span>
                      <div className="text-base font-black text-white">{reviews24h}</div>
                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400" style={{ width: `${totalMeppReviews > 0 ? (reviews24h / totalMeppReviews) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[8px] font-bold uppercase text-slate-400">2º Alerta (7 dias)</span>
                      <div className="text-base font-black text-white">{reviews7d}</div>
                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400" style={{ width: `${totalMeppReviews > 0 ? (reviews7d / totalMeppReviews) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[8px] font-bold uppercase text-slate-400">3º Alerta (30 dias)</span>
                      <div className="text-base font-black text-white">{reviews30d}</div>
                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400" style={{ width: `${totalMeppReviews > 0 ? (reviews30d / totalMeppReviews) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* THREE COLUMN GRID SUPPORTING PERSISTENCE METRICS (FLASHCARDS, MAPS, WARNING) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              
              {/* Flashcards metrics container */}
              <div className="bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-indigo-55/10 text-indigo-600 rounded-xl border border-indigo-100">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    Microaprendizado
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-text-main">Cartões de Memória</h4>
                  <p className="text-[10px] text-text-sub font-semibold leading-relaxed">
                    Armazenamento de Flashcards ativos criados de forma personalizada ou baixados da comunidade.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-50 flex justify-between items-center bg-slate-50/50 -mx-5 -mb-5 p-5 rounded-b-2xl">
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider font-bold text-text-sub">Total Ativos</span>
                    <span className="text-lg font-black text-text-main">{loadingFirestoreStats ? '...' : flashcardCount}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] uppercase tracking-wider font-bold text-text-sub">Revisar Hoje</span>
                    <span className={cn(
                      "text-lg font-black",
                      dueFlashcardCount > 0 ? "text-amber-500 font-bold animate-pulse" : "text-emerald-500"
                    )}>
                      {loadingFirestoreStats ? '...' : dueFlashcardCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mindmaps metrics container */}
              <div className="bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-emerald-55/10 text-emerald-600 rounded-xl border border-emerald-100">
                    <BookOpenCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    Mapas Mentais
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-text-main">Mapas Ativos</h4>
                  <p className="text-[10px] text-text-sub font-semibold leading-relaxed">
                    Diagramações conceituais para organizar ideias estruturadas gerados com nossa inteligência artificial.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-50 flex justify-between items-center bg-slate-50/50 -mx-5 -mb-5 p-5 rounded-b-2xl">
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider font-bold text-text-sub">Total Mapeado</span>
                    <span className="text-lg font-black text-text-main">{loadingFirestoreStats ? '...' : mindmapCount}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] uppercase tracking-wider font-bold text-text-sub">Acesso Ativo</span>
                    <span className="text-lg font-black text-emerald-500">Liberado</span>
                  </div>
                </div>
              </div>

              {/* Memory warning diagnose card with high visual emphasis */}
              <div className="bg-[#fefce8] border border-amber-200/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <h5 className="text-[10px] font-black uppercase tracking-wider">
                      Diagnóstico de Curva de Retenção
                    </h5>
                  </div>
                  <p className="text-[10px] font-semibold text-amber-900/80 leading-relaxed">
                    O cérebro normal descarta até 80% do que foi lido passivamente em apenas 28 dias. Para reter de verdade até a data do certame, utilize o recurso de recordação ativa.
                  </p>
                </div>

                <Link
                  to="/microaprendizado"
                  className="w-full text-center py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-1"
                >
                  Estudar Flashcards Atuais <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

/* OVERHAULED RESPONSIVE KPI BOX COMPONENT WITH MOBILE SIZE ADJUSTMENTS */
interface KPIBoxProps {
  icon: any;
  label: string;
  value: string | number;
  subtext: string;
  color: 'primary' | 'emerald' | 'blue' | 'amber';
}

function KPIBox({ icon: Icon, label, value, subtext, color }: KPIBoxProps) {
  const colorStyles = {
    primary: "text-primary bg-primary/10 border-primary/10",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/10",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/10",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/10",
  };

  return (
    <div className="bg-white p-2.5 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl lg:rounded-3xl border border-border flex items-center gap-2 sm:gap-4 transition-transform hover:-translate-y-0.5 hover:shadow-md overflow-hidden relative">
      <div className={cn("w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg sm:rounded-2xl shrink-0 border", colorStyles[color])}>
        <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
      </div>
      <div className="overflow-hidden min-w-0">
        <div className="text-base sm:text-2xl font-black text-text-main leading-none truncate">{value}</div>
        <div className="text-[8px] sm:text-[10px] font-black text-text-main uppercase tracking-widest leading-normal mt-0.5 sm:mt-1 truncate">{label}</div>
        <div className="text-[8px] sm:text-[10px] font-medium text-text-sub mt-0.5 truncate">{subtext}</div>
      </div>
    </div>
  );
}
