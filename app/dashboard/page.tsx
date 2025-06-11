import { CardWrapper } from '@/app/ui/dashboard/cards';
import Sellerpic from '../ui/sellerpic';
import NotasPersonales from '@/app/ui/dashboard/notas';
import { auth } from '@/app/lib/auth';
import DonutClientesPorVendedor from '@/app/ui/dashboard/DonutClientesPorVendedor';
import VentasMensualesPorVendedor from '@/app/ui/dashboard/SalesProgressChart';
import VentasMesActualChart from '@/app/ui/dashboard/VentasMesActualChart';
import ClientesPorCaerEnDesgracia from '@/app/ui/dashboard/ClientesPorCaerEnDesgracia';


export default async function Page() {
  const session = await auth();
  const userId = session?.user?.id;
  const rol = session?.user?.rol;
  const vendedorId = session?.user?.vendedor_id;

  return (
    <main className="w-full px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto items-stretch h-full">
        {/* Columna 1 - Foto */}
        <div className="flex flex-col h-full min-h-[220px]">
          <Sellerpic />
        </div>

        {/* Columna 2 - Cards */}
        <div className="flex flex-col h-full gap-6 min-h-[220px]">
          <CardWrapper />
        </div>

        <div className="flex flex-col h-full min-h-[220px] justify-center">
          {rol === 'vendedor' && typeof vendedorId === 'number' && (
            <DonutClientesPorVendedor vendedorId={vendedorId} />
          )}
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-8">
          {userId && (
            <div className="w-full">
              <NotasPersonales userId={Number(userId)} />
            </div>
          )}
        <div className="w-full">
            {rol === 'vendedor' && typeof vendedorId === 'number' && (
              <ClientesPorCaerEnDesgracia vendedorId={vendedorId} />
            )}
        </div>
        <div className="w-full">
            {rol === 'vendedor' && typeof vendedorId === 'number' && (
              <VentasMensualesPorVendedor vendedorId={vendedorId} />
            )}
        </div>
        <div className="w-full">
            {rol === 'vendedor' && typeof vendedorId === 'number' && (
              <VentasMesActualChart vendedorId={vendedorId} />
            )}
        </div>
      </div>
    </main>
  );
}



