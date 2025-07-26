const CACHE_NAME = 'tuwebai-v1.0.0';
const STATIC_CACHE = 'tuwebai-static-v1.0.0';
const DYNAMIC_CACHE = 'tuwebai-dynamic-v1.0.0';

// Archivos estáticos para cache
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg',
  '/logoweb.jpg',
  '/notification-sound.mp3',
  '/placeholder.svg',
  '/robots.txt'
];

// Rutas que deben ser cacheadas dinámicamente
const DYNAMIC_ROUTES = [
  '/dashboard',
  '/admin',
  '/proyectos',
  '/analytics',
  '/user-management',
  '/user-profile'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Cacheando archivos estáticos');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Instalación completada');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error en instalación:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activación completada');
        return self.clients.claim();
      })
  );
});

// Interceptación de fetch requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estrategia de cache para diferentes tipos de requests
  if (request.method === 'GET') {
    // Archivos estáticos
    if (STATIC_FILES.includes(url.pathname)) {
      event.respondWith(cacheFirst(request, STATIC_CACHE));
      return;
    }

    // Rutas dinámicas
    if (DYNAMIC_ROUTES.some(route => url.pathname.startsWith(route))) {
      event.respondWith(networkFirst(request, DYNAMIC_CACHE));
      return;
    }

    // API requests
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(networkFirst(request, DYNAMIC_CACHE));
      return;
    }

    // Imágenes y assets
    if (isImageRequest(request)) {
      event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
      return;
    }

    // Otros requests
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// Estrategia: Cache First
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache First Error:', error);
    return new Response('Error de conexión', { status: 503 });
  }
}

// Estrategia: Network First
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network First: Fallback a cache');
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Error de conexión', { status: 503 });
  }
}

// Verificar si es una request de imagen
function isImageRequest(request) {
  return request.destination === 'image' || 
         request.url.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/i);
}

// Manejo de mensajes del cliente
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_INFO':
      event.ports[0].postMessage({
        type: 'CACHE_INFO',
        payload: {
          staticCache: STATIC_CACHE,
          dynamicCache: DYNAMIC_CACHE,
          staticFiles: STATIC_FILES.length,
          dynamicRoutes: DYNAMIC_ROUTES.length
        }
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({
          type: 'CACHE_CLEARED',
          payload: { success: true }
        });
      });
      break;
      
    case 'UPDATE_CACHE':
      updateCache(payload).then(() => {
        event.ports[0].postMessage({
          type: 'CACHE_UPDATED',
          payload: { success: true }
        });
      });
      break;
  }
});

// Limpiar todos los caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// Actualizar cache específico
async function updateCache(files) {
  const cache = await caches.open(DYNAMIC_CACHE);
  return Promise.all(
    files.map(file => cache.add(file))
  );
}

// Background sync para requests offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Sincronizar datos pendientes
    console.log('Service Worker: Sincronizando datos en background...');
    
    // Aquí se implementaría la lógica de sincronización
    // Por ejemplo, enviar datos offline guardados
    
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de TuWebAI',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver',
        icon: '/favicon.svg'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/favicon.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('TuWebAI', options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker Unhandled Rejection:', event.reason);
}); 