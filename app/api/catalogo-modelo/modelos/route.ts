import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/mysql';

export async function GET(request: NextRequest) {
  try {
    const marcaId = request.nextUrl.searchParams.get('marcaId');

    if (!marcaId) {
      return NextResponse.json({ error: 'marcaId es requerido.' }, { status: 400 });
    }

    const sql = `
      SELECT DISTINCT a.modelo
      FROM articulos a
      INNER JOIN items i ON i.id = a.item_id
      WHERE a.marca_id = ?
        AND i.disponible = 1
        AND a.modelo IS NOT NULL
        AND a.modelo <> ''
      ORDER BY a.modelo ASC
    `;

    const [rows] = await db.query(sql, [marcaId]);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('[catalogo-modelo/modelos] Error:', error);
    return NextResponse.json(
      { error: 'No se pudieron obtener los modelos.' },
      { status: 500 },
    );
  }
}