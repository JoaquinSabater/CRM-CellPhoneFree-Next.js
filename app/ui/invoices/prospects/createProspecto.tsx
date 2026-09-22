'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProspecto } from '@/app/lib/actions';
import { ESTADOS_PROSPECTO, MOTIVOS_NO_COMPRA, TIPOS_COMERCIO } from '@/app/lib/prospect-options';
import { Card, CardHeader, CardTitle } from '@/app/ui/components/Card';
import { Input } from '@/app/ui/components/Input';
import { Select } from '@/app/ui/components/Select';
import { Textarea } from '@/app/ui/components/Textarea';
import { Button } from '@/app/ui/button';

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Campos de texto */}
      <Input type="text" name="nombre" placeholder="Nombre" />
      <Input type="email" name="email" placeholder="Email" />
      <Input type="text" name="telefono" placeholder="Teléfono" />

      <Select name="negocio">
        <option value="">Selecciona una opción</option>
        <option value="online">Online</option>
        <option value="fisico">Físico</option>
        <option value="fisicos y online">Fisicos y online</option>
        <option value="fisico mas de uno">Físico (mas de uno)</option>
        <option value="emprendedor">Emprendedor</option>
      </Select>

      <Card className="p-4">
        <CardHeader>
          <CardTitle>Datos comerciales y seguimiento</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select id="tipo_comercio" name="tipo_comercio" label="Tipo de comercio">
            <option value="">Sin especificar</option>
            {TIPOS_COMERCIO.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>

          <Input id="cantidad_puntos_venta" name="cantidad_puntos_venta" type="number" min="0" step="1" label="Cantidad de puntos de venta" />

          <Input id="codigo_anuncio" name="codigo_anuncio" type="text" maxLength={100} label="Código de anuncio" />

          <Select id="vendedor_asignado_id" name="vendedor_asignado_id" label="Vendedor asignado">
            <option value="">Sin asignar</option>
            {vendedores.map((vendedor: any) => (
              <option key={vendedor.id} value={vendedor.id}>{vendedor.nombre}</option>
            ))}
          </Select>

          <Input id="fecha_compra" name="fecha_compra" type="date" label="Fecha de compra" />

          <Input id="monto_primera_compra" name="monto_primera_compra" type="number" min="0" step="0.01" label="Monto de primera compra" />

          <Select id="motivo_no_compra" name="motivo_no_compra" label="Motivo de no compra">
            <option value="">Sin especificar</option>
            {MOTIVOS_NO_COMPRA.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>

          <Input id="fecha_ultima_gestion" name="fecha_ultima_gestion" type="datetime-local" label="Fecha de última gestión" />

          <Select id="estado_prospecto" name="estado_prospecto" defaultValue="nuevo" label="Estado del prospecto">
            {ESTADOS_PROSPECTO.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </div>
      </Card>

      <Select name="por_donde_llego" required>
        <option value="">¿Por dónde llegó?</option>
        <option value="instagram">Instagram</option>
        <option value="facebook">Facebook</option>
        <option value="googleAds">Google Ads</option>
        <option value="whatsapp">WhatsApp</option>
        <option value="email">Email</option>
      </Select>

      <Input type="date" name="fecha_contacto" label="Fecha de contacto" />

      <Input type="text" name="cuit" placeholder="CUIT" />
      <Textarea name="anotaciones" placeholder="Anotaciones" rows={3} />

      <Input type="date" name="fecha_pedido_asesoramiento" label="Fecha pedido de asesoramiento" />

      <Input type="url" name="url" placeholder="URL seguimiento" />


      {/* Selector de provincia */}
      <Select
        name="provincia_id"
        onChange={handleProvinciaChange}
        value={provinciaId}
      >
        <option value="">Selecciona una provincia</option>
        {provincias.map((prov: any) => (
          <option key={prov.id} value={prov.id}>
            {prov.nombre}
          </option>
        ))}
      </Select>

      {/* Selector de localidad */}
      <Select name="localidad_id">
        <option value="">Selecciona una localidad</option>
        {localidadesFiltradas.map((loc: any) => (
          <option key={loc.id} value={loc.id}>
            {`${loc.nombre} - ${loc.codigopostal}`}
          </option>
        ))}
      </Select>

      {/* Botón de submit */}
      <Button type="submit" disabled={isSubmitting}>
        Guardar
      </Button>

      {/* Error */}
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </form>
  );
}
