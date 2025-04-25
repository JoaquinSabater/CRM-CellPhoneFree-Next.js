import { auth } from '@/app/lib/auth';
import {
  fetchFilteredClientes,
  fetchFiltrosPorVendedor,
  fetchFilteredProspects
} from '@/app/lib/data';
import { UpdateCliente,UpdateProspecto,DeleteProspecto } from '@/app/ui/invoices/buttons';
import {cliente,prospecto} from '@/app/lib/definitions';
import {ClientProspectosTable} from '@/app/ui/invoices/ClientProspectosTable';

type FiltroCliente = {
  cliente_id: number;
  nombre: string;
  valor: string;
};

export default async function Table({ query }: { query: string }) {
  const session = await auth();
  const vendedorId = session?.user?.vendedor_id;
  const rol = session?.user?.rol;

  if (!rol) {
    return <div className="text-red-500 p-4">No se pudo obtener el rol del usuario.</div>;
  }

  // 🧡 Si es vendedor, tabla de clientes
  if (rol === 'vendedor') {
    if (!vendedorId) {
      return <div className="text-red-500 p-4">No se pudo obtener el vendedor actual.</div>;
    }

    const clientes: cliente[] = await fetchFilteredClientes(query, vendedorId);
    const filtrosCliente: FiltroCliente[] = await fetchFiltrosPorVendedor(vendedorId);
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
              <th className="px-2 py-5 font-medium">Editar</th>
              <th className="px-2 py-5 font-medium">Razón Social</th>
              <th className="px-2 py-5 font-medium">Provincia</th>
              <th className="px-2 py-5 font-medium">Localidad</th>
              {filtrosUnicos.map((nombre) => (
                <th key={nombre} className="px-2 py-5 font-medium whitespace-nowrap">{nombre}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {clientes.map((cliente) => {
              const filtrosDelCliente = filtroMap.get(cliente.id) || new Map();

              return (
                <tr key={cliente.id}>
                  <td className="whitespace-nowrap px-2 py-3">
                    <div className="flex justify-start pl-1">
                      <UpdateCliente id={cliente.id.toString()} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-2 py-3">{cliente.razon_social}</td>
                  <td className="whitespace-nowrap px-2 py-3">{cliente.provincia_nombre}</td>
                  <td className="whitespace-nowrap px-2 py-3">{cliente.localidad_nombre}</td>
                  {filtrosUnicos.map((nombre) => (
                    <td key={nombre} className="whitespace-nowrap px-2 py-3">
                      {filtrosDelCliente.get(nombre) ?? '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // 💙 Si es captador, tabla de prospectos
  if (rol === 'captador') {
    const captadorId = session?.user?.captador_id;
    const initialProspectos = await fetchFilteredProspects(query, captadorId) as prospecto[];
  
    return (
      <ClientProspectosTable
        initialProspectos={initialProspectos}
      />
    );
  }

  return <div className="text-red-500 p-4">Rol no válido.</div>;
}