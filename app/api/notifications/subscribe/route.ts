import { NextRequest, NextResponse } from 'next/server';

const subscriptionsByVendedor = new Map<number, PushSubscription[]>();

export async function POST(request: NextRequest) {
  try {
    const { subscription, vendedorId } = await request.json();
    
    console.log('📝 Nueva suscripción para vendedor:', vendedorId);
    
    if (!subscriptionsByVendedor.has(vendedorId)) {
      subscriptionsByVendedor.set(vendedorId, []);
    }
    
    const vendedorSubs = subscriptionsByVendedor.get(vendedorId)!;
    
    const exists = vendedorSubs.some(sub => sub.endpoint === subscription.endpoint);
    if (!exists) {
      vendedorSubs.push(subscription);
    }
    
    console.log(`✅ Suscripciones activas para vendedor ${vendedorId}:`, vendedorSubs.length);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error guardando suscripción:', error);
    return NextResponse.json({ error: 'Error guardando suscripción' }, { status: 500 });
  }
}

export async function sendPushNotification(vendedorId: number, payload: any) {
  const webpush = require('web-push');
  
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const subscriptions = subscriptionsByVendedor.get(vendedorId) || [];
  
  console.log(`📤 Enviando push a ${subscriptions.length} suscripciones del vendedor ${vendedorId}`);
  
  const promises = subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      console.log('✅ Push enviado correctamente');
    } catch (error) {
      console.error('❌ Error enviando push:', error);
      const index = subscriptions.indexOf(subscription);
      if (index > -1) {
        subscriptions.splice(index, 1);
      }
    }
  });
  
  await Promise.all(promises);
}