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

export async function subscribeUserToPush(email: string, username?: string, adminId?: string) {
  if (!email) return;

  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      // 1. Solicitar permissão se ainda não foi concedida
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('[Push] Permissão negada pelo usuário.');
          return;
        }
      } else if (Notification.permission === 'denied') {
        console.warn('[Push] Permissão já está bloqueada no navegador.');
        return;
      }

      // 2. Aguardar o service worker ficar pronto
      const register = await navigator.serviceWorker.ready;

      // 3. Verificar se já existe uma subscription válida — REUTILIZAR se houver
      let subscription = await register.pushManager.getSubscription();

      if (!subscription) {
        // Só cria nova subscription se ainda não existe uma
        console.log('[Push] Criando nova inscrição...');
        subscription = await register.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
      }

      // 4. Enviar (ou re-confirmar) ao servidor
      // DETERMINAÇÃO DINÂMICA DA API: Prioriza VITE_API_URL, depois URL da Render conhecida, depois localhost
      const apiUrl = import.meta.env.VITE_API_URL || 'https://itwf.onrender.com';
      
      console.log('[Push] Registrando inscrição no servidor:', apiUrl);
      
      const response = await fetch(`${apiUrl}/api/subscribe`, {
        method: 'POST',
        body: JSON.stringify({ email, username, subscription, adminId }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Erro HTTP: ${response.status}`);
      }

      console.log('[Push] Usuário registrado com sucesso no servidor.');

    } catch (err: any) {
      console.error('[Push Client Error]', err.message);
    }
  } else {
    console.warn('[Push] Navegador não suporta Service Worker ou Push Manager.');
  }
}
export async function unsubscribeFromPush(email: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const register = await navigator.serviceWorker.ready;
    const subscription = await register.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('[Push] Inscrição removida do navegador.');

      const apiUrl = import.meta.env.VITE_API_URL || 'https://itwf.onrender.com';
      await fetch(`${apiUrl}/api/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subscription_json: JSON.stringify(subscription) })
      });
      console.log('[Push] Inscrição removida do servidor.');
    }
  } catch (err: any) {
    console.error('[Push Unsubscribe Error]', err.message);
  }
}
