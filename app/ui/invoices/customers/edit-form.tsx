'use client';

import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { updateCliente} from '@/app/lib/actions';
import PedidosDelCliente from '@/app/ui/invoices/customers/PedidosDelCliente';
import TopItemsDelCliente from '@/app/ui/invoices/customers/TopItemsDelCliente';
import ClientesDinero from './ClientesDinero';
import PedidosPorMes from './PedidosPorMes';
import { useSearchParams } from 'next/navigation';
import ProductosPorMarca from './ProductoPorMarca';
import { useRef } from 'react';

export default function EditClienteForm({ cliente, pedidos, filtrosDisponibles, filtrosCliente, topArticulos, marcas }: any) {
  const formRef = useRef<HTMLFormElement>(null);
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const cancelHref = from === 'dashboard' ? '/dashboard' : '/dashboard/invoices';

  const filtrosActivos = new Map<number, string>();
  filtrosCliente.forEach((f: any) => {
    filtrosActivos.set(f.filtro_id, f.valor);
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(formRef.current!);
    await updateCliente(cliente.id, formData, filtrosDisponibles);
  }

  const inputBase = 'peer block w-full rounded-md border py-2 pl-3 text-sm outline-2 placeholder:text-gray-500';
  const readOnlyStyle = 'bg-gray-100 text-gray-500 cursor-not-allowed';

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
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
          <div>
            <label htmlFor="provincia" className="block text-sm font-medium mb-1">Provincia</label>
            <input id="provincia" type="text" defaultValue={cliente.provincia_nombre} readOnly className={`${inputBase} ${readOnlyStyle}`} />
          </div>
          <div>
            <label htmlFor="localidad" className="block text-sm font-medium mb-1">Localidad</label>
            <input id="localidad" type="text" defaultValue={cliente.localidad_nombre} readOnly className={`${inputBase} ${readOnlyStyle}`} />
          </div>
        </div>

        {/* Observaciones - Campo editable del cliente */}
        <div className="mt-4">
          <label htmlFor="observaciones" className="block text-sm font-medium mb-1">
            Observaciones
          </label>
          <textarea
            id="observaciones"
            name="observaciones"
            defaultValue={cliente.observaciones || ''}
            className="w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
            rows={3}
            placeholder="Observaciones generales del cliente..."
          />
        </div>

        {/* Habilitar Carrito - Nueva opción */}
        <div className="mt-6 p-4 bg-white rounded-lg border">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="habilitado"
              name="habilitado"
              value="1"
              defaultChecked={cliente.habilitado === 1}
              className="h-5 w-5 rounded border-2 border-orange-500 focus:ring-2 focus:ring-orange-300 transition-all duration-150"
              style={{ accentColor: '#F97316' }}
            />
            <label htmlFor="habilitado" className="flex items-center cursor-pointer">
              <span className="text-sm font-semibold text-gray-700">
                🛒 Habilitar Carrito de Compras
              </span>
            </label>
          </div>
          <p className="mt-2 text-xs text-gray-500 ml-8">
            Permitir que este cliente acceda y use el carrito de compras en la plataforma
          </p>
        </div>

        {/* Filtros dinámicos agrupados por categoría */}
        <div className="mt-8">
          <h3 className="text-md font-semibold text-gray-800 mb-4">Filtros / Etiquetas</h3>
          {filtrosDisponibles.length === 0 ? (
            <p className="text-sm italic text-gray-500">No hay filtros disponibles.</p>
          ) : (
            (() => {
              const filtrosAgrupados = filtrosDisponibles.reduce((acc: any, filtro: any) => {
                const cat = filtro.categoria || 'OTROS'
                if (!acc[cat]) acc[cat] = []
                acc[cat].push(filtro)
                return acc
              }, {})

              return Object.entries(filtrosAgrupados).map(([categoria, filtros]) => (
                <div key={categoria} className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">{categoria}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
                    {(filtros as any[]).map((filtro: any) => (
                      <div key={filtro.id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          style={{ accentColor: '#F97316' }}
                          id={`filtro-${filtro.id}`}
                          name={`filtro-${filtro.id}`}
                          value="1"
                          defaultChecked={filtrosActivos.get(filtro.id) === '1'}
                          className="h-5 w-5 rounded-full border-2 border-orange-500 focus:ring-2 focus:ring-orange-300 transition-all duration-150"
                        />
                        <label
                          htmlFor={`filtro-${filtro.id}`}
                          className="font-medium text-sm text-gray-700 select-none cursor-pointer"
                        >
                          {filtro.nombre}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            })()
          )}
        </div>

        {/* Top Artículos */}  
        <div className="mt-8">
          <TopItemsDelCliente items={topArticulos}/>
        </div>

        <div className="mt-8">
          <ProductosPorMarca clienteId={cliente.id} marcas={marcas} />
        </div>

        <div className="mt-8">
          <ClientesDinero clienteId={cliente.id} />
        </div>

        <div className="mt-8">
          <PedidosPorMes clienteId={cliente.id} />
        </div>

        <div className="mt-8">
          <PedidosDelCliente pedidos={pedidos} />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Link
          href={cancelHref}
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancelar
        </Link>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
}