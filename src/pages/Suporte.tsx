import React, { useState } from 'react';
import { 
  MessageCircle, 
  Mail, 
  Instagram, 
  ChevronDown, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem = ({ question, answer }: FAQItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left group transition-all"
      >
        <span className={cn(
          "text-sm font-bold uppercase tracking-tight transition-colors",
          isOpen ? "text-primary" : "text-text-main group-hover:text-primary"
        )}>
          {question}
        </span>
        <ChevronDown className={cn(
          "w-4 h-4 text-text-sub transition-transform duration-300",
          isOpen ? "rotate-180 text-primary" : "group-hover:text-primary"
        )} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-[13px] leading-relaxed text-text-sub font-medium">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Suporte() {
  const faqs = [
    {
      question: "Como a inteligência artificial do Stratis otimiza meu tempo de estudo?",
      answer: "Nossa IA utiliza o princípio de Pareto (80/20) para analisar o edital e identificar os tópicos recorrentes. Em vez de estudar tudo com a mesma intensidade, você foca 80% do seu esforço nos 20% de conteúdo que geram 80% das questões de prova, otimizando drasticamente sua velocidade de aprendizado."
    },
    {
      question: "Qual a diferença entre a Trilha de Estudos e um Cronograma comum?",
      answer: "Um cronograma comum é estático e ignora seu desempenho. A Trilha Stratis é dinâmica: se você domina um assunto rápido, ela avança; se encontra dificuldade, ela reagenda revisões automáticas no ciclo MEPP para garantir que o conhecimento não seja esquecido antes da prova."
    },
    {
      question: "O que é o Método MEPP e por que ele é eficaz?",
      answer: "O MEPP (Método de Estudo por Performance e Pareto) foca na memorização ativa. Ele intercala Teoria e Prática de forma estratégica, utilizando a Curva do Esquecimento para disparar alertas de revisão nos momentos em que seu cérebro está prestes a deletar a informação, consolidando a memória de longo prazo."
    },
    {
      question: "Como funciona o Simulador de Questões integrado?",
      answer: "O simulador não é apenas um banco de questões. Ele está conectado à sua trilha. Após cada bloco teórico, ele apresenta questões filtradas exatamente sobre o que você acabou de estudar. Os erros são mapeados e geram 'pontos de atenção' na sua análise de desempenho."
    },
    {
      question: "Posso importar qualquer edital em PDF?",
      answer: "Sim! Nossa tecnologia de processamento de linguagem natural (NLP) consegue ler editais de qualquer banca brasileira (Cespe, FGV, FCC, etc.). Basta subir o arquivo e a IA organiza as disciplinas por importância e peso estatístico."
    },
    {
      question: "O que fazer se eu atrasar um dia no cronograma?",
      answer: "Não se desespere. O sistema possui um algoritmo de 'Rebalanceamento'. Ao sinalizar que não cumpriu a meta, você pode optar por distribuir a carga nos próximos dias ou priorizar apenas os tópicos de alta relevância (Pareto) para não perder o ritmo."
    },
    {
      question: "Como funcionam os Flashcards e Mapas Mentais via IA?",
      answer: "No plano PRO, você não precisa criar material do zero. Ao estudar um tópico, nossa IA gera sugestões de Flashcards para revisão ativa e Mapas Mentais que conectam os conceitos-chave, poupando horas de trabalho manual de resumo."
    },
    {
      question: "O Stratis Planner substitui meus cursos preparatórios?",
      answer: "O Stratis é um ecossistema de Gestão de Estudo. Ele não substitui suas videoaulas ou livros, mas diz quando, como e o que estudar desses materiais para garantir a aprovação, funcionando como um mentor digital de alta performance."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10 pb-20 focus-within:outline-none pt-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-1">
        {/* Contact Cards */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-4">
          <h3 className="text-[10px] font-black text-text-sub uppercase tracking-[0.2em] px-1">Canais de Contato</h3>
          
          <div className="space-y-3">
            <a 
              href="https://wa.me/5595984195211?text=Olá!%20Preciso%20de%20ajuda%20com%20o%20Stratis%20Planner." 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 md:p-5 bg-white border border-border rounded-2xl hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/5 transition-all group active:scale-[0.98]"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform shrink-0">
                <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs md:text-sm font-bold text-text-main uppercase tracking-tight truncate">WhatsApp</div>
                <div className="text-[10px] md:text-[11px] text-text-sub font-medium truncate">Atendimento em tempo real</div>
              </div>
              <ExternalLink className="w-4 h-4 text-text-sub/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>

            <a 
              href="mailto:suporte@stratisplanner.com.br" 
              className="flex items-center gap-4 p-4 md:p-5 bg-white border border-border rounded-2xl hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all group active:scale-[0.98]"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                <Mail className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs md:text-sm font-bold text-text-main uppercase tracking-tight truncate">E-mail</div>
                <div className="text-[10px] md:text-[11px] text-text-sub font-medium truncate">suporte@stratisplanner.com.br</div>
              </div>
              <ExternalLink className="w-4 h-4 text-text-sub/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>

            <a 
              href="https://instagram.com/stratisplanner" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 md:p-5 bg-white border border-border rounded-2xl hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/5 transition-all group active:scale-[0.98]"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform shrink-0">
                <Instagram className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs md:text-sm font-bold text-text-main uppercase tracking-tight truncate">Instagram</div>
                <div className="text-[10px] md:text-[11px] text-text-sub font-medium truncate">@stratisplanner</div>
              </div>
              <ExternalLink className="w-4 h-4 text-text-sub/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>

          {/* Quick Help Box */}
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl mt-6 md:mt-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-border rounded-full text-[9px] font-black text-text-main uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Segurança
            </div>
            <h4 className="text-sm font-bold text-text-main uppercase tracking-tight leading-snug">Seus dados estão protegidos conosco.</h4>
            <p className="text-[11px] text-text-sub leading-relaxed font-medium">
              Utilizamos infraestrutura de ponta e criptografia para garantir que seu progresso e informações pessoais estejam sempre seguros.
            </p>
          </div>
        </motion.div>

        {/* FAQ & Form */}
        <div className="lg:col-span-2 space-y-10">
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="rise-card rounded-3xl px-6 md:px-8">
              {faqs.map((faq, idx) => (
                <FAQItem key={idx} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
