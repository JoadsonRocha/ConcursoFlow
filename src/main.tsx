import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { Toaster } from 'sonner';
// Check and remove old service workers to clear aggressive caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister()
    } 
  });
}

import { registerSW } from 'virtual:pwa-register';
import './index.css';

// Automatically register service worker
const updateSW = registerSW({
  onNeedRefresh() {
    // Show a prompt to user if needed
  },
  onOfflineReady() {
    // Show a ready to work offline message
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
);
