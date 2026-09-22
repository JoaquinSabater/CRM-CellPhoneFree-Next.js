'use client';

import { useState, useEffect } from 'react';
import { redirect, useRouter } from 'next/navigation';
import { updateProspecto, altaCliente, verificarClienteExistente } from '@/app/lib/actions';
import { Button } from '@/app/ui/button';
import Link from 'next/link';
import { ESTADOS_PROSPECTO, MOTIVOS_NO_COMPRA, TIPOS_COMERCIO } from '@/app/lib/prospect-options';
import { Card, CardHeader, CardTitle } from '@/app/ui/components/Card';
import { Input } from '@/app/ui/components/Input';
import { Select } from '@/app/ui/components/Select';
import { Textarea } from '@/app/ui/components/Textarea';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function toDateInputValue(value: string | Date | null | undefined, includeTime = false) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (part: number) => String(part).padStart(2, '0');
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return includeTime ? `${datePart}T${pad(date.getHours())}:${pad(date.getMinutes())}` : datePart;
}

export default function EditProspectoForm({
  prospecto,
  provincias,
  localidades,
  vendedores,
  condicionesIva = [],
  condicionesIibb = []
}: any) {
  const router = useRouter();
  const updateWithId = updateProspecto.bind(null, prospecto.id);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [clienteExistente, setClienteExistente] = useState<any>(null);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);

  const [provinciaId, setProvinciaId] = useState<string>(prospecto.provincia_id?.toString() || '');
  const [localidadesFiltradas, setLocalidadesFiltradas] = useState<any[]>([]);
  const [localidadId, setLocalidadId] = useState<string>(prospecto.localidad_id?.toString() || '');

  const [tokenData, setTokenData] = useState<any>(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [stockTokenData, setStockTokenData] = useState<any>(null);
  const [generatingStockToken, setGeneratingStockToken] = useState(false);
  const [stockTokenError, setStockTokenError] = useState('');
  const [origen, setOrigen] = useState<string>(prospecto.origen || '');
  const [condicionIvaId, setCondicionIvaId] = useState<string>(prospecto.condicion_iva_id?.toString() || '');
  const [condicionIibbId, setCondicionIibbId] = useState<string>(prospecto.condicion_iibb_id?.toString() || '');

  const generateProspectoToken = async () => {
    setGeneratingToken(true);
    setTokenError('');

    try {
      const response = await fetch('/api/prospectos/generate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prospectoId: prospecto.id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTokenData(data);
      } else {
        setTokenError(data.message || 'Error al generar token');
      }
    } catch (error) {
      console.error('Error:', error);
      setTokenError('Error al procesar la solicitud');
    } finally {
      setGeneratingToken(false);
    }
  };

  const generateStockAmbulanteToken = async () => {
    setGeneratingStockToken(true);
    setStockTokenError('');

    try {
      const response = await fetch('/api/prospectos/generate-stock-ambulante-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prospectoId: prospecto.id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStockTokenData(data);
      } else {
        setStockTokenError(data.message || 'Error al generar token');
      }
    } catch (error) {
      console.error('Error:', error);
      setStockTokenError('Error al procesar la solicitud');
    } finally {
      setGeneratingStockToken(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Link copiado al portapapeles');
    } catch (err) {
      console.error('Error al copiar:', err);
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copiado al portapapeles');
    }
  };

  const redireccion = () => {
    setSuccessMessage('✅ Dado de alta correctamente. Tocá Cancelar o Customers para volver atrás.');
  }

  // Verificar cliente existente antes de dar de alta
  const verificarCliente = async () => {
    const vendedorSelect = document.getElementById('vendedor_id') as HTMLSelectElement;
    const cuitInput = document.getElementById('cuit') as HTMLInputElement;
    const origenSelect = document.getElementById('origen') as HTMLSelectElement;

    // ✅ VALIDAR QUE VENDEDOR ESTÉ SELECCIONADO
    if (!vendedorSelect.value) {
      alert('Debe seleccionar un vendedor');
      return;
    }

    // 🆕 VALIDAR QUE CUIT NO ESTÉ VACÍO
    if (!cuitInput.value || cuitInput.value.trim() === '') {
      alert('⚠️ El campo CUIT es obligatorio para dar de alta el cliente');
      cuitInput.focus();
      return;
    }

    // 🆕 VALIDAR QUE ORIGEN ESTÉ SELECCIONADO
    if (!origenSelect.value || origenSelect.value.trim() === '') {
      alert('⚠️ El campo Origen es obligatorio para dar de alta el cliente');
      origenSelect.focus();
      return;
    }

    const resultado = await verificarClienteExistente(prospecto.id);
    if (resultado.existe) {
      setClienteExistente(resultado.cliente);
      setMostrarAlerta(true);
    } else {
      // Si no existe, proceder con alta de cliente nuevo
      const formData = new FormData();
      formData.append('vendedor_id', vendedorSelect.value);
      formData.append('mantener_existente', 'false');

      try {
        await altaCliente(prospecto.id, formData);
        redireccion();
      } catch (error) {
        console.error('Error al crear cliente nuevo:', error);
      }
    }
  };

  // Mantener cliente existente
  const mantenerClienteExistente = async () => {
    const formData = new FormData();
    formData.append('vendedor_id', clienteExistente.vendedor_id);
    formData.append('mantener_existente', 'true');

    try {
      await altaCliente(prospecto.id, formData);
      redireccion();
      setMostrarAlerta(false);
    } catch (error) {
      console.error('Error al mantener cliente existente:', error);
    }
  };

  // Continuar con alta normal (actualizar cliente existente con nuevo vendedor)
  const continuarAltaNormal = async () => {
    const vendedorSelect = document.getElementById('vendedor_id') as HTMLSelectElement;
    if (!vendedorSelect.value) {
      alert('Debe seleccionar un vendedor');
      return;
    }

    const formData = new FormData();
    formData.append('vendedor_id', vendedorSelect.value);
    formData.append('mantener_existente', 'false');

    try {
      await altaCliente(prospecto.id, formData);
      redireccion();
      setMostrarAlerta(false);
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
    }
  };

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
      {/* Alerta de cliente existente */}
      {mostrarAlerta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50">
          <Card className="mx-4 w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-semibold text-rose-600">
              ⚠️ Cliente ya existe
            </h3>
            <p className="mb-4 text-slate-700">
              Ya existe un cliente con el CUIT <strong>{prospecto.cuit}</strong>
            </p>
            <p className="mb-4 text-slate-700">
              <strong>Cliente:</strong> {clienteExistente?.razon_social}<br/>
              <strong>Vendedor asignado:</strong> {clienteExistente?.vendedor_nombre}
            </p>
            <div className="flex gap-3">
              <Button type="button" onClick={mantenerClienteExistente}>
                Mantener
              </Button>
              <Button type="button" variant="secondary" onClick={continuarAltaNormal}>
                Alta nuevo
              </Button>
              <Button type="button" variant="ghost" onClick={() => setMostrarAlerta(false)}>
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Form principal para editar el prospecto */}
      <form action={updateWithId}>
        <Card className="space-y-6 p-6">

          {/* Sección: Información de Contacto */}
          <div className="border-b border-slate-200 pb-4">
            <CardHeader>
              <CardTitle>📋 Información de Contacto</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                id="fecha_contacto"
                name="fecha_contacto"
                type="date"
                label="Fecha de Contacto"
                defaultValue={prospecto.fecha_contacto ? new Date(prospecto.fecha_contacto).toISOString().slice(0, 10) : ''}
              />

              <Select
                id="por_donde_llego"
                name="por_donde_llego"
                label="¿Por dónde llegó?"
                defaultValue={prospecto.por_donde_llego || ''}
              >
                <option value="">Selecciona una opción</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="googleAds">Google Ads</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </Select>
            </div>
          </div>

          {/* Sección: Datos Personales */}
          <div className="border-b border-slate-200 pb-4">
            <CardHeader>
              <CardTitle>👤 Datos Personales</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                id="razon_social"
                name="razon_social"
                type="text"
                defaultValue={prospecto.razon_social}
                label="Razón Social"
                placeholder="Nombre de la empresa"
              />

              <Input
                id="nombre"
                name="nombre"
                type="text"
                defaultValue={prospecto.nombre}
                label="Nombre"
                placeholder="Nombre del contacto"
              />

              <Input
                id="apellido"
                name="apellido"
                type="text"
                defaultValue={prospecto.apellido}
                label="Apellido"
                placeholder="Apellido del contacto"
              />

              <Input
                id="contacto"
                name="contacto"
                type="text"
                defaultValue={prospecto.contacto}
                label="Nombre de Contacto"
                placeholder="Persona de contacto"
              />

              <Input
                id="cuit"
                name="cuit"
                type="text"
                defaultValue={prospecto.cuit}
                label="CUIT *"
                placeholder="20-12345678-9"
              />
            </div>
          </div>

          {/* Sección: Datos de Contacto */}
          <div className="border-b border-slate-200 pb-4">
            <CardHeader>
              <CardTitle>📞 Medios de Contacto</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={prospecto.email}
                label="Email"
                placeholder="email@ejemplo.com"
              />

              <Input
                id="telefono"
                name="telefono"
                type="text"
                defaultValue={prospecto.telefono}
                label="Teléfono"
                placeholder="+54 9 11 1234-5678"
              />

              <Input
                id="facebook"
                name="facebook"
                type="text"
                defaultValue={prospecto.facebook}
                label="Facebook"
                placeholder="facebook.com/perfil"
              />

              <Input
                id="instagram"
                name="instagram"
                type="text"
                defaultValue={prospecto.instagram}
                label="Instagram"
                placeholder="@usuario"
              />

              <Input
                id="url"
                name="url"
                type="text"
                defaultValue={prospecto.url}
                label="Sitio Web"
                placeholder="https://www.ejemplo.com"
              />
            </div>
          </div>

          {/* Sección: Ubicación y Negocio */}
          <div className="border-b border-slate-200 pb-4">
            <CardHeader>
              <CardTitle>🏢 Ubicación y Negocio</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                id="domicilio"
                name="domicilio"
                type="text"
                defaultValue={prospecto.domicilio}
                label="Domicilio"
                placeholder="Dirección completa"
              />

              <Select
                name="provincia_id"
                id="provincia_id"
                label="Provincia"
                value={provinciaId}
                onChange={handleProvinciaChange}
              >
                <option value="">Selecciona una provincia</option>
                {provincias.map((prov: any) => (
                  <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                ))}
              </Select>

              <Select
                name="localidad_id"
                id="localidad_id"
                label="Localidad"
                value={localidadId}
                onChange={(e) => setLocalidadId(e.target.value)}
              >
                <option value="">Selecciona una localidad</option>
                {localidadesFiltradas.map((loc: any) => (
                  <option key={loc.id} value={loc.id}>
                    {`${loc.nombre} - ${loc.codigopostal}`}
                  </option>
                ))}
              </Select>

              <Select
                id="negocio"
                name="negocio"
                label="Tipo de Negocio"
                defaultValue={prospecto.negocio || ''}
              >
                <option value="">Selecciona una opción</option>
                <option value="online">Online</option>
                <option value="fisico">Físico</option>
                <option value="fisicos y online">Fisicos y online</option>
                <option value="fisico mas de uno">Físico (mas de uno)</option>
                <option value="emprendedor">Emprendedor</option>
              </Select>
            </div>
          </div>

          {/* Sección: Datos Impositivos */}
          <div className="border-b border-slate-200 pb-4">
            <CardHeader>
              <CardTitle>💼 Datos Impositivos</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                id="condicion_iva_id"
                name="condicion_iva_id"
                label="Condición IVA"
                value={condicionIvaId}
                onChange={(e) => setCondicionIvaId(e.target.value)}
              >
                <option value="">Seleccione condición IVA</option>
                {condicionesIva.map((condicion: any) => (
                  <option key={condicion.id} value={condicion.id}>
                    {condicion.codigo} - {condicion.descripcion}
                  </option>
                ))}
              </Select>

              <Select
                id="condicion_iibb_id"
                name="condicion_iibb_id"
                label="Condición IIBB"
                value={condicionIibbId}
                onChange={(e) => setCondicionIibbId(e.target.value)}
              >
                <option value="">Seleccione condición IIBB</option>
                {condicionesIibb.map((condicion: any) => (
                  <option key={condicion.id} value={condicion.id}>
                    {condicion.codigo} - {condicion.descripcion}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Sección: Origen del Cliente */}
          <div className="border-b border-slate-200 pb-4">
            <CardHeader>
              <CardTitle>🎯 Origen del Cliente</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                id="origen"
                name="origen"
                label="Origen"
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
              >
                <option value="">Seleccionar origen...</option>
                <option value="campaña">Campaña</option>
                <option value="presencial">Presencial</option>
                <option value="referido">Referido</option>
              </Select>

              {origen === 'referido' && (
                <>
                  <Input
                    id="referidor_nombre"
                    name="referidor_nombre"
                    type="text"
                    defaultValue={prospecto.referidor_nombre}
                    label="Nombre del Referidor"
                    placeholder="¿Quién lo refirió?"
                  />

                  <div>
                    <label htmlFor="tipo_venta_referido" className="mb-1 block text-sm font-medium text-slate-700">
                      Tipo de Venta
                    </label>
                    <div className="mt-2 flex items-center gap-6">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="tipo_presencial"
                          name="tipo_venta_referido"
                          value="presencial"
                          defaultChecked={prospecto.tipo_venta_referido === 'presencial'}
                          className="mr-2"
                        />
                        <label htmlFor="tipo_presencial" className="text-sm">Presencial</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="tipo_remota"
                          name="tipo_venta_referido"
                          value="remota"
                          defaultChecked={prospecto.tipo_venta_referido === 'remota'}
                          className="mr-2"
                        />
                        <label htmlFor="tipo_remota" className="text-sm">Remota</label>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sección: Seguimiento */}
          <div className="border-b border-slate-200 pb-4">
            <CardHeader>
              <CardTitle>Datos comerciales y estado</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select id="tipo_comercio" name="tipo_comercio" label="Tipo de comercio" defaultValue={prospecto.tipo_comercio || ''}>
                <option value="">Sin especificar</option>
                {TIPOS_COMERCIO.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>

              <Input id="cantidad_puntos_venta" name="cantidad_puntos_venta" type="number" min="0" step="1" label="Cantidad de puntos de venta" defaultValue={prospecto.cantidad_puntos_venta ?? ''} />

              <Input id="codigo_anuncio" name="codigo_anuncio" type="text" maxLength={100} label="Código de anuncio" defaultValue={prospecto.codigo_anuncio || ''} />

              <Select id="vendedor_asignado_id" name="vendedor_asignado_id" label="Vendedor asignado" defaultValue={prospecto.vendedor_asignado_id ?? ''}>
                <option value="">Sin asignar</option>
                {vendedores.map((vendedor: any) => (
                  <option key={vendedor.id} value={vendedor.id}>{vendedor.nombre}</option>
                ))}
              </Select>

              <Input id="fecha_compra" name="fecha_compra" type="date" label="Fecha de compra" defaultValue={toDateInputValue(prospecto.fecha_compra)} />

              <Input id="monto_primera_compra" name="monto_primera_compra" type="number" min="0" step="0.01" label="Monto de primera compra" defaultValue={prospecto.monto_primera_compra ?? ''} />

              <Select id="motivo_no_compra" name="motivo_no_compra" label="Motivo de no compra" defaultValue={prospecto.motivo_no_compra || ''}>
                <option value="">Sin especificar</option>
                {MOTIVOS_NO_COMPRA.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>

              <Input id="fecha_ultima_gestion" name="fecha_ultima_gestion" type="datetime-local" label="Fecha de última gestión" defaultValue={toDateInputValue(prospecto.fecha_ultima_gestion, true)} />

              <Select id="estado_prospecto" name="estado_prospecto" label="Estado del prospecto" defaultValue={prospecto.estado_prospecto || 'nuevo'}>
                {ESTADOS_PROSPECTO.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Sección: Seguimiento */}
          <div className="border-b border-slate-200 pb-4">
            <CardHeader>
              <CardTitle>📅 Seguimiento</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col justify-center">
                <label className="mb-2 block text-sm font-medium text-slate-700">Seguimientos</label>
                <div className="flex gap-6">
                  {[2, 3, 4].map((n) => (
                    <div key={n} className="flex items-center gap-2">
                      <input
                        type="radio"
                        id={`seguimiento_${n}`}
                        name="seguimiento"
                        value={n}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`seguimiento_${n}`} className="text-sm text-slate-700">
                        {n}º contacto
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Input
                id="fecha_pedido_asesoramiento"
                name="fecha_pedido_asesoramiento"
                type="date"
                label="Fecha Pedido Asesoramiento"
                defaultValue={
                  prospecto.fecha_pedido_asesoramiento
                    ? new Date(prospecto.fecha_pedido_asesoramiento).toISOString().slice(0, 10)
                    : ''
                }
              />
            </div>
          </div>

          {/* Sección: Anotaciones */}
          <div>
            <CardHeader>
              <CardTitle>📝 Anotaciones</CardTitle>
            </CardHeader>
            <Textarea
              id="anotaciones"
              name="anotaciones"
              defaultValue={prospecto.anotaciones}
              rows={4}
              label="Observaciones y Notas"
              placeholder="Información adicional sobre el prospecto..."
            />
          </div>
        </Card>

        <div className="mt-6 flex justify-end gap-4">
          <Link
            href="/dashboard/invoices"
            className="flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <Button type="submit">Guardar</Button>
        </div>
      </form>

      {/* Sección para dar de alta como cliente */}
      <Card className="mt-10 space-y-4 p-6">
        <label htmlFor="vendedor_id" className="block text-sm font-medium text-slate-700">
          Asignar a Vendedor
        </label>

        <Select name="vendedor_id" id="vendedor_id" required>
          <option value="">Selecciona un vendedor</option>
          {vendedores.map((v: any) => (
            <option key={v.id} value={v.id}>{v.nombre}</option>
          ))}
        </Select>

        <div className="mt-4 flex items-center justify-start gap-6">
          <Button type="button" onClick={verificarCliente}>
            Alta
          </Button>

          {successMessage && (
            <div className="rounded border border-emerald-300 bg-emerald-50 p-3 text-emerald-800 shadow-sm">
              {successMessage}
            </div>
          )}
        </div>
      </Card>

      <Card className="mt-6 space-y-4 border-sky-200 bg-sky-50 p-6">
        <h3 className="text-lg font-semibold text-sky-900">
          🛒 Generar Link de Pedido
        </h3>
        <p className="text-sm text-sky-800">
          Genera un link único para que el prospecto pueda hacer su primer pedido sin registrarse. (Válido por 48 horas)
        </p>

        {!tokenData ? (
          <div className="space-y-3">
            <Button
              type="button"
              onClick={generateProspectoToken}
              disabled={generatingToken}
            >
              {generatingToken ? 'Generando...' : '🔗 Generar Link de Pedido'}
            </Button>

            {tokenError && (
              <div className="rounded border border-rose-300 bg-rose-100 p-3 text-sm text-rose-800">
                {tokenError}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="border-sky-200 p-4">
              <h4 className="mb-2 font-medium text-sky-900">✅ Link generado exitosamente</h4>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Link del pedido:
                  </label>
                  <div className="flex items-center gap-2">
                    <Input type="text" value={tokenData.link} readOnly className="flex-1 bg-slate-50" />
                    <Button type="button" variant="secondary" onClick={() => copyToClipboard(tokenData.link)}>
                      📋 Copiar
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <div>
                    <span className="font-medium text-slate-700">Token:</span>
                    <span className="ml-2 break-all font-mono text-xs">
                      {tokenData.token.substring(0, 20)}...
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Expira:</span>
                    <span className="ml-2">
                      {new Date(tokenData.expiresAt).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" onClick={() => window.open(tokenData.link, '_blank')}>
                    👁️ Previsualizar
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setTokenData(null)}>
                    🔄 Generar Nuevo
                  </Button>
                </div>
              </div>
            </Card>

            <div className="rounded border-l-4 border-sky-400 bg-sky-50 p-3 text-xs text-sky-700">
              <strong>💡 Instrucciones:</strong>
              <ul className="mt-1 list-inside list-disc space-y-1">
                <li>Envía este link al prospecto por WhatsApp, email o mensaje</li>
                <li>El prospecto podrá hacer su pedido sin necesidad de registrarse</li>
                <li>El link expira en <strong>4 días</strong> automáticamente</li>
                <li>Puede usar el mismo link múltiples veces durante esos 4 días</li>
                <li>Una vez que haga un pedido real, será convertido en cliente</li>
              </ul>
            </div>
          </div>
        )}
      </Card>

      <Card className="mt-6 space-y-4 border-brand-200 bg-brand-50 p-6">
        <h3 className="text-lg font-semibold text-brand-900">
          📦 Generar Link de Stock Ambulante
        </h3>
        <p className="text-sm text-brand-800">
          Genera un link único para que el prospecto pueda visualizar el stock ambulante disponible. (Válido por 30 días)
        </p>

        {!stockTokenData ? (
          <div className="space-y-3">
            <Button
              type="button"
              onClick={generateStockAmbulanteToken}
              disabled={generatingStockToken}
            >
              {generatingStockToken ? 'Generando...' : '🔑 Generar Link de Stock Ambulante'}
            </Button>

            {stockTokenError && (
              <div className="rounded border border-rose-300 bg-rose-100 p-3 text-sm text-rose-800">
                {stockTokenError}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="border-brand-200 p-4">
              <h4 className="mb-2 font-medium text-brand-900">✅ Link generado exitosamente</h4>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Link de stock ambulante:
                  </label>
                  <div className="flex items-center gap-2">
                    <Input type="text" value={stockTokenData.link} readOnly className="flex-1 bg-slate-50" />
                    <Button type="button" variant="secondary" onClick={() => copyToClipboard(stockTokenData.link)}>
                      📋 Copiar
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <div>
                    <span className="font-medium text-slate-700">Token:</span>
                    <span className="ml-2 break-all font-mono text-xs">
                      {stockTokenData.token.substring(0, 20)}...
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Expira:</span>
                    <span className="ml-2">
                      {new Date(stockTokenData.expiresAt).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" onClick={() => window.open(stockTokenData.link, '_blank')}>
                    👁️ Previsualizar
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setStockTokenData(null)}>
                    🔄 Generar Nuevo
                  </Button>
                </div>
              </div>
            </Card>

            <div className="rounded border-l-4 border-brand-400 bg-brand-50 p-3 text-xs text-brand-700">
              <strong>💡 Instrucciones:</strong>
              <ul className="mt-1 list-inside list-disc space-y-1">
                <li>Envía este link al prospecto por WhatsApp, email o mensaje</li>
                <li>El link incluye el token y el identificador del prospecto</li>
                <li>El carrito podrá usar esa información para identificar el contexto del prospecto</li>
                <li>Una vez que se defina la ruta final, este link quedará preparado para conectarse con ella</li>
              </ul>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
