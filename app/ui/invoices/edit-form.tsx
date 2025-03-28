'use client';

import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { updateCliente } from '@/app/lib/actions';
import PedidosDelCliente from '@/app/ui/invoices/PedidosDelCliente';

export default function EditClienteForm({ cliente, pedidos }: { cliente: any; pedidos: any[] }) {
  const updateClienteWithId = updateCliente.bind(null, cliente.id);

  const inputBase = 'peer block w-full rounded-md border py-2 pl-3 text-sm outline-2 placeholder:text-gray-500';
  const readOnlyStyle = 'bg-gray-100 text-gray-500 cursor-not-allowed';

  return (
    <form action={updateClienteWithId}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Grid de dos columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Campos solo lectura */}
          <div>
            <label htmlFor="razon_social" className="block text-sm font-medium mb-1">Razón Social</label>
            <input id="razon_social" type="text" defaultValue={cliente.razon_social} readOnly className={`${inputBase} ${readOnlyStyle}`} />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input id="email" type="email" defaultValue={cliente.email} readOnly className={`${inputBase} ${readOnlyStyle}`} />
          </div>
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium mb-1">Nombre</label>
            <input id="nombre" type="text" defaultValue={cliente.nombre} readOnly className={`${inputBase} ${readOnlyStyle}`} />
          </div>
          <div>
            <label htmlFor="apellido" className="block text-sm font-medium mb-1">Apellido</label>
            <input id="apellido" type="text" defaultValue={cliente.apellido} readOnly className={`${inputBase} ${readOnlyStyle}`} />
          </div>
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium mb-1">Teléfono</label>
            <input id="telefono" type="text" defaultValue={cliente.telefono} readOnly className={`${inputBase} ${readOnlyStyle}`} />
          </div>
          <div>
            <label htmlFor="contacto" className="block text-sm font-medium mb-1">Contacto</label>
            <input id="contacto" type="text" defaultValue={cliente.contacto} readOnly className={`${inputBase} ${readOnlyStyle}`} />
          </div>
          <div>
            <label htmlFor="domicilio" className="block text-sm font-medium mb-1">Domicilio</label>
            <input id="domicilio" type="text" defaultValue={cliente.domicilio} readOnly className={`${inputBase} ${readOnlyStyle}`} />
          </div>
          <div>
            <label htmlFor="cuit_dni" className="block text-sm font-medium mb-1">CUIT / DNI</label>
            <input id="cuit_dni" type="text" defaultValue={cliente.cuit_dni} readOnly className={`${inputBase} ${readOnlyStyle}`} />
          </div>

          {/* Campos editables */}
          <div>
            <label htmlFor="modalidad_de_pago" className="block text-sm font-medium mb-1">Modalidad de Pago</label>
            <input id="modalidad_de_pago" name="modalidad_de_pago" type="text" defaultValue={cliente.modalidad_de_pago} className={inputBase} />
          </div>
          <div>
            <label htmlFor="tipo_de_cliente" className="block text-sm font-medium mb-1">Tipo de Cliente</label>
            <input id="tipo_de_cliente" name="tipo_de_cliente" type="text" defaultValue={cliente.tipo_de_cliente} className={inputBase} />
          </div>
          <div>
            <label htmlFor="cantidad_de_dias" className="block text-sm font-medium mb-1">Cantidad de Días</label>
            <input id="cantidad_de_dias" name="cantidad_de_dias" type="number" defaultValue={cliente.cantidad_de_dias} className={inputBase} />
          </div>
          <div>
            <label htmlFor="monto" className="block text-sm font-medium mb-1">Monto</label>
            <input id="monto" name="monto" type="number" defaultValue={cliente.monto} className={inputBase} />
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-2 mt-2">
            <input id="contactar" name="contactar" type="checkbox" defaultChecked={cliente.contactar} />
            <label htmlFor="contactar" className="text-sm">Contactar</label>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input id="cuenta_corriente" name="cuenta_corriente" type="checkbox" defaultChecked={cliente.cuenta_corriente} />
            <label htmlFor="cuenta_corriente" className="text-sm">Cuenta Corriente</label>
          </div>

          {/* Más campos de solo lectura */}
          <div>
            <label htmlFor="provincia" className="block text-sm font-medium mb-1">Provincia</label>
            <input id="provincia" type="text" defaultValue={cliente.provincia_nombre} readOnly className={`${inputBase} ${readOnlyStyle}`} />
          </div>
          <div>
            <label htmlFor="localidad" className="block text-sm font-medium mb-1">Localidad</label>
            <input id="localidad" type="text" defaultValue={cliente.localidad_nombre} readOnly className={`${inputBase} ${readOnlyStyle}`} />
          </div>
        </div>

        {/* Pedidos */}
        <div className="mt-8">
          <PedidosDelCliente pedidos={pedidos} />
        </div>
      </div>

      {/* Botones */}
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/invoices"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancelar
        </Link>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
}
