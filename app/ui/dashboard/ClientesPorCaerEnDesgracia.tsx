'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Cliente = {
  cliente_id: number;
  cliente_nombre: string;
  ultima_compra: string;
};

function formatearFecha(fecha: string): string {
  const d = new Date(fecha);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function diasHastaInactivo(ultimaCompra: string): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const fechaUltima = new Date(ultimaCompra).setHours(0, 0, 0, 0);
  const hoy = new Date().setHours(0, 0, 0, 0);
  const diff = Math.floor((hoy - fechaUltima) / MS_PER_DAY);
  return Math.max(1, 60 - diff); // ⬅️ ahora nunca será menos de 1
}

type Props = {
  vendedorId: number;
};

export default function ClientesPorCaerEnDesgracia({ vendedorId }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dias = 40;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/clientes-en-desgracia?vendedorId=${vendedorId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClientes(data);
          setError(null);
        } else {
          setError(data.error || 'Error desconocido');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Error al obtener los clientes');
        setLoading(false);
      });
  }, [vendedorId]);

  if (loading) {
    return <div className="p-4">Cargando clientes por caer en desgracia...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (!clientes.length) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        No hay clientes por caer en desgracia (sin compras hace más de <b>{dias}</b> días).
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-0 border shadow-sm mt-6 w-full">
      <div className="px-6 py-3 border-b flex items-center gap-2">
        <span className="text-orange-600 text-lg">🕒</span>
        <h3 className="font-bold text-gray-700 text-base">
          Clientes por caer en desgracia <span className="font-normal text-gray-500">(última compra entre 40 y 60 días)</span>
        </h3>
      </div>
      <div
        className={`overflow-x-auto ${clientes.length > 4 ? 'max-h-64 overflow-y-auto' : ''}`}
      >
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-2 text-left font-semibold text-gray-500">Cliente</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-500">Última compra</th>
              <th className="px-4 py-2 text-center font-semibold text-gray-500">Días hasta inactivo</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((row) => {
              const diasFaltan = diasHastaInactivo(row.ultima_compra);
              return (
                <tr key={row.cliente_id} className="even:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Link
                      href={`/dashboard/invoices/${row.cliente_id}/edit?from=dashboard`}
                      target="_blank"
                      className="font-bold text-blue-700 hover:underline"
                    >
                      {row.cliente_nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                    {formatearFecha(row.ultima_compra)}
                  </td>
                    <td className="px-4 py-2 text-center align-middle">
                      <span
                        className={`font-semibold ${
                          diasFaltan < 5 ? 'text-red-600' : 'text-orange-700'
                        }`}
                      >
                        {diasFaltan}
                      </span>
                    </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
