import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // Selector CSS del elemento objetivo
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'scroll' | 'wait';
  actionText?: string;
  skipable?: boolean;
  required?: boolean;
  videoUrl?: string;
  imageUrl?: string;
  tips?: string[];
  nextStep?: string;
  prevStep?: string;
}

export interface TutorialFlow {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'onboarding' | 'feature' | 'advanced' | 'troubleshooting';
  steps: TutorialStep[];
  estimatedTime: number; // en minutos
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  completionReward?: string;
}

export interface TutorialProgress {
  flowId: string;
  currentStep: number;
  completedSteps: string[];
  startedAt: string;
  completedAt?: string;
  skippedSteps: string[];
  timeSpent: number; // en segundos
}

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  lastUpdated: string;
  author: string;
  views: number;
  helpful: number;
  notHelpful: number;
  relatedArticles: string[];
  videoTutorial?: string;
  screenshots?: string[];
}

// =====================================================
// CONTEXTO
// =====================================================

interface TutorialContextType {
  // Estado del tutorial
  isActive: boolean;
  currentFlow: TutorialFlow | null;
  currentStep: TutorialStep | null;
  stepIndex: number;
  progress: TutorialProgress | null;
  
  // Flujos de tutorial
  availableFlows: TutorialFlow[];
  completedFlows: string[];
  
  // Artículos de ayuda
  helpArticles: HelpArticle[];
  searchQuery: string;
  filteredArticles: HelpArticle[];
  
