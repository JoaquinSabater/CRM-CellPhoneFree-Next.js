'use client';

import { useState, useEffect } from 'react';
import { redirect, useRouter } from 'next/navigation';
import { updateProspecto,altaCliente } from '@/app/lib/actions';
import { Button } from '@/app/ui/button';
import Link from 'next/link';

export default function EditProspectoForm({ prospecto, provincias, localidades, vendedores }: any) {
  const router = useRouter();
  const updateWithId = updateProspecto.bind(null, prospecto.id);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const [provinciaId, setProvinciaId] = useState<string>(prospecto.provincia_id?.toString() || '');
  const [localidadesFiltradas, setLocalidadesFiltradas] = useState<any[]>([]);
  const [localidadId, setLocalidadId] = useState<string>(prospecto.localidad_id?.toString() || '');

  const inputBase = 'peer block w-full rounded-md border py-2 pl-3 text-sm outline-2 placeholder:text-gray-500';

  const redireccion = () => {
    setSuccessMessage('✅ Dado de alta correctamente. Tocá Cancelar o Customers para volver atrás.');
  }

  // Filtra las localidades cuando cambia la provincia
  useEffect(() => {
    if (!provinciaId) return;
    const filtradas = localidades.filter((l: any) => l.provincia_id == provinciaId);
    setLocalidadesFiltradas(filtradas);
  }, [provinciaId, localidades]);

  // Si ya hay localidad seleccionada, deduce la provincia y actualiza
  useEffect(() => {
    if (!provinciaId && prospecto.localidad_id) {
      const localidad = localidades.find((l: any) => l.id === prospecto.localidad_id);
      if (localidad) {
        setProvinciaId(localidad.provincia_id.toString());
      }
    }
  }, [prospecto.localidad_id, localidades]);

  const handleProvinciaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProvinciaId(e.target.value);
  };

  return (
    <>
      {/* Form principal para editar el prospecto */}
      <form action={updateWithId}>
        <div className="rounded-md bg-gray-50 p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fecha */}
          <div>
            <label htmlFor="fecha_contacto" className="block text-sm font-medium mb-1">Fecha de Contacto</label>
            <input
              id="fecha_contacto"
              name="fecha_contacto"
              type="date"
              defaultValue={prospecto.fecha_contacto ? new Date(prospecto.fecha_contacto).toISOString().slice(0, 10) : ''}
              className={inputBase}
            />
          </div>

          {/* Por dónde llegó */}
          <div>
            <label htmlFor="por_donde_llego" className="block text-sm font-medium mb-1">¿Por dónde llegó?</label>
            <select
              id="por_donde_llego"
              name="por_donde_llego"
              defaultValue={prospecto.por_donde_llego || ''}
              className={inputBase}
              required
            >
              <option value="">Selecciona una opción</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="googleAds">Google Ads</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          <div>
            <label htmlFor="nombre" className="block text-sm font-medium mb-1">Nombre</label>
            <input id="nombre" name="nombre" type="text" defaultValue={prospecto.nombre} className={inputBase} />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input id="email" name="email" type="email" defaultValue={prospecto.email} className={inputBase} />
          </div>

          <div>
            <label htmlFor="telefono" className="block text-sm font-medium mb-1">Teléfono</label>
            <input id="telefono" name="telefono" type="text" defaultValue={prospecto.telefono} className={inputBase} />
          </div>

          <div>
            <label htmlFor="negocio" className="block text-sm font-medium mb-1">Tipo de Negocio</label>
            <input id="negocio" name="negocio" type="text" defaultValue={prospecto.negocio} className={inputBase} />
          </div>

          {/* Provincia */}
          <div>
            <label htmlFor="provincia_id" className="block text-sm font-medium mb-1">Provincia</label>
            <select
              name="provincia_id"
              id="provincia_id"
              className={inputBase}
              value={provinciaId}
              onChange={handleProvinciaChange}
            >
              <option value="">Selecciona una provincia</option>
              {provincias.map((prov: any) => (
                <option key={prov.id} value={prov.id}>{prov.nombre}</option>
              ))}
            </select>
          </div>

          {/* Localidad */}
          <div>
            <label htmlFor="localidad_id" className="block text-sm font-medium mb-1">Localidad</label>
            <select
              name="localidad_id"
              id="localidad_id"
              className={inputBase}
              value={localidadId}
              onChange={(e) => setLocalidadId(e.target.value)}
            >
              <option value="">Selecciona una localidad</option>
              {localidadesFiltradas.map((loc: any) => (
                <option key={loc.id} value={loc.id}>
                  {`${loc.nombre} - ${loc.codigopostal}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cuit" className="block text-sm font-medium mb-1">CUIT</label>
            <input id="cuit" name="cuit" type="text" defaultValue={prospecto.cuit} className={inputBase} />
          </div>

          {/* Seguimientos */}
          <div className="flex flex-col justify-center mt-1">
            <label className="block text-sm font-medium mb-1">Seguimientos</label>
            <div className="flex gap-4">
              {[2, 3, 4].map((n) => (
                <div key={n} className="flex items-center gap-1">
                  <input type="radio" id={`seguimiento_${n}`} name="seguimiento" value={n} />
                  <label htmlFor={`seguimiento_${n}`} className="text-sm">{n}º contacto</label>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="anotaciones" className="block text-sm font-medium mb-1">Anotaciones</label>
            <textarea id="anotaciones" name="anotaciones" defaultValue={prospecto.anotaciones} rows={4} className={`${inputBase} resize-none`} />
          </div>

          <div>
            <label htmlFor="fecha_pedido_asesoramiento" className="block text-sm font-medium mb-1">Fecha Pedido Asesoramiento</label>
            <input
              id="fecha_pedido_asesoramiento"
              name="fecha_pedido_asesoramiento"
              type="date"
              defaultValue={
                prospecto.fecha_pedido_asesoramiento
                  ? new Date(prospecto.fecha_pedido_asesoramiento).toISOString().slice(0, 10)
                  : ''
              }
              className={inputBase}
            />
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium mb-1">URL</label>
            <input id="url" name="url" type="text" defaultValue={prospecto.url} className={inputBase} />
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

      {/* Form separado para dar de alta como cliente */}
      <form
        action={altaCliente.bind(null, prospecto.id)}
        className="md:col-span-2 border-t pt-6 mt-10 space-y-4"
      >
        <label htmlFor="vendedor_id" className="block text-sm font-medium">
          Asignar a Vendedor
        </label>

        <select name="vendedor_id" id="vendedor_id" className={inputBase} required>
          <option value="">Selecciona un vendedor</option>
          {vendedores.map((v: any) => (
            <option key={v.id} value={v.id}>{v.nombre}</option>
          ))}
        </select>

        <div className="flex items-center gap-6 justify-start mt-4">
          <Button type="submit" onClick={redireccion}>
            Alta
          </Button>

          {successMessage && (
            <div className="p-3 rounded bg-green-100 text-green-800 border border-green-300 shadow-sm">
              {successMessage}
            </div>
          )}
        </div>

      </form>
    </>
  );
}


