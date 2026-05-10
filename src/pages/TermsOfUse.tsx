import React from 'react';
import { ShieldCheck, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfUse() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black text-text-sub uppercase tracking-widest hover:text-primary transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Voltar ao Dashboard
      </Link>

      <header className="space-y-4 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-6xl font-display leading-[0.9] text-text-main tracking-tighter">
          Termos de <span className="italic text-primary">Uso</span>.
        </h1>
        <p className="text-text-sub text-sm font-medium">Última atualização: 10 de maio de 2026</p>
      </header>

      <div className="bg-white dark:bg-slate-900 border border-border rounded-[3rem] p-10 md:p-16 space-y-10 shadow-xl shadow-primary/[0.02]">
        <section className="space-y-4">
          <h2 className="text-2xl font-display text-text-main">1. Aceitação dos Termos</h2>
          <p className="text-text-sub leading-relaxed">
            Ao acessar e usar o Stratis, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, você não deve usar nossos serviços.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-display text-text-main">2. Descrição do Serviço</h2>
          <p className="text-text-sub leading-relaxed">
            O Stratis é uma plataforma de organização de estudos que utiliza Inteligência Artificial para verticalizar editais e otimizar a preparação para concursos. Nossos serviços são fornecidos "como estão".
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-display text-text-main">3. Responsabilidades do Usuário</h2>
          <p className="text-text-sub leading-relaxed">
            Você é responsável por manter a confidencialidade de sua conta e senha. Você concorda em nos notificar imediatamente sobre qualquer uso não autorizado de sua conta.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-display text-text-main">4. Propriedade Intelectual</h2>
          <p className="text-text-sub leading-relaxed">
            Todo o conteúdo presente no Stratis, incluindo textos, gráficos, logotipos e software, é de propriedade exclusiva ou licenciado para nós e está protegido por leis de direitos autorais.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-display text-text-main">5. Limitação de Responsabilidade</h2>
          <p className="text-text-sub leading-relaxed">
            Em nenhuma circunstância o Stratis será responsável por quaisquer danos diretos, indiretos, incidentais ou consequentes resultantes do uso ou da incapacidade de usar nossos serviços.
          </p>
        </section>
      </div>

      <footer className="text-center text-[10px] font-black text-text-sub uppercase tracking-widest pt-10">
        Stratis © 2026 — Todos os direitos reservados.
      </footer>
    </div>
  );
}
