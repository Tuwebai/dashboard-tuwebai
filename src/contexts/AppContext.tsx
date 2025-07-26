import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { firestore } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  addDoc,
  getDocs,
  orderBy,
  serverTimestamp,
  getDoc,
  limit,
  startAfter,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser, updateProfile, signInWithPopup, GoogleAuthProvider, AuthProvider } from 'firebase/auth';
import { initializeChatData, initializeCommentsData, initializeTasksData, initializeAdminSystemData, cleanSimulatedData } from '@/utils/initializeData';
import { toast as toastGlobal } from '@/hooks/use-toast';

export interface Project {
  id: string;
  name: string;
  description: string;
  type: 'Web' | 'App' | 'Landing' | 'Ecommerce' | string;
  funcionalidades: string[];
  createdAt: string;
  updatedAt: string;
  ownerEmail: string;
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
  uid?: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  photoURL?: string;
  // Perfil
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
  createdAt?: string;
  updatedAt?: string;
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
  loginWithProvider: (provider: AuthProvider) => Promise<boolean>;
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

  // Función para limpiar errores
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Función para refrescar datos
  const refreshData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      clearCache();
      
      // Recargar proyectos
      const projectsRef = collection(firestore, 'projects');
      const qProjects = user.role === 'admin'
        ? query(projectsRef, limit(50))
        : query(projectsRef, where('ownerEmail', '==', user.email), limit(50));
      const projectsSnap = await getDocs(qProjects);
      const projectData = projectsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Project);
      setProjects(projectData);
      
      // Recargar logs
      const logsRef = collection(firestore, 'logs');
      const qLogs = query(logsRef, where('user', '==', user.email), orderBy('timestamp', 'desc'));
      const logsSnap = await getDocs(qLogs);
      const logData = logsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as ProjectLog);
      setLogs(logData);
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Error al recargar los datos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Sincronizar usuario real de Firebase Auth con optimizaciones
  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true);
        
        if (firebaseUser) {
          const { displayName, email, photoURL, uid } = firebaseUser;
          let role: 'admin' | 'user' = 'user';
          if (email && email.toLowerCase() === 'tuwebai@gmail.com') role = 'admin';
          
          // Intentar obtener datos del usuario desde cache primero
          const cacheKey = `user_${uid}`;
          let userData = getCachedData(cacheKey);
          
          if (!userData) {
            // Si no está en cache, obtener desde Firestore
            try {
              const userRef = doc(firestore, 'users', uid);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                userData = userSnap.data() as User;
              } else {
                // Crear usuario si no existe
                userData = { 
                  uid,
                  name: displayName || email?.split('@')[0] || '', 
                  email: email || '', 
                  role, 
                  photoURL,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                
                await setDoc(userRef, userData);
              }
              
              // Guardar en cache por 10 minutos
              setCachedData(cacheKey, userData, 10 * 60 * 1000);
            } catch (error) {
              console.warn('Error loading user data:', error);
              userData = { 
                uid,
                name: displayName || email?.split('@')[0] || '', 
                email: email || '', 
                role, 
                photoURL 
              };
            }
          }
          
          setUser(userData);
      setIsAuthenticated(true);
          setError(null);

          // Mostrar toast de bienvenida solo una vez por sesión
          if (!localStorage.getItem('tuwebai_welcome_back')) {
            toastGlobal({
              title: '¡Bienvenido de nuevo!',
              description: 'Tu sesión sigue activa. Puedes continuar gestionando tus proyectos.'
            });
            localStorage.setItem('tuwebai_welcome_back', '1');
          }

          // Inicializar datos del admin si el usuario es admin
          if (userData.role === 'admin') {
            await initializeAdminSystemData(userData.email);
          }
          
          // Limpiar datos simulados si es admin
          if (role === 'admin') {
            await cleanSimulatedData();
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setProjects([]);
          setLogs([]);
          clearCache();
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setError('Error de autenticación');
      } finally {
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Persistir estado de autenticación en localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      localStorage.setItem('tuwebai_auth', JSON.stringify({
        uid: user.uid,
        email: user.email,
        role: user.role,
        timestamp: Date.now()
      }));
    } else {
      localStorage.removeItem('tuwebai_auth');
    }
  }, [isAuthenticated, user]);

  // Restaurar estado de autenticación al cargar la app
  useEffect(() => {
    const savedAuth = localStorage.getItem('tuwebai_auth');
    if (savedAuth && !isAuthenticated) {
      try {
        const authData = JSON.parse(savedAuth);
        const now = Date.now();
        const authAge = now - authData.timestamp;
        
        // Si la sesión tiene menos de 24 horas, mantenerla
        if (authAge < 24 * 60 * 60 * 1000) {
          // No hacer nada aquí, dejar que Firebase Auth maneje la restauración
          // Esto solo es para mantener el estado mientras Firebase se inicializa
        } else {
          // Sesión expirada, limpiar
          localStorage.removeItem('tuwebai_auth');
        }
      } catch (error) {
        console.warn('Error parsing saved auth:', error);
        localStorage.removeItem('tuwebai_auth');
      }
    }
  }, [isAuthenticated]);

  // Cargar proyectos y logs desde Firestore con optimizaciones
  useEffect(() => {
    if (!firestore || !user) {
      setProjects([]);
      setLogs([]);
      return;
    }
    
    let unsubProjects: (() => void) | undefined;
    let unsubLogs: (() => void) | undefined;
    
    const setupListeners = async () => {
      try {
        setLoading(true);
        
        // Query optimizada para proyectos con límite y ordenamiento
        const projectsRef = collection(firestore, 'projects');
        const qProjects = user.role === 'admin'
          ? query(projectsRef, limit(50))
          : query(
            projectsRef, 
            where('ownerEmail', '==', user.email),
            limit(50) // Limitar a 50 proyectos para mejor rendimiento
          );
        
        unsubProjects = onSnapshot(qProjects, (snapshot) => {
          try {
            const projectData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Project);
            setProjects(projectData);
            
            // Cache de proyectos
            setCachedData(`projects_${user.email}`, projectData, 2 * 60 * 1000);
          } catch (error) {
            console.warn('Error procesando proyectos:', error);
            setProjects([]);
          }
        }, (error) => {
          console.warn('Error cargando proyectos:', error);
          setError('Error al cargar proyectos');
          setProjects([]);
        });
        
        // Query optimizada para logs con límite
        const logsRef = collection(firestore, 'logs');
        const qLogs = query(
          logsRef, 
          where('user', '==', user.email), 
          limit(100) // Limitar a 100 logs
        );
        
        unsubLogs = onSnapshot(qLogs, (snapshot) => {
          try {
            const logData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as ProjectLog);
            setLogs(logData);
            
            // Cache de logs
            setCachedData(`logs_${user.email}`, logData, 2 * 60 * 1000);
          } catch (error) {
            console.warn('Error procesando logs:', error);
            setLogs([]);
          }
        }, (error) => {
          console.warn('Error cargando logs:', error);
          setError('Error al cargar logs');
          setLogs([]);
        });
        
      } catch (error) {
        console.warn('Error configurando listeners de Firestore:', error);
        setError('Error de conexión');
        setProjects([]);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    
    setupListeners();
    
    return () => {
      if (unsubProjects) unsubProjects();
      if (unsubLogs) unsubLogs();
    };
  }, [user]);

  // Login optimizado con manejo de errores mejorado
  const login = async (email: string, password: string): Promise<boolean> => {
    if (!auth) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      await signInWithEmailAndPassword(auth, email, password);
      
      // Actualizar último login
      if (auth.currentUser) {
        const userRef = doc(firestore, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          lastLogin: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Error al iniciar sesión';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuario no encontrado';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Contraseña incorrecta';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos. Intenta más tarde';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión. Verifica tu internet';
          break;
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register optimizado
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    if (!auth || !firestore) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user: firebaseUser } = userCredential;
      
      // Actualizar perfil
      await updateProfile(firebaseUser, { displayName: name });
      
      // Guardar en Firestore
      const userRef = doc(firestore, 'users', firebaseUser.uid);
      const userData = {
        uid: firebaseUser.uid,
        name,
        email,
        role: 'user' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userRef, userData);
      
      return true;
    } catch (error: any) {
      console.error('Register error:', error);
      
      let errorMessage = 'Error al registrar usuario';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'El email ya está registrado';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña es muy débil';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
      }
      
      setError(errorMessage);
    return false;
    } finally {
      setLoading(false);
    }
  };

  // Login con proveedor optimizado
  const loginWithProvider = async (provider: AuthProvider): Promise<boolean> => {
    if (!auth || !firestore) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      // Usar signInWithPopup con manejo de errores mejorado
      const result = await signInWithPopup(auth, provider);
      const { user: firebaseUser } = result;
      
      // Guardar en Firestore si es nuevo usuario
      const userRef = doc(firestore, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const userData = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
          email: firebaseUser.email || '',
          role: 'user' as const,
          photoURL: firebaseUser.photoURL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await setDoc(userRef, userData);
        
        // Inicializar datos para el nuevo usuario
        if (firebaseUser.email) {
          await initializeChatData(firebaseUser.email);
        }
      } else {
        // Actualizar último login
        await updateDoc(userRef, {
          lastLogin: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      return true;
    } catch (error: any) {
      console.warn('Provider login error:', error);
      
      // No mostrar errores de CORS como errores críticos
      if (error.message && error.message.includes('Cross-Origin-Opener-Policy')) {
        console.warn('Error de CORS detectado, pero el login puede haber sido exitoso');
        return true; // No mostrar como error
      }
      
      // Manejar errores específicos de Firestore
      if (error.code === 'permission-denied') {
        console.warn('Error de permisos de Firestore, pero el login puede haber sido exitoso');
        return true; // No mostrar como error crítico
      }
      
      let errorMessage = 'Error al iniciar sesión';
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Inicio de sesión cancelado';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup bloqueado. Permite popups para este sitio';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'Ya existe una cuenta con este email';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión. Verifica tu internet';
          break;
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout optimizado
  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
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
    if (!firestore || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const projectRef = collection(firestore, 'projects');
      const newProject = {
      ...projectData,
      ownerEmail: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(projectRef, newProject);
      
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
    if (!firestore) return;
    try {
      setLoading(true);
      setError(null);
      const projectRef = doc(firestore, 'projects', id);
      // Obtener el proyecto actual para comparar progreso
      const projectSnap = await getDoc(projectRef);
      let progressHistory = [];
      let prevProgress = 0;
      if (projectSnap.exists()) {
        const projectData = projectSnap.data();
        progressHistory = projectData.progressHistory || [];
        // Calcular progreso anterior
        if (projectData.fases && projectData.fases.length > 0) {
          const completed = projectData.fases.filter((f: any) => f.estado === 'Terminado').length;
          prevProgress = Math.round((completed / projectData.fases.length) * 100);
        }
      }
      // Calcular nuevo progreso si fases cambian
      let newProgress = prevProgress;
      if (updates.fases && updates.fases.length > 0) {
        const completed = updates.fases.filter((f: any) => f.estado === 'Terminado').length;
        newProgress = Math.round((completed / updates.fases.length) * 100);
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
      await updateDoc(projectRef, {
        ...updates,
        progressHistory,
        updatedAt: serverTimestamp()
      });
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
    if (!firestore) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const projectRef = doc(firestore, 'projects', id);
      await deleteDoc(projectRef);
      
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
    if (!firestore) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const projectRef = doc(firestore, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (projectSnap.exists()) {
        const currentFuncionalidades = projectSnap.data().funcionalidades || [];
        const updatedFuncionalidades = [...currentFuncionalidades, ...functionalities];
        
        await updateDoc(projectRef, {
          funcionalidades: updatedFuncionalidades,
          updatedAt: serverTimestamp()
        });
        
        // Limpiar cache de proyectos
        if (user) {
          cache.delete(`projects_${user.email}`);
        }
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
    if (!firestore) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const projectRef = doc(firestore, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (projectSnap.exists()) {
        const projectData = projectSnap.data();
        const fases = projectData.fases || [];
        
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
        
        await updateDoc(projectRef, {
          fases: updatedFases,
          updatedAt: serverTimestamp()
        });
        
        // Limpiar cache de proyectos
        if (user) {
          cache.delete(`projects_${user.email}`);
        }
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
    if (!firestore) return;
    
    try {
      const logsRef = collection(firestore, 'logs');
      const newLog = {
        ...log,
        timestamp: serverTimestamp()
      };
      
      await addDoc(logsRef, newLog);
      
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
    if (!user || !firestore) return false;
    setLoading(true);
    try {
      const userRef = doc(firestore, 'users', user.uid!);
      await updateDoc(userRef, { ...updates, updatedAt: new Date().toISOString() });
      setUser(prev => (prev ? { ...prev, ...updates } : prev));
      setCachedData(`user_${user.uid}`, { ...user, ...updates }, 10 * 60 * 1000);
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
      loginWithProvider,
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
    loginWithProvider,
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

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}