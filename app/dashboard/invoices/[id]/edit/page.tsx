import EditClienteForm from '@/app/ui/invoices/edit-form';
import { fetchClienteById, getPedidosByCliente } from '@/app/lib/data';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params; // Resuelve la promesa
  const id = params.id;

  const [cliente, pedidos] = await Promise.all([
    fetchClienteById(id),
    getPedidosByCliente(id),
  ]);

  if (!cliente) {
    return <div className="p-4 text-red-600">Cliente no encontrado.</div>;
  }

  return (
    <main>
      <EditClienteForm cliente={cliente} pedidos={pedidos} />
    </main>
  );
}
