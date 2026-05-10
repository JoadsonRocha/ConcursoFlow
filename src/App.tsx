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
  Trash2,
  Users,
  Heart,
  Target
} from 'lucide-react';
import { cn } from './lib/utils';
import { Contest, Subject } from './types';
import { motion, AnimatePresence } from 'motion/react';
import Subjects from './pages/Subjects';
import Microlearning from './pages/Microlearning';
import Configuracoes from './pages/Configuracoes';
import Cronograma from './pages/Cronograma';
import Comunidade from './pages/Comunidade';
import Landing from './pages/Landing';
import TermsOfUse from './pages/TermsOfUse';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { useAuth } from './contexts/AuthContext';
import { db } from './lib/firebase';
import { collection, query, onSnapshot, doc, setDoc, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';

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
    };
  };

  const todayTask = contest?.schedule?.find(day => !day.completed);
  const isDefaultContest = !contest || !contest.ownerId;
  const globalProgress = calculateProgress(contest?.subjects || []);
  const streak = (contest?.schedule || []).filter(d => d.completed).length;

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
    setLogForm({ hours: '', questions: '' });
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative pb-6 border-b border-border">
        <div className="space-y-1.5 overflow-hidden">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.4em] mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Painel de Alta Performance</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display leading-[0.85] text-text-main tracking-tighter">
            Olá, <span className="italic text-primary">{user?.displayName?.split(' ')[0] || 'Guerreiro'}</span>.
          </h1>
          <p className="text-text-sub text-base font-medium pt-3 max-w-lg">
            Sua jornada até a nomeação exige consistência. <span className="text-text-main font-bold">O que vamos conquistar hoje?</span>
          </p>
        </div>
        {!isDefaultContest && (
          <button 
            onClick={() => setShowLogModal(true)}
            className="w-full md:w-auto bg-text-main text-bg px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-text-main/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
          >
            Registrar Desempenho
            <TrendingUp className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform" />
          </button>
        )}
      </header>

      {!isDefaultContest && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Hero Stat - Global Progress */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-border rounded-[3.5rem] p-12 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-sm hover:shadow-xl transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
              <Sparkles className="w-48 h-48 text-primary" />
            </div>
            
            <div className="relative w-56 h-56 mb-10">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                <circle 
                  cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="16" fill="transparent" 
                  strokeDasharray={628.3}
                  strokeDashoffset={628.3 - (628.3 * globalProgress.percent) / 100}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-1000 ease-out" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-display text-text-main leading-none">{globalProgress.percent}%</span>
                <span className="text-[10px] font-black text-text-sub uppercase tracking-[0.2em] mt-3">Progresso Geral</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 w-full border-t border-border mt-6 pt-10">
              <div className="space-y-1">
                <div className="text-2xl font-display text-text-main">{globalProgress.completed}/{globalProgress.total}</div>
                <div className="text-[10px] text-text-sub font-black uppercase tracking-widest">Tópicos</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-display text-accent">{streak}d</div>
                <div className="text-[10px] text-text-sub font-black uppercase tracking-widest">Streak</div>
              </div>
            </div>
          </div>

          {/* Quick Info & Next Subject */}
          <div className="lg:col-span-7 flex flex-col gap-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                {/* Today's Target */}
                <div className="bg-white dark:bg-slate-900 border border-border rounded-[3rem] p-10 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                           <Target className="w-7 h-7" />
                        </div>
                        <div className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full">Foco Total</div>
                      </div>
                      <div className="space-y-1">
                         <h3 className="text-[10px] font-black text-text-sub uppercase tracking-[0.2em] mb-1">Meta de Questões</h3>
                         <div className="text-5xl font-display text-text-main">{todayTask ? todayTask.questionGoal : contest.dailyGoalQuestions || 20} <span className="text-lg font-sans font-medium text-text-sub lowercase tracking-normal">itens</span></div>
                      </div>
                   </div>
                   <div className="space-y-3 mt-8">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-text-sub uppercase tracking-widest">Esforço estimado</span>
                        <span className="text-xs font-bold text-text-main">{~~((todayTask?.questionGoal || 20) * 1.5)} min</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                         <div className="bg-primary h-full transition-all duration-500" style={{ width: '0%' }} />
                      </div>
                   </div>
                </div>

                {/* Exam Countdown */}
                <div className="bg-slate-950 dark:bg-slate-950 rounded-[3rem] p-10 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                      <Clock className="w-32 h-32" />
                   </div>
                   <div className="space-y-3 relative z-10">
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Próxima Batalha</div>
                      <h3 className="text-3xl font-display leading-[0.9]">{contest.name || 'Edital'}</h3>
                      <div className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mt-2">D-Day: {contest.examDate ? new Date(contest.examDate).toLocaleDateString('pt-BR') : '--/--/--'}</div>
                   </div>
                   <div className="flex gap-10 mt-10 relative z-10 border-t border-white/10 pt-10">
                      <div className="space-y-1">
                         <div className="text-5xl font-display">{timeLeft.days}</div>
                         <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Dias</div>
                      </div>
                      <div className="space-y-1">
                         <div className="text-5xl font-display">{timeLeft.hours}</div>
                         <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Hs</div>
                      </div>
                      <div className="space-y-1">
                         <div className="text-5xl font-display">{timeLeft.minutes}</div>
                         <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Min</div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Study Tip Card */}
             <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border border-primary/10 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-8 group hover:border-primary/30 transition-all">
                <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[2rem] flex items-center justify-center text-primary shadow-xl shrink-0 group-hover:scale-110 transition-transform">
                   <BrainCircuit className="w-10 h-10" />
                </div>
                <div className="flex-1 space-y-2 text-center md:text-left">
                   <h4 className="text-[10px] font-black text-text-main uppercase tracking-[0.3em]">IA Strategy Engine</h4>
                   <p className="text-text-sub text-lg font-medium leading-tight">"A constância vence o talento. Foque nos <span className="text-primary font-bold italic">20% que geram 80%</span> dos resultados hoje."</p>
                </div>
                <Link to="/microaprendizado" className="w-full md:w-auto bg-primary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all text-center">
                   Gerar Materiais
                </Link>
             </div>
          </div>
        </div>
      )}

      {/* Mission Section */}
      {todayTask && !isDefaultContest && (
        <section className="space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display text-text-main">Missão de Hoje</h2>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight">Dia {todayTask.dayNumber}</span>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-border rounded-[2.5rem] p-8 space-y-6 hover:shadow-xl transition-all group overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
                    <BookOpen className="w-32 h-32" />
                 </div>
                 <div className="space-y-4">
                    <div className="text-[10px] font-black text-text-sub uppercase tracking-widest">Conhecimentos Gerais</div>
                    <div className="text-xl font-display text-text-main leading-tight border-l-2 border-primary pl-4">
                       {todayTask.generalTopic || "Revisão Geral"}
                    </div>
                 </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-border rounded-[2.5rem] p-8 space-y-6 hover:shadow-xl transition-all group overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-32 h-32" />
                 </div>
                 <div className="space-y-4">
                    <div className="text-[10px] font-black text-text-sub uppercase tracking-widest">Conhecimentos Específicos</div>
                    <div className="text-xl font-display text-text-main leading-tight border-l-2 border-secondary pl-4">
                       {todayTask.specificTopic || "Aprofundamento Técnico"}
                    </div>
                 </div>
              </div>
           </div>
        </section>
      )}

      {isDefaultContest && (
        <section className="glass rounded-[4rem] p-20 text-center space-y-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
          <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center mx-auto text-white shadow-2xl shadow-primary/30 relative z-10 group-hover:scale-110 transition-transform">
            <Sparkles className="w-12 h-12" />
          </div>
          <div className="space-y-4 relative z-10">
            <h2 className="text-4xl md:text-6xl font-display text-text-main tracking-tighter mix-blend-multiply dark:mix-blend-normal">
               Inicie sua <span className="italic text-primary">Jornada</span>.
            </h2>
            <p className="text-text-sub max-w-lg mx-auto text-lg font-medium leading-relaxed">
              Importe seu primeiro edital para que nossa Inteligência Artificial organize toda sua preparação verticalizada.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-6 relative z-10">
            <Link to="/configuracoes" className="bg-primary text-white px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
              Importar Novo Edital
            </Link>
            <Link to="/comunidade" className="bg-white dark:bg-card-bg border border-border text-text-main px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-50 transition-all">
              Ver Comunidade
            </Link>
          </div>
        </section>
      )}

      {/* Daily Log Modal */}
      <AnimatePresence>
        {showLogModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white dark:bg-slate-950 border border-border w-full max-w-md rounded-[3rem] p-10 space-y-8 shadow-2xl">
              <div className="space-y-2">
                 <h3 className="text-3xl font-display text-text-main leading-none">Relatório de Batalha.</h3>
                 <p className="text-sm text-text-sub font-medium">Como foi seu desempenho nos estudos hoje?</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-text-sub uppercase tracking-[0.2em] ml-1">Horas Estudadas</label>
                  <input 
                    type="number" 
                    inputMode="decimal"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-border rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 ring-primary/20 outline-none transition-all" 
                    value={logForm.hours} 
                    onChange={(e) => setLogForm({...logForm, hours: e.target.value === '' ? '' : Number(e.target.value)})} 
                    placeholder="Ex: 4.5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-text-sub uppercase tracking-[0.2em] ml-1">Questões Resolvidas</label>
                  <input 
                    type="number" 
                    inputMode="numeric"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-border rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 ring-primary/20 outline-none transition-all" 
                    value={logForm.questions} 
                    onChange={(e) => setLogForm({...logForm, questions: e.target.value === '' ? '' : Number(e.target.value)})} 
                    placeholder="Ex: 50"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowLogModal(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-text-sub hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-colors">Cancelar</button>
                  <button 
                    onClick={handleSavePerformance}
                    className="flex-1 bg-primary text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Salvar
                  </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SidebarItem = ({ to, icon: Icon, label, active, collapsed }: { to: string, icon: any, label: string, active?: boolean, collapsed?: boolean }) => (
  <Link 
    to={to} 
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative text-xs font-black uppercase tracking-widest",
      active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-sub hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-text-main"
    )}
  >
    <Icon className={cn("w-4 h-4 shrink-0", active ? "text-white" : "text-text-sub group-hover:text-text-main")} />
    {!collapsed && <span>{label}</span>}
    {active && !collapsed && (
      <motion.div 
        layoutId="active-nav"
        className="absolute left-0 w-1 h-4 bg-white rounded-full opacity-50"
        initial={false}
      />
    )}
  </Link>
);

