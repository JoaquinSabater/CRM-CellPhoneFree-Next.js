'use client'

import { useEffect, useRef, useState } from 'react'
import { Chart, registerables, ChartConfiguration } from 'chart.js'

Chart.register(...registerables)

interface Props {
  vendedorId: number
}

type MesVenta = {
  mes: string
  total: number
  objetivo: number
}

function getUltimosMesesDesdeAntiguedad(antiguedad: number): string[] {
  const hoy = new Date()
  const meses: string[] = []

  for (let i = antiguedad; i >= 1; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    meses.push(d.toISOString().slice(0, 7))
  }

  return meses
}

export default function VentasHistoricasChart({ vendedorId }: Props) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<Chart | null>(null)
  const [dataCargada, setDataCargada] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const actual = new Date()
      const apiMesActual = `${actual.getFullYear()}-${String(actual.getMonth() + 1).padStart(2, '0')}`

      const primerRes = await fetch(
        `https://cellphonefree.com.ar/accesorios/Sistema/scrphp/api/estadisticas/obtener_performance.php?token=fe3493287c3a953cae08234baa2097ba896033989eb3f61fe6f6402ecbf465a7&vendedor_id=${vendedorId}`
      )
      const primerJson = await primerRes.json()
      const antiguedad = primerJson.data?.vendedor?.meses_antiguedad ?? 1

      const meses = getUltimosMesesDesdeAntiguedad(antiguedad)

      const resultados: MesVenta[] = []

      for (const mes of meses) {
        if (mes === apiMesActual) continue

        const res = await fetch(
          `https://cellphonefree.com.ar/accesorios/Sistema/scrphp/api/estadisticas/obtener_performance.php?token=fe3493287c3a953cae08234baa2097ba896033989eb3f61fe6f6402ecbf465a7&vendedor_id=${vendedorId}&mes=${mes}`
        )
        const json = await res.json()

        if (
          json.success &&
          json.data?.ventas?.total != null &&
          json.data?.ventas?.objetivo != null
        ) {
          resultados.push({
            mes,
            total: Number(json.data.ventas.total),
            objetivo: Number(json.data.ventas.objetivo),
          })
        }
      }

      if (chartInstanceRef.current) chartInstanceRef.current.destroy()

      const ctx = chartRef.current?.getContext('2d')
      if (!ctx || resultados.length === 0) return

      const config: ChartConfiguration<'line'> = {
        type: 'line',
        data: {
          labels: resultados.map((v) => v.mes),
          datasets: [
            {
              label: 'Ventas',
              data: resultados.map((v) => v.total),
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'transparent',
              borderWidth: 2,
              tension: 0.3,
              pointRadius: 2,
              pointHoverRadius: 4,
              fill: false,
            },
            {
              label: 'Objetivo',
              data: resultados.map((v) => v.objetivo),
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
              text: 'Ventas vs Objetivo (histórico)',
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
                callback: (val) => `$${Number(val).toLocaleString('es-AR')}`,
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
        <p className="text-sm text-gray-500">Cargando gráfico de ventas históricas...</p>
      )}
      <div className="relative w-full h-[220px]">
        <canvas ref={chartRef} className="!w-full !h-full" />
      </div>
    </div>
  )
}
