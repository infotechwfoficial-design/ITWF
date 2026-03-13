// SW Version: 1.6
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

  const baseUrl = self.location.origin || '';
  const iconUrl = `${baseUrl}/logo.png`;
  const badgeUrl = `${baseUrl}/badge.png`;

  const options = {
    body: data.body || 'Você tem uma nova atualização no seu painel.',
    icon: data.icon || iconUrl,

    image: data.image || null,
    data: {
      url: data.url || '/'
    },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Aviso ITWF', options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
