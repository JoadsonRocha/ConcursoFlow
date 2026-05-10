import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Target, 
  Zap, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Search, 
  Calendar, 
  Award,
  Sparkles,
  Database,
  Smartphone,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Landing = () => {
  const { login, loginEmail, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginEmail(email, password);
      } else {
        await signup(email, password, name);
      }
    } catch (err: any) {
      console.error(err);
      let msg = 'Erro ao processar autenticação';
      if (err.code === 'auth/user-not-found') msg = 'Usuário não encontrado';
      if (err.code === 'auth/wrong-password') msg = 'Senha incorreta';
      if (err.code === 'auth/email-already-in-use') msg = 'Este e-mail já está em uso';
      if (err.code === 'auth/weak-password') msg = 'A senha deve ter pelo menos 6 caracteres';
      if (err.code === 'auth/invalid-email') msg = 'E-mail inválido';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const signInGoogle = async () => {
    setError('');
    try {
      await login();
    } catch (err: any) {
      console.error(err);
      let msg = 'Erro ao entrar com Google';
      if (err.code === 'auth/popup-closed-by-user') msg = 'O login foi cancelado';
      setError(msg);
    }
  };

  const features = [
    {
      icon: BrainCircuit,
      title: "Verticalização via IA",
      description: "Transforme qualquer edital PDF em uma grade de estudos organizada automaticamente pela nossa inteligência artificial.",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: Calendar,
      title: "Cronograma Inteligente",
      description: "Receba um plano de estudos dia a dia baseado nas suas matérias, incidência e tempo disponível.",
      color: "bg-secondary/10 text-secondary"
    },
    {
      icon: Target,
      title: "Microaprendizado",
      description: "Gere flashcards e resumos focados no que realmente cai, otimizando sua memorização.",
      color: "bg-accent/10 text-accent"
    },
    {
      icon: Users,
      title: "Comunidade Ativa",
      description: "Compartilhe seus planos de estudo e favorite grades criadas por outros aprovados.",
      color: "bg-indigo-500/10 text-indigo-500"
    }
  ];

  return (
    <div className="min-h-screen bg-bg selection:bg-primary/30">
      {/* Header/Nav */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
        isScrolled ? "bg-white/80 dark:bg-card-bg/80 backdrop-blur-xl border-b border-border" : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-text-main tracking-tighter">
              Stratis
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-text-sub hover:text-primary transition-colors">Recursos</a>
            <a href="#community" className="text-sm font-bold text-text-sub hover:text-primary transition-colors">Comunidade</a>
            <button 
              onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              Começar Agora
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-gradient-radial from-primary/10 via-transparent to-transparent -z-10 blur-[120px]"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] -z-10 animate-pulse"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm shadow-primary/5">
              <Zap className="w-4 h-4 fill-primary" />
              Gestão de Estudos com IA
            </div>
            <h1 className="text-5xl md:text-8xl lg:text-9xl font-display text-text-main leading-[0.85] tracking-tighter mix-blend-multiply dark:mix-blend-normal">
              Sua aprovação com <br />
              <span className="text-primary italic relative inline-block">
                Stratis
                <svg className="absolute -bottom-2 left-0 w-full h-4 text-secondary/30 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 25 0 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
                </svg>
              </span>.
            </h1>
            <p className="text-lg md:text-2xl text-text-sub font-medium leading-relaxed max-w-2xl mx-auto pt-4">
              A ferramenta definitiva para concurseiros de elite. Organize editais, crie cronogramas e memorize com IA.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-6 w-full max-w-md"
          >
            <button 
               onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
               className="flex-1 bg-text-main text-bg px-8 py-5 rounded-3xl text-sm font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-text-main/10 flex items-center justify-center gap-3 group"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
               onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
               className="flex-1 bg-white dark:bg-card-bg border border-border text-text-main px-8 py-5 rounded-3xl text-sm font-black uppercase tracking-widest hover:bg-bg transition-all"
            >
              Ver Recursos
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="w-full pt-12"
          >
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-[3rem] blur-2xl -z-10 opacity-50"></div>
              <div className="glass-card rounded-[2.5rem] overflow-hidden p-3 shadow-2xl">
                <div className="bg-bg/50 dark:bg-slate-900/50 rounded-[2rem] border border-border/50 overflow-hidden">
                   <div className="h-10 bg-white/50 dark:bg-slate-800/50 border-b border-border/50 flex items-center justify-between px-6">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                        <div className="w-3 h-3 rounded-full bg-slate-100 dark:bg-slate-700"></div>
                      </div>
                      <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                      <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                   </div>
                   <div className="h-[400px] md:h-[500px] flex">
                      <div className="w-64 border-r border-border/50 hidden md:block p-6 space-y-6">
                        <div className="h-4 w-24 bg-primary/20 rounded-full"></div>
                        <div className="space-y-3">
                          {[1,2,3,4,5].map(i => <div key={i} className="h-8 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>)}
                        </div>
                      </div>
                      <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-6">
                            <div className="h-40 w-full bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] border border-indigo-100 dark:border-indigo-800/30"></div>
                            <div className="h-24 w-full bg-slate-50 dark:bg-slate-800/30 rounded-[2rem]"></div>
                         </div>
                         <div className="space-y-6">
                            <div className="h-24 w-full bg-slate-50 dark:bg-slate-800/30 rounded-[2rem]"></div>
                            <div className="h-40 w-full bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] border border-emerald-100 dark:border-emerald-800/30"></div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section with Technical Grid */}
      <section className="py-24 border-y border-border overflow-hidden bg-white/50 dark:bg-slate-900/30">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 relative">
            <div className="absolute inset-y-0 left-1/4 w-[1px] bg-border hidden md:block"></div>
            <div className="absolute inset-y-0 left-2/4 w-[1px] bg-border hidden md:block"></div>
            <div className="absolute inset-y-0 left-3/4 w-[1px] bg-border hidden md:block"></div>
            
            <div className="p-8 space-y-2 group">
               <div className="text-5xl font-display text-text-main group-hover:text-primary transition-colors">100%</div>
               <div className="text-[10px] font-black text-text-sub uppercase tracking-[0.2em]">Automatizado</div>
            </div>
            <div className="p-8 space-y-2 group border-l md:border-l-0 border-border">
               <div className="text-5xl font-display text-primary">+200</div>
               <div className="text-[10px] font-black text-text-sub uppercase tracking-[0.2em]">Editais Ativos</div>
            </div>
            <div className="p-8 space-y-2 group border-t md:border-t-0 border-border">
               <div className="text-5xl font-display text-text-main group-hover:text-secondary transition-colors">24/7</div>
               <div className="text-[10px] font-black text-text-sub uppercase tracking-[0.2em]">Mentoria IA</div>
            </div>
            <div className="p-8 space-y-2 group border-t border-l md:border-t-0 border-border">
               <div className="text-5xl font-display text-accent">5x</div>
               <div className="text-[10px] font-black text-text-sub uppercase tracking-[0.2em]">Foco & Retenção</div>
            </div>
         </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-40 px-6 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
             <div className="space-y-4 max-w-xl">
                <div className="text-primary font-black text-[10px] uppercase tracking-[0.3em]">Recursos de Ponta</div>
                <h2 className="text-5xl md:text-6xl font-display leading-[0.9] text-text-main tracking-tighter">
                   Toda a tecnologia a favor da sua <span className="italic text-secondary">aprovação</span>.
                </h2>
             </div>
             <p className="text-text-sub font-medium max-w-sm text-lg leading-relaxed">
                Desenvolvemos ferramentas exclusivas que transformam a maneira como você estuda para concursos.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-8">
             {/* Feature 1: Large Bento */}
             <div className="md:col-span-6 lg:col-span-8 bg-white dark:bg-slate-900 border border-border p-10 rounded-[3rem] shadow-sm hover:shadow-xl hover:border-primary/20 transition-all flex flex-col justify-between group overflow-hidden relative min-h-[400px]">
                <div className="relative z-10 space-y-4">
                   <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <BrainCircuit className="w-8 h-8" />
                   </div>
                   <h3 className="text-3xl font-display text-text-main">Verticalização via IA</h3>
                   <p className="text-text-sub max-w-sm text-lg font-medium">Transforme qualquer edital PDF em uma grade de estudos organizada automaticamente.</p>
                </div>
                <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-primary/5 rounded-tl-[4rem] border-t border-l border-primary/10 overflow-hidden">
                   <div className="p-8 space-y-4">
                      <div className="h-6 w-full bg-primary/10 rounded-lg"></div>
                      <div className="h-6 w-3/4 bg-primary/10 rounded-lg"></div>
                      <div className="h-6 w-full bg-primary/10 rounded-lg"></div>
                   </div>
                </div>
             </div>

             {/* Feature 2 */}
             <div className="md:col-span-3 lg:col-span-4 bg-secondary/5 border border-secondary/10 p-10 rounded-[3rem] flex flex-col justify-between hover:border-secondary/30 transition-all group">
                <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary group-hover:rotate-12 transition-transform">
                   <Calendar className="w-7 h-7" />
                </div>
                <div className="space-y-3">
                   <h3 className="text-2xl font-display text-text-main">Cronograma Inteligente</h3>
                   <p className="text-text-sub text-sm font-medium">Planos de estudo dinâmicos baseados na sua disponibilidade real.</p>
                </div>
             </div>

             {/* Feature 3 */}
             <div className="md:col-span-3 lg:col-span-4 bg-accent/5 border border-accent/10 p-10 rounded-[3rem] flex flex-col justify-between hover:border-accent/30 transition-all group">
                <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                   <Target className="w-7 h-7" />
                </div>
                <div className="space-y-3">
                   <h3 className="text-2xl font-display text-text-main">Microaprendizado</h3>
                   <p className="text-text-sub text-sm font-medium">Flashcards e resumos gerados automaticamente a partir do conteúdo.</p>
                </div>
             </div>

             {/* Feature 4: Long Bento */}
             <div className="md:col-span-6 lg:col-span-8 bg-slate-900 dark:bg-slate-900 border border-slate-800 p-10 rounded-[3rem] flex flex-col md:flex-row items-center gap-10 hover:border-primary/50 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
                <div className="flex-1 space-y-4">
                   <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                      <Users className="w-7 h-7" />
                   </div>
                   <h3 className="text-3xl font-display text-white">Comunidade Global</h3>
                   <p className="text-slate-400 text-lg font-medium">Conecte-se com milhares de aprovados e acesse editais compartilhados.</p>
                   <button className="bg-white text-slate-900 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform">Explorar agora</button>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3 relative z-10">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/10 p-4 transition-transform group-hover:scale-105" style={{ transitionDelay: `${i * 100}ms` }}>
                        <div className="w-8 h-8 rounded-full bg-white/10 mb-2"></div>
                        <div className="h-2 w-full bg-white/20 rounded-full"></div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Community Preview */}
      <section id="community" className="py-32 bg-bg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
           <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Users className="w-4 h-4" />
                Inteligência Coletiva
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-text-main leading-tight tracking-tighter">
                O maior repositório de <span className="text-indigo-500 italic">editais</span> do Brasil.
              </h2>
              <p className="text-lg text-text-sub font-medium leading-relaxed">
                Não comece do zero. Acesse grades verticalizadas por aprovados para tribunais, carreiras policiais, TI e muito mais.
              </p>
              <div className="space-y-4">
                 {[
                   "Grades avaliadas pela comunidade",
                   "Favoritos sincronizados na nuvem",
                   "Estatísticas de incidência atualizadas"
                 ].map((t, i) => (
                   <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-500/10 text-green-500 rounded-lg flex items-center justify-center">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-bold text-text-main">{t}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 rotate-2 lg:rotate-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white dark:bg-card-bg border border-border p-6 rounded-[32px] shadow-xl space-y-4">
                   <div className="h-3 w-20 bg-primary/20 rounded"></div>
                   <div className="h-4 w-32 bg-text-main/10 rounded"></div>
                   <div className="pt-4 border-t border-border flex justify-between items-center">
                      <div className="flex -space-x-2">
                        {[1,2,3].map(j => <div key={j} className="w-6 h-6 rounded-full border border-white bg-bg"></div>)}
                      </div>
                      <div className="text-[10px] font-bold text-text-sub">82 aprovados</div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth-section" className="py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
           <div className="space-y-6">
              <h2 className="text-4xl md:text-6xl font-black text-text-main leading-tight tracking-tighter">
                Pronto para <span className="text-primary">mudar</span> o jogo?
              </h2>
              <p className="text-lg text-text-sub font-medium max-w-md">
                Junte-se a milhares de candidatos que já utilizam a IA para acelerar sua preparação.
              </p>
           </div>

           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="bg-white dark:bg-card-bg p-8 md:p-12 rounded-[48px] border border-border shadow-2xl shadow-primary/10 relative overflow-hidden group"
           >
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>
             
             <div className="flex gap-4 mb-10">
                <button 
                  onClick={() => setIsLogin(true)}
                  className={cn(
                    "flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-2xl transition-all",
                    isLogin ? "bg-bg text-text-main shadow-sm" : "text-text-sub hover:bg-bg/50"
                  )}
                >
                  Entrar
                </button>
                <button 
                  onClick={() => setIsLogin(false)}
                  className={cn(
                    "flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-2xl transition-all",
                    !isLogin ? "bg-bg text-text-main shadow-sm" : "text-text-sub hover:bg-bg/50"
                  )}
                >
                  Cadastrar
                </button>
             </div>

             <form onSubmit={handleSubmit} className="space-y-6">
               <AnimatePresence mode="wait">
                 {!isLogin && (
                   <motion.div 
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     exit={{ opacity: 0, height: 0 }}
                     className="space-y-1.5 overflow-hidden"
                   >
                     <label className="text-[10px] font-black text-text-sub uppercase tracking-widest ml-1">Nome Completo</label>
                     <div className="relative">
                       <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub" />
                       <input 
                         type="text"
                         required
                         placeholder="Seu nome"
                         value={name}
                         onChange={(e) => setName(e.target.value)}
                         className="w-full bg-bg border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 ring-primary/20 outline-none transition-all"
                       />
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>

               <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-text-sub uppercase tracking-widest ml-1">E-mail</label>
                 <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub" />
                   <input 
                     type="email"
                     required
                     placeholder="seu@email.com"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full bg-bg border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 ring-primary/20 outline-none transition-all"
                   />
                 </div>
               </div>

               <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-text-sub uppercase tracking-widest ml-1">Senha</label>
                 <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub" />
                   <input 
                     type="password"
                     required
                     placeholder="••••••••"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full bg-bg border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 ring-primary/20 outline-none transition-all"
                   />
                 </div>
               </div>

               {error && (
                 <motion.div 
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold leading-tight"
                 >
                   <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                   {error}
                 </motion.div>
               )}

               <button 
                 type="submit"
                 disabled={loading}
                 className="w-full bg-primary text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/25 relative disabled:opacity-70"
               >
                 {loading ? (
                   <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
                 ) : (
                   isLogin ? 'Entrar Agora' : 'Criar minha conta'
                 )}
               </button>

               <div className="relative py-4">
                 <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                 <div className="relative flex justify-center text-[10px] font-black uppercase"><span className="bg-white dark:bg-card-bg px-4 text-text-sub tracking-widest">ou continue com</span></div>
               </div>

               <button 
                 type="button"
                 onClick={signInGoogle}
                 className="w-full bg-white dark:bg-card-bg border border-border py-4 rounded-2xl text-sm font-bold text-text-main hover:bg-bg transition-colors flex items-center justify-center gap-3"
               >
                 <svg className="w-5 h-5" viewBox="0 0 24 24">
                   <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                   <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                   <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                   <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                 </svg>
                 Entrar com Google
               </button>
             </form>
           </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-border bg-bg/50 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
           <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-xl font-black text-text-main tracking-tighter">
                  Stratis
                </span>
              </div>
              <p className="text-sm text-text-sub max-w-sm font-medium">
                Sua jornada até a nomeação começa aqui. Automatize seu estudo, melhore sua retenção e conquiste sua vaga.
              </p>
           </div>
           <div className="grid grid-cols-2 gap-8 col-span-2">
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-text-main uppercase tracking-widest">Produto</h4>
                 <ul className="space-y-2 text-sm font-bold text-text-sub">
                    <li>Recursos</li>
                    <li>Comunidade</li>
                    <li>Preços</li>
                 </ul>
              </div>
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-text-main uppercase tracking-widest">Legal</h4>
                 <ul className="space-y-2 text-sm font-bold text-text-sub">
                    <li><Link to="/termos" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
                    <li><Link to="/privacidade" className="hover:text-primary transition-colors">Privacidade</Link></li>
                    <li>Cookies</li>
                 </ul>
              </div>
           </div>
        </div>
        <div className="max-w-7xl mx-auto pt-10 mt-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
           <span className="text-[10px] font-black text-text-sub uppercase tracking-widest">© 2026 Stratis. All rights reserved.</span>
           <div className="flex gap-6">
              <Smartphone className="w-4 h-4 text-text-sub" />
              <Database className="w-4 h-4 text-text-sub" />
           </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
