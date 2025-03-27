import Image from 'next/image';
import { auth } from '@/app/lib/auth';
import { UpdateCliente } from '@/app/ui/invoices/buttons';
import { fetchFilteredClientes } from '@/app/lib/data';

export default async function Table({ query }: { query: string }) {
  const session = await auth();
  const vendedorId = session?.user?.vendedor_id;

  if (!vendedorId) {
    return <div className="text-red-500 p-4">No se pudo obtener el vendedor actual.</div>;
  }

  const clientes = await fetchFilteredClientes(query, vendedorId);

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="md:hidden">
            {clientes?.map((cliente) => {
              console.log('Cliente ID:', cliente.id); // Depurar el valor de cliente.id
              return (
                <div
                  key={cliente.id}
                  className="mb-2 w-full rounded-md bg-white p-4"
                >
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <p className="text-lg font-medium">{cliente.razon_social}</p>
                      <p className="text-sm text-gray-500">{cliente.modalidad_de_pago}</p>
                    </div>
                    <p>{cliente.contactar ? 'Sí' : 'No'}</p>
                  </div>
                  <div className="flex w-full items-center justify-between pt-4">
                    <div>
                      <p className="text-sm">Provincia: {cliente.provincia_nombre}</p>
                      <p className="text-sm">Localidad: {cliente.localidad_nombre}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <UpdateCliente id={cliente.id} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-2 py-5 font-medium">Razón Social</th>
                <th scope="col" className="px-2 py-5 font-medium">Modalidad de Pago</th>
                <th scope="col" className="px-2 py-5 font-medium">Contactar</th>
                <th scope="col" className="px-2 py-5 font-medium">Provincia</th>
                <th scope="col" className="px-2 py-5 font-medium">Localidad</th>
                <th scope="col" className="relative py-3 pl-4 pr-2">
                  <span className="sr-only">Editar</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {clientes?.map((cliente) => {
                console.log('Cliente ID (tabla):', cliente.id); // Depurar el valor de cliente.id en la tabla
                return (
                  <tr
                    key={cliente.id}
                    className="w-full border-b py-3 text-sm last-of-type:border-none"
                  >
                    <td className="whitespace-nowrap px-2 py-3">{cliente.razon_social}</td>
                    <td className="whitespace-nowrap px-2 py-3">{cliente.modalidad_de_pago}</td>
                    <td className="whitespace-nowrap px-2 py-3">{cliente.contactar ? 'Sí' : 'No'}</td>
                    <td className="whitespace-nowrap px-2 py-3">{cliente.provincia_nombre}</td>
                    <td className="whitespace-nowrap px-2 py-3">{cliente.localidad_nombre}</td>
                    <td className="relative whitespace-nowrap py-3 pl-4 pr-2">
                      <div className="flex justify-end gap-3">
                        <UpdateCliente id={cliente.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}