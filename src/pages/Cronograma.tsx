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
  Users
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
      
      const sharedData = {
        ...contest,
        id: sharedId,
        ownerId: user.uid,
        ownerName: user.displayName || user.email?.split('@')[0] || 'Concurseiro',
        isPublic: true,
        likesCount: contest.likesCount || 0,
        updatedAt: serverTimestamp(),
      };

      if (!sharedData.createdAt) {
        sharedData.createdAt = serverTimestamp();
      }

      await setDoc(sharedRef, sharedData);
      
      // Update local contest state to mark as public
      onUpdate({ ...contest, isPublic: true });
      
      alert("Cronograma compartilhado com sucesso na Comunidade! 🚀");
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
      alert("Erro ao compartilhar. Verifique suas permissões.");
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
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
            <CalendarDays className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-text-main">Criar Cronograma de Estudos</h1>
          <p className="text-text-sub max-w-lg mx-auto">
            A IA vai analisar todo o conteúdo programático do edital e distribuir as matérias em um ciclo de estudos inteligente.
          </p>
        </header>

        <section className="bg-white dark:bg-card-bg border border-border rounded-3xl p-8 shadow-sm space-y-6 text-center max-w-md mx-auto">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-sub uppercase tracking-widest">Duração do Cronograma</label>
            <div className="flex items-center justify-center gap-4">
               {[2, 4, 8, 12].map(w => (
                 <button 
                  key={w}
                  onClick={() => setWeeksCount(w)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold border transition-all",
                    weeksCount === w ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-bg text-text-sub border-border hover:border-primary/50"
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
            className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition-all shadow-xl shadow-primary/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Gerar Cronograma IA
              </>
            )}
          </button>
        </section>
      </div>
    );
  }

  const currentWeekDays = schedule.slice((activeWeek - 1) * 7, activeWeek * 7);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-black text-text-main">Plano de Guerra: {contest.role}</h1>
          <p className="text-text-sub text-sm">Cronograma personalizado gerado via IA.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
           <button 
            onClick={handleShare}
            disabled={sharing || contest.isPublic}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border",
              contest.isPublic 
                ? "bg-accent/10 border-accent/20 text-accent opacity-70 cursor-default" 
                : "bg-secondary text-white border-secondary hover:scale-105 active:scale-95 shadow-lg shadow-secondary/20"
            )}
           >
             {sharing ? (
               <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
             ) : (
               <Share2 className="w-4 h-4" />
             )}
             {contest.isPublic ? 'Já na Comunidade' : 'Publicar na Comunidade'}
           </button>

           <button 
            onClick={exportText}
            className="bg-white dark:bg-card-bg border border-border px-4 py-2 rounded-xl text-xs font-bold text-text-sub flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-bg transition-colors"
           >
             <Download className="w-4 h-4" />
             Exportar TXT
           </button>
           <button 
            onClick={() => { if(confirm("Deseja deletar e gerar um novo cronograma?")) onUpdate({ ...contest, schedule: undefined }) }}
            className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-red-500/20 transition-colors"
           >
             Novo Plano
           </button>
        </div>
      </header>

      <nav className="flex justify-center flex-wrap gap-2">
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => (
          <button
            key={w}
            onClick={() => setActiveWeek(w)}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-bold transition-all border",
              activeWeek === w ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white dark:bg-card-bg border-border text-text-sub hover:border-primary/50"
            )}
          >
            Semana {w}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentWeekDays.map((d, index) => {
          const dayIdx = (activeWeek - 1) * 7 + index;
          return (
            <motion.div 
              key={dayIdx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "bg-card-bg border rounded-2xl p-6 transition-all relative group overflow-hidden",
                d.completed ? "border-accent/40 shadow-inner" : "border-border hover:border-primary/40 shadow-sm"
              )}
            >
              {d.completed && (
                <div className="absolute top-4 right-4 text-accent animate-in zoom-in duration-300">
                  <CheckCircle2 className="w-6 h-6 fill-accent/10" />
                </div>
              )}

              <div className="space-y-5">
                <header>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Dia {d.dayNumber}</span>
                </header>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-tight">
                       <ShieldCheck className="w-3.5 h-3.5" />
                       Específicos
                    </div>
                    <div className="text-sm font-bold text-text-main leading-tight">{d.specificTopic}</div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-tight">
                       <BookOpen className="w-3.5 h-3.5" />
                       Gerais
                    </div>
                    <div className="text-sm font-bold text-text-main leading-tight">{d.generalTopic}</div>
                  </div>
                </div>

                <footer className="pt-4 border-t border-border mt-2 grid grid-cols-2 gap-2">
                   <div className="bg-bg rounded-lg p-2 text-center">
                      <div className="text-[8px] font-bold text-text-sub uppercase">Questões</div>
                      <div className="text-[10px] font-bold text-text-main">{d.questionGoal}</div>
                   </div>
                   <div className="bg-bg rounded-lg p-2 text-center">
                      <div className="text-[8px] font-bold text-text-sub uppercase">Revisão</div>
                      <div className="text-[10px] font-bold text-text-main line-clamp-1">{d.revisionTask}</div>
                   </div>
                </footer>

                <button 
                  onClick={() => toggleDay(dayIdx)}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-xs font-bold transition-all mt-2",
                    d.completed ? "bg-accent text-white" : "bg-bg text-text-sub hover:bg-primary/10 hover:text-primary border border-border group-hover:border-primary/30"
                  )}
                >
                  {d.completed ? 'Dia Concluído!' : 'Marcar como Feito'}
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
