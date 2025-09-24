// app/api/realtime/sse/route.ts
import { NextRequest } from 'next/server';
import { addSSEConnection, removeSSEConnection } from '@/app/lib/sse';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const vendedorId = parseInt(url.searchParams.get('vendedorId') || '0');

  if (!vendedorId) {
    return new Response('Vendedor ID requerido', { status: 400 });
  }

  console.log(`🚀 Iniciando SSE para vendedor ${vendedorId}`);

  const stream = new ReadableStream({
    start(controller) {
      // Agregar conexión SSE
      addSSEConnection(vendedorId, controller);
      
      // Enviar confirmación de conexión
      controller.enqueue(`data: ${JSON.stringify({ 
        type: 'connected', 
        vendedorId,
        timestamp: new Date().toISOString()
      })}\n\n`);
      
      // Configurar limpieza cuando se desconecte
      request.signal.addEventListener('abort', () => {
        removeSSEConnection(vendedorId, controller);
      });

      // Heartbeat cada 30 segundos para mantener conexión viva
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ 
            type: 'heartbeat', 
            timestamp: new Date().toISOString() 
          })}\n\n`);
        } catch (error) {
          console.error('❌ Error en heartbeat SSE:', error);
          clearInterval(heartbeat);
          removeSSEConnection(vendedorId, controller);
        }
      }, 30000);

      // Limpiar heartbeat si se desconecta
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}