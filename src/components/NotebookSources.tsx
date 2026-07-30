import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { 
  Plus,
  Search,
  Play,
  Globe,
  Youtube,
  Trash2,
  Send,
  ChevronRight,
  BookOpen,
  Sparkles,
  X,
  ArrowLeft,
  FileUp,
  MessageSquare,
  HelpCircle,
  FileCheck,
  ChevronDown,
  ArrowUp,
  MoreHorizontal,
  Brain,
  Layout,
  FileQuestion,
  ListChecks,
  Table2,
  FileText,
  Maximize2,
  Minimize2,
  Wand2,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { toast } from 'sonner';
import * as pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure worker safely
try {
  if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  }
} catch (e) {
  console.warn("[PDF.js] Failed to configure worker source statically, will fallback:", e);
}

interface Source {
  id: string;
  title: string;
  type: 'text' | 'file' | 'youtube' | 'web';
  content: string;
  url?: string;
  fileName?: string;
  quizQuestions?: any[];
  suggestedQuestions?: string[];
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
  onOpenFlashcards?: (cards: any[]) => void;
  onOpenMindmap?: (mapData: any) => void;
  onOpenQuiz?: (quiz: any[]) => void;
}

export default function NotebookSources({ onBack, subjects, contestId, onOpenFlashcards, onOpenMindmap, onOpenQuiz }: NotebookSourcesProps) {
  const { user } = useAuth();
  // Sources state
  const [sources, setSources] = useState<Source[]>([]);
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [sourceFlashcards, setSourceFlashcards] = useState<any[]>([]);
  const [sourceMindmaps, setSourceMindmaps] = useState<any[]>([]);
  const [allFlashcards, setAllFlashcards] = useState<any[]>([]);
  const [allMindmaps, setAllMindmaps] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [subTab, setSubTab] = useState<'chat' | 'content'>('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // New Source Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null);
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
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // Estado de bloqueio removido (funcionalidade liberada)
  const [isLockedForMaintenance, setIsLockedForMaintenance] = useState(false);
  
  // State for panels
  const [isSourcesPanelOpen, setIsSourcesPanelOpen] = useState(true);
  const [isStudioPanelOpen, setIsStudioPanelOpen] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState<'fonts' | 'chat' | 'studio'>('chat');

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
        toast.error(`Erro ao sincronizar fontes: ${err?.code || 'Desconhecido'}`);
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
      if (err?.code === 'permission-denied' && auth.currentUser) {
        toast.error('Sem permissão para ler o chat. Verifique se as regras oficiais foram atualizadas no seu projeto Firebase.');
      }
    });

    return () => {
      unsubscribeMsgs();
    };
  }, [user, activeSource?.id]);

  // 3. Subscribe to all user flashcards and mindmaps to display indicators and details
  useEffect(() => {
    if (!user) {
      setAllFlashcards([]);
      setAllMindmaps([]);
      return;
    }

    const qCards = query(collection(db, 'users', user.uid, 'flashcards'));
    const unsubCards = onSnapshot(qCards, (snap) => {
      setAllFlashcards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn('Error fetching all user flashcards:', err);
    });

    const qMaps = query(
      collection(db, 'mindmaps'),
      where('ownerId', '==', user.uid)
    );
    const unsubMaps = onSnapshot(qMaps, (snap) => {
      setAllMindmaps(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn('Error fetching all user mindmaps:', err);
    });

    return () => {
      unsubCards();
      unsubMaps();
    };
  }, [user]);

  // 4. Derive specific Lists for activeSource from all loaded items (reactive, prevents race conditions)
  useEffect(() => {
    if (!activeSource) {
      setSourceFlashcards([]);
      setSourceMindmaps([]);
      return;
    }
    setSourceFlashcards(allFlashcards.filter((c: any) => c.sourceId === activeSource.id));
    setSourceMindmaps(allMindmaps.filter((m: any) => m.sourceId === activeSource.id));
  }, [allFlashcards, allMindmaps, activeSource?.id]);

  // Keep activeSource synchronized with any real-time changes in the sources list
  useEffect(() => {
    if (!activeSource || sources.length === 0) return;
    const matched = sources.find(s => s.id === activeSource.id);
    if (matched) {
      const changed = JSON.stringify(matched.suggestedQuestions) !== JSON.stringify(activeSource.suggestedQuestions) ||
                      JSON.stringify(matched.quizQuestions) !== JSON.stringify(activeSource.quizQuestions) ||
                      matched.title !== activeSource.title ||
                      matched.content !== activeSource.content;
      if (changed) {
        setActiveSource(matched);
      }
    }
  }, [sources, activeSource?.id]);

  // Handle on-demand generation of suggested questions for sources lacking them
  useEffect(() => {
    if (!user || !activeSource) return;
    if (activeSource.suggestedQuestions && activeSource.suggestedQuestions.length > 0) return;

    const sourceId = activeSource.id;
    const content = activeSource.content;
    const title = activeSource.title;

    const generateQuestions = async () => {
      try {
        const idToken = await user.getIdToken();
        const docRef = doc(db, 'users', user.uid, 'sources', sourceId);
        
        const response = await fetch('/api/ai/suggest-questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ content, title })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.result && Array.isArray(data.result) && data.result.length > 0) {
            await updateDoc(docRef, { suggestedQuestions: data.result });
          }
        }
      } catch (err) {
        console.error("Erro ao gerar sugestões sob demanda:", err);
      }
    };

    generateQuestions();
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
    try {
      let activePdfjs: any = pdfjs;
      
      // Verification if the imported pdfjs is fully functional, otherwise fallback
      if (!activePdfjs || typeof activePdfjs.getDocument !== 'function') {
        activePdfjs = await new Promise<any>((resolve, reject) => {
          if ((window as any).pdfjsLib) {
            resolve((window as any).pdfjsLib);
            return;
          }
          const script = document.createElement('script');
          script.crossOrigin = "anonymous";
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
          script.onerror = () => reject(new Error('Failed to load pdf.js from CDN'));
          document.body.appendChild(script);
        });
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await activePdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      
      const numPages = Math.min(pdf.numPages, 100); 
      
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => (item as any).str).join(" ");
        fullText += pageText + "\n";
      }
      return fullText;
    } catch (err) {
      console.error("PDF Extraction error:", err);
      throw new Error("Não foi possível ler o PDF. Certifique-se de que não possui senha, não é uma imagem escaneada, ou tente copiar e colar o texto manualmente.");
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

      // Fire and forget: generate suggested questions
      fetch('/api/ai/suggest-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ content, title: sourceData.title })
      })
      .then(r => r.json())
      .then(async (data) => {
        if (data.result && Array.isArray(data.result) && data.result.length > 0) {
           await updateDoc(docRef, { suggestedQuestions: data.result });
           // Se for a activeSource, atualiza o estado
           setActiveSource(prev => prev && prev.id === docRef.id ? { ...prev, suggestedQuestions: data.result } : prev);
        }
      })
      .catch(err => console.error("Erro ao gerar sugestões:", err));

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

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'sources', sourceId));
      toast.success('Fonte removida com sucesso.');
      if (activeSource?.id === sourceId) {
        setActiveSource(null);
      }
      setSourceToDelete(null);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover fonte.');
    }
  };

  // Chat Q&A sending
  const handleSendMessage = async (text?: string) => {
    const finalMsg = typeof text === 'string' ? text : inputText;
    if (!finalMsg.trim() || !activeSource || isChatLoading || !user) return;

    const userMsg = finalMsg.trim();
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

  const handleGenerateQuestionsFromSource = async () => {
    if (!activeSource || !user) return;
    if (isGeneratingQuestions) return;

    setIsGeneratingQuestions(true);
    toast.info('Formulando questões de teste a partir do documento...');

    try {
      const idToken = await user.getIdToken();
      
      const response = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          topic: `Gere exatamente 10 questões de múltipla escolha difíceis e focadas. Baseie-se apenas neste material:\n\n${activeSource.content.substring(0, 10000)}`,
          subject: activeSource.title,
          count: 10
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar questões.');
      }

      const questions = await response.json();
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Nenhuma questão retornada.');
      }

      // Save directly into the active StudySource document in Firestore
      await updateDoc(doc(db, 'users', user.uid, 'sources', activeSource.id), {
        quizQuestions: questions,
        updatedAt: serverTimestamp()
      });
      
      toast.success('Sucesso! Simulado com 10 questões de teste montado na sua lista do Estúdio.');
    } catch (err: any) {
      console.error(err);
      toast.error(`Falha ao gerar questões: ${err.message || err}`);
    } finally {
      setIsGeneratingQuestions(false);
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
      const count = 10;
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
          sourceId: activeSource.id,
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
      
      // Calculate depth and quantity based on content length (up to 10 mind maps)
      const contentLength = activeSource.content?.length || 0;
      let quantity = 1;
      let textLimit = 10000;
      
      if (contentLength > 36000) {
        quantity = 10;
        textLimit = 40000;
      } else if (contentLength > 32000) {
        quantity = 9;
        textLimit = 36000;
      } else if (contentLength > 28000) {
        quantity = 8;
        textLimit = 32000;
      } else if (contentLength > 24000) {
        quantity = 7;
        textLimit = 28000;
      } else if (contentLength > 20000) {
        quantity = 6;
        textLimit = 24000;
      } else if (contentLength > 16000) {
        quantity = 5;
        textLimit = 20000;
      } else if (contentLength > 12000) {
        quantity = 4;
        textLimit = 16000;
      } else if (contentLength > 8000) {
        quantity = 3;
        textLimit = 12000;
      } else if (contentLength > 4000) {
        quantity = 2;
        textLimit = 8000;
      }

      toast.info(`Fonte com ${contentLength} caracteres. Preparando ${quantity} ${quantity === 1 ? 'mapa mental' : 'mapas mentais'} em lote...`);

      // Step 1: Request SVG maps structured prompt from endpoint
      const response = await fetch('/api/ai/svg-map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          title: activeSource.title,
          prompt: `Gere um mapa conceitual hierárquico extremamente didático usando este texto:\n\n${activeSource.content.substring(0, textLimit)}`,
          quantity: quantity
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
        svgData: generatedMaps,
        isPublic: false,
        ownerId: user.uid,
        sourceId: activeSource.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success(`${quantity === 1 ? 'Mapa mental gerado' : `${quantity} mapas mentais gerados`} com sucesso! Já está salvo na sua Biblioteca.`);
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

  const element = (
    <div className="flex flex-col relative overflow-hidden animate-in fade-in duration-700 pb-safe w-full flex-1 rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-200 bg-slate-50">
      
      {/* ⚠️ BLOQUEIO "EM BREVE" / MANUTENÇÃO */}
      {isLockedForMaintenance && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/70 backdrop-blur-[12px] rounded-3xl border-2 border-dashed border-primary/30 m-[-2px]">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center text-center max-w-md space-y-5 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-2">
              <Sparkles className="w-10 h-10 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-black italic text-text-main tracking-tight">Criação de Cadernos</h2>
              <p className="text-sm text-text-sub leading-relaxed font-medium">
                Estamos finalizando a integração dos Cadernos de Estudo para que você possa centralizar seus PDFs, vídeos e links com inteligência artificial.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-sub">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
              Desenvolvimento em 95%
            </div>
            <button 
              onClick={onBack}
              className="px-6 py-3 bg-text-main text-white rounded-2xl font-bold text-xs hover:brightness-110 transition-all flex items-center gap-2 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Voltar por enquanto
            </button>
          </div>
        </div>
      )}


      {/* Mobile Tab Navigation */}
      <div className="lg:hidden flex border-b bg-white border-slate-100">
        <button onClick={() => setActiveMobileTab('fonts')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${activeMobileTab === 'fonts' ? 'text-primary border-b-2 border-primary' : 'text-slate-400'}`}>Fontes</button>
        <button onClick={() => setActiveMobileTab('chat')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${activeMobileTab === 'chat' ? 'text-primary border-b-2 border-primary' : 'text-slate-400'}`}>Conversa</button>
        <button onClick={() => setActiveMobileTab('studio')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${activeMobileTab === 'studio' ? 'text-primary border-b-2 border-primary' : 'text-slate-400'}`}>Estúdio</button>
      </div>

      <div className="flex-1 flex w-full max-w-[1600px] p-2 gap-2 sm:p-4 sm:gap-4 mx-auto overflow-hidden">
        
        {/* LEFT PANEL: FONTES */}
        <div className={`bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden pb-4 transition-all duration-300 w-full ${isSourcesPanelOpen ? 'lg:w-[190px]' : 'lg:w-16'} flex-shrink-0 ${activeMobileTab === 'fonts' ? 'flex' : 'hidden'} lg:flex`}>
            <div className="p-4 flex items-center justify-between">
              {isSourcesPanelOpen && <h3 className="font-bold text-text-main tracking-tight text-[11px]">Fontes</h3>}
              <button 
                onClick={() => setIsSourcesPanelOpen(!isSourcesPanelOpen)}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400"
              >
                <Layout className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 custom-scrollbar">
              {isSourcesPanelOpen ? (
                <>
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="w-full py-2 px-3 bg-white border border-slate-200 rounded-[20px] shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex items-center justify-center gap-1.5 text-[10px] font-bold text-text-main group mb-3"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary group-hover:scale-125 transition-transform" />
                    Adicionar
                  </button>
                  <div className="space-y-1.5">
                    {sources.map(source => (
                       <div 
                          key={source.id}
                          onClick={() => { setActiveSource(source); setActiveMobileTab('chat'); }}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer group flex items-center justify-between ${
                            activeSource?.id === source.id 
                              ? 'bg-primary/5 border-primary/20' 
                              : 'bg-slate-50/50 border-transparent hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className={`p-1.5 rounded-lg shrink-0 ${
                              source.type === 'youtube' ? 'bg-red-50 text-red-500' :
                              source.type === 'web' ? 'bg-blue-50 text-blue-500' : 'bg-teal-50 text-teal-600'
                            }`}>
                              {source.type === 'youtube' ? <Youtube className="w-3 h-3" /> : 
                               source.type === 'web' ? <Globe className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-text-main truncate leading-tight">{source.title}</p>
                              {/* Indicators of generated material */}
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                {allMindmaps.some((m: any) => m.sourceId === source.id) && (
                                  <span className="flex items-center gap-0.5 text-[7px] font-black uppercase text-fuchsia-600 bg-fuchsia-50/80 px-1 border border-fuchsia-100 rounded" title="Mapa mental criado">
                                    <Brain className="w-1.5 h-1.5" />
                                    <span>Mapa</span>
                                  </span>
                                )}
                                {allFlashcards.some((c: any) => c.sourceId === source.id) && (
                                  <span className="flex items-center gap-0.5 text-[7px] font-black uppercase text-orange-600 bg-orange-50/80 px-1 border border-orange-100 rounded" title="Flashcards criados">
                                    <Layout className="w-1.5 h-1.5" />
                                    <span>Cards</span>
                                  </span>
                                )}
                                {Array.isArray(source.quizQuestions) && source.quizQuestions.length > 0 && (
                                  <span className="flex items-center gap-0.5 text-[7px] font-black uppercase text-sky-600 bg-sky-50/80 px-1 border border-sky-100 rounded" title="Simulado gerado">
                                    <FileQuestion className="w-1.5 h-1.5" />
                                    <span>Quiz</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSourceToDelete(source.id);
                            }}
                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-slate-200 rounded-md transition-all shrink-0 ml-2"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                          </button>
                        </div>
                    ))}
                  </div>
                </>
              ) : (
                  <div className="flex flex-col items-center pt-2 space-y-3">
                      <button 
                        onClick={() => setIsSourcesPanelOpen(true)} 
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 mb-1"
                        title="Adicionar Fonte"
                      >
                        <Plus className='w-3.5 h-3.5'/>
                      </button>
                      {sources.map(source => {
                        const hasMap = allMindmaps.some((m: any) => m.sourceId === source.id);
                        const hasCards = allFlashcards.some((c: any) => c.sourceId === source.id);
                        const hasQuiz = Array.isArray(source.quizQuestions) && source.quizQuestions.length > 0;

                        return (
                          <div key={source.id} className="relative shrink-0">
                            <button
                              onClick={() => { setActiveSource(source); setActiveMobileTab('chat'); }}
                              className={`p-2 rounded-xl shrink-0 transition-all border ${
                                activeSource?.id === source.id 
                                  ? 'ring-2 ring-primary ring-offset-2 scale-105' 
                                  : 'border-transparent hover:scale-105'
                              } ${
                                source.type === 'youtube' ? 'bg-red-50 text-red-500 hover:bg-red-100' :
                                source.type === 'web' ? 'bg-blue-50 text-blue-500 hover:bg-blue-100' : 'bg-teal-50 text-teal-600 hover:bg-teal-100'
                              }`}
                              title={source.title}
                            >
                              {source.type === 'youtube' ? <Youtube className="w-3.5 h-3.5" /> : 
                               source.type === 'web' ? <Globe className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                            </button>
                            
                            {/* Combined dot indicator badges for generated materials */}
                            <div className="absolute -top-1 -right-1 flex gap-0.5">
                              {hasMap && <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 border border-white shrink-0" title="Contém Mapa Mental" />}
                              {hasCards && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 border border-white shrink-0" title="Contém Flashcards" />}
                              {hasQuiz && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 border border-white shrink-0" title="Contém Questões de Teste" />}
                            </div>
                          </div>
                        );
                      })}
                  </div>
              )}
            </div>
          </div>

        {/* CENTER PANEL: CONVERSA / CHAT */}
        <div className={`flex flex-col bg-white overflow-hidden relative transition-all duration-300 min-w-0 w-full border border-slate-200 rounded-3xl shadow-sm lg:w-auto lg:flex-1 lg:mx-[2.5px] ${activeMobileTab === 'chat' ? 'flex' : 'hidden'} lg:flex`}>
          <div className="flex p-3 px-4 border-b border-slate-100 items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="font-bold text-text-main text-xs sm:text-sm flex items-center gap-1.5 leading-none">
                  <span>Conversação Inteligente</span>
                  {activeSource && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                      Fonte: {activeSource.title}
                    </span>
                  )}
                </h3>
                {activeSource && (
                  <p className="sm:hidden text-[9px] font-medium text-slate-400 mt-1 line-clamp-1">
                    {activeSource.title}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button 
                onClick={() => setMessages([])}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-all border border-transparent"
                title="Limpar Histórico"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-8 custom-scrollbar">
            <div className="space-y-8 max-w-4xl mx-auto pb-4">
              {messages.length === 0 && (
                <div className="flex w-full justify-start">
                  <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-4 max-w-[98%] sm:max-w-[95%] w-full">
                    <div className="flex sm:flex-col items-center gap-2 sm:gap-0 sm:justify-start flex-shrink-0">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-900 flex items-center justify-center shadow-sm">
                        <Sparkles className="w-3" />
                      </div>
                      <span className="sm:hidden text-xs font-semibold text-slate-600">Stratis</span>
                    </div>
                    <div className="text-[15px] leading-relaxed break-words text-slate-800 pt-0.5 sm:pt-1">
                      <div className="prose prose-slate max-w-none select-text marker:text-slate-900 prose-p:leading-relaxed prose-headings:font-bold prose-headings:tracking-tight prose-a:text-slate-900 prose-strong:text-slate-900">
                        <h3 className="text-lg sm:text-xl font-display font-medium text-slate-900 tracking-tight mt-0 mb-3">Estúdio Notebook</h3>
                        <p className="text-slate-600">Esta é sua área de estudos interativa com <b>inteligência artificial</b>. Adicione documentos, PDFs ou textos soltos como Fontes.</p>
                        <p className="text-slate-600">O Stratis se tornará um especialistaInstantaneamente no material importado, permitindo que você tire dúvidas, resuma partes complexas e estude de forma ativa.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex w-full ${m.role === 'model' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`flex w-full ${
                    m.role === 'model' 
                      ? 'flex-col sm:flex-row gap-1.5 sm:gap-4 max-w-[98%] sm:max-w-[95%]' 
                      : 'flex-row gap-3 sm:gap-4 justify-end max-w-[85%] ml-auto'
                  }`}>
                    {m.role === 'model' && (
                      <div className="flex sm:flex-col items-center gap-2 sm:gap-0 sm:justify-start flex-shrink-0">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-900 flex items-center justify-center shadow-sm">
                          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <span className="sm:hidden text-xs font-semibold text-slate-600">Stratis</span>
                      </div>
                    )}
                    <div className={`text-[15px] leading-relaxed break-words ${
                      m.role === 'model' 
                        ? 'text-slate-800 pt-0.5 sm:pt-1 w-full' 
                        : 'bg-slate-100 py-3.5 px-6 rounded-3xl text-slate-800 font-medium'
                    }`}>
                      {m.role === 'model' ? (
                        <div className="prose prose-slate max-w-none select-text marker:text-slate-900 prose-p:leading-relaxed prose-headings:font-bold prose-headings:tracking-tight prose-a:text-slate-900 prose-strong:text-slate-900">
                          <Markdown rehypePlugins={[rehypeSanitize]}>{m.content}</Markdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">
                          {m.content}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex w-full justify-start">
                  <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-4 max-w-[98%] sm:max-w-[95%] w-full">
                    <div className="flex sm:flex-col items-center gap-2 sm:gap-0 sm:justify-start flex-shrink-0">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-900 flex items-center justify-center shadow-sm">
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-pulse" />
                      </div>
                      <span className="sm:hidden text-xs font-semibold text-slate-600">Stratis</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1 sm:pt-2.5">
                      <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} className="h-4" />
            </div>
          </div>

          {/* INPUT AREA with Quick Prompts */}
          <div className="px-3 pb-6 pt-2 bg-white relative z-20">
            {activeSource && messages.length === 0 && (
              <div className="flex flex-wrap gap-2 mb-4 justify-center max-w-4xl mx-auto">
                {activeSource.suggestedQuestions && activeSource.suggestedQuestions.map((q, i) => (
                  <button 
                    key={`sq-${i}`}
                    onClick={() => handleSendMessage(q)}
                    disabled={isChatLoading}
                    className="px-4 py-2 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-full text-[12px] font-medium text-primary transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Wand2 className="w-4 h-4" />
                    {q}
                  </button>
                ))}
                {[
                  { label: "Resumir em Tabela", icon: Table2, prompt: "Crie um resumo analítico desta fonte formatado em uma tabela técnica, destacando os pontos mais importantes para concursos." },
                  { label: "Pontos Críticos", icon: ListChecks, prompt: "Extraia desta fonte um checklist de pontos críticos, prazos e regras que costumam ser pegadinhas em provas." },
                  { label: "Termos Técnicos", icon: HelpCircle, prompt: "Identifique todos os termos técnicos e jurídicos desta fonte e crie um glossário simplificado." }
                ].map((qp, i) => (
                  <button 
                    key={`qp-${i}`}
                    onClick={() => handleSendMessage(qp.prompt)}
                    disabled={isChatLoading}
                    className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-[12px] font-medium text-slate-700 hover:text-slate-900 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <qp.icon className="w-4 h-4" />
                    {qp.label}
                  </button>
                ))}
              </div>
            )}

            <div className="max-w-4xl mx-auto flex items-end gap-2 p-2 bg-slate-100 hover:bg-slate-200/50 border border-transparent focus-within:bg-slate-50 focus-within:border-slate-300 rounded-3xl transition-all">
              <textarea 
                placeholder={activeSource ? "Pergunte sobre esta fonte ou o conteúdo..." : "Selecione uma fonte para analisar..."}
                disabled={!activeSource || isChatLoading}
                className="flex-1 bg-transparent border-none focus:outline-none px-4 py-3 text-[15px] leading-relaxed text-slate-800 placeholder:text-slate-500 resize-none min-h-[48px] max-h-[200px]"
                rows={1}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <div className="flex items-center gap-2 pr-1 pb-1">
                 <button 
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isChatLoading || !activeSource}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 rounded-full transition-all text-white flex items-center justify-center h-10 w-10 flex-shrink-0 shadow-sm"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="text-center mt-2.5">
              <p className="text-[10px] text-slate-400/80 font-medium">
                O Notebook Stratis pode gerar respostas incorretas. Por isso, cheque o conteúdo.
              </p>
            </div>
            
            {!activeSource && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center rounded-b-3xl">
                <button 
                  onClick={() => {
                    setActiveMobileTab('fonts');
                    setIsSourcesPanelOpen(true);
                  }}
                  className="text-xs font-bold text-slate-700 tracking-wide bg-white px-6 py-2.5 rounded-full border border-slate-200 shadow-sm hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Selecione uma Fonte
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: ESTUDIO */}
        <div className={`bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden pb-4 transition-all duration-300 w-full ${isStudioPanelOpen ? 'lg:w-[190px]' : 'lg:w-16'} flex-shrink-0 ${activeMobileTab === 'studio' ? 'flex' : 'hidden'} lg:flex`}>
            <div className="p-5 flex items-center justify-between">
              {isStudioPanelOpen && <h3 className="font-bold text-text-main tracking-tight text-sm">Estúdio</h3>}
              <button 
                onClick={() => setIsStudioPanelOpen(!isStudioPanelOpen)}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400"
              >
                <Layout className="w-4 h-4" />
              </button>
            </div>

              {isStudioPanelOpen ? (
              <div className="flex-1 flex flex-col p-4 overflow-hidden">
                  <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
                    <button 
                      onClick={handleGenerateMindmapFromSource}
                      disabled={!activeSource || isGeneratingMindmap}
                      className="w-full flex items-center justify-between p-2.5 border border-transparent hover:border-slate-200 rounded-xl transition-all group disabled:opacity-30 bg-fuchsia-50/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <Brain className={`w-3.5 h-3.5 text-fuchsia-500 ${isGeneratingMindmap ? 'animate-pulse' : ''}`} />
                        <span className="text-[10px] font-bold text-text-main">
                          {isGeneratingMindmap ? 'Gerando...' : 'Mapa mental'}
                        </span>
                      </div>
                    </button>

                    <button 
                      onClick={handleGenerateFlashcardsFromSource}
                      disabled={!activeSource || isGeneratingFlashcards}
                      className="w-full flex items-center justify-between p-2.5 border border-transparent hover:border-slate-200 rounded-xl transition-all group disabled:opacity-30 bg-orange-50/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <Layout className={`w-3.5 h-3.5 text-orange-500 ${isGeneratingFlashcards ? 'animate-pulse' : ''}`} />
                        <span className="text-[10px] font-bold text-text-main">
                          {isGeneratingFlashcards ? 'Gerando...' : 'Flashcards'}
                        </span>
                      </div>
                    </button>


                    <button 
                      onClick={handleGenerateQuestionsFromSource}
                      disabled={!activeSource || isGeneratingQuestions}
                      className="w-full flex items-center justify-between p-3 border border-transparent hover:border-slate-200 rounded-2xl transition-all group disabled:opacity-30 bg-sky-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileQuestion className={`w-4 h-4 text-sky-500 ${isGeneratingQuestions ? 'animate-pulse' : ''}`} />
                        <span className="text-[11px] font-bold text-text-main">
                          {isGeneratingQuestions ? 'Gerando...' : 'Questões de Teste'}
                        </span>
                      </div>
                    </button>

                    <div className="pt-6 border-t border-slate-100 mt-4 space-y-4">
                      {sourceMindmaps.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 px-1">Mapas Mentais</h4>
                          {sourceMindmaps.map(map => (
                            <button 
                              key={map.id} 
                              onClick={() => onOpenMindmap && onOpenMindmap(map)}
                              className="w-full text-left p-3 border border-slate-200 bg-white rounded-xl flex flex-col gap-2 relative overflow-hidden transition-all hover:border-fuchsia-300 hover:shadow-sm"
                            >
                              <div className="absolute top-0 right-0 p-1.5 opacity-50"><Brain className="w-6 h-6 text-fuchsia-100" /></div>
                              <span className="text-xs font-bold text-text-main line-clamp-1">{map.title}</span>
                              <span className="text-[10px] text-text-sub font-medium">Abrir visualizador</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {sourceFlashcards.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 px-1">Decks Criados</h4>
                          <button 
                            onClick={() => onOpenFlashcards && onOpenFlashcards(sourceFlashcards)}
                            className="w-full text-left p-3 border border-slate-200 bg-white rounded-xl flex flex-col gap-2 relative overflow-hidden transition-all hover:border-orange-300 hover:shadow-sm"
                          >
                            <div className="absolute top-0 right-0 p-1.5 opacity-50"><Layout className="w-6 h-6 text-orange-100" /></div>
                            <span className="text-xs font-bold text-text-main line-clamp-1">Cartões de Estudo ({sourceFlashcards.length})</span>
                            <span className="text-[10px] text-text-sub font-medium">Abrir modo revisão</span>
                          </button>
                        </div>
                      )}

                      {activeSource?.quizQuestions && activeSource.quizQuestions.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 px-1">Simulado Salvo</h4>
                          <div className="w-full text-left p-3 border border-slate-200 bg-white rounded-xl flex flex-col gap-2 relative overflow-hidden transition-all hover:border-sky-300 hover:shadow-sm group">
                            <div className="absolute top-1 right-2 flex items-center gap-1 opacity-50"><FileQuestion className="w-6 h-6 text-sky-100" /></div>
                            <span className="text-xs font-bold text-text-main line-clamp-1">Simulado ({activeSource.quizQuestions.length} questões)</span>
                            <div className="flex gap-2 z-10 mt-1">
                              <button 
                                onClick={() => onOpenQuiz && onOpenQuiz(activeSource.quizQuestions || [])}
                                className="flex-1 py-1.5 px-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-[9px] uppercase tracking-widest rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                                Treinar
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (window.confirm("Deseja apagar este simulado?")) {
                                    try {
                                      await updateDoc(doc(db, 'users', user.uid, 'sources', activeSource.id), {
                                        quizQuestions: []
                                      });
                                      toast.success("Simulado removido!");
                                    } catch (err) {
                                      console.error(err);
                                      toast.error("Erro ao remover simulado.");
                                    }
                                  }
                                }}
                                className="p-1.5 border border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-100 rounded-lg text-slate-400 transition-all shrink-0 cursor-pointer"
                                title="Excluir simulado"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
              </div>
            ) : (
              <div className='flex flex-col items-center pt-2 space-y-4'>
                  <button 
                    onClick={handleGenerateMindmapFromSource} 
                    disabled={!activeSource || isGeneratingMindmap}
                    className={`p-2 rounded-xl transition-all disabled:opacity-30 ${isGeneratingMindmap ? 'animate-pulse bg-fuchsia-100' : 'hover:bg-fuchsia-50'}`}
                    title="Gerar Mapa Mental"
                  >
                    <Brain className="w-4 h-4 text-fuchsia-500" />
                  </button>

                  <button 
                    onClick={handleGenerateFlashcardsFromSource} 
                    disabled={!activeSource || isGeneratingFlashcards}
                    className={`p-2 rounded-xl transition-all disabled:opacity-30 ${isGeneratingFlashcards ? 'animate-pulse bg-orange-100' : 'hover:bg-orange-50'}`}
                    title="Gerar Flashcards"
                  >
                    <Layout className="w-4 h-4 text-orange-500" />
                  </button>

                  <button 
                    onClick={handleGenerateQuestionsFromSource} 
                    disabled={!activeSource || isGeneratingQuestions}
                    className={`p-2 rounded-xl transition-all disabled:opacity-30 ${isGeneratingQuestions ? 'animate-pulse bg-sky-100' : 'hover:bg-sky-50'}`}
                    title="Gerar Questões de Teste"
                  >
                    <FileQuestion className="w-4 h-4 text-sky-500" />
                  </button>
              </div>
            )}
          </div>

      </div>

      {/* MODAL: ADICIONAR FONTE */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl p-10 relative overflow-hidden"
            >
              <button 
                onClick={() => setShowAddModal(false)} 
                className="absolute top-8 right-8 p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center space-y-3 mb-8">
                <h2 className="text-2xl font-display font-black italic text-text-main tracking-tight">
                  Importar <span className="text-primary italic font-serif">Conhecimento</span> para o Caderno
                </h2>
              </div>

              <form onSubmit={handleSaveSource} className="space-y-6">
                <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 rounded-2xl">
                  {[{id: 'text', label: 'Texto'}, {id: 'file', label: 'PDF'}, {id: 'web', label: 'Link'}, {id: 'youtube', label: 'YouTube'}].map((type) => (
                    <button 
                      key={type.id}
                      type="button"
                      onClick={() => setNewSourceType(type.id as any)}
                      className={`flex-1 py-2 text-[10px] font-black tracking-widest uppercase rounded-xl transition-all ${
                        newSourceType === type.id ? 'bg-white text-primary shadow-sm' : 'text-text-sub hover:text-text-main'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                   <input 
                    type="text" 
                    required
                    placeholder="Título da fonte"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:border-primary/40 focus:bg-white transition-all text-text-main"
                    value={newSourceForm.title}
                    onChange={(e) => setNewSourceForm(p => ({ ...p, title: e.target.value }))}
                  />

                  {newSourceType === 'text' && (
                    <textarea 
                      placeholder="Cole seu texto aqui..."
                      required
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium focus:outline-none focus:border-primary/40 focus:bg-white transition-all min-h-[150px] resize-none text-text-main custom-scrollbar"
                      value={newSourceForm.text}
                      onChange={(e) => setNewSourceForm(p => ({ ...p, text: e.target.value }))}
                    />
                  )}

                  {(newSourceType === 'web' || newSourceType === 'youtube') && (
                    <input 
                      type="url" 
                      required
                      placeholder={newSourceType === 'youtube' ? "Link do vídeo do YouTube..." : "Link do site..."}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold focus:outline-none focus:border-primary/40 focus:bg-white transition-all text-text-main"
                      value={newSourceForm.url}
                      onChange={(e) => setNewSourceForm(p => ({ ...p, url: e.target.value }))}
                    />
                  )}

                  {newSourceType === 'file' && (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-[32px] p-10 flex flex-col items-center justify-center space-y-4 transition-all cursor-pointer ${
                        dragActive ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-primary/20'
                      }`}
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                    >
                      <FileUp className="w-10 h-10 text-slate-300" />
                      <div className="text-center">
                        <p className="text-xs font-bold text-text-main">
                          {selectedFile ? selectedFile.name : 'Escolher arquivo PDF ou TXT'}
                        </p>
                        <p className="text-[10px] text-text-sub font-medium mt-1">Máximo 10MB</p>
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".pdf,.txt,.md" />
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => { setShowAddModal(false); resetAddForm(); }}
                    className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-[32px] text-xs font-black uppercase tracking-widest text-text-sub transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isImporting}
                    className="flex-[2] py-4 bg-primary text-white rounded-[32px] text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isImporting ? 'Extraindo...' : 'Sincronizar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EXCLUIR FONTE */}
      <AnimatePresence>
        {sourceToDelete && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl p-8 text-center"
            >
              <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-display font-black text-slate-800 mb-2 uppercase tracking-wide">
                Excluir Fonte
              </h3>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">
                Tem certeza de que deseja excluir esta fonte de estudo permanentemente? Todas as mensagens e interações deste canal de chat serão perdidas.
              </p>
              
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setSourceToDelete(null)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-widest rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSource(sourceToDelete)}
                  className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-red-500/30"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );

  return element;
}
