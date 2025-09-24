// app/api/webhooks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { notifySSENewPedido } from '../realtime/sse/route';
import { sendPushNotification } from '@/app/lib/webpush';
import { getPedidosPreliminaresPorVendedor } from '@/app/lib/data';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== 'Bearer 1234567') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { pedidoPreliminarId, vendedorId, clienteId, source } = await request.json();
    
    console.log('🔔 Webhook recibido del carrito:', { 
      pedidoPreliminarId, 
      vendedorId, 
      clienteId, 
      source 
    });

    const pedidosVendedor = await getPedidosPreliminaresPorVendedor(vendedorId);
    const nuevoPedido = pedidosVendedor.find(pedido => pedido.id === pedidoPreliminarId);
    
    if (!nuevoPedido) {
      console.error('❌ Pedido no encontrado para vendedor:', { pedidoPreliminarId, vendedorId });
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    console.log('✅ Pedido encontrado en BD:', {
      id: nuevoPedido.id,
      cliente: nuevoPedido.cliente_nombre,
      items: nuevoPedido.total_items,
      valor: nuevoPedido.valor_estimado
    });

    // SSE para tiempo real
    notifySSENewPedido(vendedorId, nuevoPedido);
    console.log('📡 SSE enviado para pedido del carrito');
    
    // Web Push (usando BD)
    await sendPushNotification(vendedorId, {
      title: '🛒 Nuevo Pedido desde Carrito',
      body: `Cliente: ${nuevoPedido.cliente_nombre}\nItems: ${nuevoPedido.total_items}\nValor: $${nuevoPedido.valor_estimado?.toLocaleString() || '0'}`,
      tag: `pedido-carrito-${nuevoPedido.id}`,
      data: { 
        pedidoId: nuevoPedido.id, 
        vendedorId: vendedorId,
        source: 'carrito'
      }
    });
    
    console.log('✅ Notificaciones del carrito enviadas correctamente');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Pedido procesado y notificaciones enviadas'
    });
    
  } catch (error) {
    console.error('❌ Error procesando webhook del carrito:', error);
    return NextResponse.json(
      { error: 'Error interno del webhook' }, 
      { status: 500 }
    );
  }
}