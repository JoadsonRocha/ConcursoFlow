import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { User, Camera, Mail, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Bell, Trash, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, updateProfile } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const storage = getStorage(db.app);

export default function Perfil() {
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      let finalPhotoURL = photoURL;
      
      // Upload image to storage if it's a data URI
      if (photoURL && photoURL.startsWith('data:')) {
        const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
        await uploadString(storageRef, photoURL, 'data_url');
        finalPhotoURL = await getDownloadURL(storageRef);
      }

      await updateProfile(user, {
        displayName,
        photoURL: finalPhotoURL
      });
      
      // Update in Firestore as well for consistency
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        photoURL: finalPhotoURL,
        updatedAt: new Date()
      });
      
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (err) {
      console.error(err);
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
    <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="space-y-4">
        <div className="flex items-center gap-3 text-primary/80 font-bold text-xs uppercase tracking-wider">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
          Configurações de Perfil
        </div>
      </header>

      {message && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "p-5 rounded-2xl flex items-center gap-4 border text-sm font-medium",
            message.type === 'success' ? "bg-accent/10 border-accent/20 text-accent" : "bg-red-500/10 border-red-500/20 text-red-400"
          )}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          {message.text}
        </motion.div>
      )}

      <div className="space-y-8">
        <section className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-8 md:p-10 border-b border-border bg-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <User size={120} className="text-slate-900" />
            </div>
            
            <div className="relative group">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl overflow-hidden bg-white border border-border shadow-inner transition-transform group-hover:scale-[1.02] duration-500">
                {photoURL ? (
                  <img src={photoURL} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <User size={48} />
                  </div>
                )}
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-primary text-white p-2.5 rounded-xl border border-white shadow-md group-hover:scale-110 transition-all cursor-pointer"
                title="Mudar Foto de Perfil"
              >
                <Camera size={14} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            <div className="text-center md:text-left space-y-2 relative z-10">
              <h3 className="text-2xl font-display text-text-main">{displayName || 'Estudante Stratis'}</h3>
              <div className="flex items-center justify-center md:justify-start gap-2 text-text-sub text-sm">
                <Mail className="w-3.5 h-3.5 text-primary" />
                {user.email}
              </div>
              <div className="mt-3 inline-flex items-center gap-2 bg-primary/5 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                Acesso Premium Ativo
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="p-8 md:p-10 space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Nome Completo</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub group-focus-within:text-primary transition-colors" />
                <input 
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white border border-border rounded-2xl py-4 pl-12 pr-6 text-sm text-text-main focus:border-primary/50 outline-none transition-all placeholder:text-text-sub/50"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-text-main text-white font-bold uppercase tracking-wider text-sm py-4 rounded-2xl shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Salvar Alterações
                </>
              )}
            </button>
          </form>
        </section>

        <section className="bg-white border border-border rounded-2xl p-8 md:p-10 space-y-8 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-inner">
               <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
               <h3 className="text-2xl font-display text-text-main">Privacidade e Segurança</h3>
               <p className="text-xs font-bold text-text-sub uppercase tracking-wider">Protocolos de proteção da sua conta.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Password Reset */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-white rounded-2xl border border-border">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-base font-bold text-text-main">Redefinição de Senha</div>
                <div className="text-xs text-text-sub">Enviaremos um link de recuperação para o seu e-mail.</div>
              </div>
              <button 
                onClick={handlePasswordReset}
                disabled={resetLoading}
                className="whitespace-nowrap px-8 py-4 bg-white text-text-main border border-border rounded-xl text-xs font-bold uppercase tracking-wider hover:border-primary/50 hover:text-primary transition-all active:scale-[0.98] shadow-sm"
              >
                {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Redefinir Agora'}
              </button>
            </div>

            {/* Notification Setting */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-white rounded-2xl border border-border">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-base font-bold text-text-main flex items-center gap-2 justify-center sm:justify-start">
                  <Bell className="w-4 h-4 text-primary" />
                  Notificações por Email
                </div>
                <div className="text-xs text-text-sub">Receba atualizações importantes sobre seu progresso.</div>
              </div>
              <button 
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={cn(
                  "px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-[0.98]",
                  notificationsEnabled ? "bg-primary text-white" : "bg-white text-text-sub border border-border"
                )}
              >
                {notificationsEnabled ? 'Ativado' : 'Desativado'}
              </button>
            </div>

            {/* Logout Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-white rounded-2xl border border-border">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-base font-bold text-text-main flex items-center gap-2 justify-center sm:justify-start">
                  <LogOut className="w-4 h-4 text-text-sub" />
                  Encerrar Sessão
                </div>
                <div className="text-xs text-text-sub">Sair da sua conta atual com segurança.</div>
              </div>
              <button 
                onClick={logout}
                className="whitespace-nowrap px-8 py-4 bg-white text-text-main border border-border rounded-xl text-xs font-bold uppercase tracking-wider hover:border-red-500/50 hover:text-red-600 transition-all active:scale-[0.98] shadow-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </section>

        <div className="text-center pt-8 opacity-20">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stratis Protocol v2.5.0</p>
        </div>
      </div>
    </div>
  );
}
