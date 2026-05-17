import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { ShieldCheck, Lock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validCode, setValidCode] = useState<boolean | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const code = searchParams.get('oobCode');
    if (code) {
      setOobCode(code);
      // Opcional: verificar o código de redefinição de senha logo que carregar
      verifyPasswordResetCode(auth, code)
        .then(() => setValidCode(true))
        .catch(() => {
          setValidCode(false);
          setError('O link de redefinição de senha é inválido ou expirou.');
        });
    } else {
      setValidCode(false);
      setError('Nenhum código de redefinição encontrado na URL.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;
    
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao redefinir a senha. O link pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-black/5 border border-border">
          <header className="mb-6 space-y-1">
            <h1 className="text-2xl font-display text-text-main tracking-tight uppercase font-bold">
              Nova Senha
            </h1>
            <p className="text-text-sub font-medium text-sm">
              Crie uma nova senha para acessar sua conta no Stratis Planner.
            </p>
          </header>

          {success ? (
             <div className="space-y-6">
              <div className="p-4 bg-green-50 text-green-700 border border-green-100 rounded-xl flex items-start gap-3 text-sm font-bold leading-tight">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 text-green-500" />
                <p>Sua senha foi redefinida com sucesso!</p>
              </div>
              <button 
                type="button"
                onClick={() => navigate('/auth')}
                className="w-full bg-primary text-white py-3 md:py-4 rounded-xl text-xs uppercase tracking-wider font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
              >
                Voltar para o Login
              </button>
            </div>
          ) : validCode === false ? (
            <div className="space-y-6">
              <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-center gap-3 text-xs font-bold leading-tight">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                 {error}
              </div>
              <button 
                type="button"
                onClick={() => navigate('/auth')}
                className="w-full bg-white text-text-main py-3 rounded-xl border border-border text-xs uppercase tracking-wider font-bold hover:bg-slate-50 transition-all"
              >
                Voltar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Nova Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub/50 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white border border-border rounded-xl py-3 pl-12 pr-6 text-sm font-semibold text-text-main focus:ring-2 ring-primary/10 outline-none transition-all placeholder:text-text-sub/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Confirmar Nova Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub/50 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white border border-border rounded-xl py-3 pl-12 pr-6 text-sm font-semibold text-text-main focus:ring-2 ring-primary/10 outline-none transition-all placeholder:text-text-sub/30"
                  />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-center gap-3 text-xs font-bold leading-tight"
                >
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={loading || validCode === null}
                className="w-full bg-primary text-white py-3 rounded-xl text-[10px] uppercase tracking-wider font-bold shadow-lg shadow-primary/20 disabled:opacity-70 group mt-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                     Redefinir Senha
                     <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
