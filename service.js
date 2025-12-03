//  SERVICE WORKER 

// Nombre correcto de caché
const CACHE_NAME = 'mercadopago-cache-v1';

// Archivos a cachear
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './assets/images/store.png',
  './manifest.json'
];

// =========================
//  INSTALL (pre-cache)
// =========================
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// =========================
//  ACTIVATE (limpieza)
// =========================
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
      ))
      .then(() => self.clients.claim())
  );
});

// =========================
//  FETCH (offline support)
// =========================
self.addEventListener('fetch', e => {

  // Ignorar chrome-extension:// y anything non-HTTP
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request)
      .then(cached => {
        if (cached) return cached;

        return fetch(e.request)
          .catch(() => caches.match('./index.html')); 
      })
  );
});

// =========================
//  PUSH NOTIFICATIONS
// =========================

self.addEventListener('push', e => {
  let data = {};

  try {
    data = e.data ? e.data.json() : {};
  } catch (error) {
    data = {
      title: 'Notificación',
      body: 'Tienes una nueva notificación',
      icon: './assets/images/store.png'
    };
  }

  const title = data.title || 'Notificación';
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: data.icon || './assets/images/store.png',
    badge: data.badge || './assets/images/store.png',
    image: data.image,
    vibrate: [200, 100, 200],
    data: data.data || { url: data.url || './' },
    actions: data.actions || [
      { action: 'view', title: 'Ver' },
      { action: 'close', title: 'Cerrar' }
    ]
  };

  e.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Click en notificaciones
self.addEventListener('notificationclick', e => {
  e.notification.close();

  const urlToOpen = e.notification.data.url || './';

  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Cierre de notificación
self.addEventListener('notificationclose', e => {
  console.log('Notificación cerrada:', e.notification);
});
