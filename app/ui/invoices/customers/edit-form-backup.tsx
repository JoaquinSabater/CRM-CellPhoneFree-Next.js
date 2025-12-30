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
import { useRef, useState  } from 'react';

export default function EditClienteForm({ cliente, pedidos, filtrosDisponibles, filtrosCliente, topArticulos, marcas }: any) {
  const formRef = useRef<HTMLFormElement>(null);
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const cancelHref = from === 'dashboard' ? '/dashboard' : '/dashboard/invoices';

  const [mostrarNuevaPassword, setMostrarNuevaPassword] = useState(false);
  const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);


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

        <div className="mt-4 p-4 bg-white rounded-lg border">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="contenidoEspecial"
              name="contenidoEspecial"
              value="1"
              defaultChecked={cliente.contenidoEspecial === 1}
              className="h-5 w-5 rounded border-2 border-purple-500 focus:ring-2 focus:ring-purple-300 transition-all duration-150"
              style={{ accentColor: '#8B5CF6' }}
            />
            <label htmlFor="contenidoEspecial" className="flex items-center cursor-pointer">
              <span className="text-sm font-semibold text-gray-700">
                ⭐ Habilitar Contenido Especial
              </span>
            </label>
          </div>
          <p className="mt-2 text-xs text-gray-500 ml-8">
            Permitir que este cliente acceda a contenido premium o exclusivo
          </p>
        </div>

        <div className="mt-4 p-4 bg-white rounded-lg border">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="Distribuidor"
              name="Distribuidor"
              value="1"
              defaultChecked={cliente.Distribuidor === 1}
              className="h-5 w-5 rounded border-2 border-green-500 focus:ring-2 focus:ring-green-300 transition-all duration-150"
              style={{ accentColor: '#10B981' }}
            />
            <label htmlFor="Distribuidor" className="flex items-center cursor-pointer">
              <span className="text-sm font-semibold text-gray-700">
                🏢 Habilitar como Distribuidor
              </span>
            </label>
          </div>
          <p className="mt-2 text-xs text-gray-500 ml-8">
            Marcar este cliente como distribuidor autorizado con precios especiales
          </p>
        </div>

        <div className="mt-8">
          <h3 className="text-md font-semibold text-gray-800 mb-4">🔐 Gestión de Acceso al Sistema</h3>
          <div className="p-4 bg-white rounded-lg border">
            {cliente.tiene_acceso ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-green-600">
                  <span className="text-sm">✅ Este cliente tiene acceso al sistema</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nueva_password" className="block text-sm font-medium mb-1">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="nueva_password"
                        name="nueva_password"
                        type={mostrarNuevaPassword ? "text" : "password"}
                        className="w-full rounded-md border px-3 py-2 pr-10 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        placeholder="Dejar vacío para mantener actual"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarNuevaPassword(!mostrarNuevaPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        {mostrarNuevaPassword ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="confirmar_password" className="block text-sm font-medium mb-1">
                      Confirmar Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="confirmar_password"
                        name="confirmar_password"
                        type={mostrarConfirmarPassword ? "text" : "password"}
                        className="w-full rounded-md border px-3 py-2 pr-10 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        placeholder="Repetir nueva contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarConfirmarPassword(!mostrarConfirmarPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        {mostrarConfirmarPassword ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500">
                  💡 Si deja los campos vacíos, la contraseña actual se mantendrá sin cambios
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-500">
                  <span className="text-sm">❌ Este cliente no tiene acceso al sistema</span>
                </div>
                <p className="text-xs text-gray-500">
                  Para darle acceso, debe crearse manualmente en la administración del sistema
                </p>
              </div>
            )}
          </div>
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