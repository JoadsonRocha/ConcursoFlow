import { useState } from 'react';
import { BrainCircuit, Upload, Sparkles, AlertCircle, CheckCircle2, Calendar, Trash2 } from 'lucide-react';
import { parseEdital, generateSchedule } from '../services/gemini';
import { Contest } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <label className="block text-xs font-bold text-text-sub mb-2">DATA DA PROVA</label>
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

      <section className="bg-slate-900 dark:bg-slate-950 p-6 rounded-3xl text-white flex flex-col justify-between border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
          <Sparkles className="w-32 h-32 text-primary" />
        </div>
        <div className="relative z-10">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">Arquiteto de Estudos</div>
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary border border-white/10">
                <BrainCircuit className="w-6 h-6" />
             </div>
             <div className="space-y-0.5">
                <div className="text-lg font-display text-white">Pronto para a Nomeação?</div>
                <div className="text-[10px] text-white/50 font-black uppercase tracking-widest italic">A disciplina é a base de tudo</div>
             </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center relative z-10">
           <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Membro Premium Stratis</span>
           <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        </div>
      </section>
    </div>

    <div className="grid grid-cols-1 gap-6">
      <section className="bg-white border border-border rounded-2xl p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-main">Gerador de Edital Verticalizado</h2>
            <p className="text-text-sub text-sm">Cole o conteúdo programático abaixo para que a IA crie seu checklist.</p>
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

            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-sub uppercase tracking-widest">Conteúdo Programático (Edital)</label>
              <textarea
                className="w-full h-64 bg-gray-50 border border-border rounded-xl p-4 text-sm font-medium focus:ring-2 ring-primary/10 transition-all outline-none resize-none"
                placeholder="Cole aqui o texto do edital para que a IA identifique as matérias e organize seus estudos..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
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
