import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Brain, 
  Zap, 
  Users, 
  ArrowRight, 
  LayoutDashboard, 
  Clock, 
  ListChecks, 
  BarChart,
  ChevronRight,
  Headphones,
  Sparkles,
  LineChart,
  Target,
  Download,
  FileText,
  Search,
  Heart,
  Award,
  CheckCircle2
} from 'lucide-react';

export default function EmptyState({ featuredContests }: { featuredContests: any[] }) {
  const features = [
    { icon: LayoutDashboard, title: "Cronogramas Personalizados", desc: "Estrutura otimizada para seu concurso.", to: "/cronograma" },
    { icon: Brain, title: "Flashcards Inteligentes", desc: "Revisão ativa e memorização eficaz.", to: "/microaprendizado" },
    { icon: Zap, title: "Mapas Mentais", desc: "Visualização clara dos tópicos.", to: "/microaprendizado" },
    { icon: BookOpen, title: "Resumos", desc: "Conteúdo direto ao ponto.", to: "/materias" },
    { icon: Clock, title: "Sessão de Estudos", desc: "Gerencie seu tempo de forma eficiente.", to: "/foco" },
    { icon: ListChecks, title: "Edital Verticalizado", desc: "Acompanhe todo o conteúdo programático.", to: "/materias" },
    { icon: BarChart, title: "Pareto", desc: "Foco nos tópicos de maior relevância.", to: "/pareto" },
    { icon: Users, title: "Comunidades", desc: "Baixe e compartilhe materiais de estudo.", to: "/comunidade" },
    { icon: Headphones, title: "Audiocasts de Revisão", desc: "Revisões em áudio geradas por inteligência artificial.", to: "/audiocasts" },
    { icon: Sparkles, title: "Mentor Stratis (IA)", desc: "Dicas de planejamento e mentoria tática.", to: "/tutor" },
    { icon: LineChart, title: "Estatísticas de Desempenho", desc: "Monitore seu progresso e taxas de acerto.", to: "/estatisticas" },
    { icon: Target, title: "Fluxo Ativo MEPP", desc: "Método de estudos acelerado passo a passo.", to: "/mepp" }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-8 pt-2"
    >
      {/* Primeiros Passos Onboarding Area */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-text-sub">Guia de Primeiros Passos</span>
          <span className="text-xs text-primary font-bold">● Ativação de Edital</span>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* PATH 1: COMMUNITY EDITAIS (Highlighted / Specialist recommended) */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-gradient-to-br from-white to-slate-50 border-2 border-primary/40 rounded-2xl p-4 md:p-5 shadow-sm relative overflow-hidden group">
            {/* Spotlight Accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full filter blur-2xl group-hover:bg-primary/10 transition-all duration-500 pointer-events-none"></div>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="inline-block bg-primary text-white text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md">
                    Recomendado &amp; Instantâneo
                  </span>
                  <h3 className="text-base md:text-lg font-bold text-text-main flex items-center gap-2 pt-0.5">
                    <Users className="w-5 h-5 text-primary" /> 
                    Opção A: Escolher da Comunidade
                  </h3>
                </div>
                <div className="bg-primary/10 p-2 rounded-xl">
                  <Download className="w-4 h-4 text-primary animate-bounce" />
                </div>
              </div>

              <p className="text-text-sub text-[11px] md:text-xs leading-normal">
                Baixe um edital estruturado de forma estratégica por candidatos ou mentores especialistas da nossa comunidade. É o jeito mais rápido e eficiente!
              </p>

              {/* Steps checklist */}
              <div className="space-y-2 bg-white/60 backdrop-blur-sm border border-border/50 rounded-xl p-3">
                <div className="flex gap-2 items-start">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">1</span>
                  <p className="text-[11px] font-semibold text-text-main">
                    Navegue pela aba de <span className="text-primary font-bold">Editais da Comunidade</span>.
                  </p>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">2</span>
                  <p className="text-[11px] font-semibold text-text-main">
                    Visualize as matérias e o peso atribuído a cada uma delas.
                  </p>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">3</span>
                  <p className="text-[11px] font-semibold text-text-main">
                    Clique em <span className="text-primary font-bold">Adicionar</span> para clonar o edital e gerar seu cronograma!
                  </p>
                </div>
              </div>

              {/* Sample of featured contests in community */}
              {featuredContests && featuredContests.length > 0 && (
                <div className="space-y-1.5 pt-0.5">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-text-sub block">
                    Editais populares criados por Especialistas:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    {featuredContests.slice(0, 3).map((contest, idx) => (
                      <div key={idx} className="bg-white border border-border p-2 rounded-lg flex flex-col justify-between hover:border-primary/20 transition-all text-left">
                        <div className="space-y-0.5">
                          <span className="text-[7px] font-bold text-primary block truncate uppercase">{contest.name}</span>
                          <span className="text-[9px] font-black text-text-main block truncate leading-tight">{contest.role}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-50">
                          <span className="text-[8px] font-semibold text-text-sub">{contest.subjects?.length || 0} Matérias</span>
                          <span className="flex items-center gap-0.5 text-[8px] text-red-500 font-bold">
                            <Heart className="w-1.5 h-1.5 fill-red-500" /> {contest.likesCount || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <Link 
                to="/comunidade" 
                className="w-full inline-flex items-center justify-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-xl text-[11px] font-bold tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-sm shadow-primary/15 uppercase"
              >
                <Users className="w-3.5 h-3.5" /> Explorar Editais da Comunidade <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* PATH 2: AI PDF IMPORT */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-border rounded-2xl p-4 md:p-5 shadow-sm hover:border-border/80 transition-all relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="inline-block bg-accent/10 text-accent text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border border-accent/10">
                    Tecnologia Inteligente
                  </span>
                  <h3 className="text-base md:text-lg font-bold text-text-main flex items-center gap-2 pt-0.5">
                    <Sparkles className="w-5 h-5 text-accent" />
                    Opção B: Enviar PDF do Edital
                  </h3>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-border">
                  <FileText className="w-4 h-4 text-text-sub" />
                </div>
              </div>

              <p className="text-text-sub text-[11px] md:text-xs leading-normal">
                Faça o upload do PDF oficial do seu edital de concurso. Nossa Inteligência Artificial mapeia todo o conteúdo programático de forma precisa.
              </p>

              {/* Steps list */}
              <div className="space-y-2 pt-1">
                <div className="flex gap-2 items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                  <p className="text-[11px] text-text-main font-medium">Extração de matérias e tópicos</p>
                </div>
                <div className="flex gap-2 items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                  <p className="text-[11px] text-text-main font-medium">Mapeamento de peso por relevância de Pareto</p>
                </div>
                <div className="flex gap-2 items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                  <p className="text-[11px] text-text-main font-medium">Geração automática de flashcards e mapas</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-dashed border-border rounded-xl p-2.5 text-center">
                <p className="text-[9px] text-text-sub leading-normal font-medium">
                  Ideal para editais regionais ou atualizações recém-publicadas.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Link 
                to="/configuracoes" 
                className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-100 text-text-main hover:bg-slate-200 px-4 py-2.5 rounded-xl text-[11px] font-bold tracking-wider active:scale-95 transition-all border border-border uppercase"
              >
                <FileText className="w-3.5 h-3.5 text-text-sub" /> Importar meu próprio PDF
              </Link>
            </div>
          </div>

        </section>
      </div>

      {/* Unlocked Features Grid */}
      <div className="space-y-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between px-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-text-sub">
            O que você vai desbloquear assim que carregar o edital:
          </span>
          <span className="text-[8px] font-bold text-primary/80 uppercase">Recursos inclusos</span>
        </div>
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {features.map((f, i) => (
            <Link 
              key={i} 
              to={f.to} 
              className="group p-3 bg-white border border-border rounded-xl shadow-sm hover:border-primary/30 hover:shadow-md transition-all flex flex-col justify-between h-auto min-h-[85px] text-left relative overflow-hidden"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <f.icon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-200" />
                  <ChevronRight className="w-3 h-3 text-text-sub opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                </div>
                <div>
                  <h4 className="font-bold text-[11px] text-text-main group-hover:text-primary transition-colors duration-200 tracking-tight">{f.title}</h4>
                  <p className="text-text-sub text-[10px] leading-snug mt-0.5">{f.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </motion.div>
  );
}
