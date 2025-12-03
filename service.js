// Service Worker

// Asignar un nombre y versión a la caché
const CACHE_NAME = 'Mercado pago';

// Archivos que se van a cachear
const urlsToCache = [
  './',
  './style.css',
  './app.js',
  './assets/images/store.png',
  './index.html',
  './manifest.json'
];

// Evento de instalación del Service Worker
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache)
          .then(() => {
            self.skipWaiting();
          });
      })
      .catch(err => {
        console.log('No se registró el cache', err);
      })
  );
});

// Evento de activación del Service Worker
self.addEventListener('activate', e => {
  const cacheWhitelist = [CACHE_NAME];

  e.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Evento fetch del Service Worker
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request)
      .then(res => {
        if (res) {
          return res;
        }
        return fetch(e.request);
      })
  );
});

// MEJORAS PARA NOTIFICACIONES PUSH:

// Evento push del Service Worker
self.addEventListener('push', e => {
  let data = {};
  
  try {
    data = e.data ? e.data.json() : {};
  } catch (error) {
    console.log('Error parsing push data:', error);
    data = {
      title: 'Notificación',
      body: 'Tienes una nueva notificación',
      icon: './assets/image/icon.png'
    };
  }

  const title = data.title || 'Notificación';
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: data.icon || './assets/image/icon.png',
    badge: data.badge || './assets/image/icon.png',
    image: data.image,
    vibrate: [200, 100, 200],
    data: data.data || { url: data.url || './' },
    actions: data.actions || [
      {
        action: 'view',
        title: 'Ver'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };

  e.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', e => {
  e.notification.close();

  const notificationData = e.notification.data;
  const action = e.action;

  if (action === 'close') {
    return;
  }

  // Por defecto, abrir la aplicación
  let urlToOpen = notificationData.url || './';

  e.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // Buscar si ya hay una ventana abierta
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', e => {
  console.log('Notificación cerrada:', e.notification);
});