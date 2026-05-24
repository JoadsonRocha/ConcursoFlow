import React, { useState } from 'react';
import { BrainCircuit, Upload, AlertCircle, CheckCircle2, Calendar, FileText, Loader2, Plus, Trash2, Save, Wand2, Target, Settings as SettingsIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { parseEdital, generateSchedule } from '../services/gemini';
import { Contest, Subject } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import * as pdfjs from 'pdfjs-dist';
import { useAuth } from '../contexts/AuthContext';
import ProModal from '../components/ProModal';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

// Configure worker
const PDFJS_VERSION = '5.7.284';
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

interface SettingsProps {
  onImport: (contest: Contest) => void;
  contests: Contest[];
}

export default function Settings({ onImport, contests }: SettingsProps) {
  const { profile, updateProfile, isPro } = useAuth();
  const navigate = useNavigate();
  const [showProModal, setShowProModal] = useState(false);
  const [proFeatureName, setProFeatureName] = useState('');
  
  const [stage, setStage] = useState<'import' | 'metas'>('import');
  const [contestData, setContestData] = useState<(Partial<Contest> & { rawTextForAnalysis?: string }) | null>(null);

  const [wizardStep, setWizardStep] = useState(0);

  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [rawText, setRawText] = useState('');
  const [manualContestName, setManualContestName] = useState('');
  const [manualRole, setManualRole] = useState('');
  const [dailyHours, setDailyHours] = useState<number | ''>(2);
  const [dailyQuestions, setDailyQuestions] = useState<number | ''>(20);
  const [dailyContentVolume, setDailyContentVolume] = useState<number | ''>(1);
  const [scheduleStartDate, setScheduleStartDate] = useState('');
  const [examDate, setExamDate] = useState('2026-06-27');
  const [autoSchedule, setAutoSchedule] = useState(true);
  const [scheduleWeeks, setScheduleWeeks] = useState(4);
  const [loading, setLoading] = useState(false);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
      toast.success("Texto extraído com sucesso! Verifique os dados e ative seu plano.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao extrair texto do PDF.");
    } finally {
      setExtractingPdf(false);
    }
  };

  const handleEditalImport = async () => {
    if (!manualContestName || !manualRole) {
      setError("Instituição do concurso e cargo são obrigatórios.");
      return;
    }
    
    /* Bypass manual check for import as requested */
    
    setLoading(true);
    setError(null);

    try {
      let contestData: Partial<Contest> & { rawTextForAnalysis?: string } = {
        name: manualContestName,
        role: manualRole
      };
      
      const contestsRef = collection(db, 'shared_contests');
      const snapshot = await getDocs(contestsRef);
      const sharedContests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contest));
      
      const foundMatch = sharedContests.find(c => 
        c.role.toLowerCase() === manualRole.toLowerCase()
      );

      if (foundMatch) {
         toast.success("Edital encontrado na comunidade!");
         contestData.subjects = foundMatch.subjects;
      } else {
         if (!rawText.trim()) {
            throw new Error("Edital não encontrado na comunidade. Por favor, importe ou cole o conteúdo do edital.");
         }
         // Store partial data for later AI analysis
         contestData.rawTextForAnalysis = rawText;
      }
      
      setContestData(contestData);
      setStage('metas');
      toast.success("Informações básicas salvas! Agora configure suas metas.");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erro ao validar edital.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSave = async () => {
     if (!contestData) return;

     setLoading(true);
     try {
       let finalContestData = { ...contestData };

       // Perform AI analysis only if subjects aren't already populated
       if (!finalContestData.subjects && finalContestData.rawTextForAnalysis) {
          toast.info("Analisando o edital com IA...");
          const parsed = await parseEdital(finalContestData.rawTextForAnalysis);
          finalContestData = { ...finalContestData, ...parsed };
       }

       let schedule = undefined;
       if (autoSchedule && finalContestData.subjects) {
         const subjectsSummary = finalContestData.subjects.map(s => 
           `${s.name} (${s.category}): ${s.topics?.map(t => t.name).join(', ')}`
         ).join('\n');
         schedule = await generateSchedule(subjectsSummary, scheduleWeeks * 7);
       }

       const dynamicContest: Contest = {
         ...finalContestData,
         name: manualContestName || finalContestData.name || 'Novo Concurso',
         role: manualRole || finalContestData.role || 'Cargo não especificado',
         subjects: finalContestData.subjects || [],
         id: `dynamic-${Date.now()}`,
         examDate: examDate,
         dailyGoalHours: Number(dailyHours) || 0,
         dailyGoalQuestions: Number(dailyQuestions) || 0,
         dailyContentVolume: Number(dailyContentVolume) || 1,
         scheduleStartDate: scheduleStartDate || null,
         schedule: schedule,
       };
       
       await onImport(dynamicContest);
       
       // Update usage if not PRO - MOVED TO SERVER

       setRawText('');
       setManualContestName('');
       setManualRole('');
       setStage('import');
       setWizardStep(0);
       toast.success("Edital importado com sucesso! Redirecionando para seu cronograma...");
       // Trigger navigation to subjects
       navigate('/cronograma');
     } catch (err) {
       console.error(err);
       setError(err instanceof Error ? err.message : "Erro ao salvar metas.");
     } finally {
       setLoading(false);
     }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-3 animate-in fade-in duration-500 pb-4">
      <header className="flex flex-row items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-3xl font-display text-text-main tracking-tight font-bold">
            Importar Edital
          </h1>
          <p className="text-text-sub text-[10px] md:text-xs">
            Configure seu plano rapidamente.
          </p>
        </div>
        <Link 
          to="/comunidade" 
          className="text-[10px] uppercase font-bold text-text-sub hover:text-primary transition-all whitespace-nowrap"
        >
          Buscar na Comunidade
        </Link>
      </header>

      {/* Mode Switcher */}
          <div className="flex bg-slate-900/5 !mb-0 border border-border p-1.5 rounded-[1.5rem] shadow-sm max-w-md">
        <button
          onClick={() => { setActiveTab('ai'); setRawText(''); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all relative group",
            activeTab === 'ai' ? "bg-white text-primary shadow-sm" : "text-text-sub hover:text-text-main"
          )}
        >
          {!isPro && (
             <div className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[7px] px-1 py-0.5 rounded-md font-black shadow-sm transform border border-white z-10 group-hover:scale-110 transition-transform">
               PRO
             </div>
          )}
          <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 cursor-default" />
          Importar PDF (IA)
        </button>
        <button
          onClick={() => { setActiveTab('manual'); setRawText(''); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all",
            activeTab === 'manual' ? "bg-white text-primary shadow-sm" : "text-text-sub hover:text-text-main"
          )}
        >
          <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 cursor-default" />
          Colar Texto
        </button>
      </div>
      
      <div className="space-y-3 mt-3">
          {stage === 'import' && (
            <>
              <section className="bg-white border border-border p-3 rounded-xl space-y-2 animate-in slide-in-from-bottom-5 duration-500 shadow-sm">
                {activeTab === 'manual' && (
                  <>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center text-primary shadow-sm">
                          <Target className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <h2 className="text-base font-display text-text-main tracking-tight font-bold">Importação Manual</h2>
                          <p className="text-[9px] font-bold text-text-sub uppercase tracking-widest">Detalhes do concurso e conteúdo</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-text-sub uppercase tracking-wider ml-1">Instituição <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-border rounded-lg p-2 text-xs text-text-main focus:border-primary/50 outline-none transition-all placeholder:text-slate-400"
                          value={manualContestName}
                          onChange={(e) => setManualContestName(e.target.value)}
                          placeholder="Ex: Tribunal de Justiça"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text-sub uppercase tracking-wider ml-1">Cargo <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-border rounded-lg p-2.5 text-xs text-text-main focus:border-primary/50 outline-none transition-all placeholder:text-slate-400"
                          value={manualRole}
                          onChange={(e) => setManualRole(e.target.value)}
                          placeholder="Ex: Técnico Judiciário"
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border">
                      <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className={cn(
                            "w-4 h-4 rounded-md border transition-all flex items-center justify-center shrink-0",
                            autoSchedule ? "bg-primary border-primary text-white" : "border-border bg-slate-50"
                          )}>
                            {autoSchedule && <CheckCircle2 className="w-3 h-3" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={autoSchedule} onChange={(e) => setAutoSchedule(e.target.checked)} />
                          <span className="text-xs font-bold text-text-main group-hover:text-primary transition-colors uppercase tracking-wider">Gerar Cronograma Automático</span>
                        </label>

                        {autoSchedule && (
                          <div className="flex flex-wrap bg-slate-100 p-0.5 rounded-xl border border-border w-full">
                            {[2, 4, 8, 12].map((w) => (
                              <button
                                key={w}
                                onClick={() => setScheduleWeeks(w)}
                                className={cn(
                                  "px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex-1 text-center",
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
                    </div>

                    <div className="space-y-1.5 pt-4 border-t border-border">
                      <div className="flex justify-between items-center">
                        <h3 className="text-[10px] font-bold text-text-main mt-1">Conteúdo Programático</h3>
                        {rawText && (
                          <button onClick={() => setRawText('')} className="text-red-500 text-[9px] font-bold uppercase tracking-wider hover:brightness-125 transition-all">Limpar</button>
                        )}
                      </div>
                      <textarea
                        className="w-full h-24 bg-slate-50 border border-border rounded-lg p-2 text-[10px] text-text-main focus:border-primary/50 transition-all outline-none resize-none leading-relaxed custom-scrollbar placeholder:text-slate-400"
                        placeholder="Cole o edital aqui..."
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {activeTab === 'ai' && (
                  <>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-center text-accent shadow-sm">
                          <Wand2 className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <h2 className="text-base font-display text-text-main tracking-tight font-bold">Importar Edital com IA</h2>
                          <p className="text-[9px] font-bold text-text-sub uppercase tracking-widest">Processamento automático via PDF</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="application/pdf" className="hidden" />
                      <button 
                        onClick={() => {
                          if (!isPro) {
                            setProFeatureName('Importação de Edital via PDF');
                            setShowProModal(true);
                            return;
                          }
                          fileInputRef.current?.click();
                        }}
                        disabled={extractingPdf}
                        className={cn(
                          "w-full flex items-center justify-center gap-3 py-3 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg relative group",
                          extractingPdf ? "bg-slate-500 cursor-not-allowed opacity-80" : "bg-gradient-to-r from-primary to-accent hover:scale-[1.02]"
                        )}
                      >
                        {!isPro && (
                           <div className="absolute top-1 right-2 bg-accent text-white text-[8px] px-1.5 py-0.5 rounded-md font-black shadow-sm transform border border-white z-10 group-hover:scale-110 transition-transform">
                             PRO
                           </div>
                        )}
                        {extractingPdf ? (
                          <>
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                            <span>Processando PDF...</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-5 h-5" />
                            <span>{rawText ? 'PDF Carregado! Importar Outro' : 'Importar PDF'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-text-sub uppercase tracking-wider ml-1">Instituição <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-border rounded-lg p-2 text-xs text-text-main focus:border-primary/50 outline-none transition-all placeholder:text-slate-400"
                          value={manualContestName}
                          onChange={(e) => setManualContestName(e.target.value)}
                          placeholder="Ex: Tribunal de Justiça"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text-sub uppercase tracking-wider ml-1">Cargo <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-border rounded-lg p-2.5 text-xs text-text-main focus:border-primary/50 outline-none transition-all placeholder:text-slate-400"
                          value={manualRole}
                          onChange={(e) => setManualRole(e.target.value)}
                          placeholder="Ex: Técnico Judiciário"
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border">
                      <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className={cn(
                            "w-4 h-4 rounded-md border transition-all flex items-center justify-center shrink-0",
                            autoSchedule ? "bg-primary border-primary text-white" : "border-border bg-slate-50"
                          )}>
                            {autoSchedule && <CheckCircle2 className="w-3 h-3" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={autoSchedule} onChange={(e) => setAutoSchedule(e.target.checked)} />
                          <span className="text-xs font-bold text-text-main group-hover:text-primary transition-colors uppercase tracking-wider">Gerar Cronograma Automático</span>
                        </label>

                        {autoSchedule && (
                          <div className="flex flex-wrap bg-slate-100 p-0.5 rounded-xl border border-border w-full">
                            {[2, 4, 8, 12].map((w) => (
                              <button
                                key={w}
                                onClick={() => setScheduleWeeks(w)}
                                className={cn(
                                  "px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex-1 text-center",
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
                    </div>
                  </>
                )}
              </section>

              <div className="pt-3">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold uppercase tracking-wider animate-in shake duration-300 mb-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <button
                  onClick={handleEditalImport}
                  disabled={loading || (activeTab === 'manual' && (!manualContestName || !manualRole)) || (activeTab === 'ai' && !rawText)}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-sm relative overflow-hidden group",
                    loading || (activeTab === 'manual' && (!manualContestName || !manualRole)) || (activeTab === 'ai' && !rawText)
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                      : "bg-text-main text-white hover:scale-[1.01] active:scale-[0.99] hover:shadow-md"
                  )}
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {activeTab === 'ai' ? 'Próximo Passo' : 'Buscar / Extrair do Documento'}
                    </>
                  )}
                </button>
                {contestData && (
                  <button
                    onClick={() => setStage('metas')}
                    className="w-full mt-3 py-4 rounded-xl bg-primary text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99] hover:shadow-md"
                  >
                    Continuar para Metas
                  </button>
                )}
              </div>
            </>
          )}

          {stage === 'metas' && (
            <section className="bg-white border border-border p-4 rounded-xl space-y-4 shadow-sm transition-all hover:border-primary/20 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h2 className="text-xs font-bold text-text-sub uppercase tracking-wider">
                    {wizardStep === 0 ? 'Intensidade dos Estudos' : 'Cronograma e Datas'}
                  </h2>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                  Passo {wizardStep + 1} de 2
                </span>
              </div>
              
              <div className="min-h-[100px]">
                {wizardStep === 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in duration-300">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-text-sub uppercase tracking-wider ml-1">Horas por Dia</label>
                      <input 
                        type="number" 
                        className="w-full bg-slate-50 border border-border rounded-lg p-2.5 text-xs text-text-main outline-none focus:border-primary/50 transition-all font-bold"
                        value={dailyHours}
                        onChange={(e) => setDailyHours(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-text-sub uppercase tracking-wider ml-1">Questões por Dia</label>
                      <input 
                        type="number" 
                        className="w-full bg-slate-50 border border-border rounded-lg p-2.5 text-xs text-text-main outline-none focus:border-primary/50 transition-all font-bold"
                        value={dailyQuestions}
                        onChange={(e) => setDailyQuestions(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-text-sub uppercase tracking-wider ml-1">Conteúdo por Dia</label>
                      <input 
                        type="number" 
                        className="w-full bg-slate-50 border border-border rounded-lg p-2.5 text-xs text-text-main outline-none focus:border-primary/50 transition-all font-bold"
                        value={dailyContentVolume}
                        onChange={(e) => setDailyContentVolume(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Ex: 1"
                      />
                    </div>
                  </div>
                )}

                {wizardStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in duration-300">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-text-sub uppercase tracking-wider ml-1">Data Início</label>
                      <input 
                        type="date" 
                        className="w-full bg-slate-50 border border-border rounded-lg p-2.5 text-xs text-text-main outline-none focus:border-primary/50 transition-all font-bold"
                        value={scheduleStartDate}
                        onChange={(e) => setScheduleStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-text-sub uppercase tracking-wider ml-1">Data da Prova</label>
                      <input 
                        type="date" 
                        className="w-full bg-slate-50 border border-border rounded-lg p-2.5 text-xs text-text-main outline-none focus:border-primary/50 transition-all font-bold"
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                {wizardStep > 0 && (
                  <button 
                    onClick={() => setWizardStep(prev => prev - 1)}
                    className="flex-1 py-2.5 rounded-xl border border-border font-bold text-text-sub hover:bg-slate-50 transition-all text-[10px] uppercase tracking-wider"
                  >
                    Voltar
                  </button>
                )}
                {wizardStep < 1 ? (
                  <button 
                    onClick={() => setWizardStep(prev => prev + 1)}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all text-[10px] uppercase tracking-wider"
                  >
                    Próximo Passo
                  </button>
                ) : (
                  <button 
                    onClick={handleFinalSave}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-text-main text-white font-bold hover:bg-text-main/90 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all text-[10px] uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Aguarde...
                      </>
                    ) : (
                      "Analisar e Prosseguir"
                    )}
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      <ProModal isOpen={showProModal} onClose={() => setShowProModal(false)} featureName={proFeatureName} />
    </div>
);
}
