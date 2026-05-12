import { useState } from 'react';
import { Contest, ScheduleDay } from '../types';
import { cn } from '../lib/utils';
import { 
  CalendarDays, 
  ChevronRight, 
  Download, 
  CheckCircle2, 
  BrainCircuit, 
  Sparkles,
  ChevronLeft,
  Clock,
  BookOpen,
  Share2,
  Users,
  PenTool,
  Loader2,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateSchedule } from '../services/gemini';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface CronogramaProps {
  contest: Contest;
  onUpdate: (contest: Contest) => void;
}

export default function Cronograma({ contest, onUpdate }: CronogramaProps) {
  const { user } = useAuth();
  const [activeWeek, setActiveWeek] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [weeksCount, setWeeksCount] = useState(4);

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
      alert("Cronograma e Edital Verticalizado compartilhados com sucesso na Comunidade! 🚀");
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
      // Detailed error for developers
      if (error instanceof Error && error.message.includes('permission')) {
        alert("Erro de permissão: Certifique-se de que seus dados estão corretos.");
      } else {
        alert("Erro ao compartilhar. Verifique sua conexão.");
      }
    } finally {
      setSharing(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const subjectsSummary = contest.subjects.map(s => 
        `${s.name} (${s.category}): ${s.topics?.map(t => t.name).join(', ')}`
      ).join('\n');
      
      const newSchedule = await generateSchedule(subjectsSummary, weeksCount * 7);
      onUpdate({ ...contest, schedule: newSchedule });
    } catch (error) {
      console.error("Erro ao gerar cronograma:", error);
      alert("Erro ao carregar o cronograma. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayIndex: number) => {
    if (!contest.schedule) return;
    const newSchedule = [...contest.schedule];
    newSchedule[dayIndex] = { ...newSchedule[dayIndex], completed: !newSchedule[dayIndex].completed };
    onUpdate({ ...contest, schedule: newSchedule });
  };

  const exportText = () => {
    if (!schedule.length) return;
    let text = `Cronograma de Estudos: ${contest.role}\n\n`;
    schedule.forEach(d => {
      text += `DIA ${d.dayNumber} [${d.completed ? 'CONCLUÍDO' : 'PENDENTE'}]\n`;
      text += `ESPECÍFICOS: ${d.specificTopic}\n`;
      text += `GERAIS: ${d.generalTopic}\n`;
      text += `QUESTÕES: ${d.questionGoal} | REVISÃO: ${d.revisionTask}\n`;
      text += `-----------------------------------\n\n`;
    });
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cronograma-${contest.role.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
          <label className="text-xs font-bold text-text-sub uppercase tracking-wider">Alcance do Plano (Semanas)</label>
          <div className="grid grid-cols-2 gap-3">
             {[2, 4, 8, 12].map(w => (
               <button 
                key={w}
                onClick={() => setWeeksCount(w)}
                className={cn(
                  "px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
                  weeksCount === w 
                    ? "bg-primary border-primary text-white shadow-sm scale-105" 
                    : "bg-slate-50 border-border text-text-sub hover:border-primary/30"
                )}
               >
                 {w} Semanas
               </button>
             ))}
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
              <Sparkles className="w-4 h-4" />
              Gerar Cronograma
            </>
          )}
        </button>
      </section>
      </div>
    );
  }

  const currentWeekDays = schedule.slice((activeWeek - 1) * 7, activeWeek * 7);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
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
            <span className="text-text-sub text-[10px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full border border-border">{contest.role}</span>
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

           <div className="flex gap-2">
             <button 
              onClick={exportText}
              className="p-3.5 bg-white border border-border rounded-xl text-text-sub hover:text-primary transition-all shadow-sm"
              title="Baixar Backup"
             >
               <Download className="w-5 h-5" />
             </button>
             <button 
              onClick={() => { if(confirm("Deseja deletar e gerar um novo cronograma?")) onUpdate({ ...contest, schedule: undefined }) }}
              className="p-3.5 bg-red-500/5 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
              title="Reiniciar Cronograma"
             >
               <Clock className="w-5 h-5" />
             </button>
           </div>
        </div>
      </header>

      {/* Week Selector */}
      <div className="flex bg-slate-100 border border-border p-1.5 rounded-2xl gap-2 overflow-x-auto no-scrollbar shadow-inner">
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => (
          <button
            key={w}
            onClick={() => setActiveWeek(w)}
            className={cn(
              "px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0",
              activeWeek === w 
                ? "bg-white text-text-main shadow-sm border border-border" 
                : "text-text-sub hover:text-text-main"
            )}
          >
            Semana {w}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentWeekDays.map((d, index) => {
          const dayIdx = (activeWeek - 1) * 7 + index;
          return (
            <motion.div 
              key={dayIdx}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "rise-card p-0 border border-border transition-all duration-500 relative flex flex-col justify-between h-auto min-h-[350px] group overflow-hidden",
                d.completed 
                  ? "bg-slate-50 opacity-60" 
                  : "bg-white hover:border-primary/30"
              )} >
                 <div className="p-6 md:p-8 space-y-8 flex flex-col flex-1">
                <header className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-display text-base font-bold shadow-sm transition-colors duration-500 italic">
                        {d.dayNumber}
                    </div>
                   <span className="text-[10px] font-bold text-text-sub uppercase tracking-widest">DIA</span>
                   </div>
                   {d.completed && <CheckCircle2 className="w-6 h-6 text-accent" />}
                </header>

                <div className="space-y-6 flex-1">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                       <div className="w-1 h-1 rounded-full bg-primary"></div>
                       <span className="text-[10px] font-bold text-text-sub uppercase tracking-widest">Prioridades</span>
                    </div>
                    <div className="space-y-2">
                       <div className="p-3 md:p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-border">
                        <span className="text-[9px] text-text-sub font-bold uppercase tracking-widest block mb-1">Específicas</span>
                        <div className="text-[11px] font-semibold text-text-main leading-relaxed italic whitespace-normal break-words">{d.specificTopic}</div>
                      </div>
                      <div className="p-3 md:p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-border">
                        <span className="text-[9px] text-text-sub font-bold uppercase tracking-widest block mb-1">Básicas</span>
                        <div className="text-[11px] font-semibold text-text-sub leading-relaxed italic whitespace-normal break-words">{d.generalTopic}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border grid grid-cols-2 gap-4 items-end">
                   <div className="space-y-1">
                      <div className="text-xs font-bold text-text-sub uppercase tracking-wider">Cadência</div>
                      <div className="flex items-center gap-1.5 text-text-main">
                         <Target className="w-3.5 h-3.5 text-primary" />
                         <span className="text-xs font-bold">{d.questionGoal} itens</span>
                      </div>
                   </div>
                   <div className="text-right space-y-1">
                      <div className="text-xs font-bold text-text-sub uppercase tracking-wider">Retenção</div>
                      <div className="text-xs font-semibold text-text-sub italic whitespace-normal break-words">{d.revisionTask}</div>
                   </div>
                </div>
              </div>
              <div className="p-4 pt-0">
                <button 
                  onClick={() => toggleDay(dayIdx)}
                  className={cn(
                    "w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border shadow-sm",
                    d.completed 
                      ? "bg-accent/5 text-accent border-accent/20 hover:bg-accent hover:text-white" 
                      : "bg-white dark:bg-zinc-800 text-text-main border-border hover:bg-primary hover:text-white hover:border-primary active:scale-95"
                  )}
                >
                  {d.completed ? 'Revisitar Dia' : 'Finalizar Metas'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ShieldCheck({ className }: { className?: string }) {
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
