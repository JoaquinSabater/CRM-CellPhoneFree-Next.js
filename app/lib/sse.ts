// app/lib/sse.ts
// Mapa para conexiones SSE por vendedor
const sseConnectionsByVendedor = new Map<number, Set<ReadableStreamDefaultController>>();

// Agregar conexión SSE
export function addSSEConnection(vendedorId: number, controller: ReadableStreamDefaultController) {
  if (!sseConnectionsByVendedor.has(vendedorId)) {
    sseConnectionsByVendedor.set(vendedorId, new Set());
  }
  sseConnectionsByVendedor.get(vendedorId)!.add(controller);
  console.log(`🔗 SSE conectado para vendedor ${vendedorId}. Total conexiones: ${sseConnectionsByVendedor.get(vendedorId)!.size}`);
}

// Remover conexión SSE
export function removeSSEConnection(vendedorId: number, controller: ReadableStreamDefaultController) {
  const connections = sseConnectionsByVendedor.get(vendedorId);
  if (connections) {
    connections.delete(controller);
    if (connections.size === 0) {
      sseConnectionsByVendedor.delete(vendedorId);
    }
    console.log(`❌ SSE desconectado para vendedor ${vendedorId}. Conexiones restantes: ${connections.size}`);
  }
}

// Función para notificar via SSE (actualiza UI inmediatamente)
export function notifySSENewPedido(vendedorId: number, pedido: any) {
  console.log(`📡 Enviando SSE a vendedor ${vendedorId}:`, { id: pedido.id, cliente: pedido.cliente_nombre });
  
  const connections = sseConnectionsByVendedor.get(vendedorId);
  if (!connections || connections.size === 0) {
    console.log(`⚠️ No hay conexiones SSE para vendedor ${vendedorId}`);
    return;
  }

  const message = JSON.stringify({
    type: 'new_pedido_preliminar',
    data: pedido,
    timestamp: new Date().toISOString()
  });

  const toRemove: ReadableStreamDefaultController[] = [];

  connections.forEach(controller => {
    try {
      controller.enqueue(`data: ${message}\n\n`);
      console.log(`✅ SSE enviado a vendedor ${vendedorId}`);
    } catch (error) {
      console.error(`❌ Error enviando SSE:`, error);
      toRemove.push(controller);
    }
  });

  // Limpiar conexiones que fallaron
  toRemove.forEach(controller => {
    connections.delete(controller);
  });

  console.log(`📊 SSE Stats - Vendedor ${vendedorId}: ${connections.size} conexiones activas`);
}

// Función para obtener estadísticas de conexiones
export function getSSEStats() {
  const stats = Array.from(sseConnectionsByVendedor.entries()).map(([vendedorId, connections]) => ({
    vendedorId,
    connections: connections.size
  }));
  
  return {
    totalVendedores: sseConnectionsByVendedor.size,
    totalConexiones: Array.from(sseConnectionsByVendedor.values()).reduce((sum, set) => sum + set.size, 0),
    porVendedor: stats
  };
}