import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, updateDoc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Contest } from '../types';
import { Users, Heart, Download, Search, Filter, Calendar, Award, Sparkles, User as UserIcon, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Comunidade({ onImport }: { onImport: (contest: Contest) => void }) {
  const { user } = useAuth();
  const [sharedContests, setSharedContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Todos');
  const [previewContest, setPreviewContest] = useState<Contest | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'shared_contests'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Contest[];
      setSharedContests(docs);
      setLoading(false);
    }, (err) => {
      console.error("Erro ao carregar comunidade:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const docRef = doc(db, 'shared_contests', id);
      await updateDoc(docRef, {
        likesCount: increment(1)
      });
    } catch (err) {
      console.error("Erro ao dar like:", err);
    }
  };

  const handleClone = async (contest: Contest) => {
    if (!user) return;
    try {
      const clonedContest = {
        ...contest,
        ownerId: user.uid,
        isPublic: false,
        likesCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onImport(clonedContest);
      alert(`${contest.role} adicionado aos seus estudos!`);
    } catch (err) {
      console.error("Erro ao clonar:", err);
    }
  };

  const filtered = sharedContests.filter(c => {
    const matchesSearch = c.role.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRole === 'Todos' || c.role.includes(filterRole);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b border-border pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-primary font-bold text-xs uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]"></div>
            Networking Tático
          </div>
          <h1 className="text-2xl md:text-3xl font-display text-text-main tracking-tight font-bold">
            Acervo <span className="text-primary italic">Coletivo</span>
          </h1>
          <p className="text-text-sub text-xs md:text-sm font-medium leading-relaxed max-w-xl">
            Explore e mobilize planejamentos estruturados por outros estrategistas da rede.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative group flex-1 sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Localizar cargo ou instituição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 dark:bg-white/5 border border-border rounded-xl py-3.5 pl-12 pr-6 text-xs text-text-main placeholder:text-text-sub focus:ring-2 ring-primary/10 transition-all outline-none"
            />
          </div>
          <div className="relative">
            <select 
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-slate-100 dark:bg-white/5 border border-border rounded-xl py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-text-sub outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10 transition-all appearance-none min-w-[180px]"
            >
              <option value="Todos">Todas as Áreas</option>
              <option value="Analista">Analista</option>
              <option value="Técnico">Técnico</option>
              <option value="Auditor">Auditor</option>
            </select>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-80 bg-white/5 rounded-2xl animate-pulse border border-white/5 shadow-2xl"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rise-card p-24 text-center space-y-8 flex flex-col items-center bg-gradient-to-br from-slate-950 to-transparent border-white/5">
          <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl">
            <Users className="w-10 h-10 text-slate-800" />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-display text-white italic font-bold">Nenhum Registro Encontrado</h3>
            <p className="text-slate-500 text-sm font-medium italic">Tente ajustar seus parâmetros de busca no acervo.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-20">
          <AnimatePresence mode="popLayout">
            {filtered.map((contest) => (
              <motion.div
                key={contest.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="group relative rise-card p-8 bg-white dark:bg-zinc-900 border border-border transition-all duration-500 hover:border-primary/30"
              >
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="space-y-2 max-w-[75%]">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider truncate italic">{contest.name}</p>
                    <h4 className="text-xl font-display text-text-main leading-tight truncate font-bold group-hover:text-primary transition-colors italic">{contest.role}</h4>
                    <div className="flex items-center gap-2 pt-1">
                       <UserIcon className="w-3.5 h-3.5 text-text-sub/50" />
                       <span className="text-xs font-bold text-text-sub uppercase tracking-wider truncate">Por {contest.ownerName || 'Estrategista'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleLike(contest.id, e)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all active:scale-95 border",
                      contest.likesCount > 0 
                        ? "bg-red-500/5 border-red-500/10 text-red-500" 
                        : "bg-slate-50 dark:bg-white/5 border-border text-text-sub hover:border-red-500/20 hover:text-red-500"
                    )}
                  >
                    <Heart className={cn("w-5 h-5 transition-transform duration-500", contest.likesCount > 0 && "fill-red-500")} />
                    <span className="text-xs font-bold leading-none">{contest.likesCount || 0}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 pt-6 border-t border-border relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-sub">
                       <Calendar className="w-3.5 h-3.5 text-primary" />
                       Data
                    </div>
                    <div className="text-xs font-semibold text-text-main truncate italic">{contest.examDate || 'A definir'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-sub">
                       <Award className="w-3.5 h-3.5 text-accent" />
                       Módulos
                    </div>
                    <div className="text-xs font-semibold text-text-main italic">{contest.subjects?.length || 0} Disciplinas</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-auto relative z-10">
                  <button 
                    onClick={() => setPreviewContest(contest)}
                    className="p-3.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-border text-text-sub hover:text-primary transition-all shadow-sm"
                  >
                    <Search className="w-4.5 h-4.5" />
                  </button>
                  <button 
                    onClick={() => handleClone(contest)}
                    className="flex-1 bg-primary text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewContest && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/50 dark:bg-[#030712]/80 backdrop-blur-xl transition-all">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="rise-card w-full max-w-2xl bg-white dark:bg-zinc-900 border border-border flex flex-col max-h-[90vh] overflow-hidden shadow-2xl"
            >
              <div className="p-8 md:p-10 border-b border-border flex items-center justify-between relative bg-slate-50 dark:bg-primary/5">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider italic">{previewContest.name}</p>
                  <h3 className="text-2xl md:text-3xl font-display text-text-main tracking-tight font-bold italic">{previewContest.role}</h3>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-xs font-bold text-text-sub uppercase tracking-wider bg-slate-100 dark:bg-white/5 border border-border px-4 py-1.5 rounded-full italic">Originado por {previewContest.ownerName || 'Estrategista'}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewContest(null)}
                  className="w-12 h-12 flex items-center justify-center bg-white dark:bg-white/5 border border-border text-text-sub hover:text-text-main rounded-xl transition-all shadow-sm group"
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              <div className="p-8 md:p-10 overflow-y-auto space-y-10 scroll-smooth">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-border">
                    <div className="text-xs font-bold text-text-sub uppercase tracking-wider mb-2 border-b border-border pb-2">Conteúdo Estratégico</div>
                    <div className="text-2xl font-display text-primary italic font-bold">{previewContest.subjects?.length || 0} Disciplinas</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-border">
                    <div className="text-xs font-bold text-text-sub uppercase tracking-wider mb-2 border-b border-border pb-2">Horizonte Temporal</div>
                    <div className="text-2xl font-display text-accent italic font-bold">{previewContest.examDate?.split('-')[0] || 'A definir'}</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <h4 className="text-xs font-bold text-text-sub uppercase tracking-wider">Módulos de Estudo</h4>
                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">
                      <Sparkles className="w-3.5 h-3.5" />
                      Otimizado por IA
                    </div>
                  </div>
                  <div className="space-y-4">
                    {previewContest.subjects?.map((sub, i) => (
                      <div key={i} className="bg-white dark:bg-zinc-800/50 border border-border rounded-2xl overflow-hidden group/sub shadow-sm">
                        <div className="p-5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              <span className="text-sm font-bold text-text-main italic">{sub.name}</span>
                           </div>
                           <span className={cn(
                             "text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider",
                             sub.incidence === 'Muito Alta' ? "bg-red-50 text-red-500 border border-red-100" : "bg-slate-100 dark:bg-white/10 text-text-sub"
                           )}>
                             Incidência {sub.incidence}
                           </span>
                        </div>
                        {sub.topics && sub.topics.length > 0 && (
                          <div className="p-6 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {sub.topics.slice(0, 6).map((topic, j) => (
                              <div key={j} className="flex items-center gap-2.5 text-sm text-text-sub font-medium italic">
                                <ChevronRight className="w-3.5 h-3.5 text-primary/40" />
                                <span className="truncate">{topic.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-10 border-t border-border flex gap-4 mt-auto">
                <button 
                  onClick={() => {
                    handleClone(previewContest);
                    setPreviewContest(null);
                  }}
                  className="w-full bg-primary text-white py-4 rounded-xl text-sm font-bold uppercase tracking-wider shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  <Download className="w-5 h-5" />
                  Importar Estrutura
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
