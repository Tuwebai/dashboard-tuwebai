// =====================================================
// SERVICE WORKER PARA NOTIFICACIONES PUSH
// =====================================================

const CACHE_NAME = 'tuwebai-notifications-v1';
const NOTIFICATION_CACHE = 'notifications-cache';

// =====================================================
// INSTALACIÓN Y ACTIVACIÓN
// =====================================================

self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker instalado');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache abierto');
        return cache.addAll([
          '/',
          '/dashboard',
          '/notifications',
          '/offline.html'
        ]);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
        return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
  self.clients.claim();
});

// =====================================================
// MANEJO DE NOTIFICACIONES PUSH
// =====================================================

self.addEventListener('push', function(event) {
  console.log('📱 Evento push recibido:', event);
  
  if (event.data) {
    try {
      const notification = event.data.json();
      console.log('📋 Datos de notificación:', notification);
      
      const options = buildNotificationOptions(notification);
      
      event.waitUntil(
        self.registration.showNotification(notification.title, options)
      .then(() => {
            console.log('✅ Notificación mostrada');
            // Cachear la notificación
            cacheNotification(notification);
          })
          .catch(error => {
            console.error('❌ Error mostrando notificación:', error);
          })
      );
    } catch (error) {
      console.error('❌ Error parseando datos de notificación:', error);
      // Mostrar notificación por defecto
      const defaultOptions = {
        body: 'Nueva notificación recibida',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'default-notification',
        requireInteraction: false,
        silent: false
      };
      
      event.waitUntil(
        self.registration.showNotification('TuWebAI', defaultOptions)
      );
    }
  } else {
    // Sin datos, mostrar notificación por defecto
    const defaultOptions = {
      body: 'Tienes una nueva notificación',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'default-notification',
      requireInteraction: false,
      silent: false
    };
    
    event.waitUntil(
      self.registration.showNotification('TuWebAI', defaultOptions)
    );
  }
});

// =====================================================
// MANEJO DE CLICKS EN NOTIFICACIONES
// =====================================================

self.addEventListener('notificationclick', function(event) {
  console.log('👆 Click en notificación:', event);
  
  event.notification.close();
  
  if (event.action) {
    // Manejar acciones personalizadas
    handleNotificationAction(event.action, event.notification.data);
  } else {
    // Click en el cuerpo de la notificación
    handleNotificationClick(event.notification.data);
  }
});

// =====================================================
// MANEJO DE CIERRE DE NOTIFICACIONES
// =====================================================

self.addEventListener('notificationclose', function(event) {
  console.log('❌ Notificación cerrada:', event);
  
  // Registrar que la notificación fue cerrada
  if (event.notification.data) {
    logNotificationInteraction(event.notification.data, 'closed');
  }
});

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function buildNotificationOptions(notification) {
  const baseOptions = {
    body: notification.message || notification.body || 'Nueva notificación',
    icon: notification.icon || '/icon-192x192.png',
    badge: notification.badge || '/badge-72x72.png',
    tag: notification.id || `notification-${Date.now()}`,
    data: notification,
    requireInteraction: notification.isUrgent || false,
    silent: notification.silent || false,
    vibrate: notification.vibrate || [200, 100, 200],
    timestamp: notification.timestamp || Date.now()
  };

  // Agregar acciones si están definidas
  if (notification.actions && Array.isArray(notification.actions)) {
    baseOptions.actions = notification.actions.map(action => ({
      action: action.action || action.id,
      title: action.title || action.label,
      icon: action.icon
    }));
  }

  // Agregar imagen si está definida
  if (notification.image) {
    baseOptions.image = notification.image;
  }

  // Agregar badge personalizado
  if (notification.badge) {
    baseOptions.badge = notification.badge;
  }

  // Agregar datos adicionales
  if (notification.metadata) {
    baseOptions.data = {
      ...baseOptions.data,
      ...notification.metadata
    };
  }

  return baseOptions;
}

