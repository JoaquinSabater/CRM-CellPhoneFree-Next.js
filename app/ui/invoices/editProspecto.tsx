'use client';

import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { updateProspecto } from '@/app/lib/actions';

export default function EditProspectoForm({ prospecto, provincias, localidades }: any) {
  const updateWithId = updateProspecto.bind(null, prospecto.id);

  const inputBase = 'peer block w-full rounded-md border py-2 pl-3 text-sm outline-2 placeholder:text-gray-500';

  return (
    <form action={updateWithId}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fecha_contacto" className="block text-sm font-medium mb-1">Fecha de Contacto</label>
          <input
            id="fecha_contacto"
            name="fecha_contacto"
            type="date"
            defaultValue={
              prospecto.fecha_contacto && !isNaN(new Date(prospecto.fecha_contacto).getTime())
                ? new Date(prospecto.fecha_contacto).toISOString().slice(0, 10)
                : ''
            }
            className={inputBase}
          />
        </div>

        <div>
          <label htmlFor="por_donde_llego" className="block text-sm font-medium mb-1">¿Por dónde llegó?</label>
          <input
            id="por_donde_llego"
            name="por_donde_llego"
            type="text"
            defaultValue={prospecto.por_donde_llego}
            className={inputBase}
          />
        </div>

        <div>
          <label htmlFor="nombre" className="block text-sm font-medium mb-1">Nombre</label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            defaultValue={prospecto.nombre}
            className={inputBase}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={prospecto.email}
            className={inputBase}
          />
        </div>

        <div>
          <label htmlFor="telefono" className="block text-sm font-medium mb-1">Teléfono</label>
          <input
            id="telefono"
            name="telefono"
            type="text"
            defaultValue={prospecto.telefono}
            className={inputBase}
          />
        </div>

        <div>
          <label htmlFor="negocio" className="block text-sm font-medium mb-1">Tipo de Negocio</label>
          <input
            id="negocio"
            name="negocio"
            type="text"
            defaultValue={prospecto.negocio}
            className={inputBase}
          />
        </div>

        {/* Provincia */}
        <div>
          <label htmlFor="provincia_id" className="block text-sm font-medium mb-1">
            Provincia
          </label>
          <select
            id="provincia_id"
            name="provincia_id"
            defaultValue={prospecto.provincia_id?.toString()}
            className={inputBase}
            required
          >
            <option value="">Selecciona una provincia</option>
            {provincias.map((provincia: any) => (
              <option key={provincia.id} value={provincia.id}>
                {provincia.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Localidad */}
        <div>
          <label htmlFor="localidad_id" className="block text-sm font-medium mb-1">
            Ciudad / Localidad
          </label>
          <select
            id="localidad_id"
            name="localidad_id"
            defaultValue={prospecto.localidad_id?.toString()}
            className={inputBase}
            required
          >
            <option value="">Selecciona una localidad</option>
            {localidades.map((localidad: any) => (
              <option key={localidad.id} value={localidad.id}>
                {localidad.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cuit" className="block text-sm font-medium mb-1">CUIT</label>
          <input
            id="cuit"
            name="cuit"
            type="text"
            defaultValue={prospecto.cuit}
            className={inputBase}
          />
        </div>

        {/* Seguimientos con radio buttons */}
        <div className="flex flex-col justify-center mt-1">
          <label className="block text-sm font-medium mb-1">Seguimientos</label>
          <div className="flex gap-4">
            <div className="flex items-center gap-1">
              <input
                type="radio"
                id="segundo_contacto"
                name="seguimiento"
                value="2"
              />
              <label htmlFor="segundo_contacto" className="text-sm">2º contacto</label>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="radio"
                id="tercer_contacto"
                name="seguimiento"
                value="3"
              />
              <label htmlFor="tercer_contacto" className="text-sm">3º contacto</label>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="radio"
                id="cuarto_contacto"
                name="seguimiento"
                value="4"
              />
              <label htmlFor="cuarto_contacto" className="text-sm">4º contacto</label>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="anotaciones" className="block text-sm font-medium mb-1">Anotaciones</label>
          <textarea
            id="anotaciones"
            name="anotaciones"
            defaultValue={prospecto.anotaciones}
            rows={4}
            className={`${inputBase} resize-none`}
          />
        </div>

        <div>
          <label htmlFor="fecha_pedido_asesoramiento" className="block text-sm font-medium mb-1">Fecha Pedido Asesoramiento</label>
          <input
            id="fecha_pedido_asesoramiento"
            name="fecha_pedido_asesoramiento"
            type="date"
            defaultValue={
              prospecto.fecha_pedido_asesoramiento && !isNaN(new Date(prospecto.fecha_pedido_asesoramiento).getTime())
                ? new Date(prospecto.fecha_pedido_asesoramiento).toISOString().slice(0, 10)
                : ''
            }
            className={inputBase}
          />
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-1">URL</label>
          <input
            id="url"
            name="url"
            type="text"
            defaultValue={prospecto.url}
            className={inputBase}
          />
        </div>
      </div>

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


