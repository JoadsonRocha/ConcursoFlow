import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  BrainCircuit, 
  Notebook,
  Menu,
  LogOut,
  User as UserIcon,
  Trash2,
  Users,
  Target,
  FileUp,
  MessageCircle,
  Compass,
  Crown,
  AlertTriangle,
  X,
  Timer,
  Award,
  Bell,
  Brain,
  Instagram,
  LifeBuoy,
  Bot,
  Library
} from 'lucide-react';
import { cn } from './lib/utils';
import { Contest, Subject } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Joyride, STATUS, Step } from 'react-joyride';
import Subjects from './pages/Subjects';
import Microlearning from './pages/Microlearning';
import Tutor from './pages/Tutor';
import MentorMepp from './pages/MentorMepp';
import Configuracoes from './pages/Configuracoes';
import Cronograma from './pages/Cronograma';
import Comunidade from './pages/Comunidade';
import Feedback from './pages/Feedback';
import Landing from './pages/Landing';
import TermsOfUse from './pages/TermsOfUse';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import Perfil from './pages/Perfil';
import Suporte from './pages/Suporte';
import Auth from './pages/Auth';
import ResetPassword from './pages/ResetPassword';
import Pareto from './pages/Pareto';
import Explorar from './pages/Explorar';
import Planos from './pages/Planos';
import BrandLogo from './components/BrandLogo';
import { SIcon } from './components/SIcon';
import { useAuth } from './contexts/AuthContext';
import { onMessage } from 'firebase/messaging';
import { db, requestNotificationPermission, logPageView, messaging } from './lib/firebase';
import { collection, query, onSnapshot, doc, setDoc, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/errorUtils';

import Dashboard from './pages/Dashboard';
import FocusMode from './pages/FocusMode';
import Estatisticas from './pages/Estatisticas';

const SidebarItem = ({ to, icon: Icon, label, active, collapsed, id, variant = 'default', iconColor }: { to: string, icon: any, label: string, active?: boolean, collapsed?: boolean, id?: string, variant?: 'default' | 'highlight', iconColor?: string }) => (
  <Link 
    id={id}
    to={to} 
    className={cn(
      "flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 group relative text-[14px] font-medium",
      variant === 'highlight'
        ? (active ? "bg-amber-500/10 text-amber-700 font-semibold" : "text-amber-600 hover:bg-amber-50")
        : (active ? "bg-primary/10 text-primary font-semibold" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"),
      collapsed ? "justify-center px-0" : "px-4"
    )}
    title={collapsed ? label : undefined}
  >
    <Icon className={cn(
      "w-4.5 h-4.5 shrink-0 transition-all", 
      variant === 'highlight' 
        ? "text-amber-500 group-hover:scale-110" 
        : (active ? "text-primary" : cn(iconColor || "text-slate-400", "group-hover:scale-110 opacity-80 group-hover:opacity-100"))
    )} />
    {!collapsed && <span>{label}</span>}
    {variant === 'highlight' && !collapsed && (
      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold uppercase tracking-wider">PRO</span>
    )}
  </Link>
);

// App Component
/**
 * Componente Raiz da Aplicação (App).
 * Gerencia o estado global do concurso atual, sincronização com Firebase Firestore,
 * navegação (Sidebar), autenticação e o tour de boas-vindas.
 */
export default function App() {
  const { user, profile, loading: authLoading, logout, isPro, planType } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [currentContest, setCurrentContest] = useState<Contest | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMeppNotificationOpen, setIsMeppNotificationOpen] = useState(false);

  // Lógica de Notificações MEPP: Verifica se há revisões pendentes para hoje
  const getTodayISOString = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  const todayStrStr = getTodayISOString();
  const allReviews = currentContest?.meppReviews || [];
  const dueMeppReviews = allReviews.filter(r => r.dueDate <= todayStrStr && r.reviewType !== 'completed');
  const dueReviewsCount = dueMeppReviews.length;
  const [migrated, setMigrated] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [runTour, setRunTour] = useState(false);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLDivElement>(null);

  // Notificações Push: Solicitar permissão e salvar token em múltiplos dispositivos
  useEffect(() => {
    if (user && profile) {
      const setupNotifications = async () => {
        try {
          const localSavedToken = localStorage.getItem('stratis_fcm_token_device');
          const token = await requestNotificationPermission();
          
          if (token && token !== localSavedToken) {
            // Novo token detectado para este dispositivo específico
            const currentTokens = profile.fcmTokens || (profile.fcmToken ? [profile.fcmToken] : []);
            const updatedTokens = Array.from(new Set([...currentTokens, token]));
            
            await updateDoc(doc(db, 'users', user.uid), {
              fcmToken: token, // Mantido para compatibilidade retrospectiva
              fcmTokens: updatedTokens,
              notificationsEnabled: true,
              updatedAt: serverTimestamp()
            });
            localStorage.setItem('stratis_fcm_token_device', token);
            console.log('Token FCM salvo com sucesso para este dispositivo:', token);
          }
        } catch (error) {
          console.error('Erro ao salvar token FCM deste dispositivo:', error);
        }
      };

      // Pequeno atraso para não atrapalhar o carregamento inicial da página
      const timer = setTimeout(setupNotifications, 5000);
      return () => clearTimeout(timer);
    }
  }, [user, profile]);

  // Escutar mensagens FCM recebidas enquanto o app está aberto (foreground)
  useEffect(() => {
    if (!messaging) return;

    try {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Mensagem FCM recebida em primeiro plano (foreground):', payload);
        
        if (payload.notification) {
          // Mostrar um toast interativo e amigável
          toast(payload.notification.title || 'Stratis Planner', {
            description: payload.notification.body,
            icon: '🔔',
            duration: 8000,
            action: (payload.data?.click_action || payload.data?.url) ? {
              label: 'Ver',
              onClick: () => {
                const targetUrl = payload.data?.click_action || payload.data?.url;
                if (!targetUrl) return;
                
                try {
                  if (targetUrl.startsWith('http')) {
                    const url = new URL(targetUrl);
                    navigate(url.pathname + url.search + url.hash);
                  } else {
                    navigate(targetUrl);
                  }
                } catch {
                  navigate(targetUrl);
                }
              }
            } : undefined
          });

          // Se tiver permissão nativa, disparar a notificação para mostrar o banner do sistema
          if (Notification.permission === 'granted') {
            try {
              new Notification(payload.notification.title || 'Stratis Planner', {
                body: payload.notification.body,
                icon: '/logo_pwa.png'
              });
            } catch (err) {
              console.warn('Erro ao disparar Notification nativa em foreground:', err);
            }
          }
        }
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Erro ao inicializar escutador de foreground do FCM:', err);
    }
  }, [navigate]);

  const unauthRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    if (unauthRef.current) {
      unauthRef.current.scrollTop = 0;
    }
    // Track de visualização de página no Analytics
    if (logPageView) {
      logPageView(location.pathname);
    }
  }, [location]);

  const tourSteps: Step[] = [
    {
      target: '#tour-importar-dashboard, #tour-importar',
      content: 'Comece importando o seu edital PDF ou colando o conteúdo para que o Stratis Planner organize seus estudos.',
      placement: 'auto',
    },
    {
      target: '#tour-painel',
      content: 'Aqui no Painel, você acompanha o seu progresso, metas diárias e desempenho geral.',
    },
    {
      target: '#tour-edital',
      content: 'Gerencie todas as matérias e tópicos do seu edital, e marque o que já concluiu.',
    },
    {
      target: '#tour-cronograma',
      content: 'Nós geramos um cronograma automático e inteligente baseado no que você precisa estudar.',
    },
    {
      target: '#tour-pareto',
      content: 'A Análise de Pareto indica quais matérias caem mais na sua prova, otimizando seu esforço.',
    },
    {
      target: '#tour-revisao',
      content: 'Nossa IA gera Flashcards e Mapas Mentais instantâneos para facilitar sua revisão.',
    },
    {
      target: '#tour-comunidade',
      content: 'Neste espaço, você pode compartilhar e baixar resumos e recursos criados por outros concurseiros.',
    }
  ];

  useEffect(() => {
    const handleResize = () => {
      // Set initial desktop state but don't force it continuously
      if (window.innerWidth <= 768) {
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

  // Initial Load: Find the contest indicated by the profile OR first available
  useEffect(() => {
    if (authLoading || contests.length === 0) return;

    // Only set initial currentContest if it's not already set
    if (!currentContest) {
      if (profile?.currentContestId) {
        const saved = contests.find(c => c.id === profile.currentContestId);
        if (saved) {
          setCurrentContest(saved);
        } else {
          setCurrentContest(contests[0]);
        }
      } else {
        setCurrentContest(contests[0]);
      }
    } else {
      // If we HAVE a currentContest, just make sure it stays in sync with its DB counterpart
      const inSync = contests.find(c => c.id === currentContest.id);
      if (inSync && JSON.stringify(inSync) !== JSON.stringify(currentContest)) {
        setCurrentContest(inSync);
      }
    }
  }, [profile, contests, authLoading]); // Added contests to ensure sync works on data changes

  // Firestore Sync & Migration
  useEffect(() => {
    if (!user) return;

    const contestsRef = collection(db, 'users', user.uid, 'contests');
    const q = query(contestsRef);
    
    // Migration Logic
    if (!migrated) {
      const runMigration = async () => {
        try {
          const potentialKeys = ['contests', 'stratis_contests', 'strat_contests'];
          for (const key of potentialKeys) {
            const localStr = localStorage.getItem(key);
            if (localStr) {
              const localData = JSON.parse(localStr);
              if (Array.isArray(localData) && localData.length > 0) {
                for (const c of localData) {
                  if (!c.id) continue;
                  try {
                    const docRef = doc(db, 'users', user.uid, 'contests', c.id);
                    await setDoc(docRef, { ...c, ownerId: user.uid, updatedAt: serverTimestamp(), createdAt: serverTimestamp() }, { merge: true });
                  } catch (e) {
                    console.error("Failed to migrate contest", c.id, e);
                  }
                }
                // Don't arbitrarily remove, maybe just rename so we don't cause ghost loops but prevent data loss
                localStorage.removeItem(key);
              }
            }
          }
        } catch (e) {
          console.error("Migration error:", e);
        }
        setMigrated(true);
      };
      runMigration();
    }

    const sanitizeSubjects = (subjects: any[]) => {
      return (subjects || []).map((s: any) => ({
        ...s,
        id: s.id || `sub-${Math.random().toString(36).substr(2, 9)}`,
        name: s.name || 'Matéria sem nome',
        category: s.category || 'Gerais',
        topics: (s.topics || []).map((t: any) => ({
          ...t,
          id: t.id || `top-${Math.random().toString(36).substr(2, 9)}`,
          name: t.name || 'Tópico sem nome',
          completed: !!t.completed
        }))
      }));
    };

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbContests = snapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          ...data,
          id: doc.id,
          subjects: sanitizeSubjects(data.subjects),
          schedule: (data.schedule || []).map((d: any) => ({
            ...d,
            completed: !!d.completed
          }))
        } as Contest;
      });
      setContests(dbContests);
      setDataLoading(false);
    }, (error) => {
      console.error("Firestore Error in contests snapshot:", error);
      toast.error("Erro ao carregar dados. Verifique sua conexão.");
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [user, migrated]);

  // Check for tour after initial loading
  useEffect(() => {
    if (user && profile && !authLoading && !dataLoading) {
      if (!profile.tourCompleted) {
        setRunTour(true);
      }
    }
  }, [user, profile, authLoading, dataLoading]);

  // Daily reminder notifications
  useEffect(() => {
    if (!currentContest || !currentContest.schedule) return;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const checkAndNotify = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Check if it's exactly 09:00, 14:00, or 20:00
      const isReminderTime = 
        (currentHour === 9 && currentMinute === 0) ||
        (currentHour === 14 && currentMinute === 0) ||
        (currentHour === 20 && currentMinute === 0);

      if (isReminderTime) {
        const startDate = currentContest.scheduleStartDate || new Date().toISOString();
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const dNow = new Date();
        dNow.setHours(0, 0, 0, 0);
        const diffTime = Math.max(0, dNow.getTime() - start.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const todayDayNumber = Math.max(1, diffDays + 1);

        const hasPendingTasks = currentContest.schedule?.some(
          d => d.dayNumber <= todayDayNumber && !d.completed
        );

        if (hasPendingTasks && "Notification" in window && Notification.permission === "granted") {
          new Notification("Lembrete de Estudo 📚", {
            body: "Você tem tarefas pendentes no seu cronograma. Vamos continuar avançando?",
            icon: "/logo.png"
          });
        }
      }
    };

    checkAndNotify();
    const interval = setInterval(checkAndNotify, 60000);
    
    return () => clearInterval(interval);
  }, [currentContest]);

  const handleJoyrideCallback = async (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            tourCompleted: true,
            updatedAt: serverTimestamp()
          });
        } catch (e) {
          console.error("Error updating tour status: ", e);
        }
      }
    }
  };

  const handleImportEdital = async (newContest: Contest) => {
    if (!user) return;
    
    const isEdit = !!newContest.id && !newContest.id.startsWith('temp-');
    
    // Limits check - Only for NEW imports
    if (!isEdit) {
      const limit = planType === 'pro' ? Infinity : 1;
      if (contests.length >= limit) {
        const planName = planType === 'pro' ? 'PRO' : 'GRATUITO';
        toast.error(`Limite de ${limit} edital atingido no plano ${planName}. Faça o upgrade para expandir seus limites!`, {
          action: {
            label: "Assinar Pro",
            onClick: () => navigate("/planos")
          },
          duration: 5000
        });
        return;
      }
    }

    try {
      const contestId = isEdit ? newContest.id : `dynamic-${Date.now()}`;
      const docRef = doc(db, 'users', user.uid, 'contests', contestId);
      const contestToSave = { 
        ...newContest, 
        id: contestId, 
        ownerId: user.uid, 
        createdAt: isEdit ? (newContest.createdAt || serverTimestamp()) : serverTimestamp(), 
        updatedAt: serverTimestamp() 
      };
      await setDoc(docRef, contestToSave, { merge: true });
      
      // Update local state immediately to ensure UI refresh
      setContests(prev => {
        const index = prev.findIndex(c => c.id === contestId);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = contestToSave as Contest;
          return updated;
        }
        return [...prev, contestToSave as Contest];
      });
      setCurrentContest(contestToSave as Contest);
      
      // Update profile with last selected contest
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 
        currentContestId: contestId,
        updatedAt: serverTimestamp() 
      });
    } catch (err: any) {
      console.error("Erro ao salvar edital:", err);
      toast.error("Falha ao salvar no Firestore: " + err.message);
    }
  };

  const handleSwitchContest = async (contest: Contest) => {
    setCurrentContest(contest);
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 
        currentContestId: contest.id,
        updatedAt: serverTimestamp() 
      });
    } catch (err: any) {
      console.error("Erro ao salvar edital selecionado:", err);
    }
  };

  const handleUpdateContest = async (updatedContest: Contest) => {
    if (!user) return;
    
    // Update local state IMMEDIATELY (Optimistic Update)
    setCurrentContest(updatedContest);
    setContests(prev => prev.map(c => c.id === updatedContest.id ? updatedContest : c));

    try {
      const docRef = doc(db, 'users', user.uid, 'contests', updatedContest.id);
      
      // Separate system fields from user data
      const { createdAt: _ignored, updatedAt: _ignored2, ownerId: _ignored3, ...contestData } = updatedContest;
      
      const payload: any = { 
        ...contestData, 
        ownerId: user.uid,
        updatedAt: serverTimestamp(),
        // Ensure critical fields are never undefined for Firestore
        schedule: contestData.schedule || [],
        subjects: contestData.subjects || [],
        paretoData: contestData.paretoData || null,
        meppReviews: contestData.meppReviews || [],
        dailyHistory: contestData.dailyHistory || [],
      };
      
      await setDoc(docRef, payload, { merge: true });

      // Update profile current ID in background
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 
        currentContestId: updatedContest.id,
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      console.error("Erro ao sincronizar com nuvem:", err);
      toast.error("Erro ao salvar dados na nuvem: " + err.message);
    }
  };

  const handleDeleteContest = async (id: string) => {
    if (!user) return;
    try {
      // Find remaining contests
      const remaining = contests.filter(c => c.id !== id);
      
      // Update state
      setContests(remaining);
      if (currentContest?.id === id) {
        setCurrentContest(remaining.length > 0 ? remaining[0] : null);
        
        // Update user profile preference if needed
        if (profile) {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            currentContestId: remaining.length > 0 ? remaining[0].id : null,
            updatedAt: serverTimestamp()
          });
        }
      }

      const docRef = doc(db, 'users', user.uid, 'contests', id);
      await deleteDoc(docRef);
      
      toast.success("Cargo removido com sucesso!");
    } catch (err) {
      console.error("Erro ao deletar cargo:", err);
      toast.error("Erro ao remover cargo. Verifique sua conexão ou permissões.");
    }
  };

  const handleCloseBetaModal = () => {
    sessionStorage.setItem('betaModalShown', 'true');
    setShowBetaModal(false);
  };

  if (location.pathname === '/reset-password') {
    return (
      <div ref={unauthRef} className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-bg">
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </div>
    );
  }

  if (authLoading || (user && dataLoading) || (user && !currentContest && contests.length > 0)) {
    return (
      <div className="h-[100dvh] w-screen flex flex-col items-center justify-center overflow-x-hidden bg-bg gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div className="text-xs font-black text-text-sub uppercase tracking-wider animate-pulse">
          {authLoading ? "Autenticando..." : "Sincronizando seus Dados..."}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div ref={unauthRef} className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-bg">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/planos" element={<Planos />} />
          <Route path="/termos" element={<TermsOfUse />} />
          <Route path="/privacidade" element={<PrivacyPolicy />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full bg-bg font-sans overflow-hidden relative">
      {/* Navigation & Screens */}

      {user && profile && React.createElement(Joyride as any, {
          steps: tourSteps,
          run: runTour,
          continuous: true,
          locale: { back: 'Voltar', close: 'Fechar', last: 'Finalizar', next: 'Próximo', skip: 'Pular Tour' },
          styles: {
            options: {
              primaryColor: '#0ea5e9',
              zIndex: 1000,
            }
          },
          callback: handleJoyrideCallback
        })}
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[45] md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile Drawer */}
      <aside className={cn(
        "bg-white border-r border-border transition-all duration-300 z-50 overflow-hidden",
        "fixed inset-y-0 left-0 md:relative flex flex-col shrink-0 h-full",
        isSidebarOpen 
          ? "translate-x-0 w-72 md:w-[280px] px-6 py-6 shadow-2xl md:shadow-none" 
          : "-translate-x-full md:translate-x-0 w-72 md:w-20 px-6 md:px-3 py-6"
      )}>
        <Link to="/" className="mb-8 px-2 hover:opacity-80 transition-opacity flex justify-center items-center">
          <BrandLogo showText={false} size={isSidebarOpen ? "md" : "sm"} />
        </Link>

        <div className="space-y-1 flex-grow overflow-y-auto hide-scrollbar">
          <div>
            {isSidebarOpen && <span className="block text-[11px] font-bold text-text-sub uppercase tracking-widest mb-2 ml-3 opacity-50">Principal</span>}
            <nav className="space-y-0.5">
              <SidebarItem id="tour-painel" to="/" icon={LayoutDashboard} label="Painel" active={location.pathname === '/'} collapsed={!isSidebarOpen} iconColor="text-blue-500" />
              <SidebarItem id="tour-edital" to="/materias" icon={BookOpen} label="Edital" active={location.pathname === '/materias'} collapsed={!isSidebarOpen} iconColor="text-indigo-500" />
              <SidebarItem id="tour-cronograma" to="/cronograma" icon={Calendar} label="Cronograma" active={location.pathname === '/cronograma'} collapsed={!isSidebarOpen} iconColor="text-emerald-500" />
              <SidebarItem id="tour-foco" to="/foco" icon={Timer} label="Sessão foco" active={location.pathname === '/foco'} collapsed={!isSidebarOpen} iconColor="text-rose-500" />
              <SidebarItem id="tour-pareto" to="/pareto" icon={Target} label="Pareto" active={location.pathname === '/pareto'} collapsed={!isSidebarOpen} iconColor="text-orange-500" />
              <SidebarItem id="tour-revisao" to="/microaprendizado" icon={Notebook} label="Notebook" active={location.pathname === '/microaprendizado' && !location.search.includes('tab=library')} collapsed={!isSidebarOpen} iconColor="text-violet-500" />
              <SidebarItem id="tour-mepp" to="/mepp" icon={Award} label="Revisão" active={location.pathname === '/mepp'} collapsed={!isSidebarOpen} iconColor="text-cyan-500" />
              <SidebarItem id="tour-comunidade" to="/comunidade" icon={Users} label="Comunidade" active={location.pathname === '/comunidade'} collapsed={!isSidebarOpen} iconColor="text-fuchsia-500" /> 
              <SidebarItem to="/feedback" icon={MessageCircle} label="Feedback" active={location.pathname === '/feedback'} collapsed={!isSidebarOpen} iconColor="text-teal-500" />
              <SidebarItem to="/explorar" icon={Compass} label="Explorar" active={location.pathname === '/explorar'} collapsed={!isSidebarOpen} iconColor="text-sky-500" />
              <SidebarItem to="/suporte" icon={LifeBuoy} label="Suporte" active={location.pathname === '/suporte'} collapsed={!isSidebarOpen} iconColor="text-pink-500" />
              {!isPro && (
                <SidebarItem to="/planos" icon={Crown} label="Assinar Pro" active={location.pathname === '/planos'} collapsed={!isSidebarOpen} variant="highlight" />
              )}
            </nav>
          </div>

          {/* Sidebar actions: Upgrade hidden for PRO mode */}
          {false && !isPro && (
            <div className="mt-4">
              <Link
                to="/planos"
                className={cn(
                  "flex items-center gap-3 py-3 rounded-xl transition-all duration-300 group shadow-md shadow-indigo-500/20",
                  "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 opacity-90 hover:opacity-100",
                  isSidebarOpen ? "px-4" : "justify-center px-0 mx-2"
                )}
                title={!isSidebarOpen ? "Fazer Upgrade para Premium" : undefined}
              >
                <Crown className={cn("w-4 h-4 shrink-0 text-yellow-300")} />
                {isSidebarOpen && <span className="text-[13px] font-bold uppercase tracking-wider">Fazer Upgrade</span>}
              </Link>
            </div>
          )}
        </div>

        <div className="mt-auto pt-6 border-t border-border space-y-2">
          <Link 
            id="tour-importar"
            to="/configuracoes"
            className={cn(
              "flex items-center gap-4 py-2.5 rounded-xl transition-all mb-1 text-[13px] font-bold uppercase tracking-wider",
              location.pathname === '/configuracoes' ? "bg-slate-100 text-text-main" : "text-text-sub hover:bg-slate-50 ",
              isSidebarOpen ? "px-4" : "justify-center px-0"
            )}
            title={!isSidebarOpen ? "Importar Edital" : undefined}
          >
            <FileUp className="w-4 h-4 shrink-0" />
            {isSidebarOpen && <span>Importar Edital</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main ref={mainRef} className={cn("flex-1 min-w-0 overflow-x-hidden bg-bg relative scroll-smooth flex flex-col", location.pathname === '/tutor' ? "overflow-hidden" : "overflow-y-auto")}>
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 md:px-10 py-3.5 flex shrink-0 items-center justify-between border-b border-border">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn("p-2 bg-white border border-border hover:bg-slate-50 rounded-lg transition-all text-text-sub")}
            >
              <Menu className={cn("w-5 h-5 transition-transform", isSidebarOpen ? "rotate-90" : "rotate-0")} />
            </button>
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <h2 className="text-lg font-display font-bold text-text-main tracking-tight uppercase leading-none">
                  STRATIS PLANNER
                </h2>
              </Link>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-4 relative">
              <div className="hidden sm:flex flex-col items-end">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1 opacity-50">Sincronização</div>
                <div className="text-[10px] font-black text-primary leading-none flex items-center gap-1.5 uppercase tracking-wider">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_6px_var(--color-primary)]"></div>
                  Conectado 
                </div>
              </div>

              {/* MEPP Notification Icon (Dropdown/Badge) inside the top bar */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsMeppNotificationOpen(!isMeppNotificationOpen);
                    setIsUserMenuOpen(false); // Close user menu if open
                  }}
                  className="p-2 bg-slate-50 border border-border hover:bg-slate-100 rounded-xl transition-all relative text-text-sub hover:text-indigo-600 flex items-center justify-center cursor-pointer"
                  title="Notificações de Revisão Stratis"
                >
                  <Bell className={cn("w-5 h-5", dueReviewsCount > 0 ? "text-indigo-600" : "")} />
                  {dueReviewsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 border border-white text-[8px] font-black text-white rounded-full flex items-center justify-center animate-bounce">
                      {dueReviewsCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isMeppNotificationOpen && (
                    <>
                      <div className="fixed inset-0 z-[90]" onClick={() => setIsMeppNotificationOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 bg-white border border-border rounded-2xl shadow-xl p-5 z-[100] text-left"
                      >
                        <div className="flex items-center gap-2 pb-3 border-b border-border mb-3">
                          <Award className="w-4 h-4 text-indigo-500 animate-pulse" />
                          <h4 className="text-xs font-black text-text-main uppercase tracking-wider">
                            Revisão Stratis
                          </h4>
                        </div>

                        {dueReviewsCount > 0 ? (
                          <div className="space-y-3">
                            <h5 className="text-[11px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                              ⚠️ Curva do Esquecimento Ativada!
                            </h5>
                            <p className="text-xs font-semibold text-text-sub leading-relaxed">
                              Você tem <strong>{dueReviewsCount} {dueReviewsCount === 1 ? 'revisão de matéria' : 'revisões de matérias'}</strong> pendentes ou programadas para hoje. O segredo da aprovação inteligente é revisar ativamente antes de iniciar um bloco de teoria nova.
                            </p>
                            <div className="pt-2 flex gap-2">
                              <Link
                                to="/mepp"
                                onClick={() => setIsMeppNotificationOpen(false)}
                                className="flex-1 text-center py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-600/10"
                              >
                                Ver Revisões
                              </Link>
                              <Link
                                to="/microaprendizado"
                                onClick={() => setIsMeppNotificationOpen(false)}
                                className="flex-1 text-center py-2 bg-slate-100 hover:bg-slate-200 text-text-main rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                              >
                                Praticar
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 py-2 text-center text-text-sub">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-2 font-bold text-sm">
                              ✓
                            </div>
                            <p className="text-[11px] font-semibold">
                              Tudo em dia com a Revisão Stratis! Nenhuma revisão programada para hoje. Continue firme nos seus estudos teóricos!
                            </p>
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="group outline-none block"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden group-hover:opacity-80 transition-all">
                    {profile?.photoURL || user.photoURL ? (
                      <img src={profile?.photoURL || user.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Profile" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-100">
                        <UserIcon className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </button>
                
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-[90]" onClick={() => setIsUserMenuOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-5 w-64 bg-white border border-border rounded-2xl shadow-xl py-6 z-[100] overflow-hidden"
                      >
                        <div className="px-6 py-4 border-b border-border mb-2 flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="text-xs font-black text-text-main uppercase tracking-wider truncate">{user?.displayName || 'Concurseiro'}</div>
                            <div className="text-xs text-text-sub font-medium truncate opacity-60 italic">{user?.email}</div>
                          </div>
                          <div className={cn(
                            "px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest shrink-0 ml-2",
                            isPro ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"
                          )}>
                            {isPro ? 'PRO' : 'FREE'}
                          </div>
                        </div>
                        <Link 
                          to="/perfil" 
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-text-main uppercase tracking-tight">Preferências</span>
                            <span className="text-[10px] text-text-sub uppercase tracking-wider italic">Ver meu perfil</span>
                          </div>
                        </Link>
                        <Link 
                          to="/suporte"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                            <LifeBuoy className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-text-main uppercase tracking-tight">Suporte</span>
                            <span className="text-[10px] text-text-sub uppercase tracking-wider italic">Central de Ajuda</span>
                          </div>
                        </Link>
                        {!isPro && (
                          <Link 
                            to="/planos"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-4 px-6 py-4 bg-amber-50/50 hover:bg-amber-50 border-l-4 border-amber-500 transition-all group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                              <Crown className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-amber-600 uppercase tracking-tight flex items-center gap-1.5">
                                Assinar Pro
                                <span className="text-[8px] bg-amber-500 text-white font-extrabold px-1 py-0.2 rounded-full leading-none shrink-0 scale-90">HOT</span>
                              </span>
                              <span className="text-[10px] text-amber-600/70 uppercase tracking-wider italic font-semibold">Nossos Planos</span>
                            </div>
                          </Link>
                        )}
                        <hr className="border-border my-2 mx-6" />
                        <button 
                          onClick={() => { logout(); setIsUserMenuOpen(false); }}
                          className="w-full flex items-center gap-4 px-6 py-5 hover:bg-red-50 transition-all text-red-600 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-black uppercase tracking-wider text-left">Sair da Conta</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Floating Mentor Stratis - Apenas para PRO */}
        {isPro && location.pathname !== '/tutor' && location.pathname !== '/auth' && location.pathname !== '/microaprendizado' && (
          <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 pointer-events-none">
            <button 
              onClick={() => navigate('/tutor')}
              className="w-14 h-14 bg-gradient-to-tr from-accent to-amber-500 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform border border-white/20 pointer-events-auto group relative"
            >
              <SIcon className="w-6 h-6 animate-pulse" />
              {/* Tooltip on hover */}
              <div className="absolute right-full mr-4 bg-white/90 backdrop-blur-md border border-border px-3 py-2 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block">
                 <div className="flex flex-col text-right">
                    <span className="text-[10px] font-bold text-text-sub uppercase tracking-widest leading-none mb-0.5">Mentor Stratis</span>
                    <span className="text-xs font-black text-text-main uppercase tracking-tight">Iniciar Mentoria</span>
                 </div>
              </div>
            </button>
          </div>
        )}

        <div className={cn("w-full max-w-[1536px] mx-auto space-y-6", (location.pathname === '/tutor' || location.pathname === '/foco') ? "p-0 h-full" : "p-4 md:p-6")}>
          <AnimatePresence mode="wait">
            <Routes location={location}>
              <Route path="/" element={<Dashboard contest={currentContest || { id: 'empty', name: '', role: '', examDate: '', subjects: [] }} onUpdate={handleUpdateContest} contests={contests} onSwitchContest={handleSwitchContest} onDelete={handleDeleteContest} />} />
              <Route path="/foco" element={<FocusMode contest={currentContest} onUpdate={handleUpdateContest} />} />
              <Route path="/materias" element={currentContest ? <Subjects contest={currentContest} contests={contests} onUpdate={handleUpdateContest} /> : <div className="p-20 text-center text-text-sub text-sm font-bold uppercase tracking-wider">Importe um edital no botão "Importar Edital" ou pela "Comunidade"</div>} />
              <Route path="/estatisticas" element={currentContest ? <Estatisticas contest={currentContest} /> : <div className="p-20 text-center text-text-sub text-sm font-bold uppercase tracking-wider">Importe um edital no botão "Importar Edital" ou pela "Comunidade"</div>} />
              <Route path="/pareto" element={currentContest ? <Pareto contest={currentContest} contests={contests} onContestChange={handleSwitchContest} onUpdate={handleUpdateContest} /> : <div className="p-20 flex flex-col items-center justify-center text-center text-text-sub space-y-4"><Target className="w-12 h-12 text-slate-300 mb-4" /><span className="text-sm font-bold uppercase tracking-wider">Importe um edital no botão "Importar Edital" ou pela "Comunidade"</span></div>} />
              <Route path="/microaprendizado" element={<Microlearning contest={currentContest} onUpdate={handleUpdateContest} />} />
              <Route path="/tutor" element={<Tutor contest={currentContest} />} />
              <Route path="/mepp" element={currentContest ? <MentorMepp contest={currentContest} onUpdate={handleUpdateContest} /> : <div className="p-20 text-center text-text-sub text-sm font-bold uppercase tracking-wider">Importe um edital no botão "Importar Edital" ou pela "Comunidade"</div>} />
              <Route path="/configuracoes" element={<Configuracoes onImport={handleImportEdital} contests={contests} />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/cronograma" element={currentContest ? <Cronograma contest={currentContest} onUpdate={handleUpdateContest} /> : <div className="p-20 text-center text-text-sub text-sm font-bold uppercase tracking-wider">Importe um edital no botão "Importar Edital" ou pela "Comunidade"</div>} />
              <Route path="/comunidade" element={<Comunidade onImport={handleImportEdital} contests={contests} />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/suporte" element={<Suporte />} />
              <Route path="/explorar" element={<Explorar />} />
              <Route path="/planos" element={<Planos />} />
              <Route path="/termos" element={<TermsOfUse />} />
              <Route path="/privacidade" element={<PrivacyPolicy />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
