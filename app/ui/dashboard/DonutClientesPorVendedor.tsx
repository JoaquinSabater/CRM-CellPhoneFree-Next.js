'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, Title)

type Props = {
  vendedorId: number
}

export default function DonutClientesPorVendedor({ vendedorId }: Props) {
  const [activos, setActivos] = useState<number | null>(null)
  const [inactivos, setInactivos] = useState<number | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          `https://cellphonefree.com.ar/accesorios/Sistema/scrphp/api/estadisticas/obtener_performance.php?token=fe3493287c3a953cae08234baa2097ba896033989eb3f61fe6f6402ecbf465a7&vendedor_id=${vendedorId}`
        )
        const json = await res.json()
        if (json.success) {
          const data = json.data?.clientes
          setActivos(data?.activos || 0)
          setInactivos(data?.inactivos || 0)
        }
      } catch (error) {
        console.error('Error cargando datos del gráfico:', error)
      }
    }

    fetchData()
  }, [vendedorId])

  if (activos === null || inactivos === null) {
    return <div className="text-sm text-gray-500">Cargando gráfico...</div>
  }

  const data = {
    labels: ['Activos', 'Inactivos'],
    datasets: [
      {
        label: 'Clientes',
        data: [activos, inactivos],
        backgroundColor: ['#4FD1C5', '#F687B3'],
        borderWidth: 1,
      },
    ],
  }

    const options = {
        responsive: true,
        cutout: '70%', // antes era '60%'
        layout: {
            padding: -11,
        },
        plugins: {
            legend: {
            position: 'bottom' as const,
            },
            title: {
            display: true,
            text: 'Clientes activos vs inactivos',
            font: { size: 14 },
            },
        },
    }
    console.log("API response", data);
  return (
    <div className="w-full flex justify-center items-center">
      <div className="max-w-[220px] w-full">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  )
}
