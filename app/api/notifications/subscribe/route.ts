// app/api/notifications/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { saveSubscription, deleteSubscription } from '@/app/lib/webpush';

export async function POST(request: NextRequest) {
  try {
    const { subscription, vendedorId } = await request.json();
    
    console.log('📝 Nueva suscripción para vendedor:', vendedorId);
    
    if (!subscription || !vendedorId) {
      return NextResponse.json(
        { error: 'Datos de suscripción inválidos' }, 
        { status: 400 }
      );
    }
    
    await saveSubscription(vendedorId, subscription);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Suscripción guardada correctamente' 
    });
    
  } catch (error) {
    console.error('❌ Error guardando suscripción:', error);
    return NextResponse.json(
      { error: 'Error guardando suscripción' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json();
    
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint requerido' }, { status: 400 });
    }
    
    await deleteSubscription(endpoint);
    
    return NextResponse.json({ success: true, message: 'Suscripción eliminada' });
    
  } catch (error) {
    console.error('❌ Error eliminando suscripción:', error);
    return NextResponse.json({ error: 'Error eliminando suscripción' }, { status: 500 });
  }
}