import Image from 'next/image'
import VentasMensualesPorVendedor from '@/app/ui/dashboard/SalesProgressChart'
import VentasMesActualChart from '@/app/ui/dashboard/VentasMesActualChart'
import GraficoPedidosPorSemana from '@/app/ui/dashboard/GraficoPedidosPorSemana'
import { getPedidosPorSemana } from '@/app/lib/data'
import EvolucionClientesChart from '@/app/ui/dashboard/GraficoEvolucionClientes'
import GraficoPorItemListBox from '@/app/ui/dashboard/GraficoPorItemListBox';



export default async function Page() {
  const vendedorId = 1
  const pedidosPorSemana = await getPedidosPorSemana(vendedorId)
  const nombreVendedor = "Santiago Sala"
  const url_imagen = ""
  const rol = "Vendedor"

  return (
    <main className="w-full px-4 py-6">
      <div className="max-w-7xl mx-auto mt-4">
        <div className="w-full flex flex-col md:flex-row gap-6 items-stretch mb-6">
          {/* Card de usuario, ocupa 100% del alto */}
          <div className="bg-white rounded-lg shadow-md w-full md:w-1/3 max-w-sm flex flex-col items-center justify-center text-center h-[350px]">
            <Image
              src={url_imagen || '/logo-25.png'}
              alt={nombreVendedor}
              width={160}
              height={160}
              className="rounded-full object-cover"
            />
            <h2 className="text-lg font-semibold mt-3 text-gray-800">{nombreVendedor}</h2>
            <p className="text-sm text-gray-500 capitalize">{rol}</p>
          </div>

          {/* Gráfico, ocupa 100% del alto */}
          <div className="w-full md:flex-1 h-[350px] flex items-center">
            <EvolucionClientesChart vendedorId={vendedorId} />
          </div>
        </div>

        <div className="w-full">
          <VentasMensualesPorVendedor vendedorId={vendedorId} />
        </div>
        <div className="w-full">
          <VentasMesActualChart vendedorId={vendedorId} />
        </div>
        <div className="w-full">
          <GraficoPedidosPorSemana data={pedidosPorSemana} />
        </div>
        <div className="w-full">
          <GraficoPorItemListBox vendedorId={vendedorId} />
        </div>
      </div>
    </main>
  )
}