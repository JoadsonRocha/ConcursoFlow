import React, { useState } from 'react';
import { Contest, Topic } from '../types';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Calendar, 
  Clock, 
  BrainCircuit, 
  ChevronDown, 
  ChevronUp, 
  Trash2,
  BookMarked
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

interface SavedSummaryItem {
  summaryId: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  aiSummary: string;
  savedAt: string;
}

export default function Resumos({ contest, onUpdate }: { contest: Contest; onUpdate: (contest: Contest) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]); // Array of summaryIds

  // Extract all saved summaries from the active contest
  const savedSummaries: SavedSummaryItem[] = [];
  
  if (contest && contest.subjects) {
    contest.subjects.forEach(subject => {
      if (subject.topics) {
        subject.topics.forEach(topic => {
          if (topic.savedSummaries && topic.savedSummaries.length > 0) {
            topic.savedSummaries.forEach(sumItem => {
              savedSummaries.push({
                summaryId: sumItem.id,
                subjectId: subject.id,
                subjectName: subject.name,
                topicId: topic.id,
                topicName: topic.name,
                aiSummary: sumItem.aiSummary,
                savedAt: sumItem.savedAt
              });
            });
          } else if (topic.aiSummary) {
            // Fallback for single legacy summary
            savedSummaries.push({
              summaryId: 'legacy-' + topic.id,
              subjectId: subject.id,
              subjectName: subject.name,
              topicId: topic.id,
              topicName: topic.name,
              aiSummary: topic.aiSummary,
              savedAt: topic.aiSummarySavedAt || new Date().toISOString()
            });
          }
        });
      }
    });
  }

  // Sort summaries by saved date (newest first)
  const sortedSummaries = savedSummaries.sort((a, b) => {
    return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
  });

  // Filter summaries based on search
  const filteredSummaries = sortedSummaries.filter(item => {
    const matchesSearch = 
      item.topicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const toggleExpand = (summaryId: string) => {
    setExpandedItems(prev => 
      prev.includes(summaryId) 
        ? prev.filter(id => id !== summaryId) 
        : [...prev, summaryId]
    );
  };

  const handleDeleteSummary = (subjectId: string, topicId: string, summaryId: string) => {
    if (!window.confirm("Deseja realmente excluir este resumo salvo? Você precisará gerá-lo novamente.")) {
      return;
    }

    const newSubjects = contest.subjects.map(sub => {
      if (sub.id !== subjectId) return sub;
      
      const newTopics = sub.topics?.map(topic => {
        if (topic.id !== topicId) return topic;
        
        if (topic.savedSummaries && topic.savedSummaries.length > 0) {
          const updatedSummaries = topic.savedSummaries.filter(sum => sum.id !== summaryId);
          const latestSummary = updatedSummaries[updatedSummaries.length - 1];
          return {
            ...topic,
            aiSummary: latestSummary ? latestSummary.aiSummary : undefined,
            aiSummarySavedAt: latestSummary ? latestSummary.savedAt : undefined,
            savedSummaries: updatedSummaries
          };
        } else {
          // Legacy single summary fallback deletion
          const { aiSummary, aiSummarySavedAt, ...rest } = topic;
          return rest as Topic;
        }
      });
      
      return { ...sub, topics: newTopics };
    });

    onUpdate({ ...contest, subjects: newSubjects });
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1.5">
            <BookMarked className="w-4 h-4" />
            <span>Meu Conhecimento</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl text-text-main font-black tracking-tight uppercase">
            Linha do Tempo de Resumos
          </h1>
          <p className="text-sm text-text-sub max-w-xl">
            Sua linha do tempo de aprendizado focado no edital ativo. Resumos de elite customizados para a banca <strong className="text-primary">{contest.banca || 'Geral'}</strong> e cargo de <strong className="text-primary">{contest.role || 'Candidato'}</strong>.
          </p>
        </div>

        {savedSummaries.length > 0 && (
          <div className="bg-primary/5 border border-primary/10 px-5 py-3.5 rounded-2xl flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl text-primary shrink-0">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Total de Resumos</div>
              <div className="text-lg font-black text-text-main leading-none">
                {savedSummaries.length} {savedSummaries.length === 1 ? 'Salvo' : 'Salvos'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {savedSummaries.length === 0 ? (
        <div className="bg-white border border-border rounded-3xl p-12 text-center max-w-2xl mx-auto my-12 flex flex-col items-center justify-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="font-display text-lg text-text-main font-bold tracking-tight">Nenhum resumo salvo ainda</h3>
            <p className="text-sm text-text-sub leading-relaxed">
              Os resumos estratégicos gerados por IA ajudam na memorização de pontos críticos do seu edital.
            </p>
            <p className="text-xs text-indigo-600 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
              💡 <strong>Como salvar?</strong> Vá na página <strong>Edital</strong>, abra uma disciplina, clique no ícone de cérebro (<BrainCircuit className="inline w-3.5 h-3.5 mx-0.5" />) ao lado do tópico que quer resumir e, ao final da leitura, clique em <strong>"Confirmar Leitura & Salvar"</strong>.
            </p>
          </div>
          <Link 
            to="/materias" 
            className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-md inline-block"
          >
            Ir para o Edital
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub" />
              <input 
                type="text" 
                placeholder="Buscar por matéria ou tópico..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-border rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Timeline */}
          {filteredSummaries.length === 0 ? (
            <div className="text-center py-12 text-text-sub text-sm">
              Nenhum resumo encontrado para "{searchTerm}".
            </div>
          ) : (
            <div className="relative border-l-2 border-indigo-100/70 ml-4 md:ml-6 pl-6 md:pl-8 space-y-8 py-2">
              {filteredSummaries.map((item, index) => {
                const isExpanded = expandedItems.includes(item.summaryId);
                
                return (
                  <motion.div 
                    key={item.summaryId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    {/* Timeline Node Point */}
                    <div className="absolute -left-[31px] md:-left-[39px] top-1.5 w-4 h-4 rounded-full border-4 border-white bg-indigo-500 shadow-md"></div>
                    
                    {/* Card container */}
                    <div className="bg-white border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      {/* Card Header */}
                      <div 
                        onClick={() => toggleExpand(item.summaryId)}
                        className="p-5 flex justify-between items-start gap-4 hover:bg-slate-50/50 cursor-pointer transition-colors"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md max-w-full truncate">
                              {item.subjectName}
                            </span>
                            <span className="text-[10px] text-text-sub font-semibold flex items-center gap-1 shrink-0">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {formatDate(item.savedAt)}
                            </span>
                          </div>
                          <h3 className="font-display font-black text-text-main text-base md:text-lg tracking-tight leading-snug">
                            {item.topicName}
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSummary(item.subjectId, item.topicId, item.summaryId);
                            }}
                            className="p-2 text-text-sub hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir resumo salvo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="p-1 text-text-sub">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content with Markdown */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="overflow-hidden border-t border-border bg-[#FCFCFD]"
                          >
                            <div className="p-6 md:p-8 space-y-6">
                              <div className="markdown-body prose max-w-none text-text-sub text-sm leading-relaxed pl-5 border-l-2 border-indigo-500/20">
                                <Markdown>{item.aiSummary}</Markdown>
                              </div>
                              <div className="flex justify-end gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-border pt-4">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                                  <span>Salvo em {formatDate(item.savedAt)}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
