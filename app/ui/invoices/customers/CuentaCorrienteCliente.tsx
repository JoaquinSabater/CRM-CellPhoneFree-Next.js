'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { solicitarCuentaCorriente } from '@/app/lib/cuenta-corriente-actions';
import type { SolicitudCuentaCorriente } from '@/app/lib/cuenta-corriente';

const formatearFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function CuentaCorrienteCliente({
  clienteId,
  solicitud,
}: {
  clienteId: number;
  solicitud: SolicitudCuentaCorriente | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const solicitar = () => {
    setError('');
    setMensaje('');
    startTransition(async () => {
      const resultado = await solicitarCuentaCorriente(clienteId);
      if (resultado.ok) {
        setMensaje(resultado.mensaje);
        router.refresh();
      } else {
        setError(resultado.error);
      }
    });
  };

  const puedeSolicitar = !solicitud || solicitud.estado === 'rechazada';

  return (
    <div className="mt-8">
      <h3 className="text-md font-semibold text-gray-800 mb-4">💳 Cuenta Corriente</h3>
      <div className="p-4 bg-white rounded-lg border space-y-3">
        {solicitud?.estado === 'aceptada' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800 space-y-1">
            <p className="font-semibold">✅ El cliente tiene cuenta corriente</p>
            <p className="text-xs text-green-700">Solicitada: {formatearFecha(solicitud.fecha_solicitud)}</p>
            {solicitud.fecha_aceptacion && (
              <p className="text-xs text-green-700">Aceptada: {formatearFecha(solicitud.fecha_aceptacion)}</p>
            )}
          </div>
        )}

        {solicitud?.estado === 'pendiente' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 space-y-1">
            <p className="font-semibold">⏳ Pendiente de aprobación del líder de ventas</p>
            <p className="text-xs text-yellow-700">
              Solicitada: {formatearFecha(solicitud.fecha_solicitud)}
              {solicitud.solicitado_por ? ` por ${solicitud.solicitado_por}` : ''}
            </p>
          </div>
        )}

        {solicitud?.estado === 'rechazada' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 space-y-1">
            <p className="font-semibold">❌ La última solicitud fue rechazada</p>
            {solicitud.fecha_rechazo && (
              <p className="text-xs">Rechazada: {formatearFecha(solicitud.fecha_rechazo)}</p>
            )}
          </div>
        )}

        {puedeSolicitar && (
          <>
            <p className="text-sm text-gray-600">
              Pedí el alta de cuenta corriente para este cliente. El líder de ventas tiene que aceptarla desde el inicio.
            </p>
            <button
              type="button"
              onClick={solicitar}
              disabled={isPending}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Enviando...' : '💳 Solicitar alta de cuenta corriente'}
            </button>
          </>
        )}

        {mensaje && <p className="text-sm text-green-700">{mensaje}</p>}
        {error && <p className="text-sm text-red-600">❌ {error}</p>}
      </div>
    </div>
  );
}
