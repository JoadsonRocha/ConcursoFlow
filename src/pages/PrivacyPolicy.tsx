import React from 'react';
import { Lock, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black text-text-sub uppercase tracking-widest hover:text-primary transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Voltar ao Dashboard
      </Link>

      <header className="space-y-4 text-center">
        <div className="w-16 h-16 bg-accent/10 rounded-3xl flex items-center justify-center text-accent mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-6xl font-display leading-[0.9] text-text-main tracking-tighter">
          Política de <span className="italic text-accent">Privacidade</span>.
        </h1>
        <p className="text-text-sub text-sm font-medium">Última atualização: 10 de maio de 2026</p>
      </header>

      <div className="bg-white dark:bg-slate-900 border border-border rounded-[3rem] p-10 md:p-16 space-y-10 shadow-xl shadow-accent/[0.02]">
        <section className="space-y-4">
          <h2 className="text-2xl font-display text-text-main">1. Coleta de Dados</h2>
          <p className="text-text-sub leading-relaxed">
            Coletamos informações que você fornece diretamente ao criar uma conta, como seu nome e endereço de e-mail. Também coletamos dados sobre seu progresso nos estudos para personalizar sua experiência.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-display text-text-main">2. Uso das Informações</h2>
          <p className="text-text-sub leading-relaxed">
            Utilizamos suas informações para fornecer, manter e melhorar nossos serviços, além de processar o desenvolvimento de novas ferramentas de IA baseadas no seu feedback de estudo.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-display text-text-main">3. Compartilhamento de Dados</h2>
          <p className="text-text-sub leading-relaxed">
            Não vendemos nem alugamos suas informações pessoais a terceiros. Podemos compartilhar dados anonimizados para fins estatísticos e de pesquisa sobre performance em concursos.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-display text-text-main">4. Segurança</h2>
          <p className="text-text-sub leading-relaxed">
            Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado ou perda acidental.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-display text-text-main">5. Seus Direitos</h2>
          <p className="text-text-sub leading-relaxed">
            Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento através das configurações da sua conta ou entrando em contato conosco.
          </p>
        </section>
      </div>

      <footer className="text-center text-[10px] font-black text-text-sub uppercase tracking-widest pt-10">
        Stratis © 2026 — Segurança e Transparência.
      </footer>
    </div>
  );
}
