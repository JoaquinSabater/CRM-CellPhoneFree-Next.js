'use client';

import { useState } from 'react';
import { pedido } from '@/app/lib/definitions';

type Props = {
  pedidos: pedido[];
};

type ArticuloDetalle = {
  item_nombre: string;
  modelo: string;
  cantidad: number;
};

export default function PedidosDelCliente({ pedidos }: Props) {
  const [detalles, setDetalles] = useState<{ [key: number]: ArticuloDetalle[] }>({});
  const [abierto, setAbierto] = useState<{ [key: number]: boolean }>({});

  const handleDetalle = async (pedidoId: number) => {
    setAbierto((prev) => ({ ...prev, [pedidoId]: !prev[pedidoId] }));
    if (!detalles[pedidoId]) {
      const res = await fetch(`/api/pedidos/${pedidoId}/articulos`);
      const data = await res.json();
      setDetalles((prev) => ({ ...prev, [pedidoId]: data }));
    }
  };

  return (
    <div className="space-y-4 bg-gray-50 rounded-lg p-4 border">
      <label className="text-lg font-semibold">Pedidos del Cliente</label>
      <div className="max-h-96 overflow-y-auto space-y-3">
        {pedidos.length === 0 ? (
          <p className="text-gray-500 text-sm">Este cliente no tiene pedidos.</p>
        ) : (
          pedidos.map((p) => (
            <div key={p.id} className="text-sm text-gray-800 border-b last:border-none pb-2">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span><strong>ID:</strong> {p.id}</span>
                <span><strong>Fecha:</strong> {new Date(p.fecha_creacion).toLocaleDateString()}</span>
                <span><strong>Estado:</strong> {p.estado}</span>
                <span><strong>Armador ID:</strong> {p.armador_nombre}</span>
                <span><strong>Controlador ID:</strong> {p.controlador_nombre}</span>
                <span><strong>Remito:</strong> {p.remito ?? '—'}</span>
                <span><strong>Consolidado:</strong> {p.consolidado_id ?? '—'}</span>
                <span>
                  <strong>Armado:</strong>{' '}
                  {p.hora_inicio_armado
                    ? (typeof p.hora_inicio_armado === "string"
                        ? p.hora_inicio_armado.substring(11, 19)
                        : new Date(p.hora_inicio_armado).toLocaleTimeString())
                    : '—'} →{' '}
                  {p.hora_fin_armado
                    ? (typeof p.hora_fin_armado === "string"
                        ? p.hora_fin_armado.substring(11, 19)
                        : new Date(p.hora_fin_armado).toLocaleTimeString())
                    : '—'}
                </span>
                <span>
                  <strong>Control:</strong>{' '}
                  {p.hora_inicio_control
                    ? (typeof p.hora_inicio_control === "string"
                        ? p.hora_inicio_control.substring(11, 19)
                        : new Date(p.hora_inicio_control).toLocaleTimeString())
                    : '—'} →{' '}
                  {p.hora_fin_control
                    ? (typeof p.hora_fin_control === "string"
                        ? p.hora_fin_control.substring(11, 19)
                        : new Date(p.hora_fin_control).toLocaleTimeString())
                    : '—'}
                </span>
                <button
                  className="ml-2 px-2 py-1 bg-orange-500 text-white rounded text-xs"
                  onClick={() => handleDetalle(p.id)}
                  type="button"
                >
                  {abierto[p.id] ? 'Ocultar' : 'Detalle'}
                </button>
              </div>
              {abierto[p.id] && (
                <div className="mt-2 ml-4">
                  {!detalles[p.id] ? (
                    <span className="text-gray-500 text-xs">Cargando...</span>
                  ) : detalles[p.id].length === 0 ? (
                    <span className="text-gray-500 text-xs">No hay artículos.</span>
                  ) : (
                    <table className="text-xs mt-2 border">
                      <thead>
                        <tr>
                          <th className="px-2 py-1 border">Modelo</th>
                          <th className="px-2 py-1 border">Item</th>
                          <th className="px-2 py-1 border">Cantidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalles[p.id].map((a, idx) => (
                          <tr key={idx}>
                            <td className="px-2 py-1 border">{a.modelo}</td>
                            <td className="px-2 py-1 border">{a.item_nombre}</td>
                            <td className="px-2 py-1 border">{a.cantidad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}


