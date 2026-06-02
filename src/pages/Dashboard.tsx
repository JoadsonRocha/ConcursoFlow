import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  collection, 
  query, 
  orderBy,
  limit, 
  getDocs,
  DocumentData
} from 'firebase/firestore';
import { 
  BookOpen, 
  ShieldCheck, 
  Calendar, 
  ChevronRight, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Target,
  Zap,
  Star,
  CheckCircle2,
  ChevronDown,
  Plus,
  PencilLine,
  Trash2,
  PieChart,
  Users,
  Timer,
  Sparkles,
  Award,
  AlertTriangle,
  Bell,
  CheckSquare,
  Square,
  Brain,
  Play,
  Instagram,
  Laptop,
  Smartphone,
  Youtube
} from 'lucide-react';
import { SIcon } from '../components/SIcon';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Contest, Subject } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import BrandLogo from '../components/BrandLogo';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useContestStats } from '../hooks/useContestStats';
import EmptyState from '../components/EmptyState';
import ProModal from '../components/ProModal';

interface DashboardProps {
  contest: Contest;
  contests: Contest[];
  onUpdate: (contest: Contest) => void;
  onSwitchContest: (contest: Contest) => void;
  onDelete?: (id: string) => void;
}

const ContestSelectorItem = ({ 
  c, 
  currentContestId, 
  onSwitchContest, 
  onDelete, 
  onClose 
}: { 
  c: Contest, 
  currentContestId: string, 
  onSwitchContest: (c: Contest) => void, 
  onDelete?: (id: string) => void,
  onClose: () => void
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  return (
    <div className="group relative flex items-center pr-2">
      <button
        onClick={() => {
          onSwitchContest(c);
          onClose();
        }}
        className={cn(
          "flex-1 px-5 py-4 flex flex-col items-start gap-1 transition-all hover:bg-slate-50 border-l-4",
          currentContestId === c.id ? "border-primary bg-primary/5" : "border-transparent"
        )}
      >
        <span className={cn("text-[11px] font-black uppercase tracking-tight", currentContestId === c.id ? "text-primary" : "text-text-main")}>
          {c.role}
        </span>
        <span className="text-[9px] font-medium text-text-sub uppercase tracking-wider opacity-60">
          {c.name}
        </span>
      </button>
      {onDelete && (
        <div className="flex items-center">
          {confirmDelete ? (
            <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                  setConfirmDelete(false);
                }}
                className="px-2 py-1 bg-red-500 text-white text-[8px] font-bold rounded-md hover:bg-red-600"
              >
                CONFIRMAR
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(false);
                }}
                className="p-1 text-text-sub hover:text-text-main"
              >
                <Plus className="w-3 h-3 rotate-45" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
              className="p-3 text-text-sub hover:text-red-500 opacity-40 sm:opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-red-50"
              title="Excluir Edital"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ contest, contests, onUpdate, onSwitchContest, onDelete }) => {
  const { user, isPro } = useAuth();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showLogModal, setShowLogModal ] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [proFeatureName, setProFeatureName] = useState('');
  const [logForm, setLogForm] = useState<{ hours: number | '', questions: number | '' }>({ hours: '', questions: '' });
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [featuredContests, setFeaturedContests] = useState<Contest[]>([]);

  const stats = useContestStats(contest);
  const { totalHours, totalQuestions, streak: streakDays, generalProgressProps: generalProgress, specificProgressProps: technicalProgress, overallProgress, todayDayNumber, todayTask, todayHistory } = stats;

  const isDefaultContest = !contest || !contest.ownerId;

  // MEPP Method Helper
  const getTodayISOString = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const todayStrStr = getTodayISOString();
  const allReviews = contest?.meppReviews || [];
  const dueReviewsCount = allReviews.filter(r => r.dueDate <= todayStrStr && r.reviewType !== 'completed').length;

  useEffect(() => {
    async function fetchFeatured() {
      try {
        console.log("Fetching featured contests...");
        const q = query(collection(db, 'shared_contests'), orderBy('likesCount', 'desc'), limit(3));
        const snapshot = await getDocs(q);
        console.log("Snapshot size:", snapshot.size);
        setFeaturedContests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contest)));
      } catch (error) {
        console.error("Error fetching featured contests:", error);
      }
    }
    if (isDefaultContest) {
        fetchFeatured();
    }
  }, [isDefaultContest]);

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

  const prioritySubjects = [...(contest?.subjects || [])]
    .sort((a, b) => {
      const weights: any = { 'Muito Alta': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };
      return (weights[b.incidence || 'Baixa'] || 1) - (weights[a.incidence || 'Baixa'] || 1);
    })
    .slice(0, 3);

  // Quick Metrics Calculations
  const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [showSimilarityModal, setShowSimilarityModal] = useState(false);
  const [selectedContestsForComparison, setSelectedContestsForComparison] = useState<string[]>([]);

  const calculateSimilarity = (c1: Contest, c2: Contest) => {
    if (!c1 || !c2) return 0;
    
    const normalize = (s: string) => s.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/gi, '')
      .trim();

    const t1 = new Set(c1.subjects.flatMap(s => (s.topics || []).map(t => normalize(t.name))));
    const t2 = new Set(c2.subjects.flatMap(s => (s.topics || []).map(t => normalize(t.name))));
    
    if (t1.size === 0) return 0;
    
    let intersection = 0;
    t1.forEach(topic => {
      if (t2.has(topic)) intersection++;
    });
    
    return Math.round((intersection / t1.size) * 100);
  };

  /**
   * Função Principal: Registra o desempenho do dia e atualiza o progresso.
   * - Marca a tarefa do cronograma como concluída.
   * - Tenta encontrar e marcar automaticamente o tópico estudado no edital (via similaridade de texto).
   * - Inicia/Atualiza automaticamente o Ciclo de Revisão MEPP para o tópico estudado.
   * - Registra no histórico de produtividade (horas e questões).
   */
  const handleSavePerformance = async () => {
    if (!contest) return;

    let newSchedule = contest.schedule;
    let newSubjects = [...contest.subjects];

    const inputHours = typeof logForm.hours === 'number' ? logForm.hours : 0;
    const inputQuestions = typeof logForm.questions === 'number' ? logForm.questions : 0;

    if (todayTask) {
      // 1. Marcar Cronograma como feito
      newSchedule = contest.schedule?.map(day => {
        if (day.id === todayTask.id) {
          return {
            ...day,
            completed: true,
            actualHours: inputHours > 0 ? inputHours : (day.actualHours || 0),
            actualQuestions: inputQuestions > 0 ? inputQuestions : (day.actualQuestions || 0)
          };
        }
        return day;
      });

      // 2. Normalização de texto para busca inteligente de tópicos no Edital
      const normalize = (s: string) => s.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^\w\s]/gi, ' ') 
        .replace(/\s+/g, ' ') 
        .replace(/^(parte|modulo|eixo|bloco) [\div]+ /i, '')
        .trim();

      const topicsStr = [todayTask.specificTopic, todayTask.generalTopic].join(' ');
      const scheduleWords = normalize(topicsStr).split(/\s+/).filter(w => w.length > 2);
      
      // 3. Cruzamento automático: Identifica se o que foi estudado hoje corresponde a um item do Edital
      newSubjects = newSubjects.map(subject => {
        const normalizedSubjectName = normalize(subject.name);
        const normSpecific = normalize(todayTask.specificTopic || '');
        const normGeneral = normalize(todayTask.generalTopic || '');
        
        const subjectIsMentioned = 
          normalize(topicsStr).includes(normalizedSubjectName) || 
          normalizedSubjectName.includes(normSpecific) || 
          normalizedSubjectName.includes(normGeneral);

        let updatedTopics = (subject.topics || []);
        if (updatedTopics.length > 0) {
          updatedTopics = updatedTopics.map(topic => {
            if (topic.completed) return topic;
            const normalizedTopic = normalize(topic.name);
            const topicWords = normalizedTopic.split(/\s+/).filter(w => w.length > 2);
            
            const hasDirectMatch = normalize(topicsStr).includes(normalizedTopic) || normalizedTopic.includes(normalize(topicsStr));
            const matchCount = topicWords.filter(tw => scheduleWords.some(sw => sw.includes(tw) || tw.includes(sw))).length;
            const matchRatio = topicWords.length > 0 ? matchCount / topicWords.length : 0;

            // Se houver 45% de similiaridade nas palavras, marca como concluído automaticamente
            if (hasDirectMatch || matchRatio >= 0.45) {
              return { ...topic, completed: true };
            }
            return topic;
          });
        }

        let extraCompleted = subject.completedTopics || 0;
        if (subjectIsMentioned && updatedTopics.length === 0) {
          extraCompleted = Math.min(subject.totalTopics || 1, extraCompleted + 1);
        }

        return {
          ...subject,
          topics: updatedTopics,
          completedTopics: (subject.topics?.length || 0) > 0 
            ? updatedTopics.filter(t => t.completed).length 
            : extraCompleted
        };
      });
    }

    // 4. Integração Automática com Ciclo de Revisão MEPP
    // Ao finalizar o estudo no Dashboard, o sistema já agenda todas as etapas 
    // de revisão (24h, 7d, 30d) para garantir a memorização.
    let newMeppReviews = contest.meppReviews ? [...contest.meppReviews] : [];
    if (todayTask) {
      const topicName = todayTask.specificTopic || todayTask.generalTopic || "Estudo do Dia";
      const subjectSnapshot = contest.subjects.find(sub => 
        sub.topics?.some(t => t.name === todayTask.specificTopic)
      );
      const subjectName = subjectSnapshot?.name || "Geral";

      const existingReviewIdx = newMeppReviews.findIndex(r => r.topicName === topicName && r.reviewType !== 'completed');
      
      const fullStages = ['theory', 'recall', 'practice', 'errors'];

      if (existingReviewIdx === -1) {
        newMeppReviews.push({
          id: `mepp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          topicName,
          subjectName,
          createdAt: new Date().toISOString(),
          stagesCompleted: fullStages,
          dueDate: todayStrStr,
          reviewType: '24h' as const
        });
        toast.info("Ciclo de Revisão MEPP agendado com sucesso! 🧠");
      } else {
        newMeppReviews[existingReviewIdx] = {
          ...newMeppReviews[existingReviewIdx],
          stagesCompleted: fullStages
        };
      }
    }

    const today = getLocalDateStr(new Date());
    let newHistory = contest.dailyHistory ? [...contest.dailyHistory] : [];
    
    // Ensure the day counts for the streak even if hours/questions aren't manually entered
    const defaultHours = contest.dailyGoalHours || 1;
    const defaultQuestions = (todayTask?.questionGoal) || contest.dailyGoalQuestions || 5;
    
    const finalHours = inputHours > 0 ? inputHours : (todayTask && !todayTask.completed ? defaultHours : 0); 
    const finalQuestions = inputQuestions > 0 ? inputQuestions : (todayTask && !todayTask.completed ? defaultQuestions : 0);

    if (finalHours > 0 || finalQuestions > 0) {
      const existingIndex = newHistory.findIndex(h => h.date === today);
      if (existingIndex >= 0) {
        newHistory[existingIndex] = {
           ...newHistory[existingIndex],
           hours: newHistory[existingIndex].hours + inputHours,
           questions: newHistory[existingIndex].questions + inputQuestions,
        };
        // If we were just marking completion and inputs were 0, ensure the day is "active"
        if (inputHours === 0 && inputQuestions === 0 && todayTask && !todayTask.completed) {
           if (newHistory[existingIndex].hours === 0) newHistory[existingIndex].hours = defaultHours;
           if (newHistory[existingIndex].questions === 0) newHistory[existingIndex].questions = defaultQuestions;
        }
      } else {
        newHistory.push({
          date: today,
          hours: finalHours,
          questions: finalQuestions
        });
      }
    }

    onUpdate({ 
      ...contest, 
      schedule: newSchedule,
      subjects: newSubjects,
      dailyHistory: newHistory,
      meppReviews: newMeppReviews
    });
    
    if (todayTask && !todayTask.completed) {
      toast.success("Meta do dia concluída! 🔥 Sua ofensiva foi atualizada.");
    }

    setShowLogModal(false);
    setLogForm({ hours: '', questions: '' });
  };

  if (isDefaultContest) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6">
        <EmptyState featuredContests={featuredContests} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <header className="flex flex-row items-start md:items-center justify-between gap-2 md:gap-4">
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-sub truncate hidden sm:inline-block">Painel de Performance</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-sub truncate sm:hidden">Painel</span>
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-display text-text-main font-bold truncate">
            Olá, <span className="text-primary">{user?.displayName?.split(' ')[0] || 'Estudante'}</span>
          </h2>
          <p className="text-text-sub text-[10px] md:text-xs font-medium truncate">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <div className="mt-2 min-h-[16px] hidden sm:block">
            {todayHistory && (todayHistory.hours > 0 || todayHistory.questions > 0) && (
              <div className="flex gap-3 text-[10px] font-bold text-text-sub uppercase tracking-wider animate-in fade-in slide-in-from-left-2">
                {todayHistory.hours > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/5 rounded-full border border-primary/10">
                    <Clock className="w-2.5 h-2.5 text-primary"/>
                    {todayHistory.hours.toFixed(2)}h
                  </span>
                )}
                {todayHistory.questions > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-secondary/5 rounded-full border border-secondary/10">
                    <Target className="w-2.5 h-2.5 text-secondary"/>
                    {todayHistory.questions}q
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-stretch gap-2 shrink-0">
          <button 
            onClick={() => setShowLogModal(true)}
            className="flex items-center justify-center gap-2 bg-primary text-white px-3 sm:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-md shadow-primary/20 group border border-transparent"
          >
            <PencilLine className="w-4 h-4 md:w-4 md:h-4 text-white" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Registrar</span>
          </button>

          <div className="relative">
            <button 
              onClick={() => setIsSelectorOpen(!isSelectorOpen)}
              className="h-full flex items-center gap-2 md:gap-3 bg-white border border-border px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl hover:border-primary/30 transition-all shadow-sm group min-w-[140px] md:min-w-[200px] justify-between"
            >
            <div className="flex flex-col items-start text-left max-w-[100px] md:max-w-none">
              <span className="text-[8px] md:text-[9px] font-bold text-primary uppercase tracking-widest leading-none mb-1">Meus Concursos</span>
              <span className="text-[9px] md:text-[11px] font-black text-text-main uppercase tracking-tight truncate w-full">
                {contest.role || 'Selecionar Cargo'}
              </span>
            </div>
            <ChevronDown className={cn("w-3 h-3 md:w-4 md:h-4 text-text-sub flex-shrink-0 transition-transform", isSelectorOpen ? "rotate-180" : "")} />
          </button>

          <AnimatePresence>
            {isSelectorOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSelectorOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-72 bg-white border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-border bg-slate-50/50">
                    <span className="text-[10px] font-black text-text-sub uppercase tracking-[0.2em]">Trocar de Edital</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto no-scrollbar py-2">
                    {contests.length === 0 ? (
                      <div className="p-6 text-center text-xs text-text-sub font-bold uppercase italic tracking-widest">Nenhum cargo salvo</div>
                    ) : (
                      contests.map((c) => (
                        <ContestSelectorItem 
                          key={c.id} 
                          c={c} 
                          currentContestId={contest.id} 
                          onSwitchContest={onSwitchContest} 
                          onDelete={onDelete} 
                          onClose={() => setIsSelectorOpen(false)} 
                        />
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-border bg-slate-50/30 space-y-2">
                    {contests.length > 1 && (
                      <button 
                        onClick={() => {
                          if (!isPro) {
                             setShowProModal(true);
                             setProFeatureName('Comparar Similaridade entre Editais');
                             setIsSelectorOpen(false);
                             return;
                          }
                          setShowSimilarityModal(true);
                          setIsSelectorOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-100 transition-all shadow-sm"
                      >
                       <Zap className="w-3 h-3" /> Comparar Similaridade
                      </button>
                    )}
                    <Link 
                      to="/configuracoes" 
                      onClick={() => setIsSelectorOpen(false)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-border rounded-xl text-[10px] font-black text-text-main uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                    >
                    <Target className="w-3.5 h-3.5 text-primary" /> Gerenciar Concursos
                    </Link>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>


      {/* Main Countdown Card */}
      <div className="rise-card bg-primary text-white p-6 md:p-8 relative overflow-hidden shadow-lg border-none rounded-2xl group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary/90 transition-transform duration-700 group-hover:scale-105"></div>
        {/* Simplified backgrounds to avoid GPU artifacts on tablet */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
          <div className="text-center md:text-left space-y-3 md:flex-1 w-full">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white">
              <Calendar className="w-3 h-3" />
              Data da Prova
            </div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-white shadow-sm">{contest.role}</h2>
            
            <div className="text-sm font-bold text-white/90">
              {new Date(contest.examDate).toLocaleDateString('pt-BR')}
            </div>
           
          </div>
          
          {new Date(contest.examDate).getTime() >= Date.now() && (
            <div className="flex justify-center items-center gap-4 md:gap-6 bg-black/10 p-4 md:p-5 rounded-2xl border border-white/10 backdrop-blur-[2px] w-full md:w-auto">
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
          )}
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        {[
          { label: 'Evolução', value: `${overallProgress}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
          { label: 'Ofensiva', value: `${streakDays} dias`, icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
          { label: 'Horas', value: `${totalHours}h`, icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
          { label: 'Questões', value: totalQuestions, icon: CheckCircle2, color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' }
        ].map((metric, i) => {
          return (
            <div 
              key={i} 
              className="rise-card p-2 md:p-3 flex items-center gap-2 md:gap-3 border border-border bg-white shadow-sm hover:border-primary/30 transition-all cursor-pointer"
            >
              <div className={cn("w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 border", metric.color, metric.bg, metric.border)}>
                <metric.icon className="w-3.5 h-3.5 md:w-5 md:h-5" />
              </div>
              <div className="overflow-hidden">
                 <div className="text-[9px] md:text-[10px] font-bold text-text-sub uppercase tracking-widest">{metric.label}</div>
                 <div className="text-xs md:text-base font-display font-bold text-text-main leading-tight">{metric.value}</div>
              </div>
            </div>
          );
        })}
      </div>


      {/* Progress Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1 pt-2">
           <h3 className="text-xs font-display text-text-main uppercase font-bold tracking-wider flex items-center gap-2">
              <div className="w-1 h-3 bg-secondary rounded-full"></div>
              Progresso do Ranking
           </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link to="/materias" className="rise-card p-4 space-y-3 relative border border-border hover:border-primary/30 transition-all group">
            <div className="flex items-center justify-between">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-primary border border-border">
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
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-secondary border border-border">
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


      {/* Priority Subjects Section (Focar Mais - Disciplinas do Pareto) */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-text-sub uppercase tracking-widest px-1 flex items-center gap-2">
           <div className="w-1 h-3 bg-secondary rounded-full"></div>
           Focar Mais: Disciplinas Altamente Incidentes (Análise de Pareto)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {prioritySubjects.map((sub, idx) => {
            const subProgress = stats.subjectProgress.find(s => s.name === sub.name);
            const percent = subProgress ? subProgress.percentage : 0;
            return (
              <Link key={idx} to="/materias" className="rise-card p-4 flex items-center justify-between border border-border bg-white hover:border-secondary/30 transition-all">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-border",
                    sub.incidence === 'Muito Alta' ? "bg-red-500/10 text-red-500" : "bg-secondary/10 text-secondary"
                  )}>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[8px] font-bold text-text-sub uppercase tracking-wider mb-0.5 flex items-center gap-1">
                      {sub.incidence} <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span> {sub.category}
                    </div>
                    <div className="text-xs font-bold text-text-main whitespace-normal break-words tracking-tight leading-tight line-clamp-1">{sub.name}</div>
                  </div>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <div className="text-sm md:text-base font-display font-bold text-text-main leading-none">{percent}%</div>
                  <div className="text-[8px] font-black text-text-sub uppercase tracking-widest mt-0.5">Domínio</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>


      {/* Mentor MPP - Fluxo de Estudo Inteligente (Sessão de Estudo Ativo) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1 pt-2">
           <h3 className="text-xs font-display text-text-main uppercase font-bold tracking-wider flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500 animate-pulse" />
              Sessão de Estudo
           </h3>
           <span className="text-[9px] font-black text-indigo-650 uppercase tracking-widest bg-indigo-50/75 px-2.5 py-1 rounded-full self-start">
             PASSO 1: TEORIA & PRÁTICA INTERATIVA
           </span>
        </div>

        {/* PASSO 1: SESSÃO DE ESTUDO (Destaque Foco) */}
        <div className="rise-card bg-white border-2 border-indigo-100 rounded-3xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-indigo-400 transition-all">
          
          <div className="space-y-4 relative z-10 w-full overflow-hidden">
            <div className="flex items-center justify-between border-b border-indigo-50/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Sessão de Estudo Teórico</h4>
                  <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest pl-0.5">Foco Máximo</p>
                </div>
              </div>
              <span className="text-[8px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md uppercase tracking-wider">
                AGENDADO
              </span>
            </div>
 
            {/* Session Core Info */}
            {todayTask && !todayTask.completed ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center overflow-hidden">
                <div className="space-y-3">
                  <span className="text-[8px] font-bold uppercase text-text-sub tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-500" /> Meta do Dia no Ciclo (Dia {todayTask.dayNumber})
                  </span>
                  
                  <div className="space-y-2">
                    {todayTask.generalTopic && (
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                        <span className="text-[8px] font-black uppercase text-slate-455 tracking-wider block">Matéria Geral (Básicas)</span>
                        <p className="text-[12px] font-black text-slate-800 leading-snug mt-0.5 break-words line-clamp-2">
                          {todayTask.generalTopic}
                        </p>
                      </div>
                    )}
                    {todayTask.specificTopic && (
                      <div className="p-3 bg-indigo-50/40 border border-indigo-100/30 rounded-xl overflow-hidden">
                        <span className="text-[8px] font-black uppercase text-indigo-700 tracking-wider block">Matéria Específica (Foco)</span>
                        <p className="text-[12px] font-black text-slate-800 leading-snug mt-0.5 italic break-words line-clamp-2">
                          ➔ {todayTask.specificTopic}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3 flex flex-col justify-center">
                  <div className="text-[9px] font-bold text-text-sub uppercase text-center md:text-left bg-slate-50 border border-slate-100 rounded-xl p-3">
                    Estude a teoria destas disciplinas e finalize respondendo a <span className="text-indigo-600 font-extrabold">{todayTask.questionGoal || 15} questões</span> no simulador.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/foco')}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-white" /> Iniciar Estudos
                    </button>
                    <button 
                      onClick={() => handleSavePerformance()}
                      className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center shrink-0"
                      title="Marcar como Concluído"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center border-2 border-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-black text-text-main uppercase tracking-tight">Meta Concluída com Sucesso!</p>
                  <p className="text-[9px] text-text-sub italic">Estudo teórico diário feito com sucesso. Próxima etapa calibrada.</p>
                </div>
                <button 
                  onClick={() => setShowLogModal(true)}
                  className="mt-2 px-4 py-2 bg-slate-50 border border-border/80 hover:bg-slate-100 rounded-xl text-[10px] font-bold text-text-sub uppercase tracking-wider transition-colors"
                >
                  Registrar Horas Extras
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[9px] relative z-10">
            <span className="text-text-sub font-semibold">Consistência e disciplina diária</span>
            <Link to="/cronograma" className="text-indigo-600 font-bold uppercase hover:underline flex items-center gap-0.5">
              ABRIR CRONOGRAMA DE CICLOS ➔
            </Link>
          </div>
        </div>
      </div>

      {/* Mentor MPP - Sequência Inteligente (Passos 2 e 3) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1 pt-2">
           <h3 className="text-xs font-display text-text-main uppercase font-bold tracking-wider flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-500" />
              Revisão Ativa
           </h3>
           <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full self-start">
             ETAPAS DE ABSORÇÃO ATIVA
           </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PASSO 2: REVISÃO ESPAÇADA MEPP */}
          <div className="rise-card bg-white border border-border rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-indigo-400/45 transition-all min-h-[220px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/60 rounded-full transition-all" />
            
            <div className="space-y-4 relative z-10 text-left">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black text-xs">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-text-main uppercase tracking-wider">Revisão MEPP</h4>
                    <p className="text-[9px] font-bold text-text-sub uppercase tracking-widest pl-0.5">Fixação Ativa</p>
                  </div>
                </div>
                {dueReviewsCount > 0 ? (
                  <span className="text-[8px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    {dueReviewsCount} Pendentes
                  </span>
                ) : (
                  <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    Em Dia
                  </span>
                )}
              </div>

              {/* Revision content */}
              <div className="space-y-3">
                <div className="p-2.5 bg-indigo-50/30 border border-indigo-100/60 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-[8px] font-bold text-indigo-650 uppercase tracking-widest">
                    <span>Espaçamento 24h/7d/30d</span>
                    <span>Total: {allReviews.length}</span>
                  </div>
                  <p className="text-[10px] text-text-main font-semibold leading-relaxed line-clamp-2">
                    {dueReviewsCount > 0 
                      ? `Você tem ${dueReviewsCount} tópicos agendados na curva do esquecimento para revisar.` 
                      : "Sua memória de longo prazo está ótima! Nenhuma revisão expirada."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <Link 
                    to="/mepp"
                    className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Revisão Ativa
                  </Link>
                  <Link 
                    to="/microaprendizado"
                    className="py-2 bg-slate-50 border border-border hover:bg-slate-100 text-text-main rounded-lg text-[9px] font-black uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Brain className="w-3.5 h-3.5 text-indigo-500" /> Praticar Revisão
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[9px] relative z-10">
              <span className="text-text-sub font-semibold">Repetição espaçada</span>
              <Link to="/mepp" className="text-indigo-600 font-bold uppercase hover:underline">Blindagem ➔</Link>
            </div>
          </div>

          {/* PASSO 3: COMUNIDADE MPP */}
          <div className="rise-card bg-white border border-border rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-accent/40 transition-all min-h-[220px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 rounded-full transition-all" />
            
            <div className="space-y-4 relative z-10 text-left">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center font-black text-xs">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-text-main uppercase tracking-wider">Comunidade MPP</h4>
                    <p className="text-[9px] font-bold text-text-sub uppercase tracking-widest pl-0.5">Estudo Social</p>
                  </div>
                </div>
                <span className="text-[8px] font-black bg-accent/10 text-accent px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  PASSO 3
                </span>
              </div>

              {/* Community Content */}
              <div className="space-y-3">
                <div className="p-2.5 bg-amber-50/20 border border-amber-200/40 rounded-xl space-y-1">
                  <span className="text-[8px] font-bold uppercase text-accent tracking-widest block font-display">Troca de Saberes</span>
                  <p className="text-[10px] text-text-main font-semibold leading-relaxed line-clamp-2">
                    Acesse resumos de aprovados, envie materiais e compartilhe ideias de estudo com o grupo.
                  </p>
                </div>

                <Link 
                  to="/comunidade"
                  className="w-full py-2 bg-accent hover:brightness-110 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1 shadow-sm"
                >
                  <Users className="w-3.5 h-3.5 text-white" /> Mural da Comunidade
                </Link>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[9px] relative z-10">
              <span className="text-text-sub font-semibold">Troque aprendizagem</span>
              <span className="text-accent font-bold uppercase">Interativo ➔</span>
            </div>
          </div>
        </div>
      </div>

      {/* Relatórios Section */}
      <div className="space-y-4 pt-8">
        <div className="flex items-center justify-between px-1">
           <h3 className="text-xs font-display text-text-main uppercase font-bold tracking-wider flex items-center gap-2">
              <div className="w-1 h-3 bg-primary rounded-full"></div>
              Relatórios e Análises
           </h3>
           <Link to="/pareto" className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1 hover:underline">
             Ver Dashboard Completo <ChevronRight className="w-3 h-3" />
           </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pb-4">
          <Link to="/pareto" className="rise-card p-4 flex flex-col gap-3 border border-border bg-white hover:border-accent/40 transition-all group overflow-hidden relative">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-50 rounded-full group-hover:bg-amber-100/50 transition-all" />
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent border border-accent/20">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-text-main uppercase tracking-widest mb-1">Pareto 80/20</h4>
              <p className="text-[10px] font-medium text-text-sub uppercase tracking-wider leading-relaxed">Foco nos conteúdos estratégicos</p>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[9px] font-bold text-accent uppercase tracking-widest">
              Analisar Banca <ArrowRight className="w-3 h-3" />
            </div>
          </Link>

          <Link to="/materias" className="rise-card p-4 flex flex-col gap-3 border border-border bg-white hover:border-primary/40 transition-all group overflow-hidden relative">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-50 rounded-full group-hover:bg-indigo-100/50 transition-all" />
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-text-main uppercase tracking-widest mb-1">Edital Vertical</h4>
              <p className="text-[10px] font-medium text-text-sub uppercase tracking-wider leading-relaxed">Sua evolução em cada tópico</p>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[9px] font-bold text-primary uppercase tracking-widest">
              Ver Detalhes <ArrowRight className="w-3 h-3" />
            </div>
          </Link>

          <button 
            onClick={() => setShowSimilarityModal(true)}
            className="rise-card p-4 flex flex-col gap-3 border border-border bg-white hover:border-indigo-400/40 transition-all group overflow-hidden relative text-left"
          >
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-50 rounded-full group-hover:bg-indigo-100/50 transition-all" />
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-text-main uppercase tracking-widest mb-1">Similaridade</h4>
              <p className="text-[10px] font-medium text-text-sub uppercase tracking-wider leading-relaxed">Compare este com outros editais</p>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[9px] font-bold text-indigo-500 uppercase tracking-widest">
              Analisar agora <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          <Link to="/estatisticas" className="rise-card p-4 flex flex-col gap-3 border border-border bg-white hover:border-emerald-500/40 transition-all group overflow-hidden relative">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-50 rounded-full group-hover:bg-emerald-100/50 transition-all" />
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-text-main uppercase tracking-widest mb-1">Estatísticas</h4>
              <p className="text-[10px] font-medium text-text-sub uppercase tracking-wider leading-relaxed">Visualize sua consistência e evolução</p>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 uppercase tracking-widest hover:underline">
              Ver Detalhes <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        </div>
      </div>

      {/* Similarity Modal */}
      <AnimatePresence>
        {showSimilarityModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="rise-card w-full max-w-md p-8 bg-white border border-border space-y-6"
            >
              <div className="text-center space-y-2">
                 <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mx-auto text-indigo-500 mb-2">
                    <Zap className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-display font-bold text-text-main">Análise de Similaridade</h3>
                 <p className="text-xs text-text-sub">Veja o quanto outros editais cobrem o conteúdo deste.</p>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {contests.filter(c => c.id !== contest.id).length === 0 ? (
                  <p className="text-center text-xs text-text-sub font-medium py-10 uppercase tracking-widest">Importe outros editais para comparar</p>
                ) : (
                  contests.filter(c => c.id !== contest.id).map(other => {
                    const similarity = calculateSimilarity(contest, other);
                    return (
                      <div key={other.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-colors">
                        <div className="overflow-hidden pr-4">
                          <div className="text-[10px] font-black text-text-main uppercase tracking-tight truncate">{other.role}</div>
                          <div className="text-[9px] font-bold text-text-sub uppercase tracking-wider opacity-60 truncate">{other.name}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={cn(
                            "text-lg font-black font-display leading-none",
                            similarity > 70 ? "text-green-500" : similarity > 40 ? "text-indigo-500" : "text-text-sub"
                          )}>
                            {similarity}%
                          </div>
                          <div className="text-[8px] font-black uppercase text-text-sub tracking-widest mt-1">Match</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-2">
                <button onClick={() => setShowSimilarityModal(false)} className="w-full bg-slate-100 text-text-main py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors shadow-sm">
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Log Modal */}
      <AnimatePresence>
        {showLogModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="rise-card w-full max-w-sm p-8 bg-white border border-border space-y-8"
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

      <footer className="mt-12 pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-6 pb-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
          <BrandLogo size="sm" />
          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
            © {new Date().getFullYear()} Stratis Planner
          </span>
        </div>

        {/* Links para mídias sociais e download de apps */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto justify-end">
          {/* Social Badges in squircles */}
          <div className="flex items-center gap-2.5">
            <a 
              href="https://www.instagram.com/stratis.planner/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center bg-slate-50 border border-slate-200/50 text-slate-500 hover:text-pink-600 hover:border-pink-300 hover:bg-pink-50/30 rounded-xl transition-all duration-300 shadow-sm hover:shadow"
              title="Instagram Stratis Planner"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); }}
              className="w-8 h-8 flex items-center justify-center bg-slate-50 border border-slate-200/50 text-slate-500 hover:text-black hover:border-slate-400 hover:bg-slate-100/50 rounded-xl transition-all duration-300 shadow-sm hover:shadow"
              title="TikTok Stratis Planner"
            >
              <svg 
                stroke="currentColor" 
                fill="currentColor" 
                strokeWidth="0" 
                viewBox="0 0 448 512" 
                className="w-4 h-4" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" />
              </svg>
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); }}
              className="w-8 h-8 flex items-center justify-center bg-slate-50 border border-slate-200/50 text-slate-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50/30 rounded-xl transition-all duration-300 shadow-sm hover:shadow"
              title="YouTube Stratis Planner"
            >
              <Youtube className="w-4 h-4" />
            </a>
          </div>

          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Baixar App:</span>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); toast.info("O aplicativo para Computador estará disponível em breve!"); }}
              className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200/70 hover:border-indigo-500 hover:bg-indigo-50/20 text-slate-600 hover:text-indigo-600 rounded-xl transition-all duration-300 cursor-pointer text-[9px] font-black uppercase tracking-wider shadow-sm"
              title="Baixar para Computador"
            >
              <Laptop className="w-3.5 h-3.5 shrink-0" />
              <span>Computador</span>
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); toast.info("O aplicativo para Celular estará disponível em breve!"); }}
              className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200/70 hover:border-indigo-500 hover:bg-indigo-50/20 text-slate-600 hover:text-indigo-600 rounded-xl transition-all duration-300 cursor-pointer text-[9px] font-black uppercase tracking-wider shadow-sm"
              title="Baixar para Celular"
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span>Celular</span>
            </a>
          </div>
        </div>
      </footer>

      <ProModal 
        isOpen={showProModal} 
        onClose={() => setShowProModal(false)} 
        featureName={proFeatureName} 
      />
    </div>
  );
};

export default Dashboard;
