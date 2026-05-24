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
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
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
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BDvuiqC7UGhpS13HspovFt_T7okTNxj0fexcUYz9KkSX4Cer1XQvWyEJsu2qNPQN_to4bozEcYKXQdLANOjWBTg' // Chave Pública do FCM
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
 * Envia um email através da extensão do Resend para o Firebase
 * escrevendo um documento na coleção 'mail'
 */
export const sendEmail = async (to: string | string[], subject: string, html: string, text?: string) => {
  try {
    const mailRef = collection(db, 'mail');
    await addDoc(mailRef, {
      to,
      message: {
        subject,
        html,
        text: text || '',
      }
    });
    console.log('Email enviado para fila de processamento');
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
};
