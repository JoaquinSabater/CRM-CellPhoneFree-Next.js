import { NextResponse } from 'next/server';
import { getProductosPorMarca } from '@/app/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clienteId = Number(searchParams.get('clienteId'));
  const marcaId = Number(searchParams.get('marcaId'));

  if (!clienteId || !marcaId) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }

  const productos = await getProductosPorMarca(clienteId, marcaId);
  return NextResponse.json(productos);
}