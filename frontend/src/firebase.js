import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-hermosa-talita-kumi.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-hermosa-talita-kumi',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-hermosa-talita-kumi.appspot.com',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:demo',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'southamerica-east1');

export const USE_EMULATORS = import.meta.env.VITE_USE_EMULATORS !== 'false';

if (USE_EMULATORS && !globalThis.__HTK_EMULATORS_CONNECTED__) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  globalThis.__HTK_EMULATORS_CONNECTED__ = true;
}

export async function callFn(name, payload = {}) {
  const fn = httpsCallable(functions, name);
  const res = await fn(payload);
  return res.data;
}
