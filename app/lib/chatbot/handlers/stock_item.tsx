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

  const itemNombre = disponibles[0]?.item_nombre || item

  // Generar lista de modelos con stock
  const htmlModelosConStock = disponibles
    .map(
      (row) =>
        `• <b>${row.modelo || 'Modelo sin nombre'}</b> – ${row.stock_real} unidades`
    )
    .join('<br>')

  // Agrupar artículos por precio
  const gruposPorPrecio = new Map<number, typeof disponibles>()
  disponibles.forEach((row) => {
    if (!gruposPorPrecio.has(row.precio_venta)) {
      gruposPorPrecio.set(row.precio_venta, [])
    }
    gruposPorPrecio.get(row.precio_venta)!.push(row)
  })

  // Ordenar grupos por precio descendente
  const gruposOrdenados = Array.from(gruposPorPrecio.entries()).sort((a, b) => b[0] - a[0])

  // Generar información de precios con descuentos
  const formatPrecio = (precio: number) => 
    `$ ${precio.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Crear secciones de precio para cada grupo
  const seccionesPrecios = gruposOrdenados.map(([precioVentaDolares, articulos], index) => {
    const precioLista = precioVentaDolares * dolar
    const precio10 = precioLista * 0.9
    const precio20 = precioLista * 0.8
    const precio30 = precioLista * 0.7

    const modelosDelGrupo = articulos
      .map(row => `   • <b>${row.modelo || 'Modelo sin nombre'}</b>`)
      .join('<br>')

    return `<b>💰 PRECIO ${index + 1}:</b> ${formatPrecio(precioLista)} - LISTA<br>   └ ${formatPrecio(precio10)} <i>(10% off)</i><br>   └ ${formatPrecio(precio20)} <i>(20% off)</i><br>   └ ${formatPrecio(precio30)} <i>(30% off)</i><br>📱 <b>Modelos:</b><br>${modelosDelGrupo}`
  }).join('<br><br>')

  const separador = `<br>━━━━━━━━━━━━━━━━━━━━━━━━━━<br>`

  return `📦 <b>Stock disponible de "${item}":</b><br>${htmlModelosConStock}${separador}<br>🎯 <b>${itemNombre.toUpperCase()}</b><br><br>${seccionesPrecios}`
}

