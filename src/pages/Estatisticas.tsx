import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Trophy, Clock, Target, CheckCircle2, TrendingUp, Calendar as CalendarIcon, BookOpen, Flame } from 'lucide-react';
import { Contest } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { useContestStats } from '../hooks/useContestStats';

interface EstatisticasProps {
  contest: Contest;
}

const COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Estatisticas({ contest }: EstatisticasProps) {
  const stats = useContestStats(contest);
  const { 
    overallProgress, 
    totalTopics, 
    completedTopics, 
    totalHours, 
    totalQuestions, 
    streak, 
    last7Days, 
    subjectProgress 
  } = stats;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-12 overflow-x-hidden">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-4 lg:mt-8 px-4 sm:px-6"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-text-main tracking-tight uppercase flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            Estatísticas
          </h1>
          <p className="text-sm sm:text-base font-medium text-text-sub mt-2 opacity-80">
            Acompanhe seu desempenho e consistência diária.
          </p>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 sm:px-6">
        <KPIBox 
          icon={Target} 
          label="Progresso Geral" 
          value={`${overallProgress}%`} 
          subtext={`${completedTopics} de ${totalTopics} tópicos`}
          color="primary"
        />
        <KPIBox 
          icon={Clock} 
          label="Horas Estudadas" 
          value={`${totalHours.toFixed(1)}h`} 
          subtext="Total acumulado"
          color="emerald"
        />
        <KPIBox 
          icon={CheckCircle2} 
          label="Questões Resolvidas" 
          value={totalQuestions} 
          subtext="No painel"
          color="blue"
        />
        <KPIBox 
          icon={Flame} 
          label="Ofensiva (Dias)" 
          value={streak} 
          subtext="Dias seguidos"
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 sm:px-6">
        
        {/* Gráfico de Horas - Últimos 7 dias */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-sm flex flex-col items-start w-full transition-all hover:shadow-md">
          <h3 className="text-sm font-bold text-text-sub uppercase tracking-widest mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" /> Horas de Estudo (Últimos 7 dias)
          </h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorHoras" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#334155' }}
                />
                <Area type="monotone" dataKey="horas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHoras)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Matérias */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-sm flex flex-col items-start w-full transition-all hover:shadow-md">
          <h3 className="text-sm font-bold text-text-sub uppercase tracking-widest mb-6 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" /> Top Matérias
          </h3>
          
          {subjectProgress.length > 0 ? (
            <div className="w-full space-y-4">
              {subjectProgress.slice(0, 5).map((subj, idx) => (
                <div key={idx} className="w-full">
                  <div className="flex justify-between text-sm mb-1.5 font-bold">
                    <span className="text-text-main line-clamp-1 flex-1 mr-2">{subj.name}</span>
                    <span className="text-primary">{subj.percentage}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
                      style={{ width: `${subj.percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full animate-shimmer" />
                    </div>
                  </div>
                </div>
              ))}
              {subjectProgress.length > 5 && (
                <div className="text-center pt-4 border-t border-slate-100 mt-4 text-xs font-bold uppercase tracking-wider text-text-sub">
                  + {subjectProgress.length - 5} outras matérias
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 w-full text-center py-10 text-text-sub text-sm flex flex-col items-center justify-center">
              <BookOpen className="w-8 h-8 opacity-20 mb-3" />
              Sem matérias cadastradas.
            </div>
          )}
        </div>

        {/* Gráfico de Questões - Últimos 7 dias */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-sm flex flex-col items-start w-full transition-all hover:shadow-md">
          <h3 className="text-sm font-bold text-text-sub uppercase tracking-widest mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-500" /> Questões Resolvidas (Últimos 7 dias)
          </h3>
          <div className="w-full h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dx={-10} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#334155' }}
                />
                <Bar dataKey="questoes" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

function KPIBox({ icon: Icon, label, value, subtext, color }: { icon: any, label: string, value: string | number, subtext: string, color: 'primary' | 'emerald' | 'blue' | 'amber' }) {
  const colorStyles = {
    primary: "text-primary bg-primary/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    blue: "text-blue-500 bg-blue-500/10",
    amber: "text-amber-500 bg-amber-500/10",
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-border flex items-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-md">
      <div className={cn("w-12 h-12 flex items-center justify-center rounded-2xl", colorStyles[color])}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-black text-text-main leading-tight">{value}</div>
        <div className="text-[10px] font-bold text-text-main uppercase tracking-widest leading-tight">{label}</div>
        <div className="text-[10px] font-medium text-text-sub mt-1">{subtext}</div>
      </div>
    </div>
  );
}
