'use client';

import { useEffect, useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  ChartOptions,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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
            total: Number(d.total) || 0,
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

  // Preparar datos para Chart.js
  const labels = data.map(d => {
    const [year, month] = d.mes.split('-');
    return `${MONTHS[+month - 1]} ${year}`;
  });
  const totals = data.map(d => d.total);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Compras',
        data: totals,
        borderColor: '#ea580c', // naranja fuerte
        backgroundColor: 'rgba(234, 88, 12, 0.2)', // naranja suave
        pointBackgroundColor: '#ea580c',
        pointBorderColor: '#ea580c',
        pointRadius: 8,
        pointHoverRadius: 10,
        fill: false,
        tension: 0, // curvas rectas
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: 'Compras por mes (últimos 12 meses)',
        font: { size: 18 },
      },
    },
    scales: {
      y: {
        type: 'linear',
        beginAtZero: true,
        suggestedMin: 0, // fuerza el inicio en 0
        ticks: {
          callback: (value: string | number) => `$${value}`,
        },
      },
    },
  };

  return (
    <div className="rounded-lg bg-gray-50 p-4 shadow-sm h-96">
      <Line data={chartData} options={options} />
      <div className="flex items-center pt-4">
        <CalendarIcon className="h-5 w-5 text-gray-500" />
        <p className="ml-2 text-sm text-gray-500">Últimos 12 meses</p>
      </div>
    </div>
  );
}