import { getDetallePedidoPreliminar } from '@/app/lib/data';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pedidoId = parseInt(params.id);
    
    if (isNaN(pedidoId)) {
      return NextResponse.json(
        { error: 'ID de pedido inválido' },
        { status: 400 }
      );
    }

    const detalle = await getDetallePedidoPreliminar(pedidoId);
    
    return NextResponse.json(detalle);
  } catch (error) {
    console.error('Error al obtener detalle del pedido:', error);
    return NextResponse.json(
      { error: 'Error al obtener detalle del pedido' },
      { status: 500 }
    );
  }
}