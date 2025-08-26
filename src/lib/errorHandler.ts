// Manejador de errores personalizado para desarrollo
export const setupErrorHandler = () => {
  if (import.meta.env.DEV) {
    // Suprimir advertencias específicas de React DevTools
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0];
      if (typeof message === 'string') {
        if (message.includes('Download the React DevTools')) {
          return;
        }
        if (message.includes('ERR_CONNECTION_REFUSED') && message.includes('localhost:8082')) {
          return;
        }
      }
      originalError.apply(console, args);
    };

    // Suprimir warnings específicos
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args[0];
      if (typeof message === 'string') {
        if (message.includes('ERR_CONNECTION_REFUSED') && message.includes('localhost:8082')) {
          return;
        }
      }
      originalWarn.apply(console, args);
    };

    // Manejar errores no capturados
    window.addEventListener('error', (event) => {
      if (event.message.includes('ERR_CONNECTION_REFUSED') && event.filename?.includes('localhost:8082')) {
        event.preventDefault();
        return false;
      }
    });

    // Manejar promesas rechazadas no capturadas
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('ERR_CONNECTION_REFUSED') && 
          event.reason?.message?.includes('localhost:8082')) {
        event.preventDefault();
        return false;
      }
    });
  }
};

// Función para limpiar el cache del Service Worker
export const clearServiceWorkerCache = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      
      // Limpiar cache del navegador
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      console.log('Cache del Service Worker limpiado');
    } catch (error) {
      console.error('Error limpiando cache:', error);
    }
  }
};
