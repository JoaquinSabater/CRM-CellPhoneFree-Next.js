'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProspecto } from '@/app/lib/actions';

export default function CreateProspectoForm({
  provincias,
  localidades,
}: {
  provincias: any[];
  localidades: any[];
}) {
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
    const formData = new FormData(e.currentTarget);

    try {
      await createProspecto(formData);
      router.push('/dashboard/invoices');
    } catch (err) {
      console.error('❌ Error al crear prospecto:', err);
      setError('Ocurrió un error al crear el prospecto.');
    }
  };

  const inputBase =
    'peer block w-full rounded-md border py-2 pl-3 text-sm outline-2 placeholder:text-gray-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Campos de texto */}
      <input type="text" name="nombre" placeholder="Nombre" required className={inputBase} />
      <input type="email" name="email" placeholder="Email" required className={inputBase} />
      <input type="text" name="telefono" placeholder="Teléfono" required className={inputBase} />
      <input type="text" name="negocio" placeholder="Negocio" required className={inputBase} />
      <select name="por_donde_llego" className={inputBase} required>
        <option value="">¿Por dónde llegó?</option>
        <option value="instagram">Instagram</option>
        <option value="facebook">Facebook</option>
        <option value="googleAds">Google Ads</option>
      </select>
      <input type="date" name="fecha_contacto" required className={inputBase} />
      <input type="text" name="cuit" placeholder="CUIT" className={inputBase} />
      <textarea name="anotaciones" placeholder="Anotaciones" className={`${inputBase} resize-none`} rows={3} />
      <input type="date" name="fecha_pedido_asesoramiento" className={inputBase} />
      <input type="url" name="url" placeholder="URL seguimiento" className={inputBase} />

      {/* Selector de provincia */}
      <select
        name="provincia_id"
        className={inputBase}
        required
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
      <select name="localidad_id" className={inputBase} required>
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
      >
        Guardar
      </button>

      {/* Error */}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
}
