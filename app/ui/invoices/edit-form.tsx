'use client';

import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { updateCliente } from '@/app/lib/actions';

export default function EditClienteForm({ cliente }: { cliente: any }) {
  const updateClienteWithId = updateCliente.bind(null, cliente.id);

  return (
    <form action={updateClienteWithId}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Razón Social */}
        <div className="mb-4">
          <label htmlFor="razon_social" className="mb-2 block text-sm font-medium">
            Razón Social
          </label>
          <input
            id="razon_social"
            name="razon_social"
            type="text"
            defaultValue={cliente.razon_social}
            className="peer block w-full rounded-md border border-gray-200 py-2 pl-3 text-sm outline-2 placeholder:text-gray-500"
          />
        </div>

        {/* Modalidad de Pago */}
        <div className="mb-4">
          <label htmlFor="modalidad_de_pago" className="mb-2 block text-sm font-medium">
            Modalidad de Pago
          </label>
          <input
            id="modalidad_de_pago"
            name="modalidad_de_pago"
            type="text"
            defaultValue={cliente.modalidad_de_pago}
            className="peer block w-full rounded-md border border-gray-200 py-2 pl-3 text-sm outline-2 placeholder:text-gray-500"
          />
        </div>

        {/* Contactar */}
        <div className="mb-4">
          <label htmlFor="contactar" className="mb-2 block text-sm font-medium">
            Contactar
          </label>
          <input
            id="contactar"
            name="contactar"
            type="checkbox"
            defaultChecked={cliente.contactar}
            className="rounded"
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/clientes"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancelar
        </Link>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
}