// SW Version: 2.0
self.addEventListener('push', function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: 'Nova Mensagem',
      body: event.data ? event.data.text() : 'Você recebeu uma nova notificação do ITWF.'
    };
  }

  const baseUrl = self.registration.scope.replace(/\/$/, '');
  const iconUrl = data.icon || `${baseUrl}/logo.png`;
  const badgeUrl = data.badge || `${baseUrl}/logo.png`;

  const options = {
    body: data.body || 'Você tem uma nova atualização no seu painel.',
    icon: iconUrl,
    badge: badgeUrl,
    image: data.image || undefined,
    data: {
      url: data.url || '/dashboard'
    },
    vibrate: [100, 50, 100],
    requireInteraction: false,
    silent: false,
    tag: data.tag || ('itwf-notif-' + Date.now()),
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Aviso ITWF', options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      const url = event.notification.data.url || '/dashboard';
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
