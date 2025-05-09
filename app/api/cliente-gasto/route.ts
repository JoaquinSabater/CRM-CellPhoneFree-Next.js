import { NextResponse } from 'next/server';
import { getClienteDinero } from '@/app/lib/data';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clienteId = Number(searchParams.get('id'));
  if (!clienteId || isNaN(clienteId)) {
    return NextResponse.json([], { status: 400 });
  }

  const data = await getClienteDinero(clienteId);
  return NextResponse.json(data);
}