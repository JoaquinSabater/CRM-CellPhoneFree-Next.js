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
import { handleTopClientesPorItemDias } from '@/app/lib/chatbot/handlers/top_clientes_item_dias'
import { handleProvinciaTopClientes } from '@/app/lib/chatbot/handlers/provincia_top_clientes';
import { handleItemsDisponiblesPorModelo } from '@/app/lib/chatbot/handlers/items_disponibles_modelo';
import { handleTopItemsVendidos } from '@/app/lib/chatbot/handlers/top_items_vendidos'


export async function POST(req: Request) {
  const session = await auth()
  const vendedorId = session?.user?.vendedor_id
  const rol = session?.user?.rol

  if (!vendedorId && rol !== 'captador') {
    return NextResponse.json({ respuesta: '⚠️ No se pudo identificar tu vendedor_id.' }, { status: 401 })
  }

  const { mensaje } = await req.json()
  const { intent, entities } = analizarMensaje(mensaje)

  let respuesta = '🤔 No entendí tu pregunta. Probá con: ¿Quiénes compraron más fundas?'

switch (intent) {
    case 'top_items_vendidos': {
      const { topN, ultimosDias } = entities;
      if (typeof topN === 'number' && typeof ultimosDias === 'number') {
        respuesta = await handleTopItemsVendidos({ topN, ultimosDias });
      } else {
        respuesta = '⚠️ Faltan datos para procesar la consulta de top items vendidos.';
      }
      break;
    }
  
  case 'top_clientes_por_item': {
    const { item, limite } = entities;
    if (typeof item === 'string' && typeof limite === 'number' && typeof vendedorId === 'number') {
      respuesta = await handleTopClientesPorItem({ item, limite }, vendedorId);
    } else {
      respuesta = '⚠️ Faltan datos para procesar la consulta de top clientes por item.';
    }
    break;
  }
  case 'top_clientes_por_item_dias': {
    const { item, limite, dias } = entities;
    if (typeof item === 'string' && typeof limite === 'number' && typeof dias === 'number' && typeof vendedorId === 'number') {
      respuesta = await handleTopClientesPorItemDias({ item, limite, dias }, vendedorId);
    } else {
      respuesta = '⚠️ Faltan datos para procesar la consulta de top clientes por ítem y días.';
    }
    break;
  }
  case 'clientes_inactivos': {
    const { dias, limite } = entities;
    if (typeof dias === 'number' && typeof limite === 'number' && typeof vendedorId === 'number') {
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
    if (typeof limite === 'number' && typeof vendedorId === 'number') {
      respuesta = await handleTopClientesPorMonto({ limite }, vendedorId);
    } else {
      respuesta = '⚠️ Faltan datos para procesar la consulta de top clientes por monto.';
    }
    break;
  }
  case 'grafico_item_por_semana': {
    const { item } = entities;
    if (typeof item === 'string' && typeof vendedorId === 'number') {
      respuesta = await handleGraficoItemPorSemana({ item }, vendedorId);
    } else {
      respuesta = '⚠️ Faltan datos para procesar la consulta del gráfico de ventas por semana.';
    }
    break;
  }
  case 'acceso_estadisticas_avanzadas': {
    if (typeof vendedorId === 'number') {
      const res = await handleAccesoEstadisticasAvanzadas(entities, vendedorId)
      if (res) {
        respuesta = res
      } else {
        return new Response(null, { status: 204 }) // No se responde nada
      }
    } else {
      respuesta = '⚠️ No se pudo identificar tu vendedor_id para acceder a estadísticas avanzadas.';
    }
    break
  }
    case 'top_clientes_por_modelo': {
      const { modelo, tipo, limite } = entities;
      if (typeof modelo === 'string' && typeof limite === 'number' && typeof vendedorId === 'number') {
        respuesta = await handleTopClientesPorModelo({ modelo, tipo, limite }, vendedorId);
      } else {
        respuesta = '⚠️ Faltan datos para procesar la consulta de top clientes por modelo.';
      }
    break
  }
  case 'provincia_top_clientes': {
    const { provincia } = entities;
    if (typeof provincia === 'string' && provincia.length > 0) {
      respuesta = await handleProvinciaTopClientes({ provincia }, rol ?? '');
    } else {
      respuesta = '⚠️ Debes indicar una provincia argentina para obtener los datos.';
    }
    break;
  }
  case 'items_disponibles_por_modelo': {
    const { modelo } = entities;
    if (typeof modelo === 'string' && modelo.length > 0) {
      respuesta = await handleItemsDisponiblesPorModelo({ modelo });
    } else {
      respuesta = '⚠️ Debes indicar un modelo para obtener los ítems disponibles.';
    }
    break;
  }
  case 'listar_items':
    respuesta = await handleListarItems()
  break
}

  return NextResponse.json({ respuesta })
}