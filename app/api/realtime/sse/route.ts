import { NextRequest } from 'next/server';

// Mapa para conexiones SSE por vendedor
const sseConnectionsByVendedor = new Map<number, Set<ReadableStreamDefaultController>>();

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const vendedorId = parseInt(url.searchParams.get('vendedorId') || '0');

  if (!vendedorId) {
    return new Response('Vendedor ID requerido', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Agregar conexión SSE por vendedor
      if (!sseConnectionsByVendedor.has(vendedorId)) {
        sseConnectionsByVendedor.set(vendedorId, new Set());
      }
      sseConnectionsByVendedor.get(vendedorId)!.add(controller);
      
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected', vendedorId })}\n\n`);
      console.log(`🔗 SSE conectado para vendedor ${vendedorId}`);
      
      request.signal.addEventListener('abort', () => {
        const connections = sseConnectionsByVendedor.get(vendedorId);
        if (connections) {
          connections.delete(controller);
          if (connections.size === 0) {
            sseConnectionsByVendedor.delete(vendedorId);
          }
        }
        console.log(`❌ SSE desconectado para vendedor ${vendedorId}`);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// Función para notificar via SSE (actualiza UI inmediatamente)
export function notifySSENewPedido(vendedorId: number, pedido: any) {
  console.log(`📡 Enviando SSE a vendedor ${vendedorId}:`, pedido);
  
  const connections = sseConnectionsByVendedor.get(vendedorId);
  if (!connections || connections.size === 0) {
    console.log(`⚠️ No hay conexiones SSE para vendedor ${vendedorId}`);
    return;
  }

  const message = JSON.stringify({
    type: 'new_pedido_preliminar',
    data: pedido
  });

  connections.forEach(controller => {
    try {
      controller.enqueue(`data: ${message}\n\n`);
      console.log(`✅ SSE enviado a vendedor ${vendedorId}`);
    } catch (error) {
      console.error(`❌ Error enviando SSE:`, error);
      connections.delete(controller);
    }
  });
}