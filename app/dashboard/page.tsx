import { CardWrapper } from '@/app/ui/dashboard/cards';
import Sellerpic from '../ui/sellerpic';
import RecordatorioForm from '@/app/ui/dashboard/recordatorioForm';

export default async function Page() {
  return (
    <main className="flex gap-6 px-6 items-start">
      {/* Columna 1: Imagen del vendedor */}
      <div className="flex flex-col gap-6">
        <Sellerpic />
      </div>

      {/* Columna 2: Cards */}
      <div className="flex flex-col gap-6">
        <CardWrapper />
      </div>

      {/* Columna 3: Recordatorio */}
      <div className="flex-1">
        <RecordatorioForm />
      </div>
    </main>
  );
}