function handleNotificationAction(action, notificationData) {
  console.log('⚡ Acción de notificación:', action, notificationData);
  
  // Registrar la interacción
  logNotificationInteraction(notificationData, `action_${action}`);
  
  // Manejar acciones específicas
  switch (action) {
    case 'view':
    case 'open':
      openNotificationTarget(notificationData);
      break;
      
    case 'dismiss':
      // Solo cerrar la notificación
      break;
      
    case 'reply':
      handleReplyAction(notificationData);
      break;
      
    case 'snooze':
      handleSnoozeAction(notificationData);
      break;
      
    default:
      // Acción personalizada
      handleCustomAction(action, notificationData);
      break;
  }
}

function handleNotificationClick(notificationData) {
  console.log('👆 Click en notificación:', notificationData);
  
  // Registrar la interacción
  logNotificationInteraction(notificationData, 'clicked');
  
  // Abrir el objetivo de la notificación
  openNotificationTarget(notificationData);
}

function openNotificationTarget(notificationData) {
  let targetUrl = '/dashboard';
  
  // Determinar URL objetivo basado en la categoría y metadata
  if (notificationData.actionUrl) {
    targetUrl = notificationData.actionUrl;
  } else if (notificationData.category) {
    switch (notificationData.category) {
      case 'project':
        if (notificationData.metadata?.projectId) {
          targetUrl = `/proyectos/${notificationData.metadata.projectId}`;
        } else {
          targetUrl = '/proyectos';
        }
        break;
        
      case 'ticket':
        if (notificationData.metadata?.ticketId) {
          targetUrl = `/tickets/${notificationData.metadata.ticketId}`;
        } else {
          targetUrl = '/soporte';
        }
        break;
        
      case 'payment':
        targetUrl = '/facturacion';
        break;
        
      case 'security':
        targetUrl = '/admin/security';
        break;
        
      case 'user':
        targetUrl = '/perfil';
        break;
        
      default:
        targetUrl = '/dashboard';
    }
  }
  
  // Abrir la URL en una nueva pestaña o enfocar una existente
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Buscar si ya hay una pestaña abierta con la URL
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Si no hay pestaña abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
}

function handleReplyAction(notificationData) {
  console.log('💬 Acción de respuesta:', notificationData);
  
  // Implementar lógica de respuesta
  // Por ejemplo, abrir un modal de respuesta o redirigir a un formulario
  const replyUrl = `/notifications/${notificationData.id}/reply`;
  
  event.waitUntil(
    clients.openWindow(replyUrl)
  );
}

function handleSnoozeAction(notificationData) {
  console.log('⏰ Acción de posponer:', notificationData);
  
  // Implementar lógica de posponer
  // Por ejemplo, programar la notificación para más tarde
  const snoozeTime = 15 * 60 * 1000; // 15 minutos
  
  setTimeout(() => {
    // Reenviar la notificación
    self.registration.showNotification(notificationData.title, {
      body: notificationData.message,
      icon: notificationData.icon || '/icon-192x192.png',
      tag: `snoozed-${notificationData.id}`,
      data: notificationData
    });
  }, snoozeTime);
}

function handleCustomAction(action, notificationData) {
  console.log('🔧 Acción personalizada:', action, notificationData);
  
  // Implementar lógica para acciones personalizadas
  // Por ejemplo, enviar analytics, actualizar estado, etc.
  
  // Enviar mensaje al cliente principal
  clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'CUSTOM_NOTIFICATION_ACTION',
        action: action,
        notificationData: notificationData
      });
    });
  });
}

function cacheNotification(notification) {
  // Cachear la notificación para acceso offline
  caches.open(NOTIFICATION_CACHE).then(cache => {
    const notificationKey = `notification-${notification.id || Date.now()}`;
    cache.put(notificationKey, new Response(JSON.stringify(notification)));
  });
}

