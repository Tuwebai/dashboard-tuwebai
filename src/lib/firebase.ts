import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, setPersistence, browserLocalPersistence, connectAuthEmulator } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase usando variables de entorno reales
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Inicializar Firebase
export const app = initializeApp(firebaseConfig);

// Configurar Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Configurar Database
export const db = getDatabase(app);

// Configurar Firestore
export const firestore = getFirestore(app);

// Configurar persistencia de autenticación
setPersistence(auth, browserLocalPersistence);

// Configurar proveedores de autenticación con parámetros optimizados
googleProvider.setCustomParameters({
  prompt: 'select_account',
  // Configuraciones para evitar problemas de CORS
  auth_type: 'reauthenticate'
});

// Configurar Firebase Auth para manejar errores de CORS
if (typeof window !== 'undefined') {
  // Configurar headers para evitar problemas de CORS
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    if (init && typeof input === 'string' && input.includes('firebase')) {
      init.headers = {
        ...init.headers,
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
      };
    }
    return originalFetch.call(this, input, init);
  };
}

// Configurar GitHub provider
githubProvider.setCustomParameters({
  prompt: 'select_account'
});