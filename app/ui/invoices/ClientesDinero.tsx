'use client';

import { useEffect, useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';

type MonthData = {
  mes: string; // formato YYYY-MM
  total: number;
};

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function ClientesDinero({ clienteId }: { clienteId: number }) {
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/cliente-gasto?id=${clienteId}`);
        const result = await res.json();
        setData(
          result.map((d: any) => ({
            ...d,
            total: Number(d.total) || 0, // Asegúrate de que `total` sea un número
          }))
        );
      } catch (err) {
        console.error('Error cargando gráfico:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [clienteId]);

  if (loading) return <p>Cargando gráfico...</p>;
  if (data.length === 0) return <p className="text-sm text-gray-500 mt-2">Este cliente no tiene compras recientes.</p>;

  const chartHeight = 200;
  const maxTotal = Math.max(...data.map(d => d.total));
  const steps = 5;
  const stepValue = maxTotal / steps;

  const yAxisLabels = Array.from({ length: steps + 1 }, (_, i) => (stepValue * i).toFixed(0)).reverse();

  return (
    <div className="rounded-lg bg-gray-50 p-4 shadow-sm">
      <h3 className="text-md font-semibold text-gray-800 mb-4">Compras por mes (últimos 12 meses)</h3>
      <div className="grid grid-cols-12 items-end gap-4">
        {/* Eje Y */}
        <div className="hidden sm:flex flex-col justify-between text-sm text-gray-600 h-[200px] pr-4">
          {yAxisLabels.map((label) => (
            <p key={label}>${label}</p>
          ))}
        </div>

        {/* Barras */}
        {data.map((d) => {
          const [year, month] = d.mes.split('-');
          const total = Number(d.total) || 0; // Asegúrate de que sea un número
          const height = (total / maxTotal) * chartHeight;
          return (
            <div key={d.mes} className="flex flex-col items-center gap-1">
              {/* Importe arriba de la barra */}
              <span className="text-xs text-gray-800 font-medium">${total.toFixed(2)}</span>
              {/* Barra */}
              <div
                className="bg-orange-500 rounded w-[15px] sm:w-[20px]"
                style={{ height: `${height}px` }}
                title={`$${total.toFixed(2)}`}
              />
              {/* Etiqueta mes */}
              <p className="text-xs text-gray-600 text-center">{`${MONTHS[+month - 1]} ${year}`}</p>
            </div>
          );
        })}
      </div>
      <div className="flex items-center pt-4">
        <CalendarIcon className="h-5 w-5 text-gray-500" />
        <p className="ml-2 text-sm text-gray-500">Últimos 12 meses</p>
      </div>
    </div>
  );
}
