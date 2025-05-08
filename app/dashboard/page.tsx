import { CardWrapper } from '@/app/ui/dashboard/cards';
import Sellerpic from '../ui/sellerpic';
import RecordatorioForm from '@/app/ui/dashboard/recordatorioForm';
import NotasPersonales from '@/app/ui/dashboard/notas';
import TopClientesPorItem from '@/app/ui/dashboard/TopClientesPorItem';
import { auth } from '@/app/lib/auth';

export default async function Page() {
  const session = await auth();
  const userId = session?.user?.id;
  const rol = session?.user?.rol;
  const vendedorId = session?.user?.vendedor_id;

  const isCaptador = rol === 'captador';

  return (
    <main className="w-full px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto items-start">
        {/* Columna 1 - Foto */}
        <div className="w-full h-full">
          <Sellerpic />
        </div>

        {/* Columna 2 - Cards */}
        <div className="flex flex-col gap-6">
          <CardWrapper />
        </div>

        {/* Columna 3 - Formulario */}
        <div className="w-full h-full">
          <RecordatorioForm />
        </div>
      </div>

      {/* Sección inferior dividida horizontalmente */}
      <div
        className={`grid ${
          isCaptador ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
        } gap-6 max-w-7xl mx-auto mt-8 items-stretch`}
      >
        {/* Notas personales */}
        {userId && (
          <div className="w-full">
            <NotasPersonales userId={Number(userId)} />
          </div>
        )}

        {/* Top clientes por ítem - sólo para vendedores */}
        {rol === 'vendedor' && vendedorId && (
          <div className="w-full">
            <TopClientesPorItem vendedorId={vendedorId} />
          </div>
        )}
      </div>
    </main>
  );
}



