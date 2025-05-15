import { NextResponse } from 'next/server';
import { getArticulosDePedido } from '@/app/lib/data';

export async function GET(
  request: Request,
  { params }: { params: { pedidoId: string } }
) {
  // Espera explícitamente los params si es necesario
  const pedidoIdNum = Number((await params).pedidoId);

  if (isNaN(pedidoIdNum)) return NextResponse.json([], { status: 400 });
  const articulos = await getArticulosDePedido(pedidoIdNum);
  return NextResponse.json(articulos);
}