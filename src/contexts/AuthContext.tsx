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
  isBeta: boolean;
  planType: 'free' | 'beta' | 'pro';
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
          console.log("TESTE DEBUG - DB in AuthContext:", db);
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
                userPlan: 'beta',
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
      await sendEmailVerification(res.user);
    } catch (err) {
      console.error("Erro ao enviar email de verificação:", err);
    }

    // Explicitly create the profile doc here to ensure the name is captured
    const userRef = doc(db, 'users', res.user.uid);
    const newProfile: Profile = {
      uid: res.user.uid,
      email: email,
      displayName: name,
      userPlan: 'beta',
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
    const actionCodeSettings = {
      url: `${window.location.origin}/reset-password`,
      handleCodeInApp: false
    };
    return sendPasswordResetEmail(auth, email, actionCodeSettings);
  };

    const plan = profile?.userPlan || 'beta';
    const isSpecialUser = profile?.email === 'onrocha08@gmail.com';
    const effectivePlan = isSpecialUser ? 'pro' : plan;
    const planType = (effectivePlan === 'pro' || effectivePlan === 'monthly' || effectivePlan === 'annual') ? 'pro' : (effectivePlan === 'beta' ? 'beta' : 'free');

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
      isPro: planType === 'pro' || planType === 'beta',
      isBeta: planType === 'beta',
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
