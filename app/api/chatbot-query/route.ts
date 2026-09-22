import { NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { esSuperAdmin } from '@/app/lib/roles'
import { handleAccesoEstadisticasAvanzadas } from '@/app/lib/chatbot/handlers/acceso_estadisticas'
import { generarMensajeAyuda } from '@/app/lib/chatbot/handlers/ayuda'
import { handleClientesInactivos } from '@/app/lib/chatbot/handlers/clientes_inactivos'
import { handleGraficoItemPorSemana } from '@/app/lib/chatbot/handlers/grafico_item_semana'
import { handleItemsDisponiblesPorModelo } from '@/app/lib/chatbot/handlers/items_disponibles_modelo'
import { handleListarItems } from '@/app/lib/chatbot/handlers/listar_items'
import { handleProvinciaTopClientes } from '@/app/lib/chatbot/handlers/provincia_top_clientes'
import { handleConsultaStockItem } from '@/app/lib/chatbot/handlers/stock_item'
import { handleTopClientesPorItem } from '@/app/lib/chatbot/handlers/top_clientes'
import { handleTopClientesPorItemDias } from '@/app/lib/chatbot/handlers/top_clientes_item_dias'
import { handleTopClientesPorModelo } from '@/app/lib/chatbot/handlers/top_clientes_por_modelo'
import { handleTopClientesPorMonto } from '@/app/lib/chatbot/handlers/top_clientes_por_monto'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-sol'

const INSTRUCTIONS = `
Sos el asistente del CRM de CellPhoneFree. Respondé en español rioplatense.
Cuando la consulta coincida con una herramienta disponible, llamá exactamente a esa herramienta.
No inventes datos de clientes, ventas, stock ni estadísticas: esos datos solo pueden venir de las herramientas.
Usá mostrar_ayuda cuando el usuario pida ayuda o pregunte qué consultas puede hacer.
Si la consulta no corresponde a ninguna herramienta, explicá brevemente qué tipo de consultas admite el chatbot.
`

const tools = [
  {
    type: 'function',
    name: 'items_disponibles_por_modelo',
    description: 'Lista los artículos con stock disponibles para una marca y modelo de teléfono.',
    parameters: {
      type: 'object',
      properties: {
        modelo: { type: 'string', description: 'Marca y modelo completos, por ejemplo Samsung A15.' },
      },
      required: ['modelo'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'clientes_inactivos',
    description: 'Lista clientes del vendedor que no compran desde hace una cantidad de días.',
    parameters: {
      type: 'object',
      properties: {
        dias: { type: 'integer', minimum: 1 },
        limite: { type: 'integer', minimum: 1, maximum: 50 },
      },
      required: ['dias', 'limite'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'acceso_estadisticas_avanzadas',
    description: 'Muestra los enlaces de estadísticas avanzadas si el usuario tiene acceso.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    type: 'function',
    name: 'mostrar_ayuda',
    description: 'Muestra las consultas y ejemplos disponibles en el chatbot.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    type: 'function',
    name: 'grafico_item_por_semana',
    description: 'Genera un gráfico de ventas semanales de un artículo durante las últimas cuatro semanas.',
    parameters: {
      type: 'object',
      properties: { item: { type: 'string' } },
      required: ['item'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'listar_items',
    description: 'Lista todos los tipos de artículos cargados en el CRM.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    type: 'function',
    name: 'provincia_top_clientes',
    description: 'Para usuarios captadores, muestra los principales clientes de una provincia argentina.',
    parameters: {
      type: 'object',
      properties: { provincia: { type: 'string' } },
      required: ['provincia'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'consultar_stock_item',
    description: 'Consulta modelos, cantidades disponibles y precios de un tipo de artículo.',
    parameters: {
      type: 'object',
      properties: { item: { type: 'string' } },
      required: ['item'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'top_clientes_por_item_dias',
    description: 'Lista los clientes que más compraron un artículo durante los últimos días indicados.',
    parameters: {
      type: 'object',
      properties: {
        item: { type: 'string' },
        limite: { type: 'integer', minimum: 1, maximum: 50 },
        dias: { type: 'integer', minimum: 1, maximum: 3650 },
      },
      required: ['item', 'limite', 'dias'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'top_clientes_por_modelo',
    description: 'Lista los clientes que más compraron fundas o vidrios para un modelo de teléfono.',
    parameters: {
      type: 'object',
      properties: {
        modelo: { type: 'string' },
        tipo: { type: 'string', enum: ['fundas', 'vidrio'] },
        limite: { type: 'integer', minimum: 1, maximum: 50 },
      },
      required: ['modelo', 'tipo', 'limite'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'top_clientes_por_monto',
    description: 'Lista los clientes del vendedor que más dinero gastaron.',
    parameters: {
      type: 'object',
      properties: { limite: { type: 'integer', minimum: 1, maximum: 50 } },
      required: ['limite'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'top_clientes_por_item',
    description: 'Lista los clientes del vendedor que más unidades compraron de un artículo.',
    parameters: {
      type: 'object',
      properties: {
        item: { type: 'string' },
        limite: { type: 'integer', minimum: 1, maximum: 50 },
      },
      required: ['item', 'limite'],
      additionalProperties: false,
    },
  },
] as const

type ResponseOutput = {
  type?: string
  name?: string
  arguments?: string
  content?: Array<{ type?: string; text?: string }>
}

type OpenAIResponse = {
  output?: ResponseOutput[]
  output_text?: string
  error?: { message?: string }
}

class OpenAIRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

function stringArg(args: Record<string, unknown>, name: string): string {
  const value = args[name]
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Falta el argumento ${name}`)
  }
  return value.trim()
}

function numberArg(
  args: Record<string, unknown>,
  name: string,
  defaultValue: number,
  maximum: number,
): number {
  const value = args[name]
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) return defaultValue
  return Math.min(Math.max(Math.trunc(number), 1), maximum)
}

function parseArguments(value?: string): Record<string, unknown> {
  if (!value) return {}
  const parsed: unknown = JSON.parse(value)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Los argumentos de la herramienta no son válidos')
  }
  return parsed as Record<string, unknown>
}

function extractOutputText(response: OpenAIResponse): string | undefined {
  if (response.output_text?.trim()) return response.output_text.trim()

  return response.output
    ?.filter((item) => item.type === 'message')
    .flatMap((item) => item.content ?? [])
    .filter((content) => content.type === 'output_text' && content.text)
    .map((content) => content.text)
    .join('\n')
    .trim()
}

async function createResponse(mensaje: string): Promise<OpenAIResponse> {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: INSTRUCTIONS,
      input: mensaje,
      tools,
      tool_choice: 'auto',
      parallel_tool_calls: false,
    }),
  })

  const body = await response.text()
  let data: OpenAIResponse = {}

  if (body) {
    try {
      data = JSON.parse(body) as OpenAIResponse
    } catch {
      throw new OpenAIRequestError('OpenAI devolvió una respuesta que no es JSON.', response.status)
    }
  }

  if (!response.ok) {
    throw new OpenAIRequestError(
      data.error?.message || `OpenAI respondió con estado ${response.status}.`,
      response.status,
    )
  }

  if (!body) {
    throw new OpenAIRequestError('OpenAI devolvió una respuesta vacía.', response.status)
  }

  return data
}

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  vendedorId: number | null,
  rol: string,
): Promise<string> {
  switch (name) {
    case 'items_disponibles_por_modelo':
      return handleItemsDisponiblesPorModelo({ modelo: stringArg(args, 'modelo') })
    case 'clientes_inactivos':
      return handleClientesInactivos(
        {
          dias: numberArg(args, 'dias', 30, 3650),
          limite: numberArg(args, 'limite', 10, 50),
        },
        vendedorId,
      )
    case 'acceso_estadisticas_avanzadas':
      return (
        (await handleAccesoEstadisticasAvanzadas({}, vendedorId)) ||
        '🚫 No tenés acceso a las estadísticas avanzadas. Consultá con un administrador si creés que esto es un error.'
      )
    case 'mostrar_ayuda':
      return generarMensajeAyuda()
    case 'grafico_item_por_semana':
      return handleGraficoItemPorSemana({ item: stringArg(args, 'item') }, vendedorId)
    case 'listar_items':
      return handleListarItems()
    case 'provincia_top_clientes':
      return handleProvinciaTopClientes({ provincia: stringArg(args, 'provincia').toLowerCase() }, rol)
    case 'consultar_stock_item':
      return handleConsultaStockItem({ item: stringArg(args, 'item') })
    case 'top_clientes_por_item_dias':
      return handleTopClientesPorItemDias(
        {
          item: stringArg(args, 'item'),
          limite: numberArg(args, 'limite', 10, 50),
          dias: numberArg(args, 'dias', 30, 3650),
        },
        vendedorId,
      )
    case 'top_clientes_por_modelo':
      return handleTopClientesPorModelo(
        {
          modelo: stringArg(args, 'modelo'),
          tipo: stringArg(args, 'tipo'),
          limite: numberArg(args, 'limite', 10, 50),
        },
        vendedorId,
      )
    case 'top_clientes_por_monto':
      return handleTopClientesPorMonto(
        { limite: numberArg(args, 'limite', 10, 50) },
        vendedorId,
      )
    case 'top_clientes_por_item':
      return handleTopClientesPorItem(
        {
          item: stringArg(args, 'item'),
          limite: numberArg(args, 'limite', 10, 50),
        },
        vendedorId,
      )
    default:
      throw new Error(`Herramienta desconocida: ${name}`)
  }
}

export async function POST(req: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { respuesta: '⚠️ Falta configurar OPENAI_API_KEY en el servidor.' },
        { status: 500 },
      )
    }

    const requestBody: unknown = await req.json()
    const mensaje =
      requestBody && typeof requestBody === 'object' && 'mensaje' in requestBody
        ? (requestBody as { mensaje?: unknown }).mensaje
        : undefined

    if (typeof mensaje !== 'string' || !mensaje.trim()) {
      return NextResponse.json(
        { respuesta: 'Escribí una consulta antes de enviar.' },
        { status: 400 },
      )
    }

    const session = await auth()
    const rol = session?.user?.rol || ''
    // El super usuario consulta sin filtrar por vendedor
    const vendedorId = esSuperAdmin(rol) ? null : (session?.user?.vendedor_id || 1)
    const response = await createResponse(mensaje.trim())
    const toolCall = response.output?.find((item) => item.type === 'function_call')

    if (toolCall?.name) {
      const resultado = await executeTool(
        toolCall.name,
        parseArguments(toolCall.arguments),
        vendedorId,
        rol,
      )
      return NextResponse.json({ respuesta: resultado })
    }

    return NextResponse.json({
      respuesta: extractOutputText(response) || 'No se obtuvo respuesta.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    const status = error instanceof OpenAIRequestError ? error.status : 500
    console.error('Error en chatbot-query:', { status, message })

    return NextResponse.json(
      { respuesta: `⚠️ No se pudo procesar la consulta: ${message}` },
      { status: status >= 400 && status < 600 ? status : 500 },
    )
  }
}
