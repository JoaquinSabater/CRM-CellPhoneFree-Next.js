import {db} from "@/app/lib/mysql";


export async function handleConsultaStockItem(
  entities: { item: string }
): Promise<string> {
  const { item } = entities

  // Obtener cotización del dólar
  const [rawCotizacion] = await db.query(
    `SELECT valor FROM cotizaciones WHERE tipo = 'general' ORDER BY fecha_desde DESC LIMIT 1`
  )
  const cotizaciones = rawCotizacion as { valor: number }[]
  const dolar = cotizaciones[0]?.valor || 1

  const [raw] = await db.query(
    `SELECT 
       i.nombre as item_nombre,
       a.modelo,
       a.precio_venta,
       calcular_stock_fisico(a.codigo_interno) - calcular_stock_comprometido(a.codigo_interno) AS stock_real
     FROM articulos a
     JOIN items i ON a.item_id = i.id
     WHERE i.nombre LIKE ?
     ORDER BY a.modelo`,
    [`%${item}%`]
  )

  const rows = raw as { item_nombre: string; modelo: string; precio_venta: number; stock_real: number }[]

  const disponibles = rows.filter(r => r.stock_real > 0)

  if (!disponibles.length) {
    return `🛑 No hay stock disponible para "<b>${item}</b>".`
  }

  // Obtener el precio en dólares del primer artículo disponible
  const precioVentaDolares = disponibles[0]?.precio_venta || 0
  const itemNombre = disponibles[0]?.item_nombre || item

  // Convertir a pesos
  const precioLista = precioVentaDolares * dolar

  // Generar lista de modelos con stock
  const htmlModelosConStock = disponibles
    .map(
      (row) =>
        `• <b>${row.modelo || 'Modelo sin nombre'}</b> – ${row.stock_real} unidades`
    )
    .join('<br>')

  // Generar información de precios con descuentos
  const formatPrecio = (precio: number) => 
    `$ ${precio.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const precio10 = precioLista * 0.9
  const precio20 = precioLista * 0.8
  const precio30 = precioLista * 0.7

  const htmlPrecios = `
<br><br>
<b>${itemNombre.toUpperCase()}</b><br>
<b>PRECIO:</b><br>
${formatPrecio(precioLista)} - LISTA<br>
${formatPrecio(precio10)} - 10% off<br>
${formatPrecio(precio20)} - 20% off<br>
${formatPrecio(precio30)} - 30% off
`

  // Generar lista de modelos disponibles (sin cantidad de stock)
  const htmlModelos = disponibles
    .map(
      (row) =>
        `• <b>${row.modelo || 'Modelo sin nombre'}</b>`
    )
    .join('<br>')

  return `📦 <b>Stock disponible de "${item}":</b><br>${htmlModelosConStock}${htmlPrecios}<br><br><b>Modelos disponibles:</b><br>${htmlModelos}`
}

