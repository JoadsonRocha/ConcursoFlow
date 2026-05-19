import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { BookOpen, Brain, Zap, Users, ArrowRight, LayoutDashboard, Clock, ListChecks, BarChart } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function EmptyState({ featuredContests }: { featuredContests: any[] }) {
  const features = [
    { icon: LayoutDashboard, title: "Cronogramas Personalizados", desc: "Estrutura otimizada para seu concurso." },
    { icon: Brain, title: "Flashcards Inteligentes", desc: "Revisão ativa e memorização eficaz." },
    { icon: Zap, title: "Mapas Mentais", desc: "Visualização clara dos tópicos." },
    { icon: BookOpen, title: "Resumos", desc: "Conteúdo direto ao ponto." },
    { icon: Clock, title: "Sessão de Estudos", desc: "Gerencie seu tempo de forma eficiente." },
    { icon: ListChecks, title: "Edital Verticalizado", desc: "Acompanhe todo o conteúdo programático." },
    { icon: BarChart, title: "Pareto", desc: "Foco nos tópicos de maior relevância." },
    { icon: Users, title: "Comunidades", desc: "Aprenda e compartilhe com outros concurseiros." }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-20"
    >
      {/* Hero */}
      <section className="text-center space-y-4 pt-4">
        <h2 className="text-3xl md:text-4xl font-display text-text-main tracking-tight font-bold italic">
           Bem-vindo ao <span className="text-primary">Stratis Planner</span>
        </h2>
        <p className="text-text-sub max-w-lg mx-auto text-base md:text-lg font-medium leading-relaxed">
          Criado para ajudar concurseiros como você a estudarem de forma mais inteligente, organizada e estratégica.
        </p>
      </section>

      {/* Community */}
      <section className="bg-slate-50 border border-border rounded-3xl p-8 md:p-12 text-center space-y-6">
        <Users className="w-12 h-12 text-accent mx-auto" />
        <h3 className="text-2xl font-bold text-text-main">Uma grande comunidade de concurseiros</h3>
        <p className="text-text-sub max-w-2xl mx-auto">
          Aqui você não está sozinho. Faça parte de uma comunidade que cresce junto. 
          Compartilhe seus mapas mentais, flashcards e resumos. Ajude e seja ajudado.
        </p>
        <Link to="/comunidade" className="inline-flex items-center gap-2 bg-accent text-white px-8 py-4 rounded-xl font-bold hover:brightness-110 shadow-lg">
          Explorar a Comunidade agora <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <div key={i} className="p-6 bg-white border border-border rounded-2xl shadow-sm hover:border-primary/30 transition-all">
            <f.icon className="w-8 h-8 text-primary mb-4" />
            <h4 className="font-bold text-text-main mb-2 tracking-tight">{f.title}</h4>
            <p className="text-text-sub text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Import Section */}
      <section className="bg-primary/5 border border-primary/10 rounded-3xl p-8 md:p-10 text-center space-y-6">
        <h3 className="text-2xl font-bold text-text-main">Comece agora mesmo</h3>
        <p className="text-text-sub max-w-xl mx-auto leading-relaxed">
          Faça upload do PDF do seu edital e nossa IA transforma automaticamente em cronograma, resumos, flashcards e mapa mental.
        </p>
        <Link to="/configuracoes" className="inline-block bg-primary text-white px-6 py-3 rounded-lg text-base font-bold hover:brightness-110 shadow-lg">
          Importar Edital agora
        </Link>
      </section>
    </motion.div>
  );
}
