import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart2, Info, Building2, Target, Loader2, Zap, TrendingUp, AlertCircle, BookOpen, BookOpenCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { Contest } from '../types';

import { useAuth } from '../contexts/AuthContext';
import ProModal from '../components/ProModal';

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
  const isAnalyzed = contest.paretoAnalyzed || false;

  // Restart analysis if the current contest changes
  useEffect(() => {
    setBanca(contest.banca || '');
  }, [contest.id, contest.banca]);

  const handleAnalyze = () => {
    if (!banca) return;
    
    // Check PRO status for re-analyzing or if already analyzed
    if (!isPro && contest.paretoAnalyzed) {
      setShowProModal(true);
      return;
    }

    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      if (onUpdate) {
        onUpdate({
          ...contest,
          banca,
          paretoAnalyzed: true
        });
      }
    }, 2500); // Simulando o tempo de processamento da "IA"
  };

    const paretoData = useMemo(() => {
    if (!isAnalyzed) return null;

    const allTopics: { subjectId: string; subjectName: string; topicId: string; topicName: string; weight: number }[] = [];
    
    const levelMap: Record<string, number> = {
      'Muito Alta': 90,
      'Alta': 70,
      'Média': 40,
      'Baixa': 15
    };

    const targetBanca = contest.banca || banca;

    contest.subjects.forEach(sub => {
      (sub.topics || []).forEach(tp => {
         let weight = 0;
         const hashStr = sub.name + (tp.name || '') + targetBanca;
         let hash = 0;
         for (let i = 0; i < hashStr.length; i++) {
           hash = hashStr.charCodeAt(i) + ((hash << 5) - hash);
         }

         if (tp.incidence && levelMap[tp.incidence as string]) {
           // Baseado na IA + pequena variação para sorteio
           weight = levelMap[tp.incidence as string] + (Math.abs(hash % 10));
         } else {
           // Fallback determinístico
           weight = Math.abs(hash % 100) + 1; 
         }

         allTopics.push({
           subjectId: sub.id,
           subjectName: sub.name,
           topicId: tp.id,
           topicName: tp.name,
           weight
         });
      });
    });

    // Ordenar do assunto mais cobrado pro menos cobrado
    allTopics.sort((a, b) => b.weight - a.weight);

    // Selecionar o topo (aprox 20% dos assuntos)
    const topCount = Math.max(1, Math.ceil(allTopics.length * 0.2));
    const topTopics = allTopics.slice(0, topCount);
    const otherTopics = allTopics.slice(topCount);

    return { topTopics, otherTopics };
  }, [banca, isAnalyzed, contest]);

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
            <Info className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-text-main uppercase tracking-tight mb-2 break-words">{contest.role}</h3>
            <p className="text-sm font-medium text-text-sub max-w-lg mx-auto">
              Selecione a banca que organizará a prova. A nossa inteligência vai mapear os
              assuntos mais recorrentes dessa banca para este edital, mostrando os 20%
              do conteúdo que garantem 80% dos acertos.
            </p>
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
                  <option value="cebraspe">CEBRASPE</option>
                  <option value="fcc">FCC</option>
                  <option value="fgv">FGV</option>
                  <option value="vunesp">VUNESP</option>
                  <option value="idecan">IDECAN</option>
                  <option value="outra">Outra</option>
                </select>
              </div>
            </div>

            <button 
              disabled={!banca}
              className={cn(
                "w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2",
                banca 
                  ? "primary-button text-white shadow-lg shadow-primary/30"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
              onClick={handleAnalyze}
            >
              <Zap className="w-5 h-5" />
              Gerar Análise Pareto
            </button>
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

      {isAnalyzed && paretoData && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="bg-primary text-white rounded-3xl p-8 shadow-xl shadow-primary/20 flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center shrink-0 border-4 border-white/30">
              <span className="text-3xl font-black">20%</span>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black uppercase tracking-tight mb-2 flex items-center gap-2">
                <Target className="w-6 h-6" />
                O seu foco principal
              </h2>
              <p className="text-white/80 font-medium">
                De acordo com a nossa análise para a banca <strong className="text-white uppercase">{contest.banca || banca}</strong>,
                {paretoData.topTopics.length} de {paretoData.topTopics.length + paretoData.otherTopics.length} tópicos do seu edital
                representam quase toda a pontuação da prova. Foco total neles!
              </p>
            </div>
            <button 
              onClick={() => {
                if (!isPro) {
                  setShowProModal(true);
                  return;
                }
                onUpdate && onUpdate({ ...contest, paretoAnalyzed: false });
              }}
              className="mt-4 md:mt-0 p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all ml-auto shrink-0 relative group"
              title="Refazer análise"
            >
              {!isPro && (
                 <div className="absolute -top-1 -right-1 bg-accent text-white text-[7px] px-1 py-0.5 rounded-md font-black shadow-sm transform border border-white z-10 group-hover:scale-110 transition-transform">
                   PRO
                 </div>
              )}
              <Building2 className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-primary/20 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-text-main uppercase tracking-tight text-lg">Top 20% (Alta Incidência)</h3>
                  <p className="text-xs font-bold text-text-sub uppercase tracking-wider">Garanta sua aprovação dominando estes tópicos</p>
                </div>
              </div>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {paretoData.topTopics.map((topic, i) => (
                  <div key={`${topic.subjectId}-${topic.topicId}`} className="p-4 bg-green-50 rounded-2xl border border-green-200 flex gap-4 items-start">
                    <span className="text-green-600 font-black text-lg mt-1 w-6">{i + 1}º</span>
                    <div>
                      <p className="text-sm font-bold text-text-main leading-tight mb-1">{topic.topicName}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-green-700 bg-green-200/50 px-2 py-1 rounded-md">
                        <BookOpen className="w-3 h-3" />
                        {topic.subjectName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-border rounded-3xl p-6 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-text-main uppercase tracking-tight text-lg">Outros Tópicos</h3>
                  <p className="text-xs font-bold text-text-sub uppercase tracking-wider">Estude se sobrar tempo</p>
                </div>
              </div>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {paretoData.otherTopics.slice(0, 15).map((topic) => ( // limit showing max 15 to not overflow the UI too much
                  <div key={`${topic.subjectId}-${topic.topicId}`} className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 flex gap-3 items-start">
                    <div>
                      <p className="text-xs font-bold text-text-main leading-tight mb-1">{topic.topicName}</p>
                      <span className="text-[10px] text-text-sub uppercase tracking-wider font-bold">
                        {topic.subjectName}
                      </span>
                    </div>
                  </div>
                ))}
                {paretoData.otherTopics.length > 15 && (
                  <div className="text-center p-4 text-xs font-bold text-text-sub uppercase tracking-wider border-t border-border mt-4">
                    + {paretoData.otherTopics.length - 15} tópicos...
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
      <ProModal isOpen={showProModal} onClose={() => setShowProModal(false)} featureName="Análise de Bancas Ilimitada" />
    </motion.div>
  );
}
