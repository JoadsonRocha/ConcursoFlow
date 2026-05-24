// Scripts para o Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// O Firebase Messaging precisa das mesmas configurações do App
// Em produção, isso pode ser preenchido via script de build ou injetado
firebase.initializeApp({
  apiKey: "API_KEY_PLACEHOLDER",
  authDomain: "AUTH_DOMAIN_PLACEHOLDER",
  projectId: "PROJECT_ID_PLACEHOLDER",
  storageBucket: "STORAGE_BUCKET_PLACEHOLDER",
  messagingSenderId: "SENDER_ID_PLACEHOLDER",
  appId: "APP_ID_PLACEHOLDER"
});

const messaging = firebase.messaging();

// Escutar mensagens em background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensagem recebida em background: ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png' || payload.notification.image,
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