  // Acciones
  startTutorial: (flowId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipStep: () => void;
  completeTutorial: () => void;
  exitTutorial: () => void;
  searchHelp: (query: string) => void;
  markArticleHelpful: (articleId: string, helpful: boolean) => void;
  getContextualHelp: (context: string) => HelpArticle[];
  
  // Configuración
  autoStart: boolean;
  showHints: boolean;
  enableSounds: boolean;
  setAutoStart: (enabled: boolean) => void;
  setShowHints: (enabled: boolean) => void;
  setEnableSounds: (enabled: boolean) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

// =====================================================
// FLUJOS DE TUTORIAL PREDEFINIDOS
// =====================================================

const TUTORIAL_FLOWS: TutorialFlow[] = [
  {
    id: 'welcome-tour',
    name: 'Tour de Bienvenida',
    description: 'Conoce las funcionalidades principales del dashboard',
    icon: '🎯',
    category: 'onboarding',
    estimatedTime: 5,
    difficulty: 'beginner',
    completionReward: '¡Bienvenido a TuWebAI!',
    steps: [
      {
        id: 'welcome-1',
        title: '¡Bienvenido a TuWebAI!',
        description: 'Te guiaremos por las funcionalidades principales del dashboard para que puedas aprovechar al máximo la plataforma.',
        target: '.dashboard-header',
        position: 'bottom',
        action: 'wait',
        actionText: 'Continúa para comenzar',
        skipable: false,
        required: true
      },
      {
        id: 'welcome-2',
        title: 'Panel de Proyectos',
        description: 'Aquí puedes ver todos tus proyectos, crear nuevos, y gestionar los existentes. Cada proyecto tiene su propio estado y progreso.',
        target: '.projects-section',
        position: 'right',
        action: 'hover',
        actionText: 'Pasa el mouse sobre un proyecto',
        skipable: true,
        tips: [
          'Los proyectos se organizan por estado',
          'Puedes filtrar por tipo o fecha',
          'Usa la búsqueda para encontrar proyectos específicos'
        ]
      },
      {
        id: 'welcome-3',
        title: 'Métricas en Tiempo Real',
        description: 'Estas métricas se actualizan automáticamente y te muestran el estado general de tus proyectos y actividad.',
        target: '.metrics-section',
        position: 'left',
        action: 'click',
        actionText: 'Haz clic para ver detalles',
        skipable: true,
        tips: [
          'Las métricas se actualizan cada 30 segundos',
          'Puedes personalizar qué métricas ver',
          'Haz clic para ver gráficos detallados'
        ]
      },
      {
        id: 'welcome-4',
        title: 'Navegación Principal',
        description: 'Desde aquí puedes acceder a todas las secciones del dashboard: Proyectos, Colaboración, Analytics y más.',
        target: '.main-navigation',
        position: 'bottom',
        action: 'click',
        actionText: 'Explora las diferentes secciones',
        skipable: true,
        tips: [
          'Cada sección tiene funcionalidades específicas',
          'El menú se adapta según tu rol',
          'Usa los atajos de teclado para navegar más rápido'
        ]
      },
      {
        id: 'welcome-5',
        title: 'Perfil y Configuración',
        description: 'Personaliza tu experiencia, gestiona tu perfil y configura las notificaciones según tus preferencias.',
        target: '.user-profile',
        position: 'left',
        action: 'click',
        actionText: 'Accede a tu perfil',
        skipable: true,
        tips: [
          'Puedes cambiar tu avatar y información',
          'Configura tus preferencias de notificación',
          'Personaliza el tema y idioma'
        ]
      },
      {
        id: 'welcome-6',
        title: '¡Listo para comenzar!',
        description: 'Ya conoces lo básico del dashboard. Puedes acceder a más tutoriales desde el menú de ayuda en cualquier momento.',
        target: '.help-button',
        position: 'top',
        action: 'click',
        actionText: 'Accede a la ayuda',
        skipable: false,
        required: true,
        tips: [
          'El botón de ayuda está siempre disponible',
          'Puedes buscar artículos específicos',
          'Los tutoriales se adaptan a tu nivel de experiencia'
        ]
      }
    ]
  },
  {
    id: 'project-management',
    name: 'Gestión de Proyectos',
    description: 'Aprende a crear, gestionar y colaborar en proyectos',
    icon: '📁',
    category: 'feature',
    estimatedTime: 8,
    difficulty: 'intermediate',
    prerequisites: ['welcome-tour'],
    steps: [
      {
        id: 'project-1',
        title: 'Crear un Nuevo Proyecto',
        description: 'Aprende a crear un proyecto desde cero con todas las configuraciones necesarias.',
        target: '.create-project-button',
        position: 'bottom',
        action: 'click',
        actionText: 'Haz clic para crear un proyecto',
        skipable: true,
        tips: [
          'Selecciona el tipo de proyecto apropiado',
          'Añade una descripción detallada',
          'Configura las funcionalidades necesarias'
        ]
      },
      {
        id: 'project-2',
        title: 'Configurar Fases del Proyecto',
        description: 'Organiza tu proyecto en fases para un mejor seguimiento del progreso.',
        target: '.project-phases',
        position: 'right',
        action: 'click',
        actionText: 'Gestiona las fases',
        skipable: true,
        tips: [
          'Las fases ayudan a organizar el trabajo',
          'Puedes crear fases personalizadas',
          'Cada fase puede tener tareas específicas'
        ]
      },
      {
        id: 'project-3',
        title: 'Colaboración en Tiempo Real',
        description: 'Invita a tu equipo y colabora en tiempo real con chat, comentarios y compartir archivos.',
        target: '.collaboration-section',
        position: 'left',
        action: 'click',
        actionText: 'Accede a la colaboración',
        skipable: true,
        tips: [
          'El chat se actualiza en tiempo real',
          'Puedes compartir archivos y comentarios',
          'Las notificaciones te mantienen informado'
        ]
      }
    ]
  },
  {
    id: 'advanced-features',
    name: 'Funcionalidades Avanzadas',
    description: 'Descubre las características avanzadas del dashboard',
    icon: '⚡',
    category: 'advanced',
    estimatedTime: 12,
    difficulty: 'advanced',
    prerequisites: ['welcome-tour', 'project-management'],
    steps: [
      {
        id: 'advanced-1',
        title: 'Analytics Avanzados',
        description: 'Utiliza las herramientas de análisis para obtener insights detallados sobre tus proyectos.',
        target: '.analytics-section',
        position: 'bottom',
        action: 'click',
        actionText: 'Explora los analytics',
        skipable: true,
        tips: [
          'Los gráficos son interactivos',
          'Puedes exportar los datos',
          'Configura alertas personalizadas'
        ]
      },
      {
        id: 'advanced-2',
        title: 'Automatización y Workflows',
        description: 'Configura automatizaciones para optimizar tu flujo de trabajo.',
        target: '.automation-section',
        position: 'right',
        action: 'click',
        actionText: 'Configura automatizaciones',
        skipable: true,
        tips: [
          'Las automatizaciones ahorran tiempo',
          'Puedes crear workflows personalizados',
          'Monitorea el rendimiento de las automatizaciones'
        ]
      }
    ]
  }
];

// =====================================================
// ARTÍCULOS DE AYUDA PREDEFINIDOS
// =====================================================

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'getting-started',
    title: 'Primeros Pasos en TuWebAI',
    content: `
# Primeros Pasos en TuWebAI

## Bienvenido a TuWebAI Dashboard

TuWebAI es una plataforma profesional para la gestión de proyectos web que te permite colaborar con tu equipo en tiempo real.

## Configuración Inicial

### 1. Completar tu Perfil
- Ve a tu perfil y completa la información básica
- Sube una foto de perfil profesional
- Configura tus preferencias de notificación

### 2. Crear tu Primer Proyecto
- Haz clic en "Crear Proyecto"
- Selecciona el tipo de proyecto (Web, App, Landing, Ecommerce)
- Añade una descripción detallada
- Configura las funcionalidades necesarias

### 3. Invitar a tu Equipo
- Accede a la sección de colaboración
- Invita a los miembros de tu equipo
- Configura los permisos apropiados

## Consejos para Empezar

- **Organiza tus proyectos** por fases para un mejor seguimiento
- **Utiliza las notificaciones** para mantenerte informado
- **Explora los tutoriales** para conocer todas las funcionalidades
- **Personaliza tu dashboard** según tus necesidades

## Próximos Pasos

Una vez que hayas completado la configuración inicial, te recomendamos:
1. Completar el tutorial de gestión de proyectos
2. Configurar las automatizaciones básicas
3. Explorar las funcionalidades avanzadas
    `,
    category: 'onboarding',
    tags: ['inicio', 'configuración', 'primeros pasos'],
    lastUpdated: '2024-01-15',
    author: 'Equipo TuWebAI',
    views: 1250,
    helpful: 98,
    notHelpful: 2,
    relatedArticles: ['project-management', 'team-collaboration']
  },
  {
    id: 'project-management',
    title: 'Gestión Efectiva de Proyectos',
    content: `
# Gestión Efectiva de Proyectos

## Organización por Fases

### Fases Estándar
1. **UI Design** - Diseño de interfaz y experiencia de usuario
2. **Maquetado** - Estructuración y maquetado de páginas
3. **Contenido** - Creación y optimización de contenido
4. **Funcionalidades** - Desarrollo de características interactivas
5. **SEO** - Optimización para motores de búsqueda
6. **Deploy** - Despliegue y puesta en producción

### Mejores Prácticas
- **Define objetivos claros** para cada fase
- **Establece fechas límite** realistas
- **Asigna responsables** específicos
- **Documenta el progreso** regularmente

## Gestión de Tareas

### Creación de Tareas
- Título descriptivo y claro
- Descripción detallada de los requisitos
- Asignación de responsable
- Fecha límite específica
- Prioridad (Alta, Media, Baja)

### Seguimiento del Progreso
- Actualiza el estado regularmente
- Añade comentarios y observaciones
- Adjunta archivos relevantes
- Comunica bloqueos o problemas

## Colaboración Efectiva

### Comunicación
- Utiliza el chat para comunicación rápida
- Añade comentarios en las tareas específicas
- Mantén actualizada la información del proyecto
- Comparte archivos y recursos relevantes

### Reuniones y Revisiones
- Programa revisiones regulares
- Documenta las decisiones tomadas
- Actualiza el estado después de cada reunión
- Comparte los resultados con el equipo
    `,
    category: 'project-management',
    tags: ['proyectos', 'fases', 'tareas', 'colaboración'],
    lastUpdated: '2024-01-10',
    author: 'Equipo TuWebAI',
    views: 890,
    helpful: 85,
    notHelpful: 5,
    relatedArticles: ['getting-started', 'team-collaboration', 'time-management']
  },
  {
    id: 'troubleshooting',
    title: 'Solución de Problemas Comunes',
    content: `
# Solución de Problemas Comunes

## Problemas de Acceso

### No puedo iniciar sesión
1. Verifica que tu email esté correcto
2. Revisa tu contraseña
3. Asegúrate de que tu cuenta esté activa
4. Contacta al administrador si persiste el problema

### Problemas de Permisos
- Verifica que tengas los permisos necesarios
- Contacta al administrador del proyecto
- Revisa tu rol en el sistema

## Problemas de Rendimiento

### Carga lenta del dashboard
1. Verifica tu conexión a internet
2. Limpia la caché del navegador
3. Cierra pestañas innecesarias
4. Actualiza tu navegador

### Problemas con archivos
- Verifica el tamaño del archivo (máximo 100MB)
- Asegúrate de que el formato sea compatible
- Revisa tu conexión a internet
- Intenta subir el archivo nuevamente

## Problemas de Notificaciones

### No recibo notificaciones
1. Verifica la configuración de notificaciones
2. Revisa los horarios silenciosos
3. Asegúrate de que las notificaciones estén habilitadas
4. Verifica la configuración del navegador

## Contacto de Soporte

Si no encuentras la solución a tu problema:
- Utiliza el chat de soporte en vivo
- Envía un email a soporte@tuwebai.com
- Consulta la base de conocimientos
- Programa una llamada con nuestro equipo
    `,
    category: 'troubleshooting',
    tags: ['problemas', 'soporte', 'solución', 'ayuda'],
    lastUpdated: '2024-01-12',
    author: 'Equipo de Soporte',
    views: 650,
    helpful: 78,
    notHelpful: 8,
    relatedArticles: ['getting-started', 'notifications-setup']
  }
];

