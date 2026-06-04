import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
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
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
