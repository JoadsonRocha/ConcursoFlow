import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  BrainCircuit, 
  Menu,
  LogOut,
  Sparkles,
  User as UserIcon,
  Trash2,
  Users,
  Target,
  FileUp,
  MessageCircle
} from 'lucide-react';
import { cn } from './lib/utils';
import { Contest, Subject } from './types';
import { motion, AnimatePresence } from 'motion/react';
import Subjects from './pages/Subjects';
import Microlearning from './pages/Microlearning';
import Configuracoes from './pages/Configuracoes';
import Cronograma from './pages/Cronograma';
import Comunidade from './pages/Comunidade';
import Feedback from './pages/Feedback';
import Landing from './pages/Landing';
import TermsOfUse from './pages/TermsOfUse';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Perfil from './pages/Perfil';
import Auth from './pages/Auth';
import Pareto from './pages/Pareto';
import { useAuth } from './contexts/AuthContext';
import { db } from './lib/firebase';
import { collection, query, onSnapshot, doc, setDoc, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/errorUtils';

import Dashboard from './pages/Dashboard';

const SidebarItem = ({ to, icon: Icon, label, active, collapsed }: { to: string, icon: any, label: string, active?: boolean, collapsed?: boolean }) => (
  <Link 
    to={to} 
    className={cn(
      "flex items-center gap-3 py-2.5 rounded-xl transition-all duration-300 group relative text-sm font-semibold uppercase tracking-wider",
      active ? "bg-primary/10 text-primary" : "text-text-sub hover:bg-slate-50 hover:text-text-main",
      collapsed ? "justify-center px-0" : "px-4"
    )}
    title={collapsed ? label : undefined}
  >
    <Icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-text-sub/50 group-hover:text-text-main")} />
    {!collapsed && <span>{label}</span>}
    {active && !collapsed && (
      <motion.div 
        layoutId="active-nav-bg"
        className="absolute inset-y-2 left-0 w-1 bg-primary rounded-full shadow-[0_0_10px_var(--color-primary)] opacity-80"
        initial={false}
      />
    )}
  </Link>
);

// App Component
export default function App() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [currentContest, setCurrentContest] = useState<Contest | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [migrated, setMigrated] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, contests.length, authLoading]); // Added authLoading to wait, removed currentContest to avoid loop

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
                let allSuccess = true;
                for (const c of localData) {
                  if (!c.id) continue;
                  try {
                    const docRef = doc(db, 'users', user.uid, 'contests', c.id);
                    await setDoc(docRef, { ...c, ownerId: user.uid }, { merge: true });
                  } catch (e) {
                    console.error("Failed to migrate contest", c.id, e);
                    allSuccess = false;
                  }
                }
                if (allSuccess) {
                  localStorage.removeItem(key);
                }
              } else {
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
      await updateDoc(userRef, { 
        currentContestId: contestId,
        updatedAt: serverTimestamp() 
      });
    } catch (err: any) {
      console.error("Erro ao salvar edital:", err);
      toast.error("Falha de segurança ao salvar no Firestore: " + err.message);
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
      // Optimistic update
      setContests(prev => prev.filter(c => c.id !== id));
      if (currentContest?.id === id) {
        setCurrentContest(null);
      }

      const docRef = doc(db, 'users', user.uid, 'contests', id);
      await deleteDoc(docRef);
      
      toast.success("Cargo removido com sucesso!");
    } catch (err) {
      console.error("Erro ao deletar cargo:", err);
      toast.error("Erro ao remover cargo. Verifique sua conexão ou permissões.");
    }
  };

  if (authLoading || (user && dataLoading)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div className="text-xs font-black text-text-sub uppercase tracking-wider animate-pulse">
          {authLoading ? "Autenticando..." : "Sincronizando seus Cronogramas..."}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/termos" element={<TermsOfUse />} />
        <Route path="/privacidade" element={<PrivacyPolicy />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg font-sans overflow-hidden relative">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[45] md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile Drawer */}
      <aside className={cn(
        "bg-white border-r border-border transition-all duration-300 z-50",
        "fixed inset-y-0 left-0 md:relative flex flex-col shrink-0 h-full",
        isSidebarOpen 
          ? "translate-x-0 w-72 md:w-[280px] px-6 py-8 shadow-2xl md:shadow-none" 
          : "-translate-x-full md:translate-x-0 w-72 md:w-20 px-6 md:px-3 py-8"
      )}>
        <div className="mb-14 flex items-center gap-3">
          <div className="w-10 h-10 primary-button rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
            </div>
          )}
        </div>

        <div className="space-y-6 flex-grow overflow-y-auto no-scrollbar">
          <div>
            {isSidebarOpen && <span className="block text-[10px] font-bold text-text-sub uppercase tracking-widest mb-3 ml-3 opacity-50">Principal</span>}
            <nav className="space-y-1">
              <SidebarItem to="/" icon={LayoutDashboard} label="Painel" active={location.pathname === '/'} collapsed={!isSidebarOpen} />
              <SidebarItem to="/materias" icon={BookOpen} label="Edital" active={location.pathname === '/materias'} collapsed={!isSidebarOpen} />
              <SidebarItem to="/pareto" icon={Target} label="Pareto" active={location.pathname === '/pareto'} collapsed={!isSidebarOpen} />
              <SidebarItem to="/cronograma" icon={Calendar} label="Cronograma" active={location.pathname === '/cronograma'} collapsed={!isSidebarOpen} />
              <SidebarItem to="/comunidade" icon={Users} label="Comunidade" active={location.pathname === '/comunidade'} collapsed={!isSidebarOpen} />
              <SidebarItem to="/microaprendizado" icon={BrainCircuit} label="Revisão" active={location.pathname === '/microaprendizado'} collapsed={!isSidebarOpen} />
              <SidebarItem to="/feedback" icon={MessageCircle} label="Feedback" active={location.pathname === '/feedback'} collapsed={!isSidebarOpen} />
            </nav>
          </div>

          <div>
            {isSidebarOpen && <span className="block text-[10px] font-bold text-text-sub uppercase tracking-widest mb-3 ml-3 opacity-50">Saved</span>}
            <div className="space-y-1">
              {contests.length === 0 ? (
                isSidebarOpen && <div className="px-5 py-4 text-xs text-text-sub font-medium uppercase tracking-wider italic border border-dashed border-border rounded-xl">Nenhum salvo</div>
              ) : (
                contests.slice(0, 4).map(c => (
                  <div key={c.id} className="group relative flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentContest(c)}
                      className={cn(
                        "flex-1 flex items-center gap-4 py-3 rounded-xl transition-all text-left overflow-hidden border",
                        currentContest?.id === c.id 
                          ? "bg-primary/5 text-primary border-primary/20" 
                          : "bg-transparent border-transparent text-text-sub hover:bg-slate-50 ",
                        isSidebarOpen ? "px-4" : "justify-center px-0"
                      )}
                      title={!isSidebarOpen ? c.role : undefined}
                    >
                      <Target className={cn("w-4 h-4 shrink-0", currentContest?.id === c.id ? "text-primary" : "text-text-sub opacity-50")} />
                      {isSidebarOpen && (
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold uppercase tracking-tight truncate leading-none text-text-main">{c.role}</div>
                          <div className="text-xs opacity-40 font-medium uppercase tracking-wide truncate mt-1">{c.name}</div>
                        </div>
                      )}
                    </button>
                    {isSidebarOpen && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteContest(c.id); }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-text-sub hover:text-red-500 rounded-lg transition-all absolute right-2"
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
              "flex items-center gap-4 py-3.5 rounded-xl transition-all mb-1 text-xs font-semibold uppercase tracking-wider",
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
      <main className="flex-1 h-screen overflow-y-auto bg-bg relative scroll-smooth">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 md:px-10 py-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn("p-2 bg-white border border-border hover:bg-slate-50 rounded-lg transition-all text-text-sub md:hidden")}
            >
              <Menu className="w-5 h-5 transition-transform" />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-display font-bold text-text-main tracking-tight uppercase">
                Stratis Planner
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-4 relative">
              <div className="hidden sm:flex flex-col items-end">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1 opacity-50">Sincronização</div>
                <div className="text-[10px] font-black text-primary leading-none flex items-center gap-1.5 uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                  Conectado 
                </div>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="group outline-none block"
                >
                  <div className="w-12 h-12 bg-white/5 rounded-2xl border-2 border-white/5 overflow-hidden group-hover:border-primary/50 transition-all shadow-xl p-1 backdrop-blur-md">
                    {profile?.photoURL || user.photoURL ? (
                      <img src={profile?.photoURL || user.photoURL} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" alt="Profile" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 bg-white/5 rounded-xl">
                        <UserIcon className="w-6 h-6" />
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
                        <div className="px-6 py-4 border-b border-border mb-2">
                          <div className="text-xs font-black text-text-main uppercase tracking-wider truncate">{user?.displayName || 'Concurseiro'}</div>
                          <div className="text-xs text-text-sub font-medium truncate opacity-60 italic">{user?.email}</div>
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
                        <a 
                          href="https://wa.me/5511999999999?text=Olá!%20Preciso%20de%20uma%20ajudinha%20com%20o%20Stratis%20Planner."
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                            <MessageCircle className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-text-main uppercase tracking-tight">Suporte</span>
                            <span className="text-[10px] text-text-sub uppercase tracking-wider italic">WhatsApp</span>
                          </div>
                        </a>
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

        <div className="p-5 md:p-10 max-w-7xl mx-auto space-y-10">
          <AnimatePresence mode="wait">
            <Routes location={location}>
              <Route path="/" element={<Dashboard contest={currentContest || { id: 'empty', name: '', role: '', examDate: '', subjects: [] }} onUpdate={handleUpdateContest} />} />
              <Route path="/materias" element={currentContest ? <Subjects contest={currentContest} onUpdate={handleUpdateContest} /> : <div className="p-20 text-center text-text-sub text-sm font-bold uppercase tracking-wider">Importe um edital na aba "Importar Edital"</div>} />
              <Route path="/pareto" element={currentContest ? <Pareto contest={currentContest} contests={contests} onContestChange={setCurrentContest} onUpdate={handleUpdateContest} /> : <div className="p-20 flex flex-col items-center justify-center text-center text-text-sub space-y-4"><Target className="w-12 h-12 text-slate-300 mb-4" /><span className="text-sm font-bold uppercase tracking-wider">Importe um edital primeiro</span></div>} />
              <Route path="/microaprendizado" element={currentContest ? <Microlearning contest={currentContest} /> : <div className="p-20 text-center text-text-sub text-sm font-bold uppercase tracking-wider">Importe um edital na aba "Importar Edital"</div>} />
              <Route path="/configuracoes" element={<Configuracoes onImport={handleImportEdital} currentContest={currentContest} contests={contests} onDelete={handleDeleteContest} />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/cronograma" element={currentContest ? <Cronograma contest={currentContest} onUpdate={handleUpdateContest} /> : <div className="p-20 text-center text-text-sub text-sm font-bold uppercase tracking-wider">Importe um edital na aba "Importar Edital"</div>} />
              <Route path="/comunidade" element={<Comunidade onImport={handleImportEdital} />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/termos" element={<TermsOfUse />} />
              <Route path="/privacidade" element={<PrivacyPolicy />} />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
