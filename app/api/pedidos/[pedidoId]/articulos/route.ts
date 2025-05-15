import { NextResponse } from 'next/server';
import { getArticulosDePedido } from '@/app/lib/data';

export async function GET(
  request: Request,
  context: { params: Promise<{ pedidoId: string }> } // params puede ser promesa
) {
  const { pedidoId } = await context.params; // await aquí

  const pedidoIdNum = Number(pedidoId);

  if (isNaN(pedidoIdNum)) return NextResponse.json([], { status: 400 });
  const articulos = await getArticulosDePedido(pedidoIdNum);
  return NextResponse.json(articulos);
}