import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  User,
  AuthProvider,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '@/lib/firebase';

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Manejar resultado de redirección
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setUser(result.user);
        }
      } catch (error: any) {
        console.warn('Error en redirección de auth:', error);
        // No mostrar error de CORS como error crítico
        if (!error.message.includes('Cross-Origin-Opener-Policy')) {
          setError(error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    handleRedirectResult();

    // Listener para cambios de autenticación
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithProvider = async (provider: AuthProvider) => {
    try {
      setError(null);
      setLoading(true);
      
      // Usar signInWithRedirect en lugar de signInWithPopup para evitar problemas de CORS
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.warn('Error en autenticación:', error);
      // No mostrar errores de CORS como errores críticos
      if (!error.message.includes('Cross-Origin-Opener-Policy')) {
        setError(error.message);
      }
      setLoading(false);
    }
  };

  const signInWithGoogle = () => signInWithProvider(googleProvider);
  const signInWithGithub = () => signInWithProvider(githubProvider);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.warn('Error en logout:', error);
      setError(error.message);
    }
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithGithub,
    signOut,
    clearError: () => setError(null)
  };
} 