// App Component
export default function App() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [contests, setContests] = useState<Contest[]>([]);
  const [currentContest, setCurrentContest] = useState<Contest | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [migrated, setMigrated] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }, [location]);

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
    
    setMigrated(true);

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
      const allContests = dbContests;
      
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
      
      alert("Cargo removido com sucesso!");
    } catch (err) {
      console.error("Erro ao deletar cargo:", err);
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
    <div className="flex min-h-screen bg-bg font-sans overflow-hidden relative">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth <= 768 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-[45] md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop */}
      <aside className={cn(
        "bg-white dark:bg-slate-950 border-r border-border transition-all duration-300 z-50",
        "fixed md:relative h-full flex flex-col shrink-0 hidden md:flex",
        isSidebarOpen ? "w-72 px-8 py-10" : "w-20 px-4 py-10 translate-x-0"
      )}>
        <div className="mb-16 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-[1.25rem] flex items-center justify-center text-white font-black shadow-2xl shadow-primary/30 shrink-0 rotate-3 group-hover:rotate-0 transition-transform">
            <Sparkles className="w-7 h-7" />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="text-text-main font-display text-2xl tracking-tighter leading-none">STRATIS</span>
              <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mt-1">Intelligence</span>
            </div>
          )}
        </div>

        <div className="space-y-8 flex-grow">
          <div>
            {isSidebarOpen && <span className="block text-[10px] font-black text-text-sub uppercase tracking-[0.2em] mb-4 ml-2">Main</span>}
            <nav className="space-y-1.5">
              <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} collapsed={!isSidebarOpen} />
              <SidebarItem to="/materias" icon={BookOpen} label="Matérias" active={location.pathname === '/materias'} collapsed={!isSidebarOpen} />
              <SidebarItem to="/cronograma" icon={Calendar} label="Cronograma" active={location.pathname === '/cronograma'} collapsed={!isSidebarOpen} />
              <SidebarItem to="/comunidade" icon={Users} label="Comunidade" active={location.pathname === '/comunidade'} collapsed={!isSidebarOpen} />
              <SidebarItem to="/microaprendizado" icon={BrainCircuit} label="Estudos IA" active={location.pathname === '/microaprendizado'} collapsed={!isSidebarOpen} />
            </nav>
          </div>

          <div>
            {isSidebarOpen && <span className="block text-[10px] font-black text-text-sub uppercase tracking-[0.2em] mb-4 ml-2">Editais</span>}
            <div className="space-y-1.5">
              {contests.length === 0 ? (
                isSidebarOpen && <div className="px-3 py-4 text-[10px] text-text-sub font-bold italic border-2 border-dashed border-border rounded-2xl">Vazio</div>
              ) : (
                contests.slice(0, 5).map(c => (
                  <div key={c.id} className="group relative flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentContest(c)}
                      className={cn(
                        "flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left overflow-hidden",
                        currentContest?.id === c.id 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "text-text-sub hover:bg-slate-100 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <Award className={cn("w-4 h-4 shrink-0", currentContest?.id === c.id ? "text-primary" : "text-text-sub")} />
                      {isSidebarOpen && (
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold truncate leading-none">{c.role}</div>
                          <div className="text-[9px] opacity-60 font-medium truncate mt-1">{c.name}</div>
                        </div>
                      )}
                    </button>
                    {isSidebarOpen && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteContest(c.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-text-sub hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all absolute right-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-border">
          <Link 
            to="/configuracoes"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all mb-2 text-sm font-bold",
              location.pathname === '/configuracoes' ? "bg-primary/10 text-primary" : "text-text-sub hover:bg-slate-100 dark:hover:bg-slate-800/50"
            )}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {isSidebarOpen && <span>Configurações</span>}
          </Link>
          <button 
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2.5 text-text-sub hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all text-sm font-bold w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isSidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-[100] bg-slate-900/90 dark:bg-slate-900/90 backdrop-blur-xl px-2 py-2 flex items-center justify-between border border-white/10 rounded-[2.5rem] shadow-2xl">
        <Link to="/" className={cn(
          "flex-1 flex flex-col items-center gap-1 p-3 rounded-[2rem] transition-all", 
          location.pathname === '/' ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "text-slate-400"
        )}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-widest">Início</span>
        </Link>
        <Link to="/materias" className={cn(
          "flex-1 flex flex-col items-center gap-1 p-3 rounded-[2rem] transition-all", 
          location.pathname === '/materias' ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "text-slate-400"
        )}>
          <BookOpen className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-widest">Matérias</span>
        </Link>
        <Link to="/cronograma" className={cn(
          "flex-1 flex flex-col items-center gap-1 p-3 rounded-[2rem] transition-all", 
          location.pathname === '/cronograma' ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "text-slate-400"
        )}>
          <Calendar className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-widest">Plano</span>
        </Link>
        <Link to="/comunidade" className={cn(
          "flex-1 flex flex-col items-center gap-1 p-3 rounded-[2rem] transition-all", 
          location.pathname === '/comunidade' ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "text-slate-400"
        )}>
          <Users className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-widest">Comum</span>
        </Link>
        <Link to="/configuracoes" className={cn(
          "flex-1 flex flex-col items-center gap-1 p-3 rounded-[2rem] transition-all", 
          location.pathname === '/configuracoes' ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "text-slate-400"
        )}>
          <Settings className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-widest">Ajustes</span>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto bg-bg relative md:pb-0 pb-32">
        <header className="sticky top-0 z-40 glass px-4 md:px-10 py-5 flex items-center justify-between border-b border-border/50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition-colors text-text-sub"
            >
              {isSidebarOpen ? <X className="w-5 h-5 text-primary" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black shadow-sm md:hidden">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-display text-text-main tracking-tight leading-none md:hidden">
                STRATIS
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition-colors text-text-sub"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex flex-col items-end mr-2">
                <div className="text-[9px] text-text-sub font-black uppercase tracking-[0.1em] leading-none mb-1">Status</div>
                <div className="text-xs font-black text-primary leading-none flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                  Focado
                </div>
              </div>
              {user.photoURL ? (
                <img src={user.photoURL} className="w-10 h-10 rounded-2xl border border-border shadow-sm" referrerPolicy="no-referrer" alt="Profile" />
              ) : (
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-text-sub">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-5 md:p-10 max-w-7xl mx-auto space-y-10">
          <AnimatePresence mode="wait">
            <Routes location={location}>
              <Route path="/" element={<Dashboard contest={currentContest || { id: 'empty', name: '', role: '', examDate: '', subjects: [] }} onUpdate={handleUpdateContest} />} />
              <Route path="/materias" element={currentContest ? <Subjects contest={currentContest} onUpdate={handleUpdateContest} /> : <div className="p-20 text-center text-text-sub text-sm font-bold uppercase tracking-widest">Importe um edital na aba "Importar Edital"</div>} />
              <Route path="/microaprendizado" element={currentContest ? <Microlearning contest={currentContest} /> : <div className="p-20 text-center text-text-sub text-sm font-bold uppercase tracking-widest">Importe um edital na aba "Importar Edital"</div>} />
              <Route path="/configuracoes" element={<Configuracoes onImport={handleImportEdital} currentContest={currentContest} contests={contests} onDelete={handleDeleteContest} />} />
              <Route path="/cronograma" element={currentContest ? <Cronograma contest={currentContest} onUpdate={handleUpdateContest} /> : <div className="p-20 text-center text-text-sub text-sm font-bold uppercase tracking-widest">Importe um edital na aba "Importar Edital"</div>} />
              <Route path="/comunidade" element={<Comunidade onImport={handleImportEdital} />} />
              <Route path="/termos" element={<TermsOfUse />} />
              <Route path="/privacidade" element={<PrivacyPolicy />} />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
