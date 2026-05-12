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
              <img src="/logo.png" alt="Stratis" className="w-6 h-6 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-display font-bold text-text-main tracking-tight leading-none uppercase">Stratis</span>
              <span className="text-xs font-bold text-primary uppercase tracking-wider mt-0.5 opacity-60">Inteligência para concursos</span>
            </div>

          
          <div className="hidden md:flex items-center gap-10">
            {['Benefícios', 'Funcionalidades', 'Comunidade'].map((item) => (
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
              Desenvolvido para concurseiros de verdade
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display text-text-main leading-[1.1] tracking-tight font-bold">
              Estudar para concursos <br />
              <span className="text-primary italic">não precisa ser sofrido</span>.
            </h1>
            <p className="text-base md:text-lg text-text-sub font-medium leading-relaxed max-w-2xl mx-auto pt-2">
              Transforme seu material de estudo em um plano de ação claro. Organize seu edital, crie cronogramas que funcionam e use flashcards inteligentes para fixar o conteúdo de verdade.
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

          {/* Enhanced Benefits Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="w-full pt-12 px-6"
          >
            <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 border border-border rounded-3xl p-8 md:p-12 shadow-lg">
              <h3 className="text-2xl font-display font-bold text-text-main mb-6">Por que concurseiros de sucesso escolhem o Stratis?</h3>
              <div className="space-y-6 text-text-sub font-medium leading-relaxed text-sm">
                <p>
                  Não acreditamos em fórmulas mágicas. A nossa missão é descomplicar a jornada até a aprovação, 
                  organizando o que é caótico e mantendo você focado no que realmente importa: a próxima página do seu edital.
                </p>
                <p>
                  O Stratis foi desenhado para remover o ruído do seu estudo. Com ferramentas que automatizam a gestão do conteúdo, 
                  nós garantimos que seu tempo seja investido em aprendizado, não em burocracia organizacional.
                </p>
                <p>
                  Você cuida do aprendizado. O Stratis cuida de todo o resto — da organização do edital à revisão espaçada garantida 
                  por nossos flashcards inteligentes.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="funcionalidades" className="py-32 px-6 bg-slate-50 dark:bg-[#070b14] relative">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
             <div className="space-y-3 max-w-xl">
                <div className="text-primary font-bold text-xs uppercase tracking-wider">Como funciona</div>
                <h2 className="text-3xl md:text-5xl font-display leading-tight text-text-main tracking-tight font-bold">
                   Tudo o que você precisa para <span className="text-primary italic">passar</span>.
                </h2>
             </div>
             <p className="text-text-sub font-medium max-w-sm text-sm leading-relaxed border-l border-border pl-8">
                Ferramentas pensadas para facilitar sua rotina e otimizar seu aprendizado.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
             {/* Feature 1: Main */}
             <div className="md:col-span-8 bg-white dark:bg-slate-900/40 border border-border p-10 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative min-h-[300px]">
                <div className="relative z-10 space-y-5">
                   <div className="w-12 h-12 bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <BrainCircuit className="w-6 h-6" />
                   </div>
                   <h3 className="text-2xl font-display text-text-main font-bold">Organize seu edital em segundos</h3>
                   <p className="text-text-sub max-w-sm text-sm font-medium">Capture disciplinas e tópicos de seus editais (PDFs) instantaneamente. O Stratis organiza tudo para você automaticamente.</p>
                </div>
             </div>

             {/* Feature 2: Small */}
             <div className="md:col-span-4 bg-white dark:bg-accent/5 border border-border p-8 rounded-2xl flex flex-col justify-center hover:shadow-md transition-all group">
                <div className="w-10 h-10 bg-secondary/5 dark:bg-secondary/10 border border-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                   <Calendar className="w-5 h-5" />
                </div>
                <div className="space-y-3 pt-6">
                   <h3 className="text-xl font-display text-text-main font-bold">Cronograma Ágil</h3>
                   <p className="text-text-sub text-xs font-medium leading-relaxed">Planos de estudo que se ajustam ao seu tempo e prioridade das matérias.</p>
                </div>
             </div>

             {/* Feature 3: Small */}
             <div className="md:col-span-4 bg-white dark:bg-white/5 border border-border p-8 rounded-2xl flex flex-col justify-center hover:shadow-md transition-all group">
                <div className="w-10 h-10 bg-accent/5 border border-accent/10 rounded-xl flex items-center justify-center text-accent">
                   <Target className="w-5 h-5" />
                </div>
                <div className="space-y-3 pt-6">
                   <h3 className="text-xl font-display text-text-main font-bold">Memorização Ativa</h3>
                   <p className="text-text-sub text-xs font-medium leading-relaxed">Flashcards inteligentes baseados em repetição para você nunca esquecer o que estudou.</p>
                </div>
             </div>

             {/* Feature 4: Wide */}
             <div className="md:col-span-8 bg-white dark:bg-gradient-to-br border border-border p-10 rounded-2xl flex flex-col md:flex-row items-center gap-10 hover:shadow-md transition-all group relative overflow-hidden">
                <div className="flex-1 space-y-5 relative z-10">
                   <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 border border-border rounded-xl flex items-center justify-center text-text-main">
                      <Users className="w-6 h-6" />
                   </div>
                   <h3 className="text-2xl font-display text-text-main font-bold">Comunidade de Aprovados</h3>
                   <p className="text-text-sub text-sm font-medium leading-relaxed">Acesse planos e materiais compartilhados por quem já alcançou a aprovação. Você não está sozinho.</p>
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
                Ativar Minha Conta
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
                  <img src="/logo.png" alt="Stratis" className="w-4 h-4 object-contain" />
                </div>
                <span className="text-lg font-display font-bold text-text-main tracking-tight uppercase">Stratis</span>
              </div>
              <p className="text-text-sub max-w-sm text-sm font-medium leading-relaxed">
                Stratis. Tecnologia de alto desempenho para concurseiros estrategistas.
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
           <span className="text-xs font-bold text-text-sub uppercase tracking-wider opacity-40">Stratis 2026 — Inteligência para concursos</span>
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
