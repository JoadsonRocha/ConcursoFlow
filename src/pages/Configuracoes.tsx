import React, { useState, useRef } from 'react';
import { BrainCircuit, Upload, Sparkles, AlertCircle, CheckCircle2, Calendar, FileText, Loader2, Plus, Trash2, Save, Wand2 } from 'lucide-react';
import { parseEdital, generateSchedule } from '../services/gemini';
import { Contest, Subject } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import * as pdfjs from 'pdfjs-dist';

// Configure worker - Use a more stable CDN link
const PDFJS_VERSION = '5.7.284';
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

interface SettingsProps {
  onImport: (contest: Contest) => void;
  onDelete: (id: string) => void;
  contests: Contest[];
  currentContest: Contest | null;
}

export default function Settings({ onImport, onDelete, contests, currentContest }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [rawText, setRawText] = useState('');
  const [manualContestName, setManualContestName] = useState('');
  const [manualRole, setManualRole] = useState('');
  const [dailyHours, setDailyHours] = useState<number | ''>(2);
  const [dailyQuestions, setDailyQuestions] = useState<number | ''>(20);
  const [examDate, setExamDate] = useState('2026-06-27');
  const [autoSchedule, setAutoSchedule] = useState(true);
  const [scheduleWeeks, setScheduleWeeks] = useState(4);
  const [loading, setLoading] = useState(false);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Creation State
  const [manualSubjects, setManualSubjects] = useState<Subject[]>([
    { id: '1', name: 'Português', category: 'Gerais', incidence: 'Muito Alta', topics: [{ id: '1-1', name: 'Interpretação de Texto', completed: false }] }
  ]);

  const addManualSubject = () => {
    const newId = `sub-${Date.now()}`;
    setManualSubjects([...manualSubjects, { 
      id: newId, 
      name: '', 
      category: 'Gerais', 
      incidence: 'Média', 
      topics: [{ id: `${newId}-1`, name: '', completed: false }] 
    }]);
  };

  const removeManualSubject = (id: string) => {
    setManualSubjects(manualSubjects.filter(s => s.id !== id));
  };

  const updateManualSubject = (id: string, updates: Partial<Subject>) => {
    setManualSubjects(manualSubjects.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addManualTopic = (subId: string) => {
    setManualSubjects(manualSubjects.map(s => {
      if (s.id !== subId) return s;
      const newTopicId = `top-${Date.now()}`;
      return { ...s, topics: [...(s.topics || []), { id: newTopicId, name: '', completed: false }] };
    }));
  };

  const removeManualTopic = (subId: string, topicId: string) => {
    setManualSubjects(manualSubjects.map(s => {
      if (s.id !== subId) return s;
      return { ...s, topics: s.topics?.filter(t => t.id !== topicId) };
    }));
  };

  const updateManualTopic = (subId: string, topicId: string, name: string) => {
    setManualSubjects(manualSubjects.map(s => {
      if (s.id !== subId) return s;
      return { ...s, topics: s.topics?.map(t => t.id === topicId ? { ...t, name } : t) };
    }));
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      
      const numPages = Math.min(pdf.numPages, 50); 
      
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => (item as any).str).join(" ");
        fullText += pageText + "\n";
      }
      return fullText;
    } catch (err) {
      console.error("PDF Extraction error:", err);
      throw new Error("Não foi possível ler o PDF. Tente copiar e colar o texto manualmente.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError("Por favor, selecione um arquivo PDF.");
      return;
    }

    setExtractingPdf(true);
    setError(null);
    try {
      const text = await extractTextFromPDF(file);
      setRawText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao extrair texto do PDF.");
    } finally {
      setExtractingPdf(false);
    }
  };

  const handleImport = async () => {
    if (activeTab === 'ai' && !rawText.trim()) return;
    if (activeTab === 'manual' && (!manualContestName || !manualRole)) {
      setError("Nome do concurso e cargo são obrigatórios.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let contestData: Partial<Contest>;

      if (activeTab === 'ai') {
        const parsed = await parseEdital(rawText);
        contestData = parsed as Contest;
      } else {
        contestData = {
          name: manualContestName,
          role: manualRole,
          subjects: manualSubjects.filter(s => s.name.trim() !== ''),
        };
      }

      let schedule = undefined;
      if (autoSchedule && contestData.subjects) {
        const subjectsSummary = contestData.subjects.map(s => 
          `${s.name} (${s.category}): ${s.topics?.map(t => t.name).join(', ')}`
        ).join('\n');
        schedule = await generateSchedule(subjectsSummary, scheduleWeeks * 7);
      }

      const dynamicContest: Contest = {
        ...contestData,
        name: manualContestName || contestData.name || 'Novo Concurso',
        role: manualRole || contestData.role || 'Cargo não especificado',
        subjects: contestData.subjects || [],
        id: `dynamic-${Date.now()}`,
        examDate: examDate,
        dailyGoalHours: Number(dailyHours) || 0,
        dailyGoalQuestions: Number(dailyQuestions) || 0,
        schedule: schedule,
      };
      
      onImport(dynamicContest);
      setSuccess(true);
      if (activeTab === 'ai') setRawText('');
      setManualContestName('');
      setManualRole('');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar o edital.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      <header className="space-y-4 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3 text-primary/80 font-bold text-xs uppercase tracking-wider">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
          Arquitetura de Estudos
        </div>
        <h1 className="text-3xl md:text-5xl font-display text-white tracking-tight">
          Configurar <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Manual</span> ou <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">IA</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base border-l-2 border-primary/30 pl-4 max-w-2xl mx-auto md:mx-0">
          Personalize sua jornada de estudos. Use nossa IA para extrair informações do edital ou configure cada detalhe manualmente.
        </p>
      </header>

      {/* Mode Switcher */}
      <div className="flex bg-slate-900/40 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl shadow-xl">
        <button
          onClick={() => setActiveTab('ai')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all",
            activeTab === 'ai' ? "bg-white text-slate-950 shadow-lg" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Sparkles className="w-4 h-4 cursor-default" />
          Extração por IA
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all",
            activeTab === 'manual' ? "bg-white text-slate-950 shadow-lg" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Wand2 className="w-4 h-4 cursor-default" />
          Configuração Manual
        </button>
      </div>

      <div className="space-y-8">
        {/* Meta Section */}
        <section className="bg-white border border-border p-8 md:p-10 rounded-2xl space-y-8 shadow-sm transition-all hover:border-primary/20">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold text-text-sub uppercase tracking-wider">Metas e Cronograma</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Horas por Dia</label>
              <input 
                type="number" 
                inputMode="decimal"
                className="w-full bg-slate-50 border border-border rounded-2xl p-5 text-sm text-text-main outline-none focus:border-primary/50 transition-all font-bold"
                value={dailyHours}
                onChange={(e) => setDailyHours(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Questões por Dia</label>
              <input 
                type="number" 
                inputMode="numeric"
                className="w-full bg-slate-50 border border-border rounded-2xl p-5 text-sm text-text-main outline-none focus:border-primary/50 transition-all font-bold"
                value={dailyQuestions}
                onChange={(e) => setDailyQuestions(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Data da Prova</label>
              <input 
                type="date" 
                className="w-full bg-slate-50 border border-border rounded-2xl p-5 text-sm text-text-main outline-none focus:border-primary/50 transition-all font-bold"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-6">
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className={cn(
                "w-6 h-6 rounded-lg border transition-all flex items-center justify-center",
                autoSchedule ? "bg-primary border-primary text-white" : "border-border bg-slate-50"
              )}>
                {autoSchedule && <CheckCircle2 className="w-4 h-4" />}
              </div>
              <input type="checkbox" className="hidden" checked={autoSchedule} onChange={(e) => setAutoSchedule(e.target.checked)} />
              <div>
                <span className="block text-xs font-bold text-text-main group-hover:text-primary transition-colors uppercase tracking-wider">Gerar Cronograma Automático</span>
              </div>
            </label>

            {autoSchedule && (
              <div className="flex bg-slate-100 p-1 rounded-xl border border-border">
                {[2, 4, 8, 12].map((w) => (
                  <button
                    key={w}
                    onClick={() => setScheduleWeeks(w)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                      scheduleWeeks === w 
                        ? "bg-white text-text-main shadow-sm" 
                        : "text-text-sub hover:text-text-main"
                    )}
                  >
                    {w} Sem.
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {activeTab === 'ai' ? (
          <section className="bg-white border border-border p-8 md:p-10 rounded-2xl space-y-10 animate-in slide-in-from-bottom-5 duration-500 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                  <Sparkles className="w-7 h-7" />
                 </div>
                <div className="space-y-0.5">
                  <h2 className="text-2xl font-display text-text-main tracking-tight">Análise de Edital</h2>
                  <p className="text-xs font-bold text-text-sub uppercase tracking-wider">Processamento automático do seu documento</p>
                </div>
              </div>

              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="application/pdf" className="hidden" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={extractingPdf}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl text-sm font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-md"
              >
                {extractingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Importar Edital (PDF)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Instituição do Concurso</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-border rounded-2xl p-5 text-sm text-text-main focus:border-primary/50 outline-none transition-all placeholder:text-slate-400"
                  value={manualContestName}
                  onChange={(e) => setManualContestName(e.target.value)}
                  placeholder="Ex: Tribunal de Justiça"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Cargo Desejado</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-border rounded-2xl p-5 text-sm text-text-main focus:border-primary/50 outline-none transition-all placeholder:text-slate-400"
                  value={manualRole}
                  onChange={(e) => setManualRole(e.target.value)}
                  placeholder="Ex: Técnico Judiciário"
                />
              </div>
            </div>

            <div className="space-y-3 relative">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Conteúdo Programático</label>
                {rawText && (
                  <button onClick={() => setRawText('')} className="text-red-500 text-xs font-bold uppercase tracking-wider hover:brightness-125 transition-all">Limpar Tudo</button>
                )}
              </div>
              <textarea
                className="w-full h-80 bg-slate-50 border border-border rounded-[2rem] p-6 text-sm text-text-main focus:border-primary/50 transition-all outline-none resize-none leading-relaxed custom-scrollbar placeholder:text-slate-400"
                placeholder="Cole o texto do conteúdo programático aqui ou importe um PDF para extração automática..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <AnimatePresence>
                {extractingPdf && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md rounded-[2rem] flex flex-col items-center justify-center gap-6 z-20">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <div className="text-center">
                      <p className="text-sm font-bold text-white uppercase tracking-wider">Processando Documento</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Extraindo metadados e disciplinas...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        ) : (
          <section className="bg-white border border-border p-8 md:p-10 rounded-2xl space-y-12 animate-in slide-in-from-bottom-5 duration-500 shadow-sm transition-all hover:border-primary/20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent shadow-sm">
                <Wand2 className="w-7 h-7" />
               </div>
              <div className="space-y-0.5">
                <h2 className="text-2xl font-display text-text-main tracking-tight">Organização do Edital</h2>
                <p className="text-xs font-bold text-text-sub uppercase tracking-wider">Controle total sobre as disciplinas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Concurso</label>
                <input type="text" className="w-full bg-slate-50 border border-border rounded-2xl p-5 text-sm text-text-main focus:border-primary/50 outline-none transition-all placeholder:text-slate-400" value={manualContestName} onChange={(e) => setManualContestName(e.target.value)} placeholder="Ex: Receita Federal" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Cargo</label>
                <input type="text" className="w-full bg-slate-50 border border-border rounded-2xl p-5 text-sm text-text-main focus:border-primary/50 outline-none transition-all placeholder:text-slate-400" value={manualRole} onChange={(e) => setManualRole(e.target.value)} placeholder="Ex: Auditor" />
              </div>
            </div>

            <div className="space-y-8">
              {manualSubjects.map((sub, sIdx) => (
                <div key={sub.id} className="p-8 border border-border rounded-3xl bg-slate-50/50 space-y-8 relative group hover:border-primary/20 transition-all shadow-sm">
                  <button 
                    onClick={() => removeManualSubject(sub.id)}
                    className="absolute top-6 right-6 p-2.5 text-text-sub hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Matéria</label>
                      <input 
                        type="text" 
                        className="w-full bg-white border border-border rounded-xl p-4 text-xs font-bold text-text-main outline-none focus:border-primary/50"
                        value={sub.name}
                        onChange={(e) => updateManualSubject(sub.id, { name: e.target.value })}
                        placeholder="Ex: Direito Administrativo"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Categoria</label>
                      <select 
                        className="w-full bg-white border border-border rounded-xl p-4 text-xs font-bold text-text-main outline-none cursor-pointer focus:border-primary/50 appearance-none"
                        value={sub.category}
                        onChange={(e) => updateManualSubject(sub.id, { category: e.target.value as any })}
                      >
                        <option value="Gerais">Gerais</option>
                        <option value="Específicos">Específicos</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Incidência</label>
                      <select 
                        className="w-full bg-white border border-border rounded-xl p-4 text-xs font-bold text-text-main outline-none cursor-pointer focus:border-primary/50 appearance-none"
                        value={sub.incidence}
                        onChange={(e) => updateManualSubject(sub.id, { incidence: e.target.value as any })}
                      >
                        <option value="Muito Alta">Muito Alta</option>
                        <option value="Alta">Alta</option>
                        <option value="Média">Média</option>
                        <option value="Baixa">Baixa</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <h4 className="text-xs font-bold text-text-sub uppercase tracking-wider">Tópicos do Edital</h4>
                      <button onClick={() => addManualTopic(sub.id)} className="text-primary text-xs font-bold hover:scale-105 flex items-center gap-2 transition-all">
                        <Plus className="w-3 h-3" /> ADICIONAR TÓPICO
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sub.topics?.map((topic) => (
                        <div key={topic.id} className="flex gap-2 items-center group/topic">
                          <input 
                            type="text" 
                            className="flex-1 bg-white border border-border rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-primary/50 transition-all placeholder:text-slate-400 font-medium"
                            value={topic.name}
                            onChange={(e) => updateManualTopic(sub.id, topic.id, e.target.value)}
                            placeholder="Ex: Atos Administrativos"
                          />
                          <button onClick={() => removeManualTopic(sub.id, topic.id)} className="p-2.5 text-text-sub hover:text-red-500 opacity-60 group-hover/topic:opacity-100 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <button 
                onClick={addManualSubject}
                className="w-full py-8 border-2 border-dashed border-border rounded-3xl text-text-sub font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-4 hover:border-primary/50 hover:text-primary hover:bg-white transition-all group"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                Nova Disciplina
              </button>
            </div>
          </section>
        )}

        {/* Global Action Buttons */}
        <div className="space-y-6 pt-4">
          {error && (
            <div className="flex items-center gap-3 p-5 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-bold uppercase tracking-wider animate-in shake duration-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-5 bg-accent/10 border border-accent/20 text-accent rounded-2xl text-sm font-bold uppercase tracking-wider animate-in zoom-in duration-300">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Plano configurado com sucesso! Redirecionando...</span>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={loading || (activeTab === 'ai' && !rawText.trim()) || (activeTab === 'manual' && !manualContestName)}
            className={cn(
              "w-full py-6 rounded-2xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-4 transition-all shadow-sm relative overflow-hidden group",
              loading || (activeTab === 'ai' && !rawText.trim()) || (activeTab === 'manual' && !manualContestName)
                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                : "bg-text-main text-white hover:scale-[1.01] active:scale-[0.99] hover:shadow-md"
            )}
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                {activeTab === 'ai' ? 'Ativar Análise' : 'Ativar Planejamento Manual'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
