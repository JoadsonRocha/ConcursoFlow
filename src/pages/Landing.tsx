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
  Database,
  Smartphone,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BrandLogo from '../components/BrandLogo';
import { contentData } from '../constants/content';

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
      title: "Mapeamento de Editais",
      description: "Organize qualquer edital em uma grade estratégica. Nossa plataforma identifica o que realmente importa para sua aprovação.",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: Calendar,
      title: "Plano de Estudo Real",
      description: "Um cronograma que se adapta à sua vida. Metas diárias baseadas no seu tempo e nos tópicos de maior peso.",
      color: "bg-secondary/10 text-secondary"
    },
    {
      icon: Target,
      title: "Metas de Alto Impacto",
      description: "Foco total na Lei de Pareto. Priorize os 20% do conteúdo que representam 80% da sua nota final.",
      color: "bg-accent/10 text-accent"
    },
    {
      icon: Users,
      title: "Comunidade e Compartilhamento",
      description: "Acesse cronogramas e materiais validados por quem já passou. Compartilhe e evolua com outros estrategistas.",
      color: "bg-indigo-500/10 text-indigo-500"
    }
  ];

  return (
    <div className="min-h-screen bg-bg selection:bg-primary/20 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header/Nav */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 md:px-6",
        isScrolled ? "bg-white/90 backdrop-blur-xl border-b border-border shadow-sm py-3" : "bg-transparent py-5"
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 md:gap-3 transition-transform hover:scale-105">
            <BrandLogo size="md" />
          </Link>

          
          <div className="flex items-center gap-4 md:gap-10">
            <div className="hidden lg:flex items-center gap-10">
              {['Benefícios', 'Funcionalidades'].map((item) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} 
                  className="text-xs font-bold text-text-sub hover:text-primary uppercase tracking-wider transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
            <Link 
              to="/auth"
              className="bg-primary text-white border border-primary/20 px-4 py-2 md:px-8 md:py-3 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-primary/30"
            >
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 md:pt-48 md:pb-32 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center space-y-8 md:space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 md:space-y-8"
          >
            <div className="inline-flex items-center gap-3 bg-white/50 backdrop-blur-md border border-border px-5 py-2.5 rounded-full text-[10px] md:text-xs font-bold text-text-sub uppercase tracking-wider shadow-sm hover:shadow-md transition-shadow cursor-default">
              <Zap className="w-3.5 h-3.5 text-primary" />
              A nova era da preparação para concursos
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display text-text-main leading-[1.05] tracking-tight font-extrabold">
              Aprovação com <br/>
              <span className="text-primary italic relative">
                estratégia
                <svg className="absolute -bottom-2 md:-bottom-4 left-0 w-full h-3 md:h-5 text-primary/30" viewBox="0 0 200 20" preserveAspectRatio="none">
                  <path d="M0,10 Q100,20 200,10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span> absoluta.
            </h1>
            <p className="text-base md:text-xl text-text-sub font-medium leading-relaxed max-w-2xl mx-auto pt-4 md:pt-2">
              Transforme seu edital em um plano de batalha. O Stratis Planner organiza seus tópicos por relevância, cria metas reais e monitora sua evolução dia após dia.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full max-w-lg"
          >
            <Link 
               to="/auth"
               className="flex-1 bg-primary text-white flex items-center justify-center gap-2 rounded-xl py-4 md:py-5 text-xs md:text-sm font-bold tracking-widest uppercase shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all"
            >
              Começar Grátis
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <button 
               onClick={() => document.getElementById('beneficios')?.scrollIntoView({ behavior: 'smooth' })}
               className="flex-1 bg-white border border-slate-200 text-text-main py-4 md:py-5 rounded-xl text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-slate-50 hover:-translate-y-1 transition-all shadow-sm"
            >
              Ver Benefícios
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="w-full max-w-5xl mx-auto mt-20 rounded-2xl bg-white border border-border shadow-2xl p-4 md:p-6 overflow-hidden relative group"
          >
             {/* Simple Dashboard Mockup */}
             <div className="aspect-[16/9] bg-slate-50 flex flex-col rounded-xl overflow-hidden border border-border/50">
                <div className="h-10 border-b border-border flex items-center px-4 justify-between bg-white">
                   <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-slate-200" />
                      <div className="w-2 h-2 rounded-full bg-slate-200" />
                      <div className="w-2 h-2 rounded-full bg-slate-200" />
                   </div>
                   <div className="w-24 h-2 bg-slate-100 rounded-full" />
                </div>
                <div className="flex-1 p-4 md:p-8 grid grid-cols-12 gap-4">
                   <div className="col-span-3 space-y-4">
                      <div className="h-8 bg-white border border-border rounded-lg" />
                      <div className="h-24 bg-white border border-border rounded-lg" />
                      <div className="h-16 bg-white border border-border rounded-lg" />
                   </div>
                   <div className="col-span-9 space-y-4">
                      <div className="h-32 bg-white border border-border rounded-xl p-6 flex flex-col justify-between">
                         <div className="flex justify-between">
                            <div className="w-24 h-4 bg-slate-100 rounded-full" />
                            <div className="flex gap-2">
                               <div className="w-6 h-6 rounded-lg bg-primary/10" />
                               <div className="w-6 h-6 rounded-lg bg-secondary/10" />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-text-sub uppercase">
                               <span>Progresso Semanal</span>
                               <span>67%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-primary w-2/3" />
                            </div>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="h-32 bg-white border border-border rounded-xl p-4 space-y-3">
                            <div className="w-12 h-2 bg-slate-100 rounded-full" />
                            <div className="space-y-1">
                               <div className="w-full h-2 bg-slate-50 rounded-full" />
                               <div className="w-full h-2 bg-slate-50 rounded-full" />
                            </div>
                         </div>
                         <div className="h-32 bg-white border border-border rounded-xl" />
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="py-24 md:py-32 px-6 bg-white border-t border-border/50 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
             <div className="text-primary font-bold text-xs uppercase tracking-widest">Os Benefícios</div>
             <h2 className="text-3xl md:text-5xl font-display font-bold text-text-main tracking-tight">O fim do caos nos estudos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="bg-slate-50 p-10 rounded-2xl border border-border/50">
               <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-8"><Zap className="w-6 h-6"/></div>
               <h3 className="text-xl font-bold text-text-main mb-4 font-display">Mais Velocidade</h3>
               <p className="text-slate-600 text-sm leading-relaxed">Poupe até 15h semanais que seriam gastas com planejamento manual. Nossa tecnologia fatia seu edital e entrega a meta do dia pronta.</p>
             </div>
             <div className="bg-slate-50 p-10 rounded-2xl border border-border/50">
               <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-8"><ShieldCheck className="w-6 h-6"/></div>
               <h3 className="text-xl font-bold text-text-main mb-4 font-display">Controle Total</h3>
               <p className="text-slate-600 text-sm leading-relaxed">Marque conteúdos estudados, acompanhe seu ritmo diário e nunca mais perca o fio da meada na sua preparação.</p>
             </div>
             <div className="bg-slate-50 p-10 rounded-2xl border border-border/50">
               <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-8"><Target className="w-6 h-6"/></div>
               <h3 className="text-xl font-bold text-text-main mb-4 font-display">Pareto 80/20</h3>
               <p className="text-slate-600 text-sm leading-relaxed">Identifique os tópicos que representam 80% das questões da sua banca e saiba exatamente onde colocar sua energia.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades Bento Grid */}
      <section id="funcionalidades" className="py-24 md:py-32 px-6 bg-slate-50/50 relative">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
             <div className="space-y-4 max-w-2xl">
                <div className="text-primary font-bold text-[10px] md:text-xs uppercase tracking-widest">Funcionalidades</div>
                <h2 className="text-4xl md:text-6xl font-display leading-[1.1] text-text-main tracking-tight font-extrabold">
                   Um passo à frente <br/>do seu objetivo.
                </h2>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
             <div className="md:col-span-8 bg-white border border-slate-200 p-10 md:p-14 rounded-2xl shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                <div className="relative z-10 space-y-6">
                   <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 shadow-inner">
                      <BrainCircuit className="w-7 h-7" />
                   </div>
                   <h3 className="text-3xl font-display text-text-main font-bold">Mapeamento Estratégico</h3>
                   <p className="text-slate-600 text-base md:text-lg font-medium max-w-lg leading-relaxed">Nossa plataforma analisa o edital, organiza os assuntos e indica o que é prioritário com base no histórico de provas e relevância por banca.</p>
                </div>
             </div>

             <div className="md:col-span-4 bg-white border border-slate-200 p-10 md:p-12 rounded-2xl flex flex-col justify-center hover:shadow-xl transition-all group overflow-hidden">
                <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-8 group-hover:scale-110 transition-transform duration-500 text-center">
                   <Calendar className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-display text-text-main font-bold mb-4">Cronograma Ágil</h3>
                <p className="text-slate-600 md:text-lg font-medium leading-relaxed">Planos diários flexíveis. O sistema ajusta sua rota conforme seu tempo disponível e evolução real.</p>
             </div>

             <div className="md:col-span-5 bg-white border border-slate-200 p-10 md:p-12 rounded-2xl flex flex-col justify-center hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-8 group-hover:scale-110 transition-transform duration-500">
                   <Target className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-display text-text-main font-bold mb-4">Microlearning Organizado</h3>
                <p className="text-slate-600 md:text-lg font-medium leading-relaxed">Crie flashcards com descrições personalizadas e tags. Utilize geradores automáticos para acelerar sua memorização por tópicos específicos.</p>
             </div>

             {/* Feature 4: Wide */}
             <div className="md:col-span-7 bg-white border border-slate-200 p-10 md:p-14 rounded-2xl flex flex-col justify-between hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4"></div>
                <div className="relative z-10 space-y-6">
                   <div className="w-14 h-14 bg-primary/10 rounded-xl border border-primary/5 flex items-center justify-center text-primary">
                      <Users className="w-7 h-7" />
                   </div>
                   <h3 className="text-3xl font-display font-bold text-text-main">Comunidade e Compartilhamento</h3>
                   <p className="text-slate-600 text-base md:text-lg font-medium leading-relaxed max-w-lg">Não precisa começar do zero. Importe editais organizados, cronogramas de pessoas aprovadas e troque materiais validados com milhares de outros estudantes na plataforma.</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Stratis Journal Insights */}
      <section id="insights" className="py-24 md:py-32 px-6 bg-white relative">
        <div className="max-w-6xl mx-auto space-y-16">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                 <div className="text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                   <Database className="w-4 h-4" /> Stratis Journal
                 </div>
                 <h2 className="text-4xl md:text-5xl font-display font-bold text-text-main tracking-tight">Cresça com a nossa inteligência</h2>
                 <p className="text-text-sub font-medium max-w-xl">Artigos, guias e reflexões semanais para quem não aceita nada menos que a excelência.</p>
              </div>
              <Link 
                 to="/explorar"
                 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:gap-4 transition-all"
              >
                Ver Todos os Insights <ArrowRight className="w-4 h-4" />
              </Link>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {contentData.slice(0, 3).map((item) => (
                 <Link 
                   key={item.id} 
                   to="/explorar"
                   className="group flex flex-col"
                 >
                   <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-6 shadow-sm group-hover:shadow-xl transition-all">
                     <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.title} referrerPolicy="no-referrer" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                   <div className="flex items-center gap-3 mb-3">
                      <span className={cn(
                         "text-[9px] font-black uppercase tracking-widest",
                         item.id.includes('tutorial') ? "text-secondary" : "text-accent"
                      )}>{item.category}</span>
                      <span className="text-[9px] font-bold text-text-sub uppercase tracking-wider">{item.readTime}</span>
                   </div>
                   <h3 className="text-xl font-display font-bold text-text-main group-hover:text-primary transition-colors leading-tight mb-3">{item.title}</h3>
                   <p className="text-xs text-text-sub font-medium line-clamp-2 leading-relaxed">{item.excerpt}</p>
                 </Link>
              ))}
           </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 md:py-40 px-6 bg-white relative overflow-hidden border-t border-border">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-5xl -z-10">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-primary/5 blur-[150px] rounded-full animate-pulse"></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-10">
           <div className="w-16 h-16 bg-primary/5 rounded-xl border border-primary/10 backdrop-blur-md flex items-center justify-center mx-auto mb-8 shadow-sm">
              <Zap className="w-8 h-8 text-primary shadow-sm" />
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
                className="w-full sm:w-auto primary-button px-10 py-4 text-xs tracking-wider uppercase shadow-xl rounded-xl"
              >
                Ativar Minha Conta
              </Link>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border bg-white px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
           <div className="col-span-1 md:col-span-2 space-y-6">
              <BrandLogo size="md" />
              <p className="text-text-sub max-w-sm text-sm font-medium leading-relaxed">
                Stratis Planner. Tecnologia de alto desempenho para concurseiros estrategistas.
              </p>
           </div>
           <div className="grid grid-cols-2 gap-12 col-span-2">
              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-text-main uppercase tracking-wider opacity-40">Ecossistema</h4>
                 <ul className="space-y-2 text-xs font-semibold text-text-sub">
                    <li className="hover:text-primary transition-colors cursor-pointer uppercase tracking-wider">Painéis</li>
                    <li className="hover:text-primary transition-colors cursor-pointer uppercase tracking-wider">Cronogramas</li>
                 </ul>
              </div>
              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-text-main uppercase tracking-wider opacity-40">Compliance</h4>
                 <ul className="space-y-2 text-xs font-semibold text-text-sub">
                    <li><Link to="/termos" className="hover:text-primary transition-colors uppercase tracking-wider">Termos</Link></li>
                    <li><Link to="/privacidade" className="hover:text-primary transition-colors uppercase tracking-wider">Privacidade</Link></li>
                    <li><Link to="/cookies" className="hover:text-primary transition-colors uppercase tracking-wider">Cookies</Link></li>
                 </ul>
              </div>
           </div>
        </div>
        <div className="max-w-7xl mx-auto pt-10 mt-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
           <span className="text-xs font-bold text-text-sub uppercase tracking-wider opacity-40">Stratis Planner 2026 — Estratégia para concursos</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
