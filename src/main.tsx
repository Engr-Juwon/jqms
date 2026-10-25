import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { dbService } from './lib/db';
import { useAuthStore } from './stores/useAuthStore';

// Initialize defaults and attach Firebase Auth listener
dbService.initDefaults().then(() => {
  console.log('[JQMS Enterprise] Database & Repositories Initialized');
});

useAuthStore.getState().initAuthListener();

// Auto-reload on deployed chunk hash changes to prevent dynamic import bricking
window.addEventListener("vite:preloadError", (event) => {
  console.warn("[JQMS] Dynamic chunk preload failure detected, auto-reloading page for fresh deployment assets:", event);
  const reloadKey = "jqms_last_chunk_reload";
  const lastReload = Number(sessionStorage.getItem(reloadKey) || "0");
  if (Date.now() - lastReload > 8000) {
    sessionStorage.setItem(reloadKey, String(Date.now()));
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register PWA Service Worker for offline resilience & caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[JQMS PWA] Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.warn('[JQMS PWA] Service Worker registration failed:', err);
      });
  });
}

