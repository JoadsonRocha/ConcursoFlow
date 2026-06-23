import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { Toaster } from 'sonner';

import { registerSW } from 'virtual:pwa-register';
import './index.css';

// Polyfill for older browsers/mobile devices (e.g., Promise.withResolvers is used by modern pdfjs-dist)
if (typeof (Promise as any).withResolvers === "undefined") {
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

// Automatically register service worker
let updateSW: any;
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    // Don't register if we are in an iframe to avoid sandbox security errors
    const isIframe = window.self !== window.top;
    if (!isIframe) {
      updateSW = registerSW({
        onNeedRefresh() {
          // Show a prompt to user if needed
        },
        onOfflineReady() {
          // Show a ready to work offline message
        },
      });
    } else {
      console.log("[PWA] Service Worker registration skipped inside iframe sandbox.");
    }
  } catch (err) {
    console.warn("[PWA] Service Worker registration failed:", err);
  }
}

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
