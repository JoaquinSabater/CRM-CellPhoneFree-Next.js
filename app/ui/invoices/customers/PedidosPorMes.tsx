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
  cantidad: number;
};

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function PedidosPorMes({ clienteId }: { clienteId: number }) {
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/cliente-pedidos?id=${clienteId}`);
        const result = await res.json();
        setData(
          result.map((d: any) => ({
            ...d,
            cantidad: Number(d.cantidad) || 0,
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
  if (data.length === 0) return <p className="text-sm text-gray-500 mt-2">Este cliente no tiene pedidos recientes.</p>;

  // Preparar datos para Chart.js
  const labels = data.map(d => {
    const [year, month] = d.mes.split('-');
    return `${MONTHS[+month - 1]} ${year}`;
  });
  const cantidades = data.map(d => d.cantidad);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Pedidos',
        data: cantidades,
        borderColor: '#ea580c', // naranja fuerte
        backgroundColor: 'rgba(234, 88, 12, 0.2)', // naranja suave
        pointBackgroundColor: '#ea580c',
        pointBorderColor: '#ea580c',
        pointRadius: 8,
        pointHoverRadius: 10,
        fill: false,
        stepped: true, // Línea escalonada
        tension: 0, // recto
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
        text: 'Pedidos por mes (últimos 12 meses)',
        font: { size: 18 },
      },
    },
    scales: {
      y: {
        type: 'linear',
        beginAtZero: true,
        suggestedMin: 0,
        ticks: {
          stepSize: 1, // Solo enteros
          callback: (value: string | number) => `${value}`,
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