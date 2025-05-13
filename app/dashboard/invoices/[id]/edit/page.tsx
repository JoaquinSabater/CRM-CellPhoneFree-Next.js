import EditClienteForm from '@/app/ui/invoices/edit-form';
import { fetchClienteById, getPedidosByCliente, getEtiquetasGlobales, getFiltrosDelCliente,getTopItemsByCliente } from '@/app/lib/data';
import { Suspense } from 'react';
import LoadingSpinner from '@/app/ui/loading';
import { auth } from '@/app/lib/auth';



export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  const vendedorId = session?.user?.vendedor_id;

  const [cliente, pedidos, filtrosDisponibles, filtrosCliente,topArticulos] = await Promise.all([
    fetchClienteById(id),
    getPedidosByCliente(id),
    getEtiquetasGlobales(vendedorId ?? 0),
    getFiltrosDelCliente(id),
    getTopItemsByCliente(id),
  ]);

  if (!cliente) {
    return <div className="p-4 text-red-600">Cliente no encontrado.</div>;
  }

  return (
    <main>
      <Suspense fallback={<LoadingSpinner />}>
        <EditClienteForm
          cliente={cliente}
          pedidos={pedidos}
          filtrosDisponibles={filtrosDisponibles}
          filtrosCliente={filtrosCliente}
          topArticulos={topArticulos}
        />
      </Suspense>
    </main>
  );
}
