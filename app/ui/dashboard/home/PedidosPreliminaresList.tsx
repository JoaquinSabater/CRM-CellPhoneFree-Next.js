'use client';

import { useState } from 'react';

interface PedidoPreliminar {
  id: number;
  fecha_creacion: string;
  estado: string;
  observaciones_generales: string;
  cliente_id: number;
  cliente_nombre: string;
  total_items: number;
  valor_estimado: number;
}

interface DetallePedido {
  id: number;
  articulo_codigo_interno: string;
  item_nombre: string;
  modelo: string;
  marca_nombre: string;
  cantidad_solicitada: number;
  precio_unitario: number;
  sugerencia?: string;
}

export default function PedidosPreliminaresList({ pedidos }: { pedidos: PedidoPreliminar[] }) {
  const [pedidoExpandido, setPedidoExpandido] = useState<number | null>(null);
  const [detalleCargando, setDetalleCargando] = useState(false);
  const [detalleItems, setDetalleItems] = useState<DetallePedido[]>([]);

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(precio);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'borrador': return 'bg-yellow-100 text-yellow-800';
      case 'enviado': return 'bg-blue-100 text-blue-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'borrador': return 'Borrador';
      case 'enviado': return 'Enviado';
      case 'cancelado': return 'Cancelado';
      default: return estado;
    }
  };

  const handleVerDetalle = async (pedidoId: number) => {
    if (pedidoExpandido === pedidoId) {
      setPedidoExpandido(null);
      setDetalleItems([]);
      return;
    }

    setDetalleCargando(true);
    try {
      const response = await fetch(`/api/pedidos-preliminares/${pedidoId}`);
      if (!response.ok) {
        throw new Error('Error al cargar detalle');
      }
      const detalle = await response.json();
      setDetalleItems(detalle);
      setPedidoExpandido(pedidoId);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
    } finally {
      setDetalleCargando(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          📋 Pedidos Preliminares Activos
        </h2>
        <span className="text-sm text-gray-500">
          {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}
        </span>
      </div>

      {pedidos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-sm">No hay pedidos preliminares activos</p>
        </div>
      ) : (
        <div 
          className="space-y-3 overflow-y-auto pr-2"
          style={{ 
            maxHeight: pedidos.length > 3 ? '400px' : 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: '#F97316 #f1f5f9'
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              width: 6px;
            }
            div::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 3px;
            }
            div::-webkit-scrollbar-thumb {
              background: #F97316;
              border-radius: 3px;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: #ea580c;
            }
          `}</style>

          {pedidos.map((pedido) => (
            <div
              key={pedido.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Información básica del pedido */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium text-gray-900">
                      {pedido.cliente_nombre}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(pedido.estado)}`}>
                      {getEstadoTexto(pedido.estado)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pedido #{pedido.id} • {formatearFecha(pedido.fecha_creacion)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="text-sm">
                  <span className="text-gray-500">Items:</span>
                  <span className="ml-1 font-medium">{pedido.total_items}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Valor estimado:</span>
                  <span className="ml-1 font-medium text-green-600">
                    {formatearPrecio(pedido.valor_estimado)}
                  </span>
                </div>
              </div>

              {pedido.observaciones_generales && (
                <div className="mb-3">
                  <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded italic">
                    "{pedido.observaciones_generales}"
                  </p>
                </div>
              )}

              {/* Botón Ver Detalle */}
              <div className="flex justify-center">
                <button
                  onClick={() => handleVerDetalle(pedido.id)}
                  disabled={detalleCargando}
                  className={`text-xs px-4 py-2 rounded transition-colors flex items-center gap-2 ${
                    pedidoExpandido === pedido.id
                      ? 'bg-gray-500 text-white hover:bg-gray-600'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  {detalleCargando && pedidoExpandido === pedido.id ? (
                    <>
                      <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></div>
                      Cargando...
                    </>
                  ) : pedidoExpandido === pedido.id ? (
                    <>
                      ▲ Ocultar detalle
                    </>
                  ) : (
                    <>
                      ▼ Ver detalle
                    </>
                  )}
                </button>
              </div>

              {/* Detalle expandible */}
              {pedidoExpandido === pedido.id && detalleItems.length > 0 && (
                <div className="mt-4 border-t pt-4 bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-800 mb-3 text-sm">Detalle del pedido:</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {detalleItems.map((item, index) => (
                      <div key={index} className="bg-white p-3 rounded border text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium">{item.item_nombre}</span>
                            <div className="text-gray-600">
                              {item.marca_nombre} {item.modelo}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {item.cantidad_solicitada} unidades
                            </div>
                            <div className="text-green-600">
                              {formatearPrecio(item.precio_unitario || 0)} c/u
                            </div>
                          </div>
                        </div>
                        {item.sugerencia && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                            <strong>Sugerencia:</strong> {item.sugerencia}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}