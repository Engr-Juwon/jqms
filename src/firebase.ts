import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
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
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);

export default app;
