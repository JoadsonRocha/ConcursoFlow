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
  PenTool
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
      alert("Erro ao conectar com a IA para gerar o cronograma.");
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

  if (!schedule.length) {
    return (
      <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <header className="text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto text-primary shadow-inner">
            <CalendarDays className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <div className="text-primary font-black text-[10px] uppercase tracking-[0.4em] leading-none mb-4">Arquitetura de Aprendizado</div>
            <h1 className="text-4xl md:text-6xl font-display text-text-main tracking-tighter leading-[0.9]">
              Criar seu <span className="italic text-primary">Plano de Guerra</span>.
            </h1>
            <p className="text-text-sub max-w-lg mx-auto text-lg font-medium pt-4">
              A IA analisará seu edital para distribuir os tópicos de forma inteligente no tempo disponível.
            </p>
          </div>
        </header>

        <section className="bg-white dark:bg-slate-900 border border-border rounded-[3rem] p-10 shadow-xl shadow-primary/5 space-y-10 text-center max-w-lg mx-auto relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
          <div className="space-y-4 relative z-10">
            <label className="text-[10px] font-black text-text-sub uppercase tracking-[0.2em]">Duração Estratégica</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
               {[2, 4, 8, 12].map(w => (
                 <button 
                  key={w}
                  onClick={() => setWeeksCount(w)}
                  className={cn(
                    "px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all",
                    weeksCount === w ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105" : "bg-slate-50 dark:bg-slate-800 text-text-sub border-border hover:border-primary/30"
                  )}
                 >
                   {w} Sem
                 </button>
               ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full relative z-10 bg-text-main text-bg py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-text-main/20 group/btn"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-bg/20 border-t-bg rounded-full animate-spin"></div>
            ) : (
              <>
                <Sparkles className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                Gerar com IA Pro
              </>
            )}
          </button>
        </section>
      </div>
    );
  }

  const currentWeekDays = schedule.slice((activeWeek - 1) * 7, activeWeek * 7);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em]">Cronograma Inteligente</div>
          <h1 className="text-4xl md:text-6xl font-display leading-[0.9] text-text-main tracking-tighter">
            Plano de <span className="italic text-primary">Ação</span>.
          </h1>
          <p className="text-text-sub text-sm font-medium pt-2">{contest.role} · Estratégia IA Ativa</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
           <button 
            onClick={handleShare}
            disabled={sharing || contest.isPublic}
            className={cn(
              "flex-1 md:flex-none px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border",
              contest.isPublic 
                ? "bg-accent/10 border-accent/20 text-accent opacity-70 cursor-default" 
                : "bg-secondary text-white border-secondary hover:scale-[1.02] shadow-lg shadow-secondary/20"
            )}
           >
             {sharing ? (
               <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
             ) : (
               <Share2 className="w-4 h-4" />
             )}
             {contest.isPublic ? 'Público' : 'Publicar'}
           </button>

           <button 
            onClick={exportText}
            className="p-3.5 bg-white dark:bg-slate-900 border border-border rounded-xl text-text-sub hover:bg-slate-50 transition-all shadow-sm"
            title="Exportar TXT"
           >
             <Download className="w-5 h-5" />
           </button>
           <button 
            onClick={() => { if(confirm("Deseja deletar e gerar um novo cronograma?")) onUpdate({ ...contest, schedule: undefined }) }}
            className="p-3.5 bg-red-50 dark:bg-red-500/5 text-red-500 border border-red-500/10 rounded-xl hover:bg-red-100 transition-all shadow-sm"
            title="Resertar Plano"
           >
             <Clock className="w-5 h-5" />
           </button>
        </div>
      </header>

      {/* Week Selector - Responsive Scroll */}
      <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar snap-x scroll-px-4">
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => (
          <button
            key={w}
            onClick={() => setActiveWeek(w)}
            className={cn(
              "px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 snap-center",
              activeWeek === w 
                ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105" 
                : "bg-white dark:bg-slate-900 border-border text-text-sub hover:border-primary/30"
            )}
          >
            Semana {w}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {currentWeekDays.map((d, index) => {
          const dayIdx = (activeWeek - 1) * 7 + index;
          return (
            <motion.div 
              key={dayIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "bg-white dark:bg-slate-900 border rounded-[2.5rem] p-8 transition-all relative group overflow-hidden flex flex-col justify-between",
                d.completed ? "border-accent/30 shadow-inner bg-slate-50" : "border-border hover:border-primary/30 shadow-xl shadow-primary/[0.02]"
              )}
            >
              {d.completed && (
                <div className="absolute top-6 right-6 text-accent animate-in zoom-in duration-500">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <header className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-display font-black">
                      {d.dayNumber}
                   </div>
                   <span className="text-[10px] font-black text-text-sub uppercase tracking-[0.2em]">Dia de Batalha</span>
                </header>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                       <span className="text-[10px] font-black text-text-sub uppercase tracking-widest">Específicos</span>
                    </div>
                    <div className="text-base font-bold text-text-main leading-tight line-clamp-2">{d.specificTopic}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary/60"></div>
                       <span className="text-[10px] font-black text-text-sub uppercase tracking-widest">Gerais</span>
                    </div>
                    <div className="text-base font-bold text-text-main leading-tight line-clamp-2">{d.generalTopic}</div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex items-center justify-between">
                   <div className="space-y-1">
                      <div className="text-[8px] font-black text-text-sub uppercase tracking-widest mb-1">Questões</div>
                      <div className="flex items-center gap-1">
                         <PenTool className="w-3 h-3 text-primary/60" />
                         <span className="text-xs font-black text-text-main">{d.questionGoal} itens</span>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-[8px] font-black text-text-sub uppercase tracking-widest mb-1">Revisão</div>
                      <div className="text-xs font-bold text-text-main line-clamp-1 max-w-[100px]">{d.revisionTask}</div>
                   </div>
                </div>
              </div>

              <button 
                onClick={() => toggleDay(dayIdx)}
                className={cn(
                  "w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mt-8",
                  d.completed ? "bg-accent text-white shadow-lg shadow-accent/20" : "bg-slate-50 dark:bg-slate-800 text-text-sub hover:bg-primary/10 hover:text-primary hover:scale-[1.02]"
                )}
              >
                {d.completed ? 'Vencido' : 'Concluir Dia'}
              </button>
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
