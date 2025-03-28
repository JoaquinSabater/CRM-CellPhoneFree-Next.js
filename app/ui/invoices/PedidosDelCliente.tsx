'use client';

import { pedido } from '@/app/lib/definitions';

type Props = {
  pedidos: pedido[];
};

export default function PedidosDelCliente({ pedidos }: Props) {
  return (
    <div className="space-y-4 bg-gray-50 rounded-lg p-4 border">
      <label className="text-lg font-semibold">Pedidos del Cliente</label>

      <div className="max-h-96 overflow-y-auto space-y-3">
        {pedidos.length === 0 ? (
          <p className="text-gray-500 text-sm">Este cliente no tiene pedidos.</p>
        ) : (
          pedidos.map((p) => (
            <div
              key={p.id}
              className="text-sm text-gray-800 border-b last:border-none pb-2"
            >
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span><strong>ID:</strong> {p.id}</span>
                <span><strong>Fecha:</strong> {new Date(p.fecha_creacion).toLocaleDateString()}</span>
                <span><strong>Estado:</strong> {p.estado}</span>
                <span><strong>Armador ID:</strong> {p.armador_id}</span>
                <span><strong>Controlador ID:</strong> {p.controlador_id}</span>
                <span><strong>Remito:</strong> {p.remito || '—'}</span>
                <span><strong>Consolidado:</strong> {p.consolidado_id}</span>
                <span></span><strong>Armado:</strong> {p.hora_inicio_armado} → {p.hora_fin_armado}<span></span>
                <span></span><strong> Control:</strong> {p.hora_inicio_control} → {p.hora_fin_control}<span></span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


