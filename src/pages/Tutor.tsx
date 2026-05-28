import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, User, AlertCircle, Loader2, Mic, Volume2, VolumeX, X } from 'lucide-react';
import { SIcon } from '../components/SIcon';
import { Contest } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { chatWithTutor } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import EmptyState from '../components/EmptyState';

interface TutorProps {
  contest?: Contest | null;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function Tutor({ contest }: TutorProps) {
  const { isPro, user, profile } = useAuth();
  const storageKey = `stratis_tutor_messages_${contest?.id || 'global'}`;

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
        content: `Olá! Sou seu expert em estratégia para o cargo de ${contest?.role || 'seu concurso'}. Meu foco é transformar seu planejamento em aprovação. O que vamos ajustar hoje?`
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const [immersiveTimeLeft, setImmersiveTimeLeft] = useState(180); // 3 minutes in seconds
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isImmersiveMode && immersiveTimeLeft > 0) {
      timer = setInterval(() => {
        setImmersiveTimeLeft((prev) => {
          if (prev <= 1) {
            setIsImmersiveMode(false);
            window.speechSynthesis?.cancel();
            if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
            return 180;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isImmersiveMode) {
       if (recognitionRef.current) {
         recognitionRef.current.stop();
       }
    }
    return () => clearInterval(timer);
  }, [isImmersiveMode, immersiveTimeLeft]);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const cleanText = text.replace(/[*_#`\[\]]/g, '').replace(/\n/g, ' ').trim();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    
    const voices = window.speechSynthesis.getVoices();
    const ptVoices = voices.filter(v => v.lang.startsWith('pt'));
    if (ptVoices.length > 0) {
      utterance.voice = ptVoices.find(v => v.name.includes('Google') || v.name.includes('Online')) || ptVoices[0];
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const startImmersiveListening = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Aviso: Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        console.warn('Permissão de microfone negada ou não suportada no ambiente atual (considere abrir em nova aba).');
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.error('Erro de reconhecimento de voz:', event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  useEffect(() => {
    if (!isListening && input.trim() && isImmersiveMode) {
      handleSend();
    }
  }, [isListening]);

  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
    if (isVoiceMode) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  const toggleImmersiveMode = () => {
    const nextMode = !isImmersiveMode;
    setIsImmersiveMode(nextMode);
    if (nextMode) {
      setImmersiveTimeLeft(180);
      setIsVoiceMode(true);
      window.speechSynthesis.cancel();
    } else {
      window.speechSynthesis.cancel();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startListening = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Aviso: Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        console.warn('Permissão de microfone negada ou não suportada no ambiente atual (considere abrir em nova aba).');
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.error('Erro de reconhecimento de voz:', event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!isPro) {
    return (
      <div className="-mx-4 md:-mx-8 -mt-4 md:-mt-8 h-[calc(100dvh-73px)] bg-white md:rounded-tl-[32px] md:border-l md:border-border flex flex-col pt-4 md:pt-8 relative overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6">
            <SIcon className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-text-main mb-4">
            Mentor Stratis Exclusivo
          </h2>
          <p className="text-text-sub max-w-lg mb-8 text-sm">
            O Mentor Stratis analisa seu histórico, cronograma e edital para oferecer mentorias personalizadas e dicas de estudo de alta performance. Faça upgrade para desbloquear.
          </p>
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
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
        subjectsProgress
      };

      const aiResponse = await chatWithTutor(newMessages, contextData);
      
      setMessages(prev => [...prev, { role: 'model', content: aiResponse }]);

      if (isVoiceMode) {
        speakText(aiResponse);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Desculpe, ocorreu um erro ao se conectar com o servidor. Tente novamente mais tarde." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isImmersiveMode && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 z-[200] bg-gradient-to-b from-white via-white to-blue-50 flex flex-col items-center justify-between py-12 px-6"
          >
            <div className="w-full max-w-4xl flex justify-between items-center">
              <button 
                onClick={toggleImmersiveMode}
                className="w-12 h-12 flex items-center justify-center rounded-full text-text-main hover:bg-slate-100 transition-colors"
                title="Sair do modo voz"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col items-center">
                 <span className="text-[10px] font-bold text-text-sub uppercase tracking-widest mb-0.5">Tempo Restante</span>
                 <span className={`font-mono font-bold text-lg ${immersiveTimeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-text-main'}`}>
                   {formatTime(immersiveTimeLeft)}
                 </span>
              </div>

              <button 
                onClick={toggleVoiceMode}
                className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${!isVoiceMode ? 'text-red-500' : 'text-text-main hover:bg-slate-100'}`}
                title="Alternar voz do Mentor"
              >
                {!isVoiceMode ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl space-y-12">
              <motion.div 
                animate={{
                  scale: isLoading ? [1, 1.2, 1] : (isListening ? [1, 1.1, 1] : 1),
                  rotate: isLoading ? 360 : 0
                }}
                transition={{ 
                  duration: isLoading ? 2 : 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative"
              >
                <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-20 rounded-full animate-pulse" />
                <SIcon className={`w-20 h-20 ${isListening ? 'text-blue-500' : 'text-accent'} relative z-10`} />
              </motion.div>
              
              <div className="text-center px-4 w-full">
                <AnimatePresence mode="wait">
                  <motion.h2 
                    key={isLoading ? 'loading' : (isListening ? 'listening' : 'idle')}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-3xl md:text-5xl font-medium text-text-main leading-tight max-w-2xl mx-auto"
                  >
                    {isLoading ? "Pensando..." : (
                       isListening ? (input || "Ouvindo...") : (
                         messages[messages.length - 1]?.role === 'model' 
                           ? messages[messages.length - 1].content 
                           : "Toque no microfone para falar"
                       )
                    )}
                  </motion.h2>
                </AnimatePresence>
              </div>
            </div>

            <div className="w-full max-w-2xl flex justify-center items-center gap-8 pb-8">
              <button 
                onClick={startImmersiveListening}
                disabled={isLoading || !contest}
                className={`min-w-[120px] h-20 px-8 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  isListening 
                    ? 'bg-blue-100 blob text-blue-500 hover:bg-blue-200' 
                    : 'bg-white border border-border/50 text-text-main hover:bg-slate-50'
                }`}
              >
                {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Mic className={`w-8 h-8 ${isListening ? 'animate-pulse' : ''}`} />}
              </button>
            </div>
            
            <style>{`
              .blob {
                box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
                animation: pulse-blob 2s infinite cubic-bezier(0.66, 0, 0, 1);
              }
              @keyframes pulse-blob {
                to { box-shadow: 0 0 0 45px rgba(59, 130, 246, 0); }
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="-mx-4 md:-mx-8 -mt-4 md:-mt-8 h-[calc(100dvh-73px)] bg-white md:rounded-tl-[32px] md:border-l md:border-border flex flex-col pt-4 md:pt-6 relative overflow-hidden">
        <div className="flex-1 overflow-hidden flex flex-col relative w-full items-center">
        {!contest && (
          <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-12 h-12 text-accent/50 mb-4" />
            <h3 className="text-lg font-bold text-text-main mb-2">Importe um Edital</h3>
            <p className="text-sm text-text-sub max-w-md">
              Para focar em suas dúvidas específicas, o Mentor Stratis precisa saber qual edital você está estudando. Vá na aba "Importar Edital" primeiro.
            </p>
          </div>
        )}

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto w-full px-4 md:px-8 space-y-8 pb-10 flex flex-col items-center"
        >
          <div className="w-full max-w-3xl space-y-8">
          {messages.map((msg, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-4 flex-row w-full"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-primary/10 text-primary' : 'bg-accent text-white'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <SIcon className="w-4 h-4" />}
              </div>
              
              <div className="flex flex-col items-start w-full">
                <div className="text-[11px] font-bold text-text-main/60 mb-1">
                  {msg.role === 'user' ? user?.displayName?.split(' ')[0] || 'Você' : 'Mentor Stratis'}
                </div>
                
                <div className={`text-[15px] leading-relaxed w-full ${
                  msg.role === 'user' 
                    ? 'text-text-main font-medium' 
                    : 'text-text-main'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="markdown-body prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-100 prose-pre:text-text-main">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-4 flex-row w-full"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-accent text-white">
                <SIcon className="w-4 h-4" />
              </div>
              <div className="flex flex-col mt-2">
                <div className="flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
          </div>
        </div>

        {/* Input Area */}
        <div className="w-full px-4 md:px-8 pb-4 md:pb-6 flex flex-col items-center bg-white border-t border-border/40 pt-4 z-10 shrink-0">
          <div className="relative w-full max-w-3xl flex items-end gap-2 bg-slate-50 border border-border/60 rounded-[28px] p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
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
              placeholder={contest ? "Escreva sua dúvida aqui..." : "Importe um edital..."}
              className="flex-1 resize-none overflow-y-auto min-h-[40px] max-h-40 bg-transparent text-text-main text-[15px] p-2 outline-none disabled:opacity-50 ml-2"
              rows={1}
              style={{
                height: input ? `${Math.min(160, Math.max(40, input.split('\n').length * 24 + 16))}px` : '40px'
              }}
            />
            <button
               onClick={toggleImmersiveMode}
               className="h-10 w-10 shrink-0 bg-transparent text-text-sub hover:text-accent rounded-full flex items-center justify-center hover:bg-accent/10 active:scale-95 transition-all outline-none"
               title="Modo Voz Imersivo"
            >
               <Mic className="w-5 h-5" />
            </button>
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !contest}
              className="h-10 w-10 shrink-0 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 active:scale-95 disabled:opacity-30 disabled:active:scale-100 transition-all outline-none"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
            </button>
          </div>
          <div className="w-full max-w-3xl text-center mt-2.5">
            <span className="text-[10px] text-text-sub/80 font-medium">
              O Mentor Stratis pode cometer erros. Considere verificar informações importantes no edital.
            </span>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
