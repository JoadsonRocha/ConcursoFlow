import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, increment, where, addDoc, serverTimestamp, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Contest } from '../types';
import { Users, Heart, Download, Search, Filter, Calendar, Award, User as UserIcon, X, ChevronRight, BookOpen, Lightbulb, Share2, Layers, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import SVGMapViewer from '../components/SVGMapViewer';
import ProModal from '../components/ProModal';
import { toast } from 'sonner';

export default function Comunidade({ onImport, contests }: { onImport: (contest: Contest) => void, contests?: Contest[] }) {
  const { user, profile, updateProfile, isPro, planType } = useAuth();
  const [showProModal, setShowProModal] = useState(false);
  const [proFeatureName, setProFeatureName] = useState('');
  const [activeTab, setActiveTab] = useState<'contests' | 'flashcards' | 'mindmaps'>('contests');
  const [sharedContests, setSharedContests] = useState<Contest[]>([]);
  const [sharedDecks, setSharedDecks] = useState<any[]>([]);
  const [sharedMindMaps, setSharedMindMaps] = useState<any[]>([]);
  const [personalFlashcardsCount, setPersonalFlashcardsCount] = useState(0);
  const [personalMapsCount, setPersonalMapsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Todos');
  const [previewContest, setPreviewContest] = useState<Contest | null>(null);
  const [previewMindMap, setPreviewMindMap] = useState<any | null>(null);

  // Pagination states
  const [lastVisibleContest, setLastVisibleContest] = useState<any>(null);
  const [hasMoreContests, setHasMoreContests] = useState(true);
  const [lastVisibleDeck, setLastVisibleDeck] = useState<any>(null);
  const [hasMoreDecks, setHasMoreDecks] = useState(true);
  const [lastVisibleMindMap, setLastVisibleMindMap] = useState<any>(null);
  const [hasMoreMindMaps, setHasMoreMindMaps] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);

  const PAGE_SIZE = 6;

  useEffect(() => {
    if (!user) return;

    let active = true;

    const loadCounts = async () => {
      try {
        const snapFlash = await getDocs(collection(db, 'users', user.uid, 'flashcards'));
        if (!active) return;
        setPersonalFlashcardsCount(snapFlash.docs.length);
      } catch (err) {
        console.warn("Erro ao carregar contagem de flashcards:", err);
      }

      try {
        const snapMaps = await getDocs(query(collection(db, 'mindmaps'), where('ownerId', '==', user.uid)));
        if (!active) return;
        setPersonalMapsCount(snapMaps.docs.length);
      } catch (err) {
        console.warn("Erro ao carregar contagem de mapas mentais:", err);
      }
    };

    loadCounts();

    return () => {
      active = false;
    };
  }, [user]);

  const fetchContests = async (isFirstPage = false) => {
    if (!isFirstPage && (!hasMoreContests || pageLoading)) return;
    
    if (isFirstPage) {
      setLoading(true);
    } else {
      setPageLoading(true);
    }

    try {
      let q;
      if (isFirstPage) {
        q = query(
          collection(db, 'shared_contests'),
          orderBy('updatedAt', 'desc'),
          limit(PAGE_SIZE)
        );
      } else {
        q = query(
          collection(db, 'shared_contests'),
          orderBy('updatedAt', 'desc'),
          startAfter(lastVisibleContest),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        ...(doc.data() as any),
        id: doc.id
      })) as Contest[];

      if (isFirstPage) {
        setSharedContests(docs);
      } else {
        setSharedContests(prev => [...prev, ...docs]);
      }

      setLastVisibleContest(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMoreContests(snapshot.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error("Erro ao carregar editais:", err);
      toast.error("Erro ao carregar editais compartilhados.");
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  const fetchDecks = async (isFirstPage = false) => {
    if (!isFirstPage && (!hasMoreDecks || pageLoading)) return;

    if (isFirstPage) {
      setLoading(true);
    } else {
      setPageLoading(true);
    }

    try {
      let q;
      if (isFirstPage) {
        q = query(
          collection(db, 'shared_decks'),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE)
        );
      } else {
        q = query(
          collection(db, 'shared_decks'),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisibleDeck),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        ...(doc.data() as any),
        id: doc.id
      }));

      if (isFirstPage) {
        setSharedDecks(docs);
      } else {
        setSharedDecks(prev => [...prev, ...docs]);
      }

      setLastVisibleDeck(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMoreDecks(snapshot.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error("Erro ao carregar decks:", err);
      toast.error("Erro ao carregar decks compartilhados.");
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  const fetchMindMaps = async (isFirstPage = false) => {
    if (!isFirstPage && (!hasMoreMindMaps || pageLoading)) return;

    if (isFirstPage) {
      setLoading(true);
    } else {
      setPageLoading(true);
    }

    try {
      let q;
      if (isFirstPage) {
        q = query(
          collection(db, 'mindmaps'),
          where('isPublic', '==', true),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE)
        );
      } else {
        q = query(
          collection(db, 'mindmaps'),
          where('isPublic', '==', true),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisibleMindMap),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        ...(doc.data() as any),
        id: doc.id
      }));

      if (isFirstPage) {
        setSharedMindMaps(docs);
      } else {
        setSharedMindMaps(prev => [...prev, ...docs]);
      }

      setLastVisibleMindMap(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMoreMindMaps(snapshot.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error("Erro ao carregar mapas mentais:", err);
      toast.error("Erro ao carregar mapas mentais.");
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'contests') {
      if (sharedContests.length === 0) {
        fetchContests(true);
      }
    } else if (activeTab === 'flashcards') {
      if (sharedDecks.length === 0) {
        fetchDecks(true);
      }
    } else {
      if (sharedMindMaps.length === 0) {
        fetchMindMaps(true);
      }
    }
  }, [activeTab]);

  const handleLike = async (id: string, collectionName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        likesCount: increment(1)
      });

      // Update local state for immediate feedback
      if (collectionName === 'shared_contests') {
        setSharedContests(prev => prev.map(c => c.id === id ? { ...c, likesCount: ((c as any).likesCount || 0) + 1 } : c));
      } else if (collectionName === 'shared_decks') {
        setSharedDecks(prev => prev.map(d => d.id === id ? { ...d, likesCount: (d.likesCount || 0) + 1 } : d));
      } else if (collectionName === 'mindmaps') {
        setSharedMindMaps(prev => prev.map(m => m.id === id ? { ...m, likesCount: (m.likesCount || 0) + 1 } : m));
      }
    } catch (err) {
      console.error("Erro ao dar like:", err);
    }
  };

  const handleShareMindMap = async (map: any) => {
    const text = `Confira este mapa mental na comunidade: ${map.title}\nGerado pelo App Estratégia de Estudos!`;
    const url = window.location.href; // Linking to the current page which is community

    if (navigator.share) {
      try {
        await navigator.share({
          title: map.title,
          text: text,
          url: url,
        });
        toast.success("Mapa compartilhado!");
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error("Erro ao compartilhar:", err);
          toast.error("Erro ao compartilhar.");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast.success("Link copiado para a área de transferência!");
      } catch (err) {
        toast.error("Erro ao copiar link.");
      }
    }
  };

  const handleCloneDeck = async (deck: any) => {
    if (!user) return;
    
    const limit = planType === 'pro' ? 1000 : 20;
    if (personalFlashcardsCount + deck.cards.length > limit) {
      setProFeatureName(`Limite de ${limit} Flashcards atingido`);
      setShowProModal(true);
      return;
    }

    try {
      const batch = deck.cards.map((card: any) => {
        const clonedCard = {
          ...card,
          ownerId: user.uid,
          isPublic: false,
          likesCount: 0,
          nextReview: serverTimestamp(),
          interval: 0,
          ease: 2.5,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        return addDoc(collection(db, 'users', user.uid, 'flashcards'), clonedCard);
      });
      
      await Promise.all(batch);

      // Update usage
      await updateProfile({
        flashcardUsage: (profile?.flashcardUsage || 0) + deck.cards.length
      });
      
      // Update clones count
      await updateDoc(doc(db, 'shared_decks', deck.id), {
        clonesCount: increment(1)
      });
      setSharedDecks(prev => prev.map(d => d.id === deck.id ? { ...d, clonesCount: (d.clonesCount || 0) + 1 } : d));

      toast.success(`Deck "${deck.title}" com ${deck.cards.length} cards adicionado!`);
    } catch (err) {
      console.error("Erro ao clonar deck:", err);
      toast.error("Erro ao clonar conjunto de cards.");
    }
  };

  const handleClone = async (contest: Contest) => {
    if (!user) return;
    
    const limit = planType === 'pro' ? Infinity : 1;
    if (contests && contests.length >= limit) {
       setProFeatureName(`Limite de ${limit} Edital atingido`);
       setShowProModal(true);
       return;
    }
    
    try {
      const resetSchedule = (contest.schedule || []).map(day => ({
        ...day,
        completed: false
      }));

      const resetSubjects = (contest.subjects || []).map(sub => ({
        ...sub,
        completedTopics: 0,
        topics: (sub.topics || []).map(topic => ({
          ...topic,
          completed: false
        }))
      }));

      const clonedContest = {
        ...contest,
        schedule: resetSchedule,
        subjects: resetSubjects,
        scheduleStartDate: new Date().toISOString().split('T')[0],
        meppReviews: [],
        dailyHistory: [],
        ownerId: user.uid,
        isPublic: false,
        likesCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onImport(clonedContest);

      // Update usage if PRO
      if (isPro) {
         await updateProfile({
           importUsage: (profile?.importUsage || 0) + 1
         });
      }

      toast.success(`${contest.role} adicionado aos seus estudos!`);
    } catch (err) {
      console.error("Erro ao clonar:", err);
      toast.error("Erro ao clonar edital.");
    }
  };

  const handleCloneMindMap = async (map: any) => {
    if (!user) return;
    
    const limit = planType === 'pro' ? 50 : 3;
    if (personalMapsCount >= limit) {
      setProFeatureName(`Limite de ${limit} Mapas Mentais atingido`);
      setShowProModal(true);
      return;
    }

    try {
      const clonedMap = {
        title: `${map.title} (Clone)`,
        svgData: map.svgData,
        isPublic: false,
        ownerId: user.uid,
        likesCount: 0,
        clonesCount: 0,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'mindmaps'), clonedMap);

      // Update usage
      await updateProfile({
        mindmapUsage: (profile?.mindmapUsage || 0) + 1
      });

      toast.success(`Mapa "${map.title}" adicionado aos seus estudos!`);
      
      // Increment clones count on original
      await updateDoc(doc(db, 'mindmaps', map.id), {
        clonesCount: increment(1)
      });
      setSharedMindMaps(prev => prev.map(m => m.id === map.id ? { ...m, clonesCount: (m.clonesCount || 0) + 1 } : m));
    } catch (err) {
      console.error("Erro ao clonar mapa mental:", err);
      toast.error("Erro ao clonar mapa mental.");
    }
  };

  const filtered = sharedContests.filter(c => {
    const matchesSearch = c.role.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRole === 'Todos' || c.role.includes(filterRole);
    return matchesSearch && matchesFilter;
  });

  const filteredDecks = sharedDecks.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const filteredMindMaps = sharedMindMaps.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="w-full px-4 md:px-8 overflow-hidden space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      <header className="flex flex-col gap-4 border-b border-border pb-4 md:pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-display text-text-main tracking-tight font-bold">
              Materiais <span className="text-primary italic">Compartilhados</span>
            </h1>
            <p className="text-text-sub text-[10px] md:text-xs font-medium leading-relaxed max-w-xl hidden sm:block">
              Encontre cronogramas e flashcards compartilhados por outros estudantes para acelerar sua aprovação. Ao salvar um item, ele vai para sua biblioteca e continua disponível para a comunidade.
            </p>
          </div>

          <div className="flex w-full lg:w-auto bg-slate-100 p-1 rounded-xl sm:rounded-2xl border border-border">
            <button 
              onClick={() => setActiveTab('contests')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all",
                activeTab === 'contests' ? "bg-white text-primary shadow-sm" : "text-text-sub hover:text-text-main"
              )}
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Editais
            </button>
            <button 
              onClick={() => setActiveTab('flashcards')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all",
                activeTab === 'flashcards' ? "bg-white text-accent shadow-sm" : "text-text-sub hover:text-text-main"
              )}
            >
              <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Cards
            </button>
            <button 
              onClick={() => setActiveTab('mindmaps')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all",
                activeTab === 'mindmaps' ? "bg-white text-indigo-500 shadow-sm" : "text-text-sub hover:text-text-main"
              )}
            >
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Mapas
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
          <div className="relative group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder={activeTab === 'contests' ? "Localizar cargo ou instituição..." : "Localizar assunto ou tópico..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 border border-border rounded-xl py-2.5 sm:py-3.5 pl-10 pr-4 text-xs text-text-main placeholder:text-text-sub focus:ring-2 ring-primary/10 transition-all outline-none"
            />
          </div>
          {activeTab === 'contests' && (
            <div className="relative w-full sm:w-auto min-w-[150px]">
              <select 
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full bg-slate-100 border border-border rounded-xl py-2.5 sm:py-3.5 px-4 sm:px-6 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-sub outline-none cursor-pointer hover:bg-slate-200 transition-all appearance-none"
              >
                <option value="Todos">Todas Áreas</option>
                <option value="Analista">Analista</option>
                <option value="Técnico">Técnico</option>
                <option value="Auditor">Auditor</option>
              </select>
            </div>
          )}
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-80 bg-slate-100 rounded-2xl animate-pulse border border-border shadow-sm"></div>
          ))}
        </div>
      ) : activeTab === 'contests' ? (
        filtered.length === 0 ? (
          <div className="rise-card p-24 text-center space-y-8 flex flex-col items-center bg-slate-50 border-border">
            <div className="w-24 h-24 bg-white border border-border rounded-[2rem] flex items-center justify-center shadow-sm">
              <Users className="w-10 h-10 text-slate-400" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-display text-text-main italic font-bold">Nenhum Registro Encontrado</h3>
              <p className="text-slate-500 text-sm font-medium italic">Tente ajustar seus parâmetros de busca no acervo.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              <AnimatePresence mode="popLayout">
                {filtered.map((contest) => (
                  <motion.div
                    key={contest.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="group relative rise-card p-8 bg-white border border-border transition-all duration-500 hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between mb-8 relative z-10">
                      <div className="space-y-2 max-w-[75%]">
                        <p className="text-[10px] text-text-sub line-clamp-1 italic">{contest.name}</p>
                        <h4 className="text-sm font-display text-text-main leading-tight line-clamp-2 group-hover:text-primary transition-colors italic">{contest.role}</h4>
                        <div className="flex items-center gap-2 pt-1">
                           <UserIcon className="w-3 h-3 text-text-sub/50" />
                           <span className="text-[10px] text-text-sub truncate flex items-center gap-1 normal-case">
                             por {contest.ownerName || 'Estrategista'}
                             {contest.ownerIsCreator && <Award className="w-3 h-3 text-primary" />}
                           </span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => handleLike(contest.id!, 'shared_contests', e)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all active:scale-95 border",
                          (contest as any).likesCount > 0 
                            ? "bg-red-500/5 border-red-500/10 text-red-500" 
                            : "bg-slate-50 border-border text-text-sub hover:border-red-500/20 hover:text-red-500"
                        )}
                      >
                        <Heart className={cn("w-5 h-5 transition-transform duration-500", (contest as any).likesCount > 0 && "fill-red-500")} />
                        <span className="text-xs font-bold leading-none">{(contest as any).likesCount || 0}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8 pt-6 border-t border-border relative z-10">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-text-sub">
                           <Calendar className="w-3 h-3 text-primary" />
                           Prova
                        </div>
                        <div className="text-[11px] font-semibold text-text-main truncate italic">{contest.examDate || 'A definir'}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-text-sub">
                           <Award className="w-3 h-3 text-accent" />
                           Materiais
                        </div>
                        <div className="text-[11px] font-semibold text-text-main italic">{contest.subjects?.length || 0} Matérias</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-auto relative z-10">
                      <button 
                        onClick={() => setPreviewContest(contest)}
                        className="p-3.5 rounded-xl text-xs bg-slate-50 border border-border text-text-sub hover:text-primary transition-all shadow-sm"
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
            {hasMoreContests && (
              <div className="flex justify-center pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fetchContests(false)}
                  disabled={pageLoading}
                  className="px-8 py-3.5 bg-white border border-border text-primary hover:border-primary/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
                >
                  {pageLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Carregando...
                    </>
                  ) : (
                    "Carregar mais Editais"
                  )}
                </motion.button>
              </div>
            )}
          </div>
        )
      ) : activeTab === 'flashcards' ? (
        /* Flashcards Deck List */
        filteredDecks.length === 0 ? (
          <div className="rise-card p-24 text-center space-y-8 flex flex-col items-center bg-slate-50 border-border">
            <div className="w-24 h-24 bg-accent/5 border border-accent/10 rounded-[2rem] flex items-center justify-center shadow-sm">
              <Layers className="w-10 h-10 text-accent/40" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-display text-text-main italic font-bold">Sem Conjuntos de Flashcards</h3>
              <p className="text-slate-500 text-sm font-medium italic">Seja o primeiro a compartilhar um lote de cartões de estudo.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredDecks.map((d) => (
                  <motion.div
                    key={d.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative bg-white border border-border rounded-2xl p-5 hover:border-accent/30 transition-all flex flex-col hover:shadow-lg"
                  >
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-accent uppercase tracking-widest bg-accent/5 px-2 py-1 rounded-lg border border-accent/10 w-fit">
                              Deck de Flashcards
                          </span>
                          <span className="text-[10px] font-bold text-text-sub uppercase tracking-wider">{d.cards?.length || 0} Cartões</span>
                       </div>
                       <button 
                        onClick={(e) => handleLike(d.id, 'shared_decks', e)}
                        className="text-text-sub hover:text-red-500 transition-colors flex items-center gap-1"
                       >
                         <Heart className={cn("w-3.5 h-3.5", d.likesCount > 0 && "fill-red-500 text-red-500")} />
                         <span className="text-[10px] font-bold">{d.likesCount || 0}</span>
                       </button>
                    </div>
                    <div className="space-y-2 flex-1 mb-6">
                       <h3 className="text-sm font-bold text-text-main line-clamp-1 italic">{d.title}</h3>
                       {d.description && <p className="text-xs text-text-sub line-clamp-2 leading-relaxed">{d.description}</p>}
                    </div>
                    <div className="pt-4 border-t border-border flex items-center justify-between mt-auto">
                       <span className="text-[8px] font-medium text-text-sub uppercase flex items-center gap-1">
                         Por {d.ownerName}
                         {d.ownerIsCreator && <Award className="w-3 h-3 text-accent" />}
                       </span>
                       <button 
                        onClick={() => handleCloneDeck(d)}
                        className="flex items-center gap-2 px-3 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent transition-all hover:text-white font-bold text-[9px] uppercase tracking-wider"
                       >
                          <Download className="w-3 h-3" />
                          Salvar Lote
                       </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {hasMoreDecks && (
              <div className="flex justify-center pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fetchDecks(false)}
                  disabled={pageLoading}
                  className="px-8 py-3.5 bg-white border border-border text-accent hover:border-accent/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
                >
                  {pageLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Carregando...
                    </>
                  ) : (
                    "Carregar mais Cartões"
                  )}
                </motion.button>
              </div>
            )}
          </div>
        )
      ) : activeTab === 'mindmaps' ? (
          /* MindMaps List */
          filteredMindMaps.length === 0 ? (
            <div className="rise-card p-24 text-center space-y-8 flex flex-col items-center bg-slate-50 border-border">
              <div className="w-24 h-24 bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] flex items-center justify-center shadow-sm">
                <Layers className="w-10 h-10 text-indigo-500/40" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-display text-text-main italic font-bold">Sem Mapas Mentais</h3>
                <p className="text-slate-500 text-sm font-medium italic">Seja o primeiro a compartilhar seus mapas mentais.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 pb-20">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredMindMaps.map((m) => (
                    <motion.div
                      key={m.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group relative bg-white border border-border rounded-2xl p-5 hover:border-indigo-500/30 transition-all flex flex-col cursor-pointer hover:shadow-lg hover:-translate-y-1"
                      onClick={() => setPreviewMindMap(m)}
                    >
                      <div className="flex justify-between items-start mb-4">
                         <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-500/5 px-2 py-1 rounded-lg border border-indigo-500/10">
                            Mapa Mental
                         </span>
                         <span className="text-[10px] font-semibold text-slate-400">
                           {m.publishedAt ? new Date(m.publishedAt.toDate()).toLocaleDateString() : 'Recente'}
                         </span>
                      </div>
                      <div className="space-y-3 flex-1 mb-4">
                         <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug">{m.title}</h3>
                         {m.description && (
                           <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{m.description}</p>
                         )}
                      </div>
                      <div className="pt-4 border-t border-border flex items-center justify-between mt-auto">
                         <div className="flex items-center gap-2">
                           <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-600 shrink-0">
                             {m.ownerName?.[0]?.toUpperCase() || 'E'}
                           </div>
                           <span className="text-[10px] font-medium text-slate-600 truncate max-w-[100px] flex items-center gap-1">
                             {m.ownerName || 'Estrategista'}
                             {m.ownerIsCreator && <Award className="w-3 h-3 text-indigo-500 shrink-0" />}
                           </span>
                         </div>
                         
                         <div className="flex items-center gap-2">
                           <button 
                             className="flex items-center gap-1.5 text-slate-400 hover:text-red-500 transition-colors px-2 py-1 bg-slate-50 rounded-lg border border-transparent hover:border-red-100"
                             onClick={(e) => handleLike(m.id, 'mindmaps', e)}
                           >
                             <Heart className="w-3.5 h-3.5" />
                             <span className="text-xs font-bold">{m.likesCount || 0}</span>
                           </button>
                           <button 
                             className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-500 transition-colors px-2 py-1 bg-slate-50 rounded-lg border border-transparent hover:border-indigo-100"
                             onClick={(e) => {
                               e.stopPropagation();
                               handleCloneMindMap(m);
                             }}
                             title="Importar para meus mapas"
                           >
                             <Download className="w-3.5 h-3.5" />
                             <span className="text-xs font-bold">{m.clonesCount || 0}</span>
                           </button>
                         </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {hasMoreMindMaps && (
                <div className="flex justify-center pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fetchMindMaps(false)}
                    disabled={pageLoading}
                    className="px-8 py-3.5 bg-white border border-border text-indigo-500 hover:border-indigo-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
                  >
                    {pageLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Carregando...
                      </>
                    ) : (
                      "Carregar mais Mapas"
                    )}
                  </motion.button>
                </div>
              )}
            </div>
          )
        ) : null
      }

      {/* Preview Modal Contest */}
      <AnimatePresence>
        {previewContest && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-xl transition-all">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="rise-card w-full max-w-2xl bg-white border border-border flex flex-col max-h-[90vh] overflow-hidden shadow-2xl"
            >
              <div className="p-8 md:p-10 border-b border-border flex items-center justify-between relative bg-slate-50 ">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider italic">{previewContest.name}</p>
                  <h3 className="text-2xl md:text-3xl font-display text-text-main tracking-tight font-bold italic">{previewContest.role}</h3>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-xs font-bold text-text-sub uppercase tracking-wider bg-slate-100 border border-border px-4 py-1.5 rounded-full italic flex items-center gap-1">
                      Originado por {previewContest.ownerName || 'Estrategista'}
                      {(previewContest as any).ownerIsCreator && <Award className="w-3.5 h-3.5 text-primary" />}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewContest(null)}
                  className="w-12 h-12 flex items-center justify-center bg-white border border-border text-text-sub hover:text-text-main rounded-xl transition-all shadow-sm group"
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              <div className="p-8 md:p-10 overflow-y-auto space-y-10 scroll-smooth">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-6 border border-border">
                    <div className="text-xs font-bold text-text-sub uppercase tracking-wider mb-2 border-b border-border pb-2">Conteúdo Estratégico</div>
                    <div className="text-2xl font-display text-primary italic font-bold">{previewContest.subjects?.length || 0} Disciplinas</div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-6 border border-border">
                    <div className="text-xs font-bold text-text-sub uppercase tracking-wider mb-2 border-b border-border pb-2">Horizonte Temporal</div>
                    <div className="text-2xl font-display text-accent italic font-bold">{previewContest.examDate?.split('-')[0] || 'A definir'}</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <h4 className="text-xs font-bold text-text-sub uppercase tracking-wider">Módulos de Estudo</h4>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">
                      <Star className="w-3 h-3" />
                      Sugestões do App
                    </div>
                  </div>
                  <div className="space-y-4">
                    {previewContest.subjects?.map((sub, i) => (
                      <div key={i} className="bg-white border border-border rounded-2xl overflow-hidden group/sub shadow-sm">
                        <div className="p-5 flex items-center justify-between bg-slate-50/50 ">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              <span className="text-sm font-bold text-text-main italic">{sub.name}</span>
                           </div>
                           <span className={cn(
                             "text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider",
                             sub.incidence === 'Muito Alta' ? "bg-red-50 text-red-500 border border-red-100" : "bg-slate-100 text-text-sub"
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
                    Obter & Salvar Meus Concursos
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewMindMap && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-xl transition-all">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="rise-card w-full max-w-5xl bg-white border border-border flex flex-col max-h-[90vh] overflow-hidden shadow-2xl p-8 space-y-6"
            >
              <div className="flex justify-between items-center gap-4">
                <h3 className="text-xl font-display text-text-main font-bold italic truncate flex-1">{previewMindMap.title}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleShareMindMap(previewMindMap)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Compartilhar</span>
                  </button>
                  <button 
                    onClick={() => handleCloneMindMap(previewMindMap)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Salvar & Preservar na Comunidade</span>
                  </button>
                  <button onClick={() => setPreviewMindMap(null)} className="p-2 rounded-xl hover:bg-slate-100"><X /></button>
                </div>
              </div>
              <div className="flex-1 bg-slate-50 border border-border rounded-xl overflow-hidden min-h-[400px]">
                <SVGMapViewer svgData={previewMindMap.svgData || []} />
              </div>
              <div className="text-xs font-bold text-text-sub uppercase tracking-widest text-center flex items-center justify-center gap-1">
                Por {previewMindMap.ownerName || 'Estrategista'}
                {previewMindMap.ownerIsCreator && <Award className="w-3.5 h-3.5 text-indigo-500" />}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ProModal isOpen={showProModal} onClose={() => setShowProModal(false)} featureName={proFeatureName || "Funcionalidade PRO"} />
    </div>
  );
}
