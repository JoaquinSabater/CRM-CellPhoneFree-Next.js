import { NextResponse } from 'next/server'
import { handleClientesInactivos } from '@/app/lib/chatbot/handlers/clientes_inactivos'
import { handleItemsDisponiblesPorModelo } from '@/app/lib/chatbot/handlers/items_disponibles_modelo'
import { auth } from '@/app/lib/auth'
import { handleAccesoEstadisticasAvanzadas } from '@/app/lib/chatbot/handlers/acceso_estadisticas'
import { generarMensajeAyuda } from '@/app/lib/chatbot/handlers/ayuda'
import { handleGraficoItemPorSemana } from '@/app/lib/chatbot/handlers/grafico_item_semana'
import { handleListarItems } from '@/app/lib/chatbot/handlers/listar_items'
import { handleProvinciaTopClientes } from '@/app/lib/chatbot/handlers/provincia_top_clientes'
import { handleConsultaStockItem } from '@/app/lib/chatbot/handlers/stock_item'
import { handleTopClientesPorItemDias } from '@/app/lib/chatbot/handlers/top_clientes_item_dias'
import { handleTopClientesPorModelo } from '@/app/lib/chatbot/handlers/top_clientes_por_modelo'
import { handleTopClientesPorMonto } from '@/app/lib/chatbot/handlers/top_clientes_por_monto'
import { handleTopClientesPorItem } from '@/app/lib/chatbot/handlers/top_clientes'






const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID!;

export async function POST(req: Request) {
  const session = await auth()
  const vendedorId = session?.user?.vendedor_id || 1;
  const { mensaje } = await req.json()

  // 1. Crear thread
  const threadRes = await fetch('https://api.openai.com/v1/threads', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
  })
  const thread = await threadRes.json()

  // 2. Agregar mensaje al thread
  await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({
      role: 'user',
      content: mensaje
    })
  })

  // 3. Lanzar run
  const runRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({
      assistant_id: ASSISTANT_ID,
    })
  })
  const run = await runRes.json()

  // 4. Polling y function calling
  let runStatus = run.status;
  let runId = run.id;
  let ciclos = 0;
  while (runStatus !== 'completed' && runStatus !== 'failed' && runStatus !== 'cancelled' && ciclos < 20) {
    ciclos++;

    const statusRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${runId}`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      }
    })
    const statusData = await statusRes.json();
    runStatus = statusData.status;

    // Function call
    if (runStatus === 'requires_action' && statusData.required_action?.type === 'submit_tool_outputs') {
      const toolCalls = statusData.required_action.submit_tool_outputs.tool_calls;
      for (const call of toolCalls) {
        // Si es un handler "directo", devolvé respuesta y cortá
        if (call.function.name === 'items_disponibles_por_modelo') {
          const args = JSON.parse(call.function.arguments);
          const resultado = await handleItemsDisponiblesPorModelo({ modelo: args.modelo });
          return NextResponse.json({ respuesta: resultado });
        }
        if (call.function.name === 'clientes_inactivos') {
          const args = JSON.parse(call.function.arguments);
          const resultado = await handleClientesInactivos({ dias: args.dias, limite: args.limite }, vendedorId);
          return NextResponse.json({ respuesta: resultado });
        }
        if (call.function.name === 'acceso_estadisticas_avanzadas') {
          const resultado = await handleAccesoEstadisticasAvanzadas({}, vendedorId);
          if (resultado) {
            return NextResponse.json({ respuesta: resultado });
          } else {
            return NextResponse.json({
              respuesta: '🚫 No tenés acceso a las estadísticas avanzadas. Consultá con un administrador si creés que esto es un error.'
            });
          }
        }
        if (call.function.name === 'mostrar_ayuda') {
          const resultado = generarMensajeAyuda();
          return NextResponse.json({ respuesta: resultado });
        }
        if (call.function.name === 'grafico_item_por_semana') {
          const args = JSON.parse(call.function.arguments);
          const resultado = await handleGraficoItemPorSemana({ item: args.item }, vendedorId);
          return NextResponse.json({ respuesta: resultado });
        }
        if (call.function.name === 'listar_items') {
          const resultado = await handleListarItems();
          return NextResponse.json({ respuesta: resultado });
        }
        if (call.function.name === 'provincia_top_clientes') {
          const args = JSON.parse(call.function.arguments);
          const rol = session?.user?.rol || "";
          const resultado = await handleProvinciaTopClientes({ provincia: args.provincia }, rol);
          return NextResponse.json({ respuesta: resultado });
        }
        if (call.function.name === 'consultar_stock_item') {
          const args = JSON.parse(call.function.arguments);
          const resultado = await handleConsultaStockItem({ item: args.item });
          return NextResponse.json({ respuesta: resultado });
        }
        if (call.function.name === 'top_clientes_por_item_dias') {
          const args = JSON.parse(call.function.arguments);
          const resultado = await handleTopClientesPorItemDias({
            item: args.item,
            limite: args.limite,
            dias: args.dias
          }, vendedorId);
          return NextResponse.json({ respuesta: resultado });
        }
        if (call.function.name === 'top_clientes_por_modelo') {
          const args = JSON.parse(call.function.arguments);
          const resultado = await handleTopClientesPorModelo({
            modelo: args.modelo,
            tipo: args.tipo,
            limite: args.limite
          }, vendedorId);
          return NextResponse.json({ respuesta: resultado });
        }
        if (call.function.name === 'top_clientes_por_monto') {
          const args = JSON.parse(call.function.arguments);
          const resultado = await handleTopClientesPorMonto({
            limite: args.limite
          }, vendedorId);
          return NextResponse.json({ respuesta: resultado });
        }
        if (call.function.name === 'top_clientes_por_item') {
          const args = JSON.parse(call.function.arguments);
          const resultado = await handleTopClientesPorItem({
            item: args.item,
            limite: args.limite
          }, vendedorId);
          return NextResponse.json({ respuesta: resultado });
        }
      }
    }
    await new Promise(res => setTimeout(res, 1200));
  }

  // 5. Si no hubo function call, devolvé la respuesta del Assistant
  const messagesRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    }
  });
  const messages = await messagesRes.json();

  if (!messages.data) {
    return NextResponse.json({ respuesta: '⚠️ Error consultando la respuesta del Asistente. Intentalo de nuevo.' });
  }

  const mensajeBot = messages.data
    .reverse()
    .find((msg: any) => msg.role === 'assistant')?.content[0]?.text?.value || 'No se obtuvo respuesta.';

  return NextResponse.json({ respuesta: mensajeBot })
}