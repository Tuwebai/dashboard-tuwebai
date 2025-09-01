// Service Worker para Push Notifications
const CACHE_NAME = 'tuwebai-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/favicon.ico'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar fetch requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Devolver desde caché si está disponible
        if (response) {
          return response;
        }
        
        // Si no está en caché, hacer fetch
        return fetch(event.request);
      }
    )
  );
});

// Manejar push notifications
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'TuWebAI',
    body: 'Nueva notificación',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { ...notificationData, ...payload };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false,
    tag: notificationData.tag,
    timestamp: notificationData.timestamp || Date.now(),
    actions: notificationData.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Manejar clic en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data;
  const url = notificationData?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Manejar acción de notificación
self.addEventListener('notificationclick', (event) => {
  if (event.action) {
    const action = event.action;
    const notificationData = event.notification.data;
    
    // Manejar diferentes acciones
    switch (action) {
      case 'view':
        // Abrir la URL específica
        event.waitUntil(
          clients.openWindow(notificationData?.url || '/')
        );
        break;
      case 'dismiss':
        // Solo cerrar la notificación
        event.notification.close();
        break;
      default:
        // Acción por defecto
        break;
    }
  }
});

// Manejar cierre de notificación
self.addEventListener('notificationclose', (event) => {
  // Registrar que la notificación fue cerrada

});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Manejar errores
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

// Manejar promesas rechazadas
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

// Función para limpiar notificaciones antiguas
function cleanupOldNotifications() {
  self.registration.getNotifications().then((notifications) => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    
    notifications.forEach((notification) => {
      if (notification.timestamp && (now - notification.timestamp) > maxAge) {
        notification.close();
      }
    });
  });
}

// Limpiar notificaciones antiguas cada hora
setInterval(cleanupOldNotifications, 60 * 60 * 1000);