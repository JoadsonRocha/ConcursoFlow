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
        <p className="text-text-sub text-sm font-medium">Última atualização: {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </header>

      <div className="prose prose-slate max-w-none space-y-12 text-text-main">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">1. Introdução</h2>
          <p className="leading-relaxed">
            O Stratis (ou Stratis Planner) é uma plataforma online para planejamento, gerenciamento e compartilhamento de atividades de estudo, que também oferece conteúdos digitais em formato eletrônico (“e-books”, “notebooks stratis”, flashcards, etc.) para complementar a experiência de aprendizagem dos usuários.
          </p>
          <p className="leading-relaxed">
            Ele é oferecido para você pelo Stratis Soluções Educacionais e Tecnológicas e seus parceiros.
          </p>
          <p className="leading-relaxed">
            Os Termos de Uso e a Política de Privacidade se aplicam ao uso dos serviços e dos conteúdos oferecidos pela plataforma Stratis e estão sujeitos a constantes melhorias e aprimoramentos, de modo que recomendamos sua periódica consulta.
          </p>
          <p className="leading-relaxed">
            Ao acessar e usar os serviços e conteúdos, você, como usuário, confirma que concorda com estes Termos de Uso e a Política de Privacidade. Caso não concorde, você não está autorizado a utilizar os serviços nem a acessar as funcionalidades.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">2. Cadastro e Identificação do Usuário</h2>
          <p className="leading-relaxed">
            Para a adesão à plataforma, o usuário deverá se identificar por meio do preenchimento completo dos dados cadastrais exigidos ou usar provedores de login (Google, etc). O usuário é responsável pelas informações fornecidas no momento de seu cadastro.
          </p>
          <p className="leading-relaxed">
            Após concluir o cadastro, o usuário terá acesso à plataforma por meio de seu e-mail (login) e senha, ou provedor social, de uso exclusivo do usuário, seja durante versão gratuita, Período de Teste Gratuito, seja após a contratação de uma assinatura paga PRO.
          </p>
          <p className="leading-relaxed">
            É vedado ao usuário ceder a terceiros o uso de seu acesso de forma gratuita ou onerosa sob pena de suspensão preventiva do acesso à plataforma, até que sejam feitos os devidos esclarecimentos; e, não sendo apresentado, cancelar definitivamente a conta, sem a devolução de quaisquer valores.
          </p>
          <p className="leading-relaxed">
            É responsabilidade do usuário o sigilo do seu acesso, para evitar o acesso não autorizado de terceiros à plataforma, sendo ele o único responsável por eventual uso inadequado.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">3. Regras de Uso da Plataforma</h2>
          <p className="leading-relaxed">
            Além de respeitar as condições de cadastro e acesso, o usuário se compromete a utilizar a plataforma Stratis de forma ética e segura, abstendo-se de qualquer conduta que possa comprometer sua integridade, funcionamento ou segurança. É expressamente proibido:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>utilizar bots, automações, scripts, ferramentas de raspagem de dados (“scraping”) ou qualquer meio destinado a coletar, manipular ou interferir no funcionamento da plataforma;</li>
            <li>realizar engenharia reversa, tentar acessar áreas restritas, explorar eventuais falhas, vulnerabilidades ou mecanismos internos da plataforma;</li>
            <li>copiar, extrair, reproduzir, publicar ou criar materiais, produtos, serviços ou conteúdos derivados a partir da plataforma ou de sua metodologia;</li>
            <li>adotar qualquer ação que prejudique a performance, estabilidade ou segurança da plataforma, de seus servidores ou de outros usuários.</li>
          </ul>
          <p className="leading-relaxed">
            O descumprimento dessas regras poderá resultar em suspensão preventiva e, conforme a gravidade da conduta, no cancelamento definitivo do acesso, sem direito a reembolso, sem prejuízo das demais medidas cabíveis.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">4. Período de Teste Gratuito</h2>
          <p className="leading-relaxed">
            O Stratis poderá, a seu exclusivo critério, disponibilizar ao usuário um período de teste gratuito da plataforma pelo prazo de 7 (sete) dias corridos, contados a partir da data de solicitação do plano ("Período de Teste").
          </p>
          <p className="leading-relaxed">
            Durante o Período de Teste, o usuário terá acesso às funcionalidades PRO da plataforma sem qualquer cobrança. Nenhum valor será debitado até o término do Período de Teste. Ao final desse prazo, a cobrança da assinatura escolhida será efetivada automaticamente, a menos que o usuário cancele antes.
          </p>
          <p className="leading-relaxed">
            O Período de Teste é oferecido apenas uma vez por usuário cadastrado. Contas criadas com dados distintos pelo mesmo usuário com o intuito de usufruir de múltiplos períodos de teste poderão ser canceladas a qualquer momento, sem aviso prévio.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">5. Assinaturas</h2>
          <p className="leading-relaxed">
            As assinaturas dão acesso a diversas funcionalidades exclusivas da plataforma.
          </p>
          <p className="leading-relaxed">
            O período de vigência das assinaturas tem início a partir da data de aprovação do pagamento. São aceitos pagamentos via gateway seguro de parceiros (como o Stripe), suportando cartão de crédito e PIX.
          </p>
          <p className="leading-relaxed">
            Uma vez efetuada a assinatura em cartão, ela será automaticamente renovada no final de cada período contratado (Mensal ou Anual).
          </p>
          <p className="leading-relaxed">
            O Stratis poderá eventualmente alterar o preço de suas assinaturas, sendo certo que irá notificar os usuários de forma antecipada. As alterações nos valores vão surtir efeito no próximo período de renovação. O usuário concorda com o novo preço ao continuar a utilizar a plataforma; caso não concorde, tem o direito de cancelar a assinatura.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">6. Cancelamento</h2>
          <p className="leading-relaxed">
            Para o usuário cancelar sua assinatura, basta acessar as configurações de Perfil na seção de Planos e gerenciar sua assinatura.
          </p>
          <p className="font-bold">Cancelamento no primeiro período de utilização:</p>
          <p className="leading-relaxed">
            O Período de Teste Gratuito ou a primeira cobrança estão resguardados pelo direito de arrependimento (art. 49 do Código de Defesa do Consumidor). Caso o usuário solicite o cancelamento e reembolso dentro do prazo de 7 (sete) dias contados da primeira compra, o valor pago será devolvido integralmente. O acesso às funcionalidades PRO é removido imediatamente.
          </p>
          <p className="font-bold">Cancelamento das Renovações:</p>
          <p className="leading-relaxed">
            No caso de pedido de cancelamento após os 7 dias ou a partir da primeira renovação em diante, o valor já pago pela vigência atual não é passível de devolução. Neste caso, o usuário continua com acesso regular PRO ao site até o término do período já pago. Findo este período, não haverá nova cobrança e a conta voltará ao modo gratuito.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">7. Limitações de Responsabilidade</h2>
          <p className="leading-relaxed">
            A distribuição de disciplinas e tópicos informadas ou geradas por IA no Stratis pode não coincidir perfeitamente com os editais publicados pelas bancas (ex: Diário Oficial). A classificação no Stratis busca organizar didaticamente temas e tópicos. Recomendamos que o estudo englobe a consulta ao edital oficial.
          </p>
          <p className="leading-relaxed">
             O Stratis não garante e não tem como obrigação cadastrar automaticamente todo e qualquer edital de concurso lançado. Contudo, nossa tecnologia permite personalização e importação manual por parte do aluno.
          </p>
          <p className="leading-relaxed">
            Os métodos de Inteligência Artificial, Mentor, Flashcards e Cronograma de Revisões são apenas <strong>ferramentas tecnológicas de apoio e sugestões metodológicas</strong>, o uso da plataforma e de nossa IA não configura qualquer garantia de aprovação no concurso.
          </p>
          <p className="leading-relaxed">
            Nossos servidores podem passar por instabilidades ou as APIs de Inteligência Artificial (ex: OpenAI, Google) de parceiros enfrentarem falhas de conexão eventuais. A equipe fará de tudo para o pronto reestabelecimento, o usuário declara estar ciente de fatores alheios ao nosso controle.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">8. E-books e Conteúdos Digitais (Notebooks)</h2>
          <p className="leading-relaxed">
            O Stratis permite gerar ou disponibiliza conteúdos editoriais em formato eletrônico (PDFs de Flashcards, Mapas Mentais, Cadernos Inteligentes). O download ou acesso destina-se unicamente ao uso pessoal exclusivo do usuário. É expressamente vedado o compartilhamento, envio, revenda em grupos, redes sociais ou sites terceiros.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">9. Confidencialidade e Privacidade</h2>
          <p className="leading-relaxed">
            O tratamento de dados pessoais (Lei nº 13.709/2018 - LGPD) pela plataforma ocorre na medida correta para o funcionamento da Inteligência Artificial e personalização do ensino. Dados financeiros sensíveis, como números completos de cartões de créditos, não são armazenados em nossos servidores, usando infraestrutura de pagamentos terceirizada e altamente segura (ex: Stripe).
          </p>
          <p className="leading-relaxed">
            Nos termos do art. 18 do Código Civil, o usuário autoriza o Stratis a poder celebrar seu nome ou inicias na comunicação da plataforma caso venha a obter aprovação em exame. O usuário tem poder absoluto de revogar esse compartilhamento através do nosso suporte.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">10. Propriedade Intelectual</h2>
          <p className="leading-relaxed">
            Todo o conteúdo, metodologia, organização didática, algoritmos internos de IA, design, código fonte, textos e vídeos da plataforma são de titularidade do Stratis.
          </p>
          <p className="leading-relaxed">
            O acesso do usuário confere uma licença limitada e intransferível. É expressamente proibida a reprodução, engenharia reversa e a comercialização.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">11. Foro e Disposições Finais</h2>
          <p className="leading-relaxed">
            Este termo rege-se pelas leis brasileiras. Fica eleito o foro da Comarca de Boa Vista/RR para dirimir quaisquer questões que não puderes ser resolvidas extrajudicialmente ou de forma pacífica através do suporte.
          </p>
          <p className="leading-relaxed">
            Dúvidas, sugestões e suporte devem ser encaminhados para: <span className="text-primary font-medium">info@stratisplanner.com.br</span>
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

