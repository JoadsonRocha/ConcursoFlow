import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Contest } from '../types';
import { toast } from 'sonner';
import { 
  BrainCircuit, 
  Lightbulb, 
  Play,
  Award,
  Plus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
  Share2,
  X,
  Trash2,
  BookOpen,
  Globe
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { generateQuizQuestions } from '../services/gemini';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, getDocs, limit, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import FlashcardCreator from '../components/FlashcardCreator';
import FlashcardDeck from '../components/FlashcardDeck';
import SVGMapCreator from '../components/SVGMapCreator';
import SVGMapViewer from '../components/SVGMapViewer';
import { Node, Edge } from 'reactflow';
import { useAuth } from '../contexts/AuthContext';

export default function Microlearning({ contest }: { contest: Contest }) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'selection' | 'quiz' | 'flashcards' | 'library'>('selection');
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  const [studyModeCards, setStudyModeCards] = useState<any[] | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [showMindMapCreator, setShowMindMapCreator] = useState(false);
  const [mapToDelete, setMapToDelete] = useState<string | null>(null);
  const [flashcardToDelete, setFlashcardToDelete] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [personalMindMaps, setPersonalMindMaps] = useState<any[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [librarySubTab, setLibrarySubTab] = useState<'flashcards' | 'maps'>('flashcards');
  const [dueCards, setDueCards] = useState<any[]>([]);
  const [previewMindMap, setPreviewMindMap] = useState<any | null>(null);
  const [previewFlashcard, setPreviewFlashcard] = useState<any | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishType, setPublishType] = useState<'map' | 'flashcard'>('map');
  const [publishForm, setPublishForm] = useState({ title: '', description: '' });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'users', auth.currentUser.uid, 'flashcards'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFlashcards(cards);
      
      // Filter cards due for review (nextReview <= now)
      const now = new Date();
      const due = cards.filter((card: any) => {
        if (!card.nextReview) return true;
        const reviewDate = card.nextReview.toDate();
        return reviewDate <= now;
      });
      setDueCards(due);
      setIsLibraryLoading(false);
    }, (err) => {
      console.error(err);
      setIsLibraryLoading(false);
    });

    const qMaps = query(collection(db, 'mindmaps'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribeMaps = onSnapshot(qMaps, (snapshot) => {
      setPersonalMindMaps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLibraryLoading(false);
    }, (err) => {
      console.error(err);
      setIsLibraryLoading(false);
    });

    return () => {
        unsubscribe();
        unsubscribeMaps();
    };
  }, []);

  const saveMindMap = async (svgData: string[], title: string) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'mindmaps'), {
        title,
        svgData,
        isPublic: false,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        likesCount: 0,
        clonesCount: 0
      });
      toast.success("Mapa mental salvo!");
      setShowMindMapCreator(false);
    } catch (err) {
      console.error("Erro ao salvar mapa mental:", err);
      toast.error("Erro ao salvar mapa mental: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const deleteMindMap = (e: any, id: string) => {
    e.stopPropagation();
    setMapToDelete(id);
  };

  const confirmDeleteMindMap = async () => {
    if (!mapToDelete) return;
    try {
      await deleteDoc(doc(db, 'mindmaps', mapToDelete));
      setMapToDelete(null);
      toast.success("Mapa mental apagado!");
    } catch (err) {
      console.error("Erro ao apagar mapa mental:", err);
      toast.error("Erro ao apagar mapa mental.");
    }
  };

  const confirmDeleteFlashcard = async () => {
    if (!flashcardToDelete || !auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'flashcards', flashcardToDelete));
      setFlashcardToDelete(null);
      toast.success("Flashcard removido!");
    } catch (err) {
      console.error("Erro ao apagar flashcard:", err);
      toast.error("Erro ao apagar flashcard.");
    }
  };

  const handleShareMindMap = async (map: any) => {
    const text = `Confira meu mapa mental: ${map.title}\nGerado pelo App Stratis Planner!`;
    const url = window.location.origin;

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

  const publishItem = async () => {
    console.log("Publishing item...", { publishType, previewMindMap: !!previewMindMap, previewFlashcard: !!previewFlashcard, publishForm });
    if (!auth.currentUser) {
      console.error("No user logged in.");
      return;
    }
    const item = publishType === 'map' ? previewMindMap : previewFlashcard;
    if (!item) {
      console.warn("Item not found for publishing.");
      return;
    }

    if (!publishForm.title.trim() || !publishForm.description.trim()) {
      console.warn("Validation failed: title or description is empty.", publishForm);
      toast.error("O título e a descrição são obrigatórios para publicar na comunidade.");
      return;
    }

    toast.info("Publicando na comunidade...");

    try {
      if (publishType === 'map') {
        await updateDoc(doc(db, 'mindmaps', item.id), {
          title: publishForm.title,
          description: publishForm.description,
          isPublic: true,
          ownerName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Concurseiro',
          ownerIsCreator: !!profile?.isCreator,
          publishedAt: serverTimestamp(),
        });
        setPreviewMindMap((prev: any) => ({ ...prev, isPublic: true }));
      } else {
        // For flashcards, we add to shared_flashcards collection
        await addDoc(collection(db, 'shared_flashcards'), {
          front: item.front,
          back: item.back,
          subjectName: item.subject || 'Geral',
          ownerId: auth.currentUser.uid,
          ownerName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Concurseiro',
          ownerIsCreator: !!profile?.isCreator,
          likesCount: 0,
          clonesCount: 0,
          title: publishForm.title,
          description: publishForm.description,
          createdAt: serverTimestamp(),
        });
        // Optionally mark local card as published if that field existed, but it's not strictly necessary for flashcards logic
      }

      toast.success(publishType === 'map' ? 'Mapa publicado!' : 'Flashcard publicado!');
      setShowPublishModal(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao publicar: ' + err?.message);
    }
  };

  const startQuiz = async (subject: string) => {
    setLoading(true);
    setActiveTab('quiz');
    try {
      const data = await generateQuizQuestions(subject, "tópicos gerais");
      setQuizData(data);
      setCurrentQuestion(0);
      setScore(0);
      setShowResult(false);
    } catch (err) {
      toast.error("Erro ao carregar quiz. Tente novamente.");
      setActiveTab('selection');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (idx === quizData[currentQuestion].correctAnswerIndex) {
      setScore(s => s + 1);
    }
    setTimeout(() => {
      if (currentQuestion < quizData.length - 1) {
        setCurrentQuestion(c => c + 1);
        setSelectedOption(null);
      } else {
        setShowResult(true);
      }
    }, 2000);
  };

  // Extract Modal logic to prevent re-mounting flicker
  const flashcardPreviewModal = (
    <AnimatePresence>
      {previewFlashcard && activeTab !== 'library' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-xl transition-all">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="rise-card w-full max-w-lg bg-white border border-border flex flex-col max-h-[80vh] overflow-hidden shadow-2xl p-8 space-y-8"
          >
            <div className="flex justify-between items-center gap-4">
              <span className="text-[10px] font-bold text-accent uppercase tracking-widest px-3 py-1 bg-accent/10 rounded-full border border-accent/20">
                {previewFlashcard.description || previewFlashcard.subjectName || previewFlashcard.subject || 'Flashcard'}
              </span>
              <button onClick={() => setPreviewFlashcard(null)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors"><X /></button>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-2">
              <div className="space-y-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Frente / Pergunta</span>
                <p className="text-lg font-bold text-slate-800 italic leading-relaxed">"{previewFlashcard.front}"</p>
              </div>
              
              <div className="h-px bg-slate-100 w-full" />

              <div className="space-y-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Verso / Resposta</span>
                <p className="text-base text-slate-600 leading-relaxed font-medium">
                  {previewFlashcard.back}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
               <button 
                onClick={() => {
                  setPublishType('flashcard');
                  setPublishForm({ title: previewFlashcard.front, description: '' });
                  setShowPublishModal(true);
                }}
                className="flex-1 bg-indigo-50 text-indigo-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
               >
                 <Globe className="w-3.5 h-3.5" />
                 Compartilhar na Comunidade
               </button>
               <button 
                onClick={() => setPreviewFlashcard(null)}
                className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
               >
                 Fechar
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const mindMapPreviewModal = (
    <AnimatePresence>
      {previewMindMap && activeTab !== 'library' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-xl transition-all">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="rise-card w-full max-w-5xl bg-white border border-border flex flex-col max-h-[90vh] overflow-hidden shadow-2xl p-8 space-y-6"
          >
            <div className="flex justify-between items-center gap-4">
              <h3 className="text-xl font-display text-text-main font-bold italic truncate flex-1">{previewMindMap.title}</h3>
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => handleShareMindMap(previewMindMap)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-700 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all border border-slate-200"
                  title="Compartilhar em Redes Sociais"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[9px]">Compartilhar</span>
                </button>
                {!previewMindMap.isPublic ? (
                  <button 
                    onClick={() => {
                      setPublishType('map');
                      setPublishForm({ title: previewMindMap.title, description: '' });
                      setShowPublishModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[9px]">Publicar na Comunidade</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[10px] uppercase tracking-widest rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[9px]">Na Comunidade</span>
                  </div>
                )}
                <button onClick={() => setPreviewMindMap(null)} className="p-2 rounded-xl hover:bg-slate-100"><X /></button>
              </div>
            </div>
            <div className="flex-1 bg-slate-50 border border-border rounded-xl flex flex-col overflow-y-auto min-h-[400px]">
              <SVGMapViewer svgData={previewMindMap.svgData || []} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const deleteConfirmationModal = (
    <AnimatePresence>
      {(mapToDelete || flashcardToDelete) && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center"
          >
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-display font-bold text-slate-800 mb-2">
              {mapToDelete ? 'Apagar Mapa Mental' : 'Remover Flashcard'}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              {mapToDelete 
                ? 'Tem certeza que deseja apagar este mapa permanentemente?' 
                : 'Este flashcard será removido da sua coleção de estudos.'}
            </p>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => { setMapToDelete(null); setFlashcardToDelete(null); }}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={mapToDelete ? confirmDeleteMindMap : confirmDeleteFlashcard}
                className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-red-500/30"
              >
                Apagar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const publishModal = (
    <AnimatePresence>
      {showPublishModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center"
          >
            <Share2 className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
            <h3 className="text-xl font-display font-bold text-slate-800 mb-2">
              {publishType === 'map' ? 'Publicar Mapa Mental' : 'Publicar Flashcard'}
            </h3>
            <p className="text-slate-500 text-sm mb-6 font-medium italic">Compartilhe seu conhecimento com a comunidade de concurseiros.</p>
            
            <div className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block">Título Público</label>
                <input 
                  value={publishForm.title}
                  onChange={(e) => setPublishForm({...publishForm, title: e.target.value})}
                  placeholder="Como este material deve ser listado?"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-700 transition-all italic"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5 ">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Descrição Objetiva</label>
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">* Obrigatório</span>
                </div>
                <textarea 
                  value={publishForm.description}
                  onChange={(e) => setPublishForm({...publishForm, description: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[120px] resize-none focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm text-slate-600 font-medium leading-relaxed transition-all"
                  placeholder="Explique resumidamente o que este material aborda (ex: Principais prazos da Lei 8112)..."
                />
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between text-xs text-slate-500">
                <span>Autor: <strong className="text-slate-700">{auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0]}</strong></span>
                <span>{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowPublishModal(false)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={publishItem}
                disabled={!publishForm.title.trim() || !publishForm.description.trim()}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:hover:bg-slate-300 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-indigo-600/30 disabled:shadow-none"
              >
                Publicar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const studyModeModal = (
    <AnimatePresence>
      {studyModeCards && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col p-4 md:p-8 overflow-y-auto">
          <header className="flex items-center justify-between gap-4 mb-8">
            <button 
              onClick={() => setStudyModeCards(null)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-text-sub flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-widest">Sair do Estudo</span>
            </button>
            <div className="text-center">
              <h2 className="text-xl font-display font-bold text-text-main italic">Modo de Estudo</h2>
              <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest">{studyModeCards.length} cartões da biblioteca</p>
            </div>
            <div className="w-10 md:w-32" />
          </header>
          <div className="max-w-xl mx-auto w-full">
            <FlashcardDeck cards={studyModeCards} onFinish={() => setStudyModeCards(null)} />
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  const allModals = (
    <>
      {flashcardPreviewModal}
      {mindMapPreviewModal}
      {deleteConfirmationModal}
      {publishModal}
      {studyModeModal}
    </>
  );

  if (activeTab === 'flashcards') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        {allModals}
        <header className="flex items-center justify-between gap-4">
          <button 
            onClick={() => setActiveTab('selection')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-text-sub"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-display font-bold text-text-main italic">Sessão de Flashcards</h2>
            <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest">{dueCards.length} cartões pendentes</p>
          </div>
          <div className="w-10" />
        </header>

        {dueCards.length > 0 ? (
          <FlashcardDeck cards={dueCards} onFinish={() => setActiveTab('selection')} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center shadow-sm">
               <CheckCircle2 className="w-10 h-10 text-accent" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-display font-bold text-text-main">Tudo Limpo!</h3>
              <p className="text-sm text-text-sub max-w-xs mx-auto">Você não tem cards para revisar no momento. Que tal criar novos?</p>
            </div>
            <button 
              onClick={() => setShowCreator(true)}
              className="px-8 py-3 bg-accent text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-accent/20"
            >
              Criar Novo Card
            </button>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'library') {
    if (previewFlashcard) {
      return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
          {allModals}
          <header className="flex items-center justify-between gap-4">
            <button 
              onClick={() => setPreviewFlashcard(null)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-text-sub"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
              <div className="text-center flex-1 min-w-0">
                <h2 className="text-xl font-display font-bold text-text-main italic truncate">{previewFlashcard.front}</h2>
                <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest">{previewFlashcard.description || previewFlashcard.subjectName || previewFlashcard.subject || 'Flashcard'}</p>
              </div>
            <button 
              onClick={() => {
                setPublishType('flashcard');
                setPreviewFlashcard(previewFlashcard);
                setPublishForm({ title: previewFlashcard.front, description: '' });
                setShowPublishModal(true);
              }}
              className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
              title="Publicar na Comunidade"
            >
              <Globe className="w-5 h-5" />
            </button>
          </header>

          <div className="space-y-6">
            <div className="rise-card w-full bg-white border border-border shadow-sm p-8 space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Frente / Pergunta</span>
                  <p className="text-xl font-display font-bold text-slate-800 italic leading-relaxed">"{previewFlashcard.front}"</p>
                </div>
                
                <div className="h-px bg-slate-100 w-full" />

                <div className="space-y-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Verso / Resposta</span>
                  <p className="text-base text-slate-600 leading-relaxed font-medium">
                    {previewFlashcard.back}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setPreviewFlashcard(null)}
                className="flex-1 bg-slate-100 text-text-main py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
              >
                Voltar à Biblioteca
              </button>
              <button 
                onClick={() => {
                  setFlashcardToDelete(previewFlashcard.id);
                  setPreviewFlashcard(null);
                }}
                className="px-6 bg-red-50 text-red-500 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (previewMindMap) {
      return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
          {allModals}
          <header className="flex items-center justify-between gap-4">
            <button 
              onClick={() => setPreviewMindMap(null)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-text-sub"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center flex-1 min-w-0">
              <h2 className="text-xl font-display font-bold text-text-main italic truncate">{previewMindMap.title}</h2>
              <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest">Visualização de Mapa Mental</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleShareMindMap(previewMindMap)}
                className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all border border-slate-200"
                title="Compartilhar"
              >
                <Share2 className="w-5 h-5" />
              </button>
              {!previewMindMap.isPublic && (
                <button 
                  onClick={() => {
                    setPublishType('map');
                    setPublishForm({ title: previewMindMap.title, description: '' });
                    setShowPublishModal(true);
                  }}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  title="Publicar na Comunidade"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </header>

          <div className="rise-card w-full bg-white border border-border flex flex-col shadow-sm overflow-hidden h-[75vh]">
            <div className="flex-1 bg-slate-50 relative overflow-hidden">
               <SVGMapViewer svgData={previewMindMap.svgData || []} />
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
                onClick={() => setPreviewMindMap(null)}
                className="flex-1 bg-slate-100 text-text-main py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
              >
                Voltar à Lista
              </button>
            {previewMindMap.isPublic && (
              <div className="px-6 flex items-center justify-center bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-bold text-[10px] uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Na Comunidade
              </div>
            )}
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
        {allModals}
        <header className="flex items-center justify-between gap-4">
          <button 
            onClick={() => setActiveTab('selection')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-text-sub"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center flex-1">
            <h2 className="text-xl font-display font-bold text-text-main italic">Minha Biblioteca</h2>
            <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest">Gerencie seus materiais de estudo</p>
          </div>
          <button 
            onClick={() => {
              if (librarySubTab === 'flashcards') setShowCreator(true);
              else setShowMindMapCreator(true);
            }}
            className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
          </button>
        </header>

        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-200">
          <button 
            onClick={() => setLibrarySubTab('flashcards')}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
              librarySubTab === 'flashcards' ? "bg-white text-primary shadow-sm" : "text-text-sub hover:text-text-main"
            )}
          >
            Flashcards ({flashcards.length})
          </button>
          <button 
            onClick={() => setLibrarySubTab('maps')}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
              librarySubTab === 'maps' ? "bg-white text-indigo-600 shadow-sm" : "text-text-sub hover:text-text-main"
            )}
          >
            Mapas Mentais ({personalMindMaps.length})
          </button>
        </div>

        {librarySubTab === 'flashcards' && flashcards.length > 0 && (
          <div className="flex justify-end">
            <button 
              onClick={() => setStudyModeCards(flashcards)}
              className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-accent/20"
            >
              <Play className="w-4 h-4 fill-current" />
              Estudar Coleção
            </button>
          </div>
        )}

        {isLibraryLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest animate-pulse">Sincronizando Biblioteca...</p>
          </div>
        ) : librarySubTab === 'flashcards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {flashcards.length === 0 ? (
              <div className="col-span-full py-20 text-center text-text-sub text-xs font-bold uppercase tracking-widest border-2 border-dashed border-border rounded-3xl">
                Você ainda não criou flashcards
              </div>
            ) : (
              flashcards.map(card => (
                <div 
                  key={card.id} 
                  onClick={() => setPreviewFlashcard(card)}
                  className="p-5 bg-white border border-border rounded-2xl shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col h-full"
                >
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="w-10 h-10 bg-accent/5 rounded-xl flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                      <BrainCircuit className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPublishType('flashcard');
                          setPreviewFlashcard(card);
                          setPublishForm({ title: card.front, description: '' });
                          setShowPublishModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        title="Publicar na Comunidade"
                      >
                        <Globe className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setFlashcardToDelete(card.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="text-[10px] font-bold text-accent uppercase tracking-widest px-2 py-0.5 bg-accent/10 rounded-md inline-block">
                      {card.description || card.subjectName || card.subject || 'Geral'}
                    </div>
                    <h4 className="text-sm font-bold text-text-main line-clamp-2">{card.front}</h4>
                    <p className="text-[11px] text-text-sub italic line-clamp-2 leading-relaxed">{card.back}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
             {personalMindMaps.length === 0 ? (
              <div className="col-span-full py-20 text-center text-text-sub text-xs font-bold uppercase tracking-widest border-2 border-dashed border-border rounded-3xl">
                Você ainda não criou mapas mentais
              </div>
            ) : (
              personalMindMaps.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => setPreviewMindMap(m)}
                  className="p-3 bg-white border border-border rounded-xl shadow-sm hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="aspect-square bg-white rounded-lg mb-3 overflow-hidden relative group-hover:brightness-95 transition-all flex items-center justify-center border border-slate-100 shadow-inner">
                    {m.svgData?.[0] ? (
                      <div className="w-full h-full flex items-center justify-center p-1 opacity-80 group-hover:opacity-100 transition-opacity overflow-hidden">
                         <div 
                           className="w-[800px] h-[1131px] scale-[0.08] sm:scale-[0.1] origin-center pointer-events-none [&>svg]:w-full [&>svg]:h-full" 
                           dangerouslySetInnerHTML={{ __html: m.svgData[0] }} 
                         />
                      </div>
                    ) : (
                      <Share2 className="w-6 h-6 text-slate-300" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary/5 backdrop-blur-[1px]">
                      <div className="bg-white/90 p-2 rounded-full shadow-sm">
                        <Search className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-text-main truncate uppercase tracking-tight leading-tight">{m.title}</h4>
                    <div className="flex items-center justify-between gap-2">
                       <p className="text-[8px] text-text-sub font-bold uppercase tracking-widest italic truncate">
                        {m.isPublic ? 'Comunidade' : 'Privado'}
                      </p>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setPublishType('map');
                            setPreviewMindMap(m);
                            setPublishForm({ title: m.title, description: '' });
                            setShowPublishModal(true);
                          }}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                        >
                          <Share2 className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={(e) => deleteMindMap(e, m.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'selection') {
    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
        {allModals}
        {showCreator && <FlashcardCreator onClose={() => setShowCreator(false)} subjects={contest.subjects || []} />}
        <header className="space-y-2">
          <div className="flex items-center gap-3 text-primary font-bold text-[9px] uppercase tracking-widest">
            <div className="w-1 h-1 rounded-full bg-primary shadow-sm"></div>
            Treinamento e Prática
          </div>
          <h1 className="text-2xl md:text-3xl font-display text-text-main tracking-tight font-bold italic">
            Revisão
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-text-sub text-[10px] md:text-sm max-w-2xl border-l-2 border-primary/30 pl-4 leading-relaxed font-medium italic flex-1">
              Ferramentas para consolidar o edital e acelerar sua retenção através de questões e repetição espaçada.
            </p>
            <button 
              onClick={() => setActiveTab('library')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-text-main rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border border-slate-200"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Ver Biblioteca
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Flashcards Sector */}
          <div className="rise-card p-6 group relative overflow-hidden flex flex-col justify-between min-h-[300px] bg-white border border-border shadow-sm">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
               <Lightbulb className="w-24 h-24 text-accent" />
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="bg-accent/10 border border-accent/20 w-12 h-12 rounded-xl flex items-center justify-center text-accent shadow-sm">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-display text-text-main font-bold">Flashcards</h3>
                <p className="text-text-sub text-xs leading-relaxed italic">Memorize conceitos importantes com facilidade.</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 relative z-10">
               <div className="flex gap-2">
                  <div className="p-3 bg-slate-50 border border-border rounded-xl text-center flex-1">
                    <div className="text-xl font-display font-bold text-text-main">{flashcards.length}</div>
                    <div className="text-[10px] font-bold text-text-sub uppercase tracking-widest mt-1">Totais</div>
                  </div>
                  <div className="p-3 bg-accent/5 border border-accent/10 rounded-xl text-center flex-1">
                    <div className="text-xl font-display font-bold text-accent">{dueCards.length}</div>
                    <div className="text-[10px] font-bold text-accent uppercase tracking-widest mt-1">Hoje</div>
                  </div>
               </div>

                <div className="flex gap-2 mt-2">
                 <button 
                  onClick={() => setShowCreator(true)}
                  className="flex-1 bg-slate-100 text-text-main py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                 >
                   <Plus className="w-3.5 h-3.5" />
                   Criar
                 </button>
                 <button 
                  onClick={() => setActiveTab('flashcards')}
                  disabled={dueCards.length === 0}
                  className="flex-[2] bg-accent text-white py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-md shadow-accent/20 disabled:opacity-50 disabled:shadow-none"
                 >
                  Revisar Cartões
                 </button>
               </div>
            </div>
          </div>

          {/* Mind Maps Sector */}
          <div className="rise-card p-6 group relative overflow-hidden flex flex-col justify-between min-h-[300px] bg-white border border-border shadow-sm">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
               <Share2 className="w-24 h-24 text-indigo-500" />
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="bg-indigo-500/10 border border-indigo-500/20 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-500 shadow-sm">
                <Share2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-display text-text-main font-bold">Mapas Mentais</h3>
                <p className="text-text-sub text-xs leading-relaxed italic">Visualize conexões de qualquer assunto.</p>
              </div>
            </div>
            <div className="pt-4 relative z-10">
                 <button 
                  onClick={() => setShowMindMapCreator(true)}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-md shadow-indigo-500/20 mb-3"
                 >
                  Criar Novo Mapa
                 </button>
                 <div className="space-y-2 mt-3 max-h-32 overflow-y-auto pr-1">
                    {personalMindMaps.map(m => (
                      <div 
                        key={m.id} 
                        className="group/item flex flex-col gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-all cursor-pointer"
                        onClick={() => setPreviewMindMap(m)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-indigo-800 font-bold truncate italic flex-1">{m.title}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            {!m.isPublic && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPublishType('map');
                                  setPreviewMindMap(m);
                                  setPublishForm({ title: m.title, description: '' });
                                  setShowPublishModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                                title="Publicar na Comunidade"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button 
                              onClick={(e) => deleteMindMap(e, m.id)} 
                              className="p-1.5 rounded-lg bg-white border border-red-100 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all"
                              title="Apagar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {m.isPublic && (
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                            <CheckCircle2 className="w-3 h-3" />
                            Publicado
                          </div>
                        )}
                      </div>
                    ))}
                 </div>
            </div>
          </div>
        </div>
        
        {showMindMapCreator && <SVGMapCreator onClose={() => setShowMindMapCreator(false)} saveMap={saveMindMap} />}

        <div className="space-y-6">
          {/* Main Content would be here */}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-12 animate-in fade-in duration-1000">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <BrainCircuit className="w-10 h-10 text-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2 md:space-y-4">
            <h2 className="text-xl md:text-3xl font-display text-text-main tracking-wider uppercase italic font-bold">Preparando questões...</h2>
            <p className="text-text-sub text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  if (showResult) {
    const percentage = Math.round((score/quizData.length)*100);
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-in zoom-in-95 duration-700">
        <div className="rise-card p-14 md:p-20 text-center space-y-12 w-full max-w-xl">
          <div className="space-y-8 relative z-10">
            <div className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <Award className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-display text-text-main italic font-black tracking-tight">Sessão Finalizada.</h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed italic">Progresso transmitido com sucesso. Cadência mantida.</p>
            </div>

            <div className="flex items-center justify-center gap-10 py-6">
              <div className="flex flex-col items-center">
                <span className="text-primary text-7xl md:text-8xl font-display leading-none italic font-black">{score}</span>
                <span className="text-xs font-black text-slate-600 uppercase tracking-wider mt-4">Acertos</span>
              </div>
              <div className="h-16 w-px bg-border"></div>
              <div className="flex flex-col items-center">
                <span className="text-text-main text-7xl md:text-8xl font-display leading-none italic font-black">{quizData.length}</span>
                <span className="text-xs font-black text-slate-600 uppercase tracking-wider mt-4">Total</span>
              </div>
            </div>

            <div className="bg-slate-100 border border-border py-6 px-12 rounded-2xl inline-block shadow-inner">
               <span className="text-xs font-black text-slate-700 uppercase tracking-wider mr-4">Performance Tática</span>
               <span className="text-2xl font-display text-text-main italic font-black">{percentage}%</span>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('selection')}
            className="w-full bg-primary text-white py-6 rounded-[1.5rem] font-bold text-sm uppercase tracking-wider hover:scale-105 transition-all shadow-xl active:scale-95 border-2 border-primary"
          >
            Sincronizar e Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-in slide-in-from-right-8 duration-700 pb-20">
        {allModals}
        <header className="flex justify-between items-center px-8 border-b border-border pb-8">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-primary/10 text-primary border border-primary/20 rounded-2xl flex items-center justify-center font-display text-2xl italic font-black shadow-sm">
                {currentQuestion + 1}
              </div>
              <div className="space-y-1">
                <div className="text-xs font-black text-slate-600 uppercase tracking-wider">Célula Atual</div>
                <div className="text-xs font-black text-text-main uppercase tracking-wider">{quizData.length} MÓDULOS TOTAIS</div>
              </div>
            </div>
            <div className="text-xs font-black text-primary uppercase tracking-wider bg-primary/10 border border-primary/20 px-6 py-3 rounded-full shadow-2xl animate-pulse">Monitoramento Ativo</div>
        </header>

        <div className="rise-card p-10 md:p-16 space-y-14">
            <h2 className="text-xl md:text-3xl font-display leading-[1.4] text-text-main italic font-bold tracking-tight">
                {quizData[currentQuestion]?.question}
            </h2>

            <div className="grid grid-cols-1 gap-5">
                {quizData[currentQuestion]?.options.map((opt: string, idx: number) => {
                    const isCorrect = selectedOption !== null && idx === quizData[currentQuestion].correctAnswerIndex;
                    const isWrong = selectedOption === idx && idx !== quizData[currentQuestion].correctAnswerIndex;
                    
                    return (
                        <button
                            key={idx}
                            disabled={selectedOption !== null}
                            onClick={() => handleAnswer(idx)}
                            className={cn(
                                "w-full text-left p-7 md:p-10 rounded-[2rem] border-2 transition-all flex justify-between items-center group relative overflow-hidden",
                                selectedOption === null 
                                  ? "bg-slate-50 border-border hover:border-primary/50 hover:bg-slate-100 text-slate-500" 
                                  : isCorrect 
                                    ? "bg-accent/10 border-accent text-text-main shadow-[0_0_30px_rgba(245,158,11,0.3)] scale-105 z-10" 
                                    : isWrong 
                                      ? "bg-red-500/10 border-red-500 text-text-main shadow-[0_0_30px_rgba(239,68,68,0.3)] scale-105 z-10" 
                                      : "bg-slate-100 border-border opacity-50 text-slate-400"
                            )}
                        >
                            <span className="text-base font-bold pr-10 leading-relaxed italic">{opt}</span>
                            <div className="shrink-0">
                              {isCorrect && <CheckCircle2 className="w-8 h-8 text-accent animate-in zoom-in duration-500" />}
                              {isWrong && <XCircle className="w-8 h-8 text-red-500 animate-in zoom-in duration-500" />}
                              {!selectedOption && (
                                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-border flex items-center justify-center group-hover:border-primary group-hover:bg-primary transition-all shadow-sm">
                                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-white" />
                                </div>
                              )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <AnimatePresence>
                {selectedOption !== null && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-primary/5 p-10 rounded-2xl border-2 border-primary/20 relative overflow-hidden shadow-inner"
                    >
                        <BrainCircuit className="absolute -right-6 -bottom-6 w-32 h-32 text-primary/5 rotate-12" />
                        <div className="flex items-center gap-4 mb-6 relative z-10">
                          <div className="bg-primary/20 p-2.5 rounded-xl text-primary">
                             <BrainCircuit className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Explicação</span>
                        </div>
                        <p className="text-sm md:text-base text-text-sub leading-relaxed italic relative z-10 font-medium">"{quizData[currentQuestion]?.explanation}"</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
}
