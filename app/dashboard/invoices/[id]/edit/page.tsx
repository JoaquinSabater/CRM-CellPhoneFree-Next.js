import EditClienteForm from '@/app/ui/invoices/customers/edit-form';
import { fetchClienteById, getPedidosByCliente, fetchFiltrosFijos, getFiltrosDelCliente, getTopItemsByCliente, getMarcasConProductos, getAllProvincias, getAllLocalidades } from '@/app/lib/data';
import { Suspense } from 'react';
import LoadingSpinner from '@/app/ui/loading';
import { auth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();

  const [cliente, pedidos, filtrosDisponibles, filtrosCliente, topArticulos, marcas, provincias, localidades] = await Promise.all([
    fetchClienteById(id),
    getPedidosByCliente(id),
    fetchFiltrosFijos(),
    getFiltrosDelCliente(id),
    getTopItemsByCliente(id),
    getMarcasConProductos(Number(id)),
    getAllProvincias(),
    getAllLocalidades(),
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
          marcas={marcas}
          provincias={provincias}
          localidades={localidades}
        />
      </Suspense>
    </main>
  );
}
