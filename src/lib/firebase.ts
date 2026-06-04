import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, addDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAnalytics, isSupported, logEvent, setUserId } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
};

// Validate config
if (process.env.NODE_ENV !== 'production') {
  const missingFields = Object.entries(config)
    .filter(([key, value]) => !value && key !== 'measurementId')
    .map(([key]) => key);

  if (missingFields.length > 0) {
    console.warn(`⚠️ Firebase config is missing: ${missingFields.join(', ')}. Certifique-se de que o projeto Firebase foi provisionado.`);
  }
}

const databaseId = firebaseConfig.firestoreDatabaseId;

const app = initializeApp(config);

// Ativar App Check apenas em produção ou se houver chave definida
// Em desenvolvimento, o Firebase possui um debug token que pode ser configurado no console
if (typeof window !== 'undefined') {
  if (import.meta.env.DEV) {
    // Quando definido como true, o Firebase imprimirá um debug token no console do navegador.
    // Esse token deve ser copiado e colado na seção "App Check" > "Apps" do Firebase Console.
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (siteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
  }
}

console.log("Firebase App initialized. Project:", config.projectId, "Database:", databaseId);
export const auth = getAuth(app);
export const db = (databaseId && databaseId !== '(default)') 
  ? getFirestore(app, databaseId) 
  : getFirestore(app);
export const storage = getStorage(app);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
export let analytics: any = null;
if (typeof window !== 'undefined') {
  try {
    isSupported().then((supported) => {
      if (supported) {
        try {
          analytics = getAnalytics(app);
        } catch (e) {
          console.warn("Analytics initialization failed, skipping:", e);
        }
      }
    }).catch((e) => {
      console.warn("Analytics isSupported check blocked (likely by an adblocker):", e);
    });
  } catch (err) {
    console.warn("Analytics initialization block, skipping:", err);
  }
}

export const logPageView = (path: string, title?: string) => {
  if (analytics) {
    logEvent(analytics, 'page_view', {
      page_path: path,
      page_title: title || document.title
    });
  }
};

export const identifyUserForAnalytics = (uid: string) => {
  if (analytics) {
    setUserId(analytics, uid);
  }
};
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile };
export const logout = () => signOut(auth);

// Push Notifications Helpers
export const requestNotificationPermission = async () => {
  if (!messaging) return null;
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers não são suportados neste navegador.');
    return null;
  }
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Usar o Service Worker principal (que agora importa o script do firebase)
      const registration = await navigator.serviceWorker.ready;
      
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BDvuiqC7UGhpS13HspovFt_T7okTNxj0fexcUYz9KkSX4Cer1XQvWyEJsu2qNPQN_to4bozEcYKXQdLANOjWBTg',
        serviceWorkerRegistration: registration
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('Erro ao obter token FCM:', error);
    return null;
  }
};

/**
 * Envia um email enviando uma requisição para o nosso próprio backend,
 * que usa diretamente a SDK do Resend.
 */
export const sendEmail = async (to: string | string[], subject: string, html: string, text?: string) => {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        from: "Stratis Planner <suporte@stratisplanner.com.br>",
        subject,
        html,
        text: text || '',
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.error || 'Erro ao enviar email pela API');
    }

    console.log('Email disparado com sucesso pela API');
    return true;
  } catch (error) {
    console.error('Erro ao enviar email através da API:', error);
    throw error;
  }
};
