import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotification } from '../../notifications/subscribe/route';
import { notifySSENewPedido } from '../../realtime/sse/route';

export async function POST(request: NextRequest) {
  try {
    const pedidoData = await request.json();
    
    const nuevoPedido = {
      id: Date.now(),
      fecha_creacion: new Date().toISOString(),
      estado: 'borrador',
      observaciones_generales: pedidoData.observaciones || '',
      cliente_id: pedidoData.cliente_id,
      cliente_nombre: pedidoData.cliente_nombre,
      total_items: pedidoData.items?.length || 0,
      valor_estimado: pedidoData.valor_estimado || 0
    };
    
    // 1. Actualizar UI inmediatamente via SSE
    notifySSENewPedido(pedidoData.vendedorId, nuevoPedido);
    
    // 2. Enviar notificación push (para páginas cerradas)
    await sendPushNotification(pedidoData.vendedorId, {
      title: '🆕 Nuevo Pedido Preliminar',
      body: `Cliente: ${pedidoData.cliente_nombre}\nItems: ${pedidoData.items?.length || 0}`,
      tag: `pedido-${nuevoPedido.id}`,
      data: { pedidoId: nuevoPedido.id, vendedorId: pedidoData.vendedorId }
    });
    
    console.log('✅ Pedido creado y notificaciones enviadas');
    
    return NextResponse.json({ success: true, pedido: nuevoPedido });
    
  } catch (error) {
    console.error('❌ Error creando pedido:', error);
    return NextResponse.json({ error: 'Error al crear pedido' }, { status: 500 });
  }
}