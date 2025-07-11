import { auth } from '@/app/lib/auth';
import {
  fetchFilteredClientes,
  fetchFiltrosFijos,
  fetchFiltrosDeClientes,
  fetchFilteredProspects
} from '@/app/lib/data';
import { UpdateCliente } from '@/app/ui/invoices/buttons';
import { prospecto } from '@/app/lib/definitions';
import { ClientProspectosTable } from '@/app/ui/invoices/prospects/ClientProspectosTable';

export default async function Table({ query, filtrosSeleccionados }: { query: string, filtrosSeleccionados: { [cat: string]: number } }) {
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

    const clientes = await fetchFilteredClientes(query, vendedorId);
    const filtrosFijos = await fetchFiltrosFijos();
    const filtrosDeClientes = await fetchFiltrosDeClientes(clientes.map(c => c.id));

    // Mapeo: cliente_id -> Set de filtro_id activos
    const filtrosPorCliente = new Map<number, Set<number>>();
    filtrosDeClientes.forEach(({ cliente_id, filtro_id, valor }) => {
      if (valor === '1') {
        if (!filtrosPorCliente.has(cliente_id)) {
          filtrosPorCliente.set(cliente_id, new Set());
        }
        filtrosPorCliente.get(cliente_id)!.add(filtro_id);
      }
    });

    // 💡 Filtrar clientes según los filtros seleccionados
    const clientesFiltrados = clientes.filter(cliente => {
      // Si no hay filtros activos, mostrar todos
      const filtroIds = Object.values(filtrosSeleccionados).filter(Boolean);
      if (filtroIds.length === 0) return true;
      // El cliente debe tener TODOS los filtros seleccionados activos
      const filtrosCliente = filtrosPorCliente.get(cliente.id) || new Set();
      return filtroIds.every(filtroId => filtrosCliente.has(filtroId));
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
              <th className="px-2 py-5 font-medium">Etiquetas</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {clientesFiltrados.map((cliente) => {
              const etiquetasActivas = filtrosFijos.filter(f =>
                filtrosPorCliente.get(cliente.id)?.has(f.id)
              );
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
                  <td className="whitespace-nowrap px-2 py-3">
                    {etiquetasActivas.length > 0 ? (
                      <details className="relative">
                        <summary className="cursor-pointer bg-orange-400 text-white px-2 py-1 rounded text-xs w-fit select-none">
                          {etiquetasActivas.length === 1
                            ? etiquetasActivas[0].nombre
                            : `${etiquetasActivas.length} etiquetas`}
                        </summary>
                        <ul className="absolute z-10 mt-2 bg-white border border-orange-200 rounded shadow-lg min-w-max">
                          {etiquetasActivas.map(f => (
                            <li
                              key={f.id}
                              className="px-3 py-1 text-orange-700 hover:bg-orange-50 text-xs"
                            >
                              {f.nombre}
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
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
