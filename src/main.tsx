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

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
