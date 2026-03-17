// Usa a chave do .env se existir, senão usa a de fallback gerada para o ambiente
const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BHxacd_CxUxPuwPGqmyySkDTNHvop0IKLyZ3EExEmMMEDlMoFXntORvw_Ss7dI-2XNjoGRT-EZmUk5O4qEGZ76o';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush(email: string, adminId?: string) {
  if (!email) return;

  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      // 1. Request Permission explicitly if not granted
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
      } else if (Notification.permission === 'denied') {
        return;
      }

      // 2. Wait for the service worker to be ready
      const register = await navigator.serviceWorker.ready;

      // 3. Subscribe (Try fresh subscription)
      try {
        let subscription = await register.pushManager.getSubscription();

        if (subscription) {
           await subscription.unsubscribe();
        }

        subscription = await register.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        // 4. Send to server
        const apiUrl = import.meta.env.VITE_API_URL || '';
        await fetch(`${apiUrl}/api/subscribe`, {
          method: 'POST',
          body: JSON.stringify({ email, subscription, adminId }),
          headers: {
            'Content-Type': 'application/json'
          }
        });

      } catch (subErr: any) {
        console.error('Subscription error:', subErr);
      }
    } catch (err: any) {
      console.error('General push error:', err);
    }
  }
}
