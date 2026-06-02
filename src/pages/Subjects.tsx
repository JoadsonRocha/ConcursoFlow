import React, { useState } from 'react';
import { Contest, Subject, Topic } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import ProModal from '../components/ProModal';
import { 
  CheckCircle2, 
  Circle, 
  Search, 
  Filter,
  BrainCircuit,
  MessageSquare,
  BookOpen,
  X,
  ChevronRight,
  PenTool,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateStudySummary } from '../services/gemini';

import { CopyPlus } from 'lucide-react';
export default function Subjects({ contest, contests, onUpdate }: { contest: Contest, contests?: Contest[], onUpdate: (contest: Contest) => void }) {
  const { profile, updateProfile, isPro, planType } = useAuth();
  const [showProModal, setShowProModal] = useState(false);
  const [proFeatureName, setProFeatureName] = useState('Funcionalidade PRO');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'Tudo' | 'Gerais' | 'Específicos'>('Tudo');
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<{ subId: string, topicId: string, topicName: string } | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [activeErrorNote, setActiveErrorNote] = useState<{ subId: string, topicId: string, note: string } | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeSourceContestId, setMergeSourceContestId] = useState<string>('');
  const [selectedSubjectsToMerge, setSelectedSubjectsToMerge] = useState<string[]>([]);

  const filteredSubjects = contest.subjects.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const normalizedCategory = s.category?.toLowerCase() || '';
    const mappedCategory = normalizedCategory.includes('espec') ? 'Específicos' : 'Gerais';
    const matchesFilter = filter === 'Tudo' || mappedCategory === filter;
    return matchesSearch && matchesFilter;
  });

  const getLimit = () => {
    if (planType === 'pro') return 500;
    return 10;
  };

  const handleAiAsk = (e: React.MouseEvent, subjectName: string, topicId: string, topicName: string) => {
    e.stopPropagation();
    
    // Limits check
    const limit = getLimit();
    if ((contest.summaryUsage || 0) >= limit) {
      setProFeatureName(`Resumos Estratégicos (Máx: ${limit})`);
      setShowProModal(true);
      return;
    }

    setSelectedTopic({ subId: subjectName, topicId, topicName }); // abusing subId to store name for UI
    setAiSummary(null);
    setIsLoadingAi(true);
    generateStudySummary(subjectName, topicName).then(async (summary) => {
      setAiSummary(summary);
      setIsLoadingAi(false);
      
      // Update global usage
      onUpdate({ 
        ...contest, 
        summaryUsage: (contest.summaryUsage || 0) + 1 
      });
    }).catch(() => {
      setAiSummary("Erro ao gerar resumo.");
      setIsLoadingAi(false);
    });
  };

  const updateTopic = (subId: string, topicId: string, updates: Partial<Topic>) => {
    const newSubjects = contest.subjects.map(sub => {
      if (sub.id !== subId) return sub;
      
      const newTopics = sub.topics?.map(topic => {
        if (topic.id !== topicId) return topic;
        return { ...topic, ...updates };
      });
      
      return { ...sub, topics: newTopics };
    });
    
    onUpdate({ ...contest, subjects: newSubjects });
  };

  const handleMergeSubjects = () => {
    if (!contests || !mergeSourceContestId || selectedSubjectsToMerge.length === 0) return;
    
    const sourceContest = contests.find(c => c.id === mergeSourceContestId);
    if (!sourceContest) return;

    const subjectsToAdd = sourceContest.subjects.filter(s => selectedSubjectsToMerge.includes(s.id));
    
    // Create deep copies to avoid reference issues and generate new IDs
    const newSubjects = subjectsToAdd.map(sub => ({
      ...sub,
      id: `sub-${Math.random().toString(36).substr(2, 9)}`,
      topics: sub.topics?.map(t => ({
        ...t,
        id: `top-${Math.random().toString(36).substr(2, 9)}`,
        completed: false // Reset progress when merging
      }))
    }));

    onUpdate({
      ...contest,
      subjects: [...contest.subjects, ...newSubjects]
    });
    
    setShowMergeModal(false);
    setMergeSourceContestId('');
    setSelectedSubjectsToMerge([]);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 md:pb-10">
      <header className="space-y-4">
        <div className="flex items-center gap-3 text-primary font-bold text-xs uppercase tracking-wider mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]"></div>
          Conteúdo do Edital
        </div>
        <h1 className="text-2xl md:text-3xl font-display text-text-main tracking-tight font-bold">
          Distribuição de Conteúdo
        </h1>
        
        <div className="bg-white border border-border p-6 rounded-2xl space-y-4 shadow-sm">
          <p className="text-text-sub text-xs md:text-sm max-w-2xl leading-relaxed">
            Este painel organiza o conteúdo do seu edital. Marque os tópicos conforme avança em seus estudos.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-8">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Localizar disciplina ou assunto..." 
              className="w-full bg-white border border-border rounded-xl pl-14 pr-6 py-3.5 text-sm text-text-main outline-none focus:ring-4 ring-primary/10 transition-all placeholder:text-text-sub/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex bg-white border border-border p-1 rounded-xl self-start">
            {['Tudo', 'Gerais', 'Específicos'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={cn(
                  "px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                  filter === f 
                    ? "bg-primary text-white shadow-md" 
                    : "text-text-sub hover:text-text-main"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {contests && contests.length > 1 && (
            <button
              onClick={() => {
                if (!isPro) {
                  setProFeatureName('Mesclar Disciplinas');
                  setShowProModal(true);
                  return;
                }
                setShowMergeModal(true);
              }}
              className="flex items-center gap-2 bg-white border border-border px-5 py-3 hover:bg-slate-50 transition-colors rounded-xl text-text-main text-sm font-bold uppercase tracking-wider self-start relative"
            >
              {!isPro && (
                <div className="absolute top-1 right-2 bg-accent text-white text-[8px] px-1.5 py-0.5 rounded-md font-black shadow-sm transform border border-white z-10">
                  PRO
                </div>
              )}
              <CopyPlus className="w-4 h-4 text-primary" />
              Mesclar Disciplinas
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {filteredSubjects.map((sub) => {
          const completedCount = sub.topics?.filter(t => t.completed).length || 0;
          const totalCount = sub.topics?.length || 0;
          const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          return (
            <div 
              key={sub.id} 
              className="rise-card border border-border"
            >
              <div 
                className="p-6 md:p-8 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                onClick={() => setExpandedSubject(expandedSubject === sub.id ? null : sub.id)}
              >
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-primary/5 border border-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary/10 transition-all shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 overflow-hidden flex-1">
                    <h3 className="text-lg md:text-xl font-display text-text-main group-hover:text-primary transition-colors whitespace-normal break-words font-bold tracking-tight">{sub.name}</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-text-sub font-bold uppercase tracking-wider">{sub.category}</span>
                      <div className="w-1 h-1 rounded-full bg-border"></div>
                      <span className={cn(
                        "text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border",
                        sub.incidence === 'Muito Alta' ? "bg-red-500/5 text-red-500 border-red-500/20" : 
                        sub.incidence === 'Alta' ? "bg-orange-500/5 text-orange-500 border-orange-500/20" :
                        "bg-primary/5 text-primary border-primary/20"
                      )}>
                        PESO {sub.incidence}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 md:gap-8 justify-between md:justify-end border-t md:border-t-0 border-border pt-4 md:pt-0">
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-display text-text-main font-bold">{percent}%</span>
                      <div className="w-20 md:w-24 h-1.5 bg-[#F8FAFC] rounded-full overflow-hidden border border-border">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          className="h-full bg-primary rounded-full" 
                        />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-text-sub uppercase tracking-wider">{completedCount}/{totalCount} MÓDULOS</span>
                  </div>
                  <div className={cn(
                    "w-10 h-10 rounded-xl border border-border bg-slate-50 flex items-center justify-center text-text-sub transition-all",
                    expandedSubject === sub.id ? "bg-primary text-white border-primary" : "group-hover:text-primary"
                  )}>
                    <ChevronRight className={cn("w-5 h-5 transition-transform duration-500", expandedSubject === sub.id && "rotate-90")} />
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expandedSubject === sub.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 bg-slate-950/40"
                  >
                    <div className="p-6 md:p-10 space-y-8">
                      {sub.briefing && (
                        <div className="bg-[#FFFFFF] border border-border p-6 rounded-xl flex gap-4 items-start relative overflow-hidden">
                          <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center text-primary shrink-0">
                            <BrainCircuit className="w-5 h-5" />
                          </div>
                          <div className="relative z-10 space-y-1">
                            <span className="font-bold text-primary text-xs uppercase tracking-wider block">Análise de Operação</span>
                            <p className="text-sm text-text-sub leading-relaxed italic">
                              "{sub.briefing}"
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {sub.topics?.map((topic) => (
                          <div key={topic.id} className="group/topic rise-card border-border bg-white hover:bg-slate-50 transition-all p-0">
                             <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
                               <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <button 
                                    onClick={() => updateTopic(sub.id, topic.id, { completed: !topic.completed })}
                                    className={cn(
                                      "w-8 h-8 rounded-lg border flex items-center justify-center transition-all shrink-0",
                                      topic.completed 
                                        ? "bg-accent border-accent text-white" 
                                        : "border-border bg-white text-transparent hover:border-accent"
                                    )}
                                  >
                                    <CheckCircle2 className="w-5 h-5" />
                                  </button>
                                  <div className="flex flex-col">
                                    <span className={cn(
                                      "text-sm font-semibold transition-all whitespace-normal break-words", 
                                      topic.completed ? "text-text-sub line-through" : "text-text-main"
                                    )}>
                                      {topic.name}
                                    </span>
                                    {topic.incidence && (
                                      <span className={cn(
                                        "text-[9px] font-black uppercase tracking-widest mt-0.5",
                                        topic.incidence === 'Muito Alta' ? "text-red-500" :
                                        topic.incidence === 'Alta' ? "text-orange-500" :
                                        "text-text-sub"
                                      )}>
                                        Incidência: {topic.incidence}
                                      </span>
                                    )}
                                  </div>
                               </div>

                               <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-2 md:pt-0">
                                  <div className="flex items-center gap-4 text-[10px] sm:text-xs font-bold text-text-sub uppercase tracking-wider h-8">
                                    <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-all">
                                      <div className={cn(
                                        "w-4 h-4 shrink-0 rounded-md border flex items-center justify-center transition-all",
                                        topic.revision ? "bg-primary border-primary text-white" : "border-border bg-white "
                                      )}>
                                        {topic.revision && <div className="w-1 h-1 rounded-full bg-white"></div>}
                                      </div>
                                      <input type="checkbox" className="hidden" checked={topic.revision} onChange={(e) => updateTopic(sub.id, topic.id, { revision: e.target.checked })} />
                                      <span className="whitespace-nowrap">Revisão</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-all">
                                      <div className={cn(
                                        "w-4 h-4 shrink-0 rounded-md border flex items-center justify-center transition-all",
                                        topic.questions ? "bg-primary border-primary text-white" : "border-border bg-white "
                                      )}>
                                        {topic.questions && <div className="w-1 h-1 rounded-full bg-white"></div>}
                                      </div>
                                      <input type="checkbox" className="hidden" checked={topic.questions} onChange={(e) => updateTopic(sub.id, topic.id, { questions: e.target.checked })} />
                                      <span className="whitespace-nowrap">Questões</span>
                                    </label>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={(e) => handleAiAsk(e, sub.name, topic.id, topic.name)}
                                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all flex items-center justify-center border border-border bg-white hover:border-primary hover:text-primary text-text-sub shrink-0"
                                      title="Resumo Estratégico AI"
                                    >
                                      <BrainCircuit className={cn("w-4 h-4", selectedTopic?.topicId === topic.id && "animate-pulse")} />
                                    </button>
                                    <button 
                                      onClick={() => setActiveErrorNote({ subId: sub.id, topicId: topic.id, note: topic.errorNote || '' })}
                                      className={cn(
                                        "w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all flex items-center justify-center border shrink-0",
                                        topic.errorNote 
                                          ? "text-red-500 bg-red-500/5 border-red-500/20" 
                                          : "text-text-sub border-border bg-white hover:border-primary hover:text-primary"
                                      )}
                                      title="Notas de Erro"
                                    >
                                      <PenTool className="w-4 h-4" />
                                    </button>
                                  </div>
                               </div>
                             </div>
                             
                             {topic.errorNote && activeErrorNote?.topicId !== topic.id && (
                               <div className="px-8 pb-8 ml-16">
                                 <div className="bg-red-500/5 p-6 rounded-2xl border-l-4 border-red-500/50 shadow-inner">
                                   <div className="text-xs font-bold text-red-500 uppercase mb-2 tracking-wider">Ponto de Alerta</div>
                                   <p className="text-sm text-slate-400 italic">"{topic.errorNote}"</p>
                                 </div>
                               </div>
                             )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      
      {/* AI Summary Modal */}
      <AnimatePresence>
        {selectedTopic && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.98, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 10 }}
              className="w-full max-w-2xl bg-white border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 md:p-8 border-b border-border flex justify-between items-center bg-[#FFFFFF] ">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl text-primary">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-text-main font-bold tracking-tight">Resumo do Tópico</h3>
                    <p className="text-xs font-bold text-text-sub uppercase tracking-wider whitespace-normal break-words">{selectedTopic.topicName}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTopic(null)} className="p-2 hover:bg-slate-200 rounded-lg transition-all text-text-sub hover:text-text-main">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 md:p-10 max-h-[60vh] overflow-y-auto">
                {isLoadingAi ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-6">
                    <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-text-sub text-xs font-bold uppercase tracking-wider animate-pulse">Gerando síntese estratégica...</p>
                  </div>
                ) : (
                  <div className="prose max-w-none text-text-sub text-sm leading-relaxed">
                    <div className="whitespace-pre-wrap font-medium border-l-2 border-primary/20 pl-6">
                      {aiSummary?.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#/g, '')}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-border flex justify-end gap-3 bg-[#FFFFFF] ">
                <button 
                  onClick={() => setSelectedTopic(null)}
                  className="px-8 py-3 bg-primary text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-md"
                >
                  Confirmar Leitura
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error Notebook Modal */}
      <AnimatePresence>
        {activeErrorNote && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.98, opacity: 0 }} 
              className="w-full max-w-md bg-white border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 md:p-8 border-b border-border flex justify-between items-center bg-red-50/5 ">
                <div className="flex items-center gap-4">
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-500">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-text-main font-bold tracking-tight">Notas de Alerta</h3>
                    <p className="text-xs font-bold text-text-sub uppercase tracking-wider">Protocolo de Erro</p>
                  </div>
                </div>
                <button onClick={() => setActiveErrorNote(null)} className="p-2 hover:bg-slate-200 rounded-lg transition-all text-text-sub hover:text-text-main">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <p className="text-xs text-text-sub leading-relaxed italic border-l-2 border-red-500/20 pl-4">
                  Registre o gatilho emocional ou técnico que levou ao erro para consolidar o aprendizado.
                </p>
                <textarea 
                  className="w-full h-40 bg-[#FFFFFF] border border-border rounded-xl p-6 text-sm text-text-main outline-none focus:ring-4 ring-red-500/10 transition-all resize-none leading-relaxed placeholder:text-text-sub/30"
                  placeholder="Ex: Confundi competência privativa com delegável..."
                  value={activeErrorNote.note}
                  onChange={(e) => setActiveErrorNote({...activeErrorNote, note: e.target.value})}
                />
              </div>

              <div className="p-6 border-t border-border flex flex-col gap-3 bg-[#FFFFFF] ">
                <button 
                  onClick={() => {
                    updateTopic(activeErrorNote.subId, activeErrorNote.topicId, { errorNote: activeErrorNote.note });
                    setActiveErrorNote(null);
                  }}
                  className="w-full bg-red-500 text-white py-4 rounded-lg font-bold text-xs uppercase tracking-wider shadow-md hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar Alerta
                </button>
                <button onClick={() => setActiveErrorNote(null)} className="w-full py-2 text-xs font-bold uppercase tracking-wider text-text-sub hover:text-text-main transition-all">Descartar Nota</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMergeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-sm" 
              onClick={() => setShowMergeModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.98, opacity: 0 }} 
              className="w-full max-w-2xl bg-white border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] relative z-10"
            >
              <div className="p-6 md:p-8 border-b border-border flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl text-primary">
                    <CopyPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-text-main font-bold tracking-tight">Mesclar Disciplinas</h3>
                    <p className="text-xs font-bold text-text-sub uppercase tracking-wider">Importar de outro edital</p>
                  </div>
                </div>
                <button onClick={() => setShowMergeModal(false)} className="p-2 hover:bg-slate-200 rounded-lg transition-all text-text-sub hover:text-text-main">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-text-sub uppercase tracking-wider mb-2">1. Selecione o Edital de Origem</label>
                    <select 
                      className="w-full bg-white border border-border rounded-xl px-4 py-3.5 text-sm text-text-main outline-none focus:ring-4 ring-primary/10 transition-all font-medium"
                      value={mergeSourceContestId}
                      onChange={(e) => {
                        setMergeSourceContestId(e.target.value);
                        setSelectedSubjectsToMerge([]);
                      }}
                    >
                      <option value="">-- Escolha um Edital --</option>
                      {contests?.filter(c => c.id !== contest.id).map(c => (
                        <option key={c.id} value={c.id}>{c.role}</option>
                      ))}
                    </select>
                  </div>

                  {mergeSourceContestId && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-text-sub uppercase tracking-wider mb-2">2. Selecione as Disciplinas</label>
                      <div className="bg-slate-50 border border-border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                        {contests?.find(c => c.id === mergeSourceContestId)?.subjects.map(sub => {
                          const isSelected = selectedSubjectsToMerge.includes(sub.id);
                          return (
                            <div 
                              key={sub.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedSubjectsToMerge(selectedSubjectsToMerge.filter(id => id !== sub.id));
                                } else {
                                  setSelectedSubjectsToMerge([...selectedSubjectsToMerge, sub.id]);
                                }
                              }}
                              className="flex justify-between items-center p-4 border-b border-border hover:bg-white transition-colors cursor-pointer last:border-0"
                            >
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-bold text-text-main">{sub.name}</span>
                                <span className="text-xs text-text-sub uppercase tracking-wider">{sub.category} • {sub.topics?.length || 0} tópicos</span>
                              </div>
                              <div className={cn(
                                "w-6 h-6 rounded border flex items-center justify-center transition-all",
                                isSelected ? "bg-primary border-primary" : "border-slate-300"
                              )}>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-border flex justify-end gap-3 bg-white">
                <button 
                  onClick={() => setShowMergeModal(false)}
                  className="px-6 py-3 border border-border text-text-main rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleMergeSubjects}
                  disabled={selectedSubjectsToMerge.length === 0}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Importar {selectedSubjectsToMerge.length > 0 && `(${selectedSubjectsToMerge.length})`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ProModal isOpen={showProModal} onClose={() => setShowProModal(false)} featureName={proFeatureName} />
    </div>
  );
}
