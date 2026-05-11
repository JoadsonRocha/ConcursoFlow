import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Sparkles,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const { login, loginEmail, signup, user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginEmail(email, password);
      } else {
        await signup(email, password, name);
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      let msg = 'Erro ao processar autenticação';
      if (err.code === 'auth/user-not-found') msg = 'Usuário não encontrado';
      if (err.code === 'auth/wrong-password') msg = 'Senha incorreta';
      if (err.code === 'auth/email-already-in-use') msg = 'Este e-mail já está em uso';
      if (err.code === 'auth/weak-password') msg = 'A senha deve ter pelo menos 6 caracteres';
      if (err.code === 'auth/invalid-email') msg = 'E-mail inválido';
      if (err.code === 'auth/popup-closed-by-user') msg = 'O login foi cancelado';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const signInGoogle = async () => {
    setError('');
    try {
      await login();
      navigate('/');
    } catch (err: any) {
      console.error(err);
      let msg = 'Erro ao entrar com Google';
      if (err.code === 'auth/popup-closed-by-user') msg = 'O login foi cancelado';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col md:flex-row overflow-hidden">
      {/* Visual Side (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-900 relative items-center justify-center p-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 space-y-12 max-w-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30">
              <Sparkles className="w-7 h-7" />
            </div>
            <span className="text-3xl font-black text-white tracking-tighter">Stratis</span>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-7xl font-display text-white leading-[0.9] tracking-tighter">
              A <span className="text-primary italic">evolução</span> do seu estudo começa <span className="italic">aqui</span>.
            </h1>
            <p className="text-slate-400 text-xl font-medium leading-relaxed">
              Verticalização de editais com IA, cronogramas personalizados e microaprendizado dinâmico.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
               <div className="text-3xl font-display text-white mb-1">100%</div>
               <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Automatizado</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
               <div className="text-3xl font-display text-primary mb-1">+200</div>
               <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Editais Ativos</div>
            </div>
          </div>
        </div>

        {/* Floating tech elements */}
        <div className="absolute top-1/4 right-10 animate-bounce transition-all duration-3000">
           <div className="w-16 h-16 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md"></div>
        </div>
        <div className="absolute bottom-1/4 left-10 animate-pulse transition-all duration-2000">
           <div className="w-24 h-24 bg-primary/20 rounded-[2.5rem] border border-primary/20 backdrop-blur-md"></div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex flex-col bg-white dark:bg-card-bg px-6 py-10 md:px-20 md:py-20 relative overflow-y-auto">
        <div className="max-w-md mx-auto w-full space-y-10">
          <header className="space-y-6">
            <Link to="/" className="inline-flex items-center gap-2 text-text-sub hover:text-text-main transition-colors text-xs font-black uppercase tracking-widest group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Voltar para Início
            </Link>
            
            <div className="md:hidden flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-text-main tracking-tighter">Stratis</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-4xl font-display text-text-main tracking-tighter">
                {isLogin ? 'Bem-vindo de volta' : 'Comece sua jornada'}
              </h2>
              <p className="text-text-sub font-medium">
                {isLogin ? 'Acesse sua conta para continuar seus estudos.' : 'Crie sua conta em segundos e automatize seus planos.'}
              </p>
            </div>
          </header>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl flex gap-1 border border-border">
             <button 
               onClick={() => setIsLogin(true)}
               className={cn(
                 "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                 isLogin ? "bg-white dark:bg-slate-800 text-text-main shadow-sm" : "text-text-sub hover:text-text-main"
               )}
             >
               Entrar
             </button>
             <button 
               onClick={() => setIsLogin(false)}
               className={cn(
                 "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                 !isLogin ? "bg-white dark:bg-slate-800 text-text-main shadow-sm" : "text-text-sub hover:text-text-main"
               )}
             >
               Cadastrar
             </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-1.5"
                >
                  <label className="text-[11px] font-black text-text-sub uppercase tracking-widest ml-1">Nome Completo</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub/50" />
                    <input 
                      type="text"
                      required
                      placeholder="Joadson Rocha"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-text-sub uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub/50" />
                <input 
                  type="email"
                  required
                  placeholder="estudante@dominio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] font-black text-text-sub uppercase tracking-widest">Senha</label>
                {isLogin && (
                   <button type="button" className="text-[10px] text-primary font-bold hover:underline">Esqueceu a senha?</button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub/50" />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold leading-tight shadow-sm"
              >
                <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-text-main text-bg py-5 rounded-2xl text-sm font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-text-main/10 relative disabled:opacity-70 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-bg/20 border-t-bg rounded-full animate-spin mx-auto"></div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                   {isLogin ? 'Entrar no Sistema' : 'Finalizar Cadastro'}
                   <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
              <div className="relative flex justify-center text-[10px] font-black uppercase"><span className="bg-white dark:bg-card-bg px-4 text-text-sub tracking-widest">ou acesso facilitado</span></div>
            </div>

            <button 
              type="button"
              onClick={signInGoogle}
              className="w-full bg-white dark:bg-slate-800 border border-border py-4 rounded-2xl text-sm font-bold text-text-main hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Entrar com Google
            </button>
          </form>

          <footer className="pt-10 text-center">
             <p className="text-[10px] font-black text-text-sub uppercase tracking-[0.2em]">
                Stratis Aprovação © 2026 • Engenharia de Software para Editais
             </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
