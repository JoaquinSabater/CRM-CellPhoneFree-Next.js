'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProspecto } from '@/app/lib/actions';
import { ESTADOS_PROSPECTO, MOTIVOS_NO_COMPRA, TIPOS_COMERCIO } from '@/app/lib/prospect-options';

export default function CreateProspectoForm({
  provincias,
  localidades,
  vendedores,
}: {
  provincias: any[];
  localidades: any[];
  vendedores: any[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const [error, setError] = useState('');
  const [provinciaId, setProvinciaId] = useState('');
  const [localidadesFiltradas, setLocalidadesFiltradas] = useState<any[]>([]);


  const handleProvinciaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setProvinciaId(id);
    const filtradas = localidades.filter((l: any) => l.provincia_id == id);
    setLocalidadesFiltradas(filtradas);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      await createProspecto(formData);
      router.push('/dashboard/invoices');
    } catch (err) {
      console.error('❌ Error al crear prospecto:', err);
      setError('Ocurrió un error al crear el prospecto.');
      setIsSubmitting(false); // Permite reintentar si hay error
    }
  };

  const inputBase =
    'peer block w-full rounded-md border py-2 pl-3 text-sm outline-2 placeholder:text-gray-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Campos de texto */}
      <input type="text" name="nombre" placeholder="Nombre" className={inputBase} />
      <input type="email" name="email" placeholder="Email" className={inputBase} />
      <input type="text" name="telefono" placeholder="Teléfono" className={inputBase} />

      <select name="negocio" className={inputBase}>
        <option value="">Selecciona una opción</option>
        <option value="online">Online</option>
        <option value="fisico">Físico</option>
        <option value="fisicos y online">Fisicos y online</option>
        <option value="fisico mas de uno">Físico (mas de uno)</option>
        <option value="emprendedor">Emprendedor</option>
      </select>

      <div className="rounded-md border border-gray-200 p-4">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Datos comerciales y seguimiento</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="tipo_comercio" className="mb-1 block text-sm font-medium text-gray-700">Tipo de comercio</label>
            <select id="tipo_comercio" name="tipo_comercio" className={inputBase}>
              <option value="">Sin especificar</option>
              {TIPOS_COMERCIO.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cantidad_puntos_venta" className="mb-1 block text-sm font-medium text-gray-700">Cantidad de puntos de venta</label>
            <input id="cantidad_puntos_venta" name="cantidad_puntos_venta" type="number" min="0" step="1" className={inputBase} />
          </div>

          <div>
            <label htmlFor="codigo_anuncio" className="mb-1 block text-sm font-medium text-gray-700">Código de anuncio</label>
            <input id="codigo_anuncio" name="codigo_anuncio" type="text" maxLength={100} className={inputBase} />
          </div>

          <div>
            <label htmlFor="vendedor_asignado_id" className="mb-1 block text-sm font-medium text-gray-700">Vendedor asignado</label>
            <select id="vendedor_asignado_id" name="vendedor_asignado_id" className={inputBase}>
              <option value="">Sin asignar</option>
              {vendedores.map((vendedor: any) => (
                <option key={vendedor.id} value={vendedor.id}>{vendedor.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fecha_compra" className="mb-1 block text-sm font-medium text-gray-700">Fecha de compra</label>
            <input id="fecha_compra" name="fecha_compra" type="date" className={inputBase} />
          </div>

          <div>
            <label htmlFor="monto_primera_compra" className="mb-1 block text-sm font-medium text-gray-700">Monto de primera compra</label>
            <input id="monto_primera_compra" name="monto_primera_compra" type="number" min="0" step="0.01" className={inputBase} />
          </div>

          <div>
            <label htmlFor="motivo_no_compra" className="mb-1 block text-sm font-medium text-gray-700">Motivo de no compra</label>
            <select id="motivo_no_compra" name="motivo_no_compra" className={inputBase}>
              <option value="">Sin especificar</option>
              {MOTIVOS_NO_COMPRA.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fecha_ultima_gestion" className="mb-1 block text-sm font-medium text-gray-700">Fecha de última gestión</label>
            <input id="fecha_ultima_gestion" name="fecha_ultima_gestion" type="datetime-local" className={inputBase} />
          </div>

          <div>
            <label htmlFor="estado_prospecto" className="mb-1 block text-sm font-medium text-gray-700">Estado del prospecto</label>
            <select id="estado_prospecto" name="estado_prospecto" defaultValue="nuevo" className={inputBase}>
              {ESTADOS_PROSPECTO.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <select name="por_donde_llego" className={inputBase} required>
        <option value="">¿Por dónde llegó?</option>
        <option value="instagram">Instagram</option>
        <option value="facebook">Facebook</option>
        <option value="googleAds">Google Ads</option>
        <option value="whatsapp">WhatsApp</option>
        <option value="email">Email</option>
      </select>

      <label className="block text-sm font-medium text-gray-700 mt-3">Fecha de contacto</label>
      <input type="date" name="fecha_contacto" className={inputBase} />

      <input type="text" name="cuit" placeholder="CUIT" className={inputBase} />
      <textarea name="anotaciones" placeholder="Anotaciones" className={`${inputBase} resize-none`} rows={3} />

      <label className="block text-sm font-medium text-gray-700 mt-3">Fecha pedido de asesoramiento</label>
      <input type="date" name="fecha_pedido_asesoramiento" className={inputBase} />

      <input type="url" name="url" placeholder="URL seguimiento" className={inputBase} />


      {/* Selector de provincia */}
      <select
        name="provincia_id"
        className={inputBase}
        onChange={handleProvinciaChange}
        value={provinciaId}
      >
        <option value="">Selecciona una provincia</option>
        {provincias.map((prov: any) => (
          <option key={prov.id} value={prov.id}>
            {prov.nombre}
          </option>
        ))}
      </select>

      {/* Selector de localidad */}
      <select name="localidad_id" className={inputBase}>
        <option value="">Selecciona una localidad</option>
        {localidadesFiltradas.map((loc: any) => (
          <option key={loc.id} value={loc.id}>
            {`${loc.nombre} - ${loc.codigopostal}`}
          </option>
        ))}
      </select>

      {/* Botón de submit */}
      <button
        type="submit"
        className="mt-4 rounded bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
        disabled={isSubmitting}
      >
        Guardar
      </button>

      {/* Error */}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
}
