import React from 'react';
import { Shield, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in duration-700">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-text-sub hover:text-primary transition-colors mb-12">
        <ChevronLeft className="w-4 h-4" />
        Voltar ao início
      </Link>

      <header className="mb-16">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-text-main tracking-tight">
            Política de Privacidade
          </h1>
        </div>
        <p className="text-text-sub text-sm font-medium">Última atualização: 13 de maio de 2026</p>
      </header>

      <div className="prose prose-slate max-w-none space-y-12 text-text-main">
        <p className="text-lg leading-relaxed text-text-sub">
          No Stratis Planner, levamos sua privacidade a sério. Esta Política foi elaborada para ser clara, transparente e totalmente em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018).
        </p>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">1. Quem somos</h2>
          <p className="leading-relaxed">
            Stratis Planner é uma plataforma de planejamento inteligente para concursos públicos, desenvolvida para ajudar concurseiros a estudarem de forma mais organizada e eficiente.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">2. Dados que coletamos</h2>
          <div className="space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-primary">Dados que você nos fornece:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Nome completo, e-mail e senha;</li>
              <li>CPF (opcional, para fins fiscais);</li>
              <li>Informações sobre seus objetivos (concursos almejados, tempo disponível, matérias prioritárias, etc.).</li>
            </ul>

            <h3 className="font-bold text-sm uppercase tracking-wider text-secondary">Dados gerados durante o uso:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Planos de estudo criados e progresso de desempenho;</li>
              <li>Questões respondidas, flashcards e prompts enviados à inteligência artificial.</li>
            </ul>

            <h3 className="font-bold text-sm uppercase tracking-wider text-text-sub">Dados coletados automaticamente:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Endereço IP, tipo de navegador e dispositivo;</li>
              <li>Páginas visitadas e tempo de uso;</li>
              <li>Cookies (veja nossa Política de Cookies).</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">3. Para que usamos seus dados?</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Criar e personalizar seu planejamento de estudos;</li>
            <li>Gerar conteúdo inteligente (resumos, explicações, simulados etc.);</li>
            <li>Melhorar nossa inteligência artificial (com dados anonimizados);</li>
            <li>Enviar notificações importantes sobre sua conta e atualizações;</li>
            <li>Prevenir fraudes e garantir a segurança da plataforma.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">4. Bases Legais (LGPD)</h2>
          <p className="leading-relaxed">
            Tratamos seus dados com base na execução de contrato (fornecimento do serviço), consentimento (quando você aceita), legítimo interesse (melhoria do serviço) e obrigações legais.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">5. Compartilhamento de Dados</h2>
          <p className="leading-relaxed">
            Não vendemos seus dados pessoais. Compartilhamos apenas com prestadores de serviços essenciais (hospedagem, processadores de pagamento, ferramentas de IA), sempre com contratos rigorosos de proteção de dados e confidencialidade.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">6. Seus Direitos (LGPD)</h2>
          <p className="leading-relaxed mb-4">Você tem total controle sobre seus dados e pode exercer os seguintes direitos a qualquer momento:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Acessar, corrigir ou atualizar seus dados;</li>
            <li>Solicitar a exclusão permanente de sua conta e informações;</li>
            <li>Revogar seu consentimento para o tratamento de dados;</li>
            <li>Solicitar a portabilidade dos dados para outro fornecedor.</li>
          </ul>
          <p className="mt-4 font-medium italic">
            Para exercer seus direitos, envie um e-mail para: <span className="text-primary">contato@stratisplanner.com.br</span>
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">7. Segurança</h2>
          <p className="leading-relaxed">
            Adotamos medidas técnicas e administrativas avançadas para proteger seus dados contra acessos não autorizados e situações acidentais de destruição ou alteração.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">8. Alterações</h2>
          <p className="leading-relaxed">
            Podemos atualizar esta Política periodicamente. A versão mais atual sempre estará disponível aqui. Recomendamos a consulta regular.
          </p>
        </section>
      </div>

      <footer className="mt-20 pt-8 border-t border-border text-center">
        <p className="text-xs text-text-sub font-medium uppercase tracking-widest">
          Proteção de Dados Garantida — Stratis Planner {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
