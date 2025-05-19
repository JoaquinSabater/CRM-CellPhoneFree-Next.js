import EditClienteForm from '@/app/ui/invoices/customers/edit-form';
import { fetchClienteById, getPedidosByCliente, getEtiquetasGlobales, getFiltrosDelCliente,getTopItemsByCliente, getMarcasConProductos } from '@/app/lib/data';
import { Suspense } from 'react';
import LoadingSpinner from '@/app/ui/loading';
import { auth } from '@/app/lib/auth';
import { get } from 'http';



export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  const vendedorId = session?.user?.vendedor_id;

  const [cliente, pedidos, filtrosDisponibles, filtrosCliente,topArticulos,marcas] = await Promise.all([
    fetchClienteById(id),
    getPedidosByCliente(id),
    getEtiquetasGlobales(vendedorId ?? 0),
    getFiltrosDelCliente(id),
    getTopItemsByCliente(id),
    getMarcasConProductos(Number(id)),
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
        />
      </Suspense>
    </main>
  );
}
