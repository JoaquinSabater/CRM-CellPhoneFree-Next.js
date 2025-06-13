'use client'

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Paleta de colores pro, para distinguir vendedores
const COLORS = [
  "#06b6d4", "#6366f1", "#f59e42", "#f43f5e", "#22c55e",
  "#c026d3", "#eab308", "#0ea5e9", "#ef4444", "#14b8a6",
];

function getUltimosMeses(cantidad = 4): string[] {
  const meses: string[] = [];
  const today = new Date();
  for (let i = cantidad - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    meses.push(date.toISOString().slice(0, 7)); // "YYYY-MM"
  }
  return meses;
}

async function getVendedores() {
  const res = await fetch(
    "https://cellphonefree.com.ar/accesorios/Sistema/scrphp/api/estadisticas/obtener_performance.php?token=fe3493287c3a953cae08234baa2097ba896033989eb3f61fe6f6402ecbf465a7",
    { cache: "no-store" }
  );
  const json = await res.json();
  return json.data?.vendedores.map((v: any) => ({
    id: v.vendedor.id,
    nombre: v.vendedor.nombre,
  })) || [];
}

async function getVentasPorMesYVendedor(vendedorId: number, mes: string) {
  const res = await fetch(
    `https://cellphonefree.com.ar/accesorios/Sistema/scrphp/api/estadisticas/obtener_performance.php?token=fe3493287c3a953cae08234baa2097ba896033989eb3f61fe6f6402ecbf465a7&vendedor_id=${vendedorId}&mes=${mes}`,
    { cache: "no-store" }
  );
  const json = await res.json();
  return {
    total: Number(json.data?.ventas?.total || 0),
    objetivo: Number(json.data?.ventas?.objetivo || 0),
    porcentaje: Number(json.data?.ventas?.porcentaje_alcanzado || 0),
  };
}

function formatMes(mes: string) {
  // Convierte "2024-11" en "Nov 2024"
  const [anio, mesN] = mes.split("-");
  return (
    new Date(Number(anio), Number(mesN) - 1)
      .toLocaleDateString("es-AR", { month: "short", year: "numeric" })
      .replace(".", "")
  );
}

export default function GraficoEvolucionVendedores() {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const vendedores = await getVendedores();
      const meses = getUltimosMeses(4);

      // Parallel fetch: para cada vendedor, traé sus 4 meses en paralelo
    interface Vendedor {
      id: number;
      nombre: string;
    }

    interface VentaPorMes {
      total: number;
      objetivo: number;
      porcentaje: number;
      mes: string;
    }

    interface Dataset {
      label: string;
      data: number[];
      extra: VentaPorMes[];
      borderColor: string;
      backgroundColor: string;
      pointRadius: number;
      pointHoverRadius: number;
      borderWidth: number;
      fill: boolean;
      tension: number;
    }

    const datasets: Dataset[] = await Promise.all(
      (vendedores as Vendedor[]).map(async (vendedor: Vendedor, idx: number) => {
        const datosPorMes: VentaPorMes[] = await Promise.all(
        meses.map(async (mes: string) => {
          const venta = await getVentasPorMesYVendedor(vendedor.id, mes);
          return {
            ...venta,
            mes,
          } as VentaPorMes;
        })
        );
        return {
        label: vendedor.nombre,
        data: datosPorMes.map((d) => d.total),
        extra: datosPorMes,
        borderColor: COLORS[idx % COLORS.length],
        backgroundColor: COLORS[idx % COLORS.length],
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
        fill: false,
        tension: 0.25,
        } as Dataset;
      })
    );

      setChartData({
        labels: meses.map(formatMes),
        datasets,
      });
      setLoading(false);
    }
    fetchData();
  }, []);

const options: any = {
  responsive: true,
  plugins: {
    legend: { position: "top" },
    title: {
      display: true,
      text: "Evolución de Ventas por Vendedor (últimos 4 meses)",
      font: { size: 18 }
    },
    tooltip: {
      callbacks: {
        label: function (context: any) {
          const idx = context.dataIndex;
          const dataset = context.dataset;
          const extra = dataset.extra[idx];
          const nombre = dataset.label;
          return [
            `${nombre}`,
            `Ventas: $${Number(extra.total).toLocaleString("es-AR")}`,
            `Objetivo: $${Number(extra.objetivo).toLocaleString("es-AR")}`,
            `% Alcanzado: ${Number(extra.porcentaje).toFixed(1)}%`
          ];
        }
      }
    }
  },
  scales: {
    x: { type: "category" },
    y: {
      type: "linear",
      beginAtZero: true,
      ticks: {
        callback: (val: number) => `$${Number(val).toLocaleString("es-AR")}`
      }
    }
  }
};


  return (
    <div className="bg-white rounded-lg shadow-md p-6 my-8">
      {loading || !chartData ? (
        <div className="text-center text-gray-500">Cargando gráfico...</div>
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  );
}
