import React from 'react';
import { Lock, ChevronLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20 pt-10 px-6">
      <Link to="/" className="inline-flex items-center gap-3 text-xs font-black text-slate-500 uppercase tracking-wider hover:text-accent transition-all group">
        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-accent transition-all">
          <ChevronLeft className="w-4 h-4" />
        </div>
        Retornar ao Centro de Controle
      </Link>

      <header className="space-y-8 text-center pt-8">
        <div className="w-24 h-24 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent mx-auto shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-accent/10 blur-2xl animate-pulse"></div>
          <Lock className="w-10 h-10 relative z-10" />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl md:text-7xl font-display leading-[0.9] text-white tracking-tighter font-black italic">
            Política de <span className="italic text-accent animate-pulse">Privacidade.</span>
          </h1>
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.5em] italic">Rise Protocol v2.5.0 — Proteção de Dados: Mai/2026</p>
        </div>
      </header>

      <div className="rise-card p-10 md:p-20 space-y-16 bg-gradient-to-br from-slate-950 to-transparent border-white/10 shadow-2xl">
        <section className="space-y-6 relative group">
          <div className="absolute -left-10 top-0 h-full w-1 rounded-full bg-accent/20 group-hover:bg-accent transition-colors"></div>
          <div className="flex items-center gap-4 mb-2">
            <div className="text-xs font-black text-accent uppercase tracking-wider">Protocolo 01</div>
            <Sparkles className="w-4 h-4 text-accent opacity-50" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display text-white italic font-bold">Criptografia de Dados</h2>
          <p className="text-slate-400 leading-relaxed font-medium italic text-lg">
            Coletamos informações que você fornece diretamente ao integrar seu perfil, como nome e credenciais de acesso autenticadas via Google. Seus dados de progresso são utilizados estritamente para a calibração do seu algoritmo de estudos.
          </p>
        </section>

        <section className="space-y-6 relative group">
          <div className="absolute -left-10 top-0 h-full w-1 rounded-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
          <div className="flex items-center gap-4 mb-2">
            <div className="text-xs font-black text-primary uppercase tracking-wider">Protocolo 02</div>
          </div>
          <h2 className="text-2xl md:text-3xl font-display text-white italic font-bold">Processamento de Inteligência</h2>
          <p className="text-slate-400 leading-relaxed font-medium italic text-lg">
            Utilizamos suas métricas operacionais para manter e evoluir nossos modelos de IA, garantindo que as sugestões de cronogramas e flashcards sejam calibradas de acordo com sua curva de esquecimento real.
          </p>
        </section>

        <section className="space-y-6 relative group">
          <div className="absolute -left-10 top-0 h-full w-1 rounded-full bg-white/10 group-hover:bg-white/30 transition-colors"></div>
          <div className="flex items-center gap-4 mb-2">
            <div className="text-xs font-black text-slate-700 uppercase tracking-wider">Protocolo 03</div>
          </div>
          <h2 className="text-2xl md:text-3xl font-display text-white italic font-bold">Isolamento de Informações</h2>
          <p className="text-slate-400 leading-relaxed font-medium italic text-lg">
            Não comercializamos conjuntos de dados para terceiros. A RiseMindr opera em um ecossistema fechado onde a privacidade do estrategista é tratada como ativo de segurança máxima.
          </p>
        </section>

        <section className="space-y-6 relative group">
          <div className="absolute -left-10 top-0 h-full w-1 rounded-full bg-accent/20 group-hover:bg-accent transition-colors"></div>
          <div className="flex items-center gap-4 mb-2">
            <div className="text-xs font-black text-accent uppercase tracking-wider">Protocolo 04</div>
          </div>
          <h2 className="text-2xl md:text-3xl font-display text-white italic font-bold">Direito ao Esquecimento</h2>
          <p className="text-slate-400 leading-relaxed font-medium italic text-lg">
            Você possui total autonomia para exportar ou deletar permanentemente seus dados do nosso cluster via painel de configurações. Uma vez deletados, os dados são irrecuperáveis por design de segurança.
          </p>
        </section>
      </div>

      <footer className="text-center py-20 flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
          <span className="text-xs font-black text-slate-700 uppercase tracking-[0.5em] italic">RiseMindr Security — 2026 Edition</span>
        </div>
        <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Sistemas operando sob protocolos de criptografia de ponta a ponta.</p>
      </footer>
    </div>
  );
}
