// 📁 app/dashboard/etiquetas/create/page.tsx
import CreateEtiquetaForm from '@/app/ui/invoices/customers/CreateEtiquetaForm';
import { fetchFiltrosFijos } from '@/app/lib/data';
import { auth } from '@/app/lib/auth';

export default async function Page() {
  const filtrosDisponibles = await fetchFiltrosFijos();

  return (
    <main className="p-6">
      <CreateEtiquetaForm filtrosDisponibles={filtrosDisponibles} />
    </main>
  );
}


