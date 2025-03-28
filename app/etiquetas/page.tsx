// ✅ Ruta: app/dashboard/etiquetas/page.tsx
import { auth } from '@/app/lib/auth';
import CreateEtiquetaForm from './CreateEtiquetaForm';
import TagList from './TagList';

export default async function EtiquetasPage() {
  const session = await auth();
  const vendedorId = session?.user?.vendedor_id;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Etiquetas</h1>
      {vendedorId === 2 ? (
        <CreateEtiquetaForm vendedorId={2} />
      ) : (
        <p className="text-gray-700 mb-4">No tienes permisos para crear etiquetas.</p>
      )}
      <TagList />
    </main>
  );
}
