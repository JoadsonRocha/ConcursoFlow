import React from 'react';
import { FileText, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfUse() {
  return (
    <div className="min-h-full bg-bg selection:bg-primary/20">
      <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in duration-700">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-text-sub hover:text-primary transition-colors mb-12">
        <ChevronLeft className="w-4 h-4" />
        Voltar ao início
      </Link>

      <header className="mb-16">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-text-main tracking-tight">
            Termos de Uso
          </h1>
        </div>
        <p className="text-text-sub text-sm font-medium">Última atualização: 13 de maio de 2026</p>
      </header>

      <div className="prose prose-slate max-w-none space-y-12 text-text-main">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">1. Sobre o Stratis Planner</h2>
          <p className="leading-relaxed">
            O Stratis Planner é uma plataforma de planejamento inteligente para concursos públicos e exames. Utilizamos inteligência artificial para ajudar você a criar planos de estudo personalizados, resumos, explicações, flashcards e outros recursos educacionais.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">2. Aceitação dos Termos</h2>
          <p className="leading-relaxed">
            O uso da plataforma implica aceitação integral destes Termos. Caso não concorde com qualquer disposição aqui presente, interrompa o uso do serviço imediatamente.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">3. Cadastro e Conta</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>É necessário criar uma conta com dados verdadeiros e atualizados.</li>
            <li>Você é responsável por manter a confidencialidade da sua senha e por todas as atividades realizadas em sua conta.</li>
            <li>Não é permitido compartilhar login com terceiros.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">4. Licença de Uso</h2>
          <p className="leading-relaxed">
            Concedemos a você uma licença pessoal, limitada, não exclusiva e revogável para uso da plataforma exclusivamente para fins de estudo pessoal.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">5. Conteúdo Gerado por IA</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>O conteúdo gerado pela IA serve apenas como ferramenta de apoio ao estudo.</li>
            <li>Não garantimos precisão absoluta das informações. Você deve sempre validar com fontes oficiais (editais, leis, gabaritos etc.).</li>
            <li>A aprovação em concursos depende exclusivamente do seu esforço e dedicação.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">6. Regras de Conduta</h2>
          <p className="font-medium mb-2">É proibido:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Copiar, reproduzir ou distribuir o conteúdo da plataforma para fins comerciais;</li>
            <li>Usar a plataforma para treinar outros modelos de IA;</li>
            <li>Realizar scraping ou extração automatizada de dados;</li>
            <li>Compartilhar conta ou praticar atos ilícitos.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">7. Pagamentos e Cancelamento</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Os preços estão disponíveis na página de planos.</li>
            <li>Você pode cancelar sua assinatura a qualquer momento.</li>
            <li>Reembolso segue o Código de Defesa do Consumidor (direito de arrependimento em até 7 dias para contratações online).</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">8. Limitação de Responsabilidade</h2>
          <p className="leading-relaxed">
            A plataforma é oferecida "no estado em que se encontra". Não nos responsabilizamos por danos indiretos, interrupções sistêmicas ou resultados individuais em exames.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">9. Propriedade Intelectual</h2>
          <p className="leading-relaxed">
            Todo o conteúdo, tecnologia e marca Stratis Planner são de nossa propriedade exclusiva e protegidos por leis de direitos autorais.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">10. Alterações</h2>
          <p className="leading-relaxed">
            Podemos atualizar estes Termos periodicamente. Avisaremos sobre mudanças relevantes. O uso continuado significa aceitação das novas versões.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">11. Lei Aplicável</h2>
          <p className="leading-relaxed">
            Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca de Boa Vista/RR para dirimir quaisquer questões.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">12. Contato</h2>
          <p className="leading-relaxed">
            Se você tiver qualquer dúvida sobre estes Termos de Uso, sinta-se à vontade para nos contatar através do e-mail: <span className="text-primary font-medium">info@stratisplanner.com.br</span>
          </p>
        </section>
      </div>

      <footer className="mt-20 pt-8 border-t border-border text-center">
        <p className="text-xs text-text-sub font-medium uppercase tracking-widest">
          © {new Date().getFullYear()} Stratis Planner. Todos os direitos reservados.
        </p>
      </footer>
    </div>
    </div>
  );
}
