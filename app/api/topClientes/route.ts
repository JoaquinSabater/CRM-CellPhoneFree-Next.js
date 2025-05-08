import { NextResponse } from 'next/server';
import { getTopClientesPorItem } from '@/app/lib/data';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const item = searchParams.get('item');
    const vendedorId = Number(searchParams.get('vendedorId'));
    const limite = Number(searchParams.get('limite') || '5');

    if (!item || !vendedorId || isNaN(vendedorId) || isNaN(limite)) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    const data = await getTopClientesPorItem(item, vendedorId, limite);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en API /topClientes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
