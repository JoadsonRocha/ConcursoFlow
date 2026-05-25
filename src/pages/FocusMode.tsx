import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Play, Pause, Square, 
  Coffee, Timer, CheckCircle2, 
  Settings2, Volume2, VolumeX, Maximize2, Minimize2, ChevronDown, Target
} from 'lucide-react';
import { Contest, ScheduleDay } from '../types';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useContestStats } from '../hooks/useContestStats';

interface FocusModeProps {
  contest: Contest;
  onUpdate: (contest: Contest) => void;
}

type TimerMode = 'work' | 'short_break' | 'long_break';
type TimerDuration = 25 | 50;

export default function FocusMode({ contest, onUpdate }: FocusModeProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const stats = useContestStats(contest);
  const { todayTask } = stats;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState<TimerDuration>(25);
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [totalWorkMinutes, setTotalWorkMinutes] = useState(0); 
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const endTimeRef = useRef<number | null>(null);

  // Synchronize state changes for isActive to update or clear endTimeRef
  useEffect(() => {
    if (isActive) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
    } else {
      endTimeRef.current = null;
    }
  }, [isActive]);

  const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Auto-select standard task on mount if not selected
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subjectParam = params.get('subject');
    if (subjectParam) {
      setSelectedSubject(subjectParam);
    } else if (todayTask && !selectedSubject) {
      setSelectedSubject(todayTask.generalTopic || todayTask.specificTopic || '');
    }
  }, [todayTask]);

  const handleSaveTime = async (minutes: number) => {
    console.log("Saving time:", minutes, "Contest:", !!contest, "User:", !!user);
    if (!user || !contest) {
      console.error("Missing user or contest:", !!user, !!contest);
      return;
    }
    try {
      console.log("Attempting to save history entry...");
      const today = getLocalDateStr(new Date());
      const hoursToAdd = Number((minutes / 60).toFixed(2));
      
      let newHistoryEntry = { 
        date: today, 
        hours: hoursToAdd, 
        questions: 0 
      };
      
      const existingEntryIndex = contest.dailyHistory?.findIndex(h => h && h.date === today) ?? -1;
      let newHistory = [...(contest.dailyHistory || [])];

      if (existingEntryIndex >= 0) {
        newHistory[existingEntryIndex] = {
          ...newHistory[existingEntryIndex],
          hours: Number(((newHistory[existingEntryIndex].hours || 0) + hoursToAdd).toFixed(2)),
        };
      } else {
        newHistory.push(newHistoryEntry);
      }

      // Update subject progress
      let newSubjects = [...(contest.subjects || [])];
      if (selectedSubject && selectedSubject !== 'Estudo Livre') {
        newSubjects = newSubjects.map(sub => {
          if (sub && sub.name === selectedSubject) {
            let extraCompleted = (sub.completedTopics || 0);
            if ((sub.topics?.length || 0) > 0) {
              // Could potentially find an uncompleted topic to mark as done
              const firstUncompleted = sub.topics?.findIndex(t => t && !t.completed);
              if (firstUncompleted !== undefined && firstUncompleted !== -1 && sub.topics) {
                const newTopics = [...sub.topics];
                newTopics[firstUncompleted] = { ...newTopics[firstUncompleted], completed: true };
                return { ...sub, topics: newTopics, completedTopics: newTopics.filter(t => t && t.completed).length };
              }
            } else {
              extraCompleted = Math.min((sub.totalTopics || 1), extraCompleted + 1);
              return { ...sub, completedTopics: extraCompleted };
            }
          }
          return sub;
        });
      }

      console.log("Calling onUpdate with new data...");
      onUpdate({
        ...contest,
        dailyHistory: newHistory,
        subjects: newSubjects
      });
      console.log("onUpdate called successfully.");
    } catch (e) {
      console.error("Error saving focus time:", e);
    }
  };

  // Initialize audio
  useEffect(() => {
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    
    audio.onerror = (e) => {
      console.error("Audio failed to load:", e);
    };

    audioRef.current = audio;
  }, []);

  useEffect(() => {
    try {
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    } catch (e) {
      console.warn("Could not request notification permissions:", e);
    }
  }, []);

  const sendNotification = (title: string, body: string) => {
    try {
      if (!("Notification" in window)) return;
      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/logo.png",
          requireInteraction: true // Keeps notification visible until user interacts on supported platforms
        });
      }
    } catch (e) {
      console.error("Notification failed in environment:", e);
    }
  };

  // Improved audio play (still subject to browser restrictions)
  const playSound = async () => {
    if (soundEnabled && audioRef.current) {
      try {
        if (audioRef.current.error) {
          console.warn("Audio element has error state. Custom play omitted.");
          return;
        }
        // Only attempt to play if audio has data to play
        if (audioRef.current.readyState < 2) { 
          console.warn("Audio not ready to play, readyState:", audioRef.current.readyState);
          return;
        }
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      } catch (err) {
        console.error("Audio play failed:", err);
      }
    }
  };

  const getInitialTime = (m: TimerMode, d: TimerDuration) => {
    if (m === 'work') return d * 60;
    if (m === 'short_break') return 5 * 60;
    if (m === 'long_break') return 15 * 60;
    return 25 * 60;
  };

  useEffect(() => {
    setTimeLeft(getInitialTime(mode, duration));
    setIsActive(false);
  }, [mode, duration]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const handleTimerEnd = () => {
      try {
        // Always play sound when time reaches zero
        playSound();
        setIsActive(false);
        endTimeRef.current = null;
        
        // Auto-transition logic
        if (mode === 'work') {
          sendNotification("Sessão finalizada! 🎉", "Hora de uma pausa. Você mandou bem!");
          const workedMins = duration;
          setTotalWorkMinutes(prev => prev + workedMins);
          
          setMode('short_break');
          handleSaveTime(workedMins);
        } else {
          sendNotification("Pausa finalizada! 🎯", "Hora de voltar ao foco! Vamos lá!");
          setMode('work'); 
        }
      } catch (err) {
        console.error("Error in timer transition/save logic:", err);
      }
    };

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        if (endTimeRef.current) {
          const now = Date.now();
          const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
          
          if (remaining <= 0) {
            setTimeLeft(0);
            handleTimerEnd();
          } else {
            setTimeLeft(remaining);
          }
        } else {
          setTimeLeft(time => {
            if (time <= 1) {
              handleTimerEnd();
              return 0;
            }
            return time - 1;
          });
        }
      }, 500); // Poll twice per second to stay perfectly aligned
    } else if (isActive && timeLeft === 0) {
      handleTimerEnd();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, duration, soundEnabled]);

  // Adjust timing when page visibility changes to maintain absolute precision
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive && endTimeRef.current) {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
        
        if (remaining <= 0) {
          setTimeLeft(0);
          try {
            playSound();
            setIsActive(false);
            endTimeRef.current = null;
            
            if (mode === 'work') {
              sendNotification("Sessão finalizada! 🎉", "Hora de uma pausa. Você mandou bem!");
              const workedMins = duration;
              setTotalWorkMinutes(prev => prev + workedMins);
              
              setMode('short_break');
              handleSaveTime(workedMins);
            } else {
              sendNotification("Pausa finalizada! 🎯", "Hora de voltar ao foco! Vamos lá!");
              setMode('work'); 
            }
          } catch (err) {
            console.error("Error in visibility transition/save logic:", err);
          }
        } else {
          setTimeLeft(remaining);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, mode, duration, soundEnabled]);

  // Keep screen awake while active
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isActive) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        } catch (err: any) {
          if (err.name !== 'NotAllowedError') {
            console.error(`Wake Lock error: ${err}`);
          } else {
            console.warn('Wake Lock is blocked by permissions policy. Keep the tab active to prevent screen from sleeping.');
          }
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLock !== null) {
        try {
          await wakeLock.release();
          wakeLock = null;
        } catch (err) {
          console.error(`Wake Lock release error: ${err}`);
        }
      }
    };

    if (isActive) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [isActive]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getModeColor = (m: TimerMode) => {
    if (m === 'work') return 'text-primary bg-primary/10 border-primary/20';
    if (m === 'short_break') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  };

  const getGradient = (m: TimerMode) => {
    if (m === 'work') return 'from-primary/5 to-transparent';
    if (m === 'short_break') return 'from-emerald-500/5 to-transparent';
    return 'from-blue-500/5 to-transparent';
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(getInitialTime(mode, duration));
  };

  return (
    <div className="w-full bg-bg text-text-main relative flex flex-col min-h-[calc(100vh-140px)] rounded-3xl">
      {/* Abstract Background */}
      <div className={cn("absolute inset-0 rounded-3xl bg-gradient-to-b transition-colors duration-1000 select-none pointer-events-none", getGradient(mode))} />
      
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Timer className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-black text-lg uppercase tracking-wider">Modo Foco</h1>
            <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest">
              Sessão de Estudo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3 text-text-sub hover:text-text-main hover:bg-slate-100 rounded-xl transition-all"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-3 text-text-sub hover:text-text-main hover:bg-slate-100 rounded-xl transition-all hidden sm:block"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              navigate('/');
            }}
            className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 w-full max-w-7xl mx-auto overflow-hidden">
        <div className="w-full h-full flex flex-col md:flex-row gap-4 md:gap-8 items-center justify-center py-2 sm:py-4">
          
          {/* Left Column: Timer */}
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md h-full">
            {/* Mode & Duration Selectors */}
            <div className={cn("w-full flex flex-col gap-2 mb-4 md:mb-6 transition-opacity shrink-0", isActive && "opacity-50 pointer-events-none")}>
              <div className="flex w-full bg-white rounded-2xl p-1.5 border border-border shadow-sm">
                <button 
                  onClick={() => setMode('work')}
                  className={cn(
                    "flex-1 py-2 sm:py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all",
                    mode === 'work' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-sub hover:bg-slate-50 hover:text-text-main"
                  )}
                >
                  Foco
                </button>
                <button 
                  onClick={() => setMode('short_break')}
                  className={cn(
                    "flex-1 py-2 sm:py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all",
                    mode === 'short_break' ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "text-text-sub hover:bg-slate-50 hover:text-text-main"
                  )}
                >
                  Pausa Curta
                </button>
                <button 
                  onClick={() => setMode('long_break')}
                  className={cn(
                    "flex-1 py-2 sm:py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all",
                    mode === 'long_break' ? "bg-blue-500 text-white shadow-md shadow-blue-500/20" : "text-text-sub hover:bg-slate-50 hover:text-text-main"
                  )}
                >
                  Pausa Longa
                </button>
              </div>

              <AnimatePresence>
                {mode === 'work' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: -8 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: -8 }}
                    className="flex w-full bg-white/50 backdrop-blur-sm rounded-2xl p-1.5 border border-slate-200/50"
                  >
                    <button
                      onClick={() => setDuration(25)}
                      className={cn(
                        "flex-1 py-1.5 sm:py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                        duration === 25 ? "bg-white text-primary shadow-sm border border-primary/10" : "text-text-sub hover:text-text-main"
                      )}
                    >
                      25 Minutos
                    </button>
                    <button
                      onClick={() => setDuration(50)}
                      className={cn(
                        "flex-1 py-1.5 sm:py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                        duration === 50 ? "bg-white text-primary shadow-sm border border-primary/10" : "text-text-sub hover:text-text-main"
                      )}
                    >
                      50 Minutos
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Timer Display */}
            <div className="relative w-[55vmin] h-[55vmin] max-w-[360px] max-h-[360px] md:w-[60vmin] md:h-[60vmin] md:max-w-[400px] md:max-h-[400px] flex shrink-0 items-center justify-center mb-4 md:mb-6 group cursor-pointer" onClick={toggleTimer}>
              <svg className="absolute inset-0 w-full h-full -z-10 drop-shadow-sm opacity-50" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" strokeWidth="1.5" stroke="currentColor" className="text-slate-200" />
                <motion.circle 
                  cx="50" 
                  cy="50" 
                  r="48" 
                  fill="none" 
                  strokeWidth="2.5" 
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeDasharray="301.59"
                  strokeDashoffset={301.59 - (301.59 * (timeLeft / getInitialTime(mode, duration)))}
                  className={cn("transition-all duration-1000 ease-linear", mode === 'work' ? "text-primary" : mode === 'short_break' ? "text-emerald-500" : "text-blue-500")}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="text-[15vmin] md:text-[8rem] font-black font-display tracking-tighter leading-none transition-colors group-hover:opacity-90">
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-row items-center gap-4 sm:gap-6 shrink-0 mt-auto md:mt-0">
              <button 
                onClick={toggleTimer}
                className={cn(
                  "w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-transform hover:scale-105 active:scale-95",
                  mode === 'work' ? "bg-primary shadow-primary/30" : mode === 'short_break' ? "bg-emerald-500 shadow-emerald-500/30" : "bg-blue-500 shadow-blue-500/30"
                )}
              >
                {isActive ? <Pause className="w-6 h-6 sm:w-8 sm:h-8 fill-current" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current translate-x-1" />}
              </button>
              
              <button 
                onClick={resetTimer}
                className="w-10 h-10 sm:w-14 sm:h-14 bg-white rounded-full flex items-center justify-center text-text-sub border border-border hover:text-text-main hover:bg-slate-50 transition-all shadow-sm"
              >
                <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </button>
            </div>
          </div>

          {/* Right Column: Info & Settings */}
          <div className="flex-1 flex flex-col justify-center gap-4 sm:gap-6 w-full max-w-md mt-6 md:mt-0 h-full overflow-y-auto hide-scrollbar pb-6 md:pb-0">
            
            {/* Subject Selector Section */}
            <div className={cn("bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-sm flex flex-col items-start text-left w-full relative overflow-visible transition-opacity", isActive && "opacity-50 pointer-events-none")}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
              
              <div className="flex items-center justify-between w-full mb-6">
                 <h3 className="text-[10px] font-bold text-text-sub uppercase tracking-widest flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-primary rounded-full" /> Na sua mesa hoje
                 </h3>
                 <button onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)} className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider bg-transparent border-0">
                    Alterar Disciplina
                 </button>
              </div>
              
              <div className="w-full relative pointer-events-auto">
                {todayTask && !todayTask.completed ? (
                  <div className="space-y-4 w-full">
                    {todayTask.generalTopic && (
                      <button 
                        onClick={() => setSelectedSubject(todayTask.generalTopic || '')}
                        className={cn("w-full text-left p-4 rounded-2xl border transition-all cursor-pointer group", 
                          selectedSubject === todayTask.generalTopic 
                            ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary" 
                            : "bg-slate-50 border-slate-100 hover:border-primary/30"
                        )}
                      >
                        <span className={cn("text-[9px] font-bold uppercase tracking-widest mb-1 block transition-colors",
                           selectedSubject === todayTask.generalTopic ? "text-primary" : "text-text-sub group-hover:text-primary"
                        )}>Geral</span>
                        <div className="font-bold text-text-main leading-snug">{todayTask.generalTopic}</div>
                      </button>
                    )}
                    {todayTask.specificTopic && (
                      <button 
                        onClick={() => setSelectedSubject(todayTask.specificTopic || '')}
                        className={cn("w-full text-left p-4 rounded-2xl border transition-all cursor-pointer group", 
                          selectedSubject === todayTask.specificTopic 
                            ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary" 
                            : "bg-primary/5 border-primary/10 hover:border-primary/30"
                        )}
                      >
                        <span className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1 block">Específico</span>
                        <div className="font-bold text-text-main leading-snug italic">{todayTask.specificTopic}</div>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="py-8 w-full text-center flex flex-col items-center text-text-sub">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3 opacity-50" />
                    <p className="font-bold">Nada pendente no cronograma hoje!</p>
                    <p className="text-sm mt-1">Sessão de foco livre.</p>
                  </div>
                )}
                {/* If selected subject is from dropdown (not today's default tasks) */}
                {selectedSubject && todayTask && selectedSubject !== todayTask.generalTopic && selectedSubject !== todayTask.specificTopic && selectedSubject !== 'Estudo Livre' && (
                  <button 
                    onClick={() => {}}
                    className="w-full text-left p-4 rounded-2xl border bg-primary/5 border-primary shadow-sm ring-1 ring-primary mt-4"
                  >
                    <span className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1 block">Sessão Atual</span>
                    <div className="font-bold text-text-main leading-snug">{selectedSubject}</div>
                  </button>
                )}
                <AnimatePresence>
                  {isSubjectDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-border shadow-2xl p-2 z-[100] max-h-64 overflow-y-auto"
                    >
                      <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-text-sub">Todas as Disciplinas</p>
                      {contest.subjects?.length > 0 ? (
                        contest.subjects.map(sub => (
                           <button
                            key={sub.id}
                            onClick={() => {
                              setSelectedSubject(sub.name);
                              setIsSubjectDropdownOpen(false);
                            }}
                            className={cn("w-full text-left px-3 py-2 text-sm font-medium rounded-xl transition-colors line-clamp-1",
                              selectedSubject === sub.name ? "bg-primary/10 text-primary font-bold" : "text-text-sub hover:bg-slate-50 hover:text-text-main"
                            )}
                           >
                              {sub.name}
                           </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-xs text-slate-400">Nenhuma disciplina encontrada.</p>
                      )}
                      
                      <button
                            onClick={() => {
                              setSelectedSubject('Estudo Livre');
                              setIsSubjectDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 mt-2 border-t border-slate-100 text-sm font-medium text-text-sub hover:bg-slate-50 hover:text-text-main rounded-xl transition-colors line-clamp-1 italic"
                           >
                              Estudo Livre (Sem disciplina específica)
                       </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Foco Acumulado Today */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-sm flex flex-col items-start w-full">
              <h3 className="text-[10px] font-bold text-text-sub uppercase tracking-widest mb-2 flex items-center gap-2">
                <Timer className="w-4 h-4 text-primary" /> Foco Acumulado
              </h3>
              
              <div className="mt-2 w-full flex justify-between items-end">
                <div>
                  <p className="text-3xl font-black text-text-main">{totalWorkMinutes}</p>
                  <p className="text-xs font-bold text-text-sub uppercase tracking-wider">Minutos hoje</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Play className="w-5 h-5 text-primary ml-0.5" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
