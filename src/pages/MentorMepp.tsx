import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, 
  Sparkles, 
  AlertTriangle, 
  Bell, 
  CheckSquare, 
  Square, 
  Brain, 
  Plus, 
  Trash2, 
  Timer,
  BookOpen,
  ArrowLeft,
  BookOpenCheck,
  CalendarDays
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Contest } from '../types';
import { useContestStats } from '../hooks/useContestStats';
import { cn } from '../lib/utils';

interface MentorMeppProps {
  contest: Contest;
  onUpdate: (contest: Contest) => void;
}

const MentorMepp: React.FC<MentorMeppProps> = ({ contest, onUpdate }) => {
  const [showMeppExplainer, setShowMeppExplainer] = useState(false);
  const [selectedSubjectNameReview, setSelectedSubjectNameReview] = useState('');
  const [selectedTopicNameReview, setSelectedTopicNameReview] = useState('');
  const [isManualSchedulerOpen, setIsManualSchedulerOpen] = useState(false);

  const stats = useContestStats(contest);
  const { todayTask } = stats;

  /**
   * Helper para obter a data atual formatada como ISO (YYYY-MM-DD)
   * tratando problemas de fuso horário.
   */
  const getTodayISOString = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const todayStrStr = getTodayISOString();

  /**
   * Obtém as etapas concluídas (checklist) para o tópico da meta de hoje.
   */
  const currentTopicName = todayTask ? (todayTask.specificTopic || todayTask.generalTopic || "Estudo do Dia") : "";
  const currentMeppStages = contest?.meppReviews?.find(r => r.topicName === currentTopicName && r.reviewType !== 'completed')?.stagesCompleted || [];

  /**
   * Lógica Principal: Alternar etapas do checklist diário (MEPP).
   * Se for a primeira etapa marcada, cria um novo "Ciclo de Revisão" para este tópico.
   * Se todas as etapas (Teoria, Recall, Prática, Erros) forem marcadas, 
   * o sistema valida automaticamente o dia no Cronograma.
   */
  const handleToggleMeppStage = async (stageKey: string) => {
    if (!contest || !todayTask) {
       toast.error("Para usar o checklist diário MEPP, garanta que você tem uma meta de estudos para hoje!");
       return;
    }

    const reviews = contest.meppReviews ? [...contest.meppReviews] : [];
    const topicName = todayTask.specificTopic || todayTask.generalTopic || "Estudo do Dia";
    const subjectName = contest.subjects.find(sub => 
      sub.topics?.some(t => t.name === todayTask.specificTopic)
    )?.name || "Geral";

    const existingReviewIdx = reviews.findIndex(r => r.topicName === topicName && r.reviewType !== 'completed');
    
    let updatedStages: string[] = [];
    if (existingReviewIdx === -1) {
      // Cria o registro MEPP caso não exista ("Lazy Initialization")
      updatedStages = [stageKey];
      const newReviewItem = {
        id: `mepp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        topicName,
        subjectName,
        createdAt: new Date().toISOString(),
        stagesCompleted: updatedStages,
        dueDate: todayStrStr,
        reviewType: '24h' as const
      };
      reviews.push(newReviewItem);
    } else {
      const stages = reviews[existingReviewIdx].stagesCompleted || [];
      updatedStages = stages.includes(stageKey) 
        ? stages.filter(s => s !== stageKey) 
        : [...stages, stageKey];
      
      reviews[existingReviewIdx] = {
        ...reviews[existingReviewIdx],
        stagesCompleted: updatedStages
      };
    }

    // SINCRONIZAÇÃO COM CRONOGRAMA: Se as 4 etapas principais forem concluídas,
    // marca a tarefa do cronograma de hoje como feita.
    const coreStages = ['theory', 'recall', 'practice', 'errors'];
    const allDone = coreStages.every(s => updatedStages.includes(s));
    
    let newSchedule = contest.schedule;
    if (allDone && todayTask && !todayTask.completed) {
      newSchedule = contest.schedule?.map(day => {
        if (day.id === todayTask.id) {
          return { ...day, completed: true };
        }
        return day;
      });
      toast.success("Parabéns! Você completou todas as etapas do dia. Meta do cronograma validada! 🏆");
    }

    onUpdate({
      ...contest,
      meppReviews: reviews,
      schedule: newSchedule
    });

    toast.success("Progresso do Ciclo Diário MEPP atualizado! 🚀");
  };

  /**
   * Agenda manualmente uma Revisão Ativa para um tópico escolhido.
   * Útil quando o usuário quer revisar algo que não está na meta de hoje.
   */
  const handleScheduleCustomReview = async () => {
    if (!selectedTopicNameReview) {
      toast.error("Por favor, selecione um tópico para agendar a revisão ativa!");
      return;
    }

    const reviews = contest?.meppReviews ? [...contest.meppReviews] : [];
    
    const alreadyExists = reviews.some(r => r.topicName === selectedTopicNameReview && r.reviewType !== 'completed');
    if (alreadyExists) {
      toast.warning("Já existe uma revisão ativa agendada para este tópico!");
      return;
    }

    const newReviewItem = {
      id: `mepp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      topicName: selectedTopicNameReview,
      subjectName: selectedSubjectNameReview || "Geral",
      createdAt: new Date().toISOString(),
      stagesCompleted: ['theory'], 
      dueDate: todayStrStr,
      reviewType: '24h' as const
    };

    onUpdate({
      ...contest,
      meppReviews: [...reviews, newReviewItem]
    });

    toast.success(`Ciclo de Revisão Ativa MEPP agendado para "${selectedTopicNameReview}"! Pratique amanhã (24h).`);
    setSelectedTopicNameReview('');
    setSelectedSubjectNameReview('');
  };

  /**
   * Lógica do Algoritmo de Repetição Espaçada:
   * 24h -> 7d -> 30d -> Concluído.
   */
  const handleCompleteActiveReviewStep = async (reviewId: string) => {
    if (!contest) return;

    const reviews = contest.meppReviews ? [...contest.meppReviews] : [];
    const idx = reviews.findIndex(r => r.id === reviewId);
    if (idx === -1) return;

    const review = reviews[idx];
    let nextType = review.reviewType;
    let daysToAdd = 0;

    if (review.reviewType === '24h') {
      nextType = '7d';
      daysToAdd = 6; 
    } else if (review.reviewType === '7d') {
      nextType = '30d';
      daysToAdd = 23; 
    } else if (review.reviewType === '30d') {
      nextType = 'completed';
    }

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + daysToAdd);
    const splitDateStr = nextDueDate.toISOString().split('T')[0];

    reviews[idx] = {
      ...review,
      reviewType: nextType,
      dueDate: nextType === 'completed' ? review.dueDate : splitDateStr,
      ...(nextType === 'completed' ? { completedAt: new Date().toISOString() } : {}),
      stagesCompleted: nextType === 'completed' 
        ? [...(review.stagesCompleted || []), 'review'] 
        : review.stagesCompleted
    };

    // SINCRONIZAÇÃO: Se marcar como feito algo que é a meta de hoje, valida no cronograma.
    let newSchedule = contest.schedule;
    if (todayTask && !todayTask.completed) {
       const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
       if (norm(review.topicName) === norm(todayTask.specificTopic || '') || 
           norm(review.topicName) === norm(todayTask.generalTopic || '')) {
          newSchedule = contest.schedule?.map(day => {
            if (day.id === todayTask.id) return { ...day, completed: true };
            return day;
          });
          toast.success("Meta do cronograma também validada por associação de tópico! 🚀");
       }
    }

    onUpdate({
      ...contest,
      meppReviews: reviews,
      schedule: newSchedule
    });

    if (nextType === 'completed') {
      toast.success("Parabéns! Ciclo MEPP completo concluído com maestria! Fixado de vez na memória de longo prazo. 🎯");
    } else {
      toast.success(`Recuperação ativa concluída! Próxima revisão (${nextType}) agendada para ${nextDueDate.toLocaleDateString('pt-BR')}.`);
    }
  };

  const handleCompleteAllDueReviews = async () => {
    if (!contest) return;

    const reviews = contest.meppReviews ? [...contest.meppReviews] : [];
    
    // Mark all overdue and pending reviews as completed
    const updatedReviews = reviews.map(review => {
      if (review.dueDate <= todayStrStr && review.reviewType !== 'completed') {
        const nextType = 'completed' as const;
        return {
          ...review,
          reviewType: nextType,
          completedAt: new Date().toISOString(),
          stagesCompleted: [...(review.stagesCompleted || []), 'review']
        };
      }
      return review;
    });

    // SYNC WITH SCHEDULE: If any of these completed reviews match today's topic, mark schedule as done
    let newSchedule = contest.schedule;
    if (todayTask && !todayTask.completed) {
      const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const hasMatch = updatedReviews.some(r => 
        (r.dueDate <= todayStrStr && r.reviewType === 'completed') && 
        (norm(r.topicName) === norm(todayTask.specificTopic || '') || norm(r.topicName) === norm(todayTask.generalTopic || ''))
      );

      if (hasMatch) {
        newSchedule = contest.schedule?.map(day => {
          if (day.id === todayTask.id) return { ...day, completed: true };
          return day;
        });
        toast.success("Meta do cronograma validada por conclusão em massa! 🎯");
      }
    }

    onUpdate({
      ...contest,
      meppReviews: updatedReviews,
      schedule: newSchedule
    });
    
    toast.success("Todas as revisões pendentes foram concluídas!");
  };

  const handleRemoveMeppReview = async (reviewId: string) => {
    if (!contest?.meppReviews) return;
    const updated = contest.meppReviews.filter(r => r.id !== reviewId);
    onUpdate({
      ...contest,
      meppReviews: updated
    });
    toast.success("Revisão removida do seu painel.");
  };

  const allReviews = contest?.meppReviews || [];
  const dueReviews = allReviews.filter(r => r.dueDate <= todayStrStr && r.reviewType !== 'completed');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 bg-white border border-border hover:bg-slate-50 rounded-xl transition-all text-text-sub">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold text-text-main flex items-center gap-2 italic uppercase">
              <Award className="w-5 h-5 text-indigo-500 animate-pulse" />
              Mentor MEPP
            </h1>
            <p className="text-xs text-text-sub font-semibold mt-1">
              Guia de revisões espaçadas para vencer a curva do esquecimento
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowMeppExplainer(!showMeppExplainer)}
          className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg shrink-0"
        >
          {showMeppExplainer ? "Ocultar Guia" : "O que é o MEPP?"}
        </button>
      </div>

      {/* Warning/Info alert if there are due reviews */}
      {dueReviews.length > 0 && (
        <div className="p-4 md:p-5 rounded-2xl bg-amber-50/50 border border-amber-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-white relative shadow-lg shadow-amber-500/20 shrink-0">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-[9px] font-black text-white rounded-full flex items-center justify-center border border-white animate-bounce">
                  {dueReviews.length}
                </span>
              </div>
              <div>
                <h5 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1">
                  ⚠️ Alerta do Mentor MEPP: Curva do Esquecimento Ativada!
                </h5>
                <p className="text-[10px] md:text-xs font-semibold text-amber-900/80 leading-relaxed max-w-3xl mt-0.5">
                  Você tem <strong>{dueReviews.length} revisões de matérias pendentes ou programadas para hoje</strong>. O segredo da aprovação inteligente é revisar ativamente antes de iniciar um bloco de teoria nova.
                </p>
              </div>
            </div>
            <Link 
              to="/microaprendizado"
              className="w-full md:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center shrink-0 shadow-md shadow-amber-500/10 active:scale-[0.98]"
            >
              Ir Para Recuperação Ativa (Praticar)
            </Link>
            <button
              onClick={handleCompleteAllDueReviews}
              className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center shrink-0 shadow-md shadow-emerald-500/10 active:scale-[0.98]"
            >
              Marcar Todas como Feitas
            </button>
          </div>
        </div>
      )}

      {/* MEPP Explainer Section */}
      <AnimatePresence>
        {showMeppExplainer && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-indigo-150 to-white border border-indigo-100 space-y-4 shadow-sm text-xs text-text-sub leading-relaxed md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
              <div className="space-y-2">
                <h4 className="font-display font-bold text-indigo-950 uppercase tracking-tight flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  O Método MEPP
                </h4>
                <p>
                  O Método MEPP defende que a aprovação inteligente consiste em <strong>consistência, esforço direcionado e revisão ativa programada</strong>. 
                </p>
                <p>
                  Revisar não é reestudar passivamente! O maior erro dos concurseiros é ler PDFs ou rever leis inteiras de forma passiva. O segredo para fixar blocos de conteúdos de alto nível é a <strong>recuperação ativa</strong>: forçar o cérebro a lembrar por conta própria utilizando nossos flashcards, resumos e mapas mentais.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-display font-medium text-indigo-950 uppercase tracking-tight">O Ciclo Espaçado MEPP (24h ➔ 7d ➔ 30d):</h4>
                <ul className="space-y-1 ml-4 list-disc">
                  <li><strong>Revisão de 24 Horas:</strong> Recuperação imediata no dia seguinte para interromper a curva de esquecimento inicial.</li>
                  <li><strong>Revisão de 7 Dias:</strong> Consolidação de médio prazo das matérias e conceitos errados.</li>
                  <li><strong>Revisão de 30 Dias:</strong> Fixação de longo prazo e blindagem da memória antes da prova.</li>
                </ul>
                <p className="pt-2 text-[10px] italic font-medium text-indigo-600">
                  "Reserve o seu Tempo Sagrado de Revisão diariamente (proporção de tempo equilibrada com o estudo de teoria nova)."
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Column 1: Daily Meta Stages Checklist */}
        <div className="lg:col-span-4 bg-white border border-border rounded-2xl p-4 md:p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2">
              <h4 className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                <Timer className="w-3 h-3 text-primary" />
                Rotina Diária MEPP
              </h4>
              <div className="text-[8px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                HOJE
              </div>
            </div>
            <p className="text-[10px] text-text-sub font-semibold leading-relaxed mb-4 italic">
              {todayTask 
                ? `Para a meta de hoje "${todayTask.specificTopic || todayTask.generalTopic}":` 
                : "Não há meta de estudos definida para o dia de hoje."}
            </p>
            
            <div className="space-y-2.5">
              {[
                { key: 'theory', title: '1. Estudo Teórico Ativo', desc: 'Leitura focada do PDF/Aulas' },
                { key: 'recall', title: '2. Recuperação Ativa', desc: 'Flashcards ou esquemas mentais rápidos' },
                { key: 'practice', title: '3. Resolução de Exercícios', desc: 'Resolver questões de bancas anteriores' },
                { key: 'errors', title: '4. Caderno de Erros', desc: 'Anotar os erros e analisar fraquezas' }
              ].map((step, sIdx) => {
                const isChecked = currentMeppStages.includes(step.key);
                return (
                  <button
                    key={sIdx}
                    onClick={() => handleToggleMeppStage(step.key)}
                    className={cn(
                      "w-full p-2.5 rounded-xl border flex items-center gap-3 transition-all text-left group",
                      isChecked 
                        ? "bg-emerald-50/50 border-emerald-200 hover:border-emerald-300" 
                        : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <div className={cn("shrink-0", isChecked ? "text-emerald-500" : "text-text-sub/40 group-hover:text-text-sub/60")}>
                      {isChecked ? <CheckSquare className="w-4.5 h-4.5" /> : <Square className="w-4.5 h-4.5" />}
                    </div>
                    <div className="overflow-hidden">
                      <div className={cn("text-[11px] font-black uppercase tracking-tight", isChecked ? "text-emerald-900" : "text-text-main")}>
                        {step.title}
                      </div>
                      <div className="text-[9px] font-bold text-text-sub truncate opacity-85 uppercase tracking-wider">
                        {step.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <span className="text-[8px] font-black text-text-sub uppercase tracking-wider">
              {"Consistência > Intensidade 🎯"}
            </span>
          </div>
        </div>

        {/* Column 2: Spaced Repetition Active Reviews List & Scheduler */}
        <div className="lg:col-span-8 bg-white border border-border rounded-2xl p-4 md:p-5 flex flex-col shadow-sm gap-4">
          <div className="flex items-center justify-between mb-1 border-b border-border/60 pb-2">
            <h4 className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-indigo-500" />
              Ciclo de Recuperação Ativa
            </h4>
            <div className="flex items-center gap-2">
               <button
                 onClick={() => setIsManualSchedulerOpen(!isManualSchedulerOpen)}
                 className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase tracking-wider hover:bg-indigo-100 transition-colors"
               >
                 {isManualSchedulerOpen ? "Ocultar Agendador" : "+ Agendar Revisão"}
               </button>
               <div className="text-[9px] font-bold text-text-sub">
                 Spaced Repetition System
               </div>
            </div>
          </div>

          {/* Program new Active Review directly from Edital Topics Cascade */}
          {isManualSchedulerOpen && (
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden">
            <h5 className="text-[9.5px] font-black text-indigo-950 uppercase tracking-widest mb-2.5 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5 text-indigo-500" /> Agendar Nova Revisão Espaçada
            </h5>
            
            <div className="flex flex-col md:flex-row gap-2.5 items-end justify-between">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-grow w-full">
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[8px] font-bold uppercase text-text-sub tracking-widest pl-1">Disciplina</span>
                  <select
                    className="bg-white border border-border/80 rounded-lg p-2 text-xs font-semibold text-text-main focus:outline-none focus:ring-1 focus:ring-primary/30 w-full"
                    value={(() => {
                      const found = contest?.subjects.find(s => s.name === selectedSubjectNameReview);
                      return found?.id || '';
                    })()}
                    onChange={(e) => {
                      const sub = contest?.subjects.find(s => s.id === e.target.value);
                      if (sub) {
                        setSelectedSubjectNameReview(sub.name);
                        setSelectedTopicNameReview('');
                      } else {
                        setSelectedSubjectNameReview('');
                        setSelectedTopicNameReview('');
                      }
                    }}
                  >
                    <option value="">-- Selecione uma Disciplina --</option>
                    {contest?.subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[8px] font-bold uppercase text-text-sub tracking-widest pl-1">Tópico do Edital</span>
                  <select
                    className="bg-white border border-border/80 rounded-lg p-2 text-xs font-semibold text-text-main focus:outline-none focus:ring-1 focus:ring-primary/30 w-full"
                    value={selectedTopicNameReview}
                    onChange={(e) => setSelectedTopicNameReview(e.target.value)}
                    disabled={!selectedSubjectNameReview}
                  >
                    <option value="">-- Selecione um Tópico --</option>
                    {contest?.subjects
                      .find(s => s.name === selectedSubjectNameReview)
                      ?.topics?.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    {selectedSubjectNameReview && (!contest?.subjects.find(s => s.name === selectedSubjectNameReview)?.topics || contest?.subjects.find(s => s.name === selectedSubjectNameReview)?.topics?.length === 0) && (
                      <option value="Tópico Geral">Conteúdo Geral da Disciplina</option>
                    )}
                  </select>
                </div>
              </div>

              <button
                onClick={handleScheduleCustomReview}
                className="w-full md:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm shrink-0 h-[34px] flex items-center justify-center gap-1 active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" /> Iniciar Ciclo MEPP
              </button>
            </div>
          </div>
        )}

        {/* Schedule Spaced List */}
        <div className="flex-grow space-y-2 max-h-[440px] overflow-y-auto no-scrollbar">
            {(() => {
              const reviews = contest?.meppReviews || [];
              const activeOnes = reviews.filter(r => r.reviewType !== 'completed');

              if (activeOnes.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/40 rounded-xl border border-dashed border-slate-200">
                    <Brain className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest">Nenhuma Revisão Ativa Pendente</p>
                    <p className="text-[9px] text-text-sub/70 italic max-w-sm mt-0.5">Agende um assunto acima para que o sistema te lembre ativamente nos intervalos ideais!</p>
                  </div>
                );
              }

              return activeOnes
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                .map((rev) => {
                  const isOverdue = rev.dueDate <= todayStrStr;
                  
                  return (
                    <div 
                      key={rev.id} 
                      className={cn(
                        "p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors",
                        isOverdue 
                          ? "bg-amber-50/20 border-amber-200/60 hover:border-amber-300/60" 
                          : "bg-white border-slate-100 hover:border-slate-200"
                      )}
                    >
                      <div className="overflow-hidden space-y-1">
                        <span className="text-[8px] font-black uppercase text-indigo-600 tracking-wider">
                          {rev.subjectName}
                        </span>
                        <h6 className="text-[11px] font-bold text-text-main truncate pr-2 max-w-[280px] sm:max-w-[340px]">
                          {rev.topicName}
                        </h6>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                            rev.reviewType === '24h' ? "bg-red-50 text-red-600 border border-red-100" :
                            rev.reviewType === '7d' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                            "bg-indigo-50 text-indigo-600 border border-indigo-100"
                          )}>
                            REVISÃO {rev.reviewType.toUpperCase()}
                          </span>
                          
                          <span className={cn(
                            "text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded-full",
                            isOverdue ? "bg-red-500 text-white" : "bg-slate-100 text-text-sub"
                          )}>
                            {isOverdue ? "⚠️ HOJE" : `Vence em: ${new Date(rev.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                        <Link 
                          to="/microaprendizado"
                          className="p-1 px-2.5 bg-slate-50 border border-border/60 hover:brightness-95 rounded-lg text-[9px] font-bold uppercase tracking-wider text-text-main flex items-center gap-1 shadow-sm"
                          title="Praticar Ativo"
                        >
                          <Brain className="w-3 h-3 text-indigo-500" /> Praticar
                        </Link>
                        
                        <button
                          onClick={() => handleCompleteActiveReviewStep(rev.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm"
                        >
                          ✓ FEITO
                        </button>
                        
                        <button
                          onClick={() => handleRemoveMeppReview(rev.id)}
                          className="p-2 text-text-sub hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                });
            })()}
        </div>
      </div>

      </div>

      {/* Histórico Cláusula / Concluídos MEPP */}
      <div className="p-5 bg-white border border-border rounded-2xl shadow-sm">
        <h3 className="text-xs font-display text-text-main uppercase font-bold tracking-wider mb-3 flex items-center gap-1">
          <BookOpenCheck className="w-4 h-4 text-emerald-500" />
          Ciclos MEPP Concluídos
        </h3>
        
        {(() => {
          const completedReviews = allReviews.filter(r => r.reviewType === 'completed');
          if (completedReviews.length === 0) {
            return (
              <p className="text-[11px] text-text-sub italic leading-relaxed">
                Nenhum tópico completou o ciclo total de 30 dias ainda. Siga firme revisando regularmente para consolidar seus ciclos de memorização profunda!
              </p>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {completedReviews.map((rev) => (
                <div key={rev.id} className="p-3 rounded-xl bg-emerald-50/20 border border-emerald-100 flex items-center justify-between gap-2">
                  <div className="overflow-hidden">
                    <span className="text-[8px] font-black uppercase text-emerald-600 tracking-wider block">
                      {rev.subjectName}
                    </span>
                    <h5 className="text-[11px] font-bold text-text-main truncate">
                      {rev.topicName}
                    </h5>
                    <span className="text-[8px] font-bold text-text-sub uppercase tracking-wider">
                      Completo em: {rev.completedAt ? new Date(rev.completedAt).toLocaleDateString('pt-BR') : 'Recentemente'}
                    </span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs shrink-0 font-black">
                    ✓
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default MentorMepp;
