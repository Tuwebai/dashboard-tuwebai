import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { userService } from '@/lib/supabaseService';
import { projectService } from '@/lib/projectService';
import { toast as toastGlobal } from '@/hooks/use-toast';
import { SupabaseError } from '@/components/SupabaseError';

export interface Project {
  id: string;
  name: string;
  description?: string;
  technologies: string[];
  environment_variables?: Record<string, any>;
  status: 'development' | 'production' | 'paused' | 'maintenance';
  github_repository_url?: string;
  customicon?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_active: boolean;
  // Campos extendidos para compatibilidad
  type?: 'Web' | 'App' | 'Landing' | 'Ecommerce' | string;
  funcionalidades?: string[];
  fases?: Array<{
    key: string;
    estado: 'Pendiente' | 'En Progreso' | 'Terminado';
    descripcion?: string;
    fechaEntrega?: string;
    archivos?: Array<{ url: string; name: string }>;
    comentarios?: Array<{
      id: string;
      texto: string;
      autor: string;
      fecha: string;
      tipo: 'admin' | 'cliente';
    }>;
  }>;
  progressHistory?: Array<{ date: string; progress: number }>;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
  // Avatar del usuario
  avatar?: string;
  // Perfil extendido
  phone?: string;
  company?: string;
  position?: string;
  bio?: string;
  location?: string;
  website?: string;
  // Configuración general
  language?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  // Privacidad
  profileVisibility?: string;
  showEmail?: boolean;
  showPhone?: boolean;
  allowAnalytics?: boolean;
  allowCookies?: boolean;
  twoFactorAuth?: boolean;
  // Notificaciones
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  quietHours?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  projectUpdates?: boolean;
  paymentReminders?: boolean;
  supportUpdates?: boolean;
  marketingEmails?: boolean;
  // Rendimiento
  autoSave?: boolean;
  autoSaveInterval?: number;
  cacheEnabled?: boolean;
  imageQuality?: string;
  animationsEnabled?: boolean;
  lowBandwidthMode?: boolean;
  // Seguridad
  sessionTimeout?: number;
  maxLoginAttempts?: number;
  requirePasswordChange?: boolean;
  passwordExpiryDays?: number;
  loginNotifications?: boolean;
  deviceManagement?: boolean;
  // Timestamps
  lastLogin?: string;
}

export interface ProjectLog {
  id: string;
  projectId: string;
  action: string;
  user: string;
  timestamp: string;
}

export interface AppContextType {
  user: User | null;
  projects: Project[];
  isAuthenticated: boolean;
  logs: ProjectLog[];
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithGithub: () => Promise<boolean>;
  logout: () => Promise<void>;
  createProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'ownerEmail'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addFunctionalities: (projectId: string, functionalities: string[]) => Promise<void>;
  addCommentToPhase: (projectId: string, faseKey: string, comment: {
    texto: string;
    autor: string;
    tipo: 'admin' | 'cliente';
  }) => Promise<void>;
  addLog: (log: Omit<ProjectLog, 'id' | 'timestamp'>) => Promise<void>;
  getProjectLogs: (projectId: string) => ProjectLog[];
  refreshData: () => Promise<void>;
  clearError: () => void;
  updateUserSettings: (updates: Partial<User>) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Cache para optimizar consultas
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any, ttl: number = 5 * 60 * 1000) => {
  cache.set(key, { data, timestamp: Date.now(), ttl });
};

