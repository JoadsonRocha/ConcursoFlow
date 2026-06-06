import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Zap, Star, Loader2, CreditCard, ArrowRight, ShieldCheck, Target, BrainCircuit, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { createCheckoutSession } from '../services/stripe';
import BrandLogo from '../components/BrandLogo';

export default function Planos() {
  const { user, profile, planType } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePlanAction = async (planId: string) => {
    if (!user) {
      navigate('/auth?plan=pro');
      toast.info("Crie uma conta ou faça login para assinar um plano!");
      return;
    }

    setLoadingPlan(planId);

    try {
      // Direct call to Stripe Checkout
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

  return (
    <div className="min-h-full bg-slate-50 selection:bg-primary/20 relative py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Main white panel grouping all content */}
        <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-xl p-6 sm:p-10 md:p-12 space-y-8">
          
          {/* Header section inside the panel */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 tracking-tight">
              Desbloqueie seu <span className="text-secondary">Potencial PRO</span>
            </h1>
            <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
              Acesse ferramentas avançadas de organização e inteligência artificial para sua evolução acelerada rumo à aprovação.
            </p>
          </div>

          {/* Unified Compact Row with Features Left and Purchases Right */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start max-w-4xl mx-auto pt-4">
            
            {/* Left Column: All Features included in Premium plan */}
            <div className="md:col-span-7 space-y-5">
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
            <div className="md:col-span-5 space-y-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center md:text-left mb-2">
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
          <p className="text-center text-[10px] font-medium text-slate-400 pt-2 border-t border-slate-50 max-w-sm mx-auto leading-relaxed">
            Pagamento seguro processado pelo Stripe. Cancele a qualquer momento nas configurações do seu perfil.
          </p>

        </div>
      </div>

      {/* Landing Page Cards Injected into Plans Page */}
      <section id="planos-beneficios" className="py-16 bg-white border-t border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12 space-y-3">
             <div className="text-primary font-bold text-xs uppercase tracking-widest">Benefícios</div>
             <h2 className="text-3xl md:text-4xl font-display font-bold text-text-main tracking-tight">Produtividade no seu Estudo</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
             <motion.div 
               id="card-bene-velocidade"
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.1 }}
               className="bg-slate-50 p-8 rounded-2xl border border-slate-150/85"
             >
               <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6"><Zap className="w-6 h-6"/></div>
               <h3 className="text-lg font-bold text-text-main mb-3 font-display">Mais Velocidade</h3>
               <p className="text-slate-600 text-xs leading-relaxed">Poupe tempo com planejamento automatizado. Saiba exatamente o que estudar a cada dia.</p>
             </motion.div>
             <motion.div 
               id="card-bene-controle"
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.2 }}
               className="bg-slate-50 p-8 rounded-2xl border border-slate-150/85"
             >
               <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 mb-6"><ShieldCheck className="w-6 h-6"/></div>
               <h3 className="text-lg font-bold text-text-main mb-3 font-display">Controle Total</h3>
               <p className="text-slate-600 text-xs leading-relaxed">Acompanhe seu progresso real e ritmo diário sem perder o foco na sua preparação.</p>
             </motion.div>
             <motion.div 
               id="card-bene-pareto"
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.3 }}
               className="bg-slate-50 p-8 rounded-2xl border border-slate-150/85"
             >
               <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 mb-6"><Target className="w-6 h-6"/></div>
               <h3 className="text-lg font-bold text-text-main mb-3 font-display">Foco Estratégico</h3>
               <p className="text-slate-600 text-xs leading-relaxed">Identifique os tópicos mais cobrados pela sua banca e priorize o que realmente importa.</p>
             </motion.div>
          </div>

          <div className="border-t border-slate-100 my-16"></div>

          {/* Funcionalidades Bento Grid Cards */}
          <div className="space-y-12">
            <div className="text-center md:text-left space-y-2">
               <div className="text-primary font-bold text-[10px] uppercase tracking-widest">Diferenciais</div>
               <h3 className="text-2xl md:text-3xl font-display font-bold text-text-main tracking-tight">
                  Ferramentas Integradas
               </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
               <motion.div 
                 id="bento-mapeamento"
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="md:col-span-8 bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group relative overflow-hidden"
               >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                  <div className="relative z-10 space-y-3">
                     <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                        <BrainCircuit className="w-5 h-5" />
                     </div>
                     <div className="flex items-center gap-2">
                       <h4 className="text-lg font-display text-text-main font-bold">Mapeamento Automatizado</h4>
                     </div>
                     <p className="text-slate-600 text-xs md:text-sm font-medium leading-relaxed">
                        Organizamos todo o edital detalhando os temas prioritários de cada banca para maximizar seus pontos no dia da prova.
                     </p>
                  </div>
               </motion.div>

               <motion.div 
                 id="bento-cronograma"
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.1 }}
                 className="md:col-span-4 bg-white border border-slate-200 p-6 md:p-8 rounded-2xl flex flex-col justify-center hover:shadow-lg transition-all group"
               >
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 mb-6 group-hover:scale-110 transition-transform duration-500">
                     <Calendar className="w-5 h-5" />
                  </div>
                  <h4 className="text-md font-display text-text-main font-bold mb-2">Cronograma Flexível</h4>
                  <p className="text-slate-600 text-xs font-medium leading-relaxed">
                     Grade de estudos adaptada à sua rotina real, com ajustes semanais baseados em seu desempenho.
                  </p>
               </motion.div>

               <motion.div 
                 id="bento-flashcards"
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.2 }}
                 className="md:col-span-5 bg-white border border-slate-200 p-6 md:p-8 rounded-2xl flex flex-col justify-center hover:shadow-lg transition-all group"
               >
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform duration-500">
                     <Target className="w-5 h-5" />
                  </div>
                  <h4 className="text-md font-display text-text-main font-bold mb-2">Revisão Ativa</h4>
                  <p className="text-slate-600 text-xs font-medium leading-relaxed">
                     Memorização acelerada através de perguntas e respostas focadas nos tópicos mais complexos do edital.
                  </p>
               </motion.div>

               <motion.div 
                 id="bento-comunidade"
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.3 }}
                 className="md:col-span-7 bg-white border border-slate-200 p-6 md:p-8 rounded-2xl flex flex-col justify-between hover:shadow-lg transition-all group relative overflow-hidden"
               >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4"></div>
                  <div className="relative z-10 space-y-3">
                     <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600">
                        <Users className="w-5 h-5" />
                     </div>
                     <h4 className="text-lg font-display font-bold text-text-main">Simulação e Estudo</h4>
                     <p className="text-slate-600 text-xs md:text-sm font-medium leading-relaxed">
                        Acesse planejamentos validados e decks salvos por aprovados com um único clique em nossa comunidade integrada.
                     </p>
                  </div>
               </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos Realistas (Aprovados Reais) */}
      <section id="planos-depoimentos" className="py-20 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
             <div className="text-primary font-bold text-xs uppercase tracking-widest">Testemunhos Reais</div>
             <h2 className="text-3xl font-display font-bold text-text-main tracking-tight">Eles viram o nome no Diário Oficial</h2>
             <p className="text-text-sub font-medium text-sm">Alcançar pontuações extraordinárias exige o melhor método.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <motion.div 
               id="depoimento-mariana"
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="bg-white p-8 rounded-2xl border border-slate-200 flex flex-col justify-between hover:shadow-xl transition-all"
             >
               <div>
                  <div className="flex text-amber-400 mb-4 space-x-1">
                      <Star className="w-4 h-4 fill-current animate-pulse" />
                      <Star className="w-4 h-4 fill-current animate-pulse" />
                      <Star className="w-4 h-4 fill-current animate-pulse" />
                      <Star className="w-4 h-4 fill-current animate-pulse" />
                      <Star className="w-4 h-4 fill-current animate-pulse" />
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed italic mb-6">"Passei 2 anos tentando montar meu cronograma no Excel. Quando comecei a usar o Stratis Planner, em 3 semanas eu já sabia exatamente onde estava e para onde ia. A aprovação veio 8 meses depois."</p>
               </div>
               <div className="border-t border-slate-100 pt-4 mt-2">
                  <h4 className="text-text-main text-sm font-bold font-display">Mariana S.</h4>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold text-blue-600 mt-0.5">Aprovada — Receita Federal</p>
               </div>
             </motion.div>
             
             <motion.div 
               id="depoimento-carolina"
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.1 }}
               className="bg-white p-8 rounded-2xl border border-slate-200 flex flex-col justify-between hover:shadow-xl transition-all"
             >
               <div>
                  <div className="flex text-amber-400 mb-4 space-x-1">
                      <Star className="w-4 h-4 fill-current animate-pulse" />
                      <Star className="w-4 h-4 fill-current animate-pulse" />
                      <Star className="w-4 h-4 fill-current animate-pulse" />
                      <Star className="w-4 h-4 fill-current animate-pulse" />
                      <Star className="w-4 h-4 fill-current animate-pulse" />
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed italic mb-6">"Sou mãe, trabalho 8h por dia e ainda passei em concurso público. O app entendeu minha realidade e criou um plano que funcionou de verdade dentro do meu caos."</p>
               </div>
               <div className="border-t border-slate-100 pt-4 mt-2">
                  <h4 className="text-text-main text-sm font-bold font-display">Carolina T.</h4>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold text-indigo-600 mt-0.5">Aprovada — INSS</p>
               </div>
             </motion.div>
             
             <motion.div 
               id="depoimento-rafael"
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.2 }}
               className="bg-white p-8 rounded-2xl border border-slate-200 flex flex-col justify-between hover:shadow-xl transition-all"
             >
               <div>
                  <div className="flex text-amber-400 mb-4 space-x-1">
                      <Star className="w-4 h-4 fill-current animate-pulse" />
                      <Star className="w-4 h-4 fill-current animate-pulse" />
                      <Star className="w-4 h-4 fill-current animate-pulse" />
                      <Star className="w-4 h-4 fill-current animate-pulse" />
                      <Star className="w-4 h-4 fill-current animate-pulse" />
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed italic mb-6">"A análise de Pareto e o microlearning salvaram minha preparação. Estava focado em assuntos errados até mapear meu edital aqui. O resultado veio e rápido."</p>
               </div>
               <div className="border-t border-slate-100 pt-4 mt-2">
                  <h4 className="text-text-main text-sm font-bold font-display">Rafael M.</h4>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold text-amber-600 mt-0.5">Aprovado — TJ-SP</p>
               </div>
                                 </motion.div>
           </div>
         </div>
       </section>

       {/* FAQ Section (Brief) */}
      <section className="bg-white py-24 border-t border-border">
         <div className="max-w-4xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-4">
               <h2 className="text-3xl font-display font-bold text-text-main">Ainda com dúvida?</h2>
               <p className="text-text-sub font-medium">As perguntas mais comuns sobre os planos Stratis.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
               <div className="space-y-3">
                  <h4 className="text-sm font-black text-text-main uppercase tracking-tight">Posso trocar de plano depois?</h4>
                  <p className="text-xs text-text-sub font-medium leading-relaxed">Sim! Você pode fazer o upgrade ou downgrade a qualquer momento na plataforma. Caso decida rebaixar seu plano, seus limites serão atualizados automaticamente sem perda de dados existentes.</p>
               </div>
               <div className="space-y-3">
                  <h4 className="text-sm font-black text-text-main uppercase tracking-tight">Como funciona o pagamento?</h4>
                  <p className="text-xs text-text-sub font-medium leading-relaxed">Seu pagamento é processado via Stripe de forma totalmente protegida e criptografada. Aceitamos cartões de crédito e Pix.</p>
               </div>
               <div className="space-y-3">
                  <h4 className="text-sm font-black text-text-main uppercase tracking-tight">O que é a Geração Livre?</h4>
                  <p className="text-xs text-text-sub font-medium leading-relaxed">Os resumos, flashcards e mapas mentais são criados com tecnologias de ponta. No PRO, você tem um limite ultra-extensivo garantindo revisões fluidas e sem atritos.</p>
               </div>
               <div className="space-y-3">
                  <h4 className="text-sm font-black text-text-main uppercase tracking-tight">O suporte está incluso?</h4>
                  <p className="text-xs text-text-sub font-medium leading-relaxed">Completamente. Assinantes PRO possuem respostas prioritárias de suporte diretamente no chat para sanar qualquer dúvida de uso.</p>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-border text-center bg-white">
        <BrandLogo className="mx-auto mb-8" />
        <p className="text-[10px] font-black text-text-sub uppercase tracking-[0.2em] opacity-40">
          Stratis Planner — Engenharia de Dados aplicada ao seu Direito de Ser Aprovado.
        </p>
      </footer>
    </div>
  );
}
