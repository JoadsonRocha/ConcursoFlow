import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db, loginWithGoogle, logout, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorUtils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<any>;
  loginEmail: (email: string, pass: string) => Promise<any>;
  signup: (email: string, pass: string, name: string) => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  logout: () => Promise<void>;
  profile: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          // Listen to profile updates
          const userRef = doc(db, 'users', user.uid);
          
          if (unsubProfile) unsubProfile();
          unsubProfile = onSnapshot(userRef, (userDoc) => {
            if (!userDoc.exists()) {
              const newProfile: any = {
                email: user.email,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                currentContestId: null
              };
              if (user.displayName) newProfile.displayName = user.displayName;
              if (user.photoURL) newProfile.photoURL = user.photoURL;

              setDoc(userRef, newProfile, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, 'users/' + user.uid));
              setProfile(newProfile);
            } else {
              setProfile(userDoc.data());
            }
            setLoading(false); // Set loading false ONLY after profile snapshot is received
          }, (err) => {
             console.error("Erro ao carregar perfil:", err);
             setLoading(false); // Also set false on error to avoid infinite loading
          });
        } catch (err) {
          console.error("Erro ao carregar perfil:", err);
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
    const newProfile = {
      email: email,
      displayName: name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      currentContestId: null
    };
    await setDoc(userRef, newProfile, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, 'users/' + res.user.uid));
    setProfile(newProfile);
    
    return res;
  };

  const loginEmail = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login: loginWithGoogle, 
      loginEmail,
      signup,
      resetPassword,
      logout, 
      profile 
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
