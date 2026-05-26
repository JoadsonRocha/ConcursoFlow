// Scripts para o Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// O Firebase Messaging precisa das mesmas configurações do App
firebase.initializeApp({
  apiKey: "AIzaSyANWdIvng5P-cf9Tpi7P4AbNSk9qscf2y4",
  authDomain: "gen-lang-client-0925764429.firebaseapp.com",
  projectId: "gen-lang-client-0925764429",
  storageBucket: "gen-lang-client-0925764429.firebasestorage.app",
  messagingSenderId: "684995404002",
  appId: "1:684995404002:web:e71faf4f0cb7fc0110febb"
});

const messaging = firebase.messaging();

// Escutar mensagens em background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensagem recebida em background: ', payload);
  if (!payload) return;

  const title = payload.notification?.title || payload.data?.title || 'Stratis Planner';
  const body = payload.notification?.body || payload.data?.body || '';
  const icon = '/logo_pwa.png';
  const image = payload.notification?.image || payload.data?.image;

  const notificationOptions = {
    body: body,
    icon: icon,
    image: image,
    badge: '/logo_pwa.png',
    data: payload.data || {}
  };

  self.registration.showNotification(title, notificationOptions);
});
