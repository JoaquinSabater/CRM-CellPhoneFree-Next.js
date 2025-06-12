'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title)

type Props = {
  vendedorId: number
}

export default function BarrasClientesPorVendedor({ vendedorId }: Props) {
  const [activos, setActivos] = useState<number | null>(null)
  const [inactivos, setInactivos] = useState<number | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          `https://cellphonefree.com.ar/accesorios/Sistema/scrphp/api/estadisticas/obtener_performance.php?token=fe3493287c3a953cae08234baa2097ba896033989eb3f61fe6f6402ecbf465a7&vendedor_id=${vendedorId}`
        )
        const json = await res.json()
        const data = json.data?.clientes ?? json.data?.vendedores?.[0]?.clientes
        setActivos(data?.activos ?? 0)
        setInactivos(data?.inactivos ?? 0)
      } catch (error) {
        setActivos(0)
        setInactivos(0)
      }
    }

    fetchData()
  }, [vendedorId])

  if (activos === null || inactivos === null) {
    return (
      <div className="bg-white rounded-lg p-4 border shadow-sm mt-6 w-full">
        <p className="text-sm text-gray-500">Cargando gráfico de clientes...</p>
        <div className="relative w-full h-[220px]">
          {/* Canvas reservado para evitar layout shift */}
        </div>
      </div>
    )
  }

  const data = {
    labels: ['Activos', 'Inactivos'],
    datasets: [
      {
        label: 'Clientes',
        data: [activos, inactivos],
        backgroundColor: ['#4FD1C5', '#F687B3'],
        borderWidth: 1,
        borderRadius: 12,
        barThickness: 25, // Más grueso
        maxBarThickness: 56,
        minBarLength: 6,
      },
    ],
  }

  const options = {
    indexAxis: 'y' as const,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Clientes activos vs inactivos',
        font: { size: 18 },
        padding: { bottom: 10 },
      },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { font: { size: 15 } },
        grid: { color: '#eee' },
      },
      y: {
        ticks: { font: { size: 15 } },
        grid: { color: '#eee' },
      },
    },
    layout: { padding: { left: 8, right: 8, top: 0, bottom: 0 } },
    animation: { duration: 700 },
  }

  return (
    <div className="bg-white rounded-lg p-4 border shadow-sm mt-6 w-full">
      <div className="relative w-full h-[220px]">
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}

