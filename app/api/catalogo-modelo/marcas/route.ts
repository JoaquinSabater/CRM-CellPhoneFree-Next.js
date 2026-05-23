import { NextResponse } from 'next/server';
import { db } from '@/app/lib/mysql';

export async function GET() {
  try {
    const sql = `
      SELECT DISTINCT m.id, m.nombre
      FROM marcas m
      INNER JOIN articulos a ON a.marca_id = m.id
      INNER JOIN items i ON i.id = a.item_id
      WHERE i.disponible = 1
      ORDER BY m.nombre ASC
    `;

    const [rows] = await db.query(sql);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('[catalogo-modelo/marcas] Error:', error);
    return NextResponse.json(
      { error: 'No se pudieron obtener las marcas.' },
      { status: 500 },
    );
  }
}