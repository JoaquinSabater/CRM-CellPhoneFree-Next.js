import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/mysql';

export async function GET(request: NextRequest) {
  try {
    const marcaId = request.nextUrl.searchParams.get('marcaId');
    const modelo = request.nextUrl.searchParams.get('modelo');

    if (!marcaId) {
      return NextResponse.json({ error: 'marcaId es requerido.' }, { status: 400 });
    }

    if (!modelo) {
      return NextResponse.json({ error: 'modelo es requerido.' }, { status: 400 });
    }

    const sql = `
      SELECT DISTINCT
        a.codigo_interno,
        i.id AS item_id,
        i.nombre AS item,
        a.modelo,
        m.nombre AS marca_nombre,
        calcular_stock_fisico(a.codigo_interno) - calcular_stock_comprometido(a.codigo_interno) AS stock_real,
        d.foto1_url,
        d.foto_portada
      FROM articulos a
      INNER JOIN items i ON a.item_id = i.id
      INNER JOIN marcas m ON a.marca_id = m.id
      LEFT JOIN item_detalle d ON a.item_id = d.item_id
      WHERE i.disponible = 1
        AND a.marca_id = ?
        AND a.modelo = ?
      HAVING stock_real > 0
      ORDER BY i.nombre ASC
    `;

    const [rows] = await db.query(sql, [marcaId, modelo]);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('[catalogo-modelo/productos] Error:', error);
    return NextResponse.json(
      { error: 'No se pudieron obtener los productos.' },
      { status: 500 },
    );
  }
}