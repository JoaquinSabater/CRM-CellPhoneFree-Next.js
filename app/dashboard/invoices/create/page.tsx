// 📁 app/dashboard/etiquetas/create/page.tsx
import CreateEtiquetaForm from '@/app/ui/invoices/customers/CreateEtiquetaForm';
import { getEtiquetasGlobales } from '@/app/lib/data';
import { auth } from '@/app/lib/auth';

export default async function Page() {
   const session = await auth();
  const vendedorId = session?.user?.vendedor_id;

  const [filtrosDisponibles] = await Promise.all([ getEtiquetasGlobales(vendedorId ?? 0)]);

  return (
    <main className="p-6">
      <CreateEtiquetaForm filtrosDisponibles={filtrosDisponibles} />
    </main>
  );
}


