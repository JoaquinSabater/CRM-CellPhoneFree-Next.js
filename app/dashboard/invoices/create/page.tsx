// 📁 app/dashboard/etiquetas/create/page.tsx
import CreateEtiquetaForm from '@/app/ui/invoices/CreateEtiquetaForm';
import { getEtiquetasGlobales } from '@/app/lib/data';

export default async function Page() {

  const [filtrosDisponibles] = await Promise.all([ getEtiquetasGlobales()]);

  return (
    <main className="p-6">
      <CreateEtiquetaForm filtrosDisponibles={filtrosDisponibles} />
    </main>
  );
}


