import Link from 'next/link';
import { auth } from '@/app/lib/auth';
import { fetchFilteredClientes, fetchFiltrosPorVendedor } from '@/app/lib/data';

export default async function Table({ query }: { query: string }) {
  const session = await auth();
  const vendedorId = session?.user?.vendedor_id;

  if (!vendedorId) {
    return <div className="text-red-500 p-4">No se pudo obtener el vendedor actual.</div>;
  }

  const clientes = await fetchFilteredClientes(query, vendedorId);
  const filtrosCliente = await fetchFiltrosPorVendedor(vendedorId);

  const filtrosUnicos = Array.from(new Set(filtrosCliente.map((f) => f.nombre)));

  const filtroMap = new Map<number, Map<string, string>>();
  filtrosCliente.forEach(({ cliente_id, nombre, valor }) => {
    if (!filtroMap.has(cliente_id)) {
      filtroMap.set(cliente_id, new Map());
    }
    filtroMap.get(cliente_id)!.set(nombre, valor);
  });

  return (
    <div className="mt-6 w-full overflow-x-auto">
      <table className="min-w-full text-sm text-gray-900 border rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-left font-medium">
          <tr>
            <th className="px-2 py-5 font-medium">Razón Social</th>
            <th className="px-2 py-5 font-medium">Provincia</th>
            <th className="px-2 py-5 font-medium">Localidad</th>
            {filtrosUnicos.map((nombre) => (
              <th key={nombre} className="px-2 py-5 font-medium whitespace-nowrap">{nombre}</th>
            ))}
            <th className="py-5 pr-4 text-right"></th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {clientes.map((cliente) => {
            const filtrosDelCliente = filtroMap.get(cliente.id) || new Map();

            return (
              <Link
                key={cliente.id}
                href={`/dashboard/invoices/${cliente.id}/edit`}
                className="contents"
              >
                <tr className="hover:bg-gray-50 transition cursor-pointer">
                  <td className="whitespace-nowrap px-2 py-3">{cliente.razon_social}</td>
                  <td className="whitespace-nowrap px-2 py-3">{cliente.provincia_nombre}</td>
                  <td className="whitespace-nowrap px-2 py-3">{cliente.localidad_nombre}</td>
                  {filtrosUnicos.map((nombre) => (
                    <td key={nombre} className="whitespace-nowrap px-2 py-3">
                      {filtrosDelCliente.get(nombre) ?? '—'}
                    </td>
                  ))}
                </tr>
              </Link>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}




