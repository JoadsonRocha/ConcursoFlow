import React from 'react';
import { ShieldCheck, ChevronLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfUse() {
  return (
    <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20 pt-10 px-6">
      <Link to="/" className="inline-flex items-center gap-3 text-xs font-black text-slate-500 uppercase tracking-wider hover:text-primary transition-all group">
        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary transition-all">
          <ChevronLeft className="w-4 h-4" />
        </div>
        Retornar ao Centro de Controle
      </Link>

      <header className="space-y-8 text-center pt-8">
        <div className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary mx-auto shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/10 blur-2xl animate-pulse"></div>
          <ShieldCheck className="w-10 h-10 relative z-10" />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl md:text-7xl font-display leading-[0.9] text-text-main tracking-tighter font-black italic">
            Termos de <span className="italic text-primary animate-pulse">Uso.</span>
          </h1>
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.5em] italic">Rise Protocol v2.5.0 — Última Modificação: Mai/2026</p>
        </div>
      </header>

      <div className="rise-card p-10 md:p-20 space-y-16">
        <section className="space-y-6 relative group">
          <div className="absolute -left-10 top-0 h-full w-1 rounded-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
          <div className="flex items-center gap-4 mb-2">
            <div className="text-xs font-black text-primary uppercase tracking-wider">Seção 01</div>
            <Sparkles className="w-4 h-4 text-primary opacity-50" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display text-text-main italic font-bold">Aceitação dos Protocolos</h2>
          <p className="text-text-sub leading-relaxed font-medium italic text-lg">
            Ao acessar e utilizar a infraestrutura Stratis Planner, você concorda em cumprir e estar vinculado a estes Protocolos de Uso. Se você não concordar com qualquer fragmento destes termos, a conexão deve ser interrompida imediatamente.
          </p>
        </section>

        <section className="space-y-6 relative group">
          <div className="absolute -left-10 top-0 h-full w-1 rounded-full bg-accent/20 group-hover:bg-accent transition-colors"></div>
          <div className="flex items-center gap-4 mb-2">
            <div className="text-xs font-black text-accent uppercase tracking-wider">Seção 02</div>
            <Sparkles className="w-4 h-4 text-accent opacity-50" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display text-text-main italic font-bold">Arquitetura de Serviço</h2>
          <p className="text-text-sub leading-relaxed font-medium italic text-lg">
            Stratis Planner é um ecossistema tático que mobiliza Inteligência Artificial para verticalizar editais e otimizar a progressão de disciplinas. Nossos serviços são fornecidos "como estão", sob licença de uso individual.
          </p>
        </section>

        <section className="space-y-6 relative group">
          <div className="absolute -left-10 top-0 h-full w-1 rounded-full bg-white/10 group-hover:bg-white/30 transition-colors"></div>
          <div className="flex items-center gap-4 mb-2">
            <div className="text-xs font-black text-slate-700 uppercase tracking-wider">Seção 03</div>
          </div>
          <h2 className="text-2xl md:text-3xl font-display text-text-main italic font-bold">Integridade da Conta</h2>
          <p className="text-text-sub leading-relaxed font-medium italic text-lg">
            A segurança da credencial é de responsabilidade única do usuário. Qualquer anomalia ou acesso não autorizado deve ser transmitido imediatamente à nossa célula de suporte central.
          </p>
        </section>

        <section className="space-y-6 relative group">
          <div className="absolute -left-10 top-0 h-full w-1 rounded-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
          <div className="flex items-center gap-4 mb-2">
            <div className="text-xs font-black text-primary uppercase tracking-wider">Seção 04</div>
          </div>
          <h2 className="text-2xl md:text-3xl font-display text-text-main italic font-bold">Propriedade Intelectual</h2>
          <p className="text-text-sub leading-relaxed font-medium italic text-lg">
            Todo o código, arquitetura, design e algoritmos de verticalização são propriedades exclusivas da Stratis Planner e protegidos por leis internacionais de propriedade intelectual.
          </p>
        </section>
      </div>

      <footer className="text-center py-20 flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
          <span className="text-xs font-black text-slate-700 uppercase tracking-[0.5em] italic">Stratis Planner — 2026 Edition</span>
        </div>
        <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Todos os direitos reservados à célula de desenvolvimento.</p>
      </footer>
    </div>
  );
}
