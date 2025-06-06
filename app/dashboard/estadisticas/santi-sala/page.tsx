import VentasMensualesPorVendedor from '@/app/ui/dashboard/SalesProgressChart'
import VentasMesActualChart from '@/app/ui/dashboard/VentasMesActualChart'
import GraficoPedidosPorSemana from '@/app/ui/dashboard/GraficoPedidosPorSemana'
import { getPedidosPorSemana } from '@/app/lib/data'

export default async function Page() {
  const vendedorId = 2
  const pedidosPorSemana = await getPedidosPorSemana(vendedorId)

  return (
    <main className="w-full px-4 py-6">
      <div className="max-w-7xl mx-auto mt-8">
        <div className="w-full">
          <VentasMensualesPorVendedor vendedorId={vendedorId} />
        </div>
        <div className="w-full">
          <VentasMesActualChart vendedorId={vendedorId} />
        </div>
        <div className="w-full">
          <GraficoPedidosPorSemana data={pedidosPorSemana} />
        </div>
      </div>
    </main>
  )
}
