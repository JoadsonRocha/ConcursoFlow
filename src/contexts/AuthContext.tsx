import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, loginWithGoogle, logout, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorUtils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<any>;
  loginEmail: (email: string, pass: string) => Promise<any>;
  signup: (email: string, pass: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
  profile: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          // Fetch or create profile with a timeout to prevent infinite loading loop
          const userRef = doc(db, 'users', user.uid);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout ao conectar com Firestore")), 15000)
          );
          
          const userDoc = await Promise.race([
            getDoc(userRef),
            timeoutPromise
          ]).catch(err => handleFirestoreError(err, OperationType.GET, 'users/' + user.uid)) as any;
          
          if (!userDoc.exists()) {
            const newProfile: any = {
              email: user.email,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              currentContestId: null
            };
            if (user.displayName) newProfile.displayName = user.displayName;
            if (user.photoURL) newProfile.photoURL = user.photoURL;

            await setDoc(userRef, newProfile, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, 'users/' + user.uid));
            setProfile(newProfile);
          } else {
            setProfile(userDoc.data());
          }
        } catch (err) {
          console.error("Erro ao carregar perfil:", err);
          // Permite que o usuário entre mesmo se o perfil falhar, 
          // mas o app pode ter comportamento limitado
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, pass: string, name: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(res.user, { displayName: name });
    
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

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login: loginWithGoogle, 
      loginEmail,
      signup,
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
