import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, updateDoc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Contest } from '../types';
import { Users, Heart, Download, Search, Filter, Calendar, Award, Sparkles, User as UserIcon } from 'lucide-react';
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em] leading-none mb-2">Ecossistema Compartilhado</div>
          <h1 className="text-4xl md:text-6xl font-display leading-[0.9] text-text-main tracking-tighter">
            Galeria da <span className="italic text-primary">Comunidade</span>.
          </h1>
          <p className="text-text-sub text-sm font-medium pt-2">Explore e favorite editais verticalizados criados pela inteligência coletiva.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative group flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Buscar cargo ou banca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-border rounded-xl py-3 pl-11 pr-4 text-xs font-bold focus:ring-4 ring-primary/5 transition-all outline-none shadow-sm"
            />
          </div>
          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-border rounded-xl py-3 px-6 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer hover:border-primary/50 transition-all shadow-sm appearance-none"
          >
            <option value="Todos">Todos os Cargos</option>
            <option value="Analista">Analista</option>
            <option value="Técnico">Técnico</option>
            <option value="Auditor">Auditor</option>
          </select>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3].map(i => (
            <div key={i} className="h-72 bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] animate-pulse border border-border"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-border rounded-[3rem] p-20 text-center space-y-6 shadow-xl shadow-primary/[0.02] flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-700 shadow-xl">
            <Users className="w-10 h-10 text-text-sub opacity-20" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-display text-text-main">Vazio por aqui</h3>
            <p className="text-sm text-text-sub max-w-xs mx-auto font-medium leading-relaxed">Seja o arquiteto do primeiro edital desta categoria e compartilhe com o mundo!</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
          <AnimatePresence mode="popLayout">
            {filtered.map((contest) => (
              <motion.div
                key={contest.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative bg-white dark:bg-slate-900 border border-border rounded-[2.5rem] p-8 transition-all hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 flex flex-col"
              >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">{contest.name}</div>
                    <h4 className="text-xl font-display text-text-main leading-tight tracking-tight max-w-[180px]">{contest.role}</h4>
                    <div className="flex items-center gap-2 pt-2">
                       <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                          <UserIcon className="w-3 h-3 text-text-sub" />
                       </div>
                       <span className="text-[9px] font-bold text-text-sub truncate max-w-[120px]">Por {contest.ownerName || 'Estrategista'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleLike(contest.id, e)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-90",
                      contest.likesCount > 0 ? "bg-red-50 text-red-500" : "bg-slate-50 text-text-sub hover:text-red-500"
                    )}
                  >
                    <Heart className={cn("w-5 h-5 transition-transform", contest.likesCount > 0 && "fill-red-500 scale-110")} />
                    <span className="text-[10px] font-black leading-none">{contest.likesCount || 0}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 pt-4 border-t border-slate-50 dark:border-slate-800 relative z-10">
                  <div className="space-y-1">
                    <div className="text-[9px] font-black text-text-sub uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      Prova
                    </div>
                    <div className="text-xs font-bold text-text-main truncate">{contest.examDate || 'A definir'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[9px] font-black text-text-sub uppercase tracking-widest flex items-center gap-1.5">
                      <Award className="w-3 h-3" />
                      Disciplinas
                    </div>
                    <div className="text-xs font-bold text-text-main">{contest.subjects?.length || 0} matérias</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto relative z-10 gap-4">
                  <button 
                    onClick={() => setPreviewContest(contest)}
                    className="flex-1 py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-slate-50 dark:bg-slate-800 text-text-sub hover:bg-slate-100 hover:text-text-main flex items-center justify-center gap-2 group/btn"
                  >
                    <Search className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                    Expandir
                  </button>
                  <button 
                    onClick={() => handleClone(contest)}
                    className="flex-1 bg-text-main text-bg py-4.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-text-main/10 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Estudar
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-border w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
            >
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
              
              <div className="p-8 md:p-10 border-b border-border flex items-center justify-between relative z-10">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none">{previewContest.name}</p>
                  <h3 className="text-2xl md:text-3xl font-display text-text-main leading-none">{previewContest.role}</h3>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[9px] font-black text-text-sub uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Compartilhado por {previewContest.ownerName || 'Anônimo'}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewContest(null)}
                  className="w-12 h-12 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all text-text-sub"
                >
                  <Search className="w-6 h-6 rotate-90" />
                </button>
              </div>

              <div className="p-8 md:p-10 overflow-y-auto space-y-10 relative z-10 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-6 border border-border transition-colors hover:border-primary/20">
                    <div className="text-[10px] font-black text-text-sub uppercase tracking-widest mb-2">Disciplinas</div>
                    <div className="text-3xl font-display text-primary leading-none">{previewContest.subjects?.length || 0}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-6 border border-border transition-colors hover:border-secondary/20">
                    <div className="text-[10px] font-black text-text-sub uppercase tracking-widest mb-2">Data Prova</div>
                    <div className="text-3xl font-display text-secondary leading-none truncate">{previewContest.examDate || 'TBD'}</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-text-sub uppercase tracking-[0.2em]">Conteúdo Programático</h4>
                    <div className="flex items-center gap-2 text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full">
                      <Sparkles className="w-3 h-3" />
                      IA Optimized
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {previewContest.subjects?.map((sub, i) => (
                      <div key={i} className="bg-white dark:bg-slate-800 border border-border rounded-2xl overflow-hidden group/sub hover:border-primary/30 transition-all">
                        <div className="p-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-sm" />
                              <span className="text-sm font-bold text-text-main">{sub.name}</span>
                              <span className="text-[10px] text-text-sub font-medium">({sub.category})</span>
                           </div>
                           <span className={cn(
                             "text-[9px] px-2.5 py-1 rounded-xl font-black uppercase tracking-tight",
                             sub.incidence === 'Muito Alta' ? "bg-red-500 text-white" : "bg-white dark:bg-slate-700 text-text-sub"
                           )}>
                             {sub.incidence}
                           </span>
                        </div>
                        {sub.topics && sub.topics.length > 0 && (
                          <div className="p-4 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-border/50">
                            {sub.topics.map((topic, j) => (
                              <div key={j} className="flex items-center gap-2 text-[10px] text-text-sub font-medium">
                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="truncate">{topic.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {sub.briefing && (
                          <div className="p-4 pt-0 text-[10px] text-text-sub italic leading-tight opacity-70">
                            {sub.briefing}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {previewContest.schedule && previewContest.schedule.length > 0 && (
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-text-sub uppercase tracking-[0.2em]">Exemplo de Cronograma</h4>
                        <div className="text-[9px] font-black text-secondary uppercase tracking-widest bg-secondary/10 px-3 py-1.5 rounded-full">
                          {previewContest.schedule.length} Dias
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {previewContest.schedule.slice(0, 7).map((day, i) => (
                          <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-border">
                             <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-text-main shrink-0 border border-border">
                                {day.dayNumber}
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-text-main truncate">{day.specificTopic}</div>
                                <div className="text-[9px] text-text-sub truncate">{day.generalTopic}</div>
                             </div>
                          </div>
                        ))}
                        {previewContest.schedule.length > 7 && (
                          <div className="text-center text-[10px] font-black text-text-sub uppercase tracking-widest pt-2">
                            + {previewContest.schedule.length - 7} dias de planejamento estratégico
                          </div>
                        )}
                      </div>
                   </div>
                )}
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-800/30 border-t border-border flex flex-col sm:flex-row gap-4 relative z-10">
                <button 
                  onClick={() => setPreviewContest(null)}
                  className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-text-sub hover:bg-white dark:hover:bg-slate-900 rounded-2xl transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    handleClone(previewContest);
                    setPreviewContest(null);
                  }}
                  className="flex-[2] bg-text-main text-bg py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-text-main/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Clonar para Meus Estudos
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
