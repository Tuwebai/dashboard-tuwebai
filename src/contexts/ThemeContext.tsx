import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useApp } from './AppContext';
import { userPreferencesService } from '@/lib/userPreferencesService';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useApp();

  // Cargar tema del usuario - SIEMPRE CLARO POR DEFECTO
  useEffect(() => {
    const loadUserTheme = async () => {
      if (isAuthenticated && user) {
        try {
          const userTheme = await userPreferencesService.getUserTheme(user.id);
          // Solo usar el tema del usuario si no es la primera vez
          const hasThemePreference = await userPreferencesService.getUserPreference(user.id, 'theme', 'hasSetTheme');
          if (hasThemePreference) {
            setThemeState(userTheme);
          } else {
            // Primera vez - forzar tema claro
            setThemeState('light');
            await userPreferencesService.saveUserTheme(user.id, 'light');
            await userPreferencesService.saveUserPreference(user.id, 'theme', 'hasSetTheme', true);
          }
        } catch (error) {
          console.error('Error loading user theme:', error);
          // Fallback a tema claro
          setThemeState('light');
        }
      } else {
        // Usuario no autenticado, usar localStorage o tema claro por defecto
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
        if (savedTheme) {
          setThemeState(savedTheme);
        } else {
          // Primera vez - tema claro por defecto
          setThemeState('light');
          localStorage.setItem('theme', 'light');
        }
      }
      setLoading(false);
    };

    loadUserTheme();
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Aplicar tema al documento
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    
    // Guardar en localStorage como fallback
    localStorage.setItem('theme', theme);
    
    // Guardar en base de datos si el usuario está autenticado
    if (isAuthenticated && user && !loading) {
      userPreferencesService.saveUserTheme(user.id, theme).catch(error => {
        console.error('Error saving user theme:', error);
      });
    }
  }, [theme, isAuthenticated, user, loading]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
