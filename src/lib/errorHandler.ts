// Sistema robusto de manejo de errores para Supabase
export interface SupabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  timestamp: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: Array<{ error: SupabaseError; context: ErrorContext; stack?: string }> = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Manejo específico de errores de Supabase
  handleSupabaseError(error: any, context: ErrorContext): SupabaseError {
    const supabaseError: SupabaseError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Error desconocido',
      details: error.details || null,
      hint: error.hint || null
    };

    // Logging consistente
    this.logError(supabaseError, context);

    // Manejo específico por código de error
    switch (supabaseError.code) {
      case 'PGRST116':
        return {
          ...supabaseError,
          message: 'No se encontraron resultados para la consulta',
          hint: 'Verifica los parámetros de búsqueda'
        };

      case '42501':
        return {
          ...supabaseError,
          message: 'No tienes permisos para realizar esta acción',
          hint: 'Contacta al administrador del sistema'
        };

      case '23505':
        return {
          ...supabaseError,
          message: 'El registro ya existe en la base de datos',
          hint: 'Verifica que no estés duplicando información'
        };

      case '23503':
        return {
          ...supabaseError,
          message: 'No se puede eliminar este registro',
          hint: 'Existen registros relacionados que deben eliminarse primero'
        };

      case '42P01':
        return {
          ...supabaseError,
          message: 'Tabla no encontrada',
          hint: 'Verifica que la tabla exista en la base de datos'
        };

      case '42703':
        return {
          ...supabaseError,
          message: 'Columna no encontrada',
          hint: 'Verifica que la columna exista en la tabla'
        };

      case '42P02':
        return {
          ...supabaseError,
          message: 'Parámetro no encontrado',
          hint: 'Verifica que todos los parámetros requeridos estén presentes'
        };

      case '08000':
        return {
          ...supabaseError,
          message: 'Error de conexión con la base de datos',
          hint: 'Verifica tu conexión a internet e intenta nuevamente'
        };

      case '57014':
        return {
          ...supabaseError,
          message: 'Operación cancelada por timeout',
          hint: 'La operación tardó demasiado, intenta nuevamente'
        };

      default:
        return supabaseError;
    }
  }

  // Logging consistente y estructurado
  private logError(error: SupabaseError, context: ErrorContext): void {
    const errorEntry = {
      error,
      context,
      stack: new Error().stack
    };

    this.errorLog.push(errorEntry);

    // Log estructurado para desarrollo
    if (import.meta.env.DEV) {
      console.group(`🚨 Error en ${context.component} - ${context.action}`);
      console.error('Código:', error.code);
      console.error('Mensaje:', error.message);
      console.error('Detalles:', error.details);
      console.error('Sugerencia:', error.hint);
      console.error('Contexto:', context);
      console.error('Stack:', errorEntry.stack);
      console.groupEnd();
    }

    // Log para producción (sin stack trace)
    if (import.meta.env.PROD) {
      console.error(`[${context.component}] ${context.action}: ${error.code} - ${error.message}`);
    }

    // Limpiar log antiguo (mantener solo últimos 100 errores)
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
  }

  // Obtener errores del log
  getErrorLog(): Array<{ error: SupabaseError; context: ErrorContext; stack?: string }> {
    return [...this.errorLog];
  }

  // Limpiar log de errores
  clearErrorLog(): void {
    this.errorLog = [];
  }

  // Verificar si un error es recuperable
  isRecoverableError(error: SupabaseError): boolean {
    const recoverableCodes = ['PGRST116', '57014', '08000'];
    return recoverableCodes.includes(error.code);
  }

  // Obtener mensaje amigable para el usuario
  getUserFriendlyMessage(error: SupabaseError): string {
    return error.message || 'Ha ocurrido un error inesperado';
  }

  // Obtener sugerencia de acción para el usuario
  getUserActionHint(error: SupabaseError): string {
    return error.hint || 'Intenta nuevamente o contacta al soporte técnico';
  }
}

// Instancia global del manejador de errores
export const errorHandler = ErrorHandler.getInstance();

// Función helper para manejar errores rápidamente
export const handleError = (error: any, component: string, action: string, userId?: string): SupabaseError => {
  return errorHandler.handleSupabaseError(error, {
    component,
    action,
    userId,
    timestamp: new Date().toISOString()
  });
};

// Función para crear fallbacks de UI
export const createErrorFallback = (error: SupabaseError, retryAction?: () => void) => {
  return {
    title: 'Error',
    message: errorHandler.getUserFriendlyMessage(error),
    hint: errorHandler.getUserActionHint(error),
    isRecoverable: errorHandler.isRecoverableError(error),
    retryAction
  };
};

// Función para configurar el manejador de errores global
export const setupErrorHandler = (): void => {
  // Configurar manejador de errores global para errores no capturados
  window.addEventListener('error', (event) => {
    const context: ErrorContext = {
      component: 'Global',
      action: 'Unhandled Error',
      timestamp: new Date().toISOString()
    };

    const supabaseError: SupabaseError = {
      code: 'UNHANDLED_ERROR',
      message: event.error?.message || 'Error no manejado',
      details: event.filename,
      hint: 'Revisa la consola para más detalles'
    };

    errorHandler.handleSupabaseError(supabaseError, context);
  });

  // Configurar manejador para promesas rechazadas
  window.addEventListener('unhandledrejection', (event) => {
    const context: ErrorContext = {
      component: 'Global',
      action: 'Unhandled Promise Rejection',
      timestamp: new Date().toISOString()
    };

    const supabaseError: SupabaseError = {
      code: 'UNHANDLED_PROMISE',
      message: event.reason?.message || 'Promesa rechazada no manejada',
      details: event.reason?.stack,
      hint: 'Verifica el manejo de promesas en tu código'
    };

    errorHandler.handleSupabaseError(supabaseError, context);
  });

  // Configurar manejador para errores de React
  if (typeof window !== 'undefined') {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Llamar al console.error original
      originalConsoleError.apply(console, args);
      
      // Capturar errores de React
      if (args[0] && typeof args[0] === 'string' && args[0].includes('React')) {
        const context: ErrorContext = {
          component: 'React',
          action: 'React Error',
          timestamp: new Date().toISOString()
        };

        const supabaseError: SupabaseError = {
          code: 'REACT_ERROR',
          message: args[0],
          details: args.slice(1).join(' '),
          hint: 'Revisa el componente que está causando el error'
        };

        errorHandler.handleSupabaseError(supabaseError, context);
      }
    };
  }
};
