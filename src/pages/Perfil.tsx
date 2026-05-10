import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { User, Camera, Mail, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Perfil() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await updateProfile(user, {
        displayName,
        photoURL
      });
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso! Recarregue para ver todas as mudanças.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user.email) return;
    setResetLoading(true);
    setMessage(null);
    try {
      await sendPasswordResetEmail(user.auth, user.email);
      setMessage({ type: 'success', text: 'E-mail de redefinição de senha enviado!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao enviar e-mail. Tente novamente mais tarde.' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-1.5">
        <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em] leading-none mb-2">Sua Conta</div>
        <h1 className="text-4xl md:text-5xl font-display leading-tight text-text-main tracking-tighter">
          Configurações <span className="italic text-primary">Pessoais</span>
        </h1>
        <p className="text-text-sub text-sm font-medium pt-1">Gerencie sua identidade e segurança na plataforma.</p>
      </header>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-2xl flex items-center gap-3 border text-sm font-medium",
            message.type === 'success' ? "bg-green-50 border-green-100 text-green-700 dark:bg-green-900/10 dark:border-green-500/20" : "bg-red-50 border-red-100 text-red-700 dark:bg-red-900/10 dark:border-red-500/20"
          )}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          {message.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Info */}
        <section className="bg-white dark:bg-slate-900 border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="p-8 border-b border-border/50 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-6">
            <div className="relative group">
              {photoURL ? (
                <img src={photoURL} className="w-24 h-24 rounded-[2rem] object-cover border-4 border-white dark:border-slate-800 shadow-xl" alt="Avatar" />
              ) : (
                <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary border-4 border-white dark:border-slate-800 shadow-xl">
                  <User size={40} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <Camera className="text-white w-6 h-6" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-display text-text-main">{displayName || 'Concurseiro'}</h3>
              <p className="text-sm text-text-sub flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </p>
              <div className="mt-2 text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-1 rounded-full inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Conta Ativa
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-text-sub uppercase tracking-widest ml-1">Nome de Exibição</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub/50" />
                  <input 
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-border rounded-2xl py-3 pl-11 pr-4 text-sm font-medium outline-none focus:ring-2 ring-primary/10 transition-all"
                    placeholder="Seu nome ou apelido"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-text-sub uppercase tracking-widest ml-1">URL da Foto (Avatar)</label>
                <div className="relative">
                  <Camera className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub/50" />
                  <input 
                    type="text"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-border rounded-2xl py-3 pl-11 pr-4 text-sm font-medium outline-none focus:ring-2 ring-primary/10 transition-all"
                    placeholder="https://exemplo.com/foto.jpg"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] py-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Alterações'}
            </button>
          </form>
        </section>

        {/* Security */}
        <section className="bg-white dark:bg-slate-900 border border-border rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/10 rounded-2xl flex items-center justify-center text-red-500">
               <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
               <h3 className="text-lg font-display text-text-main leading-tight">Segurança</h3>
               <p className="text-xs text-text-sub">Mantenha sua conta protegida e atualizada.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-border">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-sm font-bold text-text-main">Redefinir Senha</div>
              <div className="text-xs text-text-sub max-w-xs">Enviaremos um link seguro para o seu e-mail cadastrado.</div>
            </div>
            <button 
              onClick={handlePasswordReset}
              disabled={resetLoading}
              className="whitespace-nowrap px-6 py-3 bg-white dark:bg-slate-900 text-text-main border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              {resetLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Enviar Link'}
            </button>
          </div>
        </section>

        <div className="text-center pt-4">
          <p className="text-[10px] font-black text-text-sub uppercase tracking-[0.3em]">Stratis Engenharia de Aprovação © 2026</p>
        </div>
      </div>
    </div>
  );
}
