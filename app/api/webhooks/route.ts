// app/api/webhooks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { notifySSENewPedido } from '@/app/lib/sse'; // 🔄 NUEVA IMPORTACIÓN
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

    try {
      // Intentar obtener pedidos con timeout y reintentos
      const pedidosVendedor = await Promise.race([
        getPedidosPreliminaresPorVendedor(vendedorId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout BD')), 10000)
        )
      ]) as any[];

      const nuevoPedido = pedidosVendedor.find(pedido => pedido.id === pedidoPreliminarId);
      
      if (!nuevoPedido) {
        console.error('❌ Pedido no encontrado para vendedor:', { pedidoPreliminarId, vendedorId });
        
        // Enviar notificación genérica
        try {
          await sendPushNotification(vendedorId, {
            title: '🛒 Nuevo Pedido desde Carrito',
            body: `Pedido #${pedidoPreliminarId} recibido`,
            tag: `pedido-carrito-${pedidoPreliminarId}`,
            data: { pedidoId: pedidoPreliminarId, vendedorId, source: 'carrito' }
          });
        } catch (pushError) {
          console.error('❌ Error enviando push genérico:', pushError);
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Webhook procesado (pedido no encontrado pero notificación enviada)' 
        });
      }

      console.log('✅ Pedido encontrado en BD:', {
        id: nuevoPedido.id,
        cliente: nuevoPedido.cliente_nombre,
        items: nuevoPedido.total_items,
        valor: nuevoPedido.valor_estimado
      });

      // SSE para tiempo real (usando función de lib/sse.ts)
      try {
        notifySSENewPedido(vendedorId, nuevoPedido);
        console.log('📡 SSE enviado para pedido del carrito');
      } catch (sseError) {
        console.error('❌ Error enviando SSE:', sseError);
      }
      
      // Web Push
      try {
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
        console.log('✅ Push notification enviada');
      } catch (pushError) {
        console.error('❌ Error enviando push:', pushError);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Pedido procesado y notificaciones enviadas'
      });
      
    } catch (dbError: any) {
      console.error('❌ Error con BD:', dbError.message);
      
      // Enviar notificación básica aunque falle la BD
      try {
        await sendPushNotification(vendedorId, {
          title: '🛒 Nuevo Pedido desde Carrito',
          body: `Pedido #${pedidoPreliminarId} recibido (detalles no disponibles)`,
          tag: `pedido-carrito-${pedidoPreliminarId}`,
        });
      } catch (pushError) {
        console.error('❌ Error enviando push de fallback:', pushError);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook procesado con errores de BD pero notificación enviada' 
      });
    }
    
  } catch (error) {
    console.error('❌ Error procesando webhook del carrito:', error);
    return NextResponse.json(
      { error: 'Error interno del webhook' }, 
      { status: 500 }
    );
  }
}