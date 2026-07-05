import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Headphones, 
  Clock, 
  Volume2, 
  VolumeX, 
  SkipForward, 
  SkipBack, 
  Search, 
  Sparkles, 
  Bookmark, 
  CheckCircle, 
  Gauge, 
  Music, 
  BookOpen, 
  Lightbulb, 
  Flame,
  ArrowRight,
  Plus,
  Trash2,
  UploadCloud,
  Loader2,
  ChevronDown,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorUtils';

interface Audiocast {
  id: string;
  title: string;
  description: string;
  duration: string; // MM:SS format
  category: string;
  categoryLabel: string;
  speaker: string;
  audioUrl: string;
  isPremium?: boolean;
  topics: string[];
  createdAt?: any;
}

export default function Audiocasts() {
  const { user, isPro } = useAuth();
  const userEmail = user?.email?.toLowerCase().trim() || '';
  const isAdmin = userEmail === 'onrocha08@gmail.com' || userEmail === 'joadsonrocharr@gmail.com';

  const [dbAudiocasts, setDbAudiocasts] = useState<Audiocast[]>([]);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDuration, setNewDuration] = useState('05:00');
  const [newCategory, setNewCategory] = useState<string>('mentoria');
  const [newSpeaker, setNewSpeaker] = useState('Prof. Lucas Silveira');
  const [newAudioUrl, setNewAudioUrl] = useState('');
  const [newIsPremium, setNewIsPremium] = useState(true);
  const [newTopics, setNewTopics] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [currentAudiocast, setCurrentAudiocast] = useState<Audiocast | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [completedAudios, setCompletedAudios] = useState<string[]>([]);
  const [favoriteAudios, setFavoriteAudios] = useState<string[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load from Firestore
  useEffect(() => {
    const q = query(collection(db, 'audiocasts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Audiocast[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          duration: data.duration || '00:00',
          category: data.category || 'mentoria',
          categoryLabel: data.categoryLabel || 'Outros',
          speaker: data.speaker || '',
          audioUrl: data.audioUrl || '',
          isPremium: data.isPremium ?? false,
          topics: data.topics || [],
          createdAt: data.createdAt,
        });
      });
      
      // Sort in-memory by createdAt descending (newest first)
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.seconds || b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setDbAudiocasts(list);
      if (list.length > 0) {
        setCurrentAudiocast((prev) => prev || list[0]);
      }
    }, (error) => {
      console.error("Erro ao carregar audiocasts de Firestore:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Por favor, selecione um arquivo de áudio válido.');
      return;
    }

    setUploadingFile(true);
    setUploadProgress(0);
    setUploadedFileName(file.name);

    // Auto-detect duration
    const audioObj = document.createElement('audio');
    const objectUrl = URL.createObjectURL(file);
    audioObj.src = objectUrl;
    audioObj.addEventListener('loadedmetadata', () => {
      const mins = Math.floor(audioObj.duration / 60);
      const secs = Math.floor(audioObj.duration % 60);
      const formattedDuration = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      setNewDuration(formattedDuration);
      URL.revokeObjectURL(objectUrl);
    });

    // Suggest a nicely formatted title if the field is empty
    if (!newTitle) {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const formattedName = nameWithoutExt.replace(/[_-]/g, ' ').toUpperCase();
      setNewTitle(formattedName);
    }

    const storageRef = ref(storage, `audiocasts/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(Math.round(progress));
      },
      (error) => {
        console.error('Erro no upload do áudio:', error);
        toast.error('Erro no upload do áudio: ' + error.message);
        setUploadingFile(false);
        setUploadedFileName('');
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setNewAudioUrl(downloadUrl);
          toast.success('Áudio carregado e processado com sucesso!');
        } catch (err) {
          console.error('Erro ao obter URL:', err);
          toast.error('Erro ao processar áudio.');
          setUploadedFileName('');
        } finally {
          setUploadingFile(false);
        }
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAudioUrl) {
      toast.error('Por favor, preencha o título e faça upload do áudio ou insira um link.');
      return;
    }

    setIsSubmitting(true);
    const categoryLabels: Record<string, string> = {
      mentoria: 'Mentorias',
      foco: 'Estudo Ativo & Foco',
      portugues: 'Língua Portuguesa',
      direito_const: 'Direito Constitucional',
      direito_adm: 'Direito Administrativo',
      direito_penal: 'Direito Penal & Proc. Penal',
      direito_civil: 'Direito Civil & Proc. Civil',
      rlm: 'Raciocínio Lógico e Matemática',
      informatica: 'Informática para Concursos',
      administracao: 'Administração Pública',
      redacao: 'Redação & Discursivas',
      outros: 'Outras Disciplinas'
    };

    const topicsArray = newTopics
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    try {
      await addDoc(collection(db, 'audiocasts'), {
        title: newTitle,
        description: newDescription,
        duration: newDuration,
        category: newCategory,
        categoryLabel: categoryLabels[newCategory] || 'Outros',
        speaker: newSpeaker,
        audioUrl: newAudioUrl,
        isPremium: newIsPremium,
        topics: topicsArray,
        createdAt: serverTimestamp()
      });

      toast.success('Audiocast adicionado com sucesso!');
      setNewTitle('');
      setNewDescription('');
      setNewDuration('05:00');
      setNewCategory('mentoria');
      setNewSpeaker('Prof. Lucas Silveira');
      setNewAudioUrl('');
      setNewIsPremium(true);
      setNewTopics('');
      setUploadedFileName('');
      setShowAdminForm(false);
    } catch (err) {
      console.error('Erro ao adicionar audiocast:', err);
      handleFirestoreError(err, OperationType.WRITE, 'audiocasts');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este audiocast?')) return;

    try {
      await deleteDoc(doc(db, 'audiocasts', id));
      toast.success('Audiocast excluído com sucesso!');
      if (currentAudiocast && currentAudiocast.id === id) {
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();
        setCurrentAudiocast(dbAudiocasts.find(c => c.id !== id) || null);
      }
    } catch (err) {
      console.error('Erro ao excluir audiocast:', err);
      handleFirestoreError(err, OperationType.DELETE, `audiocasts/${id}`);
    }
  };

  // Load and play logic
  useEffect(() => {
    if (audioRef.current && currentAudiocast) {
      audioRef.current.src = currentAudiocast.audioUrl;
      audioRef.current.load();
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.muted = isMuted;
      audioRef.current.volume = volume;
      
      // Clear previous audio's time & duration state immediately to avoid UI flickers or old values remaining
      setCurrentTime(0);
      setDuration(0);
      
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.warn("Audio play failed on source change:", err);
          setIsPlaying(false);
        });
      }
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    }
  }, [currentAudiocast]);

  // Unmount cleanup to stop audio playing in the background when navigating away
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Handle play/pause toggle
  const togglePlay = () => {
    if (!audioRef.current || !currentAudiocast) return;

    if (currentAudiocast.isPremium && !isPro) {
      toast.error('Este conteúdo é exclusivo para assinantes PRO!');
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Erro ao reproduzir áudio:", err);
        toast.error("Não foi possível carregar o arquivo de áudio.");
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && currentAudiocast) {
      setCurrentTime(audioRef.current.currentTime);
      // Auto-mark as completed when reaching 95% of duration
      if (duration > 0 && audioRef.current.currentTime / duration >= 0.95) {
        if (!completedAudios.includes(currentAudiocast.id)) {
          setCompletedAudios(prev => [...prev, currentAudiocast.id]);
          toast.success(`Parabéns! Você completou: ${currentAudiocast.title}`);
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5, 1.75, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
    toast.success(`Velocidade alterada para ${nextSpeed}x`);
  };

  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      let newTime = audioRef.current.currentTime + seconds;
      if (newTime < 0) newTime = 0;
      if (newTime > duration) newTime = duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteAudios(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    toast.success(favoriteAudios.includes(id) ? 'Removido dos favoritos' : 'Adicionado aos favoritos!');
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const selectAndPlay = (cast: Audiocast) => {
    if (cast.isPremium && !isPro) {
      toast.error('Este conteúdo é exclusivo para assinantes PRO!');
      return;
    }
    
    // Toggle play/pause if clicking the already active audio card
    if (currentAudiocast && currentAudiocast.id === cast.id) {
      togglePlay();
      return;
    }

    setCurrentAudiocast(cast);
    setIsPlaying(true);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().catch(err => {
          console.warn("Autoplay was prevented, click play manually.", err);
          setIsPlaying(false);
        });
      }
    }, 100);
  };

  const categories = [
    { id: 'todos', label: 'Todos', icon: Headphones },
    { id: 'mentoria', label: 'Mentorias', icon: Lightbulb },
    { id: 'foco', label: 'Foco & Estudo', icon: Flame },
    { id: 'portugues', label: 'Língua Portuguesa', icon: Sparkles },
    { id: 'direito_const', label: 'Dir. Constitucional', icon: BookOpen },
    { id: 'direito_adm', label: 'Dir. Administrativo', icon: BookOpen },
    { id: 'direito_penal', label: 'Dir. Penal', icon: BookOpen },
    { id: 'direito_civil', label: 'Dir. Civil', icon: BookOpen },
    { id: 'rlm', label: 'Raciocínio Lógico (RLM)', icon: Sparkles },
    { id: 'informatica', label: 'Informática', icon: Sparkles },
    { id: 'administracao', label: 'Administração', icon: BookOpen },
    { id: 'redacao', label: 'Redação', icon: BookOpen },
    { id: 'outros', label: 'Outras Disciplinas', icon: Headphones }
  ];

  const allAudiocasts = dbAudiocasts;

  const filteredAudiocasts = allAudiocasts.filter(cast => {
    const matchesSearch = cast.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          cast.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cast.speaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cast.topics.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'todos' || cast.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-32 focus-within:outline-none pt-4">
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onError={(e) => {
          // Ignore error events when there is no active audiocast or src is empty
          if (!currentAudiocast || !e.currentTarget.src || e.currentTarget.getAttribute('src') === '') {
            return;
          }
          const errorCode = e.currentTarget.error ? e.currentTarget.error.code : 'desconhecido';
          const errorMessage = e.currentTarget.error ? e.currentTarget.error.message : '';
          console.error(`Erro no elemento de áudio (código ${errorCode}): ${errorMessage}`);
          setIsPlaying(false);
          toast.error("Erro ao carregar ou reproduzir este arquivo de áudio.");
        }}
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary to-indigo-600 rounded-3xl p-4 md:p-5 text-white relative overflow-hidden shadow-md shadow-primary/5">
        <div className="absolute right-[-5%] top-[-20%] opacity-10">
          <Headphones className="w-32 h-32 rotate-12" />
        </div>
        
        <div className="max-w-3xl space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded-full text-[8px] font-black uppercase tracking-widest text-yellow-300">
            <Sparkles className="w-3 h-3 animate-pulse" /> Recurso Exclusivo PRO
          </div>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-tight text-white">
            Audiocasts & Áudio-Aulas
          </h2>
          <p className="text-xs text-white/80 font-medium leading-relaxed">
            Aproveite momentos produtivos secundários para revisar conteúdos vitais de alta recorrência por escuta ativa.
          </p>
        </div>
      </div>

      {/* Categories & Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Search Bar */}
        <div className="md:col-span-4 relative">
          <Search className="w-4 h-4 text-text-sub absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por assunto, palavra-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-border rounded-2xl text-xs font-bold text-text-main placeholder:text-text-sub/50 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Category Dropdown (Replacing standard tabs for a premium, clean select experience) */}
        <div ref={dropdownRef} className="md:col-span-8 relative">
          <button
            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            className="w-full flex items-center justify-between gap-2 px-5 py-3 bg-white border border-border rounded-2xl text-xs font-black uppercase tracking-wider text-text-main hover:bg-slate-50 transition-all shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <Filter className="w-4 h-4 text-primary shrink-0" />
              <span className="text-text-sub normal-case font-bold shrink-0">Filtrar Disciplina:</span>
              <span className="text-primary font-black truncate max-w-[150px] sm:max-w-none">
                {categories.find(cat => cat.id === selectedCategory)?.label || 'Todos'}
              </span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-text-sub transition-transform duration-250 shrink-0", isCategoryDropdownOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {isCategoryDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 mt-2 bg-white border border-border rounded-2xl shadow-xl z-50 p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-[320px] overflow-y-auto no-scrollbar"
              >
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all border",
                        isSelected
                          ? "bg-primary/5 border-primary/25 text-primary"
                          : "bg-transparent border-transparent text-text-sub hover:bg-slate-50 hover:text-text-main"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-primary" : "text-text-sub/75")} />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Playlist (List of lessons) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-[10px] font-black text-text-sub uppercase tracking-widest px-1">Áudios Disponíveis ({filteredAudiocasts.length})</h3>
          
          {/* Admin Panel for Audio Uploads */}
          {isAdmin && (
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-amber-800 tracking-wider">Painel Administrativo</h4>
                    <p className="text-[10px] font-bold text-amber-700/80">Apenas para Administradores</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAdminForm(!showAdminForm)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  {showAdminForm ? 'Fechar Form' : 'Adicionar Áudio'}
                </button>
              </div>

              {showAdminForm && (
                <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-amber-500/10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1 md:col-span-1">
                      <label className="text-[9px] font-black text-amber-800 uppercase tracking-widest">Título do Áudio</label>
                      <input
                        type="text"
                        placeholder="Ex: Como Estudar a Lei Seca"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-500/20 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 h-[100px]"
                        required
                      />
                    </div>
                    
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[9px] font-black text-amber-800 uppercase tracking-widest block">Upload de Áudio ou URL Direta</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* File Upload Box */}
                        <div className="relative border border-dashed border-amber-500/35 rounded-xl p-3 bg-white hover:bg-amber-500/5 transition-all flex flex-col items-center justify-center min-h-[100px] text-center cursor-pointer">
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={handleFileUpload}
                            disabled={uploadingFile}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          {uploadingFile ? (
                            <div className="space-y-1.5 w-full px-2">
                              <Loader2 className="w-4 h-4 text-amber-600 animate-spin mx-auto" />
                              <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                <div 
                                  className="bg-amber-600 h-1 rounded-full transition-all duration-300" 
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <span className="text-[8px] font-black text-amber-800 uppercase tracking-widest">
                                Enviando: {uploadProgress}%
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1 w-full max-w-full px-2 overflow-hidden">
                              <UploadCloud className="w-5 h-5 text-amber-600 mx-auto" />
                              <span className="text-[9px] font-black text-amber-800 block uppercase tracking-wider truncate">
                                {uploadedFileName ? 'Pronto para Adicionar' : 'Upload de Arquivo'}
                              </span>
                              <span className="text-[8px] text-amber-700/60 block uppercase font-bold tracking-tight truncate">
                                {uploadedFileName ? uploadedFileName : 'MP3, M4A, WAV (Auto-detecta tempo)'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Direct Link Input */}
                        <div className="flex flex-col justify-center space-y-1">
                          <input
                            type="url"
                            placeholder="Insira URL direta (ex: .mp3)"
                            value={newAudioUrl}
                            onChange={(e) => setNewAudioUrl(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-amber-500/20 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                          />
                          {newAudioUrl && (
                            <p className="text-[8px] text-emerald-600 font-black uppercase tracking-wider truncate max-w-[200px]">
                              ✓ Link pronto!
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-amber-800 uppercase tracking-widest">Descrição</label>
                    <textarea
                      placeholder="Breve descrição do conteúdo abordado no áudio"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-white border border-amber-500/20 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-amber-800 uppercase tracking-widest">Categoria / Disciplina</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-500/20 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                      >
                        <option value="mentoria">Mentorias</option>
                        <option value="foco">Foco & Estudo</option>
                        <option value="portugues">Língua Portuguesa</option>
                        <option value="direito_const">Direito Constitucional</option>
                        <option value="direito_adm">Direito Administrativo</option>
                        <option value="direito_penal">Direito Penal & Proc. Penal</option>
                        <option value="direito_civil">Direito Civil & Proc. Civil</option>
                        <option value="rlm">Raciocínio Lógico (RLM)</option>
                        <option value="informatica">Informática para Concursos</option>
                        <option value="administracao">Administração Pública</option>
                        <option value="redacao">Redação & Discursivas</option>
                        <option value="outros">Outras Disciplinas</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-amber-800 uppercase tracking-widest">Duração (Ex: 05:30)</label>
                      <input
                        type="text"
                        placeholder="05:30"
                        value={newDuration}
                        onChange={(e) => setNewDuration(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-500/20 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-amber-800 uppercase tracking-widest">Palestrante / Professor</label>
                      <input
                        type="text"
                        value={newSpeaker}
                        onChange={(e) => setNewSpeaker(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-500/20 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-amber-800 uppercase tracking-widest">Tópicos (Separados por vírgula)</label>
                      <input
                        type="text"
                        placeholder="Ex: Lei Seca, Organização, Revisão"
                        value={newTopics}
                        onChange={(e) => setNewTopics(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-500/20 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id="newIsPremium"
                        checked={newIsPremium}
                        onChange={(e) => setNewIsPremium(e.target.checked)}
                        className="w-4 h-4 rounded border-amber-500/20 text-amber-600 focus:ring-amber-500"
                      />
                      <label htmlFor="newIsPremium" className="text-xs font-bold text-amber-800 select-none cursor-pointer">
                        Conteúdo Exclusivo PRO
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      {isSubmitting ? 'Enviando...' : 'Salvar Audiocast'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="space-y-3">
            {filteredAudiocasts.length === 0 ? (
              <div className="text-center py-16 bg-white border border-border rounded-3xl space-y-3">
                <Headphones className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-text-sub uppercase tracking-wider">Nenhum audiocast encontrado</p>
                <button 
                  onClick={() => { setSearchTerm(''); setSelectedCategory('todos'); }}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                  Limpar Filtros
                </button>
              </div>
            ) : (
              filteredAudiocasts.map((cast) => {
                const isActive = currentAudiocast && currentAudiocast.id === cast.id;
                const isFavorite = favoriteAudios.includes(cast.id);
                const isCompleted = completedAudios.includes(cast.id);
                const isCustom = dbAudiocasts.some(dbCast => dbCast.id === cast.id);
                
                return (
                  <div
                    key={cast.id}
                    onClick={() => selectAndPlay(cast)}
                    className={cn(
                      "p-4 md:p-5 bg-white border rounded-2xl flex items-start gap-4 transition-all group cursor-pointer relative overflow-hidden",
                      isActive 
                        ? "border-primary/40 bg-primary/[0.01] shadow-lg shadow-primary/5" 
                        : "border-border hover:border-slate-300 hover:shadow-md"
                    )}
                  >
                    {/* Active playing indicator border */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                    )}

                    {/* Play/Pause Graphic Button */}
                    <button
                      className={cn(
                        "w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all",
                        isActive && isPlaying
                          ? "bg-primary text-white scale-105 shadow-md shadow-primary/20"
                          : "bg-slate-50 text-text-main group-hover:bg-primary group-hover:text-white"
                      )}
                    >
                      {isActive && isPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                      )}
                    </button>

                    {/* Meta info & text */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          {cast.categoryLabel}
                        </span>
                        <span className="text-[9px] font-bold text-text-sub uppercase tracking-wider">
                          {cast.speaker}
                        </span>
                        {cast.isPremium && (
                          <span className="text-[8px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider scale-95">
                            PRO
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-[8px] text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-1.5 py-0.2 rounded-full uppercase font-black">
                            <CheckCircle className="w-2.5 h-2.5 text-emerald-500" /> Lido/Ouvido
                          </span>
                        )}
                      </div>

                      <h4 className={cn(
                        "text-sm font-black uppercase tracking-tight line-clamp-1 transition-colors",
                        isActive ? "text-primary" : "text-text-main group-hover:text-primary"
                      )}>
                        {cast.title}
                      </h4>

                      <p className="text-[11px] text-text-sub font-medium leading-relaxed line-clamp-2">
                        {cast.description}
                      </p>

                      {/* Covered Topics tag list */}
                      <div className="flex flex-wrap gap-1 pt-1.5">
                        {cast.topics.slice(0, 3).map((topic, i) => (
                          <span key={i} className="text-[8px] font-bold text-text-sub uppercase tracking-wider bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                            {topic}
                          </span>
                        ))}
                        {cast.topics.length > 3 && (
                          <span className="text-[8px] font-bold text-text-sub/50 uppercase tracking-wider px-1 py-0.5">
                            +{cast.topics.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Info Details: Duration & Favorite button */}
                    <div className="shrink-0 flex flex-col items-end justify-between self-stretch pl-2">
                      <div className="flex items-center gap-1 text-[10px] text-text-sub font-bold uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 opacity-60" />
                        <span>{cast.duration}</span>
                      </div>
                      
                      <div className="flex gap-1 items-center">
                        {isAdmin && isCustom && (
                          <button 
                            onClick={(e) => handleDelete(cast.id, e)}
                            className="p-1.5 rounded-full hover:bg-red-50 text-red-500 transition-colors active:scale-95"
                            title="Excluir Audiocast"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={(e) => toggleFavorite(cast.id, e)}
                          className="p-1.5 rounded-full hover:bg-slate-100 text-text-sub transition-colors active:scale-95"
                        >
                          <Bookmark className={cn(
                            "w-4 h-4", 
                            isFavorite ? "fill-primary text-primary" : "text-text-sub/60"
                          )} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Interactive Expanded Lesson Player */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <h3 className="text-[10px] font-black text-text-sub uppercase tracking-widest px-1">Tocando Agora</h3>
            
            <div className="bg-white border border-border rounded-3xl p-6 shadow-xl shadow-slate-100/50 space-y-6">
              {!currentAudiocast ? (
                <div className="text-center py-16 space-y-4">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto">
                    <Headphones className="w-6 h-6 text-text-sub/40 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase text-text-main">Nenhum áudio carregado</h4>
                    <p className="text-[9px] font-bold uppercase text-text-sub leading-normal max-w-[200px] mx-auto">
                      Selecione um audiocast na lista ao lado para iniciar.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Disc Rotation Visual */}
                  <div className="aspect-square bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-indigo-500/5" />
                    
                    {/* Rotating disc representation */}
                    <div className={cn(
                      "w-36 h-36 rounded-full border-4 border-slate-200/80 bg-white flex items-center justify-center shadow-lg relative transition-transform duration-1000 ease-linear",
                      isPlaying ? "animate-spin [animation-duration:8s]" : ""
                    )}>
                      <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-white font-black text-xs font-display">
                        S
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-center">
                      <span className="text-[8px] font-black text-text-sub uppercase tracking-widest bg-white/80 border border-border backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm">
                        {currentAudiocast.categoryLabel}
                      </span>
                    </div>
                  </div>

                  {/* Lesson Metadata */}
                  <div className="text-center space-y-1.5">
                    <h4 className="text-sm font-black uppercase text-text-main tracking-tight leading-snug">
                      {currentAudiocast.title}
                    </h4>
                    <p className="text-[10px] font-bold uppercase text-text-sub tracking-wider">
                      Por {currentAudiocast.speaker}
                    </p>
                  </div>

                  {/* Dynamic Transcript/Summary Accordion */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-text-main uppercase tracking-widest">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      <span>Pontos Relevantes</span>
                    </div>
                    <div className="max-h-[100px] overflow-y-auto no-scrollbar space-y-1">
                      {currentAudiocast.topics.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 text-[9px] font-bold text-text-sub uppercase tracking-wider">
                          <span className="w-1 h-1 rounded-full bg-primary" />
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>

              {/* Audio Slider Controls */}
              <div className="space-y-1">
                <input 
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary [&::-webkit-slider-runnable-track]:bg-slate-100 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                />
                <div className="flex justify-between items-center text-[9px] font-bold text-text-sub tracking-wider font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Main Playback Deck */}
              <div className="flex items-center justify-center gap-5">
                {/* 10s Rewind */}
                <button 
                  onClick={() => skipTime(-10)}
                  className="p-2.5 rounded-xl hover:bg-slate-100 text-text-sub active:scale-95 transition-all"
                  title="Retroceder 10s"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Big play button */}
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center shadow-xl shadow-primary/20 active:scale-95 transition-all"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5 fill-current" />
                  )}
                </button>

                {/* 10s Fast Forward */}
                <button 
                  onClick={() => skipTime(10)}
                  className="p-2.5 rounded-xl hover:bg-slate-100 text-text-sub active:scale-95 transition-all"
                  title="Avançar 10s"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Extra Utility bar: Speed, Volume, Bookmark */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                {/* Playback speed multiplier button */}
                <button 
                  onClick={handleSpeedChange}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-[9px] font-black text-text-main uppercase tracking-widest transition-all"
                  title="Velocidade de Reprodução"
                >
                  <Gauge className="w-3.5 h-3.5 text-text-sub" />
                  <span>{playbackRate.toFixed(2)}x</span>
                </button>

                {/* Volume slider */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={toggleMute}
                    className="p-1.5 rounded-lg hover:bg-slate-50 text-text-sub active:scale-90 transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-red-500" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setVolume(val);
                      if (audioRef.current) audioRef.current.volume = val;
                      if (val > 0 && isMuted) {
                        setIsMuted(false);
                        if (audioRef.current) audioRef.current.muted = false;
                      }
                    }}
                    className="w-12 h-1 bg-slate-100 rounded appearance-none cursor-pointer accent-text-sub"
                  />
                </div>
              </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
