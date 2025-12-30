import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/mysql';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vendedorId = searchParams.get('vendedor_id');
    const mostrarTodos = searchParams.get('mostrar_todos') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 5000;

    console.log('🗺️ [API Mapa] Solicitud recibida para vendedor:', vendedorId, 'mostrarTodos:', mostrarTodos);

    if (!vendedorId) {
      return NextResponse.json(
        { error: 'vendedor_id es requerido' },
        { status: 400 }
      );
    }

    // Query para obtener clientes del vendedor o TODOS según mostrarTodos
    // Calculamos si están activos o inactivos basado en última compra
    const sql = `
      SELECT 
        c.id,
        c.razon_social,
        c.domicilio,
        c.lat,
        c.lng,
        c.vendedor_id,
        v.nombre AS vendedor_nombre,
        l.nombre AS localidad_nombre,
        p.id AS provincia_id,
        p.nombre AS provincia_nombre,
        MAX(ped.fecha_creacion) AS ultima_compra,
        CASE 
          WHEN MAX(ped.fecha_creacion) IS NULL THEN 'sin_compras'
          WHEN MAX(ped.fecha_creacion) <= DATE_SUB(CURDATE(), INTERVAL 60 DAY) THEN 'inactivo'
          ELSE 'activo'
        END AS estado
      FROM clientes c
      LEFT JOIN vendedores v ON c.vendedor_id = v.id
      LEFT JOIN localidad l ON c.localidad_id = l.id
      LEFT JOIN provincia p ON l.provincia_id = p.id
      LEFT JOIN pedidos ped ON c.id = ped.cliente_id
      ${mostrarTodos ? '' : 'WHERE c.vendedor_id = ?'}
      GROUP BY c.id, c.razon_social, c.domicilio, c.lat, c.lng, c.vendedor_id, v.nombre,
               l.nombre, p.id, p.nombre
      LIMIT ?
    `;

    const [rows]: any = mostrarTodos 
      ? await db.query(sql, [limit])
      : await db.query(sql, [vendedorId, limit]);

    console.log('🗺️ [API Mapa] Total clientes del vendedor:', rows.length);

    // Procesar los resultados
    // Clientes con coordenadas propias: usar sus lat/lng
    // Clientes sin coordenadas: usar centro de Argentina como fallback
    const clientesConCoordenadas = rows.map((cliente: any) => {
      const tieneCoordenadasPropias = !!(cliente.lat && cliente.lng);
      
      return {
        id: cliente.id,
        razon_social: cliente.razon_social,
        domicilio: cliente.domicilio,
        lat: tieneCoordenadasPropias ? Number(cliente.lat) : -34.6037,
        lng: tieneCoordenadasPropias ? Number(cliente.lng) : -58.3816,
        localidad_nombre: cliente.localidad_nombre,
        provincia_id: cliente.provincia_id,
        provincia_nombre: cliente.provincia_nombre,
        ultima_compra: cliente.ultima_compra,
        estado: cliente.estado,
        tiene_coordenadas_propias: tieneCoordenadasPropias,
        vendedor_id: cliente.vendedor_id,
        vendedor_nombre: cliente.vendedor_nombre,
      };
    });

    const conCoordenadasPropias = clientesConCoordenadas.filter((c: any) => c.tiene_coordenadas_propias).length;
    console.log(`🗺️ [API Mapa] Clientes con ubicación exacta: ${conCoordenadasPropias}/${rows.length}`);

    return NextResponse.json(clientesConCoordenadas);
  } catch (error) {
    console.error('❌ [API Mapa] Error al obtener clientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos' },
      { status: 500 }
    );
  }
}