const clearCache = () => {
  cache.clear();
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logs, setLogs] = useState<ProjectLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usar el hook de autenticación de Supabase
  const { 
    user: supabaseUser, 
    session, 
    loading: authLoading, 
    error: authError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithGithub,
    signOut,
    clearError: clearAuthError
  } = useSupabaseAuth();

  // Función para limpiar errores
  const clearError = useCallback(() => {
    setError(null);
    clearAuthError();
  }, [clearAuthError]);

  // Función para refrescar datos
  const refreshData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      clearCache();
      
                   // Recargar proyectos usando Supabase
      const response = await projectService.getProjects();
      const projectData = response?.projects || [];
      setProjects(projectData as any);
      
      // Recargar logs (implementar cuando tengas la tabla de logs)
      // const logData = await logService.getUserLogs(user.id);
      // setLogs(logData);
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Error al recargar los datos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Sincronizar usuario de Supabase
  const syncUser = useCallback(async () => {
    if (authLoading) return;
    
    if (supabaseUser && session) {
      try {
        setLoading(true);
        
        // Obtener datos del usuario desde Supabase
        const cacheKey = `user_${supabaseUser.id}`;
        let userData = getCachedData(cacheKey);
        
        if (!userData) {
          try {
            userData = await userService.getUserById(supabaseUser.id);
          } catch (error) {
            console.warn('Error loading user data:', error);
            // Si no existe el usuario en la tabla, crearlo
            const { email, user_metadata } = supabaseUser;
            let role: 'admin' | 'user' = 'user';
            if (email && email.toLowerCase() === 'tuwebai@gmail.com') role = 'admin';
            
            // Obtener avatar del user_metadata
            const avatar = user_metadata?.avatar_url || 
                         user_metadata?.picture || 
                         user_metadata?.photoURL ||
                         user_metadata?.image;
            
            userData = {
              id: supabaseUser.id,
              email: email || '',
              full_name: user_metadata?.full_name || user_metadata?.name || email?.split('@')[0] || '',
              role,
              avatar, // Incluir avatar
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            await userService.upsertUser(userData);
          }
          
          // Guardar en cache por 10 minutos
          setCachedData(cacheKey, userData, 10 * 60 * 1000);
        }
        
        // IMPORTANTE: Sincronizar avatar desde la base de datos
        if (userData && supabaseUser.email) {
          try {
            // Obtener datos actualizados del usuario (incluyendo avatar_url)
            const updatedUserData = await userService.getUserById(supabaseUser.id);
            if (updatedUserData) {
              // Usar el avatar_url de la base de datos si existe
              if (updatedUserData.avatar_url && !userData.avatar) {
                userData.avatar = updatedUserData.avatar_url;
              }
              // Si no hay avatar en DB, sincronizarlo
              else if (!updatedUserData.avatar_url && supabaseUser.email) {
                const { realAvatarService } = await import('@/lib/avatarProviders');
                await realAvatarService.syncUserAvatar(supabaseUser.email);
                
                // Recargar datos del usuario con avatar
                const finalUserData = await userService.getUserById(supabaseUser.id);
                if (finalUserData) {
                  userData = finalUserData;
                  setCachedData(cacheKey, userData, 10 * 60 * 1000);
                }
              }
            }
          } catch (error) {
            console.warn('Error sincronizando avatar:', error);
          }
        }
        
        setUser(userData as User);
        setIsAuthenticated(true);
        setError(null);

        // No mostrar toast aquí - se mostrará después del login exitoso
        
      } catch (error) {
        console.error('Error in auth state change:', error);
        setError('Error de autenticación');
      } finally {
        setLoading(false);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
      setProjects([]);
      setLogs([]);
      clearCache();
      localStorage.removeItem('tuwebai_welcome_back');
      setLoading(false); // ¡AQUÍ ESTABA EL PROBLEMA!
    }
  }, [supabaseUser, session, authLoading]);

  useEffect(() => {
    syncUser();
  }, [syncUser]);

  // Persistir estado de autenticación en localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      localStorage.setItem('tuwebai_auth', JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
        timestamp: Date.now()
      }));
    } else {
      localStorage.removeItem('tuwebai_auth');
    }
  }, [isAuthenticated, user]);

  // Cargar proyectos desde Supabase
  const setupListeners = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLogs([]);
      return;
    }
    
    try {
      setLoading(true);
      
      // FORZAR RECARGA DESDE LA BASE DE DATOS
      console.log('🔄 FORZANDO recarga de proyectos desde la base de datos...');
      const response = await projectService.getProjects();
      const projectData = response?.projects || [];
      
      console.log('📊 Proyectos cargados desde BD:', projectData.length);
      console.log('✅ Proyectos con created_by:', projectData.filter(p => p.created_by).length);
      console.log('❌ Proyectos sin created_by:', projectData.filter(p => !p.created_by).length);
      
      // Mostrar detalles de cada proyecto
      projectData.forEach(project => {
        console.log(`Proyecto ${project.id}: created_by = ${project.created_by || 'NULL'}`);
      });
      
      setProjects(projectData as any);
      
      // Cache de proyectos
      setCachedData(`projects_${user.email}`, projectData, 2 * 60 * 1000);
      
      // Por ahora no usamos suscripciones en tiempo real para evitar errores
      // TODO: Implementar suscripciones cuando sea necesario
      
    } catch (error) {
      console.warn('Error configurando listeners de Supabase:', error);
      setError('Error de conexión');
      setProjects([]);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setupListeners();
    }
    
    return () => {
      // Cleanup si es necesario en el futuro
      // if (subscription) {
      //   subscription.unsubscribe();
      // }
    };
  }, [user?.id, setupListeners]);

  // Login optimizado con manejo de errores mejorado
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await signInWithEmail(email, password);
      
      // Solo mostrar toast de bienvenida si el login fue exitoso
      if (result) {
        // Esperar un momento para que se complete la autenticación
        setTimeout(() => {
          toastGlobal({
            title: '¡Bienvenido!',
            description: 'Has iniciado sesión correctamente.'
          });
        }, 500);
      }
      
      return result;
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Error al iniciar sesión');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register optimizado
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await signUpWithEmail(email, password, { full_name: name });
      return true;
    } catch (error: any) {
      console.error('Register error:', error);
      setError('Error al registrar usuario');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login con Google
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await signInWithGoogle();
      
      // Solo mostrar toast de bienvenida si el login fue exitoso
      if (result) {
        // Esperar un momento para que se complete la autenticación
        setTimeout(() => {
          toastGlobal({
            title: '¡Bienvenido!',
            description: 'Has iniciado sesión correctamente con Google.'
          });
        }, 500);
      }
      
      return result;
    } catch (error: any) {
      console.error('Google login error:', error);
      setError('Error al iniciar sesión con Google');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login con GitHub
  const loginWithGithub = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await signInWithGithub();
      
      // Solo mostrar toast de bienvenida si el login fue exitoso
      if (result) {
        // Esperar un momento para que se complete la autenticación
        setTimeout(() => {
          toastGlobal({
            title: '¡Bienvenido!',
            description: 'Has iniciado sesión correctamente con GitHub.'
          });
        }, 500);
      }
      
      return result;
    } catch (error: any) {
      console.error('GitHub login error:', error);
      setError('Error al iniciar sesión con GitHub');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout optimizado
  const logout = async () => {
    try {
      setLoading(true);
      await signOut();
      clearCache();
      localStorage.removeItem('tuwebai_welcome_back');
    } catch (error) {
      console.error('Logout error:', error);
      setError('Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Crear proyecto optimizado
  const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'ownerEmail'>) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const newProject = {
        ...projectData,
        created_by: user.id,
        status: 'development' as const,
        technologies: projectData.technologies || []
      };
      
      // Crear el proyecto en la base de datos
      const createdProject = await projectService.createProject(newProject);
      
      // Actualizar el estado local inmediatamente
      if (createdProject) {
        setProjects(prevProjects => [...prevProjects, createdProject]);
      }
      
      // Limpiar cache de proyectos
      cache.delete(`projects_${user.email}`);
      
    } catch (error) {
      console.error('Create project error:', error);
      setError('Error al crear el proyecto');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar proyecto optimizado
  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener el proyecto actual para comparar progreso
      const currentProject = await projectService.getProjectById(id);
      let progressHistory = (currentProject as any).progressHistory || [];
      let prevProgress = 0;
      
      // Calcular progreso anterior
      if ((currentProject as any).fases && (currentProject as any).fases.length > 0) {
        const completed = (currentProject as any).fases.filter((f: any) => f.estado === 'Terminado').length;
        prevProgress = Math.round((completed / (currentProject as any).fases.length) * 100);
      }
      
      // Calcular nuevo progreso si fases cambian
      let newProgress = prevProgress;
      if ((updates as any).fases && (updates as any).fases.length > 0) {
        const completed = (updates as any).fases.filter((f: any) => f.estado === 'Terminado').length;
        newProgress = Math.round((completed / (updates as any).fases.length) * 100);
      }
      
      // Si el progreso cambió, agrega snapshot diario
      const today = new Date().toISOString().slice(0, 10);
      if (newProgress !== prevProgress) {
        // Si ya hay snapshot de hoy, reemplaza, si no, agrega
        const idx = progressHistory.findIndex((h: any) => h.date === today);
        if (idx >= 0) {
          progressHistory[idx] = { date: today, progress: newProgress };
        } else {
          progressHistory.push({ date: today, progress: newProgress });
        }
      }
      
             await projectService.updateProject(id, {
         ...updates,
         progressHistory
       } as any);
      
      if (user) {
        cache.delete(`projects_${user.email}`);
      }
    } catch (error) {
      console.error('Update project error:', error);
      setError('Error al actualizar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar proyecto optimizado
  const deleteProject = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await projectService.deleteProject(id);
      
      // Limpiar cache de proyectos
      if (user) {
        cache.delete(`projects_${user.email}`);
      }
      
    } catch (error) {
      console.error('Delete project error:', error);
      setError('Error al eliminar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  // Agregar funcionalidades optimizado
  const addFunctionalities = async (projectId: string, functionalities: string[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentProject = await projectService.getProjectById(projectId);
      const currentFuncionalidades = (currentProject as any).funcionalidades || [];
      const updatedFuncionalidades = [...currentFuncionalidades, ...functionalities];
      
             await projectService.updateProject(projectId, {
         funcionalidades: updatedFuncionalidades
       } as any);
      
      // Limpiar cache de proyectos
      if (user) {
        cache.delete(`projects_${user.email}`);
      }
      
    } catch (error) {
      console.error('Add functionalities error:', error);
      setError('Error al agregar funcionalidades');
    } finally {
      setLoading(false);
    }
  };

  // Agregar comentario a fase optimizado
  const addCommentToPhase = async (projectId: string, faseKey: string, comment: {
    texto: string;
    autor: string;
    tipo: 'admin' | 'cliente';
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentProject = await projectService.getProjectById(projectId);
      const fases = (currentProject as any).fases || [];
      
      const updatedFases = fases.map((fase: any) => {
        if (fase.key === faseKey) {
          const comentarios = fase.comentarios || [];
          const newComment = {
            id: Date.now().toString(),
            ...comment,
            fecha: new Date().toISOString()
          };
          return {
            ...fase,
            comentarios: [...comentarios, newComment]
          };
        }
        return fase;
      });
      
             await projectService.updateProject(projectId, {
         fases: updatedFases
       } as any);
      
      // Limpiar cache de proyectos
      if (user) {
        cache.delete(`projects_${user.email}`);
      }
      
    } catch (error) {
      console.error('Add comment error:', error);
      setError('Error al agregar comentario');
    } finally {
      setLoading(false);
    }
  };

  // Agregar log optimizado
  const addLog = async (log: Omit<ProjectLog, 'id' | 'timestamp'>) => {
    try {
      // Implementar cuando tengas la tabla de logs en Supabase
              // Log functionality to be implemented with Supabase logs table
      
      // Limpiar cache de logs
      if (user) {
        cache.delete(`logs_${user.email}`);
      }
      
    } catch (error) {
      console.error('Add log error:', error);
      // No mostrar error para logs ya que no es crítico
    }
  };

  // Obtener logs de proyecto optimizado con cache
  const getProjectLogs = useCallback((projectId: string) => {
    const cacheKey = `project_logs_${projectId}`;
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const projectLogs = logs.filter(l => l.projectId === projectId);
    setCachedData(cacheKey, projectLogs, 5 * 60 * 1000); // 5 minutos
    
    return projectLogs;
  }, [logs]);

  // Actualizar configuración del usuario y sincronizar contexto
  const updateUserSettings = async (updates: Partial<User>) => {
    if (!user) return false;
    setLoading(true);
    try {
      await userService.updateUser(user.id, { ...updates, updated_at: new Date().toISOString() });
      setUser(prev => (prev ? { ...prev, ...updates } : prev));
      setCachedData(`user_${user.id}`, { ...user, ...updates }, 10 * 60 * 1000);
      return true;
    } catch (error) {
      console.error('Error al actualizar configuración de usuario:', error);
      setError('Error al actualizar configuración');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Memoizar el contexto para evitar re-renders innecesarios
  const contextValue = useMemo(() => ({
      user,
      projects,
      isAuthenticated,
      logs,
      loading,
      error,
      login,
      register,
      loginWithGoogle,
      loginWithGithub,
      logout,
      createProject,
      updateProject,
      deleteProject,
      addFunctionalities,
      addCommentToPhase,
      addLog,
      getProjectLogs,
      refreshData,
      clearError,
      updateUserSettings
  }), [
    user,
    projects,
    isAuthenticated,
    logs,
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    loginWithGithub,
    logout,
    createProject,
    updateProject,
    deleteProject,
    addFunctionalities,
    addCommentToPhase,
    addLog,
    getProjectLogs,
    refreshData,
    clearError,
    updateUserSettings
  ]);



  // Mostrar error de configuración si hay un error crítico
  if (error && (error.includes('Invalid API key') || error.includes('Clave API de Supabase inválida') || error.includes('Error de configuración'))) {
    return (
      <SupabaseError 
        error={error} 
        onRetry={() => {
          clearError();
          window.location.reload();
        }}
      />
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    console.error('useApp must be used within an AppProvider');
    // Retornar un contexto por defecto en lugar de lanzar error
    return {
      user: null,
      projects: [],
      isAuthenticated: false,
      logs: [],
      loading: true,
      error: 'Contexto no disponible',
      login: async () => false,
      register: async () => false,
      loginWithGoogle: async () => false,
      loginWithGithub: async () => false,
      logout: async () => {},
      createProject: async () => {},
      updateProject: async () => {},
      deleteProject: async () => {},
      addFunctionalities: async () => {},
      addCommentToPhase: async () => {},
      addLog: async () => {},
      getProjectLogs: () => [],
      refreshData: async () => {},
      clearError: () => {},
      updateUserSettings: async () => false
    };
  }
  return context;
}
