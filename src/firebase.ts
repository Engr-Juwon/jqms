import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  Firestore,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: "AIzaSyAmOFkhYwjt0IiQzSmtTPkVKuY55bEHB-k",
  authDomain: "benchmark-jescode-2e842.firebaseapp.com",
  databaseURL: "https://benchmark-jescode-2e842-default-rtdb.firebaseio.com",
  projectId: "benchmark-jescode-2e842",
  storageBucket: "benchmark-jescode-2e842.firebasestorage.app",
  messagingSenderId: "402628120535",
  appId: "1:402628120535:web:982d0dae0f68185ee6c592",
  measurementId: "G-WGCKJLW1QJ"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

function createFirestoreInstance(): Firestore {
  if (typeof window === 'undefined') {
    return getFirestore(app);
  }
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // Already initialized (e.g. Vite HMR) or IndexedDB unavailable in private browsing
    return getFirestore(app);
  }
}

export const auth = getAuth(app);
export const firestore = createFirestoreInstance();
export const storage = getStorage(app);
export const rtdb = getDatabase(app);

// Initialize Firebase Analytics for benchmark-jescode-2e842
let analyticsInstance: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analyticsInstance = getAnalytics(app);
    }
  }).catch((err) => {
    console.debug("[Firebase] Analytics initialization skipped:", err);
  });
}

export const getFirebaseAnalytics = () => analyticsInstance;

export default app;
