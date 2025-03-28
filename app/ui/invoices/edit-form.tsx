'use client';

import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { updateCliente } from '@/app/lib/actions';
import { clienteForm, pedido } from '@/app/lib/definitions';
import PedidosDelCliente from './PedidosDelCliente';

type Props = {
  cliente: clienteForm;
  pedidos: pedido[];
};

export default function EditClienteForm({ cliente, pedidos }: Props) {
  const updateClienteWithId = updateCliente.bind(null, String(cliente.id));

  return (
    <form action={updateClienteWithId}>
      {/* 🔲 Recuadro gris con los datos del cliente y sus pedidos */}
      <div className="rounded-md bg-gray-50 p-4 md:p-6 space-y-6">
        {/* 🧾 Datos del Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="razon_social" className="block text-sm font-medium mb-1">Razón Social</label>
            <input id="razon_social" name="razon_social" type="text" defaultValue={cliente.razon_social} className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm" />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input id="email" name="email" type="email" defaultValue={cliente.email} className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm" />
          </div>

          <div>
            <label htmlFor="nombre" className="block text-sm font-medium mb-1">Nombre</label>
            <input id="nombre" name="nombre" type="text" defaultValue={cliente.nombre} className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm" />
          </div>

          <div>
            <label htmlFor="apellido" className="block text-sm font-medium mb-1">Apellido</label>
            <input id="apellido" name="apellido" type="text" defaultValue={cliente.apellido} className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm" />
          </div>

          <div>
            <label htmlFor="telefono" className="block text-sm font-medium mb-1">Teléfono</label>
            <input id="telefono" name="telefono" type="text" defaultValue={cliente.telefono} className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm" />
          </div>

          <div>
            <label htmlFor="contacto" className="block text-sm font-medium mb-1">Contacto</label>
            <input id="contacto" name="contacto" type="text" defaultValue={cliente.contacto} className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm" />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="domicilio" className="block text-sm font-medium mb-1">Domicilio</label>
            <input id="domicilio" name="domicilio" type="text" defaultValue={cliente.domicilio} className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm" />
          </div>

          <div>
            <label htmlFor="cuit_dni" className="block text-sm font-medium mb-1">CUIT / DNI</label>
            <input id="cuit_dni" name="cuit_dni" type="text" defaultValue={cliente.cuit_dni} className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm" />
          </div>

          <div>
            <label htmlFor="modalidad_de_pago" className="block text-sm font-medium mb-1">Modalidad de Pago</label>
            <input id="modalidad_de_pago" name="modalidad_de_pago" type="text" defaultValue={cliente.modalidad_de_pago} className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm" />
          </div>

          <div>
            <label htmlFor="tipo_de_cliente" className="block text-sm font-medium mb-1">Tipo de Cliente</label>
            <input id="tipo_de_cliente" name="tipo_de_cliente" type="text" defaultValue={cliente.tipo_de_cliente} className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm" />
          </div>

          <div className="flex items-center gap-2">
            <input id="contactar" name="contactar" type="checkbox" defaultChecked={cliente.contactar} className="rounded" />
            <label htmlFor="contactar" className="text-sm font-medium">Contactar</label>
          </div>

          <div>
            <label htmlFor="cantidad_de_dias" className="block text-sm font-medium mb-1">Cantidad de Días</label>
            <input id="cantidad_de_dias" name="cantidad_de_dias" type="number" defaultValue={cliente.cantidad_de_dias} className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm" />
          </div>

          <div className="flex items-center gap-2">
            <input id="cuenta_corriente" name="cuenta_corriente" type="checkbox" defaultChecked={cliente.cuenta_corriente} className="rounded" />
            <label htmlFor="cuenta_corriente" className="text-sm font-medium">Cuenta Corriente</label>
          </div>

          <div>
            <label htmlFor="monto" className="block text-sm font-medium mb-1">Monto</label>
            <input id="monto" name="monto" type="number" step="0.01" defaultValue={cliente.monto} className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm" />
          </div>

          {/* Localidad (solo vista) */}
          <div>
            <label className="block text-sm font-medium mb-1">Localidad</label>
            <div className="text-sm text-gray-800 py-2 px-3 bg-white border border-gray-200 rounded-md">
              {cliente.localidad_nombre || 'Sin localidad'}
            </div>
          </div>

          {/* Provincia (solo vista) */}
          <div>
            <label className="block text-sm font-medium mb-1">Provincia</label>
            <div className="text-sm text-gray-800 py-2 px-3 bg-white border border-gray-200 rounded-md">
              {cliente.provincia_nombre || 'Sin provincia'}
            </div>
          </div>
        </div>

        {/* 📦 Pedidos del Cliente */}
        <PedidosDelCliente pedidos={pedidos} />
      </div>

      {/* 🔘 Botones fuera del recuadro gris */}
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/clientes"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 hover:bg-gray-200"
        >
          Cancelar
        </Link>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
}

