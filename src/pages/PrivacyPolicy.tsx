import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowLeft, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-bg p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Início
        </Link>
        
        <div className="bg-white dark:bg-card-bg border border-border rounded-[40px] p-8 md:p-12 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-text-main tracking-tight">Política de Privacidade</h1>
              <p className="text-text-sub text-sm font-medium uppercase tracking-widest">Última atualização: 10 de Maio de 2026</p>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-text-main">
            <section className="space-y-4">
              <h2 className="text-xl font-bold">1. Coleta de Informações</h2>
              <p>Coletamos informações básicas como seu nome e e-mail quando você se cadastra via e-mail ou autenticação social (Google). Também armazenamos seus planos de estudo e dados de desempenho para que você possa acessá-los de qualquer dispositivo.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold">2. Uso dos Dados</h2>
              <p>Seus dados são utilizados exclusivamente para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Personalizar sua experiência na plataforma.</li>
                <li>Gerar cronogramas baseados em seus interesses.</li>
                <li>Sincronizar seu progresso entre diferentes dispositivos.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold">3. Segurança dos Dados</h2>
              <p>Utilizamos o Google Firebase para autenticação e armazenamento de dados, garantindo que suas informações estejam protegidas por protocolos de segurança de nível industrial.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold">4. Seus Direitos</h2>
              <p>Você tem o direito de solicitar a exclusão de seus dados a qualquer momento através das configurações da sua conta ou entrando em contato conosco.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold">5. Cookies</h2>
              <p>Utilizamos cookies apenas para manter sua sessão ativa e lembrar suas preferências de tema (modo escuro/claro).</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
