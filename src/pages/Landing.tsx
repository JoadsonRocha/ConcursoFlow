import React, { useState, useRef } from 'react';
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
  ChevronDown,
  CheckCircle2,
  Star,
  Instagram,
  Laptop,
  Youtube,
  Loader2,
  Crown,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BrandLogo from '../components/BrandLogo';
import { contentData } from '../constants/content';
import { createCheckoutSession } from '../services/stripe';
import { toast } from 'sonner';
import { validatePassword } from '../lib/password';

const Landing = () => {
  const { login, loginEmail, signup, user, profile, planType } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current?.parentElement;
    if (!el) return;
    const handleScroll = () => {
      setIsScrolled(el.scrollTop > 20);
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginEmail(email, password);
      } else {
        const passwordError = validatePassword(password);
        if (passwordError) {
          setError(passwordError);
          setLoading(false);
          return;
        }
        await signup(email, password, name);
      }
    } catch (err: any) {
      console.error(err);
      let msg = 'Erro ao processar autenticação';
      if (err.code === 'auth/user-not-found') msg = 'Usuário não encontrado';
      if (err.code === 'auth/wrong-password') msg = 'Senha incorreta';
      if (err.code === 'auth/invalid-credential') msg = 'E-mail ou senha incorretos';
      if (err.code === 'auth/email-already-in-use') msg = 'Este e-mail já está em uso';
      if (err.code === 'auth/weak-password') msg = 'A senha deve ter pelo menos 6 caracteres';
      if (err.code === 'auth/invalid-email') msg = 'E-mail inválido';
      if (err.code === 'auth/too-many-requests') msg = 'Muitas tentativas. Tente novamente mais tarde.';
      if (err.code === 'auth/user-disabled') msg = 'Usuário desativado.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const signInGoogle = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      await login();
      navigate('/dashboard'); // or redirect somewhere
    } catch (err: any) {
      console.error(err);
      let msg = 'Erro ao entrar com Google';
      if (err.code === 'auth/popup-closed-by-user') msg = 'O login foi cancelado pelo usuário. Se o popup não abrir, tente acessar por uma nova aba.';
      if (err.code === 'auth/cancelled-popup-request') msg = 'O login foi cancelado devido a múltiplas requisições ou bloqueio de pop-up.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanAction = async (planId: string) => {
    if (!user) {
      navigate('/auth?plan=' + planId);
      toast.info("Crie uma conta ou faça login para assinar um plano!");
      return;
    }

    setLoadingPlan(planId);

    try {
      await createCheckoutSession(planId);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao iniciar checkout com o Stripe.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const premiumFeatures = [
    { name: 'Edital Verticalizado Inteligente', desc: 'Organização e Checklist completo para controle de tópicos' },
    { name: 'Análise de Pareto de Recorrência (80/20)', desc: 'Identificação preditiva dos temas mais prioritários de cada banca' },
    { name: 'Notebook Stratis (Caderno Inteligente)', desc: 'Geração 10x mais rápida de Flashcards, Mapas Mentais e Quizzes via PDF/Texto' },
    { name: 'Mentor Stratis Inteligente (Coaching 24/7)', desc: 'Tutor de inteligência artificial de plantão para tirar qualquer dúvida' },
    { name: 'Grade de Similaridade entre Editais', desc: 'Mapeamento instantâneo de disciplinas para conciliar múltiplos concursos' },
    { name: 'Estatísticas & Analytics Avançados', desc: 'Acompanhamento profundo de horas líquidas, simulados e metas' },
    { name: 'Flashcards & Mapas Dinâmicos Ilimitados', desc: 'Módulo de microlearning focado na retenção e repetição espaçada' },
    { name: 'Cronogramas Adaptativos até 12 Semanas', desc: 'Planejamento dinâmico focado no seu tempo disponível real' },
    { name: 'Exportação Premium de Planos (PDF)', desc: 'Geração e download de cronogramas e editais em alta qualidade para impressão' },
    { name: 'Modo Foco Imersivo com Lofi & Pomodoro', desc: 'Simulador mental com efeitos binaurais para concentração máxima' },
    { name: 'Compartilhamento & Comunidade Stratis', desc: 'Acesso completo a trilhas e cronogramas validados por aprovados' }
  ];

  const plans = [
    { id: 'monthly_plan', name: 'Mensal PRO', price: 'R$ 29,90', period: 'mês' },
    { id: 'annual_plan', name: 'Anual PRO', price: 'R$ 297,90', period: 'ano' }
  ];

  const isMonthlyCurrent = 
    (profile?.userPlan === 'monthly') || (planType === 'pro' && !profile?.userPlan); // fallback for custom/special users
  const isAnnualCurrent = 
    (profile?.userPlan === 'annual');

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
    <div ref={scrollRef} className="min-h-full bg-bg selection:bg-primary/20 relative font-sans">
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
              {['Benefícios', 'Funcionalidades', 'Planos'].map((item) => {
                if (item === 'Planos') {
                  return (
                    <Link
                      key={item}
                      to="/planos"
                      className="text-xs font-bold text-text-sub hover:text-primary uppercase tracking-wider transition-colors"
                    >
                      {item}
                    </Link>
                  );
                }
                return (
                  <a 
                    key={item} 
                    href={`#${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} 
                    className="text-xs font-bold text-text-sub hover:text-primary uppercase tracking-wider transition-colors"
                  >
                    {item}
                  </a>
                );
              })}
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
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-32 px-6 animate-fade-in bg-white border-b border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center animate-fade-in">
          
          {/* Text and CTA */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 md:space-y-8 z-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-4 md:space-y-6"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-slate-900 leading-[1.15] tracking-tight font-black">
                Da bagunça à organização. <br className="hidden lg:block" />
                Transforme seus estudos em conquistas.
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl pt-2">
                O <strong>Stratis Planner</strong> transforma seu edital em um plano de estudos completo, organiza a sua semana, programa suas revisões automaticamente e mostra seu progresso real. Matéria por matéria, dia após dia.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 w-full md:max-w-md lg:max-w-none justify-center lg:justify-start"
            >
              <Link 
                 to="/auth"
                 className="flex-1 lg:flex-none uppercase bg-secondary text-white flex items-center justify-center gap-2 rounded-xl py-4 md:py-5 px-8 text-sm md:text-base font-black tracking-widest shadow-xl hover:shadow-secondary/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all"
              >
                Começar Grátis Agora
                <ArrowRight className="w-5 h-5 ml-1" />
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
               <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 justify-center lg:justify-start">
                 <div className="flex -space-x-3">
                   <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" alt="User 1" className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
                   <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" alt="User 2" className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
                   <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" alt="User 3" className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
                   <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop" alt="User 4" className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
                   <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm z-10">+10k</div>
                 </div>
                 <div className="text-sm font-semibold text-slate-600 text-center sm:text-left">Assinantes reais</div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Image and Floating Card */}
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="w-full relative z-10 flex justify-center lg:justify-end"
          >
           <div className="w-full max-w-[480px] bg-white rounded-xl md:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-20 mx-auto lg:mr-0">
                 {/* Title Bar */}
                 <div className="h-8 md:h-10 border-b border-slate-100 flex items-center px-4 md:px-5 justify-between bg-slate-50">
                    <div className="flex gap-1.5 md:gap-2">
                       <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-red-400" />
                       <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-amber-400" />
                       <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-[9px] md:text-xs text-slate-500 font-bold tracking-widest uppercase">Stratis Planner — Hoje</div>
                    <div className="w-6 md:w-10" />
                 </div>

                 {/* Content */}
                 <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                   <div className="flex justify-between items-end">
                     <div>
                        <div className="text-[10px] md:text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Progresso Semanal</div>
                        <div className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">68%</div>
                     </div>
                     <div className="text-right">
                        <div className="text-[9px] md:text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Meta da semana</div>
                        <div className="px-2 md:px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] md:text-xs font-bold border border-emerald-100 italic">No prazo</div>
                     </div>
                   </div>
                   
                   <div className="w-full h-2 md:h-2.5 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 w-[68%]" />
                   </div>

                   <div className="grid grid-cols-3 gap-2 md:gap-4">
                      {[
                        { sub: 'Const.', cat: 'Alta', color: 'bg-blue-500', pct: '85%' },
                        { sub: 'Port.', cat: 'Média', color: 'bg-amber-400', pct: '42%' },
                        { sub: 'Rac.', cat: 'Alta', color: 'bg-purple-500', pct: '60%' },
                      ].map((item, i) => (
                        <div key={i} className="p-2 md:p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                          <div className="flex justify-between items-center text-[9px] md:text-xs font-bold text-slate-700 uppercase tracking-tight">
                             <span>{item.sub}</span>
                             <span>{item.pct}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase px-1.5 md:px-2 py-0.5 bg-white rounded border border-slate-200">{item.cat}</span>
                          </div>
                          <div className="w-full h-1 md:h-1.5 bg-slate-200 rounded-full overflow-hidden">
                             <div className={`h-full ${item.color}`} style={{ width: item.pct }} />
                          </div>
                        </div>
                      ))}
                   </div>
                 </div>
              </div>
          </motion.div>
        </div>
      </section>

      {/* Como funciona / Método Simples */}
      <section id="beneficios" className="py-24 md:py-32 px-6 bg-slate-50 relative border-t border-slate-200/50">
        <div className="max-w-6xl mx-auto">
           <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-display font-black text-slate-900 tracking-tight">Método Simples</h2>
              <p className="text-lg text-slate-600 font-semibold max-w-2xl mx-auto">Um método que nasceu da experiência real. Esqueça planilhas complexas, nós guiamos você até a aprovação.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6 relative">
              {/* Connector Line (Desktop Only) */}
              <div className="hidden lg:block absolute top-[100px] lg:top-[120px] left-12 right-12 h-1 bg-slate-200 z-0"></div>

              {[
                { 
                  num: '1', 
                  title: 'Escolha seu edital', 
                  desc: 'Selecione ou importe o edital do seu concurso. A IA lista tudo o que importa.', 
                  img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=300&fit=crop',
                  color: 'text-blue-500' 
                },
                { 
                  num: '2', 
                  title: 'Planejamento inteligente', 
                  desc: 'Defina suas horas disponíveis e crie um cronograma automático e flexível.', 
                  img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&h=300&fit=crop',
                  color: 'text-indigo-500' 
                },
                { 
                  num: '3', 
                  title: 'Registre e estude', 
                  desc: 'Use os Notebooks e AI Flashcards para estudar de forma ativa. Dê check nas metas.', 
                  img: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=500&h=300&fit=crop',
                  color: 'text-secondary' 
                },
                { 
                  num: '4', 
                  title: 'Acompanhe e ajuste', 
                  desc: 'Veja estatísticas completas e saiba quando precisa acelerar ou revisar.', 
                  img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop',
                  color: 'text-emerald-500' 
                }
              ].map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                   <div className="w-full relative mb-8">
                     <div className="w-full h-48 md:h-40 lg:h-52 bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden group-hover:-translate-y-2 group-hover:shadow-xl transition-all duration-300">
                        <img src={step.img} alt={step.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     </div>
                     <div className="w-12 h-12 bg-white border-4 border-slate-50 flex items-center justify-center rounded-full text-xl font-black shadow-lg absolute -bottom-6 left-1/2 -translate-x-1/2 group-hover:-translate-y-2 transition-transform duration-300">
                        <span className={step.color}>{step.num}</span>
                     </div>
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-slate-900 mb-2 font-display">{step.title}</h3>
                     <p className="text-slate-600 text-sm font-medium leading-relaxed px-4">{step.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>
      <section id="funcionalidades" className="py-24 md:py-32 px-6 bg-slate-50/50 relative">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
             <div className="space-y-4 max-w-2xl">
                <div className="text-secondary font-black text-[10px] md:text-xs uppercase tracking-widest">Nossos Recursos Elite</div>
                <h2 className="text-3xl md:text-5xl font-display leading-[1.1] text-text-main tracking-tight font-black">
                   Tudo o que você precisa para <br/>vencer a concorrência.
                </h2>
                <p className="text-sm md:text-base text-text-sub font-semibold max-w-xl">
                  Esqueça as gambiarras em planilhas ou PDFs avulsos. Desenvolvemos o ecossistema definitivo focado no concurseiro profissional.
                </p>
             </div>
          </div>

          <div className="space-y-24 md:space-y-32">
             {/* Feature 1 */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                <div className="space-y-6 order-2 lg:order-1">
                   <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary shadow-inner">
                      <BrainCircuit className="w-6 h-6" />
                   </div>
                   <h3 className="text-3xl font-display text-slate-900 font-black tracking-tight">Filtro Cirúrgico de Editais</h3>
                   <p className="text-slate-600 text-lg font-medium leading-relaxed">
                     Nossa tecnologia analisa a estrutura do seu edital, agrupa por disciplinas fundamentais e traça quais tópicos merecem prioridade absoluta com base nos pesos atribuídos pela banca e dados estatísticos.
                   </p>
                </div>
                <div className="order-1 lg:order-2 h-64 md:h-[400px] w-full bg-slate-100 rounded-3xl overflow-hidden shadow-2xl relative border border-slate-200/60 transition-transform hover:-translate-y-1">
                   <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&fit=crop" alt="Filtro de Editais" className="w-full h-full object-cover" />
                </div>
             </div>

             {/* Feature 2: Notebook Stratis */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                <div className="order-1 lg:order-1 h-64 md:h-[400px] w-full bg-indigo-50 rounded-3xl overflow-hidden shadow-2xl relative border border-indigo-100 transition-transform hover:-translate-y-1">
                   <img src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&fit=crop" alt="Notebook Inteligente" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-6 order-2 lg:order-2">
                   <div className="inline-flex items-center gap-1.5 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                     <Zap className="w-3.5 h-3.5" /> Inteligência Artificial
                   </div>
                   <h3 className="text-3xl font-display text-slate-900 font-black tracking-tight">Notebook Stratis (Caderno 10x Mais Rápido)</h3>
                   <p className="text-slate-600 text-lg font-medium leading-relaxed">
                     Pare de perder horas resumindo aulas e apostilas manualmente. Com o Notebook Inteligente, você extrai instantaneamente <b>Mapas Mentais, Flashcards e Quizzes</b> a partir de qualquer PDF. Estudo ativo automatizado no nível máximo.
                   </p>
                </div>
             </div>

             {/* Feature 3 */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                <div className="space-y-6 order-2 lg:order-1">
                   <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
                      <Target className="w-6 h-6" />
                   </div>
                   <h3 className="text-3xl font-display text-slate-900 font-black tracking-tight">Revisão Espaçada Integrada</h3>
                   <p className="text-slate-600 text-lg font-medium leading-relaxed">
                     Crie flashcards dinâmicos e monitore sua curva de esquecimento. Memorize fórmulas, leis e conceitos de forma perene sem se perder em ciclos de revisão complexos. Tudo integrado no seu fluxo principal de estudo.
                   </p>
                </div>
                <div className="order-1 lg:order-2 h-64 md:h-[400px] w-full bg-emerald-50 rounded-3xl overflow-hidden shadow-2xl relative border border-emerald-100 transition-transform hover:-translate-y-1">
                   <img src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&fit=crop" alt="Revisão Estratégica" className="w-full h-full object-cover" />
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Seção de Planos de Estudos (Preços) - Foco em Conversão */}
      <section id="planos" className="py-24 bg-slate-50 relative border-t border-b border-slate-200/60 overflow-hidden">
        {/* Background Accent Gradients */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 relative z-10">
          {/* Main white panel grouping all content, exactly like the Planos page structure */}
          <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-xl p-6 sm:p-10 md:p-12 space-y-8">
            {/* Header section inside the panel */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full rounded-tl-none animate-pulse mb-2 mx-auto">
                <Crown className="w-3.5 h-3.5 text-secondary" /> Invista no seu Futuro
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black text-slate-900 tracking-tight leading-none">
                Desbloqueie seu <span className="text-secondary">Potencial PRO</span>
              </h2>
              <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
                Acesse ferramentas avançadas de organização e inteligência artificial para sua evolução acelerada rumo à aprovação.
              </p>
            </div>

            {/* Unified Compact Row with Features Left and Purchases Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-4xl mx-auto pt-4">
              
              {/* Left Column: All Features included in Premium plan */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-base font-display font-bold text-slate-900 leading-tight">
                      Recursos Inclusos no Plano PRO
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Tudo o que você precisa em uma única assinatura sem limites
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {premiumFeatures.map((feature, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start">
                      <div className="w-4.5 h-4.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100/60 shadow-sm">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      </div>
                      <div className="flex flex-col text-left leading-tight">
                        <span className="font-bold text-slate-800 text-xs">
                          {feature.name}
                        </span>
                        <span className="text-slate-400 font-semibold text-[10px]">
                          {feature.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Checkout choices */}
              <div className="lg:col-span-5 space-y-4">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center lg:text-left mb-2">
                  Selecione o seu Ciclo de Estudo:
                </div>

                {/* Monthly Subscription Box */}
                <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 hover:border-slate-300 transition-colors relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Assinatura Mensal</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Recorrente</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-black text-slate-900">R$ 29,90</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">/mês</span>
                  </div>
                  
                  <button
                    onClick={() => handlePlanAction('monthly_plan')}
                    disabled={isMonthlyCurrent || loadingPlan !== null}
                    className={cn(
                      "w-full py-2.5 rounded-lg font-black uppercase tracking-wider text-[10px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm",
                      isMonthlyCurrent
                        ? "bg-slate-100 text-slate-500 border border-slate-200 cursor-default"
                        : "bg-slate-900 text-white hover:bg-slate-800 active:scale-95"
                    )}
                  >
                    {loadingPlan === 'monthly_plan' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isMonthlyCurrent ? (
                      'Assinatura Mensal Ativa'
                    ) : (
                      'Iniciar Mensal PRO'
                    )}
                  </button>
                </div>

                {/* Annual Subscription Box (Recommended) */}
                <div className="bg-white border-2 border-secondary rounded-2xl p-5 relative ring-4 ring-secondary/5">
                  <div className="absolute -top-2.5 right-4 bg-accent text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm z-10 animate-pulse">
                    MELHOR CUSTO-BENEFÍCIO
                  </div>
                  
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Assinatura Anual</span>
                    <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                      Economize +40%
                    </span>
                  </div>
                  
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-2xl font-black text-slate-900">R$ 297,90</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">/ano</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mb-4">
                    (Equivale a apenas <span className="text-slate-800 font-bold">R$ 24,82/mês</span>)
                  </div>

                  <button
                    onClick={() => handlePlanAction('annual_plan')}
                    disabled={isAnnualCurrent || loadingPlan !== null}
                    className={cn(
                      "w-full py-2.5 rounded-lg font-black uppercase tracking-wider text-[10px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md",
                      isAnnualCurrent
                        ? "bg-slate-100 text-slate-500 border border-slate-200 cursor-default shadow-none"
                        : "bg-secondary text-white hover:bg-secondary/90 shadow-[0_4px_16px_rgba(59,130,246,0.2)] active:scale-95"
                    )}
                  >
                    {loadingPlan === 'annual_plan' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isAnnualCurrent ? (
                      'Assinatura Anual Ativa'
                    ) : (
                      'Iniciar Anual PRO'
                    )}
                  </button>
                </div>

                <p className="text-center text-[9px] text-slate-400 font-semibold leading-relaxed max-w-[280px] mx-auto">
                  🔒 Pagamento 100% seguro via Stripe. Cancelamento facilitado com um clique nas configurações do seu perfil.
                </p>
              </div>

            </div>

            {/* Footer information inside the white panel */}
            <p className="text-center text-[10px] font-medium text-slate-400 pt-4 border-t border-slate-50 max-w-sm mx-auto leading-relaxed">
              Pagamento seguro processado pelo Stripe. Cancele a qualquer momento nas configurações do seu perfil.
            </p>
          </div>
        </div>
      </section>

      {/* Depoimentos / Aprovados Reais */}
      <section className="py-12 md:py-16 px-6 bg-white border-t border-border/50 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
             <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-border/50 flex flex-col justify-between hover:shadow-xl transition-shadow rise-card">
               <div>
                  <div className="flex text-amber-400 mb-6 font-bold space-x-1">
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed italic mb-8">"Passei 2 anos tentando montar meu cronograma no Excel. Quando comecei a usar o Stratis Planner, em 3 semanas eu já sabia exatamente onde estava e para onde ia. A aprovação veio 8 meses depois."</p>
               </div>
               <div>
                  <h4 className="text-text-main font-bold font-display">Mariana S.</h4>
                  <p className="text-text-sub text-xs uppercase tracking-wider font-semibold">Aprovada — Receita Federal</p>
               </div>
             </div>
             <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-border/50 flex flex-col justify-between hover:shadow-xl transition-shadow rise-card">
               <div>
                  <div className="flex text-amber-400 mb-6 font-bold space-x-1">
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed italic mb-8">"Sou mãe, trabalho 8h por dia e ainda passei em concurso público. O app entendeu minha realidade e criou um plano que funcionou de verdade dentro do meu caos."</p>
               </div>
               <div>
                  <h4 className="text-text-main font-bold font-display">Carolina T.</h4>
                  <p className="text-text-sub text-xs uppercase tracking-wider font-semibold">Aprovada — INSS</p>
               </div>
             </div>
             <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-border/50 flex flex-col justify-between hover:shadow-xl transition-shadow rise-card">
               <div>
                  <div className="flex text-amber-400 mb-6 font-bold space-x-1">
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed italic mb-8">"A análise de Pareto e o microlearning salvaram minha preparação. Estava focado em assuntos errados até mapear meu edital aqui. O resultado veio e rápido."</p>
               </div>
               <div>
                  <h4 className="text-text-main font-bold font-display">Rafael M.</h4>
                  <p className="text-text-sub text-xs uppercase tracking-wider font-semibold">Aprovado — TJ-SP</p>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 px-6 bg-slate-50 relative border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 space-y-3">
             <div className="text-primary font-bold text-[10px] uppercase tracking-widest">Dúvidas Frequentes</div>
             <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main tracking-tight">Perguntas que todo concurseiro faz</h2>
          </div>
          <div className="space-y-4">
             {[
               { q: 'A plataforma é gratuita para começar?', a: 'Sim! Você pode criar sua conta e começar a usar hoje, sem precisar de cartão de crédito. O plano gratuito já inclui o mapeamento de edital e o cronograma básico.' },
               { q: 'Preciso ter o edital em mãos para usar?', a: 'O ideal é ter o edital disponível, mas não é obrigatório. Se você ainda não tem um concurso definido, pode usar nosso sistema para montar um plano de estudos generalista por área.' },
               { q: 'Funciona para qualquer concurso ou banca?', a: 'Funciona! A plataforma já tem dados históricos de diversas bancas e concursos. E se o seu concurso for novo, você pode cadastrar o edital manualmente em minutos.' },
               { q: 'Posso importar cronogramas de outras pessoas?', a: 'Sim! A nossa comunidade tem milhares de cronogramas compartilhados por aprovados. Você pode importar, adaptar e usar como ponto de partida para sua própria preparação.' },
               { q: 'O sistema funciona no celular?', a: 'Totalmente. A plataforma é responsiva e funciona muito bem no celular e tablet. Você estuda de onde estiver, com seu plano sempre atualizado.' },
             ].map((faq, i) => (
               <details key={i} className="group bg-white border border-border rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden shadow-sm">
                 <summary className="flex cursor-pointer items-center justify-between gap-1.5 p-6 text-text-main font-display font-bold hover:bg-slate-50 transition-colors">
                   <span className="text-lg">{faq.q}</span>
                   <span className="relative size-5 shrink-0 text-text-sub">
                     <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 opacity-100 group-open:opacity-0 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                     </svg>
                     <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 opacity-0 group-open:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                     </svg>
                   </span>
                 </summary>
                 <div className="bg-white px-6 pb-6 text-text-sub font-medium leading-relaxed">
                   {faq.a}
                 </div>
               </details>
              ))}
           </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 md:py-40 px-6 bg-slate-50 relative overflow-hidden border-t border-slate-200/60">
        <div className="absolute inset-0 bg-white/50 z-0"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-5xl z-0">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-secondary/10 blur-[150px] rounded-full animate-pulse"></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-8">
           <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-10 border border-slate-100">
              <BrandLogo className="w-10 h-10 text-secondary" />
           </div>
           
           <h2 className="text-5xl md:text-7xl font-display leading-[1.05] tracking-tight font-black text-slate-900">
             Sua aprovação <br />
             <span className="text-primary underline decoration-wavy decoration-3 underline-offset-8">começa agora</span>.
           </h2>
           <p className="text-slate-600 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed pt-2">
             Junte-se a concurseiros que pararam de perder horas fazendo cronogramas no Excel e já estudam com inteligência artificial hoje.
           </p>
           
           <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link 
                to="/auth"
                className="w-full sm:w-auto bg-secondary text-white hover:bg-secondary/95 px-12 py-6 text-sm md:text-base tracking-widest uppercase shadow-2xl shadow-secondary/25 hover:shadow-secondary/40 rounded-2xl font-black hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 group"
               >
                 Criar Meu Cronograma Grátis
                 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </Link>
            </div>
            
            <p className="text-slate-500 font-bold text-sm tracking-wider uppercase mt-6 p-2">Sem custo escondido. Não pedimos cartão de crédito.</p>
         </div>
       </section>

       {/* Footer */}
      <footer className="py-20 border-t border-slate-100 bg-white px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
           <div className="col-span-1 md:col-span-2 space-y-6">
              <BrandLogo size="md" />
              <p className="text-text-sub max-w-sm text-sm font-medium leading-relaxed">
                Stratis Planner. Tecnologia de alto desempenho para concurseiros estrategistas.
              </p>
           </div>
           <div className="grid grid-cols-2 lg:grid-cols-3 gap-12 col-span-2">
              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ecossistema</h4>
                 <ul className="space-y-2.5 text-xs font-semibold text-text-sub">
                    <li>
                       <Link 
                         to="/planos" 
                         className="hover:text-primary transition-colors cursor-pointer uppercase tracking-wider"
                       >
                          Planos e Preços
                       </Link>
                    </li>
                    <li className="hover:text-primary transition-colors cursor-pointer uppercase tracking-wider">Painéis</li>
                    <li className="hover:text-primary transition-colors cursor-pointer uppercase tracking-wider">Cronogramas</li>
                 </ul>
              </div>
              <div className="space-y-6">
                 <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Redes Sociais</h4>
                    <div className="flex items-center gap-3 text-text-sub pt-1">
                       <a 
                         href="https://www.instagram.com/stratis.planner/" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200/50 text-slate-500 hover:text-pink-600 hover:border-pink-300 hover:bg-pink-50/30 rounded-xl transition-all duration-300 shadow-sm hover:shadow"
                         title="Instagram"
                       >
                         <Instagram className="w-5 h-5" />
                       </a>
                       <a 
                         href="#" 
                         onClick={(e) => { e.preventDefault(); }}
                         className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200/50 text-slate-500 hover:text-black hover:border-slate-400 hover:bg-slate-100/50 rounded-xl transition-all duration-300 shadow-sm hover:shadow"
                         title="TikTok"
                       >
                         <svg 
                           stroke="currentColor" 
                           fill="currentColor" 
                           strokeWidth="0" 
                           viewBox="0 0 448 512" 
                           className="w-5 h-5" 
                           xmlns="http://www.w3.org/2000/svg"
                         >
                           <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" />
                         </svg>
                       </a>
                       <a 
                         href="#" 
                         onClick={(e) => { e.preventDefault(); }}
                         className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200/50 text-slate-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50/30 rounded-xl transition-all duration-300 shadow-sm hover:shadow"
                         title="YouTube"
                       >
                         <Youtube className="w-5 h-5" />
                       </a>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Download</h4>
                    <div className="flex flex-col gap-2 max-w-[153px]">
                       <a 
                         href="#" 
                         onClick={(e) => { e.preventDefault(); alert("O aplicativo para Computador estará pronto para download direto do site em breve! Você também pode continuar usando nossa versão Web de alta performance pelo navegador."); }}
                         className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200/70 hover:border-indigo-500 hover:bg-indigo-50/20 text-slate-600 hover:text-indigo-600 rounded-xl transition-all duration-300 cursor-pointer text-[10px] font-bold uppercase tracking-wider shadow-sm"
                       >
                         <Laptop className="w-3.5 h-3.5 shrink-0" />
                         <span className="truncate">Computador</span>
                       </a>
                       <a 
                         href="#" 
                         onClick={(e) => { e.preventDefault(); alert("O aplicativo para Celular estará pronto para download direto do site em breve! Você também pode adicionar este site como atalho PWA na sua tela de início."); }}
                         className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200/70 hover:border-indigo-500 hover:bg-indigo-50/20 text-slate-600 hover:text-indigo-600 rounded-xl transition-all duration-300 cursor-pointer text-[10px] font-bold uppercase tracking-wider shadow-sm"
                       >
                         <Smartphone className="w-3.5 h-3.5 shrink-0" />
                         <span className="truncate">Celular</span>
                       </a>
                    </div>
                  </div>
              </div>
              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compliance</h4>
                 <ul className="space-y-2.5 text-xs font-semibold text-text-sub">
                    <li><Link to="/termos" className="hover:text-primary transition-colors uppercase tracking-wider">Termos</Link></li>
                    <li><Link to="/privacidade" className="hover:text-primary transition-colors uppercase tracking-wider">Privacidade</Link></li>
                    <li><Link to="/cookies" className="hover:text-primary transition-colors uppercase tracking-wider">Cookies</Link></li>
                 </ul>
              </div>
           </div>
         </div>
         <div className="max-w-7xl mx-auto pt-8 mt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stratis Planner 2026 — Estratégia de alto nível para concursos</span>
         </div>
      
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/5595984195211?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20o%20Stratis%20Planner."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 p-3.5 bg-[#25D366] text-white rounded-full shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.5)] hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center justify-center group"
        aria-label="Contatar suporte via WhatsApp"
        title="Fale conosco no WhatsApp"
      >
        <svg 
          viewBox="0 0 24 24" 
          width="32" 
          height="32" 
          className="fill-current" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
        </svg>
      </a>
    </div>
  );
};

export default Landing;
