import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { 
  Plus, 
  Search, 
  FileText, 
  Youtube, 
  Globe, 
  Trash2, 
  Send, 
  ChevronRight, 
  BookOpen, 
  Sparkles, 
  Lightbulb, 
  Share2, 
  X, 
  ArrowLeft,
  FileUp,
  MessageSquare,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { toast } from 'sonner';

interface Source {
  id: string;
  title: string;
  type: 'text' | 'file' | 'youtube' | 'web';
  content: string;
  url?: string;
  fileName?: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  createdAt?: any;
}

interface NotebookSourcesProps {
  onBack: () => void;
  subjects: any[];
  contestId?: string;
}

export default function NotebookSources({ onBack, subjects, contestId }: NotebookSourcesProps) {
  const { user } = useAuth();
  // Sources state
  const [sources, setSources] = useState<Source[]>([]);
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [subTab, setSubTab] = useState<'chat' | 'content'>('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // New Source Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSourceType, setNewSourceType] = useState<'text' | 'file' | 'youtube' | 'web'>('text');
  const [newSourceForm, setNewSourceForm] = useState({
    title: '',
    text: '',
    url: ''
  });
  const [isImporting, setIsImporting] = useState(false);

  // File drag & drop state
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // AI Generation states
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false);

  // 1. Subscribe to study sources
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users', user.uid, 'sources'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Source));
      // Sort client-side to be 100% immune to Firestore index generation delay
      docsList.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tB - tA; // descending (newest first)
      });
      setSources(docsList);
    }, (err: any) => {
      console.warn('Error fetching sources:', err);
      if (auth.currentUser) {
        if (err?.code === 'permission-denied') {
          toast.error('Erro de Permissão (Produção): Para rodar essas novas funcionalidades no seu Firebase Oficial, você precisa atualizar as regras (firestore.rules) do seu projeto para permitir acesso às novas sub-coleções (ex: users/{userId}/{document=**})', { duration: 10000 });
        } else {
          toast.error(`Erro ao sincronizar fontes: ${err?.code || 'Código Indisponível'} - ${err?.message || 'Desconhecido'}`);
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Subscribe to messages when active source changes
  useEffect(() => {
    if (!user || !activeSource) {
      setMessages([]);
      return;
    }

    const qMsgs = query(
      collection(db, 'users', user.uid, 'sources', activeSource.id, 'messages')
    );

    const unsubscribeMsgs = onSnapshot(qMsgs, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      // Sort strictly client-side by raw creation fields to bypass dynamic Firestore indexing limitations
      msgs.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
        return tA - tB; // ascending (oldest to newest)
      });
      setMessages(msgs);
    }, (err: any) => {
      console.warn('Realtime messages load error:', err);
      if (err?.code === 'permission-denied') {
         toast.error('Erro de permissão no Firebase para carregar o chat. Atualize firestore.rules em produção.');
      }
    });

    return () => unsubscribeMsgs();
  }, [user, activeSource?.id]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || ext === 'txt' || ext === 'md') {
      setSelectedFile(file);
      setNewSourceForm(prev => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, "") // Set title from filename
      }));
      toast.success(`Arquivo "${file.name}" selecionado.`);
    } else {
      toast.error('Formato inválido. Selecione apenas arquivos PDF, TXT ou Markdown (.md).');
    }
  };

  // Helper: Client-side PDF Text Extraction
  const extractPdfText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();

    // Strategy 1: Try bundled modern pdfjs-dist
    try {
      const pdfjsLib = await import('pdfjs-dist');
      // Use unpkg instead of cdnjs for modern versions of pdfjs-dist
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      const maxPages = Math.min(pdf.numPages, 100);
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText;
    } catch (importErr) {
      console.warn('Strategy 1 PDF extraction failed. Trying highly-compatible Strategy 2 (CDN)...', importErr);
    }

    // Strategy 2: Fallback to highly compatible, stable v3 CDN
    try {
      const pdfjsLib = await new Promise<any>((resolve, reject) => {
        if ((window as any).pdfjsLib) {
          resolve((window as any).pdfjsLib);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
          const lib = (window as any).pdfjsLib;
          if (lib) {
            lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve(lib);
          } else {
            reject(new Error('pdfjsLib not found on window after CDN load'));
          }
        };
        script.onerror = (e) => reject(new Error('Failed to load pdf.js from CDN'));
        document.body.appendChild(script);
      });

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      const maxPages = Math.min(pdf.numPages, 100);
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText;
    } catch (cdnErr) {
      console.error('All PDF text extraction strategies failed:', cdnErr);
      throw new Error('Falha tática ao extrair conteúdo do arquivo PDF. Certifique-se de que ele não possui senha de proteção ou é imagem escaneada pura (sem texto selecionável).');
    }
  };

  // Save source to Firestore
  const handleSaveSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const title = newSourceForm.title.trim() || 'Nova Fonte';
    let content = '';
    let url = newSourceForm.url.trim();

    setIsImporting(true);
    const idToken = await user.getIdToken();

    try {
      if (newSourceType === 'text') {
        content = newSourceForm.text.trim();
        if (!content) {
          toast.error('Preencha o conteúdo da fonte.');
          setIsImporting(false);
          return;
        }
      } else if (newSourceType === 'file') {
        if (!selectedFile) {
          toast.error('Escolha ou arraste um arquivo válido.');
          setIsImporting(false);
          return;
        }

        const ext = selectedFile.name.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') {
          toast.info('Extraindo textos do arquivo PDF localmente...');
          content = await extractPdfText(selectedFile);
        } else {
          // txt, md
          content = await selectedFile.text();
        }

        if (!content || content.trim().length === 0) {
          throw new Error('O arquivo importado está vazio ou não pôde ser escaneado.');
        }
      } else if (newSourceType === 'web') {
        if (!url) {
          toast.error('Digite a URL do site.');
          setIsImporting(false);
          return;
        }
        toast.info('Scrapeando e higienizando textos do link...');
        
        const response = await fetch('/api/ai/scrape-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ url })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Erro ao obter conteúdo da página da Web.');
        }

        const result = await response.json();
        content = result.content;
        newSourceForm.title = result.title || newSourceForm.title;
      } else if (newSourceType === 'youtube') {
        if (!url) {
          toast.error('Insira o link do YouTube.');
          setIsImporting(false);
          return;
        }
        toast.info('Buscando metadados e sumário estratégico do YouTube...');
        
        const response = await fetch('/api/ai/scrape-youtube', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ url })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Erro ao obter dados do vídeo.');
        }

        const result = await response.json();
        content = result.content;
        newSourceForm.title = result.title || newSourceForm.title;
      }

      // Write to Firestore
      const sourceData: any = {
        title: newSourceForm.title.trim() || title,
        type: newSourceType,
        content,
        createdAt: serverTimestamp()
      };

      if (url) sourceData.url = url;
      if (selectedFile) sourceData.fileName = selectedFile.name;

      const docRef = await addDoc(collection(db, 'users', user.uid, 'sources'), sourceData);
      
      const createdSource: Source = {
        id: docRef.id,
        ...sourceData
      };

      toast.success('Fonte de estudo importada com sucesso!');
      setActiveSource(createdSource);
      setShowAddModal(false);
      resetAddForm();
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao importar fonte: ${err.message || err}`);
    } finally {
      setIsImporting(false);
    }
  };

  const resetAddForm = () => {
    setNewSourceForm({ title: '', text: '', url: '' });
    setSelectedFile(null);
    setNewSourceType('text');
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!user) return;
    if (!window.confirm('Tem certeza de que deseja excluir esta fonte e todas as conversas?')) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'sources', sourceId));
      toast.success('Fonte removida com sucesso.');
      if (activeSource?.id === sourceId) {
        setActiveSource(null);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover fonte.');
    }
  };

  // Chat Q&A sending
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSource || isChatLoading || !user) return;

    const userMsg = inputText.trim();
    setInputText('');
    setIsChatLoading(true);

    try {
      // 1. Write user msg immediately to Firestore (for realtime streaming rendering)
      const msgsCollection = collection(db, 'users', user.uid, 'sources', activeSource.id, 'messages');
      await addDoc(msgsCollection, {
        role: 'user',
        content: userMsg,
        createdAt: serverTimestamp(),
        timestamp: Date.now()
      });

      // 2. Prepare history for Gemini
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // 3. Post to our grounded API
      const idToken = await user.getIdToken();
      const response = await fetch('/api/ai/chat-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          message: userMsg,
          chatHistory: history,
          sourceContent: activeSource.content,
          sourceTitle: activeSource.title
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro na resposta do Tutor de IA.');
      }

      const rawResult = await response.json();
      
      // 4. Save model response to Firestore
      await addDoc(msgsCollection, {
        role: 'model',
        content: rawResult,
        createdAt: serverTimestamp(),
        timestamp: Date.now()
      });

    } catch (err: any) {
      console.error(err);
      toast.error(`Falha no chat: ${err.message || err}`);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Integration: Generate Flashcards from current document's exact context
  const handleGenerateFlashcardsFromSource = async () => {
    if (!activeSource || !user) return;
    if (isGeneratingFlashcards) return;

    setIsGeneratingFlashcards(true);
    toast.info('Analisando documento e formulando perguntas táticas de revisão...');

    try {
      const idToken = await user.getIdToken();
      
      // Step 1: Call flashcards API sending the document content as topic
      const count = 5;
      const response = await fetch('/api/ai/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          topic: `Conteúdo da Fonte "${activeSource.title}". Detalhes adicionais do texto:\n\n${activeSource.content.substring(0, 15000)}`,
          count
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao gerar flashcards.');
      }

      const generatedCards: any[] = await response.json();
      
      if (!Array.isArray(generatedCards) || generatedCards.length === 0) {
        throw new Error('Nenhum flashcard gerado.');
      }

      // Step 2: Inject generated cards straight into Firestore
      // Get the first subject ID for default organization if subjects exist
      const defaultSubjectId = subjects?.[0]?.id || 'general';
      const defaultSubjectName = subjects?.[0]?.name || 'Importados do Notebook';

      const writePromises = generatedCards.map(async (card) => {
        return addDoc(collection(db, 'users', user.uid, 'flashcards'), {
          front: card.front,
          back: card.back,
          subjectId: defaultSubjectId,
          subjectName: defaultSubjectName,
          ownerId: user.uid,
          ownerName: user.displayName || 'Estudante',
          isPublic: false,
          interval: 1,
          ease: 2.5,
          nextReview: new Date(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      await Promise.all(writePromises);
      toast.success(`Sucesso! ${generatedCards.length} flashcards foram injetados diretamente na sua biblioteca.`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao fabricar flashcards: ${err.message || err}`);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  // Integration: Generate structured SVG Mind Map from document content
  const handleGenerateMindmapFromSource = async () => {
    if (!activeSource || !user) return;
    if (isGeneratingMindmap) return;

    setIsGeneratingMindmap(true);
    toast.info('Modelando arquitetura informacional do mapa mental...');

    try {
      const idToken = await user.getIdToken();
      
      // Step 1: Request SVG maps structured prompt from endpoint
      const response = await fetch('/api/ai/svg-map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          title: activeSource.title,
          prompt: `Gere um mapa conceitual hierárquico extremamente didático usando este texto:\n\n${activeSource.content.substring(0, 10000)}`,
          quantity: 1
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao gerar o mapa mental.');
      }

      const generatedMaps = await response.json();
      if (!Array.isArray(generatedMaps) || generatedMaps.length === 0) {
        throw new Error('Nenhum mapa retornado pela API.');
      }

      // Step 2: Push new mindmap to Firestore list
      await addDoc(collection(db, 'mindmaps'), {
        title: `Mapa: ${activeSource.title}`,
        nodes: [], // Custom SVGMaps handles rendering cleanly with raw SVGs injected inside SVGMapViewer or directly stored
        rawSvg: generatedMaps[0], // SvgMapViewer handles rendering rawSvg natively
        isPublic: false,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('Mapa mental gerado com sucesso! Já está salvo na sua Biblioteca.');
    } catch (err: any) {
      console.error(err);
      toast.error(`Falha no mapa mental: ${err.message || err}`);
    } finally {
      setIsGeneratingMindmap(false);
    }
  };

  const filteredSources = sources.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* 2. Top Header action rail */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
            id="btn_back_selection"
          >
            <ArrowLeft className="w-4 h-4 text-text-main" />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-display text-text-main font-bold italic tracking-tight">
              Fontes & Chat Inteligente
            </h2>
            <p className="text-text-sub text-[10px] md:text-xs">
              Mapeie conteúdos, cole textos ou traga links externos e estude de forma bidirecional.
            </p>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
          id="btn_open_add_source"
        >
          <Plus className="w-4 h-4" />
          Adicionar Fonte de Estudo
        </button>
      </div>

      {/* 3. Primary Two-Pane Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        
        {/* Left Side: Sources directory manager (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col h-full min-h-[400px]">
            
            {/* Search Input */}
            <div className="relative mb-4">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text"
                placeholder="Buscar fontes de estudo..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-text-main text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* List View */}
            <div className="space-y-2 overflow-y-auto max-h-[450px] flex-1 pr-1 custom-scrollbar">
              {filteredSources.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-text-sub italic font-medium">Nenhuma fonte cadastrada.</p>
                </div>
              ) : (
                filteredSources.map((source) => {
                  const isActive = activeSource?.id === source.id;
                  return (
                    <div 
                      key={source.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10' 
                          : 'bg-slate-50 border-slate-100 hover:bg-slate-100/60'
                      }`}
                      onClick={() => {
                        setActiveSource(source);
                        setSubTab('chat');
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <div className={`p-2 rounded-lg ${
                          source.type === 'youtube' ? 'bg-red-50 text-red-500' :
                          source.type === 'web' ? 'bg-blue-50 text-blue-500' :
                          source.type === 'file' ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {source.type === 'youtube' && <Youtube className="w-4 h-4" />}
                          {source.type === 'web' && <Globe className="w-4 h-4" />}
                          {source.type === 'file' && <FileText className="w-4 h-4" />}
                          {source.type === 'text' && <FileText className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-text-main truncate">{source.title}</h4>
                          <span className="text-[9px] uppercase tracking-wider text-text-sub font-bold block mt-0.5">
                            {source.type === 'youtube' ? 'YouTube Video' :
                             source.type === 'web' ? 'Web Link' :
                             source.type === 'file' ? 'Arquivo Upload' : 'Coleção de Texto'}
                          </span>
                        </div>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSource(source.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-text-sub font-semibold flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Dica: Use fontes para turbinar revisões.</span>
            </div>
          </div>
        </div>

        {/* Right Side: Primary Active Workspace Window (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          {!activeSource ? (
            <div className="flex flex-col items-center justify-center text-center p-12 h-full min-h-[450px]">
              <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 mb-5 shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-base font-display text-text-main font-bold italic">Estruture sua Fonte Tática</h3>
              <p className="text-xs text-text-sub max-w-sm mt-2 leading-relaxed">
                Selecione uma fonte existente no menu lateral ou adicione um novo recurso para começar a debater conteúdo com inteligência artificial.
              </p>
              
              <div className="mt-8 flex flex-wrap justify-center gap-4 max-w-md">
                <div onClick={() => { setNewSourceType('text'); setShowAddModal(true); }} className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100/40 rounded-xl cursor-pointer transition-all text-xs font-semibold text-text-main">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  <span>Texto Puro</span>
                </div>
                <div onClick={() => { setNewSourceType('file'); setShowAddModal(true); }} className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100/40 rounded-xl cursor-pointer transition-all text-xs font-semibold text-text-main">
                  <FileUp className="w-3.5 h-3.5 text-teal-600" />
                  <span>Arraste PDFs / TXT</span>
                </div>
                <div onClick={() => { setNewSourceType('youtube'); setShowAddModal(true); }} className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100/40 rounded-xl cursor-pointer transition-all text-xs font-semibold text-text-main">
                  <Youtube className="w-3.5 h-3.5 text-red-500" />
                  <span>Vídeo YouTube</span>
                </div>
                <div onClick={() => { setNewSourceType('web'); setShowAddModal(true); }} className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100/40 rounded-xl cursor-pointer transition-all text-xs font-semibold text-text-main">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  <span>Artigo da Web</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full min-h-[480px]">
              
              {/* Header Action rail */}
              <div className="bg-slate-50/80 border-b border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-bold text-text-main tracking-tight line-clamp-1">{activeSource.title}</h3>
                    <span className="text-[9px] px-2 py-0.5 bg-slate-200 rounded-full text-text-sub font-black uppercase tracking-wider">
                      {activeSource.type}
                    </span>
                  </div>
                  
                  {activeSource.url && (
                    <a 
                      href={activeSource.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] text-primary hover:underline font-bold tracking-tight line-clamp-1 flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3" />
                      {activeSource.url}
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Generate Flashcards */}
                  <button 
                    onClick={handleGenerateFlashcardsFromSource}
                    disabled={isGeneratingFlashcards}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 hover:text-amber-800 disabled:opacity-50 text-[10px] font-black uppercase tracking-wider.5 rounded-xl transition-all"
                  >
                    <Lightbulb className="w-3.5 h-3.5 animate-pulse" />
                    {isGeneratingFlashcards ? 'Construindo...' : 'Gerar Flashcards'}
                  </button>

                  {/* Generate Mind Map */}
                  <button 
                    onClick={handleGenerateMindmapFromSource}
                    disabled={isGeneratingMindmap}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 hover:text-indigo-800 disabled:opacity-50 text-[10px] font-black uppercase tracking-wider.5 rounded-xl transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {isGeneratingMindmap ? 'Gerando...' : 'Gerar Mapa'}
                  </button>
                </div>
              </div>

              {/* Tab Selector bar */}
              <div className="flex border-b border-slate-200">
                <button 
                  onClick={() => setSubTab('chat')}
                  className={`flex-1 py-2.5 text-[11px] font-black tracking-widest uppercase border-b-2 text-center transition-all ${
                    subTab === 'chat' 
                      ? 'border-primary text-primary bg-slate-50/20' 
                      : 'border-transparent text-text-sub hover:text-text-main'
                  }`}
                >
                  Chat com IA
                </button>
                <button 
                  onClick={() => setSubTab('content')}
                  className={`flex-1 py-2.5 text-[11px] font-black tracking-widest uppercase border-b-2 text-center transition-all ${
                    subTab === 'content' 
                      ? 'border-primary text-primary bg-slate-50/20' 
                      : 'border-transparent text-text-sub hover:text-text-main'
                  }`}
                >
                  Texto Escaneado ({Math.ceil(activeSource.content.length / 5)} palavras)
                </button>
              </div>

              {/* Sub Tab View contents */}
              <div className="flex-1 flex flex-col min-h-[300px]">
                {subTab === 'chat' ? (
                  <div className="flex-1 flex flex-col justify-between">
                    
                    {/* Chat dialog logs */}
                    <div className="flex-1 p-4 overflow-y-auto max-h-[330px] space-y-4 custom-scrollbar">
                      {messages.length === 0 ? (
                        <div className="text-center py-10 px-4 space-y-4">
                          <MessageSquare className="w-10 h-10 text-primary/30 mx-auto" />
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-text-main">Mesa redonda sobre sua Fonte</h4>
                            <p className="text-[11px] text-text-sub max-w-xs mx-auto leading-relaxed italic">
                              A inteligência artificial está sincronizada com o texto. Pergunte livremente ou selecione uma sugestão abaixo:
                            </p>
                          </div>

                          <div className="flex flex-col gap-2 max-w-sm mx-auto pt-2">
                            <button 
                              onClick={() => setInputText('Faça um resumo cirúrgico de 5 pontos-chave táticos sobre este material.')}
                              className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-[10px] font-medium text-text-main transition-all italic line-clamp-1"
                            >
                              📌 "Faça um resumo de 5 pontos-chave..."
                            </button>
                            <button 
                              onClick={() => setInputText('Quais os tópicos e termos mais cobrados em prova com base neste conteúdo?')}
                              className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-[10px] font-medium text-text-main transition-all italic line-clamp-1"
                            >
                              💡 "Quais os tópicos mais cobrados..."
                            </button>
                            <button 
                              onClick={() => setInputText('Crie 3 perguntas com pegadinhas táticas da banca sobre esta fonte.')}
                              className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-[10px] font-medium text-text-main transition-all italic line-clamp-1"
                            >
                              🎯 "Crie 3 perguntas com pegadinhas..."
                            </button>
                          </div>
                        </div>
                      ) : (
                        messages.map((m) => {
                          const isModel = m.role === 'model';
                          return (
                            <div 
                              key={m.id}
                              className={`flex ${isModel ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-1 duration-300`}
                            >
                              <div className={`p-3.5 max-w-[85%] rounded-2xl text-xs leading-relaxed shadow-sm ${
                                isModel 
                                  ? 'bg-slate-100 text-text-main border border-slate-100' 
                                  : 'bg-primary text-white font-medium'
                              }`}>
                                {isModel ? (
                                  <div className="markdown-body select-text">
                                    <Markdown>{m.content}</Markdown>
                                  </div>
                                ) : (
                                  <p className="whitespace-pre-wrap select-text">{m.content}</p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}

                      {/* Gemini answering loading indicator */}
                      {isChatLoading && (
                        <div className="flex justify-start animate-pulse">
                          <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex items-center gap-2 text-xs text-text-sub font-semibold">
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span>Tutor analisando e redigindo resposta...</span>
                          </div>
                        </div>
                      )}
                      
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Text area input */}
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-slate-50/40 flex items-center gap-2">
                      <input 
                        type="text"
                        placeholder="Pergunte sobre as regras, conceitos ou pegadinhas desta fonte..."
                        className="flex-1 px-4 py-3 bg-white border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium text-text-main"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        disabled={isChatLoading}
                      />
                      <button 
                        type="submit"
                        disabled={!inputText.trim() || isChatLoading}
                        className="p-3 bg-primary hover:brightness-110 disabled:opacity-45 text-white rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>

                  </div>
                ) : (
                  <div className="flex-1 p-5 overflow-y-auto max-h-[380px] bg-slate-50/50 block text-xs leading-relaxed text-text-main select-text font-mono whitespace-pre-wrap rounded-b-3xl border-t border-slate-100">
                    {activeSource.content}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>

      {/* 4. Modular Create Source Side Dialog (Modal) */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden"
              id="modal_add_study_source"
            >
              <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-text-main tracking-tight">Nova Fonte de Estudo</h3>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-text-main transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSource} className="p-6 space-y-5">
                
                {/* Method selector tab */}
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button 
                    type="button" 
                    onClick={() => { setNewSourceType('text'); setSelectedFile(null); }}
                    className={`py-2 text-[10px] font-black tracking-wider uppercase rounded-lg text-center transition-all ${
                      newSourceType === 'text' ? 'bg-white text-primary shadow-sm' : 'text-text-sub hover:text-text-main'
                    }`}
                  >
                    Texto
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setNewSourceType('file'); }}
                    className={`py-2 text-[10px] font-black tracking-wider uppercase rounded-lg text-center transition-all ${
                      newSourceType === 'file' ? 'bg-white text-primary shadow-sm' : 'text-text-sub hover:text-text-main'
                    }`}
                  >
                    PDF/TXT
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setNewSourceType('web'); setSelectedFile(null); }}
                    className={`py-2 text-[10px] font-black tracking-wider uppercase rounded-lg text-center transition-all ${
                      newSourceType === 'web' ? 'bg-white text-primary shadow-sm' : 'text-text-sub hover:text-text-main'
                    }`}
                  >
                    Link Web
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setNewSourceType('youtube'); setSelectedFile(null); }}
                    className={`py-2 text-[10px] font-black tracking-wider uppercase rounded-lg text-center transition-all ${
                      newSourceType === 'youtube' ? 'bg-white text-primary shadow-sm' : 'text-text-sub hover:text-text-main'
                    }`}
                  >
                    YouTube
                  </button>
                </div>

                {/* Form Fields input */}
                <div className="space-y-4">
                  
                  {/* Standard title input */}
                  <div>
                    <label className="block text-[10px] font-bold text-text-sub uppercase tracking-wider mb-1">Título Amigável da Fonte</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Lei 8.112 - Agente Administrativo"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium text-text-main"
                      value={newSourceForm.title}
                      onChange={(e) => setNewSourceForm(p => ({ ...p, title: e.target.value }))}
                    />
                  </div>

                  {/* If text input */}
                  {newSourceType === 'text' && (
                    <div>
                      <label className="block text-[10px] font-bold text-text-sub uppercase tracking-wider mb-1">Conteúdo do Material</label>
                      <textarea 
                        rows={6}
                        required
                        placeholder="Cole aqui apostilas, resumos, leis compiladas ou notas de aula..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium text-text-main"
                        value={newSourceForm.text}
                        onChange={(e) => setNewSourceForm(p => ({ ...p, text: e.target.value }))}
                      />
                    </div>
                  )}

                  {/* If File drag & drop input */}
                  {newSourceType === 'file' && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-text-sub uppercase tracking-wider mb-1">Arraste seu Documento</label>
                      <div 
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                          dragActive 
                            ? 'border-primary bg-primary/5' 
                            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                        }`}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          className="hidden" 
                          accept=".pdf,.txt,.md"
                          onChange={handleFileChange}
                        />
                        {selectedFile ? (
                          <div className="space-y-2">
                            <FileCheck className="w-10 h-10 text-teal-600 mx-auto" />
                            <p className="text-xs font-bold text-text-main">{selectedFile.name}</p>
                            <p className="text-[10px] text-text-sub">({Math.ceil(selectedFile.size / 1024)} KB) - Clique para alterar.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <FileUp className="w-10 h-10 text-slate-400 mx-auto" />
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-text-main">
                                Arraste e solte o arquivo aqui, ou <span className="text-primary font-bold">navegue localmente</span>
                              </p>
                              <p className="text-[10px] text-text-sub">Formatos aceitos: PDF, TXT ou Markdown (.md)</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* If Web link input */}
                  {newSourceType === 'web' && (
                    <div>
                      <label className="block text-[10px] font-bold text-text-sub uppercase tracking-wider mb-1">Endereço do Site (URL completa)</label>
                      <input 
                        type="url"
                        required
                        placeholder="https://g1.globo.com/politica/noticia/..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium text-text-main"
                        value={newSourceForm.url}
                        onChange={(e) => setNewSourceForm(p => ({ ...p, url: e.target.value }))}
                      />
                      <p className="text-[10px] text-text-sub italic mt-2 leading-relaxed">
                        A plataforma fará a varredura do site, removendo menus ou propagandas e filtrando o texto acadêmico principal.
                      </p>
                    </div>
                  )}

                  {/* If YouTube video input */}
                  {newSourceType === 'youtube' && (
                    <div>
                      <label className="block text-[10px] font-bold text-text-sub uppercase tracking-wider mb-1">Link do Vídeo do YouTube</label>
                      <input 
                        type="url"
                        required
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium text-text-main"
                        value={newSourceForm.url}
                        onChange={(e) => setNewSourceForm(p => ({ ...p, url: e.target.value }))}
                      />
                      <p className="text-[10px] text-text-sub italic mt-2 leading-relaxed">
                        Mapearemos dinamicamente os dados, índice de tópicos e informações detalhadas do vídeo do YouTube para contextualizar o chat de estudos.
                      </p>
                    </div>
                  )}

                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => { setShowAddModal(false); resetAddForm(); }}
                    className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-text-main uppercase tracking-wider transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isImporting}
                    className="flex-grow py-3 bg-primary hover:brightness-110 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    {isImporting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Importar Material
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
