'use client'

import { Chart, registerables } from 'chart.js'
import { useEffect, useRef, useState } from 'react'

Chart.register(...registerables)

interface Props {
  data: { semana: number; cantidad: number }[]
}

export default function GraficoPedidosPorSemana({ data }: Props) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<Chart | null>(null)

  const labels = data.map((d) => `Semana ${d.semana}`)
  const valores = data.map((d) => d.cantidad)

  useEffect(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy()
    }

    const ctx = chartRef.current?.getContext('2d')
    if (!ctx) return

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Pedidos por semana',
            data: valores,
            borderColor: 'rgb(255, 85, 17)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            tension: 0.3,
            pointRadius: 3,
            borderWidth: 2,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Pedidos (últimas 4 semanas)',
            font: { size: 14 },
          },
        },
        layout: {
          padding: { top: 8, bottom: 0, left: 8, right: 8 },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: { size: 11 },
            },
          },
          x: {
            ticks: {
              font: { size: 11 },
            },
          },
        },
      },
    })
  }, [labels, valores])

  return (
    <div className="bg-white rounded-lg p-4 border shadow-sm mt-6 w-full">
      <div className="relative w-full h-[220px]">
        <canvas ref={chartRef} className="!w-full !h-full" />
      </div>
    </div>
  )
}
