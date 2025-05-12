import { NextResponse } from 'next/server';
import { getClientesInactivosPorVendedor } from '@/app/lib/data';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vendedorId = Number(searchParams.get('vendedorId'));
  const limite = Number(searchParams.get('limite'));
  if (!vendedorId || !limite) return NextResponse.json([], { status: 400 });

  const data = await getClientesInactivosPorVendedor(vendedorId, limite);
  return NextResponse.json(data);
}