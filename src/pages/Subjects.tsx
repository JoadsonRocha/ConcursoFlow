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
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Edital Verticalizado</h1>
          <p className="text-text-sub text-sm">Gerencie seu progresso e anote seus erros por tópico.</p>
        </div>
        <div className="flex bg-white dark:bg-card-bg border border-border p-1 rounded-xl shadow-sm mt-4 md:mt-0 transition-colors">
          {['Tudo', 'Gerais', 'Específicos'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                "px-5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filter === f ? "bg-primary text-white" : "text-text-sub hover:text-text-main"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub transition-colors" />
        <input 
          type="text" 
          placeholder="Filtrar por nome da matéria..." 
          className="w-full bg-white dark:bg-card-bg border border-border rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 ring-primary/10 transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredSubjects.map((sub) => {
          const completedCount = sub.topics?.filter(t => t.completed).length || 0;
          const totalCount = sub.topics?.length || 0;
          const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          return (
            <div key={sub.id} className="bg-white dark:bg-card-bg border border-border rounded-xl overflow-hidden shadow-sm transition-all hover:border-primary/30">
              <div 
                className="p-3 cursor-pointer flex items-center justify-between transition-colors"
                onClick={() => setExpandedSubject(expandedSubject === sub.id ? null : sub.id)}
              >
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-1.5 rounded-lg text-primary transition-colors">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-main text-sm">{sub.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] text-text-sub font-bold uppercase tracking-wider">{sub.category}</span>
                      <span className={cn(
                        "text-[8px] px-1.5 py-0.5 rounded font-bold uppercase text-white",
                        sub.incidence === 'Muito Alta' ? "bg-red-500" : 
                        sub.incidence === 'Alta' ? "bg-orange-500" :
                        "bg-accent"
                      )}>
                        {sub.incidence}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden md:block w-20">
                     <div className="flex justify-between text-[8px] font-bold text-text-sub mb-0.5 transition-colors">
                       <span>{completedCount}/{totalCount}</span>
                       <span>{percent}%</span>
                     </div>
                     <div className="h-0.5 bg-gray-100 dark:bg-bg rounded-full overflow-hidden transition-colors">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }}></div>
                     </div>
                  </div>
                  <ChevronRight className={cn("w-3.5 h-3.5 text-gray-300 transition-transform", expandedSubject === sub.id && "rotate-90")} />
                </div>
              </div>

              <AnimatePresence>
                {expandedSubject === sub.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border bg-gray-50/50 dark:bg-bg/20 transition-colors"
                  >
                    <div className="p-6 pt-4">
                      {sub.briefing && (
                        <div className="bg-primary/5 border-l-4 border-primary p-4 mb-6 rounded-r-xl transition-colors">
                          <p className="text-xs text-text-main leading-relaxed">
                            <strong>Briefing:</strong> {sub.briefing}
                          </p>
                        </div>
                      )}

                      <div className="bg-white dark:bg-card-bg border border-border rounded-xl overflow-hidden divide-y divide-border transition-colors">
                        {sub.topics?.map((topic) => (
                          <div key={topic.id} className="p-0 hover:bg-gray-50 dark:hover:bg-bg/40 transition-colors group">
                             <div className="p-4 flex items-center justify-between">
                               <div className="flex items-center gap-4 flex-1">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded-md border-border text-accent focus:ring-accent accent-accent transition-colors cursor-pointer" 
                                    checked={topic.completed}
                                    onChange={(e) => updateTopic(sub.id, topic.id, { completed: e.target.checked })}
                                  />
                                  <span className={cn("text-sm font-medium transition-colors", topic.completed ? "text-text-sub line-through" : "text-text-main")}>
                                    {topic.name}
                                  </span>
                               </div>

                               <div className="flex items-center gap-6">
                                  <div className="flex items-center gap-4 text-[10px] font-bold text-text-sub uppercase tracking-tight">
                                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
                                      <input 
                                        type="checkbox" 
                                        className="w-3.5 h-3.5 rounded-sm border-border accent-primary" 
                                        checked={topic.revision} 
                                        onChange={(e) => updateTopic(sub.id, topic.id, { revision: e.target.checked })}
                                      />
                                      REV.
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
                                      <input 
                                        type="checkbox" 
                                        className="w-3.5 h-3.5 rounded-sm border-border accent-primary" 
                                        checked={topic.questions} 
                                        onChange={(e) => updateTopic(sub.id, topic.id, { questions: e.target.checked })}
                                      />
                                      QUES.
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => setActiveErrorNote({ subId: sub.id, topicId: topic.id, note: topic.errorNote || '' })}
                                      className={cn(
                                        "p-1.5 rounded-lg transition-all",
                                        topic.errorNote ? "text-red-500 bg-red-50 dark:bg-red-500/10 opacity-100" : "opacity-0 group-hover:opacity-100 hover:bg-gray-100 text-text-sub"
                                      )}
                                      title="Caderno de Erros"
                                    >
                                      <PenTool className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={(e) => handleAiAsk(e, sub.name, topic.id, topic.name)}
                                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-primary/10 text-primary transition-all"
                                      title="Resumo Pro com IA"
                                    >
                                      <BrainCircuit className="w-4 h-4" />
                                    </button>
                                  </div>
                               </div>
                             </div>
                             
                             {/* Error Note Inline Preview */}
                             {topic.errorNote && activeErrorNote?.topicId !== topic.id && (
                               <div className="px-12 pb-3">
                                 <div className="text-[10px] font-bold text-red-500/70 uppercase mb-1">Caderno de Erros:</div>
                                 <p className="text-xs text-red-600/80 italic line-clamp-2">{topic.errorNote}</p>
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
      
      {/* AI Modal */}
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
