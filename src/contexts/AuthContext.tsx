import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db, loginWithGoogle, logout, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, identifyUserForAnalytics } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorUtils';
import { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<any>;
  loginEmail: (email: string, pass: string) => Promise<any>;
  signup: (email: string, pass: string, name: string) => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  logout: () => Promise<void>;
  profile: Profile | null;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  isPro: boolean;
  planType: 'free' | 'pro';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const checkMonthlyReset = async (userUid: string, currentProfile: Profile) => {
    // Moved to backend for security
  };

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        identifyUserForAnalytics(user.uid);
        try {
          const userRef = doc(db, 'users', user.uid);
          
          if (unsubProfile) unsubProfile();
          unsubProfile = onSnapshot(userRef, async (userDoc) => {
            if (!userDoc.exists()) {
              const newProfile: any = {
                uid: user.uid,
                email: user.email,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                currentContestId: null,
                tourCompleted: false,
                userPlan: 'free',
                lastUsageReset: serverTimestamp(),
                summaryUsage: 0,
                flashcardUsage: 0,
                mindmapUsage: 0,
                importUsage: 0
              };
              if (user.displayName) newProfile.displayName = user.displayName;
              if (user.photoURL) newProfile.photoURL = user.photoURL;

              try {
                await setDoc(userRef, newProfile, { merge: true });
                setProfile(newProfile);
              } catch (err) {
                console.error("Erro ao criar perfil inicial:", err);
                setProfile(newProfile);
                handleFirestoreError(err, OperationType.WRITE, 'users/' + user.uid);
              }
            } else {
              const data = userDoc.data() as Profile;
              // Sincronização resiliente de foto de perfil e nome de forma automática
              let needsUpdate = false;
              const updateData: any = {};
              if (!data.photoURL && user.photoURL) {
                updateData.photoURL = user.photoURL;
                data.photoURL = user.photoURL;
                needsUpdate = true;
              }
              if (!data.displayName && user.displayName) {
                updateData.displayName = user.displayName;
                data.displayName = user.displayName;
                needsUpdate = true;
              }
              if (needsUpdate) {
                updateDoc(userRef, updateData).catch(e => console.warn("Erro ao auto-sincronizar foto/nome no firestore:", e));
              }
              setProfile(data);
              // Background check for reset
              checkMonthlyReset(user.uid, data);
            }
            setLoading(false); 
          }, (err) => {
             console.error("Erro no observador de perfil:", err);
             setLoading(false); 
          });
        } catch (err) {
          console.error("Erro na inicialização do perfil:", err);
          setLoading(false);
        }
      } else {
        if (unsubProfile) unsubProfile();
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubProfile) unsubProfile();
      unsubscribe();
    };
  }, []);

  const updateProfileData = async (data: Partial<Profile>) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  };

  const signup = async (email: string, pass: string, name: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(res.user, { displayName: name });
    
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!response.ok) {
        // Fallback
        await sendEmailVerification(res.user);
      }
    } catch (err) {
      console.error("Erro ao enviar email de verificação pela API (fallback acionado):", err);
      try {
        await sendEmailVerification(res.user);
      } catch (e) {
        console.error("Erro ao enviar email de verificação:", e);
      }
    }

    // Explicitly create the profile doc here to ensure the name is captured
    const userRef = doc(db, 'users', res.user.uid);
    const newProfile: Profile = {
      uid: res.user.uid,
      email: email,
      displayName: name,
      userPlan: 'free',
      termsAccepted: true,
      privacyAccepted: true,
      consentDate: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      currentContestId: null,
      tourCompleted: false,
      lastUsageReset: serverTimestamp(),
      summaryUsage: 0,
      flashcardUsage: 0,
      mindmapUsage: 0,
      importUsage: 0
    };
    await setDoc(userRef, newProfile, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, 'users/' + res.user.uid));
    setProfile(newProfile);
    
    return res;
  };

  const loginEmail = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const resetPassword = async (email: string) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao redefinir a senha');
      }
      return data;
    } catch (err) {
      console.error('Erro no resetPassword:', err);
      // Fallback para o modo tradicional se a API falhar ou backend estiver offline
      return sendPasswordResetEmail(auth, email);
    }
  };

    const userEmail = (profile?.email || user?.email || '').toLowerCase().trim();
    const isSpecialUser = ['onrocha08@gmail.com'].includes(userEmail);
    
    let effectivePlan: 'free' | 'pro' = 'free';
    if (isSpecialUser) {
      effectivePlan = 'pro';
    } else if (profile?.userPlan) {
      const p = profile.userPlan;
      if (p === 'monthly' || p === 'annual' || p === 'pro' || p === 'beta') {
        effectivePlan = 'pro';
      }
    }
    const planType = effectivePlan;

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login: loginWithGoogle, 
      loginEmail,
      signup,
      resetPassword,
      logout, 
      profile,
      updateProfile: updateProfileData,
      isPro: planType === 'pro',
      planType
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
