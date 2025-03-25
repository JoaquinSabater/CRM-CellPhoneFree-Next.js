import Image from 'next/image';
import { UpdateInvoice } from '@/app/ui/invoices/buttons';
import InvoiceStatus from '@/app/ui/invoices/status';
import { formatDateToLocal, formatCurrency } from '@/app/lib/utils';
import { fetchFilteredClientes } from '@/app/lib/data';

export default async function Table({ query }: { query: string }) {
  const clientes = await fetchFilteredClientes(query);

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <table className="min-w-full text-gray-900">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-2 py-5 font-medium">Razón Social</th>
                <th scope="col" className="px-2 py-5 font-medium">Modalidad de Pago</th>
                <th scope="col" className="px-2 py-5 font-medium">Contactar</th>
                <th scope="col" className="px-2 py-5 font-medium">Tipo de Cliente</th>
                <th scope="col" className="px-2 py-5 font-medium">Cantidad de Días</th>
                <th scope="col" className="px-2 py-5 font-medium">Cuenta Corriente</th>
                <th scope="col" className="px-2 py-5 font-medium">Monto</th>
                <th scope="col" className="px-2 py-5 font-medium">Provincia</th>
                <th scope="col" className="px-2 py-5 font-medium">Localidad</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {clientes?.map((cliente) => (
                <tr key={cliente.razon_social} className="border-b py-3 text-sm last-of-type:border-none">
                  <td className="whitespace-nowrap px-2 py-3">{cliente.razon_social}</td>
                  <td className="whitespace-nowrap px-2 py-3">{cliente.modalidad_de_pago}</td>
                  <td className="whitespace-nowrap px-2 py-3">{cliente.contactar ? 'Sí' : 'No'}</td>
                  <td className="whitespace-nowrap px-2 py-3">{cliente.tipo_de_cliente}</td>
                  <td className="whitespace-nowrap px-2 py-3">{cliente.cantidad_de_dias}</td>
                  <td className="whitespace-nowrap px-2 py-3">{cliente.cuenta_corriente ? 'Sí' : 'No'}</td>
                  <td className="whitespace-nowrap px-2 py-3">{cliente.monto}</td>
                  <td className="whitespace-nowrap px-2 py-3">{cliente.provincia_nombre}</td>
                  <td className="whitespace-nowrap px-2 py-3">{cliente.localidad_nombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}