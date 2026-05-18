import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from 'sonner';
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
        <Analytics />
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
);
