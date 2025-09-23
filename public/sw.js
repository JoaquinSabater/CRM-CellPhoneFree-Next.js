// Registering service worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activado');
  event.waitUntil(self.clients.claim());
});

// Listen for push events
self.addEventListener('push', (event) => {
  console.log('📨 Push notification recibida:', event);
  
  if (event.data) {
    const data = event.data.json();
    console.log('📋 Datos del push:', data);
    
    const options = {
      body: data.body || 'Nuevo pedido preliminar',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag || 'pedido-notification',
      data: data.data || {},
      actions: [
        {
          action: 'view',
          title: 'Ver pedido',
          icon: '/favicon.ico'
        },
        {
          action: 'dismiss',
          title: 'Cerrar'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Nuevo Pedido', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Click en notificación:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Abrir/enfocar la aplicación
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // Si ya hay una ventana abierta, enfocarla
        for (let client of clients) {
          if (client.url.includes('/dashboard') && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        if (self.clients.openWindow) {
          return self.clients.openWindow('/dashboard');
        }
      })
    );
  }
});