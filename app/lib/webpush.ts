// app/lib/webpush.ts
import { db } from './mysql';

const webpush = require('web-push');

// Configurar VAPID una sola vez
if (process.env.NEXT_PUBLIC_VAPID_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:test@example.com',
    process.env.NEXT_PUBLIC_VAPID_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Definir interfaces
interface StoredSubscription {
  id: number;
  vendedor_id: number | null;
  endpoint: string | null;
  p256dh: string | null;
  auth: string | null;
}

// Interface para suscripción que puede venir como JSON
interface SubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Extender el tipo PushSubscription
interface ExtendedPushSubscription extends PushSubscription {
  keys?: {
    p256dh: string;
    auth: string;
  };
}

export async function saveSubscription(vendedorId: number, subscription: any) {
  try {
    // Validar que tengamos los datos mínimos necesarios
    if (!vendedorId || !subscription?.endpoint) {
      throw new Error('Datos de suscripción incompletos');
    }

    let p256dh: string;
    let auth: string;

    // Verificar si es un objeto PushSubscription nativo o un JSON
    if (typeof subscription.getKey === 'function') {
      // Es un PushSubscription nativo
      console.log('📱 Procesando suscripción nativa');
      
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');
      
      if (!p256dhKey || !authKey) {
        throw new Error('Keys de suscripción faltantes');
      }

      // Convertir ArrayBuffer a base64
      p256dh = btoa(String.fromCharCode(...new Uint8Array(p256dhKey)));
      auth = btoa(String.fromCharCode(...new Uint8Array(authKey)));
    } else if (subscription.keys) {
      // Es un objeto JSON con keys
      console.log('📦 Procesando suscripción JSON');
      
      if (!subscription.keys.p256dh || !subscription.keys.auth) {
        throw new Error('Keys de suscripción faltantes en JSON');
      }
      
      p256dh = subscription.keys.p256dh;
      auth = subscription.keys.auth;
    } else {
      throw new Error('Formato de suscripción no reconocido');
    }
    
    const query = `
      INSERT INTO push_subscriptions (vendedor_id, endpoint, p256dh, auth, user_agent) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        p256dh = VALUES(p256dh),
        auth = VALUES(auth),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await db.execute(query, [
      vendedorId,
      subscription.endpoint,
      p256dh,
      auth,
      'CRM Web App'
    ]);
    
    console.log(`✅ Suscripción guardada en BD para vendedor ${vendedorId}`);
    return true;
  } catch (error) {
    console.error('❌ Error guardando suscripción en BD:', error);
    throw error;
  }
}

export async function getSubscriptionsByVendedor(vendedorId: number): Promise<SubscriptionJSON[]> {
  try {
    // Validar vendedorId
    if (!vendedorId) {
      console.log('⚠️ VendedorId no válido');
      return [];
    }

    const query = `
      SELECT endpoint, p256dh, auth 
      FROM push_subscriptions 
      WHERE vendedor_id = ? 
        AND endpoint IS NOT NULL 
        AND p256dh IS NOT NULL 
        AND auth IS NOT NULL
      ORDER BY updated_at DESC
    `;
    
    const [rows] = await db.execute(query, [vendedorId]);
    const subscriptions = rows as StoredSubscription[];
    
    // Construir suscripciones en formato JSON
    const validSubscriptions = subscriptions
      .filter(sub => sub.endpoint && sub.p256dh && sub.auth)
      .map(sub => ({
        endpoint: sub.endpoint!,
        keys: {
          p256dh: sub.p256dh!,
          auth: sub.auth!
        }
      } as SubscriptionJSON));

    console.log(`📋 Encontradas ${validSubscriptions.length} suscripciones válidas para vendedor ${vendedorId}`);
    return validSubscriptions;
    
  } catch (error) {
    console.error('❌ Error obteniendo suscripciones de BD:', error);
    return [];
  }
}

export async function sendPushNotification(vendedorId: number, payload: any) {
  try {
    // Validar vendedorId y payload
    if (!vendedorId) {
      console.log('⚠️ VendedorId no válido para push notification');
      return;
    }

    if (!payload) {
      console.log('⚠️ Payload vacío para push notification');
      return;
    }

    const subscriptions = await getSubscriptionsByVendedor(vendedorId);
    
    console.log(`📤 Enviando push a ${subscriptions.length} suscripciones del vendedor ${vendedorId}`);
    
    if (subscriptions.length === 0) {
      console.log('⚠️ No hay suscripciones válidas para el vendedor', vendedorId);
      return;
    }
    
    const invalidSubscriptions: string[] = [];
    
    const promises = subscriptions.map(async (subscription) => {
      try {
        // Validar suscripción antes de enviar
        if (!subscription?.endpoint) {
          console.log('⚠️ Suscripción con endpoint inválido');
          return;
        }

        await webpush.sendNotification(subscription, JSON.stringify(payload));
        console.log('✅ Push enviado correctamente');
      } catch (error: any) {
        console.error('❌ Error enviando push:', error.message);
        
        // Marcar para limpieza si es error de suscripción inválida
        if (error.statusCode === 410 || error.statusCode === 404) {
          if (subscription?.endpoint) {
            invalidSubscriptions.push(subscription.endpoint);
          }
        }
      }
    });
    
    await Promise.all(promises);
    
    // Limpiar suscripciones inválidas
    if (invalidSubscriptions.length > 0) {
      await cleanupInvalidSubscriptions(invalidSubscriptions);
    }
    
  } catch (error) {
    console.error('❌ Error general enviando push notifications:', error);
  }
}

async function cleanupInvalidSubscriptions(endpoints: string[]) {
  try {
    if (!endpoints || endpoints.length === 0) {
      return;
    }

    const query = `DELETE FROM push_subscriptions WHERE endpoint IN (${endpoints.map(() => '?').join(',')})`;
    await db.execute(query, endpoints);
    console.log(`🧹 Eliminadas ${endpoints.length} suscripciones inválidas`);
  } catch (error) {
    console.error('❌ Error limpiando suscripciones inválidas:', error);
  }
}

export async function deleteSubscription(endpoint: string) {
  try {
    if (!endpoint) {
      console.log('⚠️ Endpoint vacío para eliminar suscripción');
      return;
    }

    const query = `DELETE FROM push_subscriptions WHERE endpoint = ?`;
    await db.execute(query, [endpoint]);
    console.log('🗑️ Suscripción eliminada de BD');
  } catch (error) {
    console.error('❌ Error eliminando suscripción:', error);
  }
}