import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Zap, LayoutDashboard, BrainCircuit, Calendar, Users, Target, FileUp, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../contexts/AuthContext';
import { createCheckoutSession } from '../services/stripe';
import { toast } from 'sonner';

export default function Planos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planType: 'monthly' | 'annual') => {
    if (!user) {
      navigate('/auth?plan=pro');
      return;
    }

    setLoading(planType);
    try {
      // In a real app, these values would come from environment variables passed to the service
      // For this demo, we'll assume the backend knows which price IDs to use based on the request
      // We'll pass a placeholder or identifier
      const priceId = planType === 'annual' ? 'annual_plan' : 'monthly_plan';
      await createCheckoutSession(priceId);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao iniciar checkout');
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      name: 'Estrategista PRO',
      tagline: 'O auge da produtividade',
      price: 'R$ 29,90',
      period: 'por mês',
      cta: 'Ser Elite',
      color: 'bg-gradient-to-b from-indigo-900 to-indigo-800 text-white',
      borderColor: 'border-indigo-500',
      textColor: 'text-indigo-100',
      isPro: true,
      features: [
        { name: 'Editais Ilimitados', desc: 'Gerencie múltiplos concursos simultâneos.' },
        { name: 'Sem Limites de IA', desc: 'Flashcards e Mapas mentais sem travas.' },
        { name: 'Prioridade Total', desc: 'Gerações 5x mais rápidas que o gratuito.' },
        { name: 'Exportação PDF', desc: 'Leve seu plano de estudo para onde quiser.' },
        { name: 'Suporte VIP', desc: 'Contato direto com nosso time técnico.' },
      ],
      pro: true
    },
    {
      name: 'Acesso BETA',
      tagline: 'Equilíbrio e performance',
      price: 'R$ 0',
      period: 'gratuito temporário',
      cta: 'Experimentar Beta',
      color: 'bg-white border-2 border-amber-500/30',
      borderColor: 'border-amber-500/50',
      textColor: 'text-slate-800',
      isBeta: true,
      features: [
        { name: '2 Editais Ativos', desc: 'Perfeito para quem foca em áreas similares.' },
        { name: '50 Flashcards', desc: 'Espaço de sobra para fixar os pontos cegos.' },
        { name: '10 Mapas Mentais', desc: 'Mapeie as matérias mais difíceis com IA.' },
        { name: '25 Resumos/Edital', desc: 'Estude o triplo com a ajuda da nossa IA.' },
        { name: 'Acesso Antecipado', desc: 'Teste novas funções antes de todo mundo.' },
      ],
      pro: false,
      beta: true
    },
    {
      name: 'Plano Semente',
      tagline: 'O início da jornada',
      price: 'R$ 0',
      period: 'para sempre',
      cta: 'Começar Grátis',
      color: 'bg-slate-50',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-600',
      features: [
        { name: '1 Edital Ativo', desc: 'Foque 100% em um único objetivo.' },
        { name: '20 Flashcards', desc: 'O essencial para os temas mais cobrados.' },
        { name: '3 Mapas Mentais', desc: 'Inicie sua organização visual.' },
        { name: '10 Resumos/Edital', desc: 'Resumos estratégicos via IA.' },
        { name: 'Comunidade AI', desc: 'Compartilhe e aprenda com outros.' },
      ],
      pro: false
    }
  ];

  return (
    <div className="min-h-full bg-bg selection:bg-primary/20">
      {/* Hero */}
      <section className="py-12 md:py-20 px-6 max-w-4xl mx-auto text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-[0.3em] px-5 py-2 rounded-full border border-amber-500/20 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" /> Fase Beta Inicial
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-5xl font-display font-bold text-text-main tracking-tight leading-[1.1]"
        >
          Acesso <span className="text-primary italic">PRO 100% Gratuito</span> <br />
          enquanto durar o Beta
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-text-sub text-sm md:text-base font-medium max-w-xl mx-auto"
        >
          Estamos em fase de lançamento. No momento, todos os usuários possuem acesso ilimitado às ferramentas de IA e produtividade como forma de agradecimento pelo feedback inicial.
        </motion.p>
      </section>

      {/* Plans Grid */}
      <section className="px-6 py-10 max-w-7xl mx-auto mb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className={cn(
                "p-6 sm:p-7 rounded-[2rem] border relative overflow-hidden flex flex-col h-full",
                plan.borderColor,
                plan.color,
                plan.pro ? "shadow-2xl shadow-indigo-900/20 md:scale-105 z-10 border-indigo-500/50" : "shadow-md"
              )}
            >
              {(plan.pro || plan.beta) && (
                <div className={cn(
                  "absolute top-0 right-0 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-bl-xl shadow-lg",
                  plan.pro ? "bg-amber-500 text-white" : "bg-indigo-500 text-white"
                )}>
                  {plan.pro ? 'ELITE 💎' : 'PRESENTE 🎁'}
                </div>
              )}
              
              <div className="mb-8 space-y-3">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full inline-block",
                  plan.pro ? "bg-indigo-500/20 text-indigo-200 border border-indigo-500/30" : "bg-slate-100 text-slate-500 border border-slate-200"
                )}>
                  {plan.pro ? '⚡ Acesso Ilimitado' : '🌱 Plano Padrão'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-bold leading-tight">{plan.name}</h2>
                <p className={cn("font-medium italic text-sm", plan.pro ? "text-indigo-200" : "text-slate-500")}>"{plan.tagline}"</p>
                
                <div className="pt-4">
                   <div className="flex items-baseline gap-2">
                     <span className="text-4xl sm:text-5xl font-black tracking-tight">{plan.price}</span>
                     <span className={cn("text-xs font-bold uppercase tracking-wider", plan.pro ? "text-indigo-300" : "text-slate-400")}>{plan.period}</span>
                   </div>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                 <p className={cn("text-xs font-bold uppercase tracking-[0.1em] border-b pb-3", plan.pro ? "text-indigo-200 border-indigo-700/50 opacity-80" : "text-slate-400 border-slate-200 opacity-60")}>O que está incluído:</p>
                 <div className="space-y-4">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex gap-3 group items-start">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                          plan.pro ? "bg-indigo-500/20 text-indigo-300 group-hover:scale-110" : "bg-slate-100 text-slate-400"
                        )}>
                          {plan.pro ? <Zap className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <div className="space-y-0.5 pt-1">
                           <h4 className="text-sm font-bold tracking-tight">{feature.name}</h4>
                           <p className={cn("text-xs font-medium leading-relaxed", plan.pro ? "text-indigo-200" : "text-slate-500")}>{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="mt-10 space-y-3">
                 <button 
                   onClick={() => plan.pro ? navigate('/') : null}
                   className={cn(
                     "w-full py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2",
                     plan.pro 
                      ? "bg-amber-500 text-white shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] hover:bg-amber-400" 
                      : "bg-slate-900 border text-white hover:bg-slate-800"
                   )}
                 >
                   {plan.pro ? 'Aproveitar Agora' : 'Em Breve'}
                   {!loading && <ArrowRight className="w-4 h-4" />}
                 </button>
                 
                 <p className={cn("text-center text-[9px] font-bold uppercase tracking-widest mt-3 opacity-60", plan.pro ? "text-indigo-300" : "text-slate-400")}>
                   {plan.pro ? 'Válido até o fim da fase de testes beta' : 'O plano clássico retornará em breve'}
                 </p>
              </div>
            </motion.div>
          ))}
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
                  <p className="text-xs text-text-sub font-medium leading-relaxed">Sim! Você pode fazer o upgrade a qualquer momento. Caso queira cancelar, a recorrência é interrompida imediatamente.</p>
               </div>
               <div className="space-y-3">
                  <h4 className="text-sm font-black text-text-main uppercase tracking-tight">Como funciona a garantia?</h4>
                  <p className="text-xs text-text-sub font-medium leading-relaxed">No plano PRO, você tem 7 dias para testar tudo. Se não ficar satisfeito, devolvemos 100% do valor sem perguntas.</p>
               </div>
               <div className="space-y-3">
                  <h4 className="text-sm font-black text-text-main uppercase tracking-tight">O que é a Geração Prioritária?</h4>
                  <p className="text-xs text-text-sub font-medium leading-relaxed">Nossa IA processa milhares de dados por dia. No PRO, seus pedidos de flashcards e mapas mentais pulam a fila e são processados em segundos.</p>
               </div>
               <div className="space-y-3">
                  <h4 className="text-sm font-black text-text-main uppercase tracking-tight">As faturas são seguras?</h4>
                  <p className="text-xs text-text-sub font-medium leading-relaxed">Sim. Utilizamos o Stripe, a maior e mais segura plataforma de pagamentos do mundo. Seus dados de cartão nunca tocam nossos servidores.</p>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-border text-center">
        <BrandLogo className="mx-auto mb-8" />
        <p className="text-[10px] font-black text-text-sub uppercase tracking-[0.2em] opacity-40">
          Stratis Planner — Engenharia de Dados aplicada ao seu Direito de Ser Aprovado.
        </p>
      </footer>
    </div>
  );
}
