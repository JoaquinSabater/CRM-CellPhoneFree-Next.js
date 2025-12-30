'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (lat: number, lng: number) => void;
  address?: string;
}

export default function MapPicker({ 
  initialLat = -34.6037, // Buenos Aires por defecto
  initialLng = -58.3816, 
  onLocationChange,
  address 
}: MapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [currentLat, setCurrentLat] = useState(Number(initialLat) || -34.6037);
  const [currentLng, setCurrentLng] = useState(Number(initialLng) || -58.3816);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [geocodeResults, setGeocodeResults] = useState<any[]>([]);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return; // Ya inicializado

    const validLat = Number(initialLat) || -34.6037;
    const validLng = Number(initialLng) || -58.3816;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm'
          }
        ]
      },
      center: [validLng, validLat],
      zoom: 13,
    });

    // Agregar controles de zoom
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Crear marcador draggable
    marker.current = new maplibregl.Marker({
      draggable: true,
      color: '#F97316', // Orange-500
    })
      .setLngLat([validLng, validLat])
      .addTo(map.current);

    // Actualizar coordenadas cuando se mueve el marcador
    marker.current.on('dragend', () => {
      const lngLat = marker.current!.getLngLat();
      setCurrentLat(lngLat.lat);
      setCurrentLng(lngLat.lng);
      onLocationChange(lngLat.lat, lngLat.lng);
    });

    // Permitir click en el mapa para mover marcador
    map.current.on('click', (e) => {
      marker.current?.setLngLat([e.lngLat.lng, e.lngLat.lat]);
      setCurrentLat(e.lngLat.lat);
      setCurrentLng(e.lngLat.lng);
      onLocationChange(e.lngLat.lat, e.lngLat.lng);
    });

    return () => {
      marker.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Actualizar marcador cuando cambian las coordenadas iniciales
  useEffect(() => {
    if (marker.current && map.current) {
      const validLat = Number(initialLat) || -34.6037;
      const validLng = Number(initialLng) || -58.3816;
      marker.current.setLngLat([validLng, validLat]);
      map.current.flyTo({ center: [validLng, validLat], zoom: 15 });
      setCurrentLat(validLat);
      setCurrentLng(validLng);
    }
  }, [initialLat, initialLng]);

  // Geocodificar cuando cambia la dirección
  const handleGeocode = async () => {
    if (!address || address.trim().length < 5) {
      setGeocodeError('Ingrese una dirección válida');
      return;
    }

    setIsGeocoding(true);
    setGeocodeError(null);
    setGeocodeResults([]);

    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setGeocodeError(data.error || 'Error al buscar la dirección');
        setIsGeocoding(false);
        return;
      }

      if (data.results && data.results.length > 0) {
        setGeocodeResults(data.results);
        // Seleccionar automáticamente el primer resultado
        selectResult(data.results[0]);
      } else {
        setGeocodeError('No se encontraron resultados');
      }
    } catch (error) {
      console.error('Error geocoding:', error);
      setGeocodeError('Error al conectar con el servicio de geocodificación');
    } finally {
      setIsGeocoding(false);
    }
  };

  const selectResult = (result: any) => {
    setSelectedResult(result);
    const { lat, lng } = result;
    
    if (marker.current && map.current) {
      marker.current.setLngLat([lng, lat]);
      map.current.flyTo({ center: [lng, lat], zoom: 16 });
      setCurrentLat(lat);
      setCurrentLng(lng);
      onLocationChange(lat, lng);
    }
  };

  return (
    <div className="space-y-4">
      {/* Botón de geocodificar */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleGeocode}
          disabled={isGeocoding || !address}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isGeocoding ? '🔄 Buscando...' : '🔍 Buscar en Mapa'}
        </button>
      </div>

      {/* Resultados de geocodificación */}
      {geocodeResults.length > 1 && (
        <div className="bg-gray-50 p-3 rounded-lg border">
          <p className="text-sm font-medium mb-2">Seleccione la ubicación correcta:</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {geocodeResults.map((result, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectResult(result)}
                className={`w-full text-left p-2 rounded text-sm transition-colors ${
                  selectedResult === result
                    ? 'bg-orange-100 border border-orange-500'
                    : 'bg-white hover:bg-gray-100 border border-gray-200'
                }`}
              >
                📍 {result.display_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Errores */}
      {geocodeError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          ⚠️ {geocodeError}
        </div>
      )}

      {/* Coordenadas actuales */}
      <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg">
        <p className="text-sm text-blue-900">
          📍 <strong>Coordenadas:</strong> {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
        </p>
        <p className="text-xs text-blue-700 mt-1">
          💡 Puede arrastrar el marcador o hacer click en el mapa para ajustar la ubicación
        </p>
      </div>

      {/* Contenedor del mapa */}
      <div 
        ref={mapContainer} 
        className="w-full h-[400px] rounded-lg border-2 border-gray-300"
      />
    </div>
  );
}
