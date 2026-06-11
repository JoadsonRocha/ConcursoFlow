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
  const body = payload.notification?.body || payload.data?.body || 'Você tem uma nova atualização.';
  const icon = '/logo_pwa.png';
  const image = payload.notification?.image || payload.data?.image;
  const clickAction = payload.data?.click_action || '/';

  const notificationOptions = {
    body: body,
    icon: icon,
    image: image,
    badge: '/logo_pwa.png',
    tag: 'stratis-notification', // Evita múltiplas notificações iguais entupindo o celular
    renotify: true, // Vibra/soa mesmo se já existir uma notificação com a mesma tag
    vibrate: [200, 100, 200],
    data: {
      ...payload.data,
      url: clickAction
    }
  };

  self.registration.showNotification(title, notificationOptions);
});

// Lógica para quando o usuário clica na notificação no celular
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se já houver uma aba aberta, foca nela e navega
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(new URL(self.location.origin).hostname) && 'focus' in client) {
          return client.focus().then((focusedClient) => {
            if ('navigate' in focusedClient) {
              return focusedClient.navigate(urlToOpen);
            }
          });
        }
      }
      // Caso contrário, abre uma nova aba
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
