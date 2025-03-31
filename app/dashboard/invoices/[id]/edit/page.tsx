import EditClienteForm from '@/app/ui/invoices/edit-form';
import { fetchClienteById, getPedidosByCliente, getEtiquetasGlobales, getFiltrosDelCliente } from '@/app/lib/data';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const [cliente, pedidos, filtrosDisponibles, filtrosCliente] = await Promise.all([
    fetchClienteById(id),
    getPedidosByCliente(id),
    getEtiquetasGlobales(),
    getFiltrosDelCliente(id),
  ]);

  if (!cliente) {
    return <div className="p-4 text-red-600">Cliente no encontrado.</div>;
  }

  return (
    <main>
      <EditClienteForm
        cliente={cliente}
        pedidos={pedidos}
        filtrosDisponibles={filtrosDisponibles}
        filtrosCliente={filtrosCliente}
      />
    </main>
  );
}
