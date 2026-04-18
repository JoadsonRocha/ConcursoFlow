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
        id: `dynamic-${Date.now()}`,
        examDate: examDate,
        dailyGoalHours: dailyHours,
        dailyGoalQuestions: dailyQuestions,
        schedule: schedule,
      };
      
      onImport(dynamicContest);
      setSuccess(true);
      setRawText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar o edital.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header hover-scale="true">
        <h1 className="text-2xl font-bold text-text-main">Configurações & Metas</h1>
        <p className="text-text-sub text-sm">Defina seus objetivos diários e importe novos editais com IA.</p>
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

        <section className="bg-dark-panel p-6 rounded-2xl text-white flex flex-col justify-center">
          <p className="text-sm opacity-80 leading-relaxed italic">
            "O sucesso é a soma de pequenos esforços repetidos dia após dia."
          </p>
          <div className="mt-4 pt-4 border-t border-white/10 text-[10px] font-bold uppercase tracking-widest opacity-60">
            Foco & Disciplina
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <section className="bg-white border border-border rounded-2xl p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-main">Gerenciar Meus Cargos</h2>
                <p className="text-text-sub text-sm">Visualize e apague editais salvos em sua conta.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contests.length === 0 ? (
              <div className="col-span-2 py-10 text-center border-2 border-dashed border-border rounded-2xl text-text-sub text-sm">
                Nenhum edital importado ainda.
              </div>
            ) : (
              contests.map((c) => (
                <div 
                  key={c.id} 
                  className={cn(
                    "p-4 rounded-xl border flex items-center justify-between transition-all",
                    currentContest?.id === c.id ? "bg-primary/5 border-primary/30" : "bg-gray-50 border-border hover:border-primary/20"
                  )}
                >
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-bold text-text-main truncate">{c.role}</h4>
                    <p className="text-[10px] text-text-sub font-medium">{c.subjects.length} Matérias • {(c.schedule || []).length} Dias</p>
                  </div>
                  <button 
                    onClick={() => { if(confirm(`Tem certeza que deseja apagar o edital para ${c.role}?`)) onDelete(c.id); }}
                    className="p-2 text-text-sub hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

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

          <div className="space-y-4">
            <textarea
              className="w-full h-64 bg-gray-50 border border-border rounded-xl p-4 text-sm font-medium focus:ring-2 ring-primary/10 transition-all outline-none resize-none"
              placeholder="Ex: CONCURSO PÚBLICO ESTADUAL... CONTEÚDO PROGRAMÁTICO: Português: Ortografia, Crase. Direito: Constituição..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />

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
            <button 
              onClick={() => { if(confirm("Tem certeza que deseja apagar todos os seus editais e progresso?")) { localStorage.clear(); window.location.reload(); } }}
              className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest"
            >
              Apagar todos os dados locais
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
