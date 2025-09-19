import { getDetallePedidoPreliminar } from '@/app/lib/data';
import { NextRequest, NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    
    
    const pedidoId = parseInt(id);
    
    if (isNaN(pedidoId)) {
      console.error('❌ ID de pedido inválido:', id);
      return NextResponse.json(
        { error: 'ID de pedido inválido' },
        { status: 400 }
      );
    }

    const detalle = await getDetallePedidoPreliminar(pedidoId);
    
    return NextResponse.json(detalle);
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Error al obtener detalle del pedido',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}