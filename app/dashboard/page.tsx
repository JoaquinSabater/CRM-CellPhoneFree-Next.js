import { CardWrapper } from '@/app/ui/dashboard/cards';
import Sellerpic from '../ui/sellerpic';
import RecordatorioForm from '@/app/ui/dashboard/recordatorioForm';
import { auth } from '@/app/lib/auth';
import NotasPersonales from '@/app/ui/dashboard/notas';

export default async function Page() {
  const session = await auth();
  const userId = session?.user?.id;
  return (
    <main className="w-full px-4 py-6">
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto items-start"
      >
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

      {/* Notas personales abajo */}
      {userId && <NotasPersonales userId={Number(userId)} />}
    </main>
  );
}


