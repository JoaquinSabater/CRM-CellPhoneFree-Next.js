import { NextResponse } from 'next/server'
import { analizarMensaje } from '@/app/lib/chatbot/analizarMensajes'
import { handleTopClientesPorItem } from '@/app/lib/chatbot/handlers/top_clientes'
import { handleClientesInactivos } from '@/app/lib/chatbot/handlers/clientes_inactivos'
import { handleConsultaStockItem } from '@/app/lib/chatbot/handlers/stock_item'
import { generarMensajeAyuda } from '@/app/lib/chatbot/handlers/ayuda'
import { auth } from '@/app/lib/auth';
import { handleTopClientesPorMonto } from '@/app/lib/chatbot/handlers/top_clientes_por_monto'
import { handleGraficoItemPorSemana } from '@/app/lib/chatbot/handlers/grafico_item_semana'
import { handleAccesoEstadisticasAvanzadas } from '@/app/lib/chatbot/handlers/acceso_estadisticas'
import { handleListarItems } from '@/app/lib/chatbot/handlers/listar_items'
import { handleTopClientesPorModelo } from '@/app/lib/chatbot/handlers/top_clientes_por_modelo'


export async function POST(req: Request) {
  const session = await auth()
  const vendedorId = session?.user?.vendedor_id
  const rol = session?.user?.rol

  if (!vendedorId) {
    return NextResponse.json({ respuesta: '⚠️ No se pudo identificar tu vendedor_id.' }, { status: 401 })
  }

  const { mensaje } = await req.json()
  const { intent, entities } = analizarMensaje(mensaje)

  let respuesta = '🤔 No entendí tu pregunta. Probá con: ¿Quiénes compraron más fundas?'

switch (intent) {
  case 'top_clientes_por_item': {
    const { item, limite } = entities;
    if (typeof item === 'string' && typeof limite === 'number') {
      respuesta = await handleTopClientesPorItem({ item, limite }, vendedorId);
    } else {
      respuesta = '⚠️ Faltan datos para procesar la consulta de top clientes por item.';
    }
    break;
  }
  case 'clientes_inactivos': {
    const { dias, limite } = entities;
    if (typeof dias === 'number' && typeof limite === 'number') {
      respuesta = await handleClientesInactivos({ dias, limite }, vendedorId);
    } else {
      respuesta = '⚠️ Faltan datos para procesar la consulta de clientes inactivos.';
    }
    break;
  }
   case 'consultar_stock_item': {
    const { item } = entities;
    if (typeof item === 'string') {
      respuesta = await handleConsultaStockItem({ item });
    } else {
      respuesta = '⚠️ Faltan datos para procesar la consulta de stock de ítem.';
    }
    break;
  }
  case 'mostrar_ayuda':
    respuesta = generarMensajeAyuda()
  break
  case 'top_clientes_por_monto': {
    const { limite } = entities;
    if (typeof limite === 'number') {
      respuesta = await handleTopClientesPorMonto({ limite }, vendedorId);
    } else {
      respuesta = '⚠️ Faltan datos para procesar la consulta de top clientes por monto.';
    }
    break;
  }
  case 'grafico_item_por_semana': {
    const { item } = entities;
    if (typeof item === 'string') {
      respuesta = await handleGraficoItemPorSemana({ item }, vendedorId);
    } else {
      respuesta = '⚠️ Faltan datos para procesar la consulta del gráfico de ventas por semana.';
    }
    break;
  }
  case 'acceso_estadisticas_avanzadas': {
    const res = await handleAccesoEstadisticasAvanzadas(entities, vendedorId)
    if (res) {
      respuesta = res
    } else {
      return new Response(null, { status: 204 }) // No se responde nada
    }
    break
  }
    case 'top_clientes_por_modelo': {
      const { modelo, tipo, limite } = entities;
      if (typeof modelo === 'string' && typeof limite === 'number') {
        respuesta = await handleTopClientesPorModelo({ modelo, tipo, limite }, vendedorId);
      } else {
        respuesta = '⚠️ Faltan datos para procesar la consulta de top clientes por modelo.';
      }
    break
  }
  case 'listar_items':
    respuesta = await handleListarItems()
  break
}

  return NextResponse.json({ respuesta })
}
