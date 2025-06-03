import { CardWrapper } from '@/app/ui/dashboard/cards';
import Sellerpic from '../ui/sellerpic';
import RecordatorioForm from '@/app/ui/dashboard/recordatorioForm';
import NotasPersonales from '@/app/ui/dashboard/notas';
import TopClientesPorItem from '@/app/ui/dashboard/TopClientesPorItem';
import ClientesInactivosPorVendedor from '../ui/dashboard/ClientesInactivos';
import { auth } from '@/app/lib/auth';

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

        {/* 
          <div className="flex flex-col h-full min-h-[220px]">
            <RecordatorioForm />
          </div>
        */}
      </div>

      <div className="max-w-7xl mx-auto mt-8">
          {userId && (
            <div className="w-full">
              <NotasPersonales userId={Number(userId)} />
            </div>
          )}

        {/* Solo para vendedores: Top clientes e inactivos
            {rol === 'vendedor' && vendedorId && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <TopClientesPorItem vendedorId={vendedorId} />
                <ClientesInactivosPorVendedor vendedorId={vendedorId} />
              </div>
            )}
        */}
      </div>
    </main>
  );
}



