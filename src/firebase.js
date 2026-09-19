// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel
} from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBNvCvkpT-HKSivx0iwpXEq6MzL84SX95c",
  authDomain: "devaki-4604c.firebaseapp.com",
  projectId: "devaki-4604c",
  storageBucket: "devaki-4604c.firebasestorage.app",
  messagingSenderId: "497919773896",
  appId: "1:497919773896:web:cf1177293edcc4320b69fd",
  measurementId: "G-NFHC3780DR"
};

// Suppress non-critical SDK backend connection timeout logs
try {
  setLogLevel('error');
} catch (e) {}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services with force long polling & multi-tab offline cache for instant connection
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const rtdb = getDatabase(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export let analytics = null;
if (typeof window !== 'undefined' && navigator.onLine) {
  isSupported().then(supported => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        // Analytics disabled or device offline
      }
    }
  }).catch(() => {});
}

export default app;

