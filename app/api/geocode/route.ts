import { NextRequest, NextResponse } from 'next/server';

// Rate limiting simple (en producción considerar usar Redis o similar)
let lastRequestTime = 0;
const MIN_INTERVAL = 1100; // 1.1 segundos entre requests (Nominatim permite 1/seg)

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { error: 'Dirección requerida' },
      { status: 400 }
    );
  }

  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_INTERVAL) {
    const waitTime = MIN_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();

  try {
    // Agregar "Argentina" si no está en la búsqueda
    const searchQuery = address.toLowerCase().includes('argentina') 
      ? address 
      : `${address}, Argentina`;

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', searchQuery);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '5');
    url.searchParams.set('addressdetails', '1');

    console.log('🌍 Geocoding:', searchQuery);

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'CellPhoneFree-CRM/1.0 (contact@cellphonefree.com)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }

    const data: NominatimResult[] = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron resultados para esa dirección' },
        { status: 404 }
      );
    }

    // Devolver los primeros 5 resultados para que el usuario elija
    const results = data.map(item => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      display_name: item.display_name,
      address: item.address,
    }));

    console.log('✅ Geocoding exitoso:', results[0]);

    return NextResponse.json({
      success: true,
      results,
    });

  } catch (error: any) {
    console.error('❌ Error en geocoding:', error);
    return NextResponse.json(
      { error: 'Error al geocodificar la dirección', details: error.message },
      { status: 500 }
    );
  }
}
