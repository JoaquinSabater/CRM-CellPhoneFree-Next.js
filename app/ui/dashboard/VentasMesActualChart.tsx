'use client'

import { useEffect, useRef, useState } from 'react'
import { Chart, registerables, ChartConfiguration } from 'chart.js'

Chart.register(...registerables)

interface Props {
  vendedorId: number
}

export default function VentasMesActualChart({ vendedorId }: Props) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<Chart | null>(null)
  const [dataCargada, setDataCargada] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
        const hoy = new Date()
        const anio = hoy.getFullYear()
        const mes = hoy.getMonth() // ⚠️ 0-indexado: enero = 0, diciembre = 11
        const mesString = String(mes + 1).padStart(2, '0')
        const mesActual = `${anio}-${mesString}`
        const diaHoy = hoy.getDate()

        const totalDiasDelMes = new Date(anio, mes + 1, 0).getDate()

      const res = await fetch(
        `https://cellphonefree.com.ar/accesorios/Sistema/scrphp/api/estadisticas/obtener_performance.php?token=fe3493287c3a953cae08234baa2097ba896033989eb3f61fe6f6402ecbf465a7&vendedor_id=${vendedorId}&mes=${mesActual}`
      )

      const json = await res.json()

      if (!json.success || !json.data?.ventas) return

      const totalVentas = Number(json.data.ventas.total)
      const objetivo = Number(json.data.ventas.objetivo ?? 0)

      // Generar días del mes actual hasta hoy
      const dias = Array.from({ length: diaHoy }, (_, i) => (i + 1).toString())

      // Distribuir ventas linealmente (simulado)
      const ventasPorDia = dias.map((_, i) =>
        Number(((totalVentas / diaHoy) * (i + 1)).toFixed(2))
      )

      const lineaObjetivo = dias.map(() => objetivo)

      // Destruir gráfico anterior si existe
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }

      const ctx = chartRef.current?.getContext('2d')
      if (!ctx) return

      const config: ChartConfiguration<'line'> = {
        type: 'line',
        data: {
          labels: dias.map(d => `Día ${d}`),
          datasets: [
            {
              label: 'Ventas acumuladas',
              data: ventasPorDia,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'transparent',
              borderWidth: 2,
              tension: 0.3,
              pointRadius: 2,
              pointHoverRadius: 4,
              fill: false,
            },
            {
              label: 'Objetivo del mes',
              data: lineaObjetivo,
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'transparent',
              borderWidth: 2,
              tension: 0.3,
              pointRadius: 2,
              pointHoverRadius: 4,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: { top: 8, bottom: 0, left: 8, right: 8 },
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 12,
                font: { size: 12 },
              },
            },
            title: {
              display: true,
              text: 'Progreso mensual actual',
              font: { size: 14 },
            },
          },
          scales: {
            x: {
              ticks: {
                font: { size: 11 },
                maxRotation: 0,
                minRotation: 0,
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                callback: (val) =>
                  `$${Number(val).toLocaleString('es-AR')}`,
                font: { size: 11 },
              },
            },
          },
        },
      }

      chartInstanceRef.current = new Chart(ctx, config)
      setDataCargada(true)
    }

    fetchData()
  }, [vendedorId])

  return (
    <div className="bg-white rounded-lg p-4 border shadow-sm mt-6 w-full">
      {!dataCargada && (
        <p className="text-sm text-gray-500">Cargando gráfico del mes actual...</p>
      )}
      <div className="relative w-full h-[220px]">
        <canvas ref={chartRef} className="!w-full !h-full" />
      </div>
    </div>
  )
}
