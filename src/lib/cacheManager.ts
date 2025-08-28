// Gestor de cache para limpiar problemas de conexión
export class CacheManager {
  static async clearAllCaches() {
    try {
      // Limpiar cache del Service Worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // Limpiar cache del navegador
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Limpiar localStorage y sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // Cache limpiado exitosamente
      return true;
    } catch (error) {
      console.error('❌ Error limpiando cache:', error);
      return false;
    }
  }

  static async clearServiceWorkerCache() {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        // Service Worker cache limpiado
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error limpiando Service Worker cache:', error);
      return false;
    }
  }

  static async clearBrowserCache() {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        // Browser cache limpiado
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error limpiando browser cache:', error);
      return false;
    }
  }

  static async reloadApp() {
    try {
      await this.clearAllCaches();
      // Recargar la aplicación después de limpiar el cache
      window.location.reload();
    } catch (error) {
      console.error('❌ Error recargando aplicación:', error);
    }
  }
}

// Función para limpiar cache automáticamente en desarrollo
export const setupAutoCacheCleanup = () => {
  if (import.meta.env.DEV) {
    // Limpiar cache cada 5 minutos en desarrollo
    setInterval(async () => {
      const lastCleanup = localStorage.getItem('lastCacheCleanup');
      const now = Date.now();
      
      if (!lastCleanup || (now - parseInt(lastCleanup)) > 5 * 60 * 1000) {
        await CacheManager.clearServiceWorkerCache();
        localStorage.setItem('lastCacheCleanup', now.toString());
      }
    }, 60 * 1000); // Verificar cada minuto
  }
};
