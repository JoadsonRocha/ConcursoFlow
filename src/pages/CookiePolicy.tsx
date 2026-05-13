import React from 'react';
import { Cookie, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CookiePolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in duration-700">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-text-sub hover:text-primary transition-colors mb-12">
        <ChevronLeft className="w-4 h-4" />
        Voltar ao início
      </Link>

      <header className="mb-16">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <Cookie className="w-6 h-6" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-text-main tracking-tight">
            Política de Cookies
          </h1>
        </div>
        <p className="text-text-sub text-sm font-medium">Última atualização: 13 de maio de 2026</p>
      </header>

      <div className="prose prose-slate max-w-none space-y-12 text-text-main">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">O que são Cookies?</h2>
          <p className="leading-relaxed">
            Cookies são pequenos arquivos de texto armazenados no seu navegador ou dispositivo que nos ajudam a reconhecer você e lembrar de suas preferências, proporcionando uma experiência de uso mais fluida e personalizada no Stratis Planner.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">Tipos de Cookies que Utilizamos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-50/50">
                  <th className="py-3 px-4 font-bold text-text-main">Tipo</th>
                  <th className="py-3 px-4 font-bold text-text-main">Finalidade</th>
                  <th className="py-3 px-4 font-bold text-text-main">Duração</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 px-4 font-medium">Essenciais</td>
                  <td className="py-3 px-4">Funcionamento básico (login, segurança, sessões).</td>
                  <td className="py-3 px-4">Sessão / 1 ano</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Preferências</td>
                  <td className="py-3 px-4">Lembrar suas configurações de tema, idioma e filtros.</td>
                  <td className="py-3 px-4">Até 1 ano</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Análise</td>
                  <td className="py-3 px-4">Entender como você utiliza a plataforma para melhorias.</td>
                  <td className="py-3 px-4">Até 1 ano</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Marketing</td>
                  <td className="py-3 px-4">Recomendações e avisos sobre novos recursos (opcional).</td>
                  <td className="py-3 px-4">Até 6 meses</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">Gerenciamento de Cookies</h2>
          <p className="leading-relaxed">
            Você possui total autonomia para gerenciar, bloquear ou excluir cookies diretamente nas configurações do seu navegador. Entretanto, lembre-se que bloquear cookies considerados "Essenciais" pode afetar o funcionamento core da plataforma e impedir o login.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">Consentimento</h2>
          <p className="leading-relaxed">
            Ao utilizar o Stratis Planner, você consente com o uso de cookies conforme descrito nesta política. Você pode retirar seu consentimento a qualquer momento alterando as configurações do seu navegador de internet.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-main border-b border-border pb-2">Dúvidas?</h2>
          <p className="leading-relaxed">
            Se você tiver qualquer dúvida sobre como utilizamos cookies, sinta-se à vontade para nos contatar através do e-mail: <span className="text-primary font-medium">contato@stratisplanner.com.br</span>
          </p>
        </section>
      </div>

      <footer className="mt-20 pt-8 border-t border-border text-center">
        <p className="text-xs text-text-sub font-medium uppercase tracking-widest">
          Transparência e Respeito ao Usuário — Stratis Planner {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
