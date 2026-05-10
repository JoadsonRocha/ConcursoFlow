import React, { useState, useRef } from 'react';
import { BrainCircuit, Upload, Sparkles, AlertCircle, CheckCircle2, Calendar, FileText, Loader2 } from 'lucide-react';
import { parseEdital, generateSchedule } from '../services/gemini';
import { Contest } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import * as pdfjs from 'pdfjs-dist';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface SettingsProps {
  onImport: (contest: Contest) => void;
  onDelete: (id: string) => void;
  contests: Contest[];
  currentContest: Contest | null;
}

export default function Settings({ onImport, onDelete, contests, currentContest }: SettingsProps) {
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

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      
      // Limit to first 20 pages to avoid performance issues if it's a massive document
      // Usually the syllabus (conteúdo programático) is within the first 20 pages or near the end.
      // But let's try to get all if it's reasonable.
      const numPages = Math.min(pdf.numPages, 50); 
      
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
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
    if (!rawText.trim()) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const parsed = await parseEdital(rawText);
      let schedule = undefined;

      if (autoSchedule) {
        const subjectsSummary = (parsed as Contest).subjects.map(s => 
          `${s.name} (${s.category}): ${s.topics?.map(t => t.name).join(', ')}`
        ).join('\n');
        schedule = await generateSchedule(subjectsSummary, scheduleWeeks * 7);
      }

      const dynamicContest: Contest = {
        ...parsed as Contest,
        name: manualContestName || (parsed as Contest).name || 'Novo Concurso',
        role: manualRole || (parsed as Contest).role || 'Cargo não especificado',
        id: `dynamic-${Date.now()}`,
        examDate: examDate,
        dailyGoalHours: dailyHours,
        dailyGoalQuestions: dailyQuestions,
        schedule: schedule,
      };
      
      onImport(dynamicContest);
      setSuccess(true);
      setRawText('');
      setManualContestName('');
      setManualRole('');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar o edital.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="space-y-1.5 overflow-hidden">
        <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em] leading-none mb-2">Engenharia de Aprovação</div>
        <h1 className="text-4xl md:text-6xl font-display leading-[0.9] text-text-main tracking-tighter">
          Importar <span className="italic text-primary">Edital</span> com IA.
        </h1>
        <p className="text-text-sub text-sm font-medium pt-2">Transforme conteúdo bruto em um ecossistema de estudos de alta performance.</p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <section className="bg-white border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-text-main uppercase tracking-wider">Metas Diárias</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-sub mb-2 uppercase tracking-widest">HORAS DE ESTUDO / DIA</label>
              <input 
                type="number" 
                inputMode="decimal"
                className="w-full bg-gray-50 border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-primary/10 dark:bg-card-bg transition-all"
                value={dailyHours}
                onChange={(e) => setDailyHours(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-sub mb-2 uppercase tracking-widest">NÚMERO DE QUESTÕES / DIA</label>
              <input 
                type="number" 
                inputMode="numeric"
                className="w-full bg-gray-50 border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-primary/10 dark:bg-card-bg transition-all"
                value={dailyQuestions}
                onChange={(e) => setDailyQuestions(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-sub mb-2 uppercase tracking-widest">DATA DA PROVA</label>
              <input 
                type="date" 
                className="w-full bg-gray-50 border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-primary/10 dark:bg-card-bg"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
            <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={cn(
                "w-5 h-5 rounded border flex items-center justify-center transition-all",
                autoSchedule ? "bg-primary border-primary text-white" : "border-border bg-gray-50 dark:bg-card-bg"
              )}>
                {autoSchedule && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={autoSchedule}
                onChange={(e) => setAutoSchedule(e.target.checked)}
              />
              <div>
                <span className="block text-xs font-bold text-text-main group-hover:text-primary transition-colors">Gerar Cronograma IA</span>
                <span className="block text-[10px] text-text-sub">Cria um plano de estudos automaticamente</span>
              </div>
            </label>
          </div>

          {autoSchedule && (
            <div className="pl-8 space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="block text-[10px] font-bold text-text-sub uppercase tracking-widest">Duração desejada:</span>
              <div className="flex flex-wrap gap-2">
                {[2, 4, 8, 12].map((w) => (
                  <button
                    key={w}
                    onClick={() => setScheduleWeeks(w)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                      scheduleWeeks === w 
                        ? "bg-primary border-primary text-white shadow-md shadow-primary/20" 
                        : "bg-white dark:bg-card-bg border-border text-text-sub hover:border-primary/50"
                    )}
                  >
                    {w} Semanas
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>

    <div className="grid grid-cols-1 gap-6">
      <section className="bg-white border border-border rounded-2xl p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main">Gerador de Edital Verticalizado</h2>
              <p className="text-text-sub text-sm">Use PDF ou cole o texto para que a IA organize seus estudos.</p>
            </div>
          </div>
          
          <div className="hidden md:block">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="application/pdf"
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={extractingPdf}
              className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 hover:border-primary/50 text-text-main text-xs font-black uppercase tracking-widest rounded-2xl transition-all border border-border shadow-sm group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                {extractingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span>{extractingPdf ? 'Processando...' : 'Importar PDF'}</span>
                <span className="text-[8px] opacity-50 tracking-tighter normal-case">Extrator IA</span>
              </div>
            </button>
          </div>
        </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-sub uppercase tracking-widest">Instituição / Concurso</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-primary/10 transition-all"
                  value={manualContestName}
                  onChange={(e) => setManualContestName(e.target.value)}
                  placeholder="Ex: Polícia Federal, Receita Federal..."
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-sub uppercase tracking-widest">Cargo Desejado</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-primary/10 transition-all"
                  value={manualRole}
                  onChange={(e) => setManualRole(e.target.value)}
                  placeholder="Ex: Agente, Auditor, Técnico..."
                />
              </div>
            </div>

            <div className="md:hidden w-full">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="application/pdf"
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={extractingPdf}
                className="w-full flex flex-col items-center justify-center gap-2 px-4 py-8 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:border-primary/50 text-text-main rounded-[2rem] transition-all border-2 border-dashed border-border group"
              >
                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  {extractingPdf ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <FileText className="w-6 h-6 text-primary" />}
                </div>
                <div className="text-center">
                  <div className="text-xs font-black uppercase tracking-widest">{extractingPdf ? 'Lendo Arquivo...' : 'Selecionar Edital em PDF'}</div>
                  <div className="text-[10px] text-text-sub mt-1">A IA identificará as matérias automaticamente</div>
                </div>
              </button>
            </div>

            <div className="space-y-2 relative">
              <label className="block text-xs font-bold text-text-sub uppercase tracking-widest flex justify-between">
                <span>Conteúdo Programático (Edital)</span>
                {rawText && (
                  <button 
                    onClick={() => setRawText('')}
                    className="text-red-500 hover:underline lowercase tracking-normal font-medium"
                  >
                    limpar texto
                  </button>
                )}
              </label>
              <textarea
                className="w-full h-80 bg-gray-50 border border-border rounded-xl p-4 text-sm font-medium focus:ring-2 ring-primary/10 transition-all outline-none resize-none"
                placeholder="Cole aqui o texto do edital ou importe o PDF acima para que a IA identifique as matérias e organize seus estudos..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <AnimatePresence>
                {extractingPdf && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-x-0 bottom-0 top-[28px] bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center gap-3"
                  >
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <div className="text-[10px] font-black text-text-main uppercase tracking-widest">Extraindo bits de inteligência do edital...</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm animate-in shake duration-300">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-100 text-green-600 rounded-xl text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Edital importado com sucesso! O novo cargo já está disponível no menu superior.</span>
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={loading || !rawText.trim()}
              className={cn(
                "w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20",
                loading || !rawText.trim() ? "bg-gray-300 cursor-not-allowed" : "bg-primary hover:bg-primary-dark"
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <BrainCircuit className="w-5 h-5" />
                  Processar e Importar com IA
                </>
              )}
            </button>
          </div>
        </section>

        <section className="bg-dark-panel p-8 rounded-2xl text-white space-y-4">
          <h3 className="font-bold">Como Funciona?</h3>
          <ul className="space-y-3 text-sm opacity-80 list-disc pl-5">
            <li>A IA identifica as matérias e os tópicos automaticamente.</li>
            <li>Define a incidência baseada em padrões de concursos similares.</li>
            <li>Gera as métricas iniciais para você começar a estudar IMEDIATAMENTE.</li>
            <li>Você pode trocar entre os editais importados no cabeçalho do app.</li>
          </ul>
          
          <div className="pt-6 border-t border-white/10">
          </div>
        </section>
      </div>
    </div>
  );
}
