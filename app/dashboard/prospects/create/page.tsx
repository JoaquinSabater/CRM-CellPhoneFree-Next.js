// app/dashboard/prospects/create/page.tsx
import CreateProspectoForm from '@/app/ui/invoices/createProspecto';
import { getAllProvincias, getAllLocalidades } from '@/app/lib/data';

export default async function Page() {
  const [provincias, localidades] = await Promise.all([
    getAllProvincias(),
    getAllLocalidades(),
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Crear nuevo prospecto</h1>
      <CreateProspectoForm provincias={provincias} localidades={localidades} />
    </div>
  );
}
