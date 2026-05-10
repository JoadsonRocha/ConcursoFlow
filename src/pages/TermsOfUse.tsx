import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-bg p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Início
        </Link>
        
        <div className="bg-white dark:bg-card-bg border border-border rounded-[40px] p-8 md:p-12 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-text-main tracking-tight">Termos de Uso</h1>
              <p className="text-text-sub text-sm font-medium uppercase tracking-widest">Última atualização: 10 de Maio de 2026</p>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-text-main">
            <section className="space-y-4">
              <h2 className="text-xl font-bold">1. Aceitação dos Termos</h2>
              <p>Ao acessar e clicar em "Começar Agora" ou utilizar qualquer parte do Concurso Flow, você concorda em cumprir estes Termos de Uso. Se você não concordar com estes termos, não deverá utilizar a nossa plataforma.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold">2. Descrição do Serviço</h2>
              <p>O Concurso Flow é uma ferramenta auxiliada por Inteligência Artificial para organização de estudos, verticalização de editais e acompanhamento de desempenho para concursos públicos.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold">3. Responsabilidades do Usuário</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Você é responsável por manter a confidencialidade de sua conta.</li>
                <li>Você concorda em não utilizar a plataforma para fins ilegais ou não autorizados.</li>
                <li>O conteúdo gerado pela IA é para fins de auxílio ao estudo, não garantindo aprovação ou exatidão total em relação aos editais oficiais.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold">4. Propriedade Intelectual</h2>
              <p>Todo o código, design e funcionalidades do Concurso Flow são de nossa propriedade exclusiva ou licenciados para nós.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold">5. Modificações nos Termos</h2>
              <p>Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos os usuários sobre mudanças significativas via e-mail ou aviso na plataforma.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
