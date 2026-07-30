import React, { useState } from 'react';
import { Contest, Topic } from '../types';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import rehypeSanitize from 'rehype-sanitize';
import { 
  BookOpen, 
  Search, 
  Calendar, 
  Clock, 
  BrainCircuit, 
  ChevronDown, 
  ChevronUp, 
  Trash2,
  BookMarked,
  FileDown,
  Copy,
  Check,
  CheckCircle2,
  RotateCw,
  Filter
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
  revisionCount: number;
  lastReviewedAt?: string;
}

export default function Resumos({ contest, onUpdate }: { contest: Contest; onUpdate: (contest: Contest) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<string[]>([]); // Array of summaryIds
  const [copiedSummaryId, setCopiedSummaryId] = useState<string | null>(null);

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
                savedAt: sumItem.savedAt,
                revisionCount: sumItem.revisionCount || 0,
                lastReviewedAt: sumItem.lastReviewedAt
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
              savedAt: topic.aiSummarySavedAt || new Date().toISOString(),
              revisionCount: 0
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

  // Extract unique subject names
  const uniqueSubjects = Array.from(new Set(savedSummaries.map(s => s.subjectName)));

  // Filter summaries based on search and selected subject filter
  const filteredSummaries = sortedSummaries.filter(item => {
    const matchesSearch = 
      item.topicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || item.subjectName === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const toggleExpand = (summaryId: string) => {
    setExpandedItems(prev => 
      prev.includes(summaryId) 
        ? prev.filter(id => id !== summaryId) 
        : [...prev, summaryId]
    );
  };

  const handleIncrementRevision = (subjectId: string, topicId: string, summaryId: string) => {
    const newSubjects = contest.subjects.map(sub => {
      if (sub.id !== subjectId) return sub;
      
      const newTopics = sub.topics?.map(topic => {
        if (topic.id !== topicId) return topic;
        
        if (topic.savedSummaries && topic.savedSummaries.length > 0) {
          const updatedSummaries = topic.savedSummaries.map(sum => {
            if (sum.id === summaryId || summaryId === 'legacy-' + topic.id) {
              return {
                ...sum,
                revisionCount: (sum.revisionCount || 0) + 1,
                lastReviewedAt: new Date().toISOString()
              };
            }
            return sum;
          });
          return { ...topic, savedSummaries: updatedSummaries };
        } else {
          // Legacy single summary conversion
          const newSummaryItem = {
            id: summaryId,
            aiSummary: topic.aiSummary || '',
            savedAt: topic.aiSummarySavedAt || new Date().toISOString(),
            revisionCount: 1,
            lastReviewedAt: new Date().toISOString()
          };
          return {
            ...topic,
            savedSummaries: [newSummaryItem]
          };
        }
      });
      
      return { ...sub, topics: newTopics };
    });

    onUpdate({ ...contest, subjects: newSubjects });
  };

  const handleCopyText = (summaryId: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSummaryId(summaryId);
      setTimeout(() => setCopiedSummaryId(null), 2000);
    });
  };

  const handleExportPDF = async (item: SavedSummaryItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Permita janelas popup no seu navegador para gerar e salvar o PDF.");
      return;
    }
    
    const formattedDate = formatDate(item.savedAt);
    const rawParsedHtml = await marked.parse(item.aiSummary || '');
    const parsedMarkdownHtml = DOMPurify.sanitize(rawParsedHtml);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resumo - ${item.topicName}</title>
          <meta charset="utf-8" />
          <style>
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              padding: 32px 40px;
              max-width: 850px;
              margin: 0 auto;
              line-height: 1.6;
              background-color: #ffffff;
            }
            .header {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .badge {
              display: inline-block;
              background: #e0e7ff;
              color: #4338ca;
              padding: 4px 12px;
              border-radius: 6px;
              font-weight: 700;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .meta {
              font-size: 12px;
              color: #64748b;
              margin-top: 10px;
              line-height: 1.5;
            }
            .title {
              font-size: 22px;
              color: #0f172a;
              margin: 10px 0 4px 0;
              font-weight: 800;
              letter-spacing: -0.3px;
            }
            .content {
              font-size: 13.5px;
              color: #1e293b;
            }
            /* Rendered Markdown Formatting */
            .content h1, .content h2, .content h3, .content h4 {
              color: #0f172a;
              font-weight: 700;
              margin-top: 1.5em;
              margin-bottom: 0.5em;
              line-height: 1.3;
            }
            .content h1 { font-size: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
            .content h2 { font-size: 17px; color: #1e1b4b; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px; }
            .content h3 { font-size: 15px; color: #312e81; }
            .content h4 { font-size: 14px; }

            .content p {
              margin-bottom: 12px;
              line-height: 1.65;
            }
            .content ul, .content ol {
              margin-top: 6px;
              margin-bottom: 14px;
              padding-left: 22px;
            }
            .content li {
              margin-bottom: 6px;
              line-height: 1.6;
            }
            .content strong, .content b {
              color: #0f172a;
              font-weight: 700;
            }
            .content hr {
              border: none;
              border-top: 1px solid #e2e8f0;
              margin: 24px 0;
            }
            .content table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
              font-size: 12.5px;
            }
            .content th, .content td {
              border: 1px solid #cbd5e1;
              padding: 8px 12px;
              text-align: left;
            }
            .content th {
              background-color: #f1f5f9;
              font-weight: 700;
              color: #0f172a;
            }
            .content tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .content code {
              background-color: #f1f5f9;
              border: 1px solid #e2e8f0;
              border-radius: 4px;
              padding: 2px 6px;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              font-size: 12px;
              color: #0284c7;
            }
            .content pre {
              background-color: #0f172a;
              color: #f8fafc;
              padding: 14px 16px;
              border-radius: 8px;
              overflow-x: auto;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              font-size: 12px;
              margin: 14px 0;
            }
            .content pre code {
              background: transparent;
              color: inherit;
              border: none;
              padding: 0;
            }
            .content blockquote {
              border-left: 4px solid #6366f1;
              background: #f5f3ff;
              padding: 10px 16px;
              margin: 14px 0;
              border-radius: 0 8px 8px 0;
              color: #3730a3;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
              border-top: 1px solid #f1f5f9;
              padding-top: 16px;
            }
            @media print {
              body { padding: 0; }
              .header { border-bottom-color: #cbd5e1; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="badge">${item.subjectName}</span>
            <div class="title">${item.topicName}</div>
            <div class="meta">
              <strong>Concurso:</strong> ${contest.name || 'Geral'} | 
              <strong>Banca:</strong> ${contest.banca || 'Geral'} | 
              <strong>Cargo:</strong> ${contest.role || 'Candidato'}<br/>
              <strong>Data do Resumo:</strong> ${formattedDate} | 
              <strong>Revisado:</strong> ${item.revisionCount}x
            </div>
          </div>
          <div class="content">${parsedMarkdownHtml}</div>
          <div class="footer">
            Stratis Planner — Resumo Estratégico do Edital
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
    <div className="px-3 py-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-5 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1.5">
            <BookMarked className="w-4 h-4" />
            <span>Meu Conhecimento</span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl text-text-main font-black tracking-tight uppercase">
            Linha do Tempo de Resumos
          </h1>
          <p className="text-xs sm:text-sm text-text-sub max-w-xl leading-relaxed mt-1">
            Sua linha do tempo de aprendizado focado no edital ativo. Resumos de elite customizados para a banca <strong className="text-primary">{contest.banca || 'Geral'}</strong> e cargo de <strong className="text-primary">{contest.role || 'Candidato'}</strong>.
          </p>
        </div>

        {savedSummaries.length > 0 && (
          <div className="bg-primary/5 border border-primary/10 px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl flex items-center gap-3 shrink-0 self-start sm:self-auto">
            <div className="bg-primary/10 p-2 rounded-xl text-primary shrink-0">
              <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Total de Resumos</div>
              <div className="text-base sm:text-lg font-black text-text-main leading-none">
                {savedSummaries.length} {savedSummaries.length === 1 ? 'Salvo' : 'Salvos'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {savedSummaries.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center max-w-2xl mx-auto my-6 sm:my-12 flex flex-col items-center justify-center space-y-5 sm:space-y-6 shadow-sm">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="font-display text-base sm:text-lg text-text-main font-bold tracking-tight">Nenhum resumo salvo ainda</h3>
            <p className="text-xs sm:text-sm text-text-sub leading-relaxed">
              Os resumos estratégicos gerados por IA ajudam na memorização de pontos críticos do seu edital.
            </p>
            <p className="text-xs text-indigo-600 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 text-left sm:text-center">
              💡 <strong>Como salvar?</strong> Vá na página <strong>Edital</strong>, abra uma disciplina, clique no ícone de cérebro (<BrainCircuit className="inline w-3.5 h-3.5 mx-0.5" />) ao lado do tópico que quer resumir e, ao final da leitura, clique em <strong>"Confirmar Leitura & Salvar"</strong>.
            </p>
          </div>
          <Link 
            to="/materias" 
            className="px-5 py-2.5 sm:px-6 sm:py-3 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-md inline-block"
          >
            Ir para o Edital
          </Link>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {/* Search Controls & Subject Pills Filter */}
          <div className="space-y-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub" />
              <input 
                type="text" 
                placeholder="Buscar por matéria ou tópico..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-border rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-primary/50 transition-all shadow-xs"
              />
            </div>

            {/* Subject Pills Filter */}
            {uniqueSubjects.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none text-xs select-none">
                <div className="flex items-center gap-1 text-slate-400 font-bold uppercase text-[10px] tracking-wider shrink-0 pr-1">
                  <Filter className="w-3 h-3" />
                  <span>Filtrar:</span>
                </div>
                <button
                  onClick={() => setSelectedSubject('all')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 border text-xs flex items-center gap-1.5",
                    selectedSubject === 'all'
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-white text-text-sub border-border hover:bg-slate-50"
                  )}
                >
                  <span>Todas</span>
                  <span className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px]",
                    selectedSubject === 'all' ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  )}>
                    {savedSummaries.length}
                  </span>
                </button>
                {uniqueSubjects.map(subName => {
                  const count = savedSummaries.filter(s => s.subjectName === subName).length;
                  const isSelected = selectedSubject === subName;
                  return (
                    <button
                      key={subName}
                      onClick={() => setSelectedSubject(subName)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 border text-xs flex items-center gap-1.5 max-w-[200px] truncate",
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white text-text-sub border-border hover:bg-slate-50"
                      )}
                    >
                      <span className="truncate">{subName}</span>
                      <span className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px] shrink-0",
                        isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Timeline */}
          {filteredSummaries.length === 0 ? (
            <div className="text-center py-12 text-text-sub text-xs sm:text-sm bg-white border border-border rounded-2xl p-6">
              Nenhum resumo encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="relative border-l-2 border-indigo-100/70 ml-2.5 sm:ml-4 md:ml-6 pl-3.5 sm:pl-6 md:pl-8 space-y-4 sm:space-y-6 md:space-y-8 py-1 sm:py-2">
              {filteredSummaries.map((item, index) => {
                const isExpanded = expandedItems.includes(item.summaryId);
                
                return (
                  <motion.div 
                    key={item.summaryId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="relative"
                  >
                    {/* Timeline Node Point */}
                    <div className="absolute -left-[22px] sm:-left-[31px] md:-left-[39px] top-3.5 sm:top-4 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 sm:border-4 border-white bg-indigo-500 shadow-sm shrink-0"></div>
                    
                    {/* Card container */}
                    <div className="bg-white border border-border rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                      {/* Card Header (Click to expand/collapse) */}
                      <div 
                        onClick={() => toggleExpand(item.summaryId)}
                        className="p-3.5 sm:p-5 flex justify-between items-start gap-2.5 sm:gap-4 hover:bg-slate-50/70 cursor-pointer transition-colors group select-none"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="bg-indigo-50 text-indigo-600 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md max-w-[220px] sm:max-w-none truncate">
                              {item.subjectName}
                            </span>

                            {/* Revision Count Badge */}
                            {item.revisionCount > 0 ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>Revisado {item.revisionCount}x</span>
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-500 text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-md shrink-0">
                                Não Revisado
                              </span>
                            )}

                            <span className="text-[10px] sm:text-xs text-text-sub font-medium flex items-center gap-1 shrink-0 ml-auto sm:ml-0">
                              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                              {formatDate(item.savedAt)}
                            </span>
                          </div>

                          <h3 className="font-display font-bold text-text-main text-sm sm:text-base md:text-lg tracking-tight leading-snug break-words pt-0.5">
                            {item.topicName}
                          </h3>
                        </div>
                        
                        <div className="p-1.5 sm:p-2 bg-slate-100/80 rounded-xl text-text-sub transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600 shrink-0">
                          {isExpanded ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </div>
                      </div>

                      {/* Expanded Content with Markdown */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden border-t border-border bg-[#FCFCFD]"
                          >
                            <div className="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                              <div className="markdown-body prose max-w-none text-text-sub text-xs sm:text-sm leading-relaxed pl-3 sm:pl-5 border-l-2 border-indigo-500/20">
                                <Markdown rehypePlugins={[rehypeSanitize]}>{item.aiSummary}</Markdown>
                              </div>

                              {/* Footer Toolbar: Revision, Export PDF, Copy, Delete */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border pt-3.5 sm:pt-4">
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Increment Revision Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleIncrementRevision(item.subjectId, item.topicId, item.summaryId);
                                    }}
                                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs hover:shadow-sm active:scale-95"
                                    title="Marcar uma revisão concluída para este resumo"
                                  >
                                    <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>+ Marcar Revisão ({item.revisionCount}x)</span>
                                  </button>

                                  {/* PDF Export Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExportPDF(item);
                                    }}
                                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs hover:shadow-sm active:scale-95"
                                    title="Baixar ou Imprimir como PDF"
                                  >
                                    <FileDown className="w-3.5 h-3.5" />
                                    <span>Exportar PDF</span>
                                  </button>

                                  {/* Copy Text Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyText(item.summaryId, item.aiSummary);
                                    }}
                                    className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
                                    title="Copiar conteúdo em texto"
                                  >
                                    {copiedSummaryId === item.summaryId ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-emerald-600 font-bold">Copiado!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Copiar Texto</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* Delete Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSummary(item.subjectId, item.topicId, item.summaryId);
                                  }}
                                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs hover:shadow-sm active:scale-95 self-end sm:self-auto"
                                  title="Excluir este resumo salvo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Excluir</span>
                                </button>
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

