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
    // Await params antes de usar sus propiedades
    const { id } = await params;
    
    console.log('🔍 API llamada - ID del pedido:', id);
    
    const pedidoId = parseInt(id);
    
    if (isNaN(pedidoId)) {
      console.error('❌ ID de pedido inválido:', id);
      return NextResponse.json(
        { error: 'ID de pedido inválido' },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando detalle para pedido ID:', pedidoId);
    const detalle = await getDetallePedidoPreliminar(pedidoId);
    
    console.log('✅ Detalle encontrado:', detalle.length, 'items');
    return NextResponse.json(detalle);
    
  } catch (error) {
    console.error('❌ Error en API route:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener detalle del pedido',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}