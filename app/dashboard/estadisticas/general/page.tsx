// app/page.tsx
import GraficoEvolucionVendedores from "@/app/ui/dashboard/home/GraficoEvolucionVendedores";
import { getVentasDelDiaPorVendedor } from "@/app/lib/data";

export const dynamic = 'force-dynamic'

async function getVendedores() {
  const res = await fetch(
    "https://cellphonefree.com.ar/accesorios/Sistema/scrphp/api/estadisticas/obtener_performance.php?token=fe3493287c3a953cae08234baa2097ba896033989eb3f61fe6f6402ecbf465a7",
    { cache: "no-store" }
  );
  const json = await res.json();
  return json.data?.vendedores || [];
}

function getPercentColor(percent: number) {
  if (percent >= 100) return "bg-green-600";
  if (percent >= 70) return "bg-yellow-400";
  if (percent >= 40) return "bg-red-400";
  return "bg-orange-400";
}

export default async function Page() {
  const ventasDelDia = await getVentasDelDiaPorVendedor();
  const vendedores = await getVendedores();

  // Totales
  interface VendedorInfo {
    id: number;
    nombre: string;
    meses_antiguedad: number;
  }

  interface VentasInfo {
    objetivo: number;
    total: number;
    porcentaje_alcanzado: number;
  }

  interface ClientesInfo {
    activos: number;
    inactivos: number;
  }

  interface VendedorData {
    vendedor: VendedorInfo;
    ventas: VentasInfo;
    clientes: ClientesInfo;
  }

  const totalDinero = vendedores.reduce(
    (sum: number, v: VendedorData) => sum + Number(v.ventas?.total || 0),
    0
  );
  const totalActivos = vendedores.reduce(
    (sum: number, v: VendedorData) => sum + Number(v.clientes?.activos || 0),
    0
  );
  const totalInactivos = vendedores.reduce(
    (sum: number, v: VendedorData) => sum + Number(v.clientes?.inactivos || 0),
    0
  );

  return (
    <div className="p-4">
        {/* Título principal */}
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight text-center">
            Resumen de Vendedores
          </h1>
        </div>

        {/* KPIs cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        {/* Card dinero total */}
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
          <span className="text-5xl mb-3">💸</span>
          <div className="text-4xl font-extrabold text-gray-800 mb-1">
            ${totalDinero.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-lg text-gray-500 font-medium text-center">
            Dinero total
          </div>
        </div>
        {/* Card activos */}
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
          <span className="text-5xl mb-3">🟢</span>
          <div className="text-4xl font-extrabold text-green-600 mb-1">
            {totalActivos}
          </div>
          <div className="text-lg text-gray-500 font-medium text-center">
            Clientes activos
          </div>
        </div>
        {/* Card inactivos */}
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
          <span className="text-5xl mb-3">🔴</span>
          <div className="text-4xl font-extrabold text-pink-600 mb-1">
            {totalInactivos}
          </div>
          <div className="text-lg text-gray-500 font-medium text-center">
            Clientes inactivos
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-6 gap-5 mb-10">
        {ventasDelDia.map((v: any) => (
          <div
            key={v.vendedor_id}
            className="bg-white rounded-xl shadow-md p-5 flex flex-col items-center max-w-[220px] w-full"
          >
            <span className="text-2xl mb-1">💵</span>
            <div className="text-xs font-semibold text-gray-500 mb-1 uppercase text-center">
              {v.vendedor_nombre}
            </div>
            <div className="text-2xl font-extrabold text-blue-600 mb-1 text-center">
              ${Number(v.total_hoy).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-400 text-center">
              Remitos generados hoy
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-gray-800 text-sm">
              <th className="py-2 px-3 text-left font-semibold border-b">Vendedor</th>
              <th className="py-2 px-3 text-left font-semibold border-b">Antigüedad</th>
              <th className="py-2 px-3 text-left font-semibold border-b">Objetivo</th>
              <th className="py-2 px-3 text-left font-semibold border-b">Ventas</th>
              <th className="py-2 px-3 text-left font-semibold border-b">% Alcanzado</th>
              <th className="py-2 px-3 text-left font-semibold border-b">Clientes Activos</th>
              <th className="py-2 px-3 text-left font-semibold border-b">Clientes Inactivos</th>
            </tr>
          </thead>
          <tbody>
            {vendedores.map((v: any, idx: number) => (
              <tr
                key={v.vendedor.id}
                className={
                  idx % 2 === 0
                    ? "bg-white"
                    : "bg-gray-50"
                }
              >
                <td className="py-2 px-3 border-b font-medium text-gray-800">{v.vendedor.nombre}</td>
                <td className="py-2 px-3 border-b">{v.vendedor.meses_antiguedad} meses</td>
                <td className="py-2 px-3 border-b">
                  {/* Si la antigüedad de Ariel es 4 meses, usa 20%, sino 50% */}
                  {v.vendedor.meses_antiguedad === 4 ? "20%" : "50%"}
                  <br />
                  <span className="text-xs text-gray-400">
                    (${Number(v.ventas.objetivo).toLocaleString("es-AR", { minimumFractionDigits: 2 })})
                  </span>
                </td>
                <td className="py-2 px-3 border-b">
                  {v.ventas.total
                    ? "$" +
                      Number(v.ventas.total).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })
                    : "-"}
                </td>
                <td className="py-2 px-3 border-b">
                  <span
                    className={
                      "inline-block px-2 py-1 rounded text-white text-xs font-bold " +
                      getPercentColor(v.ventas.porcentaje_alcanzado)
                    }
                  >
                    {v.ventas.porcentaje_alcanzado
                      ? v.ventas.porcentaje_alcanzado.toFixed(1) + "%"
                      : "-"}
                  </span>
                </td>
                <td className="py-2 px-3 border-b">{v.clientes?.activos ?? "-"}</td>
                <td className="py-2 px-3 border-b">{v.clientes?.inactivos ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        <GraficoEvolucionVendedores />
    </div>
  );
}
