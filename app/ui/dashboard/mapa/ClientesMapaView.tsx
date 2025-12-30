'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Cliente {
  id: number;
  razon_social: string;
  domicilio: string;
  lat: number;
  lng: number;
  localidad_nombre: string;
  provincia_id: number;
  provincia_nombre: string;
  ultima_compra: string | null;
  estado: 'activo' | 'inactivo' | 'sin_compras';
  tiene_coordenadas_propias: boolean;
  vendedor_id: number;
  vendedor_nombre: string;
}

interface Estadisticas {
  total: number;
  activos: number;
  inactivos: number;
  sin_compras: number;
  con_coordenadas_propias: number;
  por_provincia: Record<string, number>;
  por_localidad: Record<string, number>;
}

export default function ClientesMapaView({ vendedorId }: { vendedorId: number }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const markersOtros = useRef<maplibregl.Marker[]>([]);
  const lastClientesLength = useRef<number>(0);
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [mostrarOtrosVendedores, setMostrarOtrosVendedores] = useState(false);

  // Cargar clientes desde la API
  useEffect(() => {
    const url = mostrarOtrosVendedores
      ? `/api/clientes-mapa?vendedor_id=${vendedorId}&mostrar_todos=true`
      : `/api/clientes-mapa?vendedor_id=${vendedorId}`;
    
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        console.log('📊 Datos recibidos de la API:', data);
        
        if (Array.isArray(data)) {
          setClientes(data);
          // Solo calcular estadísticas con clientes propios
          const clientesPropios = data.filter((c: Cliente) => c.vendedor_id === vendedorId);
          calcularEstadisticas(clientesPropios);
        } else {
          console.error('❌ La API no retornó un array:', data);
          setClientes([]);
        }
        
        setLoading(false);
      })
      .catch((error) => {
        console.error('❌ Error al cargar clientes:', error);
        setClientes([]);
        setLoading(false);
      });
  }, [vendedorId, mostrarOtrosVendedores]);

  const calcularEstadisticas = (clientesData: Cliente[]) => {
    if (!Array.isArray(clientesData)) {
      console.error('❌ calcularEstadisticas recibió datos inválidos:', clientesData);
      return;
    }

    const stats: Estadisticas = {
      total: clientesData.length,
      activos: 0,
      inactivos: 0,
      sin_compras: 0,
      con_coordenadas_propias: 0,
      por_provincia: {},
      por_localidad: {},
    };

    clientesData.forEach((cliente) => {
      if (cliente.estado === 'activo') stats.activos++;
      else if (cliente.estado === 'inactivo') stats.inactivos++;
      else stats.sin_compras++;

      if (cliente.tiene_coordenadas_propias) stats.con_coordenadas_propias++;

      if (cliente.provincia_nombre) {
        stats.por_provincia[cliente.provincia_nombre] =
          (stats.por_provincia[cliente.provincia_nombre] || 0) + 1;
      }

      if (cliente.localidad_nombre) {
        stats.por_localidad[cliente.localidad_nombre] =
          (stats.por_localidad[cliente.localidad_nombre] || 0) + 1;
      }
    });

    setEstadisticas(stats);
  };

  // Inicializar el mapa (solo una vez)
  useEffect(() => {
    if (loading || map.current || clientes.length === 0) return;

    const initMap = () => {
      if (!mapContainer.current) {
        console.log('⚠️ mapContainer.current no está disponible aún');
        return;
      }

      console.log('🗺️ Inicializando mapa...', {
        container: mapContainer.current,
        clientWidth: mapContainer.current.clientWidth,
        clientHeight: mapContainer.current.clientHeight
      });

      const newMap = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            },
          },
          layers: [
            {
              id: 'osm',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: [-64.0, -34.0],
        zoom: 4,
      });

      newMap.addControl(new maplibregl.NavigationControl(), 'top-right');
      
      // Esperar a que el mapa termine de cargar y agregar marcadores inmediatamente
      newMap.on('load', () => {
        console.log('✅ Mapa inicializado correctamente');
        map.current = newMap;
        
        // Agregar marcadores iniciales inmediatamente
        console.log('📍 Agregando marcadores iniciales para', clientes.length, 'clientes');
        agregarMarcadores();
      });
    };

    const agregarMarcadores = () => {
      if (!map.current) return;

      clientes.forEach((cliente) => {
        const esPropio = cliente.vendedor_id === vendedorId;
        let color = '#10B981';
        
        if (!esPropio) {
          color = '#9333EA';
        } else {
          if (cliente.estado === 'inactivo') color = '#EF4444';
          if (cliente.estado === 'sin_compras') color = '#F59E0B';
        }

        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.backgroundColor = color;
        el.style.width = cliente.tiene_coordenadas_propias ? '16px' : '12px';
        el.style.height = cliente.tiene_coordenadas_propias ? '16px' : '12px';
        el.style.borderRadius = '50%';
        el.style.border = cliente.tiene_coordenadas_propias ? '3px solid white' : '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = esPropio ? 'pointer' : 'default';
        el.setAttribute('data-estado', cliente.estado);
        el.setAttribute('data-vendedor', esPropio ? 'propio' : 'otro');

        const popupHTML = esPropio
          ? `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">${cliente.razon_social}</h3>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">📍 ${cliente.domicilio || 'Sin dirección'}</p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">📌 ${cliente.localidad_nombre || 'Sin localidad'}, ${cliente.provincia_nombre || 'Sin provincia'}</p>
              ${cliente.ultima_compra ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">🛒 Última compra: ${new Date(cliente.ultima_compra).toLocaleDateString()}</p>` : '<p style="margin: 4px 0; font-size: 12px; color: #999;">Sin compras registradas</p>'}
              <p style="margin: 8px 0 4px 0; font-size: 11px; color: #999;">${cliente.tiene_coordenadas_propias ? '✓ Ubicación exacta' : '⚠ Ubicación aproximada'}</p>
              <button onclick="window.open('/dashboard/invoices/${cliente.id}/edit', '_blank')" style="margin-top: 8px; padding: 6px 12px; background-color: #F97316; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;">Ver detalle del cliente →</button>
            </div>
          `
          : `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px; color: #9333EA;">${cliente.razon_social}</h3>
              <p style="margin: 4px 0; font-size: 12px; color: #9333EA; font-weight: 500;">🔒 Cliente de: ${cliente.vendedor_nombre || 'Vendedor desconocido'}</p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">📌 ${cliente.localidad_nombre || 'Sin localidad'}, ${cliente.provincia_nombre || 'Sin provincia'}</p>
              <p style="margin: 8px 0 4px 0; font-size: 11px; color: #999;">No tienes acceso a los detalles de este cliente</p>
            </div>
          `;

        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupHTML);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([cliente.lng, cliente.lat])
          .setPopup(popup)
          .addTo(map.current!);

        if (esPropio) {
          markers.current.push(marker);
        } else {
          markersOtros.current.push(marker);
        }
      });

      console.log('✅ Marcadores agregados - Propios:', markers.current.length, 'Otros:', markersOtros.current.length);
    };

    // Dar tiempo al DOM para renderizar
    const timer = setTimeout(initMap, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [loading, clientes.length]);

  // Actualizar marcadores cuando cambien los clientes
  useEffect(() => {
    // Solo actualizar si el mapa ya existe
    if (!map.current || clientes.length === 0) return;
    
    // Evitar re-render si ya procesamos estos clientes
    if (lastClientesLength.current === clientes.length) {
      console.log('⏭️ Saltando actualización, misma cantidad de clientes');
      return;
    }

    console.log('🔄 Actualizando marcadores:', clientes.length, 'clientes');
    lastClientesLength.current = clientes.length;

    // Limpiar todos los marcadores existentes
    markers.current.forEach(marker => marker.remove());
    markersOtros.current.forEach(marker => marker.remove());
    markers.current = [];
    markersOtros.current = [];

    // Crear nuevos marcadores
    clientes.forEach((cliente) => {
      if (!map.current) return;

      const esPropio = cliente.vendedor_id === vendedorId;
      let color = '#10B981';
      
      if (!esPropio) {
        color = '#9333EA';
      } else {
        if (cliente.estado === 'inactivo') color = '#EF4444';
        if (cliente.estado === 'sin_compras') color = '#F59E0B';
      }

      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.backgroundColor = color;
      el.style.width = cliente.tiene_coordenadas_propias ? '16px' : '12px';
      el.style.height = cliente.tiene_coordenadas_propias ? '16px' : '12px';
      el.style.borderRadius = '50%';
      el.style.border = cliente.tiene_coordenadas_propias ? '3px solid white' : '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = esPropio ? 'pointer' : 'default';
      el.setAttribute('data-estado', cliente.estado);
      el.setAttribute('data-vendedor', esPropio ? 'propio' : 'otro');

      const popupHTML = esPropio
        ? `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">${cliente.razon_social}</h3>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">📍 ${cliente.domicilio || 'Sin dirección'}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">📌 ${cliente.localidad_nombre || 'Sin localidad'}, ${cliente.provincia_nombre || 'Sin provincia'}</p>
            ${cliente.ultima_compra ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">🛒 Última compra: ${new Date(cliente.ultima_compra).toLocaleDateString()}</p>` : '<p style="margin: 4px 0; font-size: 12px; color: #999;">Sin compras registradas</p>'}
            <p style="margin: 8px 0 4px 0; font-size: 11px; color: #999;">${cliente.tiene_coordenadas_propias ? '✓ Ubicación exacta' : '⚠ Ubicación aproximada'}</p>
            <button onclick="window.open('/dashboard/invoices/${cliente.id}/edit', '_blank')" style="margin-top: 8px; padding: 6px 12px; background-color: #F97316; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;">Ver detalle del cliente →</button>
          </div>
        `
        : `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px; color: #9333EA;">${cliente.razon_social}</h3>
            <p style="margin: 4px 0; font-size: 12px; color: #9333EA; font-weight: 500;">🔒 Cliente de: ${cliente.vendedor_nombre || 'Vendedor desconocido'}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">📌 ${cliente.localidad_nombre || 'Sin localidad'}, ${cliente.provincia_nombre || 'Sin provincia'}</p>
            <p style="margin: 8px 0 4px 0; font-size: 11px; color: #999;">No tienes acceso a los detalles de este cliente</p>
          </div>
        `;

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupHTML);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([cliente.lng, cliente.lat])
        .setPopup(popup)
        .addTo(map.current);

      if (esPropio) {
        markers.current.push(marker);
      } else {
        markersOtros.current.push(marker);
      }
    });

    console.log('✅ Marcadores actualizados - Propios:', markers.current.length, 'Otros:', markersOtros.current.length);
  }, [clientes, vendedorId]);

  // useEffect separado ya no es necesario - se eliminó el useEffect de marcadores

  // Filtrar marcadores visualmente
  useEffect(() => {
    const allMarkers = document.querySelectorAll('.custom-marker');
    allMarkers.forEach((marker) => {
      const estadoMarcador = marker.getAttribute('data-estado');
      if (filtroEstado === 'todos') {
        (marker as HTMLElement).style.display = 'block';
      } else {
        (marker as HTMLElement).style.display = estadoMarcador === filtroEstado ? 'block' : 'none';
      }
    });
  }, [filtroEstado]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando mapa de clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4 px-4 pb-4">
      {/* Mapa Grande */}
      <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden min-h-0">
        <div ref={mapContainer} className="w-full h-full" />
      </div>

      {/* Panel de Estadísticas Horizontal */}
      <div className="flex gap-4 h-52 flex-shrink-0">
        {/* Filtros y Resumen */}
        <div className="w-80 bg-white rounded-lg shadow-md p-4 overflow-y-auto flex-shrink-0">
          {/* Filtros */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Filtrar por estado:</label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-orange-500 focus:ring-2 focus:ring-orange-200">
              <option value="todos">Todos los clientes</option>
              <option value="activo">Solo activos</option>
              <option value="inactivo">Solo inactivos</option>
              <option value="sin_compras">Sin compras</option>
            </select>
          </div>

          {/* Switch para mostrar clientes de otros vendedores */}
          <div className="mb-3 p-2 bg-purple-50 rounded border border-purple-200">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={mostrarOtrosVendedores}
                onChange={(e) => setMostrarOtrosVendedores(e.target.checked)}
                className="w-3 h-3 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="ml-2 text-xs font-medium text-gray-700">
                Mostrar otros vendedores
              </span>
            </label>
          </div>

          {/* Resumen Compacto */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col p-1.5 bg-gray-50 rounded text-center">
              <span className="text-xs text-gray-600">Total</span>
              <span className="font-bold text-gray-800">{estadisticas?.total}</span>
            </div>
            <div className="flex flex-col p-1.5 bg-green-50 rounded text-center">
              <span className="text-xs text-green-700">Activos</span>
              <span className="font-bold text-green-800">{estadisticas?.activos}</span>
            </div>
            <div className="flex flex-col p-1.5 bg-red-50 rounded text-center">
              <span className="text-xs text-red-700">Inactivos</span>
              <span className="font-bold text-red-800">{estadisticas?.inactivos}</span>
            </div>
            <div className="flex flex-col p-1.5 bg-yellow-50 rounded text-center">
              <span className="text-xs text-yellow-700">Sin compras</span>
              <span className="font-bold text-yellow-800">{estadisticas?.sin_compras}</span>
            </div>
          </div>
        </div>

        {/* Por Provincia */}
        <div className="flex-1 bg-white rounded-lg shadow-md p-4 overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Por Provincia</h3>
          <div className="space-y-1 overflow-y-auto h-[calc(100%-2rem)]">
            {estadisticas && Object.entries(estadisticas.por_provincia).sort((a, b) => b[1] - a[1]).map(([provincia, cantidad]) => (
              <div key={provincia} className="flex justify-between items-center text-sm p-1.5 hover:bg-gray-50 rounded">
                <span className="text-gray-600 truncate">{provincia}</span>
                <span className="font-semibold text-gray-800 ml-2">{cantidad}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 10 Localidades */}
        <div className="flex-1 bg-white rounded-lg shadow-md p-4 overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Top 10 Localidades</h3>
          <div className="space-y-1 overflow-y-auto h-[calc(100%-2rem)]">
            {estadisticas && Object.entries(estadisticas.por_localidad).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([localidad, cantidad]) => (
              <div key={localidad} className="flex justify-between items-center text-sm p-1.5 hover:bg-gray-50 rounded">
                <span className="text-gray-600 truncate">{localidad}</span>
                <span className="font-semibold text-gray-800 ml-2">{cantidad}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leyenda */}
        <div className="w-64 bg-white rounded-lg shadow-md p-4 overflow-y-auto flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Leyenda</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
              <span>Activo (últimos 60 días)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>
              <span>Inactivo (+60 días)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 border border-white"></div>
              <span>Sin compras</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-600 border border-white"></div>
              <span>Otro vendedor</span>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t">
              <div className="w-4 h-4 rounded-full bg-gray-400 border-2 border-white"></div>
              <span>Ubicación exacta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400 border border-white"></div>
              <span>Ubicación aproximada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
