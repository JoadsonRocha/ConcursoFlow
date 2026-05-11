import React, { useState, useRef } from 'react';
import { BrainCircuit, Upload, Sparkles, AlertCircle, CheckCircle2, Calendar, FileText, Loader2, Plus, Trash2, Save, Wand2 } from 'lucide-react';
import { parseEdital, generateSchedule } from '../services/gemini';
import { Contest, Subject } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import * as pdfjs from 'pdfjs-dist';

// Configure worker - Use a more stable CDN link
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="space-y-1.5 overflow-hidden text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-2 text-primary font-black text-xs uppercase tracking-[0.3em] leading-none mb-2">Engenharia de Aprovação</div>
        <h1 className="text-4xl md:text-6xl font-display leading-[0.9] text-text-main tracking-tighter">
          Configurar meu <span className="italic text-primary">Plano</span>.
        </h1>
        <p className="text-text-sub text-sm font-medium pt-2">Escolha entre a automação total da IA ou o controle cirúrgico manual.</p>
      </header>

      {/* Mode Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-900 border border-border p-1.5 rounded-[2rem] shadow-inner mb-6">
        <button
          onClick={() => setActiveTab('ai')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'ai' ? "bg-white dark:bg-slate-800 text-primary shadow-lg" : "text-text-sub hover:text-text-main"
          )}
        >
          <Sparkles className="w-4 h-4" />
          Extrator IA
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'manual' ? "bg-white dark:bg-slate-800 text-primary shadow-lg" : "text-text-sub hover:text-text-main"
          )}
        >
          <Wand2 className="w-4 h-4" />
          Cadastro Manual
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Meta Section - Common to both modes */}
        <section className="bg-white dark:bg-slate-900 border border-border rounded-[2.5rem] p-8 space-y-6 shadow-sm">
          <h2 className="text-xs font-black text-text-sub uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Metas & Cronograma
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-sub mb-2 uppercase tracking-widest leading-none">Horas / Dia</label>
              <input 
                type="number" 
                inputMode="decimal"
                className="w-full bg-gray-50 dark:bg-slate-800/50 border border-border rounded-xl p-4 text-sm outline-none focus:ring-2 ring-primary/10 transition-all font-bold"
                value={dailyHours}
                onChange={(e) => setDailyHours(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-sub mb-2 uppercase tracking-widest leading-none">Questões / Dia</label>
              <input 
                type="number" 
                inputMode="numeric"
                className="w-full bg-gray-50 dark:bg-slate-800/50 border border-border rounded-xl p-4 text-sm outline-none focus:ring-2 ring-primary/10 transition-all font-bold"
                value={dailyQuestions}
                onChange={(e) => setDailyQuestions(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-sub mb-2 uppercase tracking-widest leading-none">Data da Prova</label>
              <input 
                type="date" 
                className="w-full bg-gray-50 dark:bg-slate-800/50 border border-border rounded-xl p-4 text-sm outline-none focus:ring-2 ring-primary/10 transition-all font-bold"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={cn(
                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                autoSchedule ? "bg-primary border-primary text-white" : "border-border bg-gray-50 dark:bg-slate-800"
              )}>
                {autoSchedule && <CheckCircle2 className="w-4 h-4" />}
              </div>
              <input type="checkbox" className="hidden" checked={autoSchedule} onChange={(e) => setAutoSchedule(e.target.checked)} />
              <div>
                <span className="block text-xs font-black text-text-main group-hover:text-primary transition-colors uppercase tracking-widest">Auto-Cronograma IA</span>
                <span className="block text-[10px] text-text-sub font-medium">Distribuir matérias no tempo disponível</span>
              </div>
            </label>

            {autoSchedule && (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-border">
                {[2, 4, 8, 12].map((w) => (
                  <button
                    key={w}
                    onClick={() => setScheduleWeeks(w)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      scheduleWeeks === w 
                        ? "bg-white dark:bg-slate-700 text-primary shadow-sm" 
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
          /* AI EXTRACTOR TAB */
          <section className="bg-white dark:bg-slate-900 border border-border rounded-[2.5rem] p-8 space-y-6 shadow-sm animate-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold">
                  <Sparkles className="w-7 h-7" />
                 </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-display text-text-main leading-none">Extrator Estratégico</h2>
                  <p className="text-text-sub text-sm font-medium">A IA lê o edital e organiza tudo.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="application/pdf" className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={extractingPdf}
                  className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-slate-50 dark:bg-slate-800 border border-border rounded-2xl text-xs font-black uppercase tracking-widest hover:border-primary/50 transition-all font-bold"
                >
                  {extractingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Importar PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-sub uppercase tracking-widest">Instituição</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 dark:bg-slate-800/50 border border-border rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 ring-primary/10 transition-all"
                  value={manualContestName}
                  onChange={(e) => setManualContestName(e.target.value)}
                  placeholder="Ex: Concurso Nacional Unificado"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-sub uppercase tracking-widest">Cargo</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 dark:bg-slate-800/50 border border-border rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 ring-primary/10 transition-all"
                  value={manualRole}
                  onChange={(e) => setManualRole(e.target.value)}
                  placeholder="Ex: Auditor Fiscal"
                />
              </div>
            </div>

            <div className="space-y-2 relative">
              <div className="flex justify-between items-end mb-2">
                <label className="block text-xs font-bold text-text-sub uppercase tracking-widest">Conteúdo do Edital</label>
                {rawText && (
                  <button onClick={() => setRawText('')} className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline">limpar</button>
                )}
              </div>
              <textarea
                className="w-full h-80 bg-gray-50 dark:bg-slate-800/50 border border-border rounded-2xl p-6 text-sm font-medium focus:ring-2 ring-primary/10 transition-all outline-none resize-none"
                placeholder="Cole o texto do conteúdo programático aqui..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <AnimatePresence>
                {extractingPdf && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-xs font-black text-text-main uppercase tracking-widest text-center px-10">Processando Inteligência Artificial no Documento...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        ) : (
          /* MANUAL ENTRY TAB */
          <section className="bg-white dark:bg-slate-900 border border-border rounded-[2.5rem] p-8 space-y-8 shadow-sm animate-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
                <Wand2 className="w-7 h-7" />
               </div>
              <div className="space-y-1">
                <h2 className="text-xl font-display text-text-main leading-none">Cadastro Verticalizado Manual</h2>
                <p className="text-text-sub text-sm font-medium">Controle total sobre cada matéria e tópico.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-sub uppercase tracking-widest leading-none">Instituição / Concurso</label>
                <input type="text" className="w-full bg-gray-50 dark:bg-slate-800/50 border border-border rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 ring-primary/10 transition-all" value={manualContestName} onChange={(e) => setManualContestName(e.target.value)} placeholder="Ex: Polícia Federal" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-sub uppercase tracking-widest leading-none">Cargo Desejado</label>
                <input type="text" className="w-full bg-gray-50 dark:bg-slate-800/50 border border-border rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 ring-primary/10 transition-all" value={manualRole} onChange={(e) => setManualRole(e.target.value)} placeholder="Ex: Agente" />
              </div>
            </div>

            <div className="space-y-6">
              {manualSubjects.map((sub, sIdx) => (
                <div key={sub.id} className="p-6 border border-border rounded-[2rem] bg-slate-50 dark:bg-slate-800/30 space-y-6 relative group">
                  <button 
                    onClick={() => removeManualSubject(sub.id)}
                    className="absolute top-4 right-4 p-2 text-text-sub hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-text-sub uppercase tracking-widest leading-none">Materia</label>
                      <input 
                        type="text" 
                        className="w-full bg-white dark:bg-slate-800 border border-border rounded-xl p-3 text-sm font-bold outline-none focus:border-primary/50"
                        value={sub.name}
                        onChange={(e) => updateManualSubject(sub.id, { name: e.target.value })}
                        placeholder="Ex: Português"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-text-sub uppercase tracking-widest leading-none">Categoria</label>
                      <select 
                        className="w-full bg-white dark:bg-slate-800 border border-border rounded-xl p-3 text-sm font-bold outline-none cursor-pointer"
                        value={sub.category}
                        onChange={(e) => updateManualSubject(sub.id, { category: e.target.value as any })}
                      >
                        <option value="Gerais">Gerais</option>
                        <option value="Específicos">Específicos</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-text-sub uppercase tracking-widest leading-none">Incidência</label>
                      <select 
                        className="w-full bg-white dark:bg-slate-800 border border-border rounded-xl p-3 text-sm font-bold outline-none cursor-pointer"
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

                  <div className="space-y-3">
                    <div className="text-xs font-black text-text-sub uppercase tracking-widest flex items-center justify-between">
                      Tópicos do Edital
                      <button onClick={() => addManualTopic(sub.id)} className="text-primary hover:underline flex items-center gap-1 font-bold">
                        <Plus className="w-3 h-3" /> Adicionar Tópico
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sub.topics?.map((topic) => (
                        <div key={topic.id} className="flex gap-2 items-center">
                          <input 
                            type="text" 
                            className="flex-1 bg-white dark:bg-slate-800 border border-border rounded-xl px-4 py-2 text-xs font-medium outline-none focus:border-primary/50 transition-all font-bold"
                            value={topic.name}
                            onChange={(e) => updateManualTopic(sub.id, topic.id, e.target.value)}
                            placeholder="Ex: Concordância Nominal"
                          />
                          <button onClick={() => removeManualTopic(sub.id, topic.id)} className="p-2 text-text-sub hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <button 
                onClick={addManualSubject}
                className="w-full py-6 border-2 border-dashed border-border rounded-[2rem] text-text-sub font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:border-primary/50 hover:text-primary transition-all group"
              >
                <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4" />
                </div>
                Adicionar Nova Matéria
              </button>
            </div>
          </section>
        )}

        {/* Global Action Buttons */}
        <div className="space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-5 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold animate-in shake duration-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-5 bg-green-50 border border-green-100 text-green-600 rounded-2xl text-xs font-bold animate-in zoom-in duration-300">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Plano configurado com sucesso! Redirecionando para o painel...</span>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={loading || (activeTab === 'ai' && !rawText.trim()) || (activeTab === 'manual' && !manualContestName)}
            className={cn(
              "w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 transition-all shadow-2xl transition-all",
              loading || (activeTab === 'ai' && !rawText.trim()) || (activeTab === 'manual' && !manualContestName)
                ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                : "bg-primary text-white hover:scale-[1.02] active:scale-95 shadow-primary/30"
            )}
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                {activeTab === 'ai' ? 'Finalizar Importação IA' : 'Salvar Plano Manual'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