function logNotificationInteraction(notificationData, interactionType) {
  // Enviar analytics o logging de interacciones
  console.log('📊 Interacción con notificación:', {
    notificationId: notificationData.id,
    interactionType: interactionType,
    timestamp: new Date().toISOString(),
    category: notificationData.category,
    type: notificationData.type
  });
  
  // Aquí se podría enviar a un servicio de analytics
  // o guardar en IndexedDB para sincronización posterior
}

// =====================================================
// MANEJO DE MENSAJES DEL CLIENTE
// =====================================================

self.addEventListener('message', function(event) {
  console.log('📨 Mensaje recibido del cliente:', event.data);
  
  switch (event.data.type) {
    case 'GET_NOTIFICATIONS':
      // Enviar notificaciones cacheadas al cliente
      getCachedNotifications().then(notifications => {
      event.ports[0].postMessage({
          type: 'CACHED_NOTIFICATIONS',
          notifications: notifications
        });
      });
      break;
      
    case 'CLEAR_NOTIFICATIONS':
      // Limpiar notificaciones cacheadas
      clearCachedNotifications().then(() => {
        event.ports[0].postMessage({
          type: 'NOTIFICATIONS_CLEARED'
        });
      });
      break;
      
    case 'UPDATE_NOTIFICATION':
      // Actualizar notificación existente
      updateNotification(event.data.notification).then(() => {
        event.ports[0].postMessage({
          type: 'NOTIFICATION_UPDATED'
        });
      });
      break;
      
    default:
      console.log('❓ Tipo de mensaje desconocido:', event.data.type);
  }
});

// =====================================================
// FUNCIONES DE CACHE
// =====================================================

async function getCachedNotifications() {
  try {
    const cache = await caches.open(NOTIFICATION_CACHE);
    const keys = await cache.keys();
    const notifications = [];
    
    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const notification = await response.json();
        notifications.push(notification);
      }
    }
    
    return notifications;
  } catch (error) {
    console.error('Error obteniendo notificaciones cacheadas:', error);
    return [];
  }
}

async function clearCachedNotifications() {
  try {
    const cache = await caches.open(NOTIFICATION_CACHE);
    const keys = await cache.keys();
    
    for (const key of keys) {
      await cache.delete(key);
    }
    
    console.log('🗑️ Notificaciones cacheadas eliminadas');
  } catch (error) {
    console.error('Error limpiando notificaciones cacheadas:', error);
  }
}

async function updateNotification(notification) {
  try {
    const cache = await caches.open(NOTIFICATION_CACHE);
    const notificationKey = `notification-${notification.id}`;
    
    await cache.put(notificationKey, new Response(JSON.stringify(notification)));
    console.log('✅ Notificación actualizada en cache');
  } catch (error) {
    console.error('Error actualizando notificación:', error);
  }
}

// =====================================================
// MANEJO DE ERRORES
// =====================================================

self.addEventListener('error', function(event) {
  console.error('❌ Error en Service Worker:', event.error);
});

self.addEventListener('unhandledrejection', function(event) {
  console.error('❌ Promesa rechazada no manejada:', event.reason);
});

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

function formatNotificationTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) { // Menos de 1 minuto
    return 'Ahora mismo';
  } else if (diff < 3600000) { // Menos de 1 hora
    const minutes = Math.floor(diff / 60000);
    return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  } else if (diff < 86400000) { // Menos de 1 día
    const hours = Math.floor(diff / 3600000);
    return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  } else {
    return date.toLocaleDateString();
  }
}

function getNotificationPriority(notification) {
  if (notification.isUrgent || notification.type === 'critical') {
    return 'high';
  } else if (notification.type === 'warning' || notification.type === 'error') {
    return 'normal';
  } else {
    return 'low';
  }
}

// =====================================================
// INICIALIZACIÓN
// =====================================================

console.log('🚀 Service Worker de TuWebAI inicializado');
console.log('📱 Listo para manejar notificaciones push');
console.log('🔧 Versión:', CACHE_NAME); 