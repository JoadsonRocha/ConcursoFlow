import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, updateDoc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Contest } from '../types';
import { Users, Heart, Download, Search, Filter, Calendar, Award, Sparkles, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const Comunidade = ({ onImport }: { onImport: (contest: Contest) => void }) => {
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
      // We pass it to the main App handler which saves it to the user's private collection
      const clonedContest = {
        ...contest,
        ownerId: user.uid,
        isPublic: false, // Clone starts as private
        likesCount: 0,
        createdAt: new Date().toISOString(), // Will be overwritten by serverTimestamp in handleImport
        updatedAt: new Date().toISOString()
      };
      // Note: handleImportEdital in App.tsx handles the Firestore write
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Users className="w-3.5 h-3.5" />
            Galeria da Comunidade
          </div>
          <h2 className="text-3xl font-black text-text-main tracking-tight">Editais Verticalizados</h2>
          <p className="text-sm font-medium text-text-sub">Explore planos de estudo compartilhados por outros candidatos.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub" />
            <input 
              type="text"
              placeholder="Buscar cargo ou banca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white dark:bg-card-bg border border-border rounded-xl py-2 pl-10 pr-4 text-xs font-bold w-full sm:w-64 focus:ring-2 ring-primary/20 transition-all outline-none"
            />
          </div>
          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-white dark:bg-card-bg border border-border rounded-xl py-2 px-4 text-xs font-bold outline-none cursor-pointer hover:border-primary/50 transition-all"
          >
            <option value="Todos">Todos os Cargos</option>
            <option value="Analista">Analista</option>
            <option value="Técnico">Técnico</option>
            <option value="Auditor">Auditor</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 bg-gray-100 dark:bg-card-bg/50 rounded-[32px] animate-pulse border border-border"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-card-bg border border-border rounded-[40px] p-20 text-center space-y-6 shadow-sm">
          <div className="w-20 h-20 bg-bg dark:bg-bg rounded-full flex items-center justify-center mx-auto">
            <Users className="w-10 h-10 text-text-sub opacity-30" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-text-main">Nenhum edital encontrado</h3>
            <p className="text-sm text-text-sub max-w-xs mx-auto">Seja o primeiro a compartilhar seu cronograma verticalizado com a comunidade!</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((contest) => (
              <motion.div
                key={contest.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group bg-white dark:bg-card-bg border border-border rounded-[32px] p-6 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all hover:border-primary/30 flex flex-col relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">{contest.name}</div>
                    <h4 className="text-lg font-black text-text-main leading-tight tracking-tight">{contest.role}</h4>
                  </div>
                  <button 
                    onClick={(e) => handleLike(contest.id, e)}
                    className="flex flex-col items-center gap-1 group/like p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-2xl transition-colors"
                  >
                    <Heart className={cn("w-5 h-5 transition-all", contest.likesCount > 0 ? "fill-red-500 text-red-500 scale-110" : "text-text-sub group-hover/like:text-red-500")} />
                    <span className="text-[10px] font-black text-text-sub leading-none">{contest.likesCount || 0}</span>
                  </button>
                </div>

                <div className="space-y-4 mb-8 mt-auto relative z-10">
                  <div className="flex items-center gap-3 text-text-sub">
                    <div className="w-8 h-8 bg-bg dark:bg-card-bg border border-border rounded-lg flex items-center justify-center text-text-sub">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[9px] font-bold uppercase tracking-wider leading-none">Data da Prova</div>
                      <div className="text-xs font-black text-text-main">{contest.examDate || 'A definir'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-text-sub">
                    <div className="w-8 h-8 bg-bg dark:bg-card-bg border border-border rounded-lg flex items-center justify-center text-text-sub">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[9px] font-bold uppercase tracking-wider leading-none">Matérias</div>
                      <div className="text-xs font-black text-text-main">{contest.subjects?.length || 0} disciplinas</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-border mt-auto relative z-10">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setPreviewContest(contest)}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Search className="w-3 h-3" />
                      Ver Grade
                    </button>
                  </div>
                  <button 
                    onClick={() => handleClone(contest)}
                    className="bg-primary text-white p-2.5 rounded-xl shadow-lg shadow-primary/20 hover:scale-110 transition-all active:scale-95 flex items-center gap-2 px-4"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Favoritar</span>
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-card-bg border border-border w-full max-w-2xl rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 md:p-8 border-b border-border bg-bg/50 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg md:text-xl font-black text-text-main">{previewContest.role}</h3>
                  <p className="text-[10px] font-bold text-text-sub uppercase tracking-wider">{previewContest.name}</p>
                </div>
                <button 
                  onClick={() => setPreviewContest(null)}
                  className="p-2 hover:bg-bg rounded-full transition-colors text-text-sub"
                >
                  <Search className="w-5 h-5 rotate-90" />
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-bg dark:bg-bg/20 rounded-2xl p-4 border border-border">
                    <div className="text-[9px] font-bold text-text-sub uppercase mb-1">Total de Matérias</div>
                    <div className="text-lg md:text-xl font-black text-primary">{previewContest.subjects?.length || 0}</div>
                  </div>
                  <div className="bg-bg dark:bg-bg/20 rounded-2xl p-4 border border-border">
                    <div className="text-[9px] font-bold text-text-sub uppercase mb-1">Data Prevista</div>
                    <div className="text-lg md:text-xl font-black text-secondary">{previewContest.examDate || 'A definir'}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-text-sub uppercase tracking-widest">Matérias Incluídas</h4>
                    <span className="text-[10px] font-bold text-primary">Estudo IA Pronto</span>
                  </div>
                  <div className="space-y-2 pb-4">
                    {previewContest.subjects?.map((sub, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-bg dark:bg-bg/10 border border-border rounded-xl group/item">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-primary/40 group-hover/item:scale-125 transition-transform" />
                           <span className="text-xs md:text-sm font-bold text-text-main">{sub.name}</span>
                        </div>
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase">
                          {sub.incidence}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-bg/30 border-t border-border flex gap-4">
                <button 
                  onClick={() => setPreviewContest(null)}
                  className="flex-1 py-3 text-xs font-bold text-text-sub hover:bg-bg rounded-2xl transition-colors"
                >
                  Fechar
                </button>
                <button 
                  onClick={() => {
                    handleClone(previewContest);
                    setPreviewContest(null);
                  }}
                  className="flex-[2] bg-primary text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Favoritar este Edital
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Comunidade;
