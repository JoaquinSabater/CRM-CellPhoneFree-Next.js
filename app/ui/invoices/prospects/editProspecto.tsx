'use client';

import { useState, useEffect } from 'react';
import { redirect, useRouter } from 'next/navigation';
import { updateProspecto, altaCliente, verificarClienteExistente } from '@/app/lib/actions';
import { Button } from '@/app/ui/button';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  const inputBase = 'peer block w-full rounded-md border py-2 pl-3 text-sm outline-2 placeholder:text-gray-500';

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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">
              ⚠️ Cliente ya existe
            </h3>
            <p className="text-gray-700 mb-4">
              Ya existe un cliente con el CUIT <strong>{prospecto.cuit}</strong>
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Cliente:</strong> {clienteExistente?.razon_social}<br/>
              <strong>Vendedor asignado:</strong> {clienteExistente?.vendedor_nombre}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={mantenerClienteExistente}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Mantener
              </button>
              <button
                type="button"
                onClick={continuarAltaNormal}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Alta nuevo
              </button>
              <button
                type="button"
                onClick={() => setMostrarAlerta(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form principal para editar el prospecto */}
      <form action={updateWithId}>
        <div className="rounded-md bg-white shadow-sm border border-gray-200 p-6 space-y-6">
          
          {/* Sección: Información de Contacto */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Información de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fecha_contacto" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Contacto
                </label>
                <input
                  id="fecha_contacto"
                  name="fecha_contacto"
                  type="date"
                  defaultValue={prospecto.fecha_contacto ? new Date(prospecto.fecha_contacto).toISOString().slice(0, 10) : ''}
                  className={inputBase}
                />
              </div>

              <div>
                <label htmlFor="por_donde_llego" className="block text-sm font-medium text-gray-700 mb-1">
                  ¿Por dónde llegó?
                </label>
                <select
                  id="por_donde_llego"
                  name="por_donde_llego"
                  defaultValue={prospecto.por_donde_llego || ''}
                  className={inputBase}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="googleAds">Google Ads</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección: Datos Personales */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">👤 Datos Personales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="razon_social" className="block text-sm font-medium text-gray-700 mb-1">
                  Razón Social
                </label>
                <input 
                  id="razon_social" 
                  name="razon_social" 
                  type="text" 
                  defaultValue={prospecto.razon_social} 
                  className={inputBase}
                  placeholder="Nombre de la empresa"
                />
              </div>

              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input 
                  id="nombre" 
                  name="nombre" 
                  type="text" 
                  defaultValue={prospecto.nombre} 
                  className={inputBase}
                  placeholder="Nombre del contacto"
                />
              </div>

              <div>
                <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input 
                  id="apellido" 
                  name="apellido" 
                  type="text" 
                  defaultValue={prospecto.apellido} 
                  className={inputBase}
                  placeholder="Apellido del contacto"
                />
              </div>

              <div>
                <label htmlFor="contacto" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Contacto
                </label>
                <input 
                  id="contacto" 
                  name="contacto" 
                  type="text" 
                  defaultValue={prospecto.contacto} 
                  className={inputBase}
                  placeholder="Persona de contacto"
                />
              </div>

              <div>
                <label htmlFor="cuit" className="block text-sm font-medium text-gray-700 mb-1">
                  CUIT <span className="text-red-500">*</span>
                </label>
                <input 
                  id="cuit" 
                  name="cuit" 
                  type="text" 
                  defaultValue={prospecto.cuit} 
                  className={inputBase}
                  placeholder="20-12345678-9"
                />
              </div>
            </div>
          </div>

          {/* Sección: Datos de Contacto */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📞 Medios de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  defaultValue={prospecto.email} 
                  className={inputBase}
                  placeholder="email@ejemplo.com"
                />
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input 
                  id="telefono" 
                  name="telefono" 
                  type="text" 
                  defaultValue={prospecto.telefono} 
                  className={inputBase}
                  placeholder="+54 9 11 1234-5678"
                />
              </div>

              <div>
                <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-1">
                  Facebook
                </label>
                <input 
                  id="facebook" 
                  name="facebook" 
                  type="text" 
                  defaultValue={prospecto.facebook} 
                  className={inputBase}
                  placeholder="facebook.com/perfil"
                />
              </div>

              <div>
                <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-1">
                  Instagram
                </label>
                <input 
                  id="instagram" 
                  name="instagram" 
                  type="text" 
                  defaultValue={prospecto.instagram} 
                  className={inputBase}
                  placeholder="@usuario"
                />
              </div>

              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                  Sitio Web
                </label>
                <input 
                  id="url" 
                  name="url" 
                  type="text" 
                  defaultValue={prospecto.url} 
                  className={inputBase}
                  placeholder="https://www.ejemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Sección: Ubicación y Negocio */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 Ubicación y Negocio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="domicilio" className="block text-sm font-medium text-gray-700 mb-1">
                  Domicilio
                </label>
                <input 
                  id="domicilio" 
                  name="domicilio" 
                  type="text" 
                  defaultValue={prospecto.domicilio} 
                  className={inputBase}
                  placeholder="Dirección completa"
                />
              </div>

              <div>
                <label htmlFor="provincia_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Provincia
                </label>
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

              <div>
                <label htmlFor="localidad_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Localidad
                </label>
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
                <label htmlFor="negocio" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Negocio
                </label>
                <select
                  id="negocio"
                  name="negocio"
                  defaultValue={prospecto.negocio || ''}
                  className={inputBase}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="online">Online</option>
                  <option value="fisico">Físico</option>
                  <option value="fisicos y online">Fisicos y online</option>
                  <option value="fisico mas de uno">Físico (mas de uno)</option>
                  <option value="emprendedor">Emprendedor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección: Datos Impositivos */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💼 Datos Impositivos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="condicion_iva_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Condición IVA
                </label>
                <select
                  id="condicion_iva_id"
                  name="condicion_iva_id"
                  value={condicionIvaId}
                  onChange={(e) => setCondicionIvaId(e.target.value)}
                  className={inputBase}
                >
                  <option value="">Seleccione condición IVA</option>
                  {condicionesIva.map((condicion: any) => (
                    <option key={condicion.id} value={condicion.id}>
                      {condicion.codigo} - {condicion.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="condicion_iibb_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Condición IIBB
                </label>
                <select
                  id="condicion_iibb_id"
                  name="condicion_iibb_id"
                  value={condicionIibbId}
                  onChange={(e) => setCondicionIibbId(e.target.value)}
                  className={inputBase}
                >
                  <option value="">Seleccione condición IIBB</option>
                  {condicionesIibb.map((condicion: any) => (
                    <option key={condicion.id} value={condicion.id}>
                      {condicion.codigo} - {condicion.descripcion}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sección: Origen del Cliente */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Origen del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="origen" className="block text-sm font-medium text-gray-700 mb-1">
                  Origen
                </label>
                <select
                  id="origen"
                  name="origen"
                  value={origen}
                  onChange={(e) => setOrigen(e.target.value)}
                  className={inputBase}
                >
                  <option value="">Seleccionar origen...</option>
                  <option value="campaña">Campaña</option>
                  <option value="presencial">Presencial</option>
                  <option value="referido">Referido</option>
                </select>
              </div>

              {origen === 'referido' && (
                <>
                  <div>
                    <label htmlFor="referidor_nombre" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Referidor
                    </label>
                    <input 
                      id="referidor_nombre" 
                      name="referidor_nombre" 
                      type="text" 
                      defaultValue={prospecto.referidor_nombre} 
                      className={inputBase}
                      placeholder="¿Quién lo refirió?"
                    />
                  </div>

                  <div>
                    <label htmlFor="tipo_venta_referido" className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Venta
                    </label>
                    <div className="flex items-center gap-6 mt-2">
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
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Seguimiento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col justify-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">Seguimientos</label>
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
                      <label htmlFor={`seguimiento_${n}`} className="text-sm text-gray-700">
                        {n}º contacto
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="fecha_pedido_asesoramiento" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Pedido Asesoramiento
                </label>
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
            </div>
          </div>

          {/* Sección: Anotaciones */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Anotaciones</h3>
            <div>
              <label htmlFor="anotaciones" className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones y Notas
              </label>
              <textarea 
                id="anotaciones" 
                name="anotaciones" 
                defaultValue={prospecto.anotaciones} 
                rows={4} 
                className={`${inputBase} resize-none`}
                placeholder="Información adicional sobre el prospecto..."
              />
            </div>
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

      {/* Sección para dar de alta como cliente */}
      <div className="md:col-span-2 border-t pt-6 mt-10 space-y-4">
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
          <Button type="button" onClick={verificarCliente}>
            Alta
          </Button>

          {successMessage && (
            <div className="p-3 rounded bg-green-100 text-green-800 border border-green-300 shadow-sm">
              {successMessage}
            </div>
          )}
        </div>
      </div>

      <div className="md:col-span-2 border-t pt-6 mt-10 space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            🛒 Generar Link de Pedido
          </h3>
          <p className="text-blue-800 text-sm mb-4">
            Genera un link único para que el prospecto pueda hacer su primer pedido sin registrarse. (Válido por 48 horas)
          </p>

          {!tokenData ? (
            <div className="space-y-3">
              <button 
                type="button" 
                onClick={generateProspectoToken}
                disabled={generatingToken}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {generatingToken ? 'Generando...' : '🔗 Generar Link de Pedido'}
              </button>

              {tokenError && (
                <div className="p-3 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
                  {tokenError}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">✅ Link generado exitosamente</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link del pedido:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tokenData.link}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(tokenData.link)}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded"
                      >
                        📋 Copiar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Token:</span>
                      <span className="ml-2 font-mono text-xs break-all">
                        {tokenData.token.substring(0, 20)}...
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Expira:</span>
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
                    <button
                      type="button"
                      onClick={() => window.open(tokenData.link, '_blank')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                    >
                      👁️ Previsualizar
                    </button>
                    <button
                      type="button"
                      onClick={() => setTokenData(null)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"
                    >
                      🔄 Generar Nuevo
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-xs text-blue-700 bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                <strong>💡 Instrucciones:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Envía este link al prospecto por WhatsApp, email o mensaje</li>
                  <li>El prospecto podrá hacer su pedido sin necesidad de registrarse</li>
                  <li>El link expira en <strong>4 días</strong> automáticamente</li>
                  <li>Puede usar el mismo link múltiples veces durante esos 4 días</li>
                  <li>Una vez que haga un pedido real, será convertido en cliente</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}