import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BrandLogo from '../components/BrandLogo';

export default function Auth() {
  const { login, loginEmail, signup, resetPassword, user } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'recover' | 'success_recover'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      if (!user.emailVerified && user.providerData?.[0]?.providerId === 'password') {
        // Maybe we want them to verify. But let's just let them in or navigate to home.
        navigate('/');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        await loginEmail(email, password);
        navigate('/');
      } else if (authMode === 'signup') {
        await signup(email, password, name);
        navigate('/');
      } else if (authMode === 'recover') {
        await resetPassword(email);
        setAuthMode('success_recover');
      }
    } catch (err: any) {
      console.error(err);
      let msg = 'Erro ao processar autenticação';
      
      // Try to parse Firestore error if it's a JSON string
      try {
        if (typeof err.message === 'string' && err.message.startsWith('{')) {
          const parsed = JSON.parse(err.message);
          if (parsed.error?.includes('permission-denied') || parsed.error?.includes('insufficient permissions')) {
            msg = 'Erro de permissão no Banco de Dados. Tente novamente em instantes.';
          } else {
            msg = parsed.error || msg;
          }
        }
      } catch (e) {
        // Not a JSON error
      }

      if (err.code === 'auth/user-not-found') msg = 'Usuário não encontrado';
      if (err.code === 'auth/wrong-password') msg = 'Senha incorreta';
      if (err.code === 'auth/invalid-credential') msg = 'E-mail ou senha incorretos';
      if (err.code === 'auth/email-already-in-use') msg = 'Este e-mail já está em uso';
      if (err.code === 'auth/weak-password') msg = 'A senha deve ter pelo menos 6 caracteres';
      if (err.code === 'auth/invalid-email') msg = 'E-mail inválido';
      if (err.code === 'auth/popup-closed-by-user') msg = 'O login foi cancelado';
      if (err.code === 'auth/network-request-failed') msg = 'Erro de conexão. Verifique sua internet.';
      if (err.code === 'auth/too-many-requests') msg = 'Muitas tentativas. Tente novamente mais tarde.';
      if (err.code === 'auth/user-disabled') msg = 'Usuário desativado.';
      
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
    <div className="h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[150px] rounded-full"></div>
      </div>

      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-white backdrop-blur-3xl relative items-center justify-center p-10 overflow-hidden border-r border-border ">
        <div className="relative z-10 space-y-8 max-w-lg">
          <BrandLogo size="lg" />
          
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-6xl font-display text-text-main leading-tight tracking-tight font-bold">
              Domine sua <br/>
              <span className="text-primary italic">Aprovação</span>
            </h1>
            <p className="text-text-sub text-lg font-medium leading-relaxed border-l-2 border-primary/20 pl-8">
              A arquitetura definitiva para estudantes de alto nível. Processe editais e domine rotinas complexas.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-border backdrop-blur-md">
               <div className="text-2xl font-display text-text-main mb-1 font-bold">100%</div>
               <div className="text-xs font-bold text-text-sub uppercase tracking-wider">Automatizado</div>
            </div>
            <div className="p-6 rounded-3xl bg-slate-50 border border-border backdrop-blur-md">
               <div className="text-2xl font-display text-primary mb-1 font-bold">+200</div>
               <div className="text-xs font-bold text-text-sub uppercase tracking-wider">Editais Ativos</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 py-4 md:px-8 md:py-4 relative overflow-y-auto bg-slate-50 justify-center">
        <div className="max-w-sm mx-auto w-full space-y-3 md:space-y-4">
          <header className="space-y-2 md:space-y-3">
            <Link to="/" className="inline-flex items-center gap-3 text-text-sub hover:text-text-main transition-all text-xs font-bold uppercase tracking-wider group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Retornar ao Início
            </Link>
            
            <div className="md:hidden flex items-center gap-3 mb-4">
              <BrandLogo size="md" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-display text-text-main tracking-tight uppercase font-bold">
                {authMode === 'login' && 'Log In'}
                {authMode === 'signup' && 'Sign Up'}
                {authMode === 'recover' && 'Recuperar Senha'}
                {authMode === 'success_recover' && 'E-mail Enviado'}
              </h2>
              <p className="text-text-sub font-medium text-sm">
                {authMode === 'login' && 'Acesse seu sistema estratégico.'}
                {authMode === 'signup' && 'Inicie sua jornada com ferramentas de elite.'}
                {authMode === 'recover' && 'Enviaremos instruções para redefinir sua senha.'}
                {authMode === 'success_recover' && 'Verifique sua caixa de entrada para redefinir a senha.'}
              </p>
            </div>
          </header>

          {authMode !== 'success_recover' && (
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-border">
               <button 
                 type="button"
                 onClick={() => setAuthMode('login')}
                 className={cn(
                   "flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                   authMode === 'login' ? "bg-white text-text-main shadow-sm border border-border" : "text-text-sub hover:text-text-main"
                 )}
               >
                 Identificar
               </button>
               <button 
                 type="button"
                 onClick={() => setAuthMode('signup')}
                 className={cn(
                   "flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                   authMode === 'signup' ? "bg-white text-text-main shadow-sm border border-border" : "text-text-sub hover:text-text-main"
                 )}
               >
                 Registrar
               </button>
            </div>
          )}

          {authMode === 'success_recover' ? (
            <div className="space-y-3">
              <button 
                type="button"
                onClick={() => setAuthMode('login')}
                className="w-full bg-primary text-white py-3 md:py-4 rounded-xl text-xs uppercase tracking-wider font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
              >
                Voltar ao Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <AnimatePresence mode="wait">
                {authMode === 'signup' && (
                  <motion.div 
                     key="name-field"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-1.5"
                  >
                    <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Seu Nome</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub/50 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="text"
                        required
                        placeholder="Ex: Joadson Rocha"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white border border-border rounded-xl py-3 pl-12 pr-6 text-sm font-semibold text-text-main focus:ring-2 ring-primary/10 outline-none transition-all placeholder:text-text-sub/30"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">E-mail de Acesso</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub/50 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="email"
                    required
                    placeholder="estudante@stratis.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-border rounded-xl py-3 pl-12 pr-6 text-sm font-semibold text-text-main focus:ring-2 ring-primary/10 outline-none transition-all placeholder:text-text-sub/30"
                  />
                </div>
              </div>

              {authMode !== 'recover' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-bold text-text-sub uppercase tracking-wider">Sua Senha</label>
                    {authMode === 'login' && (
                       <button type="button" onClick={() => setAuthMode('recover')} className="text-xs text-primary font-bold uppercase tracking-wider">Recuperar</button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub/50 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-border rounded-xl py-3 pl-12 pr-6 text-sm font-semibold text-text-main focus:ring-2 ring-primary/10 outline-none transition-all placeholder:text-text-sub/30"
                    />
                  </div>
                </div>
              )}

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

              {authMode === 'signup' && (
                <p className="text-[10px] text-text-sub font-medium leading-relaxed px-1">
                  Ao ativar seu acesso, você declara que concorda com nossos{' '}
                  <Link to="/termos" className="text-primary hover:underline">Termos de Uso</Link>,{' '}
                  <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link> e{' '}
                  <Link to="/cookies" className="text-primary hover:underline">Cookies</Link>.
                </p>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-xl text-[10px] uppercase tracking-wider font-bold shadow-lg shadow-primary/20 disabled:opacity-70 group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                     {authMode === 'login' && 'Entrar no Sistema'}
                     {authMode === 'signup' && 'Ativar Acesso'}
                     {authMode === 'recover' && 'Enviar E-mail'}
                     <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>

              {authMode === 'recover' && (
                 <button 
                   type="button" 
                   onClick={() => setAuthMode('login')} 
                   className="w-full text-center text-xs font-bold text-text-sub uppercase tracking-wider mt-4"
                 >
                   Voltar ao Login
                 </button>
              )}

              {(authMode === 'login' || authMode === 'signup') && (
                <>
                  <div className="relative py-2 mt-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                    <div className="relative flex justify-center text-xs font-bold uppercase"><span className="bg-slate-50 px-4 text-text-sub tracking-wider">Ou com Google</span></div>
                  </div>

                  <button 
                    type="button"
                    onClick={signInGoogle}
                    className="w-full bg-white border border-border py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider text-text-main hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                </>
              )}
            </form>
          )}

          <footer className="pt-2 text-center space-y-2">
             <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-text-sub uppercase tracking-wider opacity-60">
                <Link to="/termos" className="hover:text-primary">Termos</Link>
                <Link to="/privacidade" className="hover:text-primary">Privacidade</Link>
                <Link to="/cookies" className="hover:text-primary">Cookies</Link>
             </div>
             <p className="text-[10px] font-bold text-text-sub uppercase tracking-wider opacity-40">
                Stratis Planner 2026 — LGPD Compliance
             </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
