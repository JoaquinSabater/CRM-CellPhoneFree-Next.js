import { useEffect, useState, useCallback } from 'react';

// Función helper para VAPID
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useHybridNotifications(vendedorId: number, onNewPedido: (pedido: any) => void) {
  const [isWebPushSupported, setIsWebPushSupported] = useState(false);
  const [isWebPushSubscribed, setIsWebPushSubscribed] = useState(false);
  const [isSSEConnected, setIsSSEConnected] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // Configurar Web Push (para notificaciones cuando página está cerrada)
  const setupWebPush = useCallback(async () => {
    try {
      console.log('🔔 Configurando Web Push...');
      
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('❌ Web Push no soportado');
        return false;
      }

      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('✅ Service Worker registrado');
      
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('❌ Permisos de notificación denegados');
        return false;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
      if (!vapidKey) {
        console.error('❌ VAPID key no encontrada');
        return false;
      }

      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });

      console.log('✅ Push subscription creada');

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: pushSubscription, vendedorId }),
      });

      if (response.ok) {
        setIsWebPushSubscribed(true);
        console.log('✅ Web Push configurado para vendedor', vendedorId);
        return true;
      }
      
      console.error('❌ Error enviando suscripción al servidor');
      return false;
    } catch (error) {
      console.error('❌ Error configurando Web Push:', error);
      return false;
    }
  }, [vendedorId]);

  // Configurar SSE (para actualizar UI en tiempo real)
  const setupSSE = useCallback(() => {
    console.log('⚡ Configurando SSE para vendedor', vendedorId);
    
    // Cerrar conexión existente si hay
    if (eventSource) {
      eventSource.close();
    }

    const newEventSource = new EventSource(`/api/realtime/sse?vendedorId=${vendedorId}`);
    
    newEventSource.onopen = () => {
      setIsSSEConnected(true);
      console.log('🔗 SSE conectado para vendedor', vendedorId);
    };

    newEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 SSE recibido:', data);
        
        if (data.type === 'connected') {
          console.log('✅ Confirmación SSE para vendedor', data.vendedorId);
        } else if (data.type === 'new_pedido_preliminar') {
          console.log('🆕 Actualizando UI con nuevo pedido:', data.data);
          onNewPedido(data.data);
        }
      } catch (error) {
        console.error('❌ Error procesando SSE:', error);
      }
    };

    newEventSource.onerror = (error) => {
      setIsSSEConnected(false);
      console.log('❌ SSE error para vendedor', vendedorId, error);
      
      // Reconectar después de 3 segundos
      setTimeout(() => {
        console.log('🔄 Reconectando SSE...');
        setupSSE();
      }, 3000);
    };

    setEventSource(newEventSource);
    return newEventSource;
  }, [vendedorId, onNewPedido, eventSource]);

  useEffect(() => {
    console.log('🚀 Inicializando notificaciones híbridas para vendedor', vendedorId);
    
    // Configurar Web Push
    const initWebPush = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsWebPushSupported(supported);
      
      if (supported) {
        await setupWebPush();
      }
    };

    // Configurar SSE
    const sse = setupSSE();

    initWebPush();

    return () => {
      console.log('🧹 Limpiando conexiones para vendedor', vendedorId);
      if (sse) {
        sse.close();
        setIsSSEConnected(false);
      }
    };
  }, [vendedorId]); // Solo depender de vendedorId para evitar reconexiones innecesarias

  return {
    isWebPushSupported,
    isWebPushSubscribed,
    isSSEConnected
  };
}