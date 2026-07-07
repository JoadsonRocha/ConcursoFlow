import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, LogOut, ExternalLink, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function ConsentModal() {
  const { profile, updateProfile, logout } = useAuth();
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  // If user is not logged in, or has already accepted both, don't show anything
  if (!profile || (profile.termsAccepted && profile.privacyAccepted)) {
    return null;
  }

  const handleAccept = async () => {
    if (!termsChecked || !privacyChecked) {
      toast.error('Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        termsAccepted: true,
        privacyAccepted: true,
        consentDate: new Date().toISOString()
      });
      toast.success('Consentimento registrado com sucesso no Firebase!');
    } catch (err) {
      console.error('Erro ao salvar termos de consentimento:', err);
      toast.error('Erro ao salvar o consentimento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      await logout();
      toast.info('Você foi desconectado. É necessário aceitar os termos para utilizar a plataforma.');
    } catch (err) {
      console.error('Erro ao desconectar:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col"
      >
        {/* Header Visual */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 md:p-8 relative">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <ShieldCheck className="w-32 h-32 text-primary" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-0.5">Segurança & Privacidade</span>
              <h2 className="text-xl md:text-2xl font-display font-black text-slate-800 uppercase tracking-tight">Termos e Consentimento</h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto max-h-[60vh]">
          <p className="text-sm font-medium text-slate-600 leading-relaxed">
            Bem-vindo ao <span className="font-bold text-slate-800">Stratis Planner</span>. Em conformidade com a <span className="font-semibold text-slate-700">Lei Geral de Proteção de Dados (LGPD)</span>, precisamos do seu consentimento expresso para processar seus dados de estudo e fornecer uma experiência de alta performance personalizada.
          </p>

          <div className="space-y-4 pt-2">
            {/* Terms of Use */}
            <div className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${termsChecked ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
              <div className="flex items-center h-5 mt-0.5">
                <input
                  id="agree-terms"
                  type="checkbox"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                  className="w-4 h-4 text-primary bg-white border-slate-300 rounded focus:ring-primary focus:ring-2 focus:ring-offset-2 accent-primary cursor-pointer"
                />
              </div>
              <label htmlFor="agree-terms" className="text-xs font-semibold text-slate-700 leading-relaxed cursor-pointer select-none flex-1">
                Eu li, compreendi e concordo com os{' '}
                <a
                  href="/termos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-bold inline-flex items-center gap-1.5"
                >
                  Termos de Uso <ExternalLink className="w-3 h-3" />
                </a>{' '}
                da plataforma.
              </label>
            </div>

            {/* Privacy Policy */}
            <div className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${privacyChecked ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
              <div className="flex items-center h-5 mt-0.5">
                <input
                  id="agree-privacy"
                  type="checkbox"
                  checked={privacyChecked}
                  onChange={(e) => setPrivacyChecked(e.target.checked)}
                  className="w-4 h-4 text-primary bg-white border-slate-300 rounded focus:ring-primary focus:ring-2 focus:ring-offset-2 accent-primary cursor-pointer"
                />
              </div>
              <label htmlFor="agree-privacy" className="text-xs font-semibold text-slate-700 leading-relaxed cursor-pointer select-none flex-1">
                Eu autorizo o processamento dos meus dados de acordo com a{' '}
                <a
                  href="/privacidade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-bold inline-flex items-center gap-1.5"
                >
                  Política de Privacidade <ExternalLink className="w-3 h-3" />
                </a>{' '}
                do sistema.
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3.5 bg-amber-50 rounded-2xl border border-amber-100 text-[11px] text-amber-800 font-medium leading-relaxed">
            <FileText className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Seu consentimento será registrado permanentemente no Firebase e associado de forma segura à sua conta.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleDecline}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all flex items-center justify-center gap-2 border border-slate-200"
          >
            <LogOut className="w-4 h-4" />
            Recusar e Sair
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={!termsChecked || !privacyChecked || loading}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-primary hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-primary/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                Aceitar e Continuar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
