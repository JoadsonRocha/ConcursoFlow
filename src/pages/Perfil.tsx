import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Camera, Mail, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Bell, Trash, LogOut, Target, TrendingUp, MessageCircle, PlayCircle, Zap, CreditCard, Calendar, ChevronDown, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getStorage } from 'firebase/storage';
import { auth, db, updateProfile as firebaseUpdateProfile, sendPasswordResetEmail } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { createCheckoutSession, createPortalSession } from '../services/stripe';
import { toast } from 'sonner';
import ProModal from '../components/ProModal';

export default function Perfil() {
  const { user, profile, logout, isPro, resetPassword, updateProfile, planType } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || user?.photoURL || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [concursoFoco, setConcursoFoco] = useState(profile?.concursoFoco || '');
  const [nivelAtual, setNivelAtual] = useState(profile?.nivelAtual || 'Iniciante');
  const [fraseStatus, setFraseStatus] = useState(profile?.fraseStatus || '');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isCreator, setIsCreator] = useState(profile?.isCreator || false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  const handleSyncSubscription = async () => {
    if (!user?.email) return;
    setSyncLoading(true);
    try {
      const response = await fetch('/api/auth/sync-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(
          data.isSpecial 
            ? 'Perfil de estrategista VIP ativado e sincronizado! Recursos liberados.' 
            : 'Assinatura encontrada e sincronizada com sucesso! Recursos PRO liberados.'
        );
      } else {
        toast.error(data.error || 'Nenhuma assinatura encontrada para este e-mail no Stripe.');
      }
    } catch (err: any) {
      console.error('Erro ao sincronizar:', err);
      toast.error('Ocorreu um erro ao conectar com o servidor para sincronizar sua assinatura.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      await createPortalSession();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao redirecionar para o portal de gerenciamento da Stripe.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!("Notification" in window)) {
      toast.error("Notificações não são suportadas neste navegador.");
      return;
    }

    if (Notification.permission === "granted") {
      try {
        new Notification("Stratis Planner", {
          body: "Teste de notificação enviado com sucesso! 🚀",
          icon: "/logo_pwa.png"
        });
        toast.success("Notificação local enviada para teste!");
      } catch (err) {
        toast.info("O navegador impediu a notificação local. Verifique se o seu dispositivo permite banners.");
      }
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification("Stratis Planner", {
          body: "Notificações ativadas com sucesso! 🚀",
          icon: "/logo_pwa.png"
        });
        toast.success("Permissão concedida!");
      }
    } else {
      toast.error("Permissão de notificação negada. Ative nas configurações do navegador para este site.");
    }
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      // Atualização resiliente e instantânea no lado do cliente como fallback de segurança
      if (updateProfile) {
        updateProfile({ userPlan: 'annual' })
          .then(() => {
            toast.success('Parabéns! Sua assinatura Premium PRO foi ativada e está ativa com sucesso.', {
              duration: 5000,
            });
          })
          .catch((err) => {
            console.error('Erro ao atualizar plano diretamente pelo cliente:', err);
            toast.success('Parabéns! Sua assinatura Premium PRO foi ativada.', {
              duration: 5000,
            });
          });
      } else {
        toast.success('Parabéns! Sua assinatura Premium PRO foi ativada.', {
          duration: 5000,
        });
      }
      
      // Cleanup URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [updateProfile]);

  // Sincroniza o estado local do formulário com o perfil carregado da nuvem de forma resiliente
  React.useEffect(() => {
    if (profile) {
      setDisplayName(prev => prev || profile.displayName || user?.displayName || '');
      setPhotoURL(prev => prev || profile.photoURL || user?.photoURL || '');
      setPhoneNumber(prev => prev || profile.phoneNumber || '');
      setConcursoFoco(prev => prev || profile.concursoFoco || '');
      setNivelAtual(prev => prev === 'Iniciante' ? (profile.nivelAtual || 'Iniciante') : prev);
      setFraseStatus(prev => prev || profile.fraseStatus || '');
      setIsCreator(prev => prev || profile.isCreator || false);
    } else if (user) {
      setDisplayName(prev => prev || user.displayName || '');
      setPhotoURL(prev => prev || user.photoURL || '');
    }
  }, [profile, user]);

  const toggleTour = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 
        tourCompleted: !profile?.tourCompleted,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Erro ao atualizar tour:", err);
    }
  };

  const handleSubscribe = async (planType: 'monthly' | 'annual') => {
    if (isPro) {
      toast.error('Você já possui o Plano PRO Anual ativo em sua conta.');
      return;
    }
    setCheckoutLoading(planType);
    try {
      const priceId = planType === 'annual' ? 'annual_plan' : 'monthly_plan';
      await createCheckoutSession(priceId);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao iniciar checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (!user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB.' });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const MAX_SIZE = 300; // max width/height to keep size small
          
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress with 0.7 quality jpeg to ensure it stays well under 100kb
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            setPhotoURL(compressedDataUrl);
          } else {
            setPhotoURL(reader.result as string);
          }
        };
        img.src = reader.result as string;
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
      
      // Update in Firestore as well for consistency
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        photoURL: finalPhotoURL,
        phoneNumber,
        concursoFoco,
        nivelAtual,
        fraseStatus,
        isCreator,
        updatedAt: serverTimestamp()
      });
      
      const authUpdates: { displayName?: string, photoURL?: string } = { displayName };
      // Firebase Auth photoURL length limit is ~2048 chars. Base64 strings will exceed this.
      // If finalPhotoURL is a base64 data URI, we don't save it to Firebase Auth, only to Firestore.
      if (finalPhotoURL && !finalPhotoURL.startsWith('data:')) {
        authUpdates.photoURL = finalPhotoURL;
      }

      await firebaseUpdateProfile(user, authUpdates);
      
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResetLoading(true);
    setMessage(null);
    try {
      await resetPassword(user.email);
      setMessage({ type: 'success', text: 'E-mail de redefinição de senha enviado!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao enviar e-mail. Tente novamente mais tarde.' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
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
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl overflow-hidden bg-white transition-transform group-hover:scale-[1.02] duration-500">
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
              <h3 className="text-2xl font-display text-text-main">{displayName || 'Estudante Stratis Planner'}</h3>
              <div className="flex items-center justify-center md:justify-start gap-2 text-text-sub text-sm">
                <Mail className="w-3.5 h-3.5 text-primary" />
                {user.email}
              </div>
              {fraseStatus && (
                <div className="text-sm font-medium italic text-text-sub mt-1 max-w-sm">"{fraseStatus}"</div>
              )}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                {planType === 'pro' ? (
                  <div className="inline-flex items-center gap-2 border text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full bg-amber-500/5 border-amber-500/20 text-amber-600">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    Plano PRO Ativo
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 border text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full bg-slate-100 border-slate-200 text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                    Plano GRATUITO 🌱
                  </div>
                )}
                <div className="inline-flex items-center gap-2 bg-accent/5 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {nivelAtual}
                </div>
                {concursoFoco && (
                  <div className="inline-flex items-center gap-2 bg-blue-500/5 border border-blue-500/20 text-blue-600 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full">
                    <Target className="w-3.5 h-3.5" />
                    {concursoFoco.length > 20 ? concursoFoco.substring(0,20) + '...' : concursoFoco}
                  </div>
                )}
              </div>
            </div>
          </div>

          <form id="profile-form" onSubmit={handleUpdateProfile} className="p-8 md:p-10 space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Nome Completo</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-50 border border-border rounded-2xl py-4 pl-12 pr-6 text-sm text-text-main focus:bg-white focus:border-primary/50 outline-none transition-all placeholder:text-text-sub/50"
                    placeholder="Seu nome"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Telefone / WhatsApp</label>
                <div className="relative group">
                  <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub group-focus-within:text-primary transition-colors" />
                  <input 
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-border rounded-2xl py-4 pl-12 pr-6 text-sm text-text-main focus:bg-white focus:border-primary/50 outline-none transition-all placeholder:text-text-sub/50"
                    placeholder="Ex: (95) 99999-9999"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Concurso Foco</label>
                <div className="relative group">
                  <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    value={concursoFoco}
                    onChange={(e) => setConcursoFoco(e.target.value)}
                    className="w-full bg-slate-50 border border-border rounded-2xl py-4 pl-12 pr-6 text-sm text-text-main focus:bg-white focus:border-primary/50 outline-none transition-all placeholder:text-text-sub/50"
                    placeholder="Ex: Polícia Federal, Receita Federal..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Nível Atual</label>
                  <div className="relative group">
                    <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub group-focus-within:text-primary transition-colors pointer-events-none" />
                    <select
                      value={nivelAtual}
                      onChange={(e) => setNivelAtual(e.target.value)}
                      className="w-full bg-slate-50 border border-border rounded-2xl py-4 pl-12 pr-6 text-sm text-text-main font-medium focus:bg-white focus:border-primary/50 outline-none transition-all appearance-none"
                    >
                      <option value="Iniciante">Iniciante</option>
                      <option value="Intermediário">Intermediário</option>
                      <option value="Avançado">Avançado</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-sub uppercase tracking-wider ml-1">Frase/Status</label>
                  <div className="relative group">
                    <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text"
                      value={fraseStatus}
                      onChange={(e) => setFraseStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-border rounded-2xl py-4 pl-12 pr-6 text-sm text-text-main focus:bg-white focus:border-primary/50 outline-none transition-all placeholder:text-text-sub/50"
                      placeholder="Sua motivação diária..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-slate-50 border border-border rounded-2xl">
                <div>
                  <h4 className="text-sm font-bold text-text-main mb-1">Selo Criador de Conteúdo</h4>
                  <p className="text-xs text-text-sub max-w-sm">
                    Ative seu selo de Criador. No futuro, isso permitirá vender mapas mentais, resumos e flashcards na Comunidade.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreator(!isCreator)}
                  className={cn(
                    "w-14 h-8 rounded-full transition-colors relative shrink-0",
                    isCreator ? "bg-primary" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 bg-white rounded-full absolute top-1 transition-all shadow-sm",
                    isCreator ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="bg-white border border-border rounded-2xl p-8 md:p-10 space-y-6 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-lg font-bold font-display text-text-main flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Controle de Assinaturas
            </h3>
            <p className="text-xs text-text-sub font-medium">
              Escolha seu Nível de Performance para Aprovação
            </p>
          </div>

          <div className="mt-4">
            {isPro ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between bg-zinc-50/50">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none block mb-1">Nível Atual</span>
                    <h4 className="text-sm font-black text-amber-600 flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                      Estrategista PRO
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                      Sua assinatura está ativa e sendo processada via Stripe. Aproveite toda a inteligência e os recursos ilimitados!
                    </p>
                  </div>
                  <div className="mt-4 text-[10px] font-bold text-amber-700 bg-amber-500/10 px-3 py-1.5 rounded-lg uppercase tracking-wide inline-flex items-center gap-1 w-fit">
                    Acesso Ilimitado Liberado
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between bg-white relative overflow-hidden">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none block mb-1">Pagamentos</span>
                    <h4 className="text-sm font-bold text-text-main">Gerenciar Assinatura</h4>
                    <p className="text-[11px] text-[#5C7187] leading-normal pt-1">
                      Altere sua forma de pagamento, consulte faturas ou realize o cancelamento diretamente no portal seguro do Stripe.
                    </p>
                  </div>
                  <div className="mt-5">
                    <button
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                      className="w-full py-3 bg-slate-900 border border-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {portalLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin pointer-events-none" />
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5 shrink-0" />
                          Acessão ao Portal Stripe
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between bg-slate-50">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none block mb-1">Nível Atual</span>
                    <h4 className="text-sm font-bold text-slate-700">Plano Semente (Gratuito)</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                      Limite de geração básica e acesso básico à plataforma.
                    </p>
                  </div>
                  <div className="mt-4 text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span> Pleno Uso
                  </div>
                </div>

                <div className="border border-primary/20 rounded-2xl p-5 flex flex-col justify-between bg-gradient-to-br from-indigo-50/40 via-transparent build:transparent relative overflow-hidden">
                  <div className="space-y-1 relative z-10">
                    <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest leading-none block mb-1">Assinar Pro</span>
                    <h4 className="text-sm font-black text-text-main flex items-center gap-1.5">Estrategista PRO</h4>
                    <p className="text-[11px] text-[#5C7187] leading-relaxed pt-1">
                      Desbloqueie cronogramas de até 12 semanas, mentor inteligente 24/7, mapas mentais, flashcards e análise de recorrência (Pareto) ilimitados.
                    </p>
                  </div>
                  <div className="mt-5 relative z-10">
                    <button
                      onClick={() => navigate('/planos')}
                      className="w-full bg-[#f97316] text-white py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-[#f97316]/10"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current text-white shrink-0 animate-bounce" />
                      Assinar Pro
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Botão de auto-sincronia de segurança para recuperar acesso */}
            <div className="pt-6 border-t border-dashed border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-black text-[#5C7187] uppercase tracking-wider block">Problemas com sua Assinatura?</span>
                <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
                  Se você efetuou o pagamento e seu acesso Pro não foi atualizado ainda, clique ao lado para sincronizar diretamente com o Stripe. Ele irá buscar e reativar suas permissões de forma automática.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSyncSubscription}
                disabled={syncLoading}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 hover:border-slate-300 text-slate-700 rounded-xl text-[11px] font-extrabold uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shrink-0 select-none cursor-pointer disabled:opacity-50"
              >
                {syncLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin pointer-events-none" />
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                    Sincronizar Plano
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white border border-border rounded-2xl p-8 md:p-10 space-y-8 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#5C7187] mb-2">
               <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-key-round"><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 .8-.4l.949-.949A2 2 0 0 1 8.162 20H10a2 2 0 0 0 2-2v-.838a2 2 0 0 1 .586-1.414l.293-.293a2 2 0 0 0 0-2.828l-1.465-1.465a2 2 0 0 0-2.828 0l-.3.3A2 2 0 0 1 6.894 14H5a2 2 0 0 0-2 2v.414a2 2 0 0 1-.586 1.414z"/><circle cx="15.5" cy="8.5" r="5.5"/><path d="m18 11 2 2"/></svg>
               <h3 className="text-base font-bold text-text-main">Segurança de Acesso</h3>
            </div>
            <button 
              type="button"
              onClick={() => setAdvancedSettingsOpen(!advancedSettingsOpen)}
              className="w-full flex items-center justify-between p-6 bg-slate-50 border border-border rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3 text-base font-bold text-text-main">
                <Target className="w-5 h-5 text-text-sub" />
                Configurações Avançadas e Guias
              </div>
              <ChevronDown className={cn("w-5 h-5 text-text-sub transition-transform", advancedSettingsOpen ? "rotate-180" : "")} />
            </button>

            <AnimatePresence>
              {advancedSettingsOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-4"
                >
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

                  {/* Notification Email Setting */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-white rounded-2xl border border-border">
                    <div className="space-y-1 text-center sm:text-left">
                      <div className="text-base font-bold text-text-main flex items-center gap-2 justify-center sm:justify-start">
                        <Mail className="w-4 h-4 text-primary" />
                        Alertas por E-mail
                      </div>
                      <div className="text-xs text-text-sub">Receba atualizações importantes sobre seu progresso.</div>
                    </div>
                    <button 
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={cn(
                        "px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-[0.98]",
                        notificationsEnabled ? "bg-slate-900 text-white" : "bg-white text-text-sub border border-border"
                      )}
                    >
                      {notificationsEnabled ? 'Ativado' : 'Desativado'}
                    </button>
                  </div>

                  {/* Tour Setting */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-white rounded-2xl border border-border">
                    <div className="space-y-1 text-center sm:text-left">
                      <div className="text-base font-bold text-text-main flex items-center gap-2 justify-center sm:justify-start">
                        <PlayCircle className="w-4 h-4 text-primary" />
                        Guia Inicial
                      </div>
                      <div className="text-xs text-text-sub">Mostrar novamente o tour de instruções.</div>
                    </div>
                    <button 
                      onClick={toggleTour}
                      className={cn(
                        "px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-[0.98]",
                        !profile?.tourCompleted ? "bg-primary text-white" : "bg-white text-text-sub border border-border"
                      )}
                    >
                      {!profile?.tourCompleted ? 'Ativado' : 'Desativado'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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



            <div className="pt-8 w-full">
              <button 
                type="submit"
                disabled={loading}
                form="profile-form"
                className="w-full bg-[#f97316] text-white font-black uppercase tracking-widest text-sm py-5 rounded-2xl shadow-[0_8px_20px_rgba(249,115,22,0.3)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Atualizar Perfil
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        <div className="text-center pt-8 space-y-4">
          <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-text-sub uppercase tracking-widest opacity-40">
            <Link to="/termos" className="hover:text-primary transition-colors">Termos de Uso</Link>
            <Link to="/privacidade" className="hover:text-primary transition-colors">Privacidade</Link>
            <Link to="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider opacity-20">Stratis Planner Protocol v3.0.0</p>
        </div>
      </div>
    </div>
    <ProModal 
      isOpen={isProModalOpen} 
      onClose={() => setIsProModalOpen(false)} 
    />
    </>
  );
}
