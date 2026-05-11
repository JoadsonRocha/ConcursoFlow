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
      title: "Organização do Conteúdo",
      description: "Transforme qualquer edital em uma grade de estudos organizada automaticamente por nossa plataforma.",
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
    <div className="min-h-screen bg-bg selection:bg-primary/20 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10">
        <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] bg-primary/5 dark:bg-primary/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[40%] bg-secondary/5 dark:bg-accent/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header/Nav */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6",
        isScrolled ? "bg-white/80 dark:bg-[#070b14]/80 backdrop-blur-xl border-b border-border shadow-sm py-4" : "bg-transparent py-6"
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 primary-button rounded-xl flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-display font-bold text-text-main tracking-tight leading-none uppercase">RiseMindr</span>
              <span className="text-xs font-bold text-primary uppercase tracking-wider mt-0.5 opacity-60">Elite Edition</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            {['Recursos', 'Estratégia', 'Comunidade'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                className="text-xs font-bold text-text-sub hover:text-primary uppercase tracking-wider transition-colors"
              >
                {item}
              </a>
            ))}
            <Link 
              to="/auth"
              className="bg-primary text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-md"
            >
              Entrar
            </Link>
          </div>

          <button className="md:hidden text-text-main">
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-3 bg-white dark:bg-white/5 border border-border px-5 py-2 rounded-full text-xs font-bold text-text-sub uppercase tracking-wider shadow-sm">
              <Zap className="w-3 h-3 text-primary" />
              Sincronia Estratégica para Aprovados
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display text-text-main leading-[1.1] tracking-tight font-bold">
              Domine seu edital com <br />
              <span className="text-primary italic">precisão cirúrgica</span>.
            </h1>
            <p className="text-base md:text-lg text-text-sub font-medium leading-relaxed max-w-2xl mx-auto pt-2">
              A arquitetura definitiva para estudantes de alto desempenho. Organize editais complexos, gere cronogramas inteligentes e domine cada tópico com tecnologia de ponta.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
          >
            <Link 
               to="/auth"
               className="flex-1 primary-button py-4 text-xs tracking-wider uppercase shadow-xl"
            >
              Começar Agora
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button 
               onClick={() => document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' })}
               className="flex-1 bg-white dark:bg-white/5 border border-border text-text-main px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm"
            >
              Recursos
            </button>
          </motion.div>

          {/* App Preview Wrapper */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="w-full pt-12 relative"
          >
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-3/4 bg-primary/5 rounded-full blur-[120px] -z-10"></div>
            <div className="relative mx-auto max-w-5xl rounded-3xl p-1.5 bg-white dark:bg-zinc-900 border border-border shadow-2xl overflow-hidden backdrop-blur-sm">
               <div className="bg-slate-50 dark:bg-zinc-950 rounded-[1.25rem] border border-border overflow-hidden">
                  <div className="h-10 bg-white dark:bg-zinc-900 border-b border-border flex items-center justify-between px-6">
                     <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-white/10"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-white/10"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-white/10"></div>
                     </div>
                     <div className="h-4 w-32 bg-slate-100 dark:bg-white/5 rounded-full"></div>
                     <div className="flex gap-3">
                        <div className="w-3.5 h-3.5 bg-slate-100 dark:bg-white/5 rounded-full"></div>
                        <div className="w-3.5 h-3.5 bg-slate-100 dark:bg-white/5 rounded-full"></div>
                     </div>
                  </div>
                  <div className="h-[350px] md:h-[480px] flex">
                     <div className="w-56 border-r border-border hidden md:block p-6 space-y-6 bg-white dark:bg-zinc-900/50">
                       <div className="h-3 w-24 bg-primary/10 rounded-full"></div>
                       <div className="space-y-3">
                         {[1,2,3,4,5].map(i => <div key={i} className="h-8 w-full bg-slate-50 dark:bg-white/5 rounded-lg border border-border"></div>)}
                       </div>
                     </div>
                     <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 dark:bg-zinc-950">
                        <div className="space-y-6">
                           <div className="h-36 w-full bg-white dark:bg-zinc-900 rounded-2xl border border-border relative p-6">
                              <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                 <div className="h-full w-2/3 bg-primary"></div>
                              </div>
                              <div className="mt-4 space-y-2">
                                 <div className="h-2 w-1/3 bg-slate-100 dark:bg-white/5 rounded-full"></div>
                                 <div className="h-2 w-1/2 bg-slate-100 dark:bg-white/5 rounded-full"></div>
                              </div>
                           </div>
                           <div className="h-28 w-full bg-white dark:bg-zinc-900 rounded-2xl border border-border"></div>
                        </div>
                        <div className="space-y-6">
                           <div className="h-28 w-full bg-white dark:bg-zinc-900 rounded-2xl border border-border"></div>
                           <div className="h-36 w-full bg-white dark:bg-zinc-900 rounded-2xl border border-border p-6 flex flex-col justify-end">
                              <div className="flex gap-2">
                                 {[1,2,3].map(i => <div key={i} className="h-8 flex-1 bg-slate-50 dark:bg-white/5 rounded-lg"></div>)}
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="recursos" className="py-32 px-6 bg-slate-50 dark:bg-[#070b14] relative">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
             <div className="space-y-3 max-w-xl">
                <div className="text-primary font-bold text-xs uppercase tracking-wider">Engenharia de Aprovação</div>
                <h2 className="text-3xl md:text-5xl font-display leading-tight text-text-main tracking-tight font-bold">
                   Arquitetura de <span className="text-primary italic">Alta Performance</span>.
                </h2>
             </div>
             <p className="text-text-sub font-medium max-w-sm text-sm leading-relaxed border-l border-border pl-8">
                Desenvolvemos um sistema inteligente que organiza sua rotina para que seu único foco seja a execução.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
             {/* Feature 1: Main */}
             <div className="md:col-span-8 bg-white dark:bg-slate-900/40 border border-border p-10 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative min-h-[400px]">
                <div className="relative z-10 space-y-5">
                   <div className="w-12 h-12 bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <BrainCircuit className="w-6 h-6" />
                   </div>
               <h3 className="text-2xl font-display text-text-main font-bold">Processamento de Editais</h3>
                   <p className="text-text-sub max-w-sm text-sm font-medium">Capture disciplinas e tópicos de PDFs extensos instantaneamente. Nossa tecnologia processa as informações estruturando seu guia de estudos.</p>
                </div>
                <div className="relative z-10 mt-8">
                   <button className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider group/btn">
                      Explorar Tecnologia <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                   </button>
                </div>
             </div>

             {/* Feature 2: Small */}
             <div className="md:col-span-4 bg-white dark:bg-accent/5 border border-border p-8 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all group">
                <div className="w-10 h-10 bg-secondary/5 dark:bg-secondary/10 border border-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                   <Calendar className="w-5 h-5" />
                </div>
                <div className="space-y-3 pt-8">
                   <h3 className="text-xl font-display text-text-main font-bold">Cronograma Ágil</h3>
                   <p className="text-text-sub text-xs font-medium leading-relaxed">Algoritmos que adaptam seu tempo conforme o peso estatístico de cada matéria.</p>
                </div>
             </div>

             {/* Feature 3: Small */}
             <div className="md:col-span-4 bg-white dark:bg-white/5 border border-border p-8 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all group">
                <div className="w-10 h-10 bg-accent/5 border border-accent/10 rounded-xl flex items-center justify-center text-accent">
                   <Target className="w-5 h-5" />
                </div>
                <div className="space-y-3 pt-8">
                   <h3 className="text-xl font-display text-text-main font-bold">Flashcards Elite</h3>
                   <p className="text-text-sub text-xs font-medium leading-relaxed">Memorização ativa baseada em repetição espaçada, automatizada para seus tópicos.</p>
                </div>
             </div>

             {/* Feature 4: Wide */}
             <div className="md:col-span-8 bg-white dark:bg-gradient-to-br border border-border p-10 rounded-2xl flex flex-col md:flex-row items-center gap-10 hover:shadow-md transition-all group relative overflow-hidden">
                <div className="flex-1 space-y-5 relative z-10">
                   <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 border border-border rounded-xl flex items-center justify-center text-text-main">
                      <Users className="w-6 h-6" />
                   </div>
                   <h3 className="text-2xl font-display text-text-main font-bold">Repositório Elite</h3>
                   <p className="text-text-sub text-sm font-medium leading-relaxed">Acesse planejamentos de aprovados para as maiores carreiras do país. Não estude do zero.</p>
                   <Link to="/comunidade" className="inline-flex items-center gap-2 bg-text-main text-bg dark:bg-white dark:text-slate-950 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-sm">
                      Ver ranking
                   </Link>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3 relative z-10 w-full md:w-auto">
                   {[1,2].map(i => (
                     <div key={i} className="aspect-square rounded-2xl bg-slate-50 dark:bg-white/5 border border-border p-4 transition-transform group-hover:scale-105 duration-500 flex flex-col justify-end">
                        <div className="h-1 w-1/2 bg-primary/30 rounded-full mb-1.5"></div>
                        <div className="h-1 w-full bg-slate-200 dark:bg-white/10 rounded-full"></div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-white dark:bg-[#0c121e] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-5xl -z-10">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-primary/5 blur-[150px] rounded-full animate-pulse"></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-10">
           <div className="w-16 h-16 bg-primary/5 rounded-2xl border border-primary/10 backdrop-blur-md flex items-center justify-center mx-auto mb-8 shadow-sm">
              <Sparkles className="w-8 h-8 text-primary shadow-sm" />
           </div>
           <h2 className="text-3xl md:text-5xl font-display text-text-main leading-[1.1] tracking-tight font-bold">
             Dê o passo definitivo rumo ao seu <br />
             nome no <span className="text-primary italic">Diário Oficial</span>.
           </h2>
           <p className="text-text-sub text-lg md:text-xl font-medium max-w-2xl mx-auto">
             Junte-se à elite dos estudantes que utilizam engenharia de dados para vencer editais.
           </p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <Link 
                to="/auth"
                className="w-full sm:w-auto primary-button px-10 py-4 text-xs tracking-wider uppercase shadow-xl"
              >
                Ativar Minha Conta Elite
              </Link>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border bg-white dark:bg-[#070b14] px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
           <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary border border-primary/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-lg font-display font-bold text-text-main tracking-tight uppercase">RiseMindr</span>
              </div>
              <p className="text-text-sub max-w-sm text-sm font-medium leading-relaxed">
                RiseMindr Elite OS. Tecnologia de alto desempenho para concurseiros estrategistas.
              </p>
           </div>
           <div className="grid grid-cols-2 gap-12 col-span-2">
              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-text-main uppercase tracking-wider opacity-40">Ecossistema</h4>
                 <ul className="space-y-2 text-xs font-semibold text-text-sub">
                    <li className="hover:text-primary transition-colors cursor-pointer uppercase tracking-wider">Dashboards</li>
                    <li className="hover:text-primary transition-colors cursor-pointer uppercase tracking-wider">Cronogramas</li>
                    <li className="hover:text-primary transition-colors cursor-pointer uppercase tracking-wider">Comunidade</li>
                 </ul>
              </div>
              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-text-main uppercase tracking-wider opacity-40">Compliance</h4>
                 <ul className="space-y-2 text-xs font-semibold text-text-sub">
                    <li><Link to="/termos" className="hover:text-primary transition-colors uppercase tracking-wider">Termos</Link></li>
                    <li><Link to="/privacidade" className="hover:text-primary transition-colors uppercase tracking-wider">Privacidade</Link></li>
                 </ul>
              </div>
           </div>
        </div>
        <div className="max-w-7xl mx-auto pt-10 mt-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
           <span className="text-xs font-bold text-text-sub uppercase tracking-wider opacity-40">RiseMindr 2026 — Elite Edition</span>
           <div className="flex gap-2 items-center bg-slate-50 dark:bg-white/5 px-4 py-1.5 rounded-full border border-border">
              <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-sm"></div>
              <span className="text-xs font-bold text-text-sub uppercase tracking-wider">Systems Nominal</span>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
