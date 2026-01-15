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
import MapPicker from '@/app/ui/map-picker';

export default function EditClienteForm({ cliente, pedidos, filtrosDisponibles, filtrosCliente, topArticulos, marcas, provincias, localidades, condicionesIVA, condicionesIIBB, transportes }: any) {
  const formRef = useRef<HTMLFormElement>(null);
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const cancelHref = from === 'dashboard' ? '/dashboard' : '/dashboard/invoices';

  const [mostrarNuevaPassword, setMostrarNuevaPassword] = useState(false);
  const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);
  const [lat, setLat] = useState<number>(cliente.lat || -34.6037);
  const [lng, setLng] = useState<number>(cliente.lng || -58.3816);
  const [direccionCompleta, setDireccionCompleta] = useState('');
  const [selectedProvinciaId, setSelectedProvinciaId] = useState<number | null>(cliente.provincia_id || null);
  const [direcciones, setDirecciones] = useState<any[]>([]);
  
  const [tokenData, setTokenData] = useState<any>(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const filtrosActivos = new Map<number, string>();
  filtrosCliente.forEach((f: any) => {
    filtrosActivos.set(f.filtro_id, f.valor);
  });

  const localidadesFiltradas = selectedProvinciaId
    ? localidades?.filter((l: any) => l.provincia_id === selectedProvinciaId)
    : localidades || [];

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

  const generateStockAmbulanteToken = async () => {
    setGeneratingToken(true);
    setTokenError('');
    
    try {
      const response = await fetch('/api/clientes/generate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clienteId: cliente.id }),
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

  const construirDireccion = () => {
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
    const formData = new FormData(formRef.current!);
    formData.set('lat', lat.toString());
    formData.set('lng', lng.toString());
    await updateCliente(cliente.id, formData, filtrosDisponibles);
  }

  const inputBase = 'peer block w-full rounded-md border py-2 pl-3 text-sm outline-2 placeholder:text-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-200';
  const selectBase = 'peer block w-full rounded-md border py-2 pl-3 text-sm outline-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200';

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Datos Generales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="razon_social" className="block text-sm font-medium mb-1">Razón Social</label>
            <input id="razon_social" name="razon_social" type="text" defaultValue={cliente.razon_social} className={inputBase} />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input id="email" name="email" type="email" defaultValue={cliente.email} className={inputBase} />
          </div>
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium mb-1">Nombre</label>
            <input id="nombre" name="nombre" type="text" defaultValue={cliente.nombre} className={inputBase} />
          </div>
          <div>
            <label htmlFor="apellido" className="block text-sm font-medium mb-1">Apellido</label>
            <input id="apellido" name="apellido" type="text" defaultValue={cliente.apellido} className={inputBase} />
          </div>
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium mb-1">Teléfono</label>
            <input id="telefono" name="telefono" type="text" defaultValue={cliente.telefono} className={inputBase} />
          </div>
          <div>
            <label htmlFor="contacto" className="block text-sm font-medium mb-1">Contacto</label>
            <input id="contacto" name="contacto" type="text" defaultValue={cliente.contacto} className={inputBase} />
          </div>
          <div>
            <label htmlFor="cuit_dni" className="block text-sm font-medium mb-1">CUIT/DNI</label>
            <input id="cuit_dni" name="cuit_dni" type="text" defaultValue={cliente.cuit_dni} className={inputBase} />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-8">💼 Condiciones Fiscales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="condicion_iva_id" className="block text-sm font-medium mb-1">
              Condición IVA <span className="text-red-500">*</span>
            </label>
            <select id="condicion_iva_id" name="condicion_iva_id" defaultValue={cliente.condicion_iva_id} required className={selectBase}>
              <option value="">Seleccione condición</option>
              {condicionesIVA?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.descripcion}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="condicion_iibb_id" className="block text-sm font-medium mb-1">
              Condición IIBB
            </label>
            <select id="condicion_iibb_id" name="condicion_iibb_id" defaultValue={cliente.condicion_iibb_id} className={selectBase}>
              <option value="">Seleccione condición</option>
              {condicionesIIBB?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.descripcion}</option>
              ))}
            </select>
          </div>
        </div>

        {/* UBICACIÓN - Ahora editable con mapa */}
        <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-8">📍 Ubicación</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="domicilio" className="block text-sm font-medium mb-1">Domicilio</label>
            <input id="domicilio" name="domicilio" type="text" defaultValue={cliente.domicilio} className={inputBase} onChange={construirDireccion} />
          </div>
          <div>
            <label htmlFor="provincia_id" className="block text-sm font-medium mb-1">Provincia</label>
            <select id="provincia_id" name="provincia_id" defaultValue={cliente.provincia_id} className={selectBase} onChange={(e) => { setSelectedProvinciaId(Number(e.target.value)); construirDireccion(); }}>
              <option value="">Seleccione provincia</option>
              {provincias?.map((p: any) => (<option key={p.id} value={p.id}>{p.nombre}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="localidad_id" className="block text-sm font-medium mb-1">Localidad</label>
            <select id="localidad_id" name="localidad_id" defaultValue={cliente.localidad_id} className={selectBase} onChange={construirDireccion}>
              <option value="">Seleccione localidad</option>
              {localidadesFiltradas?.map((l: any) => (<option key={l.id} value={l.id}>{l.nombre}</option>))}
            </select>
          </div>
        </div>

        {/* MAPA DE GEOLOCALIZACIÓN */}
        <div className="mb-6 p-4 bg-white rounded-lg border">
          <h4 className="text-md font-semibold mb-3">🗺️ Geolocalización</h4>
          <p className="text-sm text-gray-600 mb-4">Actualice la dirección arriba y busque en el mapa. Puede ajustar la ubicación arrastrando el marcador.</p>
          <MapPicker initialLat={lat} initialLng={lng} onLocationChange={(newLat, newLng) => { setLat(newLat); setLng(newLng); }} address={direccionCompleta} />
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

        {/* DIRECCIONES ADICIONALES */}
        <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-8">📫 Direcciones Adicionales (Opcional)</h3>
        <div className="space-y-4 mb-6">
          {direcciones.map((dir, index) => {
            const localidadesFiltradas = dir.provincia_id
              ? localidades?.filter((l: any) => l.provincia_id === Number(dir.provincia_id))
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
                      {provincias?.map((p: any) => (
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
                      {localidadesFiltradas.map((l: any) => (
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
                      {transportes?.map((t: any) => (
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

        {/* Generar Token de Stock Ambulante */}
        <div className="mt-8">
          <h3 className="text-md font-semibold text-gray-800 mb-4">📦 Generar Link de Stock Ambulante</h3>
          <div className="p-4 bg-white rounded-lg border">
            <p className="text-sm text-gray-600 mb-4">
              Genera un link único para que el cliente pueda visualizar el stock ambulante disponible.
            </p>
            
            <button
              type="button"
              onClick={generateStockAmbulanteToken}
              disabled={generatingToken}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {generatingToken ? 'Generando...' : '🔑 Generar Token'}
            </button>

            {tokenError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">❌ {tokenError}</p>
              </div>
            )}

            {tokenData && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md space-y-3">
                <div className="flex items-start space-x-2">
                  <span className="text-green-600 text-xl">✅</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-800 mb-1">Token generado exitosamente</p>
                    <p className="text-xs text-gray-600 mb-2">
                      Expira: {new Date(tokenData.expiresAt).toLocaleDateString('es-AR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border">
                  <p className="text-xs text-gray-500 mb-1">Token:</p>
                  <p className="text-xs font-mono text-gray-700 break-all">{tokenData.token}</p>
                </div>

                <div className="bg-white p-3 rounded border">
                  <p className="text-xs text-gray-500 mb-1">Link completo:</p>
                  <p className="text-xs font-mono text-blue-600 break-all mb-2">{tokenData.link}</p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(tokenData.link)}
                    className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                  >
                    📋 Copiar Link
                  </button>
                </div>
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