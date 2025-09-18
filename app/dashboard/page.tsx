import { CardWrapper } from '@/app/ui/dashboard/home/cards';
import Sellerpic from '../ui/sellerpic';
import NotasPersonales from '@/app/ui/dashboard/home/notas';
import { auth } from '@/app/lib/auth';
import DonutClientesPorVendedor from '@/app/ui/dashboard/home/DonutClientesPorVendedor';
import VentasMensualesPorVendedor from '@/app/ui/dashboard/estadisticas/SalesProgressChart';
import VentasMesActualChart from '@/app/ui/dashboard/estadisticas/VentasMesActualChart';
import ClientesPorCaerEnDesgracia from '@/app/ui/dashboard/home/ClientesPorCaerEnDesgracia';
import PedidosPreliminares from '@/app/ui/dashboard/home/PedidosPreliminares';

export default async function Page() {
  const session = await auth();
  const userId = session?.user?.id;
  const rol = session?.user?.rol;
  const vendedorId = session?.user?.vendedor_id;

  return (
    <main className="w-full px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto items-stretch h-full">
        
        <div className="flex flex-col h-full min-h-[220px]">
          <Sellerpic />
        </div>

        <div className="flex flex-col h-full gap-6 min-h-[220px]">
          <CardWrapper />
        </div>

        <div className="flex flex-col h-full min-h-[220px] justify-center">
          {rol === 'vendedor' && typeof vendedorId === 'number' && (
            <DonutClientesPorVendedor vendedorId={vendedorId} />
          )}
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-8 space-y-8">
        {userId && (
          <NotasPersonales userId={Number(userId)} />
        )}
        
        {rol === 'vendedor' && typeof vendedorId === 'number' && (
          <>
            <PedidosPreliminares vendedorId={vendedorId} />
            <ClientesPorCaerEnDesgracia vendedorId={vendedorId} />
            <VentasMensualesPorVendedor vendedorId={vendedorId} />
            <VentasMesActualChart vendedorId={vendedorId} />
          </>
        )}
      </div>
    </main>
  );
}



