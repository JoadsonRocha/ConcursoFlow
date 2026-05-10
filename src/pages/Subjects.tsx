import React, { useState } from 'react';
import { Contest, Subject, Topic } from '../types';
import { cn } from '../lib/utils';
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

export default function Subjects({ contest, onUpdate }: { contest: Contest, onUpdate: (contest: Contest) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'Tudo' | 'Gerais' | 'Específicos'>('Tudo');
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<{ subId: string, topicId: string, topicName: string } | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [activeErrorNote, setActiveErrorNote] = useState<{ subId: string, topicId: string, note: string } | null>(null);

  const filteredSubjects = contest.subjects.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'Tudo' || s.category === filter;
    return matchesSearch && matchesFilter;
  });

  const handleAiAsk = (e: React.MouseEvent, subId: string, topicId: string, topicName: string) => {
    e.stopPropagation();
    setSelectedTopic({ subId, topicId, topicName });
    setAiSummary(null);
    setIsLoadingAi(true);
    generateStudySummary(subId, topicName).then(summary => {
      setAiSummary(summary);
      setIsLoadingAi(false);
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

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em]">Gestão de Conteúdo</div>
          <h1 className="text-4xl md:text-6xl font-display leading-[0.9] text-text-main tracking-tighter">
            Edital <span className="italic text-primary">Verticalizado</span>.
          </h1>
          <p className="text-text-sub text-sm font-medium pt-2">Acompanhe seu progresso cirurgicamente por cada tópico.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 border border-border p-1.5 rounded-2xl shadow-inner w-full md:w-auto">
          {['Tudo', 'Gerais', 'Específicos'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                filter === f ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-text-sub hover:text-text-main"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-sub group-focus-within:text-primary transition-colors" />
        <input 
          type="text" 
          placeholder="Pesquisar matéria ou tópico..." 
          className="w-full bg-white dark:bg-slate-900 border border-border rounded-[2rem] pl-14 pr-6 py-5 text-sm font-bold outline-none focus:ring-4 ring-primary/5 transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        {filteredSubjects.map((sub) => {
          const completedCount = sub.topics?.filter(t => t.completed).length || 0;
          const totalCount = sub.topics?.length || 0;
          const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          return (
            <div key={sub.id} className="bg-white dark:bg-slate-900 border border-border rounded-[2.5rem] overflow-hidden shadow-sm transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 group">
              <div 
                className="p-6 md:p-8 cursor-pointer flex items-center justify-between"
                onClick={() => setExpandedSubject(expandedSubject === sub.id ? null : sub.id)}
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-primary/10 rounded-2x flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-display text-text-main leading-none">{sub.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-text-sub font-black uppercase tracking-[0.1em]">{sub.category}</span>
                      <div className="w-1 h-1 rounded-full bg-border"></div>
                      <span className={cn(
                        "text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-tight text-white",
                        sub.incidence === 'Muito Alta' ? "bg-red-500" : 
                        sub.incidence === 'Alta' ? "bg-orange-500" :
                        "bg-accent"
                      )}>
                        {sub.incidence}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="hidden md:flex items-center gap-4">
                     <div className="text-right">
                        <div className="text-2xl font-display text-text-main leading-none">{percent}%</div>
                        <div className="text-[10px] font-black text-text-sub uppercase tracking-widest mt-1">{completedCount}/{totalCount}</div>
                     </div>
                     <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-700 ease-out" style={{ width: `${percent}%` }}></div>
                     </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-text-sub group-hover:bg-primary group-hover:text-white transition-all">
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
                    className="border-t border-border bg-slate-50/50 dark:bg-slate-800/10"
                  >
                    <div className="p-6 md:p-10 space-y-8">
                      {sub.briefing && (
                        <div className="bg-white dark:bg-slate-900 border border-border p-6 rounded-[2rem] shadow-sm flex gap-4 items-start">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                            <BrainCircuit className="w-5 h-5" />
                          </div>
                          <p className="text-sm text-text-main font-medium leading-relaxed">
                            <span className="font-black text-primary uppercase text-[10px] block mb-1 tracking-widest">Estratégia IA:</span>
                            {sub.briefing}
                          </p>
                        </div>
                      )}

                      <div className="bg-white dark:bg-slate-900 border border-border rounded-[2.5rem] overflow-hidden divide-y divide-border shadow-sm">
                        {sub.topics?.map((topic) => (
                          <div key={topic.id} className="group/topic hover:bg-slate-50 transition-colors">
                             <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                               <div className="flex items-center gap-5 flex-1 min-w-0">
                                  <div 
                                    onClick={() => updateTopic(sub.id, topic.id, { completed: !topic.completed })}
                                    className={cn(
                                      "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer shadow-sm",
                                      topic.completed ? "bg-accent border-accent text-white" : "border-border hover:border-accent/50 text-transparent"
                                    )}
                                  >
                                    <CheckCircle2 className="w-5 h-5" />
                                  </div>
                                  <span className={cn(
                                    "text-base font-medium transition-all truncate", 
                                    topic.completed ? "text-text-sub line-through opacity-50" : "text-text-main"
                                  )}>
                                    {topic.name}
                                  </span>
                               </div>

                               <div className="flex items-center gap-6 ml-13 md:ml-0">
                                  <div className="flex items-center gap-4 text-[10px] font-black text-text-sub uppercase tracking-widest">
                                    <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-all">
                                      <div className={cn(
                                        "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                                        topic.revision ? "bg-primary border-primary text-white" : "border-border"
                                      )}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full bg-white", !topic.revision && "hidden")}></div>
                                      </div>
                                      <input type="checkbox" className="hidden" checked={topic.revision} onChange={(e) => updateTopic(sub.id, topic.id, { revision: e.target.checked })} />
                                      REV.
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-all">
                                      <div className={cn(
                                        "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                                        topic.questions ? "bg-primary border-primary text-white" : "border-border"
                                      )}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full bg-white", !topic.questions && "hidden")}></div>
                                      </div>
                                      <input type="checkbox" className="hidden" checked={topic.questions} onChange={(e) => updateTopic(sub.id, topic.id, { questions: e.target.checked })} />
                                      QUES.
                                    </label>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <button 
                                      onClick={() => setActiveErrorNote({ subId: sub.id, topicId: topic.id, note: topic.errorNote || '' })}
                                      className={cn(
                                        "w-10 h-10 rounded-xl transition-all flex items-center justify-center",
                                        topic.errorNote ? "text-red-500 bg-red-50" : "text-text-sub hover:bg-slate-100"
                                      )}
                                      title="Caderno de Erros"
                                    >
                                      <PenTool className="w-5 h-5" />
                                    </button>
                                    <button 
                                      onClick={(e) => handleAiAsk(e, sub.name, topic.id, topic.name)}
                                      className="w-10 h-10 rounded-xl text-primary hover:bg-primary/10 transition-all flex items-center justify-center"
                                      title="Resumo IA"
                                    >
                                      <BrainCircuit className="w-5 h-5" />
                                    </button>
                                  </div>
                               </div>
                             </div>
                             
                             {topic.errorNote && activeErrorNote?.topicId !== topic.id && (
                               <div className="px-18 pb-6">
                                 <div className="bg-red-50/50 dark:bg-red-500/5 p-4 rounded-2xl border-l-4 border-red-500">
                                   <div className="text-[10px] font-black text-red-500 uppercase mb-1 tracking-widest leading-none">Caderno de Erros</div>
                                   <p className="text-xs text-red-700/80 font-medium leading-relaxed italic">{topic.errorNote}</p>
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
      
      {/* Modals follow same style as App.tsx (Refined in Multi-Edit) */}
      <AnimatePresence>
        {selectedTopic && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-card-bg border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex justify-between items-center bg-gray-50/50 dark:bg-bg/40">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-text-main">IA Monitor: {selectedTopic.topicName}</h3>
                </div>
                <button onClick={() => setSelectedTopic(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-bg rounded-full transition-colors text-text-sub">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto">
                {isLoadingAi ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-text-sub text-[10px] font-bold uppercase tracking-widest animate-pulse transition-colors">Sincronizando Resumo Pro</p>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-text-main text-sm leading-relaxed font-medium transition-colors">
                    {aiSummary}
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50 dark:bg-bg/20 border-t border-border flex justify-end transition-colors">
                <button 
                  onClick={() => setSelectedTopic(null)}
                  className="bg-primary text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-card-bg border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
               <div className="p-6 border-b border-border flex justify-between items-center bg-red-50/50 dark:bg-red-500/5">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/10 p-2 rounded-lg text-red-500">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-text-main">Caderno de Erros</h3>
                </div>
                <button onClick={() => setActiveErrorNote(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-bg rounded-full transition-colors text-text-sub">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-xs text-text-sub leading-relaxed">
                  Descreva abaixo o que você mais erra neste tópico ou gatilhos mentais para não errar mais.
                </p>
                <textarea 
                  className="w-full h-40 bg-gray-50 dark:bg-bg/40 border border-border rounded-xl p-4 text-sm outline-none focus:ring-2 ring-red-500/20 transition-all resize-none text-text-main"
                  placeholder="Ex: Confundo sempre a competência privativa com a exclusiva..."
                  value={activeErrorNote.note}
                  onChange={(e) => setActiveErrorNote({...activeErrorNote, note: e.target.value})}
                />
              </div>

              <div className="p-6 border-t border-border flex gap-3">
                <button onClick={() => setActiveErrorNote(null)} className="flex-1 py-3 text-sm font-bold text-text-sub hover:bg-gray-100 dark:hover:bg-bg rounded-xl transition-colors">Cancelar</button>
                <button 
                  onClick={() => {
                    updateTopic(activeErrorNote.subId, activeErrorNote.topicId, { errorNote: activeErrorNote.note });
                    setActiveErrorNote(null);
                  }}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar no Caderno
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
