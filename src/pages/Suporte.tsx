import React, { useState } from 'react';
import { 
  LifeBuoy, 
  MessageCircle, 
  Mail, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  HelpCircle,
  Clock,
  Sparkles,
  Instagram
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface FAQItem {
  question: string;
  answer: string;
  category: 'geral' | 'cronograma' | 'pro';
}

const FAQ_DATA: FAQItem[] = [
  {
    category: 'geral',
    question: 'Como funciona o Stratis Planner?',
    answer: 'O Stratis Planner é um ecossistema completo para concurseiros. Nós mapeamos seu edital de forma inteligente, dividimos o conteúdo programático em metas diárias realistas baseadas na Regra de Pareto (foco no que mais cai) e automatizamos suas revisões através do método MEPP.'
  },
  {
    category: 'geral',
    question: 'O que é o Método MEPP?',
    answer: 'O MEPP (Método de Estudo de Alta Performance) é focado em revisões programadas e repetição espaçada. Ele organiza automaticamente seus ciclos de revisão (24h, 7 dias, 30 dias) para que o conteúdo estudado permaneça na sua memória de longo prazo, evitando a curva do esquecimento.'
  },
  {
    category: 'geral',
    question: 'Posso acessar minha conta em múltiplos dispositivos?',
    answer: 'Sim! Sua conta do Stratis Planner é totalmente integrada na nuvem. Você pode estudar no computador, tablet ou smartphone, e seu progresso será sincronizado automaticamente e em tempo real.'
  },
  {
    category: 'geral',
    question: 'O Stratis Planner possui aplicativo para download?',
    answer: 'Nosso sistema funciona como um Web App de última geração (PWA). Você não precisa baixar nada nas lojas Google Play ou App Store: basta abrir o site no navegador do seu celular, clicar em "Adicionar à tela de início" nas opções do navegador e ele funcionará como um aplicativo nativo.'
  },
  {
    category: 'cronograma',
    question: 'Como o cronograma é calculado?',
    answer: 'Ao importar ou selecionar um edital, o sistema analisa a quantidade de tópicos de cada disciplina e distribui de forma proporcional à sua carga horária diária disponível, garantindo que você estude todo o edital de forma equilibrada até o dia da sua prova.'
  },
  {
    category: 'cronograma',
    question: 'Como ajustar o cronograma se eu me atrasar ou perder um dia de estudos?',
    answer: 'Sem estresse! Nosso cronograma é dinâmico. Se você perder um dia ou não conseguir completar uma meta, o sistema recalcula automaticamente as metas dos próximos dias de forma equilibrada, sem acumular matérias de maneira impraticável.'
  },
  {
    category: 'cronograma',
    question: 'Posso editar as matérias e tópicos do meu edital?',
    answer: 'Sim! Na aba "Disciplinas" ou nas Configurações, você pode adicionar novas matérias, criar tópicos personalizados, definir pesos de relevância e ajustar seu progresso manualmente a qualquer momento.'
  },
  {
    category: 'cronograma',
    question: 'Como funciona a Regra de Pareto (80/20) no cronograma?',
    answer: 'A Regra de Pareto indica que 80% das questões de concurso vêm de apenas 20% do edital. Nós analisamos historicamente o que mais cai e destacamos esses tópicos com tags de relevância ("Alta Prioridade"), ajudando você a priorizar os conteúdos mais importantes.'
  },
  {
    category: 'pro',
    question: 'Quais os benefícios do plano PRO?',
    answer: 'O plano PRO desbloqueia inteligência artificial para resumos, geração de flashcards inteligentes baseados no seu edital, acesso a todos os Audiocasts de revisão focada, grade avançada de similaridade entre editais e cronogramas múltiplos ilimitados.'
  },
  {
    category: 'pro',
    question: 'Como funciona a Grade de Similaridade?',
    answer: 'É uma ferramenta exclusiva que compara o conteúdo programático de dois editais diferentes. Ela calcula a porcentagem de compatibilidade e indica quais disciplinas você já está estudando que coincidem com o novo edital, facilitando a conciliação de estudos.'
  },
  {
    category: 'pro',
    question: 'Os flashcards com Inteligência Artificial são personalizáveis?',
    answer: 'Totalmente. A IA gera flashcards com perguntas e respostas baseadas nos exatos tópicos do seu edital. Após a geração, você pode revisar, editar, excluir ou adicionar novos flashcards manualmente para deixar seu baralho perfeito.'
  },
  {
    category: 'pro',
    question: 'Quais são os meios de pagamento e como funciona o cancelamento?',
    answer: 'Aceitamos Pix e Cartão de Crédito. No plano mensal, você pode cancelar a qualquer momento diretamente pelo seu painel de configurações sem qualquer multa ou burocracia. No plano anual, você garante um desconto super especial.'
  }
];

export default function Suporte() {
  const [activeTab, setActiveTab] = useState<'todos' | 'geral' | 'cronograma' | 'pro'>('todos');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const filteredFaqs = FAQ_DATA.filter(faq => {
    if (activeTab === 'todos') return true;
    return faq.category === activeTab;
  });

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="space-y-8 pb-12 pt-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-indigo-600 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-primary/10">
        <div className="absolute right-[-5%] top-[-10%] opacity-10">
          <LifeBuoy className="w-64 h-64 rotate-45" />
        </div>
        
        <div className="max-w-2xl space-y-2">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
            Suporte
          </h2>
          <p className="text-xs text-white/90 font-medium leading-relaxed">
            Esclareça suas dúvidas e entre em contato conosco.
          </p>
        </div>
      </div>

      {/* Grid Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* WhatsApp Card */}
        <div className="bg-white border border-border rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
              <MessageCircle className="w-6 h-6 fill-emerald-500/10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-text-main uppercase tracking-tight">Atendimento WhatsApp</h3>
              <p className="text-[11px] text-text-sub font-medium leading-relaxed">
                Fale diretamente conosco no WhatsApp pelo número <span className="font-bold text-emerald-600">(95) 98419-5211</span> para tirar dúvidas administrativas ou de assinatura.
              </p>
            </div>
          </div>
          <a 
            href="https://wa.me/5595984195211?text=Ol%C3%A1,%20gostaria%20de%20tirar%20uma%20d%C3%BAvida%20sobre%20o%20Stratis%20Planner." 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-black uppercase text-emerald-600 hover:text-emerald-700 tracking-wider hover:underline pt-2"
          >
            Chamar no WhatsApp <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Instagram Card */}
        <div className="bg-white border border-border rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-500">
              <Instagram className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-text-main uppercase tracking-tight">Suporte Instagram</h3>
              <p className="text-[11px] text-text-sub font-medium leading-relaxed">
                Acompanhe dicas diárias, novidades do planner e tire suas dúvidas por direct em <span className="font-bold text-pink-500">@stratis.planner</span>.
              </p>
            </div>
          </div>
          <a 
            href="https://www.instagram.com/stratis.planner/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-black uppercase text-pink-500 hover:text-pink-600 tracking-wider hover:underline pt-2"
          >
            Seguir Instagram <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Email Card */}
        <div className="bg-white border border-border rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-text-main uppercase tracking-tight">Suporte por E-mail</h3>
              <p className="text-[11px] text-text-sub font-medium leading-relaxed">
                Envie suas sugestões, feedbacks detalhados ou dúvidas técnicas sobre as ferramentas.
              </p>
            </div>
          </div>
          <a 
            href="mailto:suporte@stratisplanner.com.br" 
            className="inline-flex items-center gap-2 text-xs font-black uppercase text-primary hover:text-primary/85 tracking-wider hover:underline pt-2"
          >
            Enviar E-mail <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Manual/Documentation Card */}
        <div className="bg-white border border-border rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-text-main uppercase tracking-tight">Termos & Políticas</h3>
              <p className="text-[11px] text-text-sub font-medium leading-relaxed">
                Consulte nossas regras de privacidade, termos de uso e políticas de reembolso.
              </p>
            </div>
          </div>
          <div className="flex gap-4 pt-2">
            <a 
              href="/termos" 
              className="text-xs font-black uppercase text-indigo-600 hover:text-indigo-700 tracking-wider hover:underline"
            >
              Termos
            </a>
            <a 
              href="/privacidade" 
              className="text-xs font-black uppercase text-indigo-600 hover:text-indigo-700 tracking-wider hover:underline"
            >
              Privacidade
            </a>
          </div>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="bg-white border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h3 className="text-sm md:text-base font-black text-text-main uppercase tracking-tight">Perguntas Frequentes (FAQ)</h3>
          </div>
          
          {/* Tabs Filter */}
          <div className="flex flex-wrap sm:flex-nowrap gap-1.5 py-0.5">
            {[
              { id: 'todos', label: 'Ver Todas' },
              { id: 'geral', label: 'Geral' },
              { id: 'cronograma', label: 'Cronograma' },
              { id: 'pro', label: 'Assinatura Pro' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setOpenFaqIndex(null); }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-primary border-primary text-white"
                    : "bg-slate-50 border-border text-text-sub hover:bg-slate-100"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accordions */}
        <div className="divide-y divide-slate-100">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div key={index} className="py-4 first:pt-0 last:pb-0">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between text-left gap-4 group py-1"
                >
                  <span className="text-xs sm:text-sm font-bold text-text-main group-hover:text-primary transition-colors pr-2">
                    {faq.question}
                  </span>
                  <span className="text-text-sub group-hover:text-primary transition-colors shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-[11px] sm:text-xs text-text-sub leading-relaxed pt-3 pb-2 max-w-3xl font-medium">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
