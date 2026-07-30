import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { Calendar, Flame, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface StudyCalendarProps {
  dailyHistory: { date: string; hours: number; questions: number }[];
  streak: number;
}

export default function StudyCalendar({ dailyHistory = [], streak }: StudyCalendarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    hours: number;
    questions: number;
    formattedDate: string;
    label: string;
  } | null>(null);

  // Auto-scroll to the end (most recent days/weeks) so green study blocks are always visible on mount
  const scrollToRecent = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  };

  useLayoutEffect(() => {
    scrollToRecent();
  }, []);

  useEffect(() => {
    scrollToRecent();
    const t1 = setTimeout(scrollToRecent, 100);
    const t2 = setTimeout(scrollToRecent, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [dailyHistory]);

  // Parse and build the weeks calendar grid representing the last 365 days
  const weeks = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 364); // Last 365 days (approx. 52 weeks)

    // Align start date to the preceding Sunday
    const startDayOfWeek = startDate.getDay(); // 0 = Sunday, 6 = Saturday
    const adjustedStartDate = new Date(startDate);
    adjustedStartDate.setDate(startDate.getDate() - startDayOfWeek);

    const weeksGrid: {
      date: string;
      hours: number;
      questions: number;
      formattedDate: string;
      label: string;
      dayOfWeek: number;
    }[][] = [];

    const dateMap = new Map<string, { hours: number; questions: number }>();
    dailyHistory.forEach(h => {
      if (h && h.date) {
        dateMap.set(h.date, { hours: h.hours || 0, questions: h.questions || 0 });
      }
    });

    const endDayOfWeek = endDate.getDay();
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setDate(endDate.getDate() + (6 - endDayOfWeek));

    const monthsPT = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    let current = new Date(adjustedStartDate);
    let currentWeek: {
      date: string;
      hours: number;
      questions: number;
      formattedDate: string;
      label: string;
      dayOfWeek: number;
    }[] = [];

    while (current <= adjustedEndDate) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const historyEntry = dateMap.get(dateStr);
      const hours = historyEntry ? historyEntry.hours : 0;
      const questions = historyEntry ? historyEntry.questions : 0;

      const formattedDate = `${day} de ${monthsPT[current.getMonth()]} de ${year}`;
      
      let label = 'Nenhum estudo registrado';
      if (hours > 0 || questions > 0) {
        label = `${hours.toFixed(1)}h estudadas e ${questions} questões resolvidas`;
      }

      currentWeek.push({
        date: dateStr,
        hours,
        questions,
        formattedDate,
        label,
        dayOfWeek: current.getDay()
      });

      if (currentWeek.length === 7) {
        weeksGrid.push(currentWeek);
        currentWeek = [];
      }

      current.setDate(current.getDate() + 1);
    }

    return weeksGrid;
  }, [dailyHistory]);

  // Find month change boundaries to display month headers at the top of the columns
  const monthHeaders = useMemo(() => {
    const headers: { index: number; label: string }[] = [];
    const monthsPT = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    let lastMonth = -1;

    weeks.forEach((week, wIdx) => {
      // Look at the Wednesday of each week to place month label at the center of the column
      const middleDay = week[3];
      if (middleDay) {
        const dateObj = new Date(middleDay.date + 'T12:00:00');
        const currentMonth = dateObj.getMonth();
        if (currentMonth !== lastMonth) {
          headers.push({ index: wIdx, label: monthsPT[currentMonth] });
          lastMonth = currentMonth;
        }
      }
    });

    return headers;
  }, [weeks]);

  // Total studied days in last 365 days
  const activeDaysCount = useMemo(() => {
    let count = 0;
    weeks.forEach(week => {
      week.forEach(day => {
        if (day.hours > 0 || day.questions > 0) {
          count++;
        }
      });
    });
    return count;
  }, [weeks]);

  // Determine standard GitHub-style intensity colors
  const getIntensityClass = (hours: number, questions: number) => {
    if (hours === 0 && questions === 0) {
      return 'bg-slate-100 hover:bg-slate-200 border border-slate-200/40';
    }
    // Level 1: <1 hour or <5 questions
    if (hours <= 1 && questions <= 5) {
      return 'bg-emerald-100 border border-emerald-200/50 hover:scale-110 hover:shadow-sm';
    }
    // Level 2: <= 2.5 hours or <= 15 questions
    if (hours <= 2.5 && questions <= 15) {
      return 'bg-emerald-300 border border-emerald-400/50 hover:scale-110 hover:shadow-sm';
    }
    // Level 3: <= 4.5 hours or <= 30 questions
    if (hours <= 4.5 && questions <= 30) {
      return 'bg-emerald-500 border border-emerald-600/50 hover:scale-110 hover:shadow-sm text-white';
    }
    // Level 4: >4.5 hours or >30 questions
    return 'bg-emerald-700 border border-emerald-800/50 hover:scale-110 hover:shadow-sm text-white';
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-border shadow-sm transition-all hover:shadow-md">
      {/* Title & Interactive Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-50 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-text-main uppercase tracking-wider">
              Mapa de Consistência (Roadmap)
            </h3>
            <p className="text-[10px] text-text-sub font-semibold uppercase tracking-wider mt-0.5">
              Visualização de rotina de estudos nos últimos 365 dias
            </p>
          </div>
        </div>
        
        {/* Dynamic Streak Badge */}
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-xl border border-amber-100 text-amber-700 font-bold text-xs">
          <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
          <span>Sua sequência ativa: {streak} {streak === 1 ? 'dia' : 'dias'}</span>
        </div>
      </div>

      {/* Main Roadmap Grid container */}
      <div className="relative">
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto pb-4 scrollbar-thin flex flex-col min-w-full"
        >
          {/* Month Labels row */}
          <div className="h-5 flex relative mb-1 text-[9px] font-bold text-slate-400 uppercase select-none min-w-[760px]">
            {/* Empty space for day labels */}
            <div className="w-8 shrink-0" />
            <div className="flex-1 flex relative">
              {monthHeaders.map((header, idx) => {
                const leftPos = `${(header.index / weeks.length) * 100}%`;
                return (
                  <span
                    key={idx}
                    className="absolute transition-all"
                    style={{ left: leftPos }}
                  >
                    {header.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Grid Layout: Days labels + columns */}
          <div className="flex gap-1.5 items-start min-w-[760px]">
            {/* Day of Week labels */}
            <div className="flex flex-col gap-[5px] text-[8px] font-bold text-slate-400 uppercase select-none w-8 pt-1 leading-none">
              <span className="h-3 flex items-center">Dom</span>
              <span className="h-3" />
              <span className="h-3 flex items-center">Ter</span>
              <span className="h-3" />
              <span className="h-3 flex items-center">Qui</span>
              <span className="h-3" />
              <span className="h-3 flex items-center">Sáb</span>
            </div>

            {/* Weeks Columns */}
            <div className="flex-1 flex gap-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1 shrink-0">
                  {week.map((day, dIdx) => {
                    const cellColorClass = getIntensityClass(day.hours, day.questions);
                    const isToday = day.date === new Date().toISOString().split('T')[0];
                    return (
                      <div
                        key={dIdx}
                        className={cn(
                          "w-3 h-3 rounded-[3px] transition-all cursor-pointer relative",
                          cellColorClass,
                          isToday && "ring-2 ring-primary ring-offset-1 ring-offset-white"
                        )}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        title={`${day.formattedDate}: ${day.label}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer detailing stats, dynamic hover label & legend */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Dynamic Hover / Active Indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold text-text-sub min-h-6">
          {hoveredDay ? (
            <div className="flex items-center gap-2 text-slate-700 animate-fade-in">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-bold text-text-main">{hoveredDay.formattedDate}:</span>
              <span>{hoveredDay.label}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <Info className="w-3.5 h-3.5" />
              <span>Passe o mouse ou toque nos blocos para detalhar o rendimento diário.</span>
            </div>
          )}
        </div>

        {/* Legend + Totals */}
        <div className="flex items-center justify-between sm:justify-start gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 select-none">
          <div>
            Dias estudados: <span className="text-emerald-600 font-black">{activeDaysCount} / 365</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Menos</span>
            <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-100 border border-slate-200/40" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-100 border border-emerald-200/50" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-300 border border-emerald-400/50" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 border border-emerald-600/50" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-700 border border-emerald-800/50" />
            <span>Mais</span>
          </div>
        </div>
      </div>
    </div>
  );
}
