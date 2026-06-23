import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Contest, ScheduleDay } from '../types';
import { cn } from '../lib/utils';
import { 
  CalendarDays, 
  ChevronRight, 
  Download, 
  CheckCircle2, 
  BrainCircuit, 
  ChevronLeft,
  Clock,
  BookOpen,
  Share2,
  Users,
  PenTool,
  Loader2,
  Target,
  Zap,
  Lock,
  Play,
  Timer,
  Award,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateSchedule } from '../services/gemini';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import ProModal from '../components/ProModal';

interface CronogramaProps {
  contest: Contest;
  onUpdate: (contest: Contest) => void;
}

export default function Cronograma({ contest, onUpdate }: CronogramaProps) {
  const { user, profile, isPro } = useAuth();
  const navigate = useNavigate();
  const [activeWeek, setActiveWeek] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [weeksCount, setWeeksCount] = useState(4);
  const [scheduleMode, setScheduleMode] = useState<'weeks' | 'examDate'>('weeks');
  const [showProModal, setShowProModal] = useState(false);
  const [proFeatureName, setProFeatureName] = useState('');
  const [exporting, setExporting] = useState(false);
  const [dailyHours, setDailyHours] = useState(contest.dailyGoalHours || 2);
  const [dailyQuestions, setDailyQuestions] = useState(contest.dailyGoalQuestions || 20);

  const getStartDate = () => {
    if (contest.scheduleStartDate) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(contest.scheduleStartDate)) {
        return new Date(contest.scheduleStartDate + 'T00:00:00');
      }
      const parsed = new Date(contest.scheduleStartDate);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    if ((contest as any).createdAt) {
      const createDate = typeof (contest as any).createdAt.toDate === 'function' 
        ? (contest as any).createdAt.toDate() 
        : new Date((contest as any).createdAt);
      if (!isNaN(createDate.getTime())) return createDate;
    }
    const timestampStr = contest.id.split('-')[1];
    if (timestampStr && !isNaN(parseInt(timestampStr, 10))) {
      return new Date(parseInt(timestampStr, 10));
    }
    return new Date();
  };

  const schedule = contest.schedule || [];
  const maxDay = schedule.length > 0 ? Math.max(...schedule.map(d => d.dayNumber)) : 0;
  const totalWeeks = Math.ceil(maxDay / 7);

  const handleShare = async () => {
    if (!user || !contest) return;
    setSharing(true);
    try {
      const sharedId = `shared-${contest.id}`;
      const sharedRef = doc(db, 'shared_contests', sharedId);
      
      // Ensure we have only the fields allowed by the security rules
      const sharedData = {
        name: contest.name,
        role: contest.role,
        examDate: contest.examDate || '',
        subjects: contest.subjects || [],
        schedule: contest.schedule || [],
        dailyGoalHours: contest.dailyGoalHours || 0,
        dailyGoalQuestions: contest.dailyGoalQuestions || 0,
        ownerId: user.uid,
        ownerName: user.displayName || user.email?.split('@')[0] || 'Concurseiro',
        ownerIsCreator: !!profile?.isCreator,
        isPublic: true,
        likesCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(sharedRef, sharedData);
      
      // Update the local contest to reflect it's now public
      const contestRef = doc(db, 'users', user.uid, 'contests', contest.id);
      await setDoc(contestRef, { isPublic: true, updatedAt: serverTimestamp() }, { merge: true });
      
      onUpdate({ ...contest, isPublic: true });
      toast.success("Cronograma e Edital Verticalizado compartilhados com sucesso na Comunidade! 🚀");
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
      // Detailed error for developers
      if (error instanceof Error && error.message.includes('permission')) {
        toast.error("Erro de permissão: Certifique-se de que seus dados estão corretos.");
      } else {
        toast.error("Erro ao compartilhar. Verifique sua conexão.");
      }
    } finally {
      setSharing(false);
    }
  };

  const handleExport = () => {
    if (!contest.schedule || contest.schedule.length === 0) return;
    
    if (!isPro) {
      setProFeatureName('Exportação de Cronograma em PDF');
      setShowProModal(true);
      return;
    }

    setExporting(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(79, 70, 229); // Primary color
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('StratisPlanner', pageWidth / 2, 18, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('CRONOGRAMA DE ESTUDOS PERSONALIZADO', pageWidth / 2, 28, { align: 'center' });
      
      // Secondary Info Section
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMAÇÕES DO PLANO', 14, 50);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Focando em: ${contest.role.toUpperCase()}`, 14, 58);
      doc.text(`Banca: ${contest.banca || 'Manual'}`, 14, 64);
      doc.text(`Data da Prova: ${contest.examDate || 'Não definida'}`, 14, 70);
      
      doc.text(`Meta Horas: ${contest.dailyGoalHours}h`, 100, 58);
      doc.text(`Meta Questões: ${contest.dailyGoalQuestions} questões`, 100, 64);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 100, 70);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 75, pageWidth - 14, 75);

      // Table Data
      const tableData = contest.schedule.map(day => {
        const week = Math.ceil(day.dayNumber / 7);
        return [
          `Dia ${day.dayNumber}\n(Sem. ${week})`,
          `${day.specificTopic || '-'}\n${day.generalTopic || '-'}`,
          day.questionGoal.toString(),
          day.revisionTask,
          day.completed ? 'Concluído' : 'Pendente'
        ];
      });

      autoTable(doc, {
        startY: 85,
        head: [['Dia', 'Tópicos de Estudo', 'Questões', 'Revisão', 'Status']],
        body: tableData,
        headStyles: { 
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        styles: { 
          fontSize: 8,
          cellPadding: 4,
          overflow: 'linebreak',
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 85 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 40 },
          4: { cellWidth: 23, halign: 'center' }
        },
        theme: 'striped'
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          'StratisPlanner - Mantenha a constância! Estudar é um processo.',
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      doc.save(`cronograma_${contest.role.toLowerCase().replace(/\s+/g, '_')}.pdf`);
      toast.success("Plano de estudos exportado para PDF com sucesso! 📄");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao exportar plano para PDF.");
    } finally {
      setExporting(false);
    }
  };

  const handleGenerate = async () => {
    let weeksCountToUse = weeksCount;
    if (scheduleMode === 'examDate') {
      if (!contest.examDate) {
        toast.error("Você precisa definir a data da prova em Configurações > Importar Edital primeiro.");
        return;
      }
      const examTime = new Date(contest.examDate).getTime();
      const startTime = getStartDate().getTime();
      const diff = examTime - startTime;
      if (diff <= 0) {
        toast.error("A data da prova já passou ou é inválida.");
        return;
      }
      weeksCountToUse = Math.ceil(diff / (1000 * 60 * 60 * 24 * 7));
    }

    if (!isPro && weeksCountToUse > 4) {
      setProFeatureName('Cronogramas de Longo Prazo (> 4 Semanas)');
      setShowProModal(true);
      return;
    }

    setLoading(true);
    try {
      const subjectsSummary = contest.subjects.map(s => 
        `${s.name} (${s.category}): ${s.topics?.map(t => t.name).join(', ')}`
      ).join('\n');
      
      const newSchedule = await generateSchedule(subjectsSummary, weeksCountToUse * 7);
      const todayStr = new Date().toISOString().split('T')[0];
      
      onUpdate({ 
        ...contest, 
        schedule: newSchedule, 
        dailyGoalHours: dailyHours, 
        dailyGoalQuestions: dailyQuestions,
        scheduleStartDate: todayStr
      });
      toast.success("Novo cronograma gerado iniciando a partir de hoje! 🗓️");
    } catch (error) {
      console.error("Erro ao gerar cronograma:", error);
      toast.error("Erro ao carregar o cronograma. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  const getTodayDayNumber = () => {
    const start = new Date(getStartDate());
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = Math.max(0, now.getTime() - start.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays + 1);
  };

  const handleRealignment = () => {
    if (!contest.schedule || contest.schedule.length === 0) return;
    
    // Find first day not completed
    const firstIncomplete = contest.schedule.find(d => !d.completed);
    if (!firstIncomplete) {
      toast.info("Todas as suas metas já estão concluídas! 🎉");
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Set start date such that: firstIncomplete.dayNumber starts today
    const newStart = new Date(today.getTime() - (firstIncomplete.dayNumber - 1) * 24 * 60 * 60 * 1000);
    const newStartStr = newStart.toISOString().split('T')[0];
    
    onUpdate({
      ...contest,
      scheduleStartDate: newStartStr
    });
    
    toast.success(`Cronograma realinhado com sucesso! Suas metas pendentes (a partir do Dia ${firstIncomplete.dayNumber}) foram trazidas para HOJE, limpando atrasos acumulados! 📆`);
  };

  const todayDayNumber = getTodayDayNumber();

  const getDayDate = (dayNum: number) => {
    const start = new Date(getStartDate());
    start.setHours(0, 0, 0, 0);
    const date = new Date(start);
    date.setDate(start.getDate() + (dayNum - 1));
    
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' });
    const formatted = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    return `${weekday.replace('.', '')}, ${formatted.replace('.', '')}`;
  };

  const handlePushDayForward = (dayIndex: number) => {
    if (!contest.schedule) return;
    const newSchedule = [...contest.schedule];
    
    // Shift remaining topics forward by 1 index (leaving dayIndex empty)
    for (let i = newSchedule.length - 1; i > dayIndex; i--) {
      newSchedule[i] = {
        ...newSchedule[i],
        generalTopic: newSchedule[i - 1].generalTopic,
        specificTopic: newSchedule[i - 1].specificTopic,
        questionGoal: newSchedule[i - 1].questionGoal,
        revisionTask: newSchedule[i - 1].revisionTask,
        completed: newSchedule[i - 1].completed,
      };
    }
    
    // Insert custom adjustments day
    newSchedule[dayIndex] = {
      ...newSchedule[dayIndex],
      generalTopic: 'Foco em Revisão / Descanso',
      specificTopic: 'Dia de Ajuste: Aproveite para recuperar metas em atraso.',
      questionGoal: 10,
      revisionTask: 'Revisar erros da semana',
      completed: false,
    };
    
    onUpdate({ ...contest, schedule: newSchedule });
    toast.success("Metas adiadas com sucesso! Seu cronograma foi empurrado adiante. 🗓️");
  };

  const toggleDay = (dayIndex: number) => {
    if (!contest.schedule) return;
    
    const getTodayISOString = () => {
      const d = new Date();
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().split('T')[0];
    };
    const todayStrStr = getTodayISOString();

    const newSchedule = [...contest.schedule];
    const isNowCompleted = !newSchedule[dayIndex].completed;
    newSchedule[dayIndex] = { ...newSchedule[dayIndex], completed: isNowCompleted };
    
    // Logic to sync with vertical edital (subjects) and productivity history
    let newSubjects = [...contest.subjects];
    let newMeppReviews = contest.meppReviews ? [...contest.meppReviews] : [];
    let newHistory = contest.dailyHistory ? [...contest.dailyHistory] : [];
    
    if (isNowCompleted) {
      // Update History for Streak
      const existingHistoryIdx = newHistory.findIndex(h => h.date === todayStrStr);
      if (existingHistoryIdx >= 0) {
        if (newHistory[existingHistoryIdx].hours === 0) newHistory[existingHistoryIdx].hours = contest.dailyGoalHours || 1;
        if (newHistory[existingHistoryIdx].questions === 0) newHistory[existingHistoryIdx].questions = newSchedule[dayIndex].questionGoal || contest.dailyGoalQuestions || 5;
      } else {
        newHistory.push({
          date: todayStrStr,
          hours: contest.dailyGoalHours || 1,
          questions: newSchedule[dayIndex].questionGoal || contest.dailyGoalQuestions || 5
        });
      }

      const day = newSchedule[dayIndex];
      const normalize = (s: string) => s.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/gi, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^(parte|modulo|eixo|bloco) [\div]+ /i, '')
        .trim();

      const topicsStr = [day.specificTopic, day.generalTopic].join(' ');
      const scheduleWords = normalize(topicsStr).split(/\s+/).filter(w => w.length > 2);
      
      newSubjects = newSubjects.map(subject => {
        const normalizedSubjectName = normalize(subject.name);
        const normSpecific = normalize(day.specificTopic || '');
        const normGeneral = normalize(day.generalTopic || '');
        
        const subjectIsMentioned = 
          normalize(topicsStr).includes(normalizedSubjectName) || 
          normalizedSubjectName.includes(normSpecific) || 
          normalizedSubjectName.includes(normGeneral);

        let updatedTopics = (subject.topics || []);
        if (updatedTopics.length > 0) {
          updatedTopics = updatedTopics.map(topic => {
            if (topic.completed) return topic;
            const normalizedTopic = normalize(topic.name);
            const topicWords = normalizedTopic.split(/\s+/).filter(w => w.length > 2);
            const hasDirectMatch = normalize(topicsStr).includes(normalizedTopic) || normalizedTopic.includes(normalize(topicsStr));
            const matchCount = topicWords.filter(tw => scheduleWords.some(sw => sw.includes(tw) || tw.includes(sw))).length;
            const matchRatio = topicWords.length > 0 ? matchCount / topicWords.length : 0;
            if (hasDirectMatch || matchRatio >= 0.45) return { ...topic, completed: true };
            return topic;
          });
        }

        let extraCompleted = subject.completedTopics || 0;
        if (subjectIsMentioned && updatedTopics.length === 0) {
          extraCompleted = Math.min(subject.totalTopics || 1, extraCompleted + 1);
        }

        return {
          ...subject,
          topics: updatedTopics,
          completedTopics: (subject.topics?.length || 0) > 0 
            ? updatedTopics.filter(t => t.completed).length 
            : extraCompleted
        };
      });

      // Auto-mark MEPP "Estudo Teórico Ativo" ('theory' stage) as completed
      const topicName = day.specificTopic || day.generalTopic || "Estudo do Dia";
      const subjectName = contest.subjects.find(sub => 
        sub.topics?.some(t => t.name === day.specificTopic)
      )?.name || "Geral";

      const existingReviewIdx = newMeppReviews.findIndex(r => r.topicName === topicName && r.reviewType !== 'completed');
      
      if (existingReviewIdx === -1) {
        newMeppReviews.push({
          id: `mepp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          topicName,
          subjectName,
          createdAt: new Date().toISOString(),
          stagesCompleted: ['theory'],
          dueDate: todayStrStr,
          reviewType: '24h' as const
        });
      } else {
        const stages = newMeppReviews[existingReviewIdx].stagesCompleted || [];
        if (!stages.includes('theory')) {
          newMeppReviews[existingReviewIdx] = {
            ...newMeppReviews[existingReviewIdx],
            stagesCompleted: [...stages, 'theory']
          };
        }
      }
    } else {
      // Reverting a day doesn't necessarily mean we should unmark topics, 
      // but for consistency we might want to if the user expects full sync.
      // However, progress is usually cumulative and topics might appear in multiple days.
      // We'll stick to marking as completed for now as requested.
    }
    
    onUpdate({ ...contest, schedule: newSchedule, subjects: newSubjects, meppReviews: newMeppReviews, dailyHistory: newHistory });
    if (isNowCompleted) {
      toast.success("Meta concluída! 🔥 Ofensiva atualizada.");
    }
  };

  if (schedule.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 py-10">
      <header className="text-center space-y-6">
        <div className="w-16 h-16 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary shadow-sm">
          <CalendarDays className="w-8 h-8" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-sm"></div>
            Seu Plano
          </div>
          <h1 className="text-2xl md:text-3xl font-display text-text-main tracking-tight font-bold">
            Meu <span className="text-primary italic">Cronograma</span>
          </h1>
          <p className="text-text-sub max-w-lg mx-auto text-[11px] md:text-sm font-medium leading-relaxed italic">
            Acompanhe sua jornada de estudos organizada por semanas e dias.
          </p>
        </div>
      </header>

      <section className="rise-card p-8 md:p-12 space-y-10 text-center max-w-lg mx-auto border border-border bg-white shadow-sm">
        <div className="space-y-6">
          <label className="text-xs font-bold text-text-sub uppercase tracking-wider block text-left">Modo do Cronograma</label>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setScheduleMode('weeks')}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                scheduleMode === 'weeks' ? "bg-white text-text-main shadow-sm" : "text-text-sub hover:text-text-main"
              )}
            >
              Definir Semanas
            </button>
            <button
              onClick={() => setScheduleMode('examDate')}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                scheduleMode === 'examDate' ? "bg-white text-text-main shadow-sm" : "text-text-sub hover:text-text-main"
              )}
            >
              Até a Prova
            </button>
          </div>

          {scheduleMode === 'examDate' && contest.examDate && (
             <p className="text-xs text-text-main font-medium italic mt-2 text-left">
               A IA calculará automaticamente as semanas até a data oficial da prova ({new Date(contest.examDate).toLocaleDateString('pt-BR')}).
             </p>
          )}

          {scheduleMode === 'weeks' && (
            <div className="grid grid-cols-2 gap-3 mt-4">
               {[2, 4, 8, 12].map(w => {
                 const isDisabled = !isPro && w > 4;
                 return (
                  <button 
                   key={w}
                   onClick={() => {
                     if (isDisabled) {
                       setProFeatureName(`Cronogramas de ${w} Semanas`);
                       setShowProModal(true);
                     } else {
                       setWeeksCount(w);
                     }
                   }}
                   className={cn(
                     "px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border relative flex items-center justify-center gap-2",
                     weeksCount === w 
                       ? "bg-primary border-primary text-white shadow-sm scale-105" 
                       : "bg-slate-50 border-border text-text-sub hover:border-primary/30",
                     isDisabled && "opacity-60 grayscale-[0.5]"
                   )}
                  >
                    {w} Semanas
                    {isDisabled && <Lock className="w-3 h-3 text-slate-400" />}
                  </button>
                 );
               })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/50">
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-text-sub uppercase tracking-wider block">Horas por Dia</label>
            <input 
              type="number"
              min="1"
              max="16"
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="w-full bg-slate-50 border border-border p-3 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 text-center"
            />
          </div>
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-text-sub uppercase tracking-wider block">Questões por Dia</label>
            <input 
              type="number"
              min="5"
              max="200"
              value={dailyQuestions}
              onChange={(e) => setDailyQuestions(Number(e.target.value))}
              className="w-full bg-slate-50 border border-border p-3 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 text-center"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-primary text-white py-4.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Gerar Cronograma
            </>
          )}
        </button>
      </section>

      <ProModal 
        isOpen={showProModal} 
        onClose={() => setShowProModal(false)} 
        featureName={proFeatureName} 
      />
      </div>
    );
  }

  const currentWeekDays = schedule.slice((activeWeek - 1) * 7, activeWeek * 7);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20 overflow-x-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-6 md:pb-8">
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center gap-3 text-primary font-bold text-[10px] uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-sm"></div>
            Calendário
          </div>
          <h1 className="text-xl md:text-3xl font-display text-text-main tracking-tight font-bold">
            Minhas <span className="text-primary italic">Metas</span>
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-text-sub text-[10px] font-bold uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-border">{contest.role}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
           <button 
            onClick={handleShare}
            disabled={sharing || contest.isPublic}
            className={cn(
              "flex-1 md:flex-none px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm",
              contest.isPublic 
                ? "bg-slate-100 text-text-sub border border-border opacity-50 cursor-default" 
                : "bg-primary text-white hover:brightness-110"
            )}
           >
             {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
             {contest.isPublic ? 'Publicado' : 'Compartilhar na Comunidade'}
           </button>

           <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 md:flex-none px-8 py-3.5 bg-white border border-border text-text-sub rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
           >
             {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isPro ? <Download className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-accent" />)}
             Exportar Plano
           </button>

           <div className="flex items-center gap-2 bg-white border border-border px-3 py-2 rounded-xl shadow-sm hover:border-slate-300 transition-all select-none">
             <CalendarDays className="w-4 h-4 text-primary shrink-0" />
             <div className="flex flex-col text-left">
               <span className="text-[8px] font-black uppercase text-slate-400 leading-none">Início do Ritmo</span>
               <input 
                 type="date"
                 value={contest.scheduleStartDate || new Date().toISOString().split('T')[0]}
                 onChange={(e) => {
                   const newStartDate = e.target.value;
                    const confirmReset = window.confirm(
                      "Alterar a data de início irá reiniciar todo o seu progresso neste edital (histórico diário, tópicos concluídos e metas diárias). Deseja prosseguir?"
                    );
                    if (confirmReset) {
                      const resetSubjects = (contest.subjects || []).map((sub) => {
                        const resetTopics = (sub.topics || []).map((top) => ({
                          ...top,
                          completed: false,
                          revision: false,
                          questions: false,
                          errorNote: undefined
                        }));
                        return {
                          ...sub,
                          completedTopics: 0,
                          topics: resetTopics
                        };
                      });

                      const resetSchedule = (contest.schedule || []).map((day) => ({
                        ...day,
                        completed: false,
                        actualHours: undefined,
                        actualQuestions: undefined
                      }));

                      const updated = { 
                        ...contest, 
                        scheduleStartDate: newStartDate,
                        dailyHistory: [],
                        meppReviews: [],
                        subjects: resetSubjects,
                        schedule: resetSchedule
                      };
                      onUpdate(updated);
                      toast.success("Data de início atualizada e métricas resetadas! 🗓️🔄");
                    }
                 }}
                 className="bg-transparent border-none p-0 text-[10px] font-black text-slate-700 outline-none focus:ring-0 cursor-pointer h-4 leading-tight"
               />
             </div>
           </div>

            <button
              onClick={handleRealignment}
              className="flex-1 md:flex-none px-4 py-3 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
              title="Ajustar o cronograma para que o primeiro dia incompleto seja HOJE"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-indigo-500 hover:text-inherit shrink-0" />
              Realinhar Metas para Hoje
            </button>

            <div className="flex gap-2">
             <button 
              onClick={() => { if(confirm("Deseja deletar e gerar um novo cronograma?")) onUpdate({ ...contest, schedule: [] }) }}
              className="p-3.5 bg-red-500/5 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
              title="Reiniciar Cronograma"
             >
               <Clock className="w-5 h-5" />
             </button>
           </div>
        </div>
      </header>

      {/* Week Selector */}
      <div className="w-full">
        <div className="flex bg-slate-100 border border-border p-1.5 rounded-2xl gap-2 overflow-x-auto no-scrollbar shadow-inner select-none">
          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => {
            const isDisabled = !isPro && w > 4;
            return (
              <button
                key={w}
                onClick={() => {
                  if (isDisabled) {
                    setProFeatureName(`Acesso à Semana ${w}`);
                    setShowProModal(true);
                  } else {
                    setActiveWeek(w);
                  }
                }}
                className={cn(
                  "px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 whitespace-nowrap",
                  activeWeek === w 
                    ? "bg-white text-text-main shadow-sm border border-border" 
                    : "text-text-sub hover:text-text-main",
                  isDisabled && "opacity-50"
                )}
              >
                Semana {w}
                {isDisabled && <Lock className="w-3 h-3 text-slate-400" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {currentWeekDays.map((d, index) => {
            const dayIdx = (activeWeek - 1) * 7 + index;
            
            const isToday = d.dayNumber === todayDayNumber;
            const isOverdue = d.dayNumber < todayDayNumber && !d.completed;
            const isUpcoming = d.dayNumber > todayDayNumber && !d.completed;

            return (
              <motion.div 
                key={dayIdx}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "rise-card p-0 border-2 transition-all duration-300 relative flex flex-col justify-between h-auto min-h-[385px] group overflow-hidden rounded-3xl text-left min-w-0",
                  d.completed 
                    ? "bg-slate-50 border-emerald-200/90 shadow-sm opacity-85" 
                    : isToday
                      ? "bg-white border-indigo-500 shadow-lg shadow-indigo-100/40 ring-4 ring-indigo-50"
                      : "bg-white border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-50/50"
                )} >
                <div className="p-5 md:p-6 space-y-6 flex flex-col flex-1 min-w-0">
                  <header className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                     <div className="flex items-center gap-3">
                       <div className={cn(
                         "w-12 h-12 border-2 text-white rounded-2xl flex items-center justify-center font-display text-sm font-black shadow-sm italic text-[15px]",
                         d.completed
                           ? "bg-emerald-600 border-emerald-500"
                           : isToday
                             ? "bg-indigo-600 border-indigo-450"
                             : "bg-slate-900 border-slate-850"
                       )}>
                           {d.dayNumber}
                       </div>
                       <div className="min-w-0">
                         <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">
                           {getDayDate(d.dayNumber)}
                         </span>
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block -mt-0.5">META DIÁRIA</span>
                       </div>
                     </div>
                     
                     {d.completed ? (
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase rounded-full tracking-wider border border-emerald-200/50 shadow-sm whitespace-nowrap">
                         <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> CONCLUÍDO
                       </span>
                     ) : isToday ? (
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-full tracking-wider border border-indigo-450 shadow-sm whitespace-nowrap">
                         <Timer className="w-3.5 h-3.5 text-white" /> HOJE
                       </span>
                     ) : isOverdue ? (
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 text-[9px] font-black uppercase rounded-full tracking-wider border border-rose-200/50 shadow-sm whitespace-nowrap">
                         <Clock className="w-3.5 h-3.5 text-rose-600" /> ATRASADO
                       </span>
                     ) : (
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-black uppercase rounded-full tracking-wider border border-slate-200 shadow-sm whitespace-nowrap">
                         <CalendarDays className="w-3.5 h-3.5 text-slate-500" /> PROGRAMADO
                       </span>
                     )}
                  </header>

                  <div className="space-y-4 flex-1 min-w-0">
                    <div className="space-y-3.5 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-text-sub uppercase tracking-widest flex items-center gap-1 ml-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Matérias / Tópicos de Hoje
                        </span>
                      </div>
                      
                      <div className="space-y-3 min-w-0">
                        {/* Assunto Específico */}
                        {d.specificTopic && (
                          <div className="p-4 bg-indigo-50/40 border-2 border-indigo-100/60 rounded-2xl flex flex-col justify-between hover:bg-indigo-50/80 transition-all shadow-sm min-w-0 overflow-hidden">
                            <div className="min-w-0">
                              <span className="text-[8px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md mb-2 inline-flex items-center gap-1">
                                <Award className="w-3 h-3 text-indigo-600" /> Tópico Específico
                              </span>
                              <p className="text-[12px] font-black text-slate-800 leading-snug break-words">
                                {d.specificTopic}
                              </p>
                            </div>
                            {!d.completed && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/foco?subject=${encodeURIComponent(d.specificTopic || '')}`);
                                }}
                                className="mt-3 w-full py-1.5 bg-[#4f46e5] text-white hover:bg-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" /> Iniciar Estudo
                              </button>
                            )}
                          </div>
                        )}

                        {/* Assunto de Conhecimentos Básicos */}
                        {d.generalTopic && (
                          <div className="p-4 bg-emerald-50/20 border-2 border-emerald-100/60 rounded-2xl flex flex-col justify-between hover:bg-emerald-50/45 transition-all shadow-sm min-w-0 overflow-hidden">
                            <div className="min-w-0">
                              <span className="text-[8px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-105/50 px-2 py-0.5 rounded-md mb-2 inline-flex items-center gap-1">
                                <BrainCircuit className="w-3 h-3 text-emerald-700" /> Matéria Geral
                              </span>
                              <p className="text-[12px] font-black text-slate-800 leading-snug break-words">
                                {d.generalTopic}
                              </p>
                            </div>
                            {!d.completed && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/foco?subject=${encodeURIComponent(d.generalTopic || '')}`);
                                }}
                                className="mt-3 w-full py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-250 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" /> Iniciar Estudo
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 items-stretch min-w-0">
                     <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-left min-w-0">
                        <div className="text-[8px] font-black text-text-sub uppercase tracking-wider truncate">Cadência</div>
                        <div className="flex items-center gap-1 text-slate-850 mt-0.5 overflow-hidden">
                           <Target className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                           <span className="text-[11px] font-black tracking-tight truncate">{d.questionGoal} itens</span>
                        </div>
                     </div>
                     <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-right flex flex-col justify-between min-w-0">
                        <div className="text-[8px] font-black text-text-sub uppercase tracking-wider truncate">Retenção</div>
                        <div className="flex items-center gap-1 text-slate-850 mt-0.5 justify-end overflow-hidden">
                           <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                           <span className="text-[11px] font-black tracking-tight truncate">{d.revisionTask}</span>
                        </div>
                     </div>
                  </div>
                </div>
                <div className="p-4 pt-0 flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleDay(dayIdx)}}
                    className={cn(
                      "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border-2 shadow-sm cursor-pointer",
                      d.completed 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                        : "bg-indigo-600/10 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white"
                    )}
                  >
                    {d.completed ? '➔ Revisitar Dia' : '✓ Finalizar Metas'}
                  </button>

                  {!d.completed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Deseja adiar as metas do Dia ${d.dayNumber} para amanhã? Isso vai empurrar o cronograma de estudos subsequentes.`)) {
                          handlePushDayForward(dayIdx);
                        }
                      }}
                      className="px-3 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-100 hover:text-slate-800 transition-all flex items-center justify-center cursor-pointer"
                      title="Adiar para amanhã (empurrar cronograma)"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <ProModal 
        isOpen={showProModal} 
        onClose={() => setShowProModal(false)} 
        featureName={proFeatureName} 
      />
    </div>
  );
}


export function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
