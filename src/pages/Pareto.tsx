import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart2, 
  Info, 
  Building2, 
  Target, 
  Loader2, 
  Zap, 
  TrendingUp, 
  AlertCircle, 
  BookOpen, 
  BookOpenCheck,
  Lightbulb,
  Star,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Contest } from '../types';

import { useAuth } from '../contexts/AuthContext';
import ProModal from '../components/ProModal';
import { generateParetoAnalysis, parseEdital } from '../services/gemini';
import { toast } from 'sonner';

interface ParetoProps {
  contest: Contest;
  contests?: Contest[];
  onContestChange?: (contest: Contest) => void;
  onUpdate?: (contest: Contest) => void;
}

export default function Pareto({ contest, contests = [], onContestChange, onUpdate }: ParetoProps) {
  const { profile, isPro } = useAuth();
  const [showProModal, setShowProModal] = useState(false);
  const [banca, setBanca] = useState(contest.banca || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showManualImport, setShowManualImport] = useState(false);
  const [manualText, setManualText] = useState('');
  const [isEditingManual, setIsEditingManual] = useState(false);
  const isAnalyzed = contest.paretoAnalyzed || false;

  // Restart analysis if the current contest changes
  useEffect(() => {
    setBanca(contest.banca || '');
  }, [contest.id, contest.banca]);

  const handleAnalyze = async (isHighPerformance: boolean = false) => {
    if (!banca) return;
    
    // Check PRO status for FIRST analysis and re-analyzing
    if (!isPro) {
      setShowProModal(true);
      return;
    }

    setIsAnalyzing(true);
    try {
      // Defensive check to avoid circular structure error if an event was passed
      const highPerf = typeof isHighPerformance === 'boolean' ? isHighPerformance : false;
      const result = await generateParetoAnalysis(contest.role, banca, contest.subjects, highPerf);
      
      if (onUpdate) {
        onUpdate({
          ...contest,
          banca,
          paretoAnalyzed: true,
          paretoData: result
        });
      }
      toast.success(isHighPerformance ? "Análise de ELITE concluída!" : "Análise estratégica concluída com sucesso!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao processar análise da banca.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processedData = useMemo(() => {
    if (!isAnalyzed || !contest?.paretoData || !contest?.subjects) return null;

    const subjects = contest.subjects || [];

    const normalize = (s: string) => s?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9]/g, "") // Remove symbols
      .trim();

    const allTopics: { 
      subjectId: string; 
      subjectName: string; 
      topicId: string; 
      topicName: string; 
      score: number;
      label: string;
      isGolden?: boolean;
      insight?: string;
    }[] = [];

    const paretoSubjects = contest.paretoData.subjects || [];

    paretoSubjects.forEach(aiSub => {
      // Robust matching: Try ID first, then Normalized Name
      const aiSubNorm = normalize(aiSub.name || "");
      const realSub = subjects.find(s => s.id === aiSub.id) || 
                      subjects.find(s => normalize(s.name) === aiSubNorm);
      
      if (!realSub) return;

      const topics = aiSub.topics || [];

      topics.forEach(aiTp => {
        // Robust matching: Try ID first, then Normalized Name
        const aiTpNorm = normalize(aiTp.name || "");
        const realTp = realSub.topics?.find(t => t.id === aiTp.id) ||
                       realSub.topics?.find(t => normalize(t.name) === aiTpNorm);
        
        if (!realTp) return;

        allTopics.push({
          subjectId: realSub.id,
          subjectName: realSub.name,
          topicId: realTp.id,
          topicName: realTp.name,
          score: aiTp.incidenceScore || 0,
          label: aiTp.priorityLabel || 'BÁSICA',
          isGolden: aiSub.goldenPoint === realTp.name,
          insight: aiSub.strategicInsight
        });
      });
    });

    // Sort by score
    allTopics.sort((a, b) => b.score - a.score);

    const topTopics = allTopics.filter(t => t.score >= 70);
    const otherTopics = allTopics.filter(t => t.score < 70);

    return { 
      topTopics, 
      otherTopics,
      insightsBySubject: paretoSubjects.reduce((acc, s) => {
        const sNorm = normalize(s.name || "");
        const realSub = subjects.find(rs => rs.id === s.id) || 
                        subjects.find(rs => normalize(rs.name) === sNorm);
        
        if (realSub) acc[realSub.name] = s.strategicInsight || 'Priorize os tópicos mais recorrentes.';
        return acc;
      }, {} as Record<string, string>) || {}
    };
  }, [isAnalyzed, contest]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-text-main uppercase tracking-tight flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-primary" />
            Análise de Pareto (Por Banca)
          </h1>
          <p className="text-xs font-bold text-text-sub uppercase tracking-wider">
            Otimize seu estudo focando no que a banca realmente cobra.
          </p>
        </div>
        
        {contests.length > 1 && onContestChange && (
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-text-sub" />
            <select
              className="bg-white border border-border rounded-xl px-4 py-2 text-sm font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-8 relative uppercase tracking-wider max-w-[200px] md:max-w-xs truncate"
              value={contest.id}
              onChange={(e) => {
                const selected = contests.find(c => c.id === e.target.value);
                if (selected) onContestChange(selected);
              }}
            >
              {contests.map(c => (
                <option key={c.id} value={c.id}>{c.role}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!isAnalyzed && !isAnalyzing && (
        <div className="bg-white rounded-3xl p-8 border border-border shadow-sm flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
            <BarChart2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-text-main uppercase tracking-tight mb-2 break-words">{contest.role}</h3>
            {(!contest.subjects || contest.subjects.length === 0) ? (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700 text-sm font-medium">
                  Parece que este edital não possui disciplinas cadastradas. 
                  Você pode importar do texto abaixo ou ir em Configurações.
                </div>
                
                <div className="w-full max-w-lg mx-auto space-y-3">
                  <button 
                    onClick={() => setShowManualImport(!showManualImport)}
                    className="text-xs font-bold text-primary uppercase tracking-widest hover:underline"
                  >
                    {showManualImport ? "Cancelar Importação Rápida" : "Colar disciplinas para análise rápida"}
                  </button>
                  
                  {showManualImport && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                      <textarea 
                        className="w-full h-32 bg-slate-50 border border-border rounded-xl p-3 text-xs outline-none focus:border-primary transition-all resize-none"
                        placeholder="Cole aqui as disciplinas e tópicos do edital..."
                        value={manualText}
                        onChange={(e) => setManualText(e.target.value)}
                      />
                      <button
                        onClick={async () => {
                          if (!manualText.trim() || !banca) {
                            toast.error("Preencha o texto e selecione a banca.");
                            return;
                          }
                          setIsAnalyzing(true);
                          try {
                            // First parse subjects from text
                            toast.info("Processando disciplinas do edital...");
                            const parseResult = await parseEdital(manualText);
                            const newSubjects = parseResult.subjects || [];
                            
                            // Then analyze Pareto
                            toast.info("Calculando incidência para a banca...");
                            const result = await generateParetoAnalysis(contest.role, banca, newSubjects);
                            
                            if (onUpdate) {
                              onUpdate({
                                ...contest,
                                subjects: newSubjects,
                                banca,
                                paretoAnalyzed: true,
                                paretoData: result
                              });
                            }
                            toast.success("Análise manual concluída!");
                          } catch (e: any) {
                            toast.error(e.message || "Erro na análise.");
                          } finally {
                            setIsAnalyzing(false);
                          }
                        }}
                        className="w-full py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md"
                      >
                        Analisar Texto Enviado
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm font-medium text-text-sub max-w-lg mx-auto">
                Selecione a banca que organizará a prova. A nossa inteligência vai mapear os
                assuntos mais recorrentes dessa banca para este edital, mostrando os 20%
                do conteúdo que garantem 80% dos acertos.
              </p>
            )}
          </div>

          <div className="w-full max-w-md pt-6 border-t border-border flex flex-col gap-4">
            <div className="flex flex-col gap-2 text-left">
              <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Selecione a Banca</label>
              <div className="relative">
                <Building2 className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all appearance-none"
                  value={banca}
                  onChange={(e) => setBanca(e.target.value)}
                >
                  <option value="">Escolha uma banca...</option>
                  <option value="cebraspe">CEBRASPE (CESPE)</option>
                  <option value="fgv">FGV</option>
                  <option value="fcc">FCC</option>
                  <option value="vunesp">VUNESP</option>
                  <option value="cesgranrio">Cesgranrio</option>
                  <option value="idecan">IDECAN</option>
                  <option value="iades">IADES</option>
                  <option value="aocp">AOCP / Instituto AOCP</option>
                  <option value="quadrix">Quadrix</option>
                  <option value="ibfc">IBFC</option>
                  <option value="fundatec">Fundatec</option>
                  <option value="ibest">Ibest</option>
                  <option value="selecon">Selecon</option>
                  <option value="consulplan">Consulplan</option>
                  <option value="fepese">FEPESE</option>
                  <option value="ibgp">IBGP</option>
                  <option value="legalle">Legalle</option>
                  <option value="outra">Outra</option>
                </select>
              </div>
            </div>

            <button 
              disabled={!banca || !contest.subjects || contest.subjects.length === 0}
              className={cn(
                "w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2",
                (banca && contest.subjects && contest.subjects.length > 0)
                  ? "primary-button text-white shadow-lg shadow-primary/30"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
              onClick={() => handleAnalyze(false)}
            >
              <Zap className="w-5 h-5" />
              Gerar Análise Pareto IA
            </button>

            {contest.subjects && contest.subjects.length > 0 && (
              <button 
                className="w-full py-3 bg-white border border-border text-text-sub rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-primary transition-all"
                onClick={() => {
                  const initialParetoData = {
                    subjects: contest.subjects.map(s => ({
                      id: s.id,
                      name: s.name,
                      strategicInsight: 'Ajuste os pesos manualmente.',
                      goldenPoint: s.topics?.[0]?.name || '',
                      topics: s.topics?.map(t => ({
                        id: t.id,
                        name: t.name,
                        incidenceScore: 50,
                        priorityLabel: 'MÉDIA'
                      })) || []
                    }))
                  };
                  if (onUpdate) {
                    onUpdate({
                      ...contest,
                      banca: banca || 'Manual',
                      paretoAnalyzed: true,
                      paretoData: initialParetoData as any
                    });
                  }
                  setIsEditingManual(true);
                }}
              >
                Configurar Pesos Manualmente
              </button>
            )}
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="bg-white rounded-3xl p-12 border border-border shadow-sm flex flex-col items-center justify-center text-center space-y-6">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <div>
            <h3 className="text-lg font-black text-text-main uppercase tracking-tight">Cruzando Dados da Banca...</h3>
            <p className="text-sm font-medium text-text-sub animate-pulse">Buscando histórico de provas e incidência de tópicos.</p>
          </div>
        </div>
      )}

      {isAnalyzed && !processedData && !isAnalyzing && (
        <div className="bg-white rounded-3xl p-12 border border-border shadow-sm flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-2">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-black text-text-main uppercase tracking-tight mb-2">Erro nos Dados da Análise</h4>
            <p className="text-sm font-medium text-text-sub max-w-sm mx-auto">
              Não conseguimos cruzar os dados da análise com as disciplinas atuais deste edital. 
              Isso pode acontecer em editais antigos ou importados da comunidade.
            </p>
          </div>
          <button 
            onClick={() => onUpdate && onUpdate({ ...contest, paretoAnalyzed: false, paretoData: null })}
            className="px-8 py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
          >
            Resetar e Re-analisar Agora
          </button>
        </div>
      )}

      {isAnalyzed && processedData && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Main Hero Summary */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 md:p-7 relative overflow-hidden shadow-xl transition-all border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent"></div>
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Sparkles className="w-24 h-24 md:w-32 md:h-32" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <div className="w-14 h-14 md:w-18 md:h-18 rounded-full bg-primary/20 border-4 border-primary/30 flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
              <div className="text-center md:text-left space-y-1 my-1 md:my-0">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-0.5">
                  <span className="px-2 py-0.5 bg-primary/20 rounded-full text-[9px] font-black uppercase tracking-widest text-primary border border-primary/20">Análise Inteligente</span>
                </div>
                <h2 className="text-lg md:text-2xl font-display font-bold uppercase tracking-tight">
                  Sua Estratégia <span className="text-primary italic">{contest.banca || banca}</span>
                </h2>
                <p className="text-slate-400 font-semibold max-w-xl text-xs md:text-sm leading-relaxed">
                  Compilamos {processedData.topTopics.length} tópicos críticos que historicamente decidem a aprovação neste concurso. 
                  Focar neles agora é a sua maior vantagem competitiva.
                </p>
              </div>
              
              <div className="md:ml-auto shrink-0 flex flex-col gap-2 w-full md:w-auto">
                <button 
                  onClick={() => handleAnalyze(true)}
                  disabled={isAnalyzing}
                  className="px-5 py-2.5 bg-primary text-white border border-primary/20 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-widest active:scale-95 group shadow-lg shadow-primary/20"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white group-hover:rotate-12 transition-transform" />
                  Performance Elite (Refinar)
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onUpdate && onUpdate({ ...contest, paretoAnalyzed: false })}
                    className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400"
                  >
                    <Building2 className="w-3 h-3" />
                    Trocar Banca
                  </button>
                  <button 
                    onClick={() => setIsEditingManual(!isEditingManual)}
                    className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400"
                  >
                    <BookOpen className="w-3 h-3" />
                    {isEditingManual ? 'Salvar' : 'Editar'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isEditingManual && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-border p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-main uppercase tracking-widest">Edição Manual do Pareto</h3>
                <button onClick={() => setIsEditingManual(false)} className="text-[10px] font-bold text-text-sub hover:text-primary uppercase">Fechar</button>
              </div>
              <p className="text-[10px] text-text-sub uppercase font-medium">Ajuste a pontuação (0-100) de cada disciplina para priorizar manualmente.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contest.subjects.map(subject => (
                  <div key={subject.id} className="p-3 bg-slate-50 border border-border rounded-xl space-y-2">
                    <h4 className="text-[11px] font-bold text-text-main truncate">{subject.name}</h4>
                    <div className="flex items-center gap-2">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        className="flex-1 accent-primary"
                        value={contest.paretoData?.subjects?.find(s => s.id === subject.id || s.name === subject.name)?.topics?.[0]?.incidenceScore || 50}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!onUpdate) return;
                          
                          const newParetoData = { ...(contest.paretoData || { subjects: [] }) };
                          if (!newParetoData.subjects) newParetoData.subjects = [];
                          
                          let subData = newParetoData.subjects.find(s => s.id === subject.id || s.name === subject.name);
                          if (!subData) {
                            subData = { id: subject.id, name: subject.name, topics: [], goldenPoint: '', strategicInsight: 'Prioridade definida manualmente.' };
                            newParetoData.subjects.push(subData);
                          }
                          
                          // Simplify for manual: treat the whole subject or first topic as the weight
                          if (!subData.topics || subData.topics.length === 0) {
                            subData.topics = subject.topics?.map(t => ({ id: t.id, name: t.name, incidenceScore: val, priorityLabel: val > 70 ? 'ALTA' : 'MÉDIA' })) || [];
                          } else {
                            subData.topics = subData.topics.map(t => ({ ...t, incidenceScore: val, priorityLabel: val > 70 ? 'ALTA' : 'MÉDIA' }));
                          }
                          
                          onUpdate({ ...contest, paretoData: newParetoData });
                        }}
                      />
                      <span className="text-[10px] font-bold text-primary w-8">{contest.paretoData?.subjects?.find(s => s.id === subject.id || s.name === subject.name)?.topics?.[0]?.incidenceScore || 50}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Top Topics */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                  <h3 className="text-xs font-black text-text-sub uppercase tracking-[0.2em]">Assuntos de Alta Performance</h3>
                </div>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md uppercase tracking-wider">
                  Incidência {'>'} 70%
                </span>
              </div>

              {processedData.topTopics.length === 0 && processedData.otherTopics.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-border rounded-3xl p-12 text-center space-y-4">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                      <Target className="w-8 h-8 text-slate-300" />
                   </div>
                   <div>
                      <h4 className="text-lg font-bold text-text-main">Nenhum dado estatístico disponível</h4>
                      <p className="text-sm text-text-sub max-w-md mx-auto">
                        Não conseguimos mapear a incidência para os tópicos deste concurso. Tente gerar a análise novamente ou revise os nomes das disciplinas.
                      </p>
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {processedData.topTopics.map((topic, i) => (
                  <motion.div 
                    key={`${topic.subjectId}-${topic.topicId}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "rise-card p-5 border-2 rounded-2xl flex flex-col gap-3 relative transition-all group",
                      topic.isGolden 
                        ? "border-amber-400 shadow-amber-400/5 bg-amber-50/10" 
                        : "border-emerald-100 bg-emerald-50/10 hover:border-emerald-400"
                    )}
                  >
                     {topic.isGolden && (
                       <div className="absolute -top-3 -right-2 bg-amber-400 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-tighter border-2 border-white">
                         <Star className="w-3 h-3 fill-white" /> Ponto de Ouro
                       </div>
                     )}
                     
                     <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-text-sub uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">
                         {topic.subjectName}
                       </span>
                       <div className="flex items-center gap-1.5">
                         <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                           <div 
                             className={cn("h-full transition-all duration-1000", topic.score > 85 ? "bg-amber-500" : "bg-emerald-500")}
                             style={{ width: `${topic.score}%` }}
                           />
                         </div>
                         <span className="text-[10px] font-bold text-text-sub">{topic.score}%</span>
                       </div>
                     </div>

                     <h4 className="text-sm font-bold text-text-main leading-snug group-hover:text-primary transition-colors">
                       {topic.topicName}
                     </h4>

                     <div className="mt-auto pt-3 border-t border-slate-100/50 flex items-center justify-between">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest",
                          topic.score > 85 ? "text-amber-600" : "text-emerald-600"
                        )}>
                          {topic.label}
                        </span>
                        <ChevronRight className="w-3 h-3 text-text-sub group-hover:translate-x-1 transition-transform" />
                     </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

            {/* Right Column: Strategic Insights */}
            <div className="lg:col-span-1 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h3 className="text-xs font-black text-text-sub uppercase tracking-[0.2em]">Insights da Mentoria IA</h3>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(processedData.insightsBySubject).map(([subject, insight], idx) => (
                    <motion.div 
                      key={subject}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-5 bg-white border border-border rounded-2xl space-y-2.5 relative overflow-hidden group shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
                      <h5 className="text-[10px] font-black text-primary uppercase tracking-widest relative z-10">{subject}</h5>
                      <p className="text-[12px] font-medium text-text-sub leading-relaxed relative z-10 italic">
                        "{insight}"
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Others Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1 pt-4">
                  <AlertCircle className="w-5 h-5 text-slate-400" />
                  <h3 className="text-xs font-black text-text-sub uppercase tracking-[0.2em]">Baixa Incidência</h3>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5">
                   <p className="text-[10px] font-bold text-text-sub uppercase tracking-wider mb-4 leading-relaxed">
                     Estes tópicos possuem baixo histórico de cobrança. Recomendamos estudá-los apenas após dominar o Top 20%.
                   </p>
                   <div className="space-y-2">
                     {processedData.otherTopics.slice(0, 5).map((topic) => (
                       <div key={topic.topicId} className="flex items-center gap-2 text-[11px] font-medium text-slate-500 py-1.5 border-b border-slate-200/50 last:border-0 truncate">
                         <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                         <span className="truncate">{topic.topicName}</span>
                       </div>
                     ))}
                     {processedData.otherTopics.length > 5 && (
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest pt-2">
                         + {processedData.otherTopics.length - 5} tópicos secundários
                       </div>
                     )}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      <ProModal isOpen={showProModal} onClose={() => setShowProModal(false)} featureName="Análise de Bancas Ilimitada" />
    </motion.div>
  );
}
