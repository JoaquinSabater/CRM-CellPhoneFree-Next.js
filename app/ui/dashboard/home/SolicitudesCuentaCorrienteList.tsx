'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { aceptarCuentaCorriente, rechazarCuentaCorriente } from '@/app/lib/cuenta-corriente-actions';
import type { SolicitudCuentaCorriente } from '@/app/lib/cuenta-corriente';

const formatearFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function SolicitudesCuentaCorrienteList({
  solicitudes,
}: {
  solicitudes: SolicitudCuentaCorriente[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const resolver = (id: number, accion: 'aceptar' | 'rechazar') => {
    if (accion === 'rechazar' && !confirm('¿Rechazar esta solicitud de cuenta corriente?')) return;

    setError('');
    setProcesandoId(id);
    startTransition(async () => {
      const resultado = accion === 'aceptar'
        ? await aceptarCuentaCorriente(id)
        : await rechazarCuentaCorriente(id);

      if (!resultado.ok) setError(resultado.error);
      setProcesandoId(null);
      router.refresh();
    });
  };

  return (
    <div className="bg-white rounded-lg p-6 border-2 border-orange-300 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          💳 Solicitudes de Cuenta Corriente
        </h2>
        {solicitudes.length > 0 && (
          <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
            {solicitudes.length} pendiente{solicitudes.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">❌ {error}</p>}

      {solicitudes.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">No hay solicitudes pendientes</p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {solicitudes.map((s) => {
            const procesando = isPending && procesandoId === s.id;

            return (
              <div
                key={s.id}
                className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/invoices/${s.cliente_id}/edit?from=dashboard`}
                    className="font-semibold text-gray-800 hover:text-orange-600 break-words"
                  >
                    {s.cliente_nombre || `Cliente #${s.cliente_id}`}
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">
                    Pedida por {s.vendedor_nombre || s.solicitado_por || 'desconocido'} el {formatearFecha(s.fecha_solicitud)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => resolver(s.id, 'aceptar')}
                    disabled={isPending}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {procesando ? '...' : '✅ Aceptar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => resolver(s.id, 'rechazar')}
                    disabled={isPending}
                    className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
