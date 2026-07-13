import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { Send, User, AlertCircle, Loader2, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import { SIcon } from '../components/SIcon';
import { Contest } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { chatWithTutor } from '../services/gemini';
import { useContestStats } from '../hooks/useContestStats';
import ReactMarkdown from 'react-markdown';

interface TutorProps {
  contest?: Contest | null;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function Tutor({ contest }: TutorProps) {
  const { isPro, user } = useAuth();
  const stats = useContestStats(contest);

  const paretoMetrics = useMemo(() => {
    if (!contest?.paretoAnalyzed || !contest?.paretoData || !contest?.subjects) {
      return { paretoAnalyzed: false };
    }

    const subjects = contest.subjects || [];

    const normalize = (s: string) => s?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();

    const allTopics: { 
      subjectName: string; 
      topicName: string; 
      score: number;
      label: string;
      isGolden?: boolean;
      completed: boolean;
      revision: boolean;
      questions: boolean;
    }[] = [];

    const paretoSubjects = contest.paretoData.subjects || [];

    paretoSubjects.forEach(aiSub => {
      const aiSubNorm = normalize(aiSub.name || "");
      const realSub = subjects.find(s => s.id === aiSub.id) || 
                      subjects.find(s => normalize(s.name) === aiSubNorm);
      
      if (!realSub) return;

      const topics = aiSub.topics || [];

      topics.forEach(aiTp => {
        const aiTpNorm = normalize(aiTp.name || "");
        const realTp = realSub.topics?.find(t => t.id === aiTp.id) ||
                       realSub.topics?.find(t => normalize(t.name) === aiTpNorm);
        
        if (!realTp) return;

        allTopics.push({
          subjectName: realSub.name,
          topicName: realTp.name,
          score: aiTp.incidenceScore || 0,
          label: aiTp.priorityLabel || 'BÁSICA',
          isGolden: aiSub.goldenPoint === realTp.name,
          completed: realTp.completed || false,
          revision: realTp.revision || false,
          questions: realTp.questions || false
        });
      });
    });

    allTopics.sort((a, b) => b.score - a.score);

    const topTopics = allTopics.filter(t => t.score >= 70);
    const totalTop = topTopics.length;

    if (totalTop === 0) {
      return { paretoAnalyzed: false };
    }

    const completedTeoria = topTopics.filter(t => t.completed).length;
    const completedRevisao = topTopics.filter(t => t.revision).length;
    const completedQuestoes = topTopics.filter(t => t.questions).length;
    const goldenTopics = topTopics.filter(t => t.isGolden);
    const completedGolden = goldenTopics.filter(t => t.completed).length;

    const pendingTopTopics = topTopics
      .filter(t => !t.completed || !t.revision || !t.questions)
      .slice(0, 10)
      .map(t => ({
        subject: t.subjectName,
        topic: t.topicName,
        score: t.score,
        completed: t.completed,
        revision: t.revision,
        questions: t.questions,
        isGolden: t.isGolden
      }));

    return {
      paretoAnalyzed: true,
      stats: {
        totalTopTopics: totalTop,
        teoriaPercent: Math.round((completedTeoria / totalTop) * 100),
        revisaoPercent: Math.round((completedRevisao / totalTop) * 100),
        questoesPercent: Math.round((completedQuestoes / totalTop) * 100),
        goldenTotal: goldenTopics.length,
        goldenCompleted: completedGolden,
        goldenPercent: goldenTopics.length > 0 ? Math.round((completedGolden / goldenTopics.length) * 100) : 0
      },
      pendingTopTopics
    };
  }, [contest]);

  const storageKey = `stratis_tutor_messages_${contest?.id || 'global'}`;

  const defaultGreeting = `Olá! Sou seu expert em estratégia para o cargo de ${contest?.role || 'seu concurso'}. Meu foco é transformar seu planejamento em aprovação de forma cirúrgica e objetiva. O que vamos ajustar em sua jornada hoje?`;

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved messages", e);
      }
    }
    return [
      {
        role: 'model',
        content: defaultGreeting
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!isPro) {
    return (
      <div className="absolute inset-0 bg-white lg:rounded-tl-[32px] lg:border-l lg:border-border flex flex-col pt-4 lg:pt-8 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6">
            <SIcon className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-text-main mb-4">
            Mentor Stratis Exclusivo
          </h2>
          <p className="text-text-sub max-w-lg mb-8 text-sm">
            O Mentor Stratis analisa seu histórico, cronograma e edital para oferecer mentorias estratégicas personalizadas e dicas de estudo de alta performance. Faça upgrade para desbloquear.
          </p>
        </div>
      </div>
    );
  }

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isLoading) return;

    if (!messageText) {
      setInput('');
    }
    
    const newMessages = [...messages, { role: 'user' as const, content: textToSend }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const recentHistory = contest?.dailyHistory?.slice(-10) || [];
      const subjectsProgress = contest?.subjects?.map(s => ({
        subject: s.name,
        completedTopics: s.topics?.filter(t => t.completed).length || 0,
        totalTopics: s.topics?.length || 0,
      })) || [];

      const contextData = {
        role: contest?.role,
        banca: contest?.banca,
        recentHistory,
        subjectsProgress,
        streak: stats.streak,
        totalStudiedDays: stats.totalStudiedDays,
        mostProductiveDay: stats.mostProductiveDay,
        projectedCompletionDate: stats.projectedCompletionDate,
        daysRemainingForCompletion: stats.daysRemainingForCompletion,
        weeklyAverageHours: stats.weeklyAverageHours,
        weeklyAverageQuestions: stats.weeklyAverageQuestions,
        goalComplianceRate: stats.goalComplianceRate,
        meppComplianceRate: stats.meppComplianceRate,
        totalHours: stats.totalHours,
        totalQuestions: stats.totalQuestions,
        paretoMetrics
      };

      const aiResponse = await chatWithTutor(newMessages, contextData);
      setMessages(prev => [...prev, { role: 'model', content: aiResponse }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Desculpe, ocorreu um erro ao se conectar com o servidor. Tente novamente mais tarde." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm("Deseja limpar todo o histórico de conversa com o Mentor?")) {
      setMessages([
        {
          role: 'model',
          content: defaultGreeting
        }
      ]);
    }
  };

  return (
    <div className="absolute inset-0 bg-[#F8FAFC] lg:rounded-tl-[32px] lg:border-l lg:border-slate-200/60 flex flex-col overflow-hidden">
      
      {/* Dynamic Subheader top information */}
      <div className="w-full bg-white border-b border-slate-200/60 py-3 px-4 md:px-8 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-sm">
              <SIcon className="w-5 h-5 text-primary" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Mentor Stratis</h4>
              <span className="text-[8px] font-extrabold text-[#5C7187] uppercase tracking-wider flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Disponível
              </span>
            </div>
            <p className="text-[10px] text-text-sub font-semibold">
              {contest ? `Inteligência Estratégica • ${contest.role}` : 'Estrategista para Concursos'}
            </p>
          </div>
        </div>

        {messages.length > 1 && (
          <button
            onClick={handleClearHistory}
            className="inline-flex items-center gap-1 text-[9px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-all active:scale-95 cursor-pointer"
            title="Limpar histórico"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Limpar Chat</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative w-full items-center">
        {!contest && (
          <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Estratégia sem Alvo?</h3>
            <p className="text-sm text-slate-500 max-w-md font-medium leading-relaxed">
              Para o Mentor Stratis agir com precisão cirúrgica, ele precisa conhecer seu campo de batalha. Importe seu edital na aba principal para liberar as mentorias táticas.
            </p>
          </div>
        )}

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto w-full px-4 md:px-8 space-y-6 pb-12 flex flex-col items-center pt-6 scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200"
        >
          <div className="w-full max-w-4xl space-y-7">
            {messages.map((msg, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-4 flex-row w-full ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role !== 'user' && (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary border border-primary/20 shadow-sm mt-1">
                    <SIcon className="w-5 h-5" />
                  </div>
                )}
                
                <div className={`flex flex-col max-w-[92%] sm:max-w-[88%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="text-[9px] uppercase tracking-widest font-black text-[#5C7187] mb-1.5 px-1 opacity-80">
                    {msg.role === 'user' ? user?.displayName?.split(' ')[0] || 'Você' : 'Mentor Stratis'}
                  </div>
                  
                  <div className={`text-[14.5px] leading-relaxed p-4.5 rounded-[24px] shadow-sm border ${
                    msg.role === 'user' 
                      ? 'bg-slate-800 border-slate-700 text-white font-medium rounded-tr-none' 
                      : 'bg-white border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap !text-white leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="markdown-body prose prose-slate prose-sm max-w-none prose-p:leading-relaxed prose-p:mb-3 prose-p:last-of-type:mb-0 prose-ul:list-disc prose-li:my-1 prose-strong:text-amber-600 prose-strong:font-bold">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-slate-200 text-slate-700 border border-slate-300 mt-1">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4 flex-row w-full justify-start"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary mt-1">
                  <SIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-start">
                  <div className="text-[9px] uppercase tracking-widest font-black text-[#5C7187] mb-1.5 px-1">
                    Mentor Stratis
                  </div>
                  <div className="bg-white border border-slate-200 p-4.5 rounded-[24px] rounded-tl-none flex gap-1.5 items-center justify-center shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Início Rápido / Sugestões Estratégicas se estiver no início */}
            {messages.length <= 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full pt-4"
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h4 className="text-[10px] font-black text-[#5C7187] uppercase tracking-wider">Clique para iniciar um ajuste tático:</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      label: "Regra de Pareto",
                      desc: "Quais tópicos mais caem e como devo focar na reta final do edital?",
                      text: "Quais tópicos desse edital merecem maior prioridade usando a Regra de Pareto para reta final?"
                    },
                    {
                      label: "Método de Revisão Eficiente",
                      desc: "Como revisar matérias sem gastar horas lendo resumos longos?",
                      text: "Qual é a melhor estratégia de revisão para a minha banca, sem perder tempo gerando resumos longos?"
                    },
                    {
                      label: "Tópicos de Baixo Rendimento",
                      desc: "Como recuperar o atraso em matérias que estou errando questões?",
                      text: "Como reajustar meus estudos imediatos se sinto que estou rendendo abaixo da média nas questões?"
                    },
                    {
                      label: "Ajuste de Cronograma",
                      desc: "Como conciliar o edital extenso com o tempo livre que tenho?",
                      text: "Como adaptar meu cronograma para garantir mais produtividade no tempo livre?"
                    }
                  ].map((card, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(card.text);
                      }}
                      className="bg-white hover:bg-slate-50 border border-slate-200/60 hover:border-[#1E293B] p-4 rounded-2xl text-left transition-all shadow-xs flex flex-col justify-between group cursor-pointer active:scale-98"
                    >
                      <div className="space-y-1">
                        <span className="font-extrabold text-[12px] text-slate-800 group-hover:text-primary transition-colors block">
                          {card.label}
                        </span>
                        <span className="text-[10px] text-text-sub font-semibold leading-relaxed block">
                          {card.desc}
                        </span>
                      </div>
                      <div className="mt-3.5 flex items-center gap-1.5 text-[9px] font-black text-amber-600 uppercase tracking-widest transition-opacity">
                        <span>Preencher Pergunta</span>
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="w-full px-4 md:px-8 pb-4 md:pb-6 flex flex-col items-center bg-white border-t border-slate-100 pt-4 z-10 shrink-0 shadow-sm">
          <div className="relative w-full max-w-3xl flex items-end gap-2 bg-[#F1F5F9] border border-slate-200 rounded-[24px] p-2 focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary/20 focus-within:bg-white transition-all">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading || !contest}
              placeholder={contest ? "Escreva sua dúvida aqui sobre sua estratégia de estudos..." : "Importe um edital para liberar o mentor..."}
              className="flex-1 resize-none overflow-y-auto min-h-[40px] max-h-40 bg-transparent text-slate-800 text-[14px] p-2 outline-none disabled:opacity-50 ml-2"
              rows={1}
              style={{
                height: input ? `${Math.min(160, Math.max(40, input.split('\n').length * 24 + 16))}px` : '40px'
              }}
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading || !contest}
              className="h-10 w-10 shrink-0 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/95 active:scale-95 disabled:opacity-30 disabled:active:scale-100 transition-all outline-none cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
            </button>
          </div>
          <div className="w-full max-w-3xl flex flex-col sm:flex-row items-center justify-between mt-2.5 px-2 gap-2">
            <span className="text-[10px] text-[#5C7187] font-medium text-center sm:text-left">
              O Mentor Stratis é focado em estratégias de planejamento e cronograma. Ele comete erros, confirme dados no edital oficial.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
