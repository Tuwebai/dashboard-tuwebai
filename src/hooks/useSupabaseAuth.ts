import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Función para obtener la URL base correcta según el entorno
const getBaseUrl = () => {
  // En desarrollo, usar localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:8083';
  }
  
  // En producción, usar la URL de Netlify o la URL actual
  return import.meta.env.VITE_PUBLIC_URL || window.location.origin;
};

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        // Verificar que las credenciales de Supabase sean válidas
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Error al obtener sesión inicial:', error);
          if (error.message.includes('Invalid API key')) {
            setError('Error de configuración: Clave API de Supabase inválida');
          } else {
            setError(error.message);
          }
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error: any) {
        console.warn('Error en getInitialSession:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listener para cambios de autenticación
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    } catch (error: any) {
      console.warn('Error al configurar listener de autenticación:', error);
      setError('Error al configurar autenticación');
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getBaseUrl()}/auth/callback`
        }
      });

      if (error) {
        console.warn('Error en autenticación con Google:', error);
        setError(error.message);
        setLoading(false);
      }
    } catch (error: any) {
      console.warn('Error en signInWithGoogle:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const signInWithGithub = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${getBaseUrl()}/auth/callback`
        }
      });

      if (error) {
        console.warn('Error en autenticación con GitHub:', error);
        setError(error.message);
        setLoading(false);
      }
    } catch (error: any) {
      console.warn('Error en signInWithGithub:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.warn('Error en autenticación con email:', error);
        setError(error.message);
        setLoading(false);
      }
    } catch (error: any) {
      console.warn('Error en signInWithEmail:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, metadata?: any) => {
    try {
      setError(null);
      setLoading(true);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) {
        console.warn('Error en registro con email:', error);
        setError(error.message);
        setLoading(false);
      }
    } catch (error: any) {
      console.warn('Error en signUpWithEmail:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Error en logout:', error);
        setError(error.message);
      }
    } catch (error: any) {
      console.warn('Error en signOut:', error);
      setError(error.message);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getBaseUrl()}/auth/reset-password`
      });

      if (error) {
        console.warn('Error en reset password:', error);
        setError(error.message);
        setLoading(false);
      }
    } catch (error: any) {
      console.warn('Error en resetPassword:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const updatePassword = async (password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) {
        console.warn('Error en update password:', error);
        setError(error.message);
      }
    } catch (error: any) {
      console.warn('Error en updatePassword:', error);
      setError(error.message);
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      setError(null);
      const { error } = await supabase.auth.updateUser({
        data: updates
      });
      
      if (error) {
        console.warn('Error en update profile:', error);
        setError(error.message);
      }
    } catch (error: any) {
      console.warn('Error en updateProfile:', error);
      setError(error.message);
    }
  };

  return {
    user,
    session,
    loading,
    error,
    signInWithGoogle,
    signInWithGithub,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    clearError: () => setError(null)
  };
}