// =====================================================
// PROVIDER
// =====================================================

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useApp();
  
  // Estado del tutorial
  const [isActive, setIsActive] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<TutorialFlow | null>(null);
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState<TutorialProgress | null>(null);
  
  // Flujos y progreso
  const [availableFlows] = useState<TutorialFlow[]>(TUTORIAL_FLOWS);
  const [completedFlows, setCompletedFlows] = useState<string[]>([]);
  
  // Artículos de ayuda
  const [helpArticles] = useState<HelpArticle[]>(HELP_ARTICLES);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredArticles, setFilteredArticles] = useState<HelpArticle[]>(HELP_ARTICLES);
  
  // Configuración
  const [autoStart, setAutoStart] = useState(true);
  const [showHints, setShowHints] = useState(true);
  const [enableSounds, setEnableSounds] = useState(true);

  // =====================================================
  // EFECTOS
  // =====================================================

  // Auto-iniciar tutorial para nuevos usuarios
  useEffect(() => {
    if (isAuthenticated && user && autoStart) {
      const hasCompletedWelcome = localStorage.getItem('tutorial-welcome-completed');
      if (!hasCompletedWelcome) {
        setTimeout(() => {
          startTutorial('welcome-tour');
        }, 2000); // Esperar 2 segundos después del login
      }
    }
  }, [isAuthenticated, user, autoStart]);

  // Filtrar artículos de ayuda
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = helpArticles.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredArticles(filtered);
    } else {
      setFilteredArticles(helpArticles);
    }
  }, [searchQuery, helpArticles]);

  // =====================================================
  // FUNCIONES DEL TUTORIAL
  // =====================================================

  const startTutorial = useCallback((flowId: string) => {
    const flow = availableFlows.find(f => f.id === flowId);
    if (!flow) return;

    setCurrentFlow(flow);
    setCurrentStep(flow.steps[0]);
    setStepIndex(0);
    setIsActive(true);
    
    const newProgress: TutorialProgress = {
      flowId,
      currentStep: 0,
      completedSteps: [],
      startedAt: new Date().toISOString(),
      skippedSteps: [],
      timeSpent: 0
    };
    setProgress(newProgress);

    // Reproducir sonido si está habilitado
    if (enableSounds) {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignorar errores de audio
    }
  }, [availableFlows, enableSounds]);

  const nextStep = useCallback(() => {
    if (!currentFlow || !currentStep || !progress) return;

    const newProgress = {
      ...progress,
      completedSteps: [...progress.completedSteps, currentStep.id],
      currentStep: stepIndex + 1,
      timeSpent: progress.timeSpent + 5 // Estimación de 5 segundos por paso
    };
    setProgress(newProgress);

    if (stepIndex < currentFlow.steps.length - 1) {
      const nextStepIndex = stepIndex + 1;
      setStepIndex(nextStepIndex);
      setCurrentStep(currentFlow.steps[nextStepIndex]);
    } else {
      completeTutorial();
    }
  }, [currentFlow, currentStep, progress, stepIndex]);

  const prevStep = useCallback(() => {
    if (!currentFlow || stepIndex <= 0) return;

    const prevStepIndex = stepIndex - 1;
    setStepIndex(prevStepIndex);
    setCurrentStep(currentFlow.steps[prevStepIndex]);
  }, [currentFlow, stepIndex]);

  const skipStep = useCallback(() => {
    if (!currentStep || !progress) return;

    const newProgress = {
      ...progress,
      skippedSteps: [...progress.skippedSteps, currentStep.id],
      currentStep: stepIndex + 1
    };
    setProgress(newProgress);

    nextStep();
  }, [currentStep, progress, stepIndex, nextStep]);

  const completeTutorial = useCallback(() => {
    if (!currentFlow || !progress) return;

    const completedProgress = {
      ...progress,
      completedAt: new Date().toISOString(),
      timeSpent: progress.timeSpent + 10 // Tiempo final
    };

    setCompletedFlows(prev => [...prev, currentFlow.id]);
    localStorage.setItem(`tutorial-${currentFlow.id}-completed`, 'true');
    
    // Reproducir sonido de finalización
    if (enableSounds) {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }

    exitTutorial();
  }, [currentFlow, progress, enableSounds]);

  const exitTutorial = useCallback(() => {
    setIsActive(false);
    setCurrentFlow(null);
    setCurrentStep(null);
    setStepIndex(0);
    setProgress(null);
  }, []);

  // =====================================================
  // FUNCIONES DE AYUDA
  // =====================================================

  const searchHelp = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const markArticleHelpful = useCallback((articleId: string, helpful: boolean) => {
    // En una implementación real, esto se enviaría al servidor
    console.log(`Article ${articleId} marked as ${helpful ? 'helpful' : 'not helpful'}`);
  }, []);

  const getContextualHelp = useCallback((context: string): HelpArticle[] => {
    // Retornar artículos relevantes basados en el contexto
    return helpArticles.filter(article =>
      article.tags.some(tag => 
        context.toLowerCase().includes(tag.toLowerCase()) ||
        tag.toLowerCase().includes(context.toLowerCase())
      )
    );
  }, [helpArticles]);

  // =====================================================
  // VALOR DEL CONTEXTO
  // =====================================================

  const value: TutorialContextType = {
    // Estado del tutorial
    isActive,
    currentFlow,
    currentStep,
    stepIndex,
    progress,
    
    // Flujos y progreso
    availableFlows,
    completedFlows,
    
    // Artículos de ayuda
    helpArticles,
    searchQuery,
    filteredArticles,
    
    // Acciones del tutorial
    startTutorial,
    nextStep,
    prevStep,
    skipStep,
    completeTutorial,
    exitTutorial,
    
    // Acciones de ayuda
    searchHelp,
    markArticleHelpful,
    getContextualHelp,
    
    // Configuración
    autoStart,
    showHints,
    enableSounds,
    setAutoStart,
    setShowHints,
    setEnableSounds
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

// =====================================================
// HOOK PERSONALIZADO
// =====================================================

export const useTutorial = (): TutorialContextType => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};
