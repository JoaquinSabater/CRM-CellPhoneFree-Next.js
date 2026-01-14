'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/app/ui/button';
import MapPicker from '@/app/ui/map-picker';
import { createCliente } from '@/app/lib/actions';

interface CreateClienteFormProps {
  provincias: { id: number; nombre: string }[];
  localidades: { id: number; nombre: string; provincia_id: number }[];
  condicionesIVA: { id: number; codigo: string; descripcion: string }[];
  condicionesIIBB: { id: number; codigo: string; descripcion: string }[];
  vendedores: { id: number; nombre: string }[];
  transportes: { id: number; nombre: string }[];
}

export default function CreateClienteForm({ 
  provincias, 
  localidades, 
  condicionesIVA, 
  condicionesIIBB,
  vendedores,
  transportes 
}: CreateClienteFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedProvinciaId, setSelectedProvinciaId] = useState<number | null>(null);
  const [direcciones, setDirecciones] = useState<any[]>([]);
  const [lat, setLat] = useState<number>(-34.6037);
  const [lng, setLng] = useState<number>(-58.3816);
  const [direccionCompleta, setDireccionCompleta] = useState('');
  const [origenSeleccionado, setOrigenSeleccionado] = useState<string>('');

  const localidadesFiltradas = selectedProvinciaId
    ? localidades.filter(l => l.provincia_id === selectedProvinciaId)
    : [];

  const agregarDireccion = () => {
    setDirecciones([...direcciones, {
      id: Date.now(),
      direccion: '',
      localidad_id: '',
      provincia_id: '',
      transporte_id: '',
    }]);
  };

  const eliminarDireccion = (id: number) => {
    setDirecciones(direcciones.filter(d => d.id !== id));
  };

  const actualizarDireccion = (id: number, campo: string, valor: any) => {
    setDirecciones(prevDirecciones => 
      prevDirecciones.map(d => 
        d.id === id ? { ...d, [campo]: valor || '' } : d
      )
    );
  };

  // Construir dirección para geocoding
  const construirDireccion = () => {
    const razonSocial = (document.getElementById('razon_social') as HTMLInputElement)?.value || '';
    const domicilio = (document.getElementById('domicilio') as HTMLInputElement)?.value || '';
    const provinciaSelect = document.getElementById('provincia_id') as HTMLSelectElement;
    const localidadSelect = document.getElementById('localidad_id') as HTMLSelectElement;
    
    const provinciaNombre = provinciaSelect?.selectedOptions[0]?.text || '';
    const localidadNombre = localidadSelect?.selectedOptions[0]?.text || '';
    
    const direccion = [domicilio, localidadNombre, provinciaNombre, 'Argentina']
      .filter(Boolean)
      .join(', ');
    
    setDireccionCompleta(direccion);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!lat || !lng) {
      alert('⚠️ Debe geocodificar la dirección en el mapa antes de guardar');
      return;
    }

    const formData = new FormData(formRef.current!);
    formData.set('lat', lat.toString());
    formData.set('lng', lng.toString());
    
    // Agregar direcciones adicionales como JSON
    formData.set('direcciones', JSON.stringify(direcciones));
    
    await createCliente(formData);
  }

  const inputBase = 'peer block w-full rounded-md border border-gray-300 py-2 pl-3 text-sm outline-2 placeholder:text-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-200';
  const selectBase = 'peer block w-full rounded-md border border-gray-300 py-2 pl-3 text-sm outline-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200';

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        
        {/* DATOS GENERALES */}
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Datos Generales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="razon_social" className="block text-sm font-medium mb-1">
              Razón Social <span className="text-red-500">*</span>
            </label>
            <input 
              id="razon_social" 
              name="razon_social"
              type="text" 
              required
              className={inputBase}
              placeholder="Nombre de la empresa"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input 
              id="email" 
              name="email"
              type="email" 
              required
              className={inputBase}
              placeholder="contacto@empresa.com"
            />
          </div>

          <div>
            <label htmlFor="nombre" className="block text-sm font-medium mb-1">Nombre</label>
            <input id="nombre" name="nombre" type="text" className={inputBase} />
          </div>

          <div>
            <label htmlFor="apellido" className="block text-sm font-medium mb-1">Apellido</label>
            <input id="apellido" name="apellido" type="text" className={inputBase} />
          </div>

          <div>
            <label htmlFor="telefono" className="block text-sm font-medium mb-1">Teléfono</label>
            <input id="telefono" name="telefono" type="text" className={inputBase} />
          </div>

          <div>
            <label htmlFor="contacto" className="block text-sm font-medium mb-1">Contacto</label>
            <input id="contacto" name="contacto" type="text" className={inputBase} />
          </div>

          <div>
            <label htmlFor="cuit_dni" className="block text-sm font-medium mb-1">
              CUIT/DNI <span className="text-red-500">*</span>
            </label>
            <input 
              id="cuit_dni" 
              name="cuit_dni"
              type="text" 
              required
              className={inputBase}
              placeholder="20123456789"
            />
          </div>

          <div>
            <label htmlFor="vendedor_id" className="block text-sm font-medium mb-1">
              Vendedor Asignado <span className="text-red-500">*</span>
            </label>
            <select id="vendedor_id" name="vendedor_id" required className={selectBase}>
              <option value="">Seleccione un vendedor</option>
              {vendedores.map(v => (
                <option key={v.id} value={v.id}>{v.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* CONDICIONES FISCALES */}
        <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-8">💼 Condiciones Fiscales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="condicion_iva_id" className="block text-sm font-medium mb-1">
              Condición IVA <span className="text-red-500">*</span>
            </label>
            <select id="condicion_iva_id" name="condicion_iva_id" required className={selectBase}>
              <option value="">Seleccione condición</option>
              {condicionesIVA.map(c => (
                <option key={c.id} value={c.id}>{c.descripcion}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="condicion_iibb_id" className="block text-sm font-medium mb-1">
              Condición IIBB <span className="text-red-500">*</span>
            </label>
            <select id="condicion_iibb_id" name="condicion_iibb_id" required className={selectBase}>
              <option value="">Seleccione condición</option>
              {condicionesIIBB.map(c => (
                <option key={c.id} value={c.id}>{c.descripcion}</option>
              ))}
            </select>
          </div>
        </div>

        {/* UBICACIÓN PRINCIPAL */}
        <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-8">📍 Ubicación Principal (Obligatoria)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="domicilio" className="block text-sm font-medium mb-1">
              Domicilio <span className="text-red-500">*</span>
            </label>
            <input 
              id="domicilio" 
              name="domicilio"
              type="text" 
              required
              className={inputBase}
              placeholder="Calle y número"
              onChange={construirDireccion}
            />
          </div>

          <div>
            <label htmlFor="provincia_id" className="block text-sm font-medium mb-1">
              Provincia <span className="text-red-500">*</span>
            </label>
            <select 
              id="provincia_id" 
              name="provincia_id" 
              required
              className={selectBase}
              onChange={(e) => {
                setSelectedProvinciaId(Number(e.target.value));
                construirDireccion();
              }}
            >
              <option value="">Seleccione provincia</option>
              {provincias.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="localidad_id" className="block text-sm font-medium mb-1">
              Localidad <span className="text-red-500">*</span>
            </label>
            <select 
              id="localidad_id" 
              name="localidad_id" 
              required
              className={selectBase}
              disabled={!selectedProvinciaId}
              onChange={construirDireccion}
            >
              <option value="">Seleccione localidad</option>
              {localidadesFiltradas.map(l => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* MAPA DE GEOLOCALIZACIÓN */}
        <div className="mb-6 p-4 bg-white rounded-lg border">
          <h4 className="text-md font-semibold mb-3">🗺️ Geolocalización (Obligatoria)</h4>
          <p className="text-sm text-gray-600 mb-4">
            Complete la dirección arriba y luego busque en el mapa. Puede ajustar la ubicación arrastrando el marcador.
          </p>
          <MapPicker
            initialLat={lat}
            initialLng={lng}
            onLocationChange={(newLat, newLng) => {
              setLat(newLat);
              setLng(newLng);
            }}
            address={direccionCompleta}
          />
        </div>

        {/* OBSERVACIONES */}
        <div className="mb-6">
          <label htmlFor="observaciones" className="block text-sm font-medium mb-1">
            Observaciones
          </label>
          <textarea
            id="observaciones"
            name="observaciones"
            className={inputBase}
            rows={3}
            placeholder="Notas o comentarios sobre el cliente..."
          />
        </div>

        {/* ORIGEN DEL CLIENTE */}
        <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-8">🎯 Origen del Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="origen" className="block text-sm font-medium mb-1">
              Origen
            </label>
            <select 
              id="origen" 
              name="origen" 
              className={selectBase}
              onChange={(e) => setOrigenSeleccionado(e.target.value)}
            >
              <option value="">Seleccionar origen...</option>
              <option value="campaña">Campaña</option>
              <option value="presencial">Presencial</option>
              <option value="referido">Referido</option>
            </select>
          </div>

          {origenSeleccionado === 'referido' && (
            <div>
              <label htmlFor="referidor_nombre" className="block text-sm font-medium mb-1">
                Nombre del Referidor
              </label>
              <input
                id="referidor_nombre"
                name="referidor_nombre"
                type="text"
                className={inputBase}
                placeholder="¿Quién lo refirió?"
              />
            </div>
          )}
        </div>

        {origenSeleccionado === 'referido' && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Tipo de Venta</label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="tipo_venta_referido"
                  value="presencial"
                  className="w-4 h-4"
                />
                <span className="text-sm">Presencial</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="tipo_venta_referido"
                  value="remota"
                  className="w-4 h-4"
                />
                <span className="text-sm">Remota</span>
              </label>
            </div>
          </div>
        )}

        {/* DIRECCIONES ADICIONALES */}
        <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-8">📫 Direcciones Adicionales (Opcional)</h3>
        <div className="space-y-4 mb-6">
          {direcciones.map((dir, index) => {
            const localidadesFiltradas = dir.provincia_id
              ? localidades.filter(l => l.provincia_id === Number(dir.provincia_id))
              : [];
            
            return (
              <div key={dir.id} className="p-4 bg-white rounded-lg border">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-700">Dirección #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => eliminarDireccion(dir.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={dir.direccion}
                      onChange={(e) => actualizarDireccion(dir.id, 'direccion', e.target.value)}
                      className={inputBase}
                      placeholder="Calle y número"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Provincia
                    </label>
                    <select
                      value={dir.provincia_id || ''}
                      onChange={(e) => {
                        actualizarDireccion(dir.id, 'provincia_id', e.target.value);
                        actualizarDireccion(dir.id, 'localidad_id', '');
                      }}
                      className={selectBase}
                    >
                      <option value="">Seleccione una provincia</option>
                      {provincias.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Localidad
                    </label>
                    <select
                      value={dir.localidad_id || ''}
                      onChange={(e) => {
                        actualizarDireccion(dir.id, 'localidad_id', e.target.value);
                      }}
                      className={selectBase}
                      disabled={!dir.provincia_id || dir.provincia_id === ''}
                    >
                      <option value="">Seleccione una localidad</option>
                      {localidadesFiltradas.map(l => (
                        <option key={l.id} value={l.id}>{l.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Transporte
                    </label>
                    <select
                      value={dir.transporte_id || ''}
                      onChange={(e) => {
                        actualizarDireccion(dir.id, 'transporte_id', e.target.value);
                      }}
                      className={selectBase}
                    >
                      <option value="">Seleccione un transporte</option>
                      {transportes.map(t => (
                        <option key={t.id} value={t.id}>{t.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
          <button
            type="button"
            onClick={agregarDireccion}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-500 hover:text-orange-500 transition-colors"
          >
            ➕ Agregar Dirección Adicional
          </button>
        </div>
      </div>

      {/* BOTONES */}
      <div className="flex justify-end gap-4">
        <Link
          href="/dashboard/invoices"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancelar
        </Link>
        <Button type="submit">✨ Crear Cliente</Button>
      </div>
    </form>
  );
}